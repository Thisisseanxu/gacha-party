import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gzipSync } from 'node:zlib'
import { PreconditionFailedError } from '@edgeone/pages-blob'
import {
  createRankingEngine,
  pythonRoundTwo,
} from '../cloud-functions/_shared/luck-ranking-engine.js'
import {
  decodeRecord,
  decodeCheckpoint,
  encodeCheckpoint,
} from '../cloud-functions/_shared/luck-ranking-codec.js'
import {
  runRankingJob,
  automaticTick,
  previewRanking,
} from '../cloud-functions/_shared/luck-ranking-job.js'
import {
  publishRanking,
  readRanking,
  versionPrefix,
  seedRanking,
  cleanupRanking,
} from '../cloud-functions/_shared/luck-ranking-storage.js'
import { createRankingSource } from '../cloud-functions/_shared/luck-ranking-source.js'
import { signSourceRequest, verifySourceRequest } from '../lib/luck-ranking/source-auth.js'
import { onRequest as sourceHandler } from '../edge-functions/api/internal/luck-ranking-source.js'
import { onRequestGet as indexHandler } from '../cloud-functions/api/luck-ranking-index.js'
import { onRequestGet as poolHandler } from '../cloud-functions/data/luck-ranking-pools/[file].js'
import { withRankingLock } from '../cloud-functions/_shared/luck-ranking-lock.js'
import { createRankingUpdateHandler } from '../cloud-functions/_shared/luck-ranking-handler.js'
import { signAdminToken } from '../edge-functions/_shared/admin-login.js'
import { onRequestPost as manualHandler } from '../cloud-functions/api/internal/luck-ranking-run.js'
import { onRequestPost as automaticHandler } from '../cloud-functions/api/internal/luck-ranking-update.js'

const cards = [
  { id: '1814', name: 'SP A', rarity: 'SP' },
  { id: '1815', name: 'SP B', rarity: 'SP' },
  { id: '1900', name: 'SSR A', rarity: 'SSR' },
]
const raw = { names: { 1: 'A', 2: 'B', 9: 'Normal', 10000: 'Advanced' }, limited: ['1', '2'] }
const full = {
  pools: [
    ['a', { name: 'A', cardNames: { SP: ['SP A', 'SP B'] } }],
    ['b', { name: 'B', cardNames: { SP: ['SP A'] } }],
    ['9', { name: 'Normal', cardNames: { SSR: ['SSR A'] } }],
    ['10000', { name: 'Advanced', cardNames: { SP: ['SP A'] } }],
  ],
}
const config = [raw, full, cards]
const configVersion = 'a'.repeat(24)
const generatedAt = '2026-10-07T07:00:00.000Z'

function records(cost, drops, target = '1814', start = 0, tail = 0) {
  return Array.from({ length: cost * drops + tail }, (_, offset) => ({
    id: start + offset + 1,
    created_at: 1700000000 + start + offset,
    item_id: (offset + 1) % cost === 0 && offset < cost * drops ? `15${target}` : '151000',
  }))
}

function compressed(document) {
  return gzipSync(JSON.stringify(document)).toString('base64')
}
function calculate(document) {
  const engine = createRankingEngine(...config)
  engine.consume(document)
  return engine.finish(generatedAt)
}

class MemoryStore {
  values = new Map()
  writes = []
  fail = null
  async set(key, value, options = {}) {
    if (options.onlyIfNew && this.values.has(key)) throw new PreconditionFailedError()
    if (this.fail?.(key)) throw new Error('Simulated storage failure')
    this.values.set(key, typeof value === 'string' ? value : Uint8Array.from(value))
    this.writes.push(key)
  }
  async setJSON(key, value, options) {
    await this.set(key, JSON.stringify(value), options)
  }
  async get(key, options = {}) {
    const value = this.values.get(key)
    if (value == null) return null
    if (options.type === 'json') return JSON.parse(value)
    if (options.type === 'arrayBuffer') return Uint8Array.from(value).buffer
    return value
  }
  async delete(key) {
    this.values.delete(key)
  }
  async list({ prefix = '', directories = false, limit = Infinity }) {
    const keys = [...this.values.keys()].filter((key) => key.startsWith(prefix)).sort()
    return {
      blobs: keys.slice(0, limit).map((key) => ({ key })),
      directories: directories
        ? [
            ...new Set(
              keys
                .map((key) => {
                  const suffix = key.slice(prefix.length)
                  return suffix.includes('/') ? `${prefix}${suffix.split('/')[0]}/` : null
                })
                .filter(Boolean),
            ),
          ]
        : [],
    }
  }
}

test('matches Python binary-float rounding, including half-even and inexact halves', () => {
  for (const [input, expected] of [
    [2.675, 2.67],
    [0.125, 0.12],
    [0.375, 0.38],
    [1.005, 1],
    [15.995, 15.99],
    [0, 0],
  ]) {
    assert.equal(pythonRoundTwo(input), expected)
  }
})

test('pity carries across pools; drop counts include zero positions', () => {
  const result = calculate({
    1234567: { 1: records(99, 0, '1814', 0, 15), 2: records(5, 5, '1814', 15) },
  })
  assert.deepEqual(result.details.b.lucky, [['12***67', 25, 8, [5]]])
  assert.equal(result.index.total.sampleSize, 1)
  assert.ok(!result.details.a)
})

test('pool luck thresholds are strict and at least five SP are needed', () => {
  const result = calculate({
    1234561: { 1: records(35, 5) },
    1234562: { 1: records(36, 5) },
    1234563: { 1: records(37, 5) },
    1234564: { 1: records(38, 5) },
    1234565: { 1: records(10, 4) },
  })
  assert.deepEqual(result.details.a.lucky, [['12***61', 175, 35, [5, 0]]])
  assert.deepEqual(result.details.a.unlucky, [['12***64', 190, 38, [5, 0]]])
  assert.equal(result.details.a.sampleSize, 5)
})

test('total excludes exactly 1500 pulls, SSR pools, and advanced pools', () => {
  const result = calculate({
    1234561: { 1: records(300, 5), 9: records(10, 30, '1900') },
    1234562: { 1: records(300, 5, '1814', 0, 1), 10000: records(10, 5) },
  })
  assert.equal(result.index.total.sampleSize, 2)
  assert.deepEqual(result.index.total.lucky, [['12***62', 1501, 300]])
  assert.deepEqual(result.details['9'].lucky[0], ['12***61', 300, 10])
})

test('SSR needs 300 pulls, 15 drops, and strictly more than 13 for unlucky', () => {
  const result = calculate({
    1234560: { 1: records(10, 1) },
    1234561: { 9: records(13, 30, '1900') },
    1234562: { 9: records(20, 15, '1900') },
    1234563: { 9: records(10, 14, '1900', 0, 160) },
    1234564: { 9: records(10, 15, '1900') },
  })
  assert.equal(result.details['9'].targetRarity, 'SSR')
  assert.equal(result.details['9'].lucky.length, 2)
  assert.deepEqual(result.details['9'].unlucky, [['12***62', 300, 20]])
  assert.ok(!('spCards' in result.details['9']))
})

test('advanced anomalous cycles and a 60-pull unfinished tail are excluded', () => {
  const advanced = [
    ...records(61, 1),
    ...records(10, 5, '1814', 61),
    ...records(100, 0, '1814', 111, 60),
  ]
  const result = calculate({ 1234567: { 1: records(10, 1), 10000: advanced } })
  assert.deepEqual(result.details['10000'].lucky, [['12***67', 50, 10, [5]]])
})

test('JSON source order and an exported checkpoint retain deterministic ties', () => {
  const text = `{"2234567":{"2":${JSON.stringify(records(5, 5))},"1":${JSON.stringify(records(10, 5, '1814', 25))}},"1234567":{"1":[]}}`
  const parsed = decodeRecord(gzipSync(text).toString('base64'))
  assert.deepEqual(parsed.order.players, ['2234567', '1234567'])
  assert.deepEqual(parsed.order.pools.get('2234567'), ['2', '1'])
  const engine = createRankingEngine(...config)
  engine.consume(parsed.document, parsed.order)
  const restored = createRankingEngine(
    ...config,
    decodeCheckpoint(encodeCheckpoint(engine.exportState())),
  )
  assert.deepEqual(restored.finish(generatedAt), engine.finish(generatedAt))
})

test('invalid gzip, malformed JSON and excessive inflation fail before publication', () => {
  assert.throws(() => decodeRecord('broken'))
  assert.throws(() => decodeRecord(gzipSync('{').toString('base64')))
  assert.throws(() => decodeRecord(gzipSync('x'.repeat(33 * 1024 * 1024)).toString('base64')))
  assert.throws(() => calculate({ version: 2, invalid: { 1: records(10, 5) } }), /No eligible/)
})

test('HMAC source access binds body/path/time and rejects tampering and expiry', async () => {
  const url = 'https://example.com/api/internal/luck-ranking-source'
  const body = JSON.stringify({ operation: 'list' })
  const secret = 's'.repeat(32)
  const time = 1791330300000
  const headers = await signSourceRequest(url, body, secret, time)
  const request = new Request(url, { method: 'POST', body, headers })
  assert.equal(await verifySourceRequest(request, body, secret, time), true)
  assert.equal(await verifySourceRequest(request, body + ' ', secret, time), false)
  assert.equal(await verifySourceRequest(request, body, secret, time + 60001), false)
  assert.equal(
    await verifySourceRequest(new Request(`${url}/other`, { headers }), body, secret, time),
    false,
  )
})

test('source endpoint only exposes record keys to authenticated calls', async () => {
  const url = 'https://example.com/api/internal/luck-ranking-source'
  const body = JSON.stringify({ operation: 'list' })
  const secret = 's'.repeat(32)
  const env = {
    LUCK_RANKING_SOURCE_SECRET: secret,
    gacha_data: {
      async list() {
        return {
          keys: [{ key: 'record_1234567' }, { key: 'record_meta_1234567' }, { key: 'other' }],
          complete: true,
        }
      },
    },
  }
  assert.equal(
    (await sourceHandler({ request: new Request(url, { method: 'POST', body }), env })).status,
    401,
  )
  const headers = await signSourceRequest(url, body, secret)
  const response = await sourceHandler({
    request: new Request(url, { method: 'POST', body, headers }),
    env,
  })
  assert.deepEqual((await response.json()).keys, ['record_1234567'])
  const invalid = JSON.stringify({ operation: 'read', keys: ['record_meta_1234567'] })
  assert.equal(
    (
      await sourceHandler({
        request: new Request(url, {
          method: 'POST',
          body: invalid,
          headers: await signSourceRequest(url, invalid, secret),
        }),
        env,
      })
    ).status,
    400,
  )
})

test('HTTP source integration paginates, splits oversized batches, and preserves key order', async () => {
  const secret = 's'.repeat(32)
  const url = 'http://localhost/api/internal/luck-ranking-source'
  const values = new Map([
    ['record_1234567', compressed({ 1234567: { 1: records(10, 5) } })],
    ['record_2234567', compressed({ 2234567: { 1: records(10, 5) } })],
  ])
  let reads = 0
  const source = createRankingSource(
    { LUCK_RANKING_SOURCE_URL: url, LUCK_RANKING_SOURCE_SECRET: secret },
    Date.now() + 20_000,
    async (target, options) => {
      const input = JSON.parse(options.body)
      if (input.operation === 'read' && input.keys.length > 1)
        return new Response(null, { status: 413 })
      return sourceHandler({
        request: new Request(target, options),
        env: {
          LUCK_RANKING_SOURCE_SECRET: secret,
          gacha_data: {
            async list({ cursor }) {
              return cursor
                ? { keys: ['record_2234567'], complete: true }
                : { keys: ['record_1234567', 'record_meta_1234567'], cursor: 'next' }
            },
            async get(key) {
              reads++
              return values.get(key)
            },
          },
        },
      })
    },
  )
  const keys = await source.list()
  assert.deepEqual(keys, [...values.keys()])
  assert.deepEqual(await source.read(keys), [...values])
  assert.equal(reads, 2)
})

test('publication is atomic at the pointer; pinned old versions remain readable', async () => {
  const store = new MemoryStore()
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  await publishRanking(store, old)
  assert.equal(store.writes.at(-1), 'current.json')
  const next = calculate({ 1234567: { 1: records(20, 5) } })
  next.index.generatedAt = '2026-10-08T07:00:00.000Z'
  store.fail = (key) =>
    key.startsWith(versionPrefix(next.index.generatedAt)) && key.includes('/pools/')
  await assert.rejects(publishRanking(store, next))
  assert.deepEqual((await readRanking(store)).body, old.index)
  store.fail = null
  await publishRanking(store, next)
  assert.deepEqual((await readRanking(store, 'a', old.index.generatedAt)).body, old.details.a)
  assert.deepEqual((await readRanking(store)).body, next.index)
  assert.equal((await readRanking(store, '../private')).status, 400)
  assert.equal((await readRanking(store, 'a', 'bad')).status, 400)
  assert.equal((await readRanking(store, 'a', '2026-10-09T07:00:00.000Z')).status, 404)
})

test('empty Blob uses the packaged seed and never substitutes a missing pinned version', async () => {
  const store = new MemoryStore()
  assert.deepEqual((await readRanking(store)).body, seedRanking.index)
  assert.equal(
    (await readRanking(store, seedRanking.index.pools[0][0], seedRanking.index.generatedAt)).source,
    'seed',
  )
  assert.equal((await readRanking(store, 'a', generatedAt)).status, 404)
})

test('daily job resumes after its budget, de-duplicates ticks and publishes exactly once', async () => {
  const store = new MemoryStore()
  let time = Date.parse('2026-10-07T19:15:00Z')
  const keys = Array.from({ length: 65 }, (_, i) => `record_${1234500 + i}`)
  let lists = 0
  let reads = 0
  const source = {
    async list() {
      lists++
      return keys
    },
    async read(batch) {
      reads += batch.length
      time += 6000
      return batch.map((key) => [key, compressed({ [key.slice(7)]: { 1: records(10, 5) } })])
    },
  }
  const options = {
    store,
    source,
    config,
    configVersion,
    day: '2026-10-08',
    deadline: time + 40_000,
    now: () => time,
  }
  const partial = await runRankingJob({ ...options, slot: '03-15' })
  assert.equal(partial.status, 'pending')
  assert.equal(partial.processed, 64)
  assert.equal(await store.get('current.json'), null)
  assert.equal((await runRankingJob({ ...options, slot: '03-15' })).status, 'duplicate')
  const complete = await runRankingJob({ ...options, slot: '03-20', deadline: time + 100_000 })
  assert.equal(complete.status, 'published')
  assert.equal(complete.players, 65)
  assert.equal(lists, 1)
  assert.equal(reads, 65)
  assert.equal((await runRankingJob({ ...options, slot: '03-25' })).status, 'already-complete')
  assert.equal(store.writes.filter((key) => key === 'current.json').length, 1)
})

test('failed batches resume the last committed checkpoint without losing the previous ranking', async () => {
  const store = new MemoryStore()
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  await publishRanking(store, old)
  const keys = Array.from({ length: 65 }, (_, i) => `record_${1234500 + i}`)
  let fail = true
  const source = {
    async list() {
      return keys
    },
    async read(batch) {
      if (fail && batch.includes(keys[64])) throw new Error('Network failure')
      return batch.map((key) => [key, compressed({ [key.slice(7)]: { 1: records(10, 5) } })])
    },
  }
  const options = {
    store,
    source,
    config,
    configVersion,
    day: '2026-10-08',
    deadline: Date.now() + 100_000,
  }
  await assert.rejects(runRankingJob({ ...options, slot: '03-15' }))
  assert.deepEqual((await readRanking(store)).body, old.index)
  fail = false
  assert.equal((await runRankingJob({ ...options, slot: '03-20' })).players, 65)
})

test('a crash after pointer publication is recovered without re-publishing yesterday data', async () => {
  const store = new MemoryStore()
  const key = `jobs/2026-10-07/${configVersion}/checkpoint.gz`
  await store.setJSON('active-job.json', { key, configVersion })
  await publishRanking(store, calculate({ 1234567: { 1: records(10, 5) } }), key)
  const result = await runRankingJob({
    store,
    source: {
      async list() {
        throw new Error('Must not scan again')
      },
    },
    config,
    configVersion,
    day: '2026-10-08',
    slot: '03-15',
    deadline: Date.now() + 100_000,
  })
  assert.equal(result.status, 'already-complete')
  assert.equal(await store.get('active-job.json'), null)
})

test('cleanup bounds deletion and keeps the active published version even when old', async () => {
  const store = new MemoryStore()
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  old.index.generatedAt = '2026-08-01T07:00:00.000Z'
  await publishRanking(store, old)
  await store.set('jobs/2026-08-01/expired', '1')
  await store.set('versions/2026-08-02/unused/index.json', '{}')
  await cleanupRanking(store, Date.parse(generatedAt))
  assert.equal(await store.get('jobs/2026-08-01/expired'), null)
  assert.equal(await store.get('versions/2026-08-02/unused/index.json'), null)
  assert.deepEqual((await readRanking(store)).body, old.index)
})

test('preview performs no Blob writes and produces the same masked output', async () => {
  const document = { 1234567: { 1: records(10, 5) } }
  const source = {
    async list() {
      return ['record_1234567']
    },
    async read() {
      return [['record_1234567', compressed(document)]]
    },
  }
  const result = await previewRanking({
    source,
    config,
    deadline: Date.parse(generatedAt) + 100_000,
    now: () => Date.parse(generatedAt),
  })
  assert.deepEqual(result.ranking, calculate(document))
})

test('automatic ticks accept early, late and daytime requests, using the Shanghai calendar day', () => {
  for (const instant of [
    '2026-10-10T19:14:01Z',
    '2026-10-10T19:19:00Z',
    '2026-10-10T19:24:01Z',
    '2026-10-11T12:00:00Z',
  ]) {
    assert.equal(automaticTick(Date.parse(instant)).day, '2026-10-11')
  }
  assert.equal(automaticTick(Date.parse('2026-10-11T15:59:59Z')).day, '2026-10-11')
  assert.equal(automaticTick(Date.parse('2026-10-11T16:00:00Z')).day, '2026-10-12')
  assert.equal(
    automaticTick(Date.parse('2026-10-10T19:14:01Z')).slot,
    automaticTick(Date.parse('2026-10-10T19:14:59Z')).slot,
  )
})

function rankingSource(cost = 10) {
  return {
    async list() {
      return ['record_1234567']
    },
    async read() {
      return [['record_1234567', compressed({ 1234567: { 1: records(cost, 5) } })]]
    },
  }
}

test('deployed update handler publishes at all three previously rejected early trigger times', async () => {
  for (const instant of ['2026-10-10T19:14:01Z', '2026-10-10T19:19:00Z', '2026-10-10T19:24:01Z']) {
    const store = new MemoryStore()
    const handle = createRankingUpdateHandler({
      now: () => Date.parse(instant),
      createSource: () => rankingSource(),
      getStore: () => store,
      config,
      version: configVersion,
    })
    const response = await handle({
      request: new Request('https://example.com/api/internal/luck-ranking-update', {
        method: 'POST',
      }),
      env: { LUCK_RANKING_ENABLED: 'true' },
    })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).status, 'published')
    assert.ok(await store.get('current.json'))
  }
})

test('manual route rejects missing/forged tokens and request parameters cannot enable automatic updates', async () => {
  const env = { ADMIN_SECRET: 'admin-test-secret-'.repeat(3) }
  const token = await signAdminToken({ ADMIN_SECRET: 'another-secret' }, '330000001')
  for (const headers of [{}, { Authorization: `Bearer ${token}` }]) {
    const response = await manualHandler({
      request: new Request('https://example.com/api/internal/luck-ranking-run', {
        method: 'POST',
        headers,
      }),
      env,
    })
    assert.equal(response.status, 401)
  }
  const response = await automaticHandler({
    request: new Request('https://example.com/api/internal/luck-ranking-update?manual=1&force=1', {
      method: 'POST',
    }),
    env,
  })
  assert.deepEqual(await response.json(), { status: 'disabled' })
})

test('authenticated manual handler publishes with automatic updates off and can refresh a completed day', async () => {
  const store = new MemoryStore()
  const env = { ADMIN_SECRET: 'admin-test-secret-'.repeat(3), LUCK_RANKING_ENABLED: 'false' }
  const token = await signAdminToken(env, '330000001')
  let time = Date.parse('2026-10-11T12:00:00Z')
  let cost = 10
  const handle = createRankingUpdateHandler({
    manual: true,
    now: () => time,
    createSource: () => rankingSource(cost),
    getStore: () => store,
    config,
    version: configVersion,
  })
  const context = {
    request: new Request('https://example.com/api/internal/luck-ranking-run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
    env,
  }
  assert.equal((await (await handle(context)).json()).status, 'published')
  const oldPointer = await store.get('current.json', { type: 'json' })
  time += 1000
  cost = 20
  assert.equal((await (await handle(context)).json()).status, 'published')
  const pointer = await store.get('current.json', { type: 'json' })
  assert.notEqual(pointer.checkpointKey, oldPointer.checkpointKey)
  assert.notEqual(pointer.generatedAt, oldPointer.generatedAt)
  assert.deepEqual((await readRanking(store, 'a')).body.lucky, [['12***67', 100, 20, [5, 0]]])
  assert.equal([...store.values.keys()].filter((key) => key.startsWith('locks/')).length, 0)
  assert.equal([...store.values.keys()].filter((key) => key.startsWith('ticks/')).length, 0)
})

test('manual publication resumes its own checkpoint on a repeated call', async () => {
  const store = new MemoryStore()
  let time = Date.parse('2026-10-11T12:00:00Z')
  const keys = Array.from({ length: 65 }, (_, i) => `record_${1234500 + i}`)
  let lists = 0
  let reads = 0
  const source = {
    async list() {
      lists++
      return keys
    },
    async read(batch) {
      time += 6000
      reads += batch.length
      return batch.map((key) => [key, compressed({ [key.slice(7)]: { 1: records(10, 5) } })])
    },
  }
  const options = {
    store,
    source,
    config,
    configVersion,
    manual: true,
    ...automaticTick(time),
    now: () => time,
  }
  assert.equal((await runRankingJob({ ...options, deadline: time + 40_000 })).status, 'pending')
  const active = await store.get('active-job.json', { type: 'json' })
  const result = await runRankingJob({ ...options, deadline: time + 100_000 })
  assert.equal(result.status, 'published')
  assert.equal(result.players, 65)
  assert.equal(lists, 1)
  assert.equal(reads, 65)
  assert.equal((await store.get('current.json', { type: 'json' })).checkpointKey, active.key)
})

test('automatic and manual jobs share a lock even across a minute boundary', async () => {
  const store = new MemoryStore()
  let time = Date.parse('2026-10-10T19:14:59Z')
  let entered
  let release
  const ready = new Promise((resolve) => {
    entered = resolve
  })
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const source = rankingSource()
  const first = runRankingJob({
    store,
    source: {
      ...source,
      async list() {
        entered()
        await gate
        return source.list()
      },
    },
    config,
    configVersion,
    ...automaticTick(time),
    now: () => time,
    deadline: time + 100_000,
  })
  await ready
  time += 2000
  let scanned = false
  const result = await runRankingJob({
    store,
    source: {
      async list() {
        scanned = true
        throw new Error('Must not scan')
      },
    },
    config,
    configVersion,
    ...automaticTick(time),
    manual: true,
    now: () => time,
    deadline: time + 100_000,
  })
  assert.equal(result.status, 'busy')
  assert.ok(result.retryAfterSeconds > 0)
  assert.equal(scanned, false)
  release()
  assert.equal((await first).status, 'published')
})

test('abandoned lock reservations stop blocking after their minutes pass, without deleting another owner', async () => {
  const store = new MemoryStore()
  const time = Date.parse('2026-10-11T12:00:00Z')
  const minute = Math.floor(time / 60_000)
  const keys = Array.from({ length: 3 }, (_, i) => `locks/2026-10-11/${minute + i}.json`)
  for (const key of keys) await store.setJSON(key, { expiresAt: time + 180_000 })
  assert.equal(
    (
      await withRankingLock(
        store,
        () => 'wrong',
        () => time + 120_000,
      )
    ).status,
    'busy',
  )
  assert.equal(
    await withRankingLock(
      store,
      () => 'released',
      () => time + 180_000,
    ),
    'released',
  )
  for (const key of keys) assert.ok(await store.get(key))
})

test('manual preview remains authenticated and performs no Blob writes', async () => {
  const store = new MemoryStore()
  const env = { ADMIN_SECRET: 'admin-test-secret-'.repeat(3) }
  const token = await signAdminToken(env, '330000001')
  const handle = createRankingUpdateHandler({
    manual: true,
    config,
    version: configVersion,
    createSource: () => rankingSource(),
    getStore: () => {
      throw new Error('Preview must not access Blob')
    },
  })
  const response = await handle({
    request: new Request('https://example.com/api/internal/luck-ranking-run?preview=1', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
    env,
  })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).status, 'preview')
  assert.equal(store.writes.length, 0)
})

test('busy manual handler returns Retry-After and releases only its partial reservations', async () => {
  const store = new MemoryStore()
  const time = Date.parse('2026-10-11T12:00:00Z')
  const minute = Math.floor(time / 60_000)
  const ownerKey = `locks/2026-10-11/${minute + 1}.json`
  await store.setJSON(ownerKey, { expiresAt: time + 180_000 })
  const env = { ADMIN_SECRET: 'admin-test-secret-'.repeat(3) }
  const token = await signAdminToken(env, '330000001')
  const handle = createRankingUpdateHandler({
    manual: true,
    config,
    version: configVersion,
    now: () => time,
    createSource: () => ({
      async list() {
        throw new Error('Busy job must not scan')
      },
    }),
    getStore: () => store,
  })
  const response = await handle({
    request: new Request('https://example.com/api/internal/luck-ranking-run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
    env,
  })
  assert.equal(response.status, 409)
  const body = await response.json()
  assert.equal(body.status, 'busy')
  assert.equal(response.headers.get('Retry-After'), String(body.retryAfterSeconds))
  assert.ok(await store.get(ownerKey))
  assert.equal(await store.get(`locks/2026-10-11/${minute}.json`), null)
})

test('manual handler preserves the old published version on Blob failure and resumes without rescanning', async () => {
  const store = new MemoryStore()
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  await publishRanking(store, old)
  const env = { ADMIN_SECRET: 'admin-test-secret-'.repeat(3) }
  const token = await signAdminToken(env, '330000001')
  let lists = 0
  let reads = 0
  const source = rankingSource(20)
  const handle = createRankingUpdateHandler({
    manual: true,
    config,
    version: configVersion,
    now: () => Date.parse('2026-10-11T12:00:00Z'),
    createSource: () => ({
      async list() {
        lists++
        return source.list()
      },
      async read(keys) {
        reads++
        return source.read(keys)
      },
    }),
    getStore: () => store,
  })
  const context = {
    request: new Request('https://example.com/api/internal/luck-ranking-run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
    env,
  }
  store.fail = (key) => key.startsWith('versions/2026-10-11/') && key.includes('/pools/')
  assert.equal((await handle(context)).status, 503)
  assert.deepEqual((await readRanking(store)).body, old.index)
  store.fail = null
  assert.equal((await (await handle(context)).json()).status, 'published')
  assert.equal(lists, 1)
  assert.equal(reads, 1)
  assert.deepEqual((await readRanking(store, 'a')).body.lucky, [['12***67', 100, 20, [5, 0]]])
})

test('dynamic data routes reject unrelated paths and serve the seed without Blob configuration', async () => {
  const response = await indexHandler({
    request: new Request('https://example.com/data/luck-ranking.json'),
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), seedRanking.index)
  assert.equal(
    (await indexHandler({ request: new Request('https://example.com/data/private.json') })).status,
    404,
  )
  const id = seedRanking.index.pools[0][0]
  const pool = await poolHandler({
    request: new Request(
      `https://example.com/data/luck-ranking-pools/${id}.json?v=${encodeURIComponent(seedRanking.index.generatedAt)}`,
    ),
  })
  assert.equal(pool.status, 200)
  assert.deepEqual(await pool.json(), seedRanking.details[id])
  assert.equal(
    (
      await poolHandler({
        request: new Request('https://example.com/data/luck-ranking-pools/invalid.txt'),
      })
    ).status,
    404,
  )
})

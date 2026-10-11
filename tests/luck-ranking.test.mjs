import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { gzipSync, gunzipSync } from 'node:zlib'
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
  readRankingBundle,
  migrateCurrentRanking,
  versionPrefix,
  seedRanking,
  cleanupRanking,
} from '../cloud-functions/_shared/luck-ranking-storage.js'
import { createRankingSource } from '../cloud-functions/_shared/luck-ranking-source.js'
import { signSourceRequest, verifySourceRequest } from '../lib/luck-ranking/source-auth.js'
import { onRequest as sourceHandler } from '../edge-functions/api/internal/luck-ranking-source.js'
import {
  onRequestGet as bundleHandler,
  createRankingBundleHandler,
} from '../cloud-functions/api/luck-ranking-bundle.js'
import {
  createLuckRankingClient,
  LUCK_RANKING_CACHE_KEY,
  LUCK_RANKING_REFRESH_MS,
} from '../src/utils/luckRankingClient.js'
import { encodeRankingBundle } from '../lib/luck-ranking/bundle.js'
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

test('ETag revalidation reads only the current pointer and returns no gzip body', async () => {
  const store = new MemoryStore()
  await publishRanking(store, calculate({ 1234567: { 1: records(10, 5) } }))
  const initial = await readRankingBundle(store)
  const reads = []
  const get = store.get.bind(store)
  store.get = async (key, options) => {
    reads.push(key)
    return get(key, options)
  }
  const handle = createRankingBundleHandler({ getStore: () => store })
  const response = await handle({
    request: new Request('https://example.com/api/luck-ranking-bundle', {
      headers: { 'If-None-Match': `"another-version", W/${initial.etag}` },
    }),
  })
  assert.equal(response.status, 304)
  assert.equal(response.headers.get('ETag'), initial.etag)
  assert.equal(response.headers.get('Content-Encoding'), null)
  assert.equal(await response.text(), '')
  assert.deepEqual(reads, ['current.json'])
  const next = calculate({ 1234567: { 1: records(20, 5) } })
  next.index.generatedAt = '2026-10-08T07:00:00.000Z'
  await publishRanking(store, next)
  const changed = await handle({
    request: new Request('https://example.com/api/luck-ranking-bundle', {
      headers: { 'If-None-Match': initial.etag },
    }),
  })
  assert.equal(changed.status, 200)
  assert.notEqual(changed.headers.get('ETag'), initial.etag)
  assert.deepEqual(JSON.parse(gunzipSync(await changed.arrayBuffer())).details, next.details)
})

test('old Blob snapshots remain downloadable and migrate even on a completed day', async () => {
  const store = new MemoryStore()
  const ranking = calculate({ 1234567: { 1: records(10, 5) } })
  const prefix = versionPrefix(generatedAt)
  const checkpointKey = `jobs/2026-10-07/${configVersion}/checkpoint.gz`
  await store.setJSON(`${prefix}index.json`, ranking.index)
  for (const [id, detail] of Object.entries(ranking.details))
    await store.setJSON(`${prefix}pools/${id}.json`, detail)
  await store.setJSON('current.json', { generatedAt, checkpointKey })
  await store.setJSON('jobs/2026-10-07/completed.json', { generatedAt })
  const legacy = await readRankingBundle(store)
  assert.equal(legacy.source, 'blob-legacy')
  assert.deepEqual(JSON.parse(gunzipSync(legacy.body)).details, ranking.details)
  store.fail = (key) => key.endsWith('/bundle.json.gz')
  await assert.rejects(migrateCurrentRanking(store))
  assert.deepEqual(await store.get('current.json', { type: 'json' }), {
    generatedAt,
    checkpointKey,
  })
  store.fail = null
  const result = await runRankingJob({
    store,
    config,
    configVersion,
    day: '2026-10-07',
    slot: 'migration',
    source: {
      async list() {
        throw new Error('Must not recompute completed day')
      },
    },
    deadline: Date.now() + 100_000,
  })
  assert.equal(result.status, 'already-complete')
  const pointer = await store.get('current.json', { type: 'json' })
  assert.equal(pointer.bundleSchemaVersion, 1)
  assert.equal(pointer.checkpointKey, checkpointKey)
  assert.equal(pointer.etag, legacy.etag)
  assert.equal((await readRankingBundle(store, legacy.etag)).status, 304)
})

test('the sole public route sends gzip seed data and does not expose old paths or private state', async () => {
  const handle = createRankingBundleHandler({
    getStore: () => {
      throw new Error('No local Blob identity')
    },
  })
  const response = await handle({
    request: new Request('https://example.com/api/luck-ranking-bundle'),
  })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Encoding'), 'gzip')
  const bundle = JSON.parse(gunzipSync(await response.arrayBuffer()))
  assert.deepEqual(Object.keys(bundle), ['dataType', 'schemaVersion', 'index', 'details'])
  assert.deepEqual(bundle.index, seedRanking.index)
  assert.deepEqual(bundle.details, seedRanking.details)
  for (const pathname of [
    '/data/luck-ranking.json',
    '/api/luck-ranking-index',
    '/data/luck-ranking-pools/a.json',
  ]) {
    assert.equal(
      (await bundleHandler({ request: new Request(`https://example.com${pathname}`) })).status,
      404,
    )
  }
  const broken = createRankingBundleHandler({
    getStore: () => ({
      async get() {
        throw new Error('Blob unavailable')
      },
    }),
  })
  const error = await broken({
    request: new Request('https://example.com/api/luck-ranking-bundle'),
  })
  assert.equal(error.status, 503)
  assert.equal(error.headers.get('Content-Encoding'), null)
})

test('HTTP Fetch transparently decompresses the bundle for response.json()', async () => {
  const { createServer } = await import('node:http')
  const handle = createRankingBundleHandler({ getStore: () => new MemoryStore() })
  const server = createServer(async (request, response) => {
    const result = await handle({ request: new Request(`http://localhost${request.url}`) })
    response.writeHead(result.status, Object.fromEntries(result.headers))
    response.end(Buffer.from(await result.arrayBuffer()))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/luck-ranking-bundle`,
    )
    assert.equal(response.headers.get('Content-Encoding'), 'gzip')
    const bundle = await response.json()
    assert.deepEqual(bundle.details, seedRanking.details)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

function browserStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

function publicBundle(ranking) {
  return JSON.parse(gunzipSync(encodeRankingBundle(ranking).body))
}

test('client downloads all pools once, shares an hourly cache and revalidates with 304', async () => {
  let time = Date.parse(generatedAt)
  const localStorage = browserStorage()
  let calls = 0
  const data = publicBundle(calculate({ 1234567: { 1: records(10, 5) } }))
  const etag = encodeRankingBundle(data).etag
  const fetcher = async (url, options) => {
    calls++
    assert.equal(url, '/api/luck-ranking-bundle')
    assert.equal(options.cache, 'no-cache')
    if (calls === 1) return Response.json(data, { headers: { ETag: etag } })
    assert.equal(options.headers['If-None-Match'], etag)
    return new Response(null, { status: 304, headers: { ETag: etag } })
  }
  const options = { fetcher, storage: () => localStorage, now: () => time }
  const client = createLuckRankingClient(options)
  const [a, b] = await Promise.all([client.load(), client.load()])
  assert.equal(a, b)
  assert.equal(a.normalized.details.size, data.index.pools.length)
  assert.equal(calls, 1)
  time += LUCK_RANKING_REFRESH_MS - 1
  const revisit = createLuckRankingClient(options)
  assert.deepEqual((await revisit.load()).data, data)
  assert.equal(calls, 1)
  time++
  const checked = await revisit.load()
  assert.equal(calls, 2)
  assert.equal(checked.checkedAt, time)
  assert.deepEqual(checked.data, data)
  time += 1
  await client.load()
  assert.equal(calls, 2)
})

test('client atomically replaces versions and retains a valid bundle on broken responses', async () => {
  let time = Date.parse(generatedAt)
  const localStorage = browserStorage()
  const old = publicBundle(calculate({ 1234567: { 1: records(10, 5) } }))
  const next = publicBundle(calculate({ 1234567: { 1: records(20, 5) } }))
  next.index.generatedAt = '2026-10-08T07:00:00.000Z'
  let reply = Response.json(old, { headers: { ETag: '"old"' } })
  const client = createLuckRankingClient({
    fetcher: async () => reply,
    storage: () => localStorage,
    now: () => time,
  })
  await client.load()
  time += LUCK_RANKING_REFRESH_MS
  reply = new Response(null, { status: 503 })
  await assert.rejects(client.load(), /503/)
  assert.deepEqual(client.getCached().data, old)
  const incomplete = structuredClone(next)
  delete incomplete.details.a
  reply = Response.json(incomplete)
  await assert.rejects(client.load(), /数量/)
  assert.deepEqual(JSON.parse(localStorage.getItem(LUCK_RANKING_CACHE_KEY)).data, old)
  reply = Response.json(next, { headers: { ETag: '"new"' } })
  const updated = await client.load()
  assert.equal(updated.normalized.index.generatedAt, next.index.generatedAt)
  assert.deepEqual(updated.normalized.details.get('a').lucky[0].averagePulls, 20)
  assert.equal(updated.etag, '"new"')
})

test('disabled local storage still caches the full bundle in memory', async () => {
  let calls = 0
  const client = createLuckRankingClient({
    fetcher: async () => {
      calls++
      return Response.json(publicBundle(seedRanking))
    },
    storage: () => {
      throw new Error('Storage disabled')
    },
  })
  await client.load()
  await client.load()
  assert.equal(calls, 1)
})

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

test('publication writes only the gzip bundle and pointer; failed writes preserve the old snapshot', async () => {
  const store = new MemoryStore()
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  await publishRanking(store, old)
  assert.equal(store.writes.at(-1), 'current.json')
  assert.equal(store.writes.length, 2)
  assert.ok(store.writes[0].endsWith('/bundle.json.gz'))
  const oldBundle = await readBundleJSON(store)
  assert.deepEqual(oldBundle.index, old.index)
  assert.deepEqual(oldBundle.details, old.details)
  const next = calculate({ 1234567: { 1: records(20, 5) } })
  next.index.generatedAt = '2026-10-08T07:00:00.000Z'
  for (const failedKey of [
    versionPrefix(next.index.generatedAt) + 'bundle.json.gz',
    'current.json',
  ]) {
    store.fail = (key) => key === failedKey
    await assert.rejects(publishRanking(store, next))
    assert.deepEqual((await readBundleJSON(store)).index, old.index)
  }
  store.fail = null
  await publishRanking(store, next)
  assert.deepEqual((await readBundleJSON(store)).index, next.index)
  assert.deepEqual((await readBundleJSON(store)).details, next.details)
})

async function readBundleJSON(store) {
  const result = await readRankingBundle(store)
  assert.equal(result.status, 200)
  return JSON.parse(gunzipSync(result.body))
}

test('empty Blob uses the precompressed seed, but missing published bundles fail', async () => {
  const store = new MemoryStore()
  const result = await readRankingBundle(store)
  assert.equal(result.source, 'seed')
  const bundle = JSON.parse(gunzipSync(result.body))
  assert.deepEqual(bundle.index, seedRanking.index)
  assert.deepEqual(bundle.details, seedRanking.details)
  await publishRanking(store, calculate({ 1234567: { 1: records(10, 5) } }))
  await store.delete(versionPrefix(generatedAt) + 'bundle.json.gz')
  await assert.rejects(readRankingBundle(store), /missing/)
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
    day: '2026-10-10',
    deadline: Date.now() + 100_000,
  }
  await assert.rejects(runRankingJob({ ...options, slot: '03-15' }))
  assert.deepEqual((await readBundleJSON(store)).index, old.index)
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
  assert.deepEqual((await readBundleJSON(store)).index, old.index)
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
  assert.deepEqual((await readBundleJSON(store)).details.a.lucky, [['12***67', 100, 20, [5, 0]]])
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
  store.fail = (key) => key.startsWith('versions/2026-10-11/') && key.endsWith('/bundle.json.gz')
  assert.equal((await handle(context)).status, 503)
  assert.deepEqual((await readBundleJSON(store)).index, old.index)
  store.fail = null
  assert.equal((await (await handle(context)).json()).status, 'published')
  assert.equal(lists, 1)
  assert.equal(reads, 1)
  assert.deepEqual((await readBundleJSON(store)).details.a.lucky, [['12***67', 100, 20, [5, 0]]])
})

test('automatic refresh skips two Shanghai dates, then publishes on the third date', async () => {
  const store = new MemoryStore()
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  old.index.generatedAt = '2026-10-11T12:00:00.000Z'
  await publishRanking(store, old)
  let lists = 0
  const source = rankingSource(20)
  const options = {
    store,
    config,
    configVersion,
    source: {
      ...source,
      async list() {
        lists++
        return source.list()
      },
    },
  }
  for (const day of ['2026-10-12', '2026-10-13']) {
    const time = Date.parse(`${day}T03:14:01+08:00`)
    const result = await runRankingJob({
      ...options,
      ...automaticTick(time),
      now: () => time,
      deadline: time + 100_000,
    })
    assert.equal(result.status, 'not-due')
    assert.equal(result.nextUpdateDay, '2026-10-14')
    assert.equal(lists, 0)
  }
  const time = Date.parse('2026-10-14T03:14:01+08:00')
  const result = await runRankingJob({
    ...options,
    ...automaticTick(time),
    now: () => time,
    deadline: time + 100_000,
  })
  assert.equal(result.status, 'published')
  assert.equal(lists, 1)
  const next = time + 86400_000
  const skipped = await runRankingJob({
    ...options,
    ...automaticTick(next),
    now: () => next,
    deadline: next + 100_000,
  })
  assert.equal(skipped.status, 'not-due')
  assert.equal(skipped.nextUpdateDay, '2026-10-17')
  assert.equal(lists, 1)
})

test('three-day refresh uses Shanghai dates across month, year and leap-day boundaries', async () => {
  for (const [publishedAt, skipDay, dueDay] of [
    ['2026-10-30T19:14:01.000Z', '2026-11-02', '2026-11-03'],
    ['2026-12-30T19:14:01.000Z', '2027-01-02', '2027-01-03'],
    ['2028-02-27T19:14:01.000Z', '2028-03-01', '2028-03-02'],
  ]) {
    const store = new MemoryStore()
    const old = calculate({ 1234567: { 1: records(10, 5) } })
    old.index.generatedAt = publishedAt
    await publishRanking(store, old)
    const options = { store, config, configVersion, source: rankingSource() }
    const time = Date.parse(`${skipDay}T03:14:01+08:00`)
    const result = await runRankingJob({
      ...options,
      ...automaticTick(time),
      now: () => time,
      deadline: time + 100_000,
    })
    assert.equal(result.status, 'not-due')
    assert.equal(result.nextUpdateDay, dueDay)
    const due = Date.parse(`${dueDay}T03:14:01+08:00`)
    assert.equal(
      (
        await runRankingJob({
          ...options,
          ...automaticTick(due),
          now: () => due,
          deadline: due + 100_000,
        })
      ).status,
      'published',
    )
  }
})

test('automatic refresh resumes a recent manual checkpoint even with a same-day completion marker', async () => {
  const store = new MemoryStore()
  let time = Date.parse('2026-10-11T12:00:00Z')
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  old.index.generatedAt = new Date(time).toISOString()
  await publishRanking(store, old)
  await store.setJSON('jobs/2026-10-11/completed.json', { generatedAt: old.index.generatedAt })
  const keys = Array.from({ length: 65 }, (_, index) => `record_${1234500 + index}`)
  let lists = 0
  const source = {
    async list() {
      lists++
      return keys
    },
    async read(batch) {
      time += 6000
      return batch.map((key) => [key, compressed({ [key.slice(7)]: { 1: records(20, 5) } })])
    },
  }
  const options = { store, source, config, configVersion, now: () => time }
  const pending = await runRankingJob({
    ...options,
    ...automaticTick(time),
    manual: true,
    deadline: time + 40_000,
  })
  assert.equal(pending.status, 'pending')
  const resumed = await runRankingJob({
    ...options,
    ...automaticTick(time),
    deadline: time + 100_000,
  })
  assert.equal(resumed.status, 'published')
  assert.equal(resumed.players, 65)
  assert.equal(lists, 1)
  assert.equal(await store.get('active-job.json'), null)
})

test('manual publication can refresh before three days and restarts the automatic interval', async () => {
  const store = new MemoryStore()
  const old = calculate({ 1234567: { 1: records(10, 5) } })
  old.index.generatedAt = '2026-10-11T12:00:00.000Z'
  await publishRanking(store, old)
  const time = Date.parse('2026-10-12T12:00:00Z')
  const options = {
    store,
    source: rankingSource(20),
    config,
    configVersion,
    now: () => time,
    deadline: time + 100_000,
  }
  const result = await runRankingJob({ ...options, ...automaticTick(time), manual: true })
  assert.equal(result.status, 'published')
  const check = Date.parse('2026-10-14T03:14:01+08:00')
  const skipped = await runRankingJob({
    ...options,
    ...automaticTick(check),
    now: () => check,
    deadline: check + 100_000,
  })
  assert.equal(skipped.status, 'not-due')
  assert.equal(skipped.nextUpdateDay, '2026-10-15')
})

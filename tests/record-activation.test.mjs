import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Buffer } from 'node:buffer'
import { generateKeyPairSync } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { createActivationRateLimiter, createRecordActivationHandler } from '../cloud-functions/api/record-activate.js'
import { verifyLicenseForEdgeOne } from '../edge-functions/_shared/gacha-records.js'
import { onRequestGet } from '../edge-functions/get-record.js'
import { onRequestPost } from '../edge-functions/upload-record.js'
import { onRequest as hzRequest } from '../edge-functions/api/hz/[[path]].js'
import { generateActivationKey } from '../cloud-functions/_shared/activation.js'

const pair = generateKeyPairSync('ed25519')
const env = {
  PRIVATE_KEY: pair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
  PUBLIC_KEY: pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
}
const playerId = '1030864'
const token = 'Aoki_v2 fixture.secret.token'
const pack = data => 'MHPD1.' + gzipSync(JSON.stringify(data)).toString('base64url')
const recordId = pack([playerId, token])
const request = (id = recordId) => new Request('https://example.test/api/record-activate', {
  method: 'POST', body: JSON.stringify({ record_id: id }),
})
const accepted = (records = [{ player_id: playerId }]) => Response.json({ code: 0, data: { records } })

test('checks official record UIDs and issues a compatible signed license for exactly ten days', async () => {
  let calls = 0
  const handler = createRecordActivationHandler({ fetchImpl: async (url, options) => {
    calls++
    const parsed = new URL(url)
    assert.equal(parsed.origin, 'https://matrix-api.aojiaostudio.com')
    assert.equal(parsed.pathname, '/gacha/records')
    assert.equal(parsed.searchParams.get('player_id'), playerId)
    assert.equal(parsed.searchParams.get('gacha_id'), '9')
    assert.equal(parsed.searchParams.get('page'), '1')
    assert.equal(parsed.searchParams.get('page_size'), '10')
    assert.equal(options.headers['X-Token'], token)
    assert.equal(url.includes(token), false)
    assert.equal(options.redirect, 'error')
    return accepted([{ player_id: playerId }, { player_id: Number(playerId) }])
  } })
  const before = Math.floor(Date.now() / 1000)
  const response = await handler({ request: request(), env })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  const body = await response.json()
  assert.equal(body.player_id, playerId)
  assert.equal(verifyLicenseForEdgeOne(body.activation_key, env.PUBLIC_KEY).userId, Number(playerId))
  assert.equal(Buffer.from(body.activation_key, 'base64url').length, 76)
  assert.ok(body.expires_at >= before + 864000 && body.expires_at <= Math.floor(Date.now() / 1000) + 864000)
  assert.equal(JSON.stringify(body).includes(token), false)
  assert.equal(JSON.stringify(body).includes(recordId), false)
  assert.equal(calls, 1)
})

test('rejects missing, mixed, mismatched or malformed record identities even with business success', async () => {
  for (const records of [[{}], [{ uid: playerId }], [{ player_id: null }], [{ player_id: {} }],
    [{ player_id: '1030865' }], [{ player_id: playerId }, { player_id: '1030865' }]]) {
    const handler = createRecordActivationHandler({ fetchImpl: async () => accepted(records) })
    const response = await handler({ request: request(), env })
    assert.equal(response.status, 403)
    const body = await response.json()
    assert.equal(body.code, 'PLAYER_MISMATCH')
    assert.equal('activation_key' in body, false)
  }
})

test('tries advanced permanent pool only when ordinary permanent pool is empty; fails closed if both are empty', async () => {
  const pools = []
  const handler = createRecordActivationHandler({ fetchImpl: async url => {
    const pool = new URL(url).searchParams.get('gacha_id')
    pools.push(pool)
    return accepted(pool === '9' ? [] : [{ player_id: playerId }])
  } })
  assert.equal((await handler({ request: request(), env })).status, 200)
  assert.deepEqual(pools, ['9', '10000'])
  const empty = createRecordActivationHandler({ fetchImpl: async () => accepted([]) })
  const response = await empty({ request: request(), env })
  assert.equal(response.status, 422)
  assert.equal((await response.json()).code, 'NO_VERIFIABLE_RECORDS')
})

test('rejects invalid tokens and distinguishes upstream failures without leaking credentials', async () => {
  for (const [reply, expected] of [
    [() => new Response('', { status: 401 }), 401],
    [() => new Response('', { status: 403 }), 401],
    [() => Response.json({ code: 7, msg: token }), 401],
    [() => new Response('maintenance', { status: 503 }), 502],
    [() => new Response('invalid-json'), 502],
    [() => Response.json({ code: 0, data: {} }), 502],
    [() => new Response('x'.repeat(65537)), 502],
    [() => { throw new Error(token) }, 502],
  ]) {
    const handler = createRecordActivationHandler({ fetchImpl: async () => reply() })
    const response = await handler({ request: request(), env })
    assert.equal(response.status, expected)
    const text = await response.text()
    assert.equal(text.includes(token), false)
    assert.equal(text.includes('activation_key'), false)
  }
})

test('bounds request and decompression sizes, validates the legacy uint32 UID, and does not auto-issue admin licenses', async () => {
  let calls = 0
  const handler = createRecordActivationHandler({ fetchImpl: async () => { calls++; return accepted() } })
  for (const id of ['', 'MHPD1.invalid!', recordId.slice(0, -8), pack({ player_id: playerId }),
    pack([playerId, token, 'extra']), pack(['0', token]), pack(['4294967296', token]),
    pack([Number(playerId), token]), pack([playerId, 'old-token']), pack([playerId, token + '\r\nX: yes']),
    pack([playerId, 'Aoki_v2 ' + 'a'.repeat(100000)])]) {
    assert.equal((await handler({ request: request(id), env })).status, 400)
  }
  assert.equal((await handler({ request: request(pack(['330000001', token])), env })).status, 403)
  const huge = new Request('https://example.test/api/record-activate', { method: 'POST', body: 'x'.repeat(13000) })
  assert.equal((await handler({ request: huge, env })).status, 413)
  assert.equal(calls, 0)
})

test('reports missing or invalid signing configuration safely', async () => {
  const handler = createRecordActivationHandler({ fetchImpl: async () => accepted() })
  assert.equal((await handler({ request: request(), env: {} })).status, 503)
  const response = await handler({ request: request(), env: { PRIVATE_KEY: 'signing.secret.fixture' } })
  assert.equal(response.status, 500)
  assert.equal((await response.text()).includes('signing.secret.fixture'), false)
})

test('rate limits issuance before making more upstream requests and resets on the next minute', async () => {
  let now = 0
  let calls = 0
  const handler = createRecordActivationHandler({
    allowRequest: createActivationRateLimiter(() => now),
    fetchImpl: async () => { calls++; return accepted() },
  })
  for (let i = 0; i < 6; i++) assert.equal((await handler({ request: request(), env })).status, 200)
  const response = await handler({ request: request(), env })
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '60')
  assert.equal(calls, 6)
  now = 60000
  assert.equal((await handler({ request: request(), env })).status, 200)
})

test('new license reads old archives, overwrites uploads and submits badge guides using the existing endpoints', async () => {
  const handler = createRecordActivationHandler({ fetchImpl: async () => accepted() })
  const activation = await (await handler({ request: request(), env })).json()
  const values = new Map([['record_' + playerId, 'old-archive']])
  const kv = { get: async key => values.get(key) ?? null, put: async (key, value) => values.set(key, value) }
  const serverEnv = { ...env, gacha_data: kv, huizhang_data: kv }
  const headers = { 'X-Player-ID': playerId, 'X-License-Key': activation.activation_key }
  const read = await onRequestGet({ request: new Request('https://example.test/get-record', { headers }), env: serverEnv })
  assert.equal(read.headers.get('Cache-Control'), 'no-store')
  assert.equal(await read.text(), 'old-archive')
  const upload = await onRequestPost({ request: new Request('https://example.test/upload-record', {
    method: 'POST', headers, body: 'replacement-archive',
  }), env: serverEnv })
  assert.equal(upload.status, 200)
  assert.equal(values.get('record_' + playerId), 'replacement-archive')
  const submit = await hzRequest({ request: new Request('https://example.test/api/hz/submit', {
    method: 'POST', headers, body: JSON.stringify({ charId: '1101', code: 'fixture-code', title: 'test' }),
  }), env: serverEnv })
  assert.equal(submit.status, 201)
  const pending = [...values].find(([key]) => key.startsWith('hz_pending_') && !key.startsWith('hz_pending_meta_'))
  assert.equal(JSON.parse(pending[1]).user_id, playerId)
  assert.equal(JSON.stringify([...values]).includes(token), false)
})

test('mail-code issuance also uses the requested ten-day lifetime', async () => {
  const before = Math.floor(Date.now() / 1000)
  const key = await generateActivationKey(playerId, env.PRIVATE_KEY)
  const expiry = Number(Buffer.from(key, 'base64url').readBigUInt64LE(4))
  assert.ok(expiry >= before + 864000 && expiry <= Math.floor(Date.now() / 1000) + 864000)
})

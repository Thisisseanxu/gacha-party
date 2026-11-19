import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Buffer } from 'node:buffer'
import nacl from 'tweetnacl'
import { authenticateRecordRequest } from '../edge-functions/_shared/gacha-records.js'
import { onRequestGet } from '../edge-functions/get-record.js'
import { onRequestPost } from '../edge-functions/upload-record.js'

const keys = nacl.sign.keyPair()
const publicEnv = { PUBLIC_KEY: Buffer.from(keys.publicKey).toString('base64') }
function license(playerId = 1030864, expiry = Math.floor(Date.now() / 1000) + 3600) {
  const payload = Buffer.alloc(12)
  payload.writeUInt32LE(playerId)
  payload.writeBigUInt64LE(BigInt(expiry), 4)
  return Buffer.concat([payload, nacl.sign.detached(payload, keys.secretKey)]).toString('base64url')
}
function request(playerId = '1030864', key = license()) {
  return new Request('https://example.test/get-record', { headers: { 'X-Player-ID': playerId, 'X-License-Key': key } })
}

test('denies invalid, expired and mismatched credentials before touching KV', async () => {
  let reads = 0
  const env = { ...publicEnv, gacha_data: { get() { reads++; throw new Error('must not read') } } }
  assert.equal((await onRequestGet({ request: request('1030864', 'invalid'), env })).status, 403)
  assert.equal((await onRequestGet({ request: request('999999999999'), env })).status, 403)
  assert.equal((await onRequestGet({ request: request('1030864', license(1030864, 1)), env })).status, 403)
  assert.equal(reads, 0)
})

test('storage endpoints reject raw upload tokens without contacting the official API', async () => {
  globalThis.fetch = () => { throw new Error('edge must not contact official') }
  const raw = new Request('https://example.test/get-record', { headers: { 'X-Player-ID': '1030864', 'X-Upload-Token': 'Aoki_v2 test.token' } })
  assert.equal((await onRequestGet({ request: raw, env: publicEnv })).status, 401)
})

test('keeps existing archive and upload format, stores no token and keeps upload cooldown', async () => {
  globalThis.fetch = () => { throw new Error('edge must not contact official') }
  const values = new Map([['record_1030864', 'old-gzip-base64']])
  const env = { ...publicEnv, gacha_data: { get: async key => values.get(key) ?? null, put: async (key, value) => values.set(key, value) } }
  const read = await onRequestGet({ request: request(), env })
  assert.equal(read.status, 200); assert.equal(await read.text(), 'old-gzip-base64')
  const upload = () => new Request('https://example.test/upload-record', { method: 'POST', body: 'new-gzip-base64', headers: request().headers })
  assert.equal((await onRequestPost({ request: upload(), env })).status, 200)
  assert.equal(values.get('record_1030864'), 'new-gzip-base64')
  assert.equal(JSON.stringify([...values]).includes('Aoki_v2'), false)
  assert.equal((await onRequestPost({ request: upload(), env })).status, 429)
})

test('retains signed website credentials and prevents access to another player archive', async () => {
  const keys = nacl.sign.keyPair()
  const payload = Buffer.alloc(12); payload.writeUInt32LE(1030864); payload.writeBigUInt64LE(BigInt(Math.floor(Date.now() / 1000) + 3600), 4)
  const signed = Buffer.concat([payload, nacl.sign.detached(payload, keys.secretKey)]).toString('base64url')
  const env = { PUBLIC_KEY: Buffer.from(keys.publicKey).toString('base64') }
  globalThis.fetch = () => { throw new Error('legacy must not call official') }
  const legacy = id => new Request('https://example.test', { headers: { 'X-License-Key': signed, 'X-Player-ID': id } })
  assert.equal((await authenticateRecordRequest(legacy('1030864'), env)).userId, 1030864)
  await assert.rejects(authenticateRecordRequest(legacy('1030865'), env), { statusCode: 403 })
})

import { Buffer } from 'node:buffer'
import { gunzipSync, gzipSync } from 'node:zlib'

const MAX_RECORD_BYTES = 32 * 1024 * 1024
const MAX_CHECKPOINT_BYTES = 128 * 1024 * 1024

export function decodeRecord(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 1024 * 1024)
    throw new Error('Invalid compressed record')
  const source = new TextDecoder('utf-8', { fatal: true }).decode(
    gunzipSync(Buffer.from(value, 'base64'), { maxOutputLength: MAX_RECORD_BYTES }),
  )
  const document = JSON.parse(source)
  const order = { players: [], pools: new Map() }
  // Preserve JSON object insertion order across Python and JS numeric property enumeration.
  let depth = 0
  let player = null
  for (const token of source.matchAll(/"(?:[^"\\]|\\.)*"|[{}[\]]/g)) {
    const value = token[0]
    if (value === '{' || value === '[') depth++
    else if (value === '}' || value === ']') depth--
    else if (depth <= 2) {
      let next = token.index + value.length
      while (/\s/.test(source[next] || '') && next < source.length) next++
      if (source[next] !== ':') continue
      const key = JSON.parse(value)
      if (depth === 1) {
        player = key
        order.players.push(key)
        order.pools.set(key, [])
      } else if (depth === 2 && player != null) order.pools.get(player).push(key)
    }
  }
  return { document, order }
}

export function encodeCheckpoint(value) {
  const result = gzipSync(JSON.stringify(value), { level: 1 })
  if (result.byteLength > 24 * 1024 * 1024)
    throw new Error('Ranking checkpoint exceeds Blob object limit')
  return result
}

export function decodeCheckpoint(value) {
  return JSON.parse(
    gunzipSync(Buffer.from(value), { maxOutputLength: MAX_CHECKPOINT_BYTES }).toString('utf8'),
  )
}

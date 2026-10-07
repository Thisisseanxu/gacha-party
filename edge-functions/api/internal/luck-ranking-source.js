import { getGachaKv } from '../../_shared/gacha-kv-http.js'
import { verifySourceRequest } from '../../../lib/luck-ranking/source-auth.js'

const recordKey = /^record_\d{7}$/
const MAX_KEYS = 16
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ message: 'Method not allowed' }, 405)
  if (Number(request.headers.get('Content-Length')) > 8192) return json({}, 413)
  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > 8192) return json({}, 413)
  if (!(await verifySourceRequest(request, body, env?.LUCK_RANKING_SOURCE_SECRET))) {
    return json({ message: 'Unauthorized' }, 401)
  }
  try {
    const input = JSON.parse(body)
    const kv = getGachaKv(env)
    if (input.operation === 'list') {
      if (
        input.cursor != null &&
        (typeof input.cursor !== 'string' || input.cursor.length > 1024)
      ) {
        return json({}, 400)
      }
      const page = await kv.list({
        prefix: 'record_',
        limit: 256,
        ...(input.cursor ? { cursor: input.cursor } : {}),
      })
      return json({
        keys: (page.keys || [])
          .map((item) => (typeof item === 'string' ? item : item.key))
          .filter((key) => recordKey.test(key)),
        cursor: page.cursor || null,
        complete: Boolean(page.complete || !page.cursor),
      })
    }
    if (
      input.operation !== 'read' ||
      !Array.isArray(input.keys) ||
      !input.keys.length ||
      input.keys.length > MAX_KEYS ||
      input.keys.some((key) => typeof key !== 'string' || !recordKey.test(key)) ||
      new Set(input.keys).size !== input.keys.length
    )
      return json({}, 400)
    const entries = []
    for (let offset = 0; offset < input.keys.length; offset += 4) {
      entries.push(
        ...(await Promise.all(
          input.keys.slice(offset, offset + 4).map(async (key) => {
            const value = await kv.get(key)
            if (typeof value !== 'string' || !value) throw new Error('Missing record')
            return [key, value]
          }),
        )),
      )
    }
    const result = JSON.stringify({ entries })
    if (new TextEncoder().encode(result).byteLength > MAX_RESPONSE_BYTES) return json({}, 413)
    return new Response(result, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch {
    // Do not expose record keys, raw IDs, or KV errors through the service response.
    return json({ message: 'Record source unavailable' }, 503)
  }
}

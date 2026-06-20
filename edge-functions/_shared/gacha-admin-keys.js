import { requireAdmin } from './admin-token.js'
import { getGachaKv, jsonResponse } from './gacha-kv-http.js'

const DEFAULT_LIMIT = 256
const MAX_LIMIT = 256

function parseLimit(value) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

export async function getKeys({ request, env }) {
  try {
    const { response } = await requireAdmin(request, env)
    if (response) return response

    const url = new URL(request.url)
    const prefix = url.searchParams.get('prefix') || ''
    const cursor = url.searchParams.get('cursor') || ''
    const limit = parseLimit(url.searchParams.get('limit'))
    const options = { prefix, limit }
    if (cursor) options.cursor = cursor

    const result = await getGachaKv(env).list(options)
    const keys = (result?.keys || [])
      .map((item) => (typeof item === 'string' ? item : item?.key))
      .filter(Boolean)

    return jsonResponse(
      {
        keys,
        cursor: result?.cursor || null,
        complete: Boolean(result?.complete || !result?.cursor),
        count: keys.length,
        prefix,
      },
      200,
      { 'Cache-Control': 'no-store' },
    )
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

import { requireAdmin } from './admin-token.js'
import { corsHeaders, getGachaKv, jsonResponse } from './gacha-kv-http.js'

const KV_LIST_LIMIT = 256
const textEncoder = new TextEncoder()

function safeFilenameTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function ndjsonLine(value) {
  return textEncoder.encode(`${JSON.stringify(value)}\n`)
}

export async function exportKv({ request, env, waitUntil }) {
  try {
    const { response, admin } = await requireAdmin(request, env)
    if (response) return response

    const kv = getGachaKv(env)
    const url = new URL(request.url)
    const prefix = url.searchParams.get('prefix') || ''
    const exportedAt = new Date()

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const streamTask = (async () => {
      let cursor
      let exported = 0

      try {
        await writer.write(
          ndjsonLine({
            type: 'manifest',
            schema: 1,
            format: 'edgeone-kv-ndjson',
            namespace: 'gacha_data',
            prefix,
            exportedAt: exportedAt.toISOString(),
            exportedBy: String(admin.userId),
          }),
        )

        do {
          const options = { prefix, limit: KV_LIST_LIMIT }
          if (cursor) options.cursor = cursor

          const result = await kv.list(options)
          for (const item of result?.keys || []) {
            if (!item?.key) continue
            const value = await kv.get(item.key)
            await writer.write(
              ndjsonLine({
                type: 'entry',
                key: item.key,
                value,
              }),
            )
            exported += 1
          }

          cursor = result?.cursor
          if (result?.complete) break
        } while (cursor)

        await writer.write(
          ndjsonLine({
            type: 'complete',
            exported,
          }),
        )
      } catch (error) {
        await writer.write(
          ndjsonLine({
            type: 'error',
            message: error?.message || String(error),
            exported,
          }),
        )
      } finally {
        await writer.close()
      }
    })()
    if (typeof waitUntil === 'function') waitUntil(streamTask)

    return new Response(readable, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Content-Disposition': `attachment; filename="gacha-kv-export-${safeFilenameTimestamp(exportedAt)}.ndjson"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

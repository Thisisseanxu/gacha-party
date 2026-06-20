import {
  corsHeaders,
  getGachaKv,
  jsonResponse,
} from './gacha-kv-http.js'
import { requireAdmin } from './admin-token.js'

const textEncoder = new TextEncoder()
const MAX_BATCH_KEYS = 32
const KV_READ_CONCURRENCY = 8

function contentDisposition(key) {
  const fallback = String(key || 'kv-entry')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 160)
  return `attachment; filename="${fallback || 'kv-entry'}.txt"; filename*=UTF-8''${encodeURIComponent(`${key}.txt`)}`
}

async function sha256Etag(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  return `"${hash}"`
}

function ndjsonLine(value) {
  return textEncoder.encode(`${JSON.stringify(value)}\n`)
}

function normalizeBatchKeys(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((key) => String(key || '').trim()).filter(Boolean))]
}

function randomBatchId() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function parseRange(rangeHeader, totalBytes) {
  if (!rangeHeader) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
  if (!match) return { invalid: true }

  let start
  let end
  if (!match[1]) {
    const suffixLength = Number.parseInt(match[2], 10)
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return { invalid: true }
    start = Math.max(0, totalBytes - suffixLength)
    end = totalBytes - 1
  } else {
    start = Number.parseInt(match[1], 10)
    end = match[2] ? Number.parseInt(match[2], 10) : totalBytes - 1
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start >= totalBytes ||
    end < start
  ) {
    return { invalid: true }
  }

  return { start, end: Math.min(end, totalBytes - 1) }
}

export async function downloadBatch({ request, env, waitUntil }) {
  try {
    const { response, admin } = await requireAdmin(request, env)
    if (response) return response

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ message: '请求体格式错误' }, 400)
    }

    const keys = normalizeBatchKeys(body?.keys)
    if (!keys.length) return jsonResponse({ message: 'keys 必须是非空数组' }, 400)
    if (keys.length > MAX_BATCH_KEYS) {
      return jsonResponse({ message: `单批最多下载 ${MAX_BATCH_KEYS} 个键` }, 400)
    }
    if (keys.some((key) => textEncoder.encode(key).byteLength > 512)) {
      return jsonResponse({ message: '键长度不能超过 512 字节' }, 400)
    }

    const kv = getGachaKv(env)
    const batchId = String(body?.batchId || randomBatchId())
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const streamTask = (async () => {
      let downloaded = 0
      let missing = 0
      let failed = 0

      try {
        await writer.write(
          ndjsonLine({
            type: 'manifest',
            schema: 1,
            format: 'edgeone-kv-batch-ndjson',
            batchId,
            total: keys.length,
            exportedAt: new Date().toISOString(),
            exportedBy: String(admin.userId),
          }),
        )

        for (let offset = 0; offset < keys.length; offset += KV_READ_CONCURRENCY) {
          const chunk = keys.slice(offset, offset + KV_READ_CONCURRENCY)
          const results = await Promise.all(
            chunk.map(async (key) => {
              try {
                const value = await kv.get(key)
                if (value === null) return { type: 'missing', key }
                const bytes = textEncoder.encode(value)
                return {
                  type: 'entry',
                  key,
                  value,
                  bytes: bytes.byteLength,
                  etag: await sha256Etag(bytes),
                }
              } catch (error) {
                return {
                  type: 'error',
                  key,
                  message: error?.message || String(error),
                }
              }
            }),
          )

          for (const result of results) {
            if (result.type === 'entry') downloaded += 1
            else if (result.type === 'missing') missing += 1
            else failed += 1
            await writer.write(ndjsonLine(result))
          }
        }

        await writer.write(
          ndjsonLine({
            type: 'complete',
            batchId,
            downloaded,
            missing,
            failed,
          }),
        )
      } catch (error) {
        await writer.write(
          ndjsonLine({
            type: 'fatal',
            batchId,
            message: error?.message || String(error),
            downloaded,
            missing,
            failed,
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
        'Content-Disposition': `attachment; filename="gacha-kv-batch-${encodeURIComponent(batchId)}.ndjson"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-KV-Batch-Id': batchId,
        'X-KV-Batch-Size': String(keys.length),
      },
    })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

export async function downloadKey({ request, env }) {
  try {
    const { response } = await requireAdmin(request, env)
    if (response) return response

    const url = new URL(request.url)
    const key = url.searchParams.get('key')
    if (!key) return jsonResponse({ message: '缺少 key 参数' }, 400)

    const value = await getGachaKv(env).get(key)
    if (value === null) return jsonResponse({ message: `KV 键不存在：${key}` }, 404)

    const bytes = textEncoder.encode(value)
    const etag = await sha256Etag(bytes)
    const commonHeaders = {
      ...corsHeaders(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': contentDisposition(key),
      'Content-Type': 'application/octet-stream',
      ETag: etag,
      'X-KV-Key': encodeURIComponent(key),
    }

    const ifNoneMatch = request.headers.get('If-None-Match')
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers: commonHeaders })
    }

    const ifRange = request.headers.get('If-Range')
    const requestedRange =
      !ifRange || ifRange === etag ? parseRange(request.headers.get('Range'), bytes.byteLength) : null

    if (requestedRange?.invalid) {
      return new Response(null, {
        status: 416,
        headers: {
          ...commonHeaders,
          'Content-Range': `bytes */${bytes.byteLength}`,
        },
      })
    }

    if (requestedRange) {
      const { start, end } = requestedRange
      const body = bytes.slice(start, end + 1)
      return new Response(body, {
        status: 206,
        headers: {
          ...commonHeaders,
          'Content-Length': String(body.byteLength),
          'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`,
        },
      })
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        ...commonHeaders,
        'Content-Length': String(bytes.byteLength),
      },
    })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

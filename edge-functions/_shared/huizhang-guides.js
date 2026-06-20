import pako from 'pako'

export const HZ_META_KEY = 'hz_meta'
export const HZ_GUIDES_KEY = 'hz_guides'
export const HZ_GUIDES_CHUNK_PREFIX = 'hz_guides_'
export const HZ_PENDING_PREFIX = 'hz_pending_'
export const HZ_PENDING_META_PREFIX = 'hz_pending_meta_'
export const HZ_BAN_PREFIX = 'hz_ban_'

const GUIDE_CHUNK_SIZE = 900 * 1024
const SUBMIT_RATE_LIMIT_MS = 2 * 60 * 1000
const GUIDES_COMPRESSION = 'deflate-base64'

const textEncoder = new TextEncoder()

export function getHuizhangKv(env = {}) {
  const kv =
    env.huizhang_data ||
    globalThis.huizhang_data ||
    // eslint-disable-next-line no-undef
    (typeof huizhang_data !== 'undefined' ? huizhang_data : null)
  if (!kv) {
    const error = new Error('EdgeOne KV 变量 huizhang_data 未绑定。')
    error.status = 503
    throw error
  }
  return kv
}

export function shortRandom() {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 8)
}

export function pendingKey(userId, submittedAt = Date.now()) {
  return `${HZ_PENDING_PREFIX}${userId}_${submittedAt}_${shortRandom()}`
}

export function guideId(approvedAt = Date.now()) {
  return `g_${approvedAt}_${shortRandom()}`
}

export function parsePendingDisplayId(key) {
  return String(key || '').slice(HZ_PENDING_PREFIX.length)
}

export async function kvGetJson(kv, key, fallback = null) {
  const raw = await kv.get(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export async function listAllKeys(kv, prefix) {
  const keys = []
  let cursor
  do {
    const options = { prefix, limit: 256 }
    if (typeof cursor === 'string' && cursor) options.cursor = cursor
    const result = await kv.list(options)
    for (const item of result?.keys || []) {
      if (item?.key) keys.push(item.key)
    }
    cursor = result?.cursor
    if (result?.complete) break
  } while (cursor)
  return keys
}

export async function listJsonByPrefix(kv, prefix) {
  const keys = await listAllKeys(kv, prefix)
  const items = []
  for (const key of keys) {
    const value = await kvGetJson(kv, key)
    if (value) items.push({ key, ...value })
  }
  return items
}

export async function readMeta(kv) {
  return kvGetJson(kv, HZ_META_KEY, {
    version: '0',
    updated_at: 0,
    chunk_count: 0,
    total: 0,
    schema: 1,
  })
}

export async function readGuides(kv) {
  const meta = await readMeta(kv)
  let guides = []

  if (Number(meta.chunk_count || 0) > 0) {
    let raw = ''
    for (let i = 0; i < Number(meta.chunk_count); i += 1) {
      const chunk = await kv.get(`${HZ_GUIDES_CHUNK_PREFIX}${String(i).padStart(3, '0')}`)
      if (chunk) raw += chunk
    }
    if (raw) {
      try {
        guides = decodeGuidesPayload(raw, meta.compression)
      } catch {
        guides = []
      }
    }
  } else {
    const raw = await kv.get(HZ_GUIDES_KEY)
    if (raw) {
      try {
        guides = decodeGuidesPayload(raw, meta.compression)
      } catch {
        guides = []
      }
    }
  }

  return {
    version: meta.version || '0',
    updated_at: Number(meta.updated_at || 0),
    guides: Array.isArray(guides) ? guides : [],
    meta,
  }
}

function chunkStringByUtf8Bytes(value, maxBytes) {
  const chunks = []
  let chunk = ''
  let chunkBytes = 0

  for (const char of value) {
    const charBytes = textEncoder.encode(char).byteLength
    if (chunk && chunkBytes + charBytes > maxBytes) {
      chunks.push(chunk)
      chunk = ''
      chunkBytes = 0
    }
    chunk += char
    chunkBytes += charBytes
  }

  if (chunk) chunks.push(chunk)
  return chunks
}

function base64FromBytes(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function bytesFromBase64(value) {
  const binary = atob(String(value || ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function encodeGuidesPayload(guides) {
  const json = JSON.stringify(guides)
  return base64FromBytes(pako.deflate(json, { level: 9 }))
}

function decodeGuidesPayload(raw, compression) {
  const json =
    compression === GUIDES_COMPRESSION ? pako.inflate(bytesFromBase64(raw), { to: 'string' }) : raw
  return JSON.parse(json)
}

export async function writeGuides(kv, guides, previousMeta = null) {
  const now = Date.now()
  const version = String(now)
  const normalized = Array.isArray(guides) ? guides : []
  const payload = encodeGuidesPayload(normalized)
  const oldMeta = previousMeta || (await readMeta(kv))
  const oldChunkCount = Number(oldMeta.chunk_count || 0)

  if (textEncoder.encode(payload).byteLength <= GUIDE_CHUNK_SIZE) {
    await kv.put(HZ_GUIDES_KEY, payload)
    for (let i = 0; i < oldChunkCount; i += 1) {
      await kv.delete(`${HZ_GUIDES_CHUNK_PREFIX}${String(i).padStart(3, '0')}`)
    }
    await kv.put(
      HZ_META_KEY,
      JSON.stringify({
        version,
        updated_at: now,
        chunk_count: 0,
        total: normalized.length,
        schema: 1,
        compression: GUIDES_COMPRESSION,
      }),
    )
    return {
      version,
      updated_at: now,
      chunk_count: 0,
      total: normalized.length,
      compression: GUIDES_COMPRESSION,
    }
  }

  const chunks = chunkStringByUtf8Bytes(payload, GUIDE_CHUNK_SIZE)

  for (let i = 0; i < chunks.length; i += 1) {
    await kv.put(`${HZ_GUIDES_CHUNK_PREFIX}${String(i).padStart(3, '0')}`, chunks[i])
  }
  for (let i = chunks.length; i < oldChunkCount; i += 1) {
    await kv.delete(`${HZ_GUIDES_CHUNK_PREFIX}${String(i).padStart(3, '0')}`)
  }
  await kv.delete(HZ_GUIDES_KEY)
  await kv.put(
    HZ_META_KEY,
    JSON.stringify({
      version,
      updated_at: now,
      chunk_count: chunks.length,
      total: normalized.length,
      schema: 1,
      compression: GUIDES_COMPRESSION,
    }),
  )
  return {
    version,
    updated_at: now,
    chunk_count: chunks.length,
    total: normalized.length,
    compression: GUIDES_COMPRESSION,
  }
}

export async function readAdminBootstrap(kv) {
  const [{ version, updated_at, guides, meta }, pendingItems, banItems] = await Promise.all([
    readGuides(kv),
    listJsonByPrefix(kv, HZ_PENDING_PREFIX),
    listJsonByPrefix(kv, HZ_BAN_PREFIX),
  ])

  return {
    meta: {
      version,
      updated_at,
      chunk_count: Number(meta.chunk_count || 0),
      total: guides.length,
      schema: 1,
      compression: meta.compression || '',
    },
    guides: guides.sort((a, b) => Number(b.approved_at || 0) - Number(a.approved_at || 0)),
    pending: pendingItems
      .filter((item) => item.key && !item.key.startsWith(HZ_PENDING_META_PREFIX))
      .map((item) => ({ id: item.id || parsePendingDisplayId(item.key), ...item }))
      .sort((a, b) => Number(b.submitted_at || 0) - Number(a.submitted_at || 0)),
    bans: banItems.sort((a, b) => Number(b.banned_at || 0) - Number(a.banned_at || 0)),
  }
}

export function normalizeGuide(raw) {
  return {
    id: String(raw.id || guideId()),
    char_id: String(raw.char_id || raw.charId || ''),
    code: String(raw.code || ''),
    title: String(raw.title || '')
      .trim()
      .slice(0, 100),
    author_name: String(raw.author_name || raw.authorName || '')
      .trim()
      .slice(0, 100),
    user_id: String(raw.user_id || raw.userId || ''),
    is_featured: raw.is_featured || raw.isFeatured ? 1 : 0,
    approved_at: Number(raw.approved_at || raw.approvedAt || Date.now()),
  }
}

export function validateGuidePayload(guide) {
  if (!guide.char_id || !/^\d+$/.test(String(guide.char_id))) return 'char_id 格式错误'
  if (!guide.code || typeof guide.code !== 'string' || guide.code.length > 15360) {
    return '攻略代码无效或超出大小限制（15KB）'
  }
  return ''
}

export async function enforceSubmitRateLimit(kv, userId) {
  const key = `${HZ_PENDING_META_PREFIX}${userId}`
  const meta = await kvGetJson(kv, key, {})
  const lastSubmittedAt = Number(meta.lastSubmittedAt || 0)
  const elapsed = Date.now() - lastSubmittedAt
  if (lastSubmittedAt && elapsed < SUBMIT_RATE_LIMIT_MS) {
    return { allowed: false, timeLeft: SUBMIT_RATE_LIMIT_MS - elapsed }
  }
  return { allowed: true, key }
}

export async function saveSubmitRateLimit(kv, userId) {
  await kv.put(
    `${HZ_PENDING_META_PREFIX}${userId}`,
    JSON.stringify({ lastSubmittedAt: Date.now() }),
  )
}

import nacl from 'tweetnacl'

const RATE_LIMITS = {
  manualUpload: {
    admin: 5 * 60 * 1000,
    subscribed: 1 * 60 * 60 * 1000,
    normal: 12 * 60 * 60 * 1000,
  },
}

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  ...corsHeaders(),
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-License-Key,X-Player-Id,X-Player-ID',
  }
}

export function textResponse(message, status = 200) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...corsHeaders(),
    },
  })
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  })
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

export function getGachaKv(env) {
  const kv =
    typeof gacha_data !== 'undefined' ? gacha_data : env?.gacha_data || globalThis.gacha_data
  if (!kv) {
    throw new Error('EdgeOne KV 变量 gacha_data 未绑定。')
  }
  return kv
}

export function isAdminUser(userId) {
  const userIdStr = String(userId)
  return userIdStr.startsWith('33') && userIdStr.length === 9
}

export function canAccessPlayer(playerId, userId) {
  const userIdStr = String(userId)
  return String(playerId) === userIdStr || isAdminUser(userIdStr)
}

export function recordKey(playerId) {
  return `record_${playerId}`
}

export function recordMetaKey(playerId) {
  return `record_meta_${playerId}`
}

export async function readRecordMeta(kv, playerId) {
  const raw = await kv.get(recordMetaKey(playerId))
  if (!raw) return {}

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function enforceUploadRateLimit(kv, playerId, userId, isExpired) {
  const meta = await readRecordMeta(kv, playerId)
  const lastUpdated = Number(meta.lastUpdated || 0)

  if (!lastUpdated) {
    return { allowed: true, meta }
  }

  const writeTimeLimit = isAdminUser(userId)
    ? RATE_LIMITS.manualUpload.admin
    : isExpired
      ? RATE_LIMITS.manualUpload.normal
      : RATE_LIMITS.manualUpload.subscribed

  const elapsed = Date.now() - lastUpdated
  if (elapsed >= writeTimeLimit) {
    return { allowed: true, meta }
  }

  return {
    allowed: false,
    meta,
    timeLeft: writeTimeLimit - elapsed,
  }
}

export async function saveRecordMeta(kv, playerId) {
  const nextMeta = {
    lastUpdated: Date.now(),
  }

  await kv.put(recordMetaKey(playerId), JSON.stringify(nextMeta))
  return nextMeta
}

function base64UrlToStandard(base64url) {
  const base64 = String(base64url).replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return base64 + padding
}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function verifyLicenseForEdgeOne(licenseKey, base64PublicKey) {
  if (!base64PublicKey) {
    throw new Error('环境变量 PUBLIC_KEY 未设置。')
  }

  const derKey = base64ToBytes(base64PublicKey)
  const publicKey = derKey.slice(derKey.length - 32)
  const fullData = base64ToBytes(base64UrlToStandard(licenseKey))
  const signatureLength = 64
  if (fullData.length <= signatureLength) {
    throw new Error('激活码格式不正确。')
  }

  const payload = fullData.slice(0, fullData.length - signatureLength)
  const signature = fullData.slice(fullData.length - signatureLength)
  const isVerified = nacl.sign.detached.verify(payload, signature, publicKey)

  if (!isVerified) {
    throw new Error('激活码签名验证失败。')
  }

  const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  const userId = dataView.getUint32(0, true)
  const expiryTimestamp = Number(dataView.getBigUint64(4, true))

  return {
    userId,
    isExpired: expiryTimestamp < Math.floor(Date.now() / 1000),
  }
}

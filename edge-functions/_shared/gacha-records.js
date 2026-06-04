import nacl from 'tweetnacl'

const RATE_LIMITS = {
  manualUpload: {
    admin: 5 * 60 * 1000,
    subscribed: 1 * 60 * 60 * 1000,
    normal: 12 * 60 * 60 * 1000,
  },
}

export const EDGEONE_BODY_LIMIT_BYTES = 1024 * 1024
export const SAFE_RECORD_LIMIT_BYTES = 950 * 1024

const GAME_MAIL_URL = 'https://matrix-api.aojiaostudio.com/api2/mail'
const GAME_MAIL_HEADERS = {
  'Content-Type': 'application/json',
  Origin: 'https://act-horcrux.aojiaostudio.com',
  Referer: 'https://act-horcrux.aojiaostudio.com/',
}

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  ...corsHeaders(),
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type,Authorization,X-License-Key,X-Player-Id,X-Player-ID',
  }
}

export function utf8Bytes(value) {
  return new TextEncoder().encode(String(value || '')).byteLength
}

export function isKvLimitError(error) {
  const message = String(error?.message || error || '')
  return /LimitExceeded|quota|exceed|exceeded|too large|size|容量|限额|超出/i.test(message)
}

export function diagnosticHeaders(diagnostic, extra = {}) {
  return {
    'X-EO-Diagnostic': diagnostic,
    ...extra,
  }
}

export function textResponse(message, status = 200, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...corsHeaders(),
      ...extraHeaders,
    },
  })
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      ...extraHeaders,
    },
  })
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

export function getGachaKv(env = {}) {
  const kv =
    env.gacha_data ||
    globalThis.gacha_data ||
    // eslint-disable-next-line no-undef
    (typeof gacha_data !== 'undefined' ? gacha_data : null)
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

function base64UrlFromBytes(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function jsonResponseFromGameFailure(data) {
  if (!data || typeof data !== 'object') return '游戏账号验证未通过'
  return data.msg || data.message || '游戏账号验证未通过'
}

function extractEd25519SeedFromPkcs8(pkcs8Bytes) {
  const bytes = pkcs8Bytes instanceof Uint8Array ? pkcs8Bytes : new Uint8Array(pkcs8Bytes)
  const oid = [0x06, 0x03, 0x2b, 0x65, 0x70]
  let hasEd25519Oid = false
  for (let start = 0; start <= bytes.length - oid.length; start += 1) {
    if (oid.every((value, index) => bytes[start + index] === value)) {
      hasEd25519Oid = true
      break
    }
  }

  if (!hasEd25519Oid) {
    throw new Error('PRIVATE_KEY 不是 Ed25519 PKCS#8 DER base64 格式。')
  }

  if (bytes.length < 32) {
    throw new Error('PRIVATE_KEY 长度不正确。')
  }

  return bytes.slice(bytes.length - 32)
}

async function callGameMailApi(payload) {
  const maxAttempts = 2
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(GAME_MAIL_URL, {
        method: 'POST',
        headers: GAME_MAIL_HEADERS,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const message = `游戏邮件服务请求失败：${response.status}`
        lastError = new Error(message)
        if (response.status >= 500 && attempt < maxAttempts) continue
        throw lastError
      }

      return response.json()
    } catch (error) {
      lastError = error
      if (attempt >= maxAttempts) break
    } finally {
      clearTimeout(timer)
    }
  }

  const isTimeout = lastError && lastError.name === 'AbortError'
  throw new Error(isTimeout ? '游戏邮件服务响应超时，请稍后重试' : lastError?.message || '游戏邮件服务请求失败')
}

export async function verifyGameMailCodeOnServer(uid, mailCode) {
  const uidNumber = Number(uid)
  const mailCodeNumber = Number(mailCode)
  if (!Number.isSafeInteger(uidNumber) || uidNumber <= 0) {
    throw new Error('UID格式不正确')
  }
  if (!Number.isSafeInteger(mailCodeNumber) || mailCodeNumber <= 0) {
    throw new Error('验证码格式不正确')
  }

  const data = await callGameMailApi({
    command: 'login_mail_code',
    playerId: uidNumber,
    serverId: '_',
    mailCode: mailCodeNumber,
    activity: 'mhzq',
  })

  if (!data || data.code !== 0) {
    throw new Error(jsonResponseFromGameFailure(data))
  }

  return data
}

export async function generateActivationKey(uid, base64PrivateKey) {
  if (!base64PrivateKey) {
    throw new Error('PRIVATE_KEY 未设置。')
  }

  const uidInt = Number.parseInt(String(uid), 10)
  if (!Number.isSafeInteger(uidInt) || uidInt < 0 || uidInt > 0xffffffff) {
    throw new Error('UID 超出 uint32 范围')
  }
  // 激活码有效期45天
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 45 * 24 * 3600)
  const payload = new Uint8Array(12)
  const dataView = new DataView(payload.buffer)
  dataView.setUint32(0, uidInt, true)
  dataView.setBigUint64(4, expiry, true)

  const seed = extractEd25519SeedFromPkcs8(base64ToBytes(base64PrivateKey))
  const keyPair = nacl.sign.keyPair.fromSeed(seed)
  const signature = nacl.sign.detached(payload, keyPair.secretKey)
  const fullData = new Uint8Array(payload.length + signature.length)
  fullData.set(payload, 0)
  fullData.set(signature, payload.length)

  return base64UrlFromBytes(fullData)
}

function base64UrlToStandard(base64url) {
  const base64 = String(base64url).replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return base64 + padding
}

function normalizePemBase64(value) {
  return String(value || '')
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
}

function base64ToBytes(base64) {
  const normalized = normalizePemBase64(base64)
  const binary = atob(normalized)
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

  if (expiryTimestamp < Math.floor(Date.now() / 1000)) {
    throw new Error('激活码已过期')
  }

  return {
    userId,
  }
}

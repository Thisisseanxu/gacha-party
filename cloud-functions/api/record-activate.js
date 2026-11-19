import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { generateActivationKey, jsonResponse, optionsResponse } from '../_shared/activation.js'
import { decodeRecordId, readBoundedJson, verifyRecordOwner } from '../_shared/record-activation.js'

export function onRequestOptions() {
  return optionsResponse()
}

// A bounded per-instance guard, in addition to the deployment's WAF rate rules.
// Retain only token digests; never retain an upload token or full record ID.
export function createActivationRateLimiter(now = Date.now) {
  const buckets = new Map()
  return (key, limit) => {
    const minute = Math.floor(now() / 60000)
    for (const [entryKey, entry] of buckets) if (entry.minute !== minute) buckets.delete(entryKey)
    const entry = buckets.get(key) || { minute, count: 0 }
    if (entry.count >= limit) return false
    entry.count++
    buckets.set(key, entry)
    return true
  }
}

export function createRecordActivationHandler({ fetchImpl = fetch, allowRequest = createActivationRateLimiter() } = {}) {
  return async function ({ request, env = {} }) {
    if (!env.PRIVATE_KEY) {
      return jsonResponse({ success: false, message: '服务端未配置 PRIVATE_KEY' }, 503)
    }
    try {
      if (!allowRequest('all', 60)) {
        const response = jsonResponse({ success: false, code: 'RATE_LIMITED', message: '验证过于频繁，请稍后重试。' }, 429)
        response.headers.set('Retry-After', '60')
        return response
      }
      const body = await readBoundedJson(request)
      const { playerId, uploadToken } = decodeRecordId(body?.record_id)
      const digest = createHash('sha256').update(uploadToken).digest('hex')
      if (!allowRequest(digest, 6)) {
        const response = jsonResponse({ success: false, code: 'RATE_LIMITED', message: '验证过于频繁，请稍后重试。' }, 429)
        response.headers.set('Retry-After', '60')
        return response
      }
      const verifiedId = await verifyRecordOwner(playerId, uploadToken, fetchImpl)
      const activationKey = await generateActivationKey(verifiedId, env.PRIVATE_KEY)
      const expiry = Number(Buffer.from(activationKey, 'base64url').readBigUInt64LE(4))
      return jsonResponse({
        success: true,
        player_id: verifiedId,
        activation_key: activationKey,
        expires_at: expiry,
      })
    } catch (error) {
      // Do not reflect upstream bodies, credentials, or signing-key errors.
      return jsonResponse({
        success: false,
        code: error.code || 'ACTIVATION_FAILED',
        message: error.statusCode ? error.message : '激活码签发失败，请稍后重试。',
      }, error.statusCode || 500)
    }
  }
}

export const onRequestPost = createRecordActivationHandler()

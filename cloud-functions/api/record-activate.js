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

export function createRecordActivationHandler({
  fetchImpl = fetch,
  allowRequest = createActivationRateLimiter(),
  reportError = (details) => console.error('[record-activate] request failed', details),
} = {}) {
  return async function ({ request, env = {}, server, uuid }) {
    if (!env.PRIVATE_KEY) {
      return jsonResponse({ success: false, message: '服务端未配置 PRIVATE_KEY' }, 503)
    }
    let stage = 'read_request'
    try {
      if (!allowRequest('all', 60)) {
        const response = jsonResponse({ success: false, code: 'RATE_LIMITED', message: '验证过于频繁，请稍后重试。' }, 429)
        response.headers.set('Retry-After', '60')
        return response
      }
      const body = await readBoundedJson(request)
      stage = 'decode_record_id'
      const { playerId, uploadToken } = decodeRecordId(body?.record_id)
      const digest = createHash('sha256').update(uploadToken).digest('hex')
      if (!allowRequest(digest, 6)) {
        const response = jsonResponse({ success: false, code: 'RATE_LIMITED', message: '验证过于频繁，请稍后重试。' }, 429)
        response.headers.set('Retry-After', '60')
        return response
      }
      stage = 'verify_owner'
      const verifiedId = await verifyRecordOwner(playerId, uploadToken, fetchImpl)
      stage = 'sign_license'
      const activationKey = await generateActivationKey(verifiedId, env.PRIVATE_KEY)
      const expiry = Number(Buffer.from(activationKey, 'base64url').readBigUInt64LE(4))
      return jsonResponse({
        success: true,
        player_id: verifiedId,
        activation_key: activationKey,
        expires_at: expiry,
      })
    } catch (error) {
      if (!error.statusCode) {
        // Keep logs useful for production failures without logging exception
        // messages/stacks that can contain credentials or upstream bodies.
        const safeNames = ['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'InvalidCharacterError']
        try {
          reportError({
            stage,
            errorName: safeNames.includes(error.name) ? error.name : 'Error',
            requestId: server?.requestId || uuid || '',
          })
        } catch { /* Logging must not replace the original response. */ }
      }
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

import { Buffer } from 'node:buffer'
import { gunzipSync } from 'node:zlib'

export const RECORD_ID_ERROR = '请检查抽卡记录id是否正确，或可能已过期，请重新取号后重试。'
const MAX_RECORD_ID_BYTES = 8192
const MAX_REQUEST_BYTES = 12 * 1024
const MAX_GAME_RESPONSE_BYTES = 64 * 1024
const GAME_RECORDS_URL = 'https://matrix-api.aojiaostudio.com/gacha/records'

export function recordAuthError(message, statusCode = 401, code = 'INVALID_RECORD_ID') {
  return Object.assign(new Error(message), { statusCode, code })
}

// Bound both the wire body and decompressed data before parsing untrusted input.
export async function readBoundedJson(request, maxBytes = MAX_REQUEST_BYTES) {
  if (Number(request.headers.get('Content-Length')) > maxBytes) {
    throw recordAuthError('请求数据过大。', 413, 'BODY_TOO_LARGE')
  }
  const reader = request.body?.getReader()
  if (!reader) throw recordAuthError('请求体格式错误。', 400, 'INVALID_BODY')
  const chunks = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) {
        await reader.cancel()
        throw recordAuthError('请求数据过大。', 413, 'BODY_TOO_LARGE')
      }
      chunks.push(value)
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
  } catch (error) {
    if (error.statusCode) throw error
    throw recordAuthError('请求体格式错误。', 400, 'INVALID_BODY')
  } finally {
    reader.releaseLock()
  }
}

export function decodeRecordId(value) {
  try {
    if (typeof value !== 'string' || value.length > MAX_RECORD_ID_BYTES) throw new Error()
    const id = value.replace(/\s+/g, '')
    if (!/^MHPD1\.[A-Za-z0-9_-]+$/.test(id)) throw new Error()
    const encoded = id.slice(6)
    if (encoded.length % 4 === 1) throw new Error()
    const compressed = Buffer.from(encoded, 'base64url')
    if (compressed[0] !== 0x1f || compressed[1] !== 0x8b) throw new Error()
    const raw = gunzipSync(compressed, { maxOutputLength: MAX_RECORD_ID_BYTES })
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw))
    if (!Array.isArray(data) || data.length !== 2) throw new Error()
    const [playerId, uploadToken] = data
    if (typeof playerId !== 'string' || !/^[1-9]\d{0,9}$/.test(playerId) || Number(playerId) > 0xffffffff) throw new Error()
    if (typeof uploadToken !== 'string' || uploadToken.length > 4096 || !/^Aoki_v2 [\x21-\x7e]+$/.test(uploadToken)) throw new Error()
    return { playerId, uploadToken }
  } catch {
    throw recordAuthError(RECORD_ID_ERROR, 400)
  }
}

export async function verifyRecordOwner(playerId, uploadToken, fetchImpl = fetch) {
  // Legacy licenses grant special privileges to this reserved UID range. These
  // credentials must never be minted through automatic game-account activation.
  if (/^33\d{7}$/.test(playerId)) {
    throw recordAuthError('此账号不能自动签发激活码，请联系管理员。', 403, 'RESERVED_ID')
  }
  for (const poolId of ['9', '10000']) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const query = new URLSearchParams({ player_id: playerId, gacha_id: poolId, page: '1', page_size: '10' })
      const response = await fetchImpl(`${GAME_RECORDS_URL}?${query}`, {
        headers: { 'X-Token': uploadToken, Accept: 'application/json' },
        redirect: 'error',
        signal: controller.signal,
      })
      if (response.status === 401 || response.status === 403) throw recordAuthError(RECORD_ID_ERROR)
      if (!response.ok) throw recordAuthError('官方验证服务暂不可用，请稍后重试。', 502, 'GAME_UNAVAILABLE')
      let body
      try {
        body = await readBoundedJson(response, MAX_GAME_RESPONSE_BYTES)
      } catch {
        throw recordAuthError('官方验证响应异常，请稍后重试。', 502, 'GAME_UNAVAILABLE')
      }
      if (body?.code !== 0) throw recordAuthError(RECORD_ID_ERROR)
      const records = body?.data?.records
      if (!Array.isArray(records)) throw recordAuthError('官方验证响应异常，请稍后重试。', 502, 'GAME_UNAVAILABLE')
      if (!records.length) continue
      // An HTTP/business success alone does not establish the token's identity.
      // Require every returned record to identify the claimed player explicitly.
      if (!records.every(record => record &&
        ((typeof record.player_id === 'string' && record.player_id === playerId) ||
          (Number.isSafeInteger(record.player_id) && String(record.player_id) === playerId)))) {
        throw recordAuthError('抽卡记录id的玩家ID与官方记录不一致，请重新取号。', 403, 'PLAYER_MISMATCH')
      }
      return playerId
    } catch (error) {
      if (error.statusCode) throw error
      throw recordAuthError('官方验证服务连接失败，请稍后重试。', 502, 'GAME_UNAVAILABLE')
    } finally {
      clearTimeout(timeout)
    }
  }
  throw recordAuthError('常驻池暂无可核对的抽卡记录，暂时无法验证账号归属。', 422, 'NO_VERIFIABLE_RECORDS')
}

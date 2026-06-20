import {
  canAccessPlayer,
  getGachaKv,
  isKvLimitError,
  optionsResponse,
  recordKey,
  SAFE_RECORD_LIMIT_BYTES,
  textResponse,
  utf8Bytes,
  verifyLicenseForEdgeOne,
} from './_shared/gacha-records.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestGet({ request, env }) {
  try {
    const licenseKey = request.headers.get('X-License-Key')
    const playerId = request.headers.get('X-Player-Id')

    if (!licenseKey || !playerId) {
      return textResponse('请求头中缺少 X-License-Key 或 X-Player-Id', 400)
    }

    const { userId } = verifyLicenseForEdgeOne(licenseKey, env.PUBLIC_KEY)

    if (!canAccessPlayer(playerId, userId)) {
      return textResponse('查询记录的玩家ID和激活码不匹配', 403)
    }

    const kv = getGachaKv(env)
    const value = await kv.get(recordKey(playerId))

    if (value === null) {
      return textResponse(`数据库中没有找到玩家ID ${playerId} 对应的记录`, 404)
    }

    const valueBytes = utf8Bytes(value)
    if (valueBytes > SAFE_RECORD_LIMIT_BYTES) {
      return textResponse(
        `抽卡记录过大（${valueBytes} bytes），已接近 EdgeOne Edge Functions/KV 的 1MB 限制，请迁移到 Cloud Functions + Blob/数据库后再读取。`,
        413,
        { 'X-Record-Bytes': String(valueBytes) },
      )
    }

    return textResponse(value, 200, { 'X-Record-Bytes': String(valueBytes) })
  } catch (error) {
    if (isKvLimitError(error)) {
      return textResponse(`KV 服务限额或容量异常：${error.message}`, 503)
    }
    return textResponse(`验证失败：${error.message}`, 403)
  }
}

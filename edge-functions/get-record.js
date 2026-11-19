import {
  authenticateRecordRequest,
  getGachaKv,
  isKvLimitError,
  optionsResponse,
  recordKey,
  SAFE_RECORD_LIMIT_BYTES,
  textResponse,
  utf8Bytes,
} from './_shared/gacha-records.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestGet({ request, env }) {
  try {
    const { playerId } = await authenticateRecordRequest(request, env)

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
    return textResponse(`验证失败：${error.message}`, error.statusCode || 403)
  }
}

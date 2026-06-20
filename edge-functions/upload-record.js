import {
  canAccessPlayer,
  enforceUploadRateLimit,
  EDGEONE_BODY_LIMIT_BYTES,
  getGachaKv,
  isKvLimitError,
  jsonResponse,
  optionsResponse,
  recordKey,
  saveRecordMeta,
  SAFE_RECORD_LIMIT_BYTES,
  utf8Bytes,
  verifyLicenseForEdgeOne,
} from './_shared/gacha-records.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestPost({ request, env }) {
  const responseBody = { message: '', timeLeft: 0 }

  try {
    const licenseKey = request.headers.get('X-License-Key')
    const playerId = request.headers.get('X-Player-Id')

    if (!licenseKey) {
      responseBody.message = '请求头中缺少 X-License-Key'
      return jsonResponse(responseBody, 400)
    }

    if (!playerId) {
      responseBody.message = '请求头中缺少 X-Player-Id'
      return jsonResponse(responseBody, 400)
    }

    const { userId, isExpired } = await verifyLicenseForEdgeOne(licenseKey, env.PUBLIC_KEY)

    if (!canAccessPlayer(playerId, userId)) {
      responseBody.message = '上传的抽卡记录不属于激活码对应的玩家！'
      return jsonResponse(responseBody, 403)
    }

    const payload = await request.text()
    if (!payload) {
      responseBody.message = '请求体为空，没有需要上传的数据'
      return jsonResponse(responseBody, 400)
    }

    const payloadBytes = utf8Bytes(payload)
    if (payloadBytes > SAFE_RECORD_LIMIT_BYTES) {
      responseBody.message = `抽卡记录过大（${payloadBytes} bytes），已接近 EdgeOne Edge Functions/KV 的 1MB 限制，请改用 Blob/数据库存储。`
      responseBody.limitBytes = EDGEONE_BODY_LIMIT_BYTES
      responseBody.safeLimitBytes = SAFE_RECORD_LIMIT_BYTES
      return jsonResponse(
        responseBody,
        413,
        { 'X-Record-Bytes': String(payloadBytes) },
      )
    }

    const kv = getGachaKv(env)
    const limit = await enforceUploadRateLimit(kv, playerId, userId, isExpired)

    if (!limit.allowed) {
      responseBody.message = '上传过于频繁，'
      responseBody.timeLeft = limit.timeLeft
      return jsonResponse(responseBody, 429)
    }

    await kv.put(recordKey(playerId), payload)
    await saveRecordMeta(kv, playerId)

    responseBody.message = '抽卡记录上传成功！'
    responseBody.bytes = payloadBytes
    return jsonResponse(responseBody, 200, { 'X-Record-Bytes': String(payloadBytes) })
  } catch (error) {
    if (isKvLimitError(error)) {
      responseBody.message = `KV 服务限额或容量异常：${error.message}`
      return jsonResponse(responseBody, 503)
    }
    responseBody.message = `验证失败：${error.message}`
    return jsonResponse(responseBody, 403)
  }
}

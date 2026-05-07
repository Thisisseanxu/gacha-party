import {
  canAccessPlayer,
  enforceUploadRateLimit,
  getGachaKv,
  jsonResponse,
  optionsResponse,
  recordKey,
  saveRecordMeta,
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

    const kv = getGachaKv(env)
    const limit = await enforceUploadRateLimit(kv, playerId, userId, isExpired)

    if (!limit.allowed) {
      responseBody.message = '上传过于频繁，'
      responseBody.timeLeft = limit.timeLeft
      return jsonResponse(responseBody, 429)
    }

    await kv.put(recordKey(playerId), payload)
    await saveRecordMeta(kv, playerId, limit.meta)

    responseBody.message = '抽卡记录上传成功！'
    return jsonResponse(responseBody)
  } catch (error) {
    responseBody.message = `验证失败：${error.message}`
    return jsonResponse(responseBody, 403)
  }
}

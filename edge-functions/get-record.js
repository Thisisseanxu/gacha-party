import {
  canAccessPlayer,
  getGachaKv,
  optionsResponse,
  recordKey,
  textResponse,
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

    return textResponse(value)
  } catch (error) {
    return textResponse(`验证失败：${error.message}`, 403)
  }
}

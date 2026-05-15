import {
  generateActivationKey,
  jsonResponse,
  optionsResponse,
  verifyGameMailCodeOnServer,
} from './_shared/gacha-records.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.PRIVATE_KEY) {
      return jsonResponse({ success: false, message: '服务端未配置 PRIVATE_KEY' }, 503)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ success: false, message: '请求体格式错误' }, 400)
    }

    const { uid, mail_code: mailCode } = body || {}
    if (!uid || !mailCode) {
      return jsonResponse({ success: false, message: '缺少必要参数' }, 400)
    }

    let gameResponse
    try {
      gameResponse = await verifyGameMailCodeOnServer(uid, mailCode)
    } catch (error) {
      return jsonResponse(
        { success: false, code: 'GAME_VERIFY_FAILED', message: error.message },
        400,
      )
    }

    const activationKey = await generateActivationKey(uid, env.PRIVATE_KEY)

    return jsonResponse({
      success: true,
      player_name: gameResponse.nickname || '',
      activation_key: activationKey,
    })
  } catch (error) {
    return jsonResponse({ success: false, message: error.message || '生成激活码失败' }, 500)
  }
}

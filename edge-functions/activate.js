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
  const startedAt = Date.now()
  try {
    console.log('[activate] start')
    if (!env.PRIVATE_KEY) {
      console.error('[activate] missing PRIVATE_KEY')
      return jsonResponse({ success: false, message: '服务端未配置 PRIVATE_KEY' }, 503)
    }

    let body
    try {
      body = await request.json()
    } catch {
      console.error('[activate] invalid json body')
      return jsonResponse({ success: false, message: '请求体格式错误' }, 400)
    }

    const { uid, mail_code: mailCode } = body || {}
    console.log('[activate] parsed body', {
      uid: uid ? String(uid) : '',
      mailCodeLength: mailCode ? String(mailCode).length : 0,
    })
    if (!uid || !mailCode) {
      console.error('[activate] missing params')
      return jsonResponse({ success: false, message: '缺少必要参数' }, 400)
    }

    let gameResponse
    try {
      gameResponse = await verifyGameMailCodeOnServer(uid, mailCode)
      console.log('[activate] game verify ok', {
        uid: String(uid),
        nickname: gameResponse.nickname || '',
      })
    } catch (error) {
      console.error('[activate] game verify failed', {
        uid: String(uid),
        message: error.message,
        elapsed: Date.now() - startedAt,
      })
      return jsonResponse(
        { success: false, code: 'GAME_VERIFY_FAILED', message: error.message },
        400,
      )
    }

    const activationKey = await generateActivationKey(uid, env.PRIVATE_KEY)
    console.log('[activate] success', {
      uid: String(uid),
      keyLength: activationKey.length,
      elapsed: Date.now() - startedAt,
    })

    return jsonResponse({
      success: true,
      player_name: gameResponse.nickname || '',
      activation_key: activationKey,
    })
  } catch (error) {
    console.error('[activate] fatal', {
      message: error.message,
      stack: error.stack,
      elapsed: Date.now() - startedAt,
    })
    return jsonResponse({ success: false, message: error.message || '生成激活码失败' }, 500)
  }
}

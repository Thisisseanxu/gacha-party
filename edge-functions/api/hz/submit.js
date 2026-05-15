import {
  jsonResponse,
  optionsResponse,
  verifyLicenseForEdgeOne,
} from '../../_shared/gacha-records.js'
import {
  HZ_BAN_PREFIX,
  enforceSubmitRateLimit,
  getHuizhangKv,
  pendingKey,
  saveSubmitRateLimit,
} from '../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestPost({ request, env }) {
  try {
    const licenseKey = request.headers.get('X-License-Key')
    if (!licenseKey) {
      return jsonResponse({ message: '请提供激活码（X-License-Key 请求头）' }, 401)
    }

    let userId
    try {
      userId = String(verifyLicenseForEdgeOne(licenseKey, env.PUBLIC_KEY).userId)
    } catch (error) {
      return jsonResponse({ message: `激活码无效: ${error.message}` }, 403)
    }

    const playerId = request.headers.get('X-Player-Id')
    if (playerId && String(playerId) !== userId) {
      return jsonResponse({ message: '玩家ID与激活码不匹配，请确认填写正确' }, 403)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ message: '请求体格式错误，请发送 JSON' }, 400)
    }

    const { charId, code, title = '', authorName = '' } = body || {}
    if (!charId || !/^\d+$/.test(String(charId))) {
      return jsonResponse({ message: 'charId 格式错误' }, 400)
    }
    if (!code || typeof code !== 'string' || code.length > 15360) {
      return jsonResponse({ message: '攻略代码无效或超出大小限制（15KB）' }, 400)
    }
    if (typeof title !== 'string' || title.length > 100) {
      return jsonResponse({ message: '标题过长（最多100字符）' }, 400)
    }
    if (typeof authorName !== 'string' || authorName.length > 100) {
      return jsonResponse({ message: '署名过长（最多100字符）' }, 400)
    }

    const kv = getHuizhangKv(env)
    const banned = await kv.get(`${HZ_BAN_PREFIX}${userId}`)
    if (banned) {
      return jsonResponse({ message: '该账号已被封禁，无法提交攻略' }, 403)
    }

    const limit = await enforceSubmitRateLimit(kv, userId)
    if (!limit.allowed) {
      return jsonResponse(
        {
          message: `提交过于频繁，请 ${Math.ceil(limit.timeLeft / 1000)} 秒后再试`,
          timeLeft: limit.timeLeft,
        },
        429,
      )
    }

    const submittedAt = Date.now()
    const key = pendingKey(userId, submittedAt)
    await kv.put(
      key,
      JSON.stringify({
        id: key.slice('hz_pending_'.length),
        char_id: String(charId),
        code: code.trim(),
        title: title.trim(),
        author_name: authorName.trim(),
        user_id: userId,
        submitted_at: submittedAt,
      }),
    )
    await saveSubmitRateLimit(kv, userId)

    return jsonResponse({ message: '提交成功！攻略将在审核通过后显示。' }, 201)
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

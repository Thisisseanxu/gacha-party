import { jsonResponse, optionsResponse } from '../../../_shared/gacha-records.js'
import { signAdminToken, verifyAdminLogin } from '../../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestPost({ request, env }) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ message: '请求体格式错误' }, 400)
    }

    const { password, activationKey } = body || {}
    const { userId } = await verifyAdminLogin(password, activationKey, env)
    const token = await signAdminToken(env, userId)
    return jsonResponse({ token })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

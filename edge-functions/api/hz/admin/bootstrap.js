import { jsonResponse, optionsResponse } from '../../../_shared/gacha-records.js'
import {
  getHuizhangKv,
  readAdminBootstrap,
  requireAdmin,
} from '../../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestGet({ request, env }) {
  try {
    const { response } = await requireAdmin(request, env)
    if (response) return response

    const data = await readAdminBootstrap(getHuizhangKv(env))
    return jsonResponse(data)
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

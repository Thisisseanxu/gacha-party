import { jsonResponse, optionsResponse } from '../../_shared/gacha-records.js'
import { getHuizhangKv, readGuides } from '../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestGet({ env }) {
  try {
    const { version, updated_at, guides } = await readGuides(getHuizhangKv(env))
    return jsonResponse({ version, updated_at, guides })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

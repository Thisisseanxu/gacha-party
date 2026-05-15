import { jsonResponse, optionsResponse } from '../../_shared/gacha-records.js'
import { getHuizhangKv, readMeta } from '../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestGet({ env }) {
  try {
    const meta = await readMeta(getHuizhangKv(env))
    return jsonResponse({
      version: meta.version || '0',
      updated_at: Number(meta.updated_at || 0),
    })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

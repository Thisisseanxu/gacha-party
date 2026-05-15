import { jsonResponse, optionsResponse } from '../../../_shared/gacha-records.js'
import {
  HZ_PENDING_META_PREFIX,
  HZ_PENDING_PREFIX,
  getHuizhangKv,
  listJsonByPrefix,
  requireAdmin,
} from '../../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestGet({ request, env }) {
  try {
    const { response } = await requireAdmin(request, env)
    if (response) return response

    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const perPage = 20
    const items = (await listJsonByPrefix(getHuizhangKv(env), HZ_PENDING_PREFIX))
      .filter((item) => item.key && !item.key.startsWith(HZ_PENDING_META_PREFIX))
      .sort((a, b) => Number(b.submitted_at || 0) - Number(a.submitted_at || 0))

    return jsonResponse({
      total: items.length,
      page,
      perPage,
      items: items.slice((page - 1) * perPage, page * perPage),
    })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

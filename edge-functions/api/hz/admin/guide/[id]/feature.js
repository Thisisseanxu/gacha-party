import { jsonResponse, optionsResponse } from '../../../../../_shared/gacha-records.js'
import {
  getHuizhangKv,
  normalizeGuide,
  readGuides,
  requireAdmin,
  writeGuides,
} from '../../../../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

export async function onRequestPatch({ request, params, env }) {
  try {
    const { response } = await requireAdmin(request, env)
    if (response) return response
    const body = await request.json()
    const kv = getHuizhangKv(env)
    const { guides, meta } = await readGuides(kv)
    const index = guides.findIndex((guide) => String(guide.id) === String(params.id))
    if (index === -1) return jsonResponse({ message: '攻略不存在' }, 404)
    guides[index] = normalizeGuide({ ...guides[index], is_featured: body.featured ? 1 : 0 })
    const nextMeta = await writeGuides(kv, guides, meta)
    return jsonResponse({
      message: body.featured ? '已设为精选' : '已取消精选',
      newVersion: nextMeta.version,
    })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

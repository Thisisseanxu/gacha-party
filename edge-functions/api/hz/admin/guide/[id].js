import { jsonResponse, optionsResponse } from '../../../../_shared/gacha-records.js'
import {
  getHuizhangKv,
  normalizeGuide,
  readGuides,
  requireAdmin,
  validateGuidePayload,
  writeGuides,
} from '../../../../_shared/huizhang-guides.js'

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

    const next = normalizeGuide({
      ...guides[index],
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.author_name !== undefined ? { author_name: body.author_name } : {}),
      ...(body.authorName !== undefined ? { authorName: body.authorName } : {}),
      ...(body.code ? { code: body.code } : {}),
    })
    const message = validateGuidePayload(next)
    if (message) return jsonResponse({ message }, 400)
    guides[index] = next
    const nextMeta = await writeGuides(kv, guides, meta)
    return jsonResponse({ message: '修改已保存', newVersion: nextMeta.version })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

export async function onRequestDelete({ request, params, env }) {
  try {
    const { response } = await requireAdmin(request, env)
    if (response) return response
    const kv = getHuizhangKv(env)
    const { guides, meta } = await readGuides(kv)
    const nextGuides = guides.filter((guide) => String(guide.id) !== String(params.id))
    if (nextGuides.length === guides.length) return jsonResponse({ message: '攻略不存在' }, 404)
    const nextMeta = await writeGuides(kv, nextGuides, meta)
    return jsonResponse({ message: '已删除', newVersion: nextMeta.version })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

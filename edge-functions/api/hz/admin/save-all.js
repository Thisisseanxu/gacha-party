import { jsonResponse, optionsResponse } from '../../../_shared/gacha-records.js'
import {
  HZ_BAN_PREFIX,
  HZ_PENDING_META_PREFIX,
  HZ_PENDING_PREFIX,
  getHuizhangKv,
  guideId,
  normalizeGuide,
  readMeta,
  requireAdmin,
  validateGuidePayload,
  writeGuides,
} from '../../../_shared/huizhang-guides.js'

export function onRequestOptions() {
  return optionsResponse()
}

function normalizeKeyList(keys, prefix) {
  return Array.from(new Set((Array.isArray(keys) ? keys : []).map(String))).filter((key) =>
    key.startsWith(prefix) &&
    (prefix !== HZ_PENDING_PREFIX || !key.startsWith(HZ_PENDING_META_PREFIX)),
  )
}

export async function onRequestPost({ request, env }) {
  try {
    const { response } = await requireAdmin(request, env)
    if (response) return response

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ message: '请求体格式错误' }, 400)
    }

    const kv = getHuizhangKv(env)
    const currentMeta = await readMeta(kv)
    const baseVersion = String(body?.baseVersion ?? '')
    if (baseVersion !== String(currentMeta.version || '0')) {
      return jsonResponse(
        {
          message: '攻略数据已被其他窗口修改，请重新加载后再保存。',
          currentVersion: currentMeta.version || '0',
        },
        409,
      )
    }

    const guides = (Array.isArray(body?.guides) ? body.guides : []).map((guide) =>
      normalizeGuide({
        ...guide,
        id: guide.id || guideId(),
      }),
    )
    for (const guide of guides) {
      const message = validateGuidePayload(guide)
      if (message) return jsonResponse({ message }, 400)
    }

    const bans = Array.isArray(body?.bans) ? body.bans : []
    const deletePendingKeys = normalizeKeyList(body?.deletePendingKeys, HZ_PENDING_PREFIX)

    const nextMeta = await writeGuides(kv, guides, currentMeta)

    for (const key of deletePendingKeys) {
      await kv.delete(key)
    }

    const nextBanUserIds = new Set()
    for (const ban of bans) {
      const userId = String(ban.user_id || ban.userId || '').trim()
      if (!userId) continue
      nextBanUserIds.add(userId)
      await kv.put(
        `${HZ_BAN_PREFIX}${userId}`,
        JSON.stringify({
          user_id: userId,
          banned_at: Number(ban.banned_at || Date.now()),
          reason: String(ban.reason || '').trim(),
        }),
      )
    }
    const deletedBanKeys = normalizeKeyList(body?.deleteBanKeys, HZ_BAN_PREFIX)
    for (const key of deletedBanKeys) {
      const userId = key.slice(HZ_BAN_PREFIX.length)
      if (!nextBanUserIds.has(userId)) await kv.delete(key)
    }

    return jsonResponse({
      message: '全部修改已保存',
      version: nextMeta.version,
      updated_at: nextMeta.updated_at,
      total: nextMeta.total,
    })
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

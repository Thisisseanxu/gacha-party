import { requireAdmin } from '../../_shared/admin-token.js'
import {
  jsonResponse,
  optionsResponse,
  verifyLicenseForEdgeOne,
} from '../../_shared/gacha-records.js'
import {
  HZ_BAN_PREFIX,
  HZ_PENDING_META_PREFIX,
  HZ_PENDING_PREFIX,
  enforceSubmitRateLimit,
  getHuizhangKv,
  guideId,
  listJsonByPrefix,
  normalizeGuide,
  pendingKey,
  readAdminBootstrap,
  readGuides,
  readMeta,
  saveSubmitRateLimit,
  validateGuidePayload,
  writeGuides,
} from '../../_shared/huizhang-guides.js'

function routePath(request) {
  return new URL(request.url).pathname.replace(/^\/api\/hz\/?/, '').replace(/\/+$/, '')
}

function methodNotAllowed() {
  return jsonResponse({ message: '请求方法不支持' }, 405)
}

function notFound() {
  return jsonResponse({ message: '接口不存在' }, 404)
}

async function requireAdminOrResponse(request, env) {
  const result = await requireAdmin(request, env)
  return result.response || null
}

async function getGuides(env) {
  const { version, updated_at, guides } = await readGuides(getHuizhangKv(env))
  return jsonResponse({ version, updated_at, guides })
}

async function getVersion(env) {
  const meta = await readMeta(getHuizhangKv(env))
  return jsonResponse({
    version: meta.version || '0',
    updated_at: Number(meta.updated_at || 0),
  })
}

async function submitGuide(request, env) {
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
  if (await kv.get(`${HZ_BAN_PREFIX}${userId}`)) {
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
      id: key.slice(HZ_PENDING_PREFIX.length),
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
}

async function getAdminBootstrap(request, env) {
  const denied = await requireAdminOrResponse(request, env)
  if (denied) return denied
  return jsonResponse(await readAdminBootstrap(getHuizhangKv(env)))
}

async function getPending(request, env) {
  const denied = await requireAdminOrResponse(request, env)
  if (denied) return denied

  const page = Math.max(
    1,
    Number.parseInt(new URL(request.url).searchParams.get('page') || '1', 10),
  )
  const perPage = 20
  const items = (await listJsonByPrefix(getHuizhangKv(env), HZ_PENDING_PREFIX))
    .filter((item) => item.key && !item.key.startsWith(HZ_PENDING_META_PREFIX))
    .sort((left, right) => Number(right.submitted_at || 0) - Number(left.submitted_at || 0))

  return jsonResponse({
    total: items.length,
    page,
    perPage,
    items: items.slice((page - 1) * perPage, page * perPage),
  })
}

function normalizeKeyList(keys, prefix) {
  return Array.from(new Set((Array.isArray(keys) ? keys : []).map(String))).filter(
    (key) =>
      key.startsWith(prefix) &&
      (prefix !== HZ_PENDING_PREFIX || !key.startsWith(HZ_PENDING_META_PREFIX)),
  )
}

async function saveAll(request, env) {
  const denied = await requireAdminOrResponse(request, env)
  if (denied) return denied

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ message: '请求体格式错误' }, 400)
  }

  const kv = getHuizhangKv(env)
  const currentMeta = await readMeta(kv)
  if (String(body?.baseVersion ?? '') !== String(currentMeta.version || '0')) {
    return jsonResponse(
      {
        message: '攻略数据已被其他窗口修改，请重新加载后再保存。',
        currentVersion: currentMeta.version || '0',
      },
      409,
    )
  }

  const guides = (Array.isArray(body?.guides) ? body.guides : []).map((guide) =>
    normalizeGuide({ ...guide, id: guide.id || guideId() }),
  )
  for (const guide of guides) {
    const message = validateGuidePayload(guide)
    if (message) return jsonResponse({ message }, 400)
  }

  const nextMeta = await writeGuides(kv, guides, currentMeta)
  for (const key of normalizeKeyList(body?.deletePendingKeys, HZ_PENDING_PREFIX)) {
    await kv.delete(key)
  }

  const nextBanUserIds = new Set()
  for (const ban of Array.isArray(body?.bans) ? body.bans : []) {
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
  for (const key of normalizeKeyList(body?.deleteBanKeys, HZ_BAN_PREFIX)) {
    if (!nextBanUserIds.has(key.slice(HZ_BAN_PREFIX.length))) await kv.delete(key)
  }

  return jsonResponse({
    message: '全部修改已保存',
    version: nextMeta.version,
    updated_at: nextMeta.updated_at,
    total: nextMeta.total,
  })
}

async function patchGuide(request, env, id) {
  const denied = await requireAdminOrResponse(request, env)
  if (denied) return denied

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ message: '请求体格式错误' }, 400)
  }

  const kv = getHuizhangKv(env)
  const { guides, meta } = await readGuides(kv)
  const index = guides.findIndex((guide) => String(guide.id) === id)
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
}

async function deleteGuide(request, env, id) {
  const denied = await requireAdminOrResponse(request, env)
  if (denied) return denied

  const kv = getHuizhangKv(env)
  const { guides, meta } = await readGuides(kv)
  const nextGuides = guides.filter((guide) => String(guide.id) !== id)
  if (nextGuides.length === guides.length) return jsonResponse({ message: '攻略不存在' }, 404)
  const nextMeta = await writeGuides(kv, nextGuides, meta)
  return jsonResponse({ message: '已删除', newVersion: nextMeta.version })
}

async function featureGuide(request, env, id) {
  const denied = await requireAdminOrResponse(request, env)
  if (denied) return denied

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ message: '请求体格式错误' }, 400)
  }

  const kv = getHuizhangKv(env)
  const { guides, meta } = await readGuides(kv)
  const index = guides.findIndex((guide) => String(guide.id) === id)
  if (index === -1) return jsonResponse({ message: '攻略不存在' }, 404)
  guides[index] = normalizeGuide({ ...guides[index], is_featured: body.featured ? 1 : 0 })
  const nextMeta = await writeGuides(kv, guides, meta)
  return jsonResponse({
    message: body.featured ? '已设为精选' : '已取消精选',
    newVersion: nextMeta.version,
  })
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return optionsResponse()

  try {
    const path = routePath(request)
    if (path === 'guides') return request.method === 'GET' ? getGuides(env) : methodNotAllowed()
    if (path === 'version') return request.method === 'GET' ? getVersion(env) : methodNotAllowed()
    if (path === 'submit') {
      return request.method === 'POST' ? submitGuide(request, env) : methodNotAllowed()
    }
    if (path === 'admin/bootstrap') {
      return request.method === 'GET'
        ? getAdminBootstrap(request, env)
        : methodNotAllowed()
    }
    if (path === 'admin/pending') {
      return request.method === 'GET' ? getPending(request, env) : methodNotAllowed()
    }
    if (path === 'admin/save-all') {
      return request.method === 'POST' ? saveAll(request, env) : methodNotAllowed()
    }

    const featureMatch = /^admin\/guide\/([^/]+)\/feature$/.exec(path)
    if (featureMatch) {
      return request.method === 'PATCH'
        ? featureGuide(request, env, decodeURIComponent(featureMatch[1]))
        : methodNotAllowed()
    }

    const guideMatch = /^admin\/guide\/([^/]+)$/.exec(path)
    if (guideMatch) {
      const id = decodeURIComponent(guideMatch[1])
      if (request.method === 'PATCH') return patchGuide(request, env, id)
      if (request.method === 'DELETE') return deleteGuide(request, env, id)
      return methodNotAllowed()
    }

    return notFound()
  } catch (error) {
    return jsonResponse({ message: error.message }, error.status || 500)
  }
}

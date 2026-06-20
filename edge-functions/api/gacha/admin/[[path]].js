import { downloadBatch, downloadKey } from '../../../_shared/gacha-admin-download.js'
import { exportKv } from '../../../_shared/gacha-admin-export.js'
import { getKeys } from '../../../_shared/gacha-admin-keys.js'
import { jsonResponse, optionsResponse } from '../../../_shared/gacha-kv-http.js'

function routePath(request) {
  return new URL(request.url).pathname
    .replace(/^\/api\/gacha\/admin\/?/, '')
    .replace(/\/+$/, '')
}

function methodNotAllowed() {
  return jsonResponse({ message: '请求方法不支持' }, 405)
}

export async function onRequest(context) {
  const { request } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  const path = routePath(request)
  if (path === 'keys') return request.method === 'GET' ? getKeys(context) : methodNotAllowed()
  if (path === 'download') {
    if (request.method === 'GET') return downloadKey(context)
    if (request.method === 'POST') return downloadBatch(context)
    return methodNotAllowed()
  }
  if (path === 'export') return request.method === 'GET' ? exportKv(context) : methodNotAllowed()
  return jsonResponse({ message: '接口不存在' }, 404)
}

const textEncoder = new TextEncoder()

function isAdminUser(userId) {
  const userIdStr = String(userId)
  return userIdStr.startsWith('33') && userIdStr.length === 9
}

function bytesFromBase64Url(value) {
  const base64 = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ message: '未授权，请重新登录' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token || !env.ADMIN_SECRET) return null

  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return null
    const payloadBase64 = token.slice(0, dotIndex)
    const signatureBase64 = token.slice(dotIndex + 1)
    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(env.ADMIN_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      bytesFromBase64Url(signatureBase64),
      textEncoder.encode(payloadBase64),
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(bytesFromBase64Url(payloadBase64)))
    if (!payload.exp || Date.now() >= payload.exp) return null
    if (!isAdminUser(payload.userId)) return null
    return payload
  } catch {
    return null
  }
}

export async function requireAdmin(request, env) {
  const admin = await verifyAdminToken(request, env)
  if (!admin) return { response: unauthorizedResponse() }
  return { admin }
}

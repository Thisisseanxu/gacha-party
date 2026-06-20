import { isAdminUser, verifyLicenseForEdgeOne } from './gacha-records.js'

const textEncoder = new TextEncoder()

function base64UrlFromBytes(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function hashPassword(password, salt = '') {
  const hash = await crypto.subtle.digest('SHA-256', textEncoder.encode(`${salt}${password}`))
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function signAdminToken(env, userId) {
  if (!env.ADMIN_SECRET) throw new Error('ADMIN_SECRET 未设置。')
  const now = Date.now()
  const payload = base64UrlFromBytes(
    textEncoder.encode(
      JSON.stringify({
        userId: String(userId),
        iat: now,
        exp: now + 24 * 60 * 60 * 1000,
      }),
    ),
  )
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(env.ADMIN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload))
  return `${payload}.${base64UrlFromBytes(new Uint8Array(signature))}`
}

export async function verifyAdminLogin(password, activationKey, env) {
  const expectedHash = env.ADMIN_PASSWORD || env.ADMIN_PASSWORD_HASH
  if (!expectedHash || !env.ADMIN_SECRET) {
    const error = new Error('管理员功能未配置')
    error.status = 503
    throw error
  }
  if (!password || typeof password !== 'string') {
    const error = new Error('请输入密码')
    error.status = 400
    throw error
  }
  if (!activationKey || typeof activationKey !== 'string') {
    const error = new Error('请输入管理员激活码')
    error.status = 400
    throw error
  }

  const actualHash = await hashPassword(password, env.ADMIN_SALT || '')
  if (actualHash !== expectedHash) {
    const error = new Error('密码错误')
    error.status = 401
    throw error
  }

  const { userId } = verifyLicenseForEdgeOne(activationKey, env.PUBLIC_KEY)
  if (!isAdminUser(userId)) {
    const error = new Error('该激活码不是管理员账号')
    error.status = 403
    throw error
  }
  return { userId: String(userId) }
}

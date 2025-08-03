import { Hono } from 'hono'
import { cors } from 'hono/cors'
import nacl from 'tweetnacl'
import { Buffer } from 'buffer'

/**
 * 将 URL-safe Base64 字符串转换为标准的 Base64 字符串。
 * @param {string} base64url - URL-safe Base64 字符串。
 * @returns {string} 标准的 Base64 字符串。
 */
function base64UrlToStandard(base64url) {
  // 替换 URL-safe 字符为标准字符
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  // 根据需要补全 '=' 填充
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return base64 + padding
}

const app = new Hono()

// 对需要被外部前端访问的路径启用CORS
app.use('/get-record', cors())
app.use('/upload-record', cors())

/**
 * 在 Worker 内部验证激活码的有效性。
 * @param {string} licenseKey - 从客户端传来的完整激活码。
 * @returns {Promise<{userId: number, isExpired: boolean}>} 返回包含用户ID和过期状态的对象。
 * @throws {Error} 如果验证失败，则抛出错误。
 */
async function verifyLicenseForWorker(licenseKey, base64Key) {
  if (!base64Key) {
    throw new Error('环境变量 PUBLIC_KEY 未设置，请检查配置。')
  }
  const derKey = Buffer.from(base64Key, 'base64')
  const publicKey = derKey.subarray(derKey.length - 32)
  const standardBase64Key = base64UrlToStandard(licenseKey)
  const fullData = Buffer.from(standardBase64Key, 'base64')

  const signatureLength = 64
  if (fullData.length <= signatureLength) {
    throw new Error('传入的激活码格式不正确，请检查客户端逻辑。')
  }

  const payload = fullData.subarray(0, fullData.length - signatureLength)
  const signature = fullData.subarray(fullData.length - signatureLength)

  // 使用公钥验证签名
  const isVerified = nacl.sign.detached.verify(payload, signature, publicKey)
  if (!isVerified) throw new Error('激活码签名验证失败。')

  const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  const userId = dataView.getUint32(0, true) // 小端序读取用户ID
  const expiryTimestamp = Number(dataView.getBigUint64(4, true)) // 小端序读取过期时间戳

  return { userId, isExpired: expiryTimestamp < Math.floor(Date.now() / 1000) }
}
/**
 * GET /get-record
 * 验证激活码并从KV中获取用户对应的抽卡记录。
 */
app.get('/get-record', async (c) => {
  try {
    const licenseKey = c.req.header('X-License-Key')
    if (!licenseKey) {
      return c.text('请求头中缺少 X-License-Key', 400)
    }

    // 在服务器端进行最终的、可信的验证 (当前为限时免费功能，获取记录时，不强制检查过期)
    const { userId, isExpired } = await verifyLicenseForWorker(licenseKey, c.env.PUBLIC_KEY)
    const playerId = c.req.header('X-Player-Id')
    if (!playerId) {
      return c.text('请求头中缺少 X-Player-Id', 400)
    }
    const userIdStr = String(userId)
    if (
      playerId &&
      !(
        playerId === userIdStr ||
        playerId === userIdStr.slice(2) ||
        (userIdStr.startsWith('33') && userIdStr.length === 9 && !isExpired)
      )
    ) {
      return c.text('查询记录的玩家id和激活码对应的玩家id不一致', 403)
    }

    const kvKey = `record_${playerId}`
    const value = await c.env.GACHA_PARTY_RECORDS.get(kvKey)

    if (value === null) {
      return c.text(`数据库中没有找到玩家ID ${playerId} 对应的记录`, 404)
    }

    return c.text(value)
  } catch (error) {
    return c.text(`验证失败： ${error.message}`, 403)
  }
})

/**
 * POST /upload-record
 * 验证激活码，并将请求体中的数据存入到KV中。
 */
app.post('/upload-record', async (c) => {
  try {
    // 从请求头获取激活码
    const licenseKey = c.req.header('X-License-Key')
    if (!licenseKey) {
      return c.text('请求头中缺少 X-License-Key', 400)
    }

    // 在服务器端进行严格验证
    const { userId, isExpired } = await verifyLicenseForWorker(licenseKey, c.env.PUBLIC_KEY)
    // 限时免费功能，暂不验证过期状态
    // if (isExpired) {
    //   return c.text('激活码已过期，请联系管理员获取新的激活码', 403)
    // }
    const playerId = c.req.header('X-Player-Id')
    if (!playerId) {
      return c.text('请求头中缺少 X-Player-Id', 400)
    }

    const userIdStr = String(userId)
    if (
      playerId &&
      !(playerId === userIdStr || (userIdStr.startsWith('33') && userIdStr.length === 9))
    ) {
      return c.text('上传的抽卡记录不属于激活码对应的玩家！', 403)
    }

    // 获取请求体中的数据 (前端已处理好的Base64字符串)
    const payload = await c.req.text()
    if (!payload) {
      return c.text('请求体为空，没有需要上传的数据', 400)
    }

    // 将数据存入KV
    const kvKey = `record_${playerId}`
    const existingRecord = await c.env.GACHA_PARTY_RECORDS.getWithMetadata(kvKey)
    if (existingRecord && existingRecord.metadata && existingRecord.metadata.lastUpdated) {
      const lastUpdated = existingRecord.metadata.lastUpdated
      const now = Date.now()
      const writeTimeLimit = playerId === userIdStr ? 20 * 60 * 60 * 1000 : 60 * 1000 // 普通用户每20小时可写一次，管理员每分钟可写一次

      // 如果上次更新时间在限制时间内，则拒绝写入
      if (now - lastUpdated < writeTimeLimit) {
        const timeLeft = writeTimeLimit - (now - lastUpdated)
        const errorResponse = {
          message: `上传过于频繁，请在 ${Math.ceil(timeLeft / 1000)} 秒后再试。`,
          timeLeft: timeLeft,
        }
        return c.json(errorResponse, 429)
      }
    }

    await c.env.GACHA_PARTY_RECORDS.put(kvKey, payload, {
      metadata: { lastUpdated: Date.now() },
    })

    // 返回成功信息
    return c.text(`玩家ID ${playerId} 的记录已成功上传/更新。`, 200)
  } catch (error) {
    // 如果验证失败或发生其他错误，返回403 Forbidden
    return c.text(`上传失败： ${error.message}`, 403)
  }
})

export default app

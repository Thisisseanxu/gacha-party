import { Hono } from 'hono'
import { cors } from 'hono/cors'
import nacl from 'tweetnacl'
import { Buffer } from 'buffer'

const base64Key = 'MCowBQYDK2VwAyEADP+1gTQo1/wWSQMCphypaTCzj4gJsmzugl2dURn0Q6I='
const derKey = Buffer.from(base64Key, 'base64')
const publicKey = derKey.subarray(derKey.length - 32)
function base64UrlToStandard(base64url) {
  // 替换 URL-safe 字符为标准字符
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  // 根据需要补全 '=' 填充
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return base64 + padding
}

const app = new Hono()

// 只对 /get-record 路径启用CORS，防止其他路径调用api
app.use('/get-record', cors())

// 验证激活码的辅助函数 (Worker内部使用)
async function verifyLicenseForWorker(licenseKey, verifyTimestamp = false) {
  const standardBase64Key = base64UrlToStandard(licenseKey)
  const fullData = Buffer.from(standardBase64Key, 'base64')

  const signatureLength = 64
  if (fullData.length <= signatureLength) {
    throw new Error('传入的激活码格式不正确，请检查客户端逻辑。')
  }

  const payload = fullData.subarray(0, fullData.length - signatureLength)
  const signature = fullData.subarray(fullData.length - signatureLength)

  const isVerified = nacl.sign.detached.verify(payload, signature, publicKey)
  if (!isVerified) throw new Error('传入的激活码格式不正确，请检查客户端逻辑。')

  const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  const userId = dataView.getUint32(0, true) // 按小端序读取字节并指定类型，格式目前为<IQ
  const expiryTimestamp = Number(dataView.getBigUint64(4, true))

  if (verifyTimestamp) {
    const nowTimestamp = Math.floor(Date.now() / 1000)
    if (nowTimestamp > expiryTimestamp) {
      throw new Error('激活码已过期，请检查客户端逻辑。')
    }
  }

  return { userId }
}

// 验证激活码并获取用户id对应的抽卡记录
app.get('/get-record', async (c) => {
  try {
    const licenseKey = c.req.header('X-License-Key')
    if (!licenseKey) {
      return c.text('Missing X-License-Key header', 400)
    }

    // 在服务器端进行最终的、可信的验证
    const { userId } = await verifyLicenseForWorker(licenseKey)

    const kvKey = `record_${userId}`
    const value = await c.env.GACHA_PARTY_RECORDS.get(kvKey)

    if (value === null) {
      return c.text(`数据库中没有找到玩家ID ${userId} 对应的记录`, 404) // 如果没有找到记录，返回404 Not Found
    }

    return c.text(value)
  } catch (error) {
    return c.text(`验证失败： ${error.message}`, 403) // 发生错误时返回403 Forbidden
  }
})

export default app

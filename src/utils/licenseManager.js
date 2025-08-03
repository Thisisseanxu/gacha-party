import nacl from 'tweetnacl'
import { Buffer } from 'buffer'

const base64Key = 'MCowBQYDK2VwAyEADP+1gTQo1/wWSQMCphypaTCzj4gJsmzugl2dURn0Q6I='

// 将 Base64 字符串解码
const derKey = Buffer.from(base64Key, 'base64')

// 提取32字节的公钥
const publicKeyBytes = derKey.subarray(derKey.length - 32)

/**
 * 将 URL-safe Base64 字符串转换为标准 Base64 字符串
 * @param {string} base64url - URL-safe Base64 字符串
 * @returns {string} - 标准 Base64 字符串
 */
function base64UrlToStandard(base64url) {
  // 替换 URL-safe 字符为标准字符
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  // 根据需要补全 '=' 填充
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return base64 + padding
}

/**
 * 验证并解码激活码
 * @param {string} licenseKey - 用户输入的激活码
 * @returns {{success: boolean, message: string, userId: number | null, isExpired: boolean}} - 返回的结果
 */
export function verifyLicense(licenseKey) {
  // 将 URL-safe Base64 转换为标准格式
  const standardBase64Key = base64UrlToStandard(licenseKey)
  const fullData = Buffer.from(standardBase64Key, 'base64')

  // Ed25519 签名固定为 64 字节

  const signatureLength = 64
  if (fullData.length <= signatureLength) {
    return { success: false, message: '激活码格式错误', userId: null, isExpired: true }
  }

  // 从数据中分离出 payload 和 signature
  const payload = fullData.subarray(0, fullData.length - signatureLength)
  const signature = fullData.subarray(fullData.length - signatureLength)

  // 使用正确提取的公钥验证签名
  const isVerified = nacl.sign.detached.verify(payload, signature, publicKeyBytes)

  if (!isVerified) {
    return { success: false, message: '无效的激活码', userId: null, isExpired: true }
  }

  // payload 长度应为 4 (userId) + 8 (timestamp) = 12 字节
  if (payload.length < 12) {
    return {
      success: false,
      message: '激活码数据格式不正确',
      userId: null,
      isExpired: true,
    }
  }

  const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

  // 按小端序读取字节并指定类型，格式目前为<IQ
  const userId = dataView.getUint32(0, true)
  const expiryTimestamp = Number(dataView.getBigUint64(4, true))

  // 检查激活码是否已过期
  const nowTimestamp = Math.floor(Date.now() / 1000)
  if (nowTimestamp > expiryTimestamp) {
    return { success: true, message: '激活码已过期', userId: userId, isExpired: true }
  }

  return { success: true, message: '获取成功', userId, isExpired: false }
}

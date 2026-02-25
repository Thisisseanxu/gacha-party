import pako from 'pako'

/**
 * 将攻略数据编码为可分享的短代码
 * @param {Object} data - 攻略数据对象
 * @returns {string} base64编码的压缩字符串
 */
export const encodeStrategy = (data) => {
  const json = JSON.stringify(data)
  const compressed = pako.deflate(json, { level: 9 })
  let binary = ''
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i])
  }
  return btoa(binary)
}

/**
 * 将短代码解码为攻略数据
 * @param {string} code - base64编码的短代码
 * @returns {Object} 攻略数据对象
 */
export const decodeStrategy = (code) => {
  const binary = atob(code)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const json = pako.inflate(bytes, { to: 'string' })
  return JSON.parse(json)
}

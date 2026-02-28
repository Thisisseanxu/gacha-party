// 内存中临时存储跨路由传递的自定义角色。
// 用模块变量替代 sessionStorage，避免将 blob URL 序列化导致的 QuotaExceededError。
// Vue SPA 路由跳转不会卸载当前 JS 环境，blob URL 在导航后仍然有效。
let _pending = null

export function setPendingCustomChar(char) {
  _pending = char
}

export function takePendingCustomChar() {
  const c = _pending
  _pending = null
  return c
}

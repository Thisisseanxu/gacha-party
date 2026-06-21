const QQ_API_URL = 'https://open.mobile.qq.com/sdk/qqapi.js'
const QQ_API_SCRIPT_ID = 'mobile-qq-js-api'

let qqApiPromise = null
let shareSyncObserver = null
let shareSyncTimer = null

export function isMobileQQ() {
  return /\bQQ\/[\d.]+/i.test(navigator.userAgent)
}

function truncateUtf8(value, maximumBytes) {
  let result = ''
  let bytes = 0

  for (const character of String(value || '')) {
    const characterBytes = new TextEncoder().encode(character).length
    if (bytes + characterBytes > maximumBytes) break
    result += character
    bytes += characterBytes
  }

  return result
}

function normalizeShareData({ title, description, url, imageUrl }) {
  const requestedUrl = new URL(url, window.location.origin)
  let shareUrl = requestedUrl.href

  if (new TextEncoder().encode(shareUrl).length > 120) {
    shareUrl = `${requestedUrl.origin}${requestedUrl.pathname}`
  }
  if (new TextEncoder().encode(shareUrl).length > 120) {
    shareUrl = requestedUrl.origin
  }

  return {
    title: truncateUtf8(title, 45),
    desc: truncateUtf8(description, 60),
    share_url: shareUrl,
    image_url: imageUrl,
    back: true,
  }
}

export function loadMobileQQApi() {
  if (!isMobileQQ()) return Promise.resolve(null)
  if (window.mqq?.invoke) return Promise.resolve(window.mqq)
  if (qqApiPromise) return qqApiPromise

  qqApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(QQ_API_SCRIPT_ID)
    const script = existingScript || document.createElement('script')
    const timeout = window.setTimeout(() => {
      script.remove()
      reject(new Error('手机 QQ 分享组件加载超时'))
    }, 8000)

    const handleLoad = () => {
      window.clearTimeout(timeout)
      if (window.mqq?.invoke) {
        resolve(window.mqq)
      } else {
        reject(new Error('当前 QQ 版本未提供网页分享接口'))
      }
    }

    const handleError = () => {
      window.clearTimeout(timeout)
      script.remove()
      reject(new Error('手机 QQ 分享组件加载失败'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      script.id = QQ_API_SCRIPT_ID
      script.src = QQ_API_URL
      script.async = true
      document.head.appendChild(script)
    }
  }).catch((error) => {
    qqApiPromise = null
    throw error
  })

  return qqApiPromise
}

export async function configureMobileQQShare({ title, description, url, imageUrl }) {
  const mqq = await loadMobileQQApi()
  if (!mqq) return false

  const shareData = normalizeShareData({ title, description, url, imageUrl })

  mqq.invoke('data', 'setShareInfo', shareData)

  if (mqq.ui?.setOnShareHandler && mqq.ui?.shareMessage) {
    mqq.ui.setOnShareHandler((type) => {
      mqq.ui.shareMessage({
        ...shareData,
        share_type: Number(type),
      })
    })
  }

  return true
}

export async function shareWebpageToQQ({ title, description, url, imageUrl }, callback) {
  const mqq = await loadMobileQQApi()
  if (!mqq) return false

  if (!mqq.ui?.shareMessage) {
    throw new Error('当前 QQ 版本不支持网页主动分享')
  }

  mqq.ui.shareMessage(
    {
      ...normalizeShareData({ title, description, url, imageUrl }),
      share_type: 0,
    },
    callback,
  )

  return true
}

function readCurrentShareData() {
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  const imageUrl =
    document.querySelector('meta[itemprop="image"]')?.getAttribute('content') ||
    new URL('/images/icons/icon-512x512.png', window.location.origin).href

  return {
    title: document.title,
    description,
    url: window.location.href,
    imageUrl: new URL(imageUrl, window.location.origin).href,
  }
}

export function installMobileQQShareSync() {
  if (!isMobileQQ() || shareSyncObserver) return

  const sync = () => {
    if (shareSyncTimer) window.clearTimeout(shareSyncTimer)
    shareSyncTimer = window.setTimeout(() => {
      shareSyncTimer = null
      configureMobileQQShare(readCurrentShareData()).catch((error) => {
        console.warn('同步手机 QQ 分享卡片失败:', error)
      })
    }, 50)
  }

  shareSyncObserver = new MutationObserver(sync)
  shareSyncObserver.observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['content', 'href'],
  })

  sync()
}

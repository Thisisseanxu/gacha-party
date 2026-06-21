const QQ_API_URL = 'https://open.mobile.qq.com/sdk/qqapi.js'
const QQ_API_SCRIPT_ID = 'mobile-qq-js-api'

let qqApiPromise = null

export function isMobileQQ() {
  return /\bQQ\/[\d.]+/i.test(navigator.userAgent)
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

  const shareData = {
    title,
    desc: description,
    share_url: url,
    image_url: imageUrl,
    back: true,
  }

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

export async function shareImageToQQ(dataUrl, callback) {
  const mqq = await loadMobileQQApi()
  if (!mqq) return false

  mqq.invoke(
    'Qzone',
    'sharePicture',
    {
      type: '0',
      base64: dataUrl.replace('data:image/jpeg;', 'data:image/jpg;'),
    },
    callback,
  )

  return true
}

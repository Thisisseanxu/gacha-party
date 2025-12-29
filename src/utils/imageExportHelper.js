import html2canvas from 'html2canvas'

/**
 * 将 URL 转换为 Data URI (Base64)
 * 利用 fetch API，可以触发 PWA Service Worker 缓存，避免重复网络请求
 * @param {string} url 资源链接
 * @returns {Promise<string>} Base64 字符串
 */
export const toDataURL = async (url) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('资源转换为Base64失败:', url, e)
    // 失败时返回原 URL，让 html2canvas 尝试自己处理
    return url
  }
}

/**
 * 优化克隆后的 DOM 文档
 * 主要工作是将所有图片和背景图转换为 Base64，避免渲染时的网络请求
 * @param {Document} clonedDoc html2canvas 克隆后的文档对象
 */
export const optimizeForSnapshot = async (clonedDoc) => {
  const imagePromises = []

  // 1. 处理 <img> 标签
  const images = clonedDoc.querySelectorAll('img')
  images.forEach((img) => {
    // 过滤掉已经是 data: 的，过滤掉非 http/相对路径的
    if (
      img.src &&
      (img.src.startsWith('http') || img.src.startsWith('/') || img.src.startsWith('.')) &&
      !img.src.startsWith('data:')
    ) {
      const promise = toDataURL(img.src)
        .then((dataUrl) => {
          img.src = dataUrl
        })
        .catch((err) => console.error(`转换图片失败: ${img.src}`, err))
      imagePromises.push(promise)
    }
  })

  // 2. 处理 background-image 样式
  const allElements = clonedDoc.querySelectorAll('*')
  allElements.forEach((el) => {
    const win = el.ownerDocument.defaultView || window
    const style = win.getComputedStyle(el)
    const bgImage = style.backgroundImage
    // 检查背景图是否是 url() 格式且不是 data URI
    if (bgImage && bgImage.startsWith('url(') && !bgImage.includes('data:')) {
      const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/)
      if (match && match[1]) {
        let url = match[1].replace(/['"]/g, '') // 去除可能存在的引号
        const promise = toDataURL(url)
          .then((dataUrl) => {
            el.style.backgroundImage = `url(${dataUrl})`
          })
          .catch((err) => console.error(`转换背景图失败: ${url}`, err))
        imagePromises.push(promise)
      }
    }
  })

  await Promise.all(imagePromises)
}

/**
 * 通用截图导出函数
 * @param {HTMLElement} element 要截图的 DOM 元素
 * @param {string} fileName 下载的文件名
 * @param {Object} options html2canvas 的额外配置选项
 */
export const exportImage = async (element, fileName, options = {}) => {
  if (!element) {
    console.error('未找到要截图的元素')
    return
  }

  try {
    const canvas = await html2canvas(element, {
      useCORS: true, // 允许跨域图片
      backgroundColor: null, // 透明背景
      ...options, // 合并传入的配置
      onclone: async (clonedDoc) => {
        // 执行通用的资源优化
        await optimizeForSnapshot(clonedDoc)

        // 如果外部传入了 onclone，也执行它
        if (options.onclone) {
          await options.onclone(clonedDoc)
        }
      },
    })

    // 创建下载链接
    const link = document.createElement('a')
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('生成图片失败:', err)
    throw err
  }
}

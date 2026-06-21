const DEFAULT_TITLE = '织夜工具箱｜盲盒派对玩家工具站'
const DEFAULT_DESCRIPTION =
  '面向《盲盒派对》玩家的实用工具箱，提供抽卡模拟、抽卡记录分析、徽章攻略、UP 计时器与角色性格匹配等功能。'
const DEFAULT_IMAGE_PATH = '/images/icons/icon-512x512.png'

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })
}

function toAbsoluteUrl(path) {
  return new URL(path, window.location.origin).href
}

export function updatePageMeta(route) {
  const title = route.meta.title || DEFAULT_TITLE
  const description = route.meta.description || DEFAULT_DESCRIPTION
  const image = toAbsoluteUrl(route.meta.image || DEFAULT_IMAGE_PATH)
  const canonicalUrl = toAbsoluteUrl(route.path)

  document.title = title

  upsertMeta('meta[name="description"]', {
    name: 'description',
    itemprop: 'description',
    content: description,
  })
  upsertMeta('meta[itemprop="name"]', { itemprop: 'name', content: title })
  upsertMeta('meta[itemprop="image"]', { itemprop: 'image', content: image })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
  upsertMeta('meta[property="og:description"]', {
    property: 'og:description',
    content: description,
  })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image })
  upsertMeta('meta[property="og:image:secure_url"]', {
    property: 'og:image:secure_url',
    content: image,
  })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
  upsertMeta('meta[name="twitter:description"]', {
    name: 'twitter:description',
    content: description,
  })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = canonicalUrl
}

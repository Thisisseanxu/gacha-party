import { cardPools } from '@/data/cardPools.js'
import { cardMap } from '@/data/cards.js'

export const SITE_ORIGIN = 'https://mhpd.fans'
export const DEFAULT_TITLE = '织夜工具箱｜盲盒派对玩家工具站'
export const DEFAULT_DESCRIPTION =
  '面向《盲盒派对》玩家的实用工具箱，提供抽卡模拟、抽卡记录分析、徽章攻略、UP 计时器与角色性格匹配等功能。'
export const DEFAULT_IMAGE_PATH = '/images/icons/icon-512px.png'

function absoluteUrl(path) {
  return new URL(path || '/', SITE_ORIGIN).href
}

export function resolvePageMeta(route) {
  const resolved = {
    title: route.meta?.title || DEFAULT_TITLE,
    description: route.meta?.description || DEFAULT_DESCRIPTION,
    image: route.meta?.image || DEFAULT_IMAGE_PATH,
    robots: route.meta?.robots || 'index,follow',
  }

  if (route.name === '抽卡模拟器') {
    const poolId = String(route.params?.poolId || '')

    if (poolId === 'custom') {
      resolved.title = '自定义卡池模拟 | 织夜工具箱'
      resolved.description = '打开并体验分享的《盲盒派对》自定义卡池配置。'
    } else {
      const pool = cardPools[poolId]
      if (pool) {
        resolved.title = `${pool.name}卡池模拟 | 织夜工具箱`
        resolved.description = `模拟《盲盒派对》「${pool.name}」卡池抽取、保底与 UP 机制。`
        resolved.image = pool.imageUrl || resolved.image
      }
    }
  }

  if (route.name === '角色徽章攻略') {
    const charId = String(route.params?.charId || '')
    const card = cardMap.get(charId)
    if (card) {
      resolved.title = `${card.name}徽章攻略 | 织夜工具箱`
      resolved.description = `查看《盲盒派对》${card.name}的徽章搭配、属性与实战攻略。`
      resolved.image = card.qban_url || card.imageUrl || resolved.image
    }
  }

  return {
    ...resolved,
    image: absoluteUrl(resolved.image),
    canonical: absoluteUrl(route.path || '/'),
  }
}

export function createPageHead(route) {
  const meta = resolvePageMeta(route)
  const qqMeta = import.meta.env.SSR
    ? [
        {
          key: 'qq-name',
          id: 'qq-share-name',
          name: 'qq-share-name',
          itemprop: 'name',
          content: meta.title,
        },
        {
          key: 'qq-image',
          id: 'qq-share-image',
          name: 'qq-share-image',
          itemprop: 'image',
          content: meta.image,
        },
      ]
    : []

  return {
    title: meta.title,
    link: [{ key: 'canonical', rel: 'canonical', href: meta.canonical }],
    meta: [
      {
        key: 'description',
        name: 'description',
        itemprop: 'description',
        content: meta.description,
      },
      { key: 'robots', name: 'robots', content: meta.robots },
      ...qqMeta,
      { key: 'og-title', property: 'og:title', content: meta.title },
      { key: 'og-description', property: 'og:description', content: meta.description },
      { key: 'og-url', property: 'og:url', content: meta.canonical },
      { key: 'og-image', property: 'og:image', content: meta.image },
      { key: 'og-image-secure', property: 'og:image:secure_url', content: meta.image },
      { key: 'twitter-title', name: 'twitter:title', content: meta.title },
      { key: 'twitter-description', name: 'twitter:description', content: meta.description },
      { key: 'twitter-image', name: 'twitter:image', content: meta.image },
    ],
  }
}

function upsertClientMeta(id, attributes) {
  let element = document.getElementById(id)
  if (!element) {
    element = document.createElement('meta')
    element.id = id
    document.head.appendChild(element)
  }

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }
}

export function syncClientShareMeta(route) {
  if (typeof document === 'undefined') return

  const meta = resolvePageMeta(route)
  upsertClientMeta('qq-share-name', {
    name: 'qq-share-name',
    itemprop: 'name',
    content: meta.title,
  })
  upsertClientMeta('qq-share-image', {
    name: 'qq-share-image',
    itemprop: 'image',
    content: meta.image,
  })
}

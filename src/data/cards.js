import { THEMES } from '@/data/constant.js'

const DATA_URL = '/data/cards.json'
const CACHE_TTL = 5 * 60 * 1000

export const allCards = []
export const cardMap = new Map()
export const cardNameMap = new Map()

let loadPromise = null
let loadedAt = 0

function normalizeCard(card) {
  const theme = typeof card.theme === 'string' ? THEMES[card.theme] || null : card.theme || null
  return {
    ...card,
    id: String(card.id),
    theme,
  }
}

export function setCards(cards, options = {}) {
  allCards.splice(0, allCards.length, ...cards.map(normalizeCard))
  loadedAt = options.fetchedAt || Date.now()

  cardMap.clear()
  cardNameMap.clear()
  for (const card of allCards) {
    cardMap.set(card.id, card)
    cardNameMap.set(card.name, card)
  }

  return allCards
}

export async function loadCards(options = {}) {
  const now = Date.now()
  if (allCards.length && !options.force && now - loadedAt < CACHE_TTL) return allCards
  if (loadPromise && !options.force) return loadPromise

  loadPromise = fetch(DATA_URL, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`加载角色数据失败：HTTP ${res.status}`)
      return res.json()
    })
    .then((data) => {
      if (!Array.isArray(data)) throw new Error('角色数据格式错误')
      const fetchedAt = Date.now()
      return setCards(data, { fetchedAt })
    })
    .finally(() => {
      loadPromise = null
    })

  return loadPromise
}

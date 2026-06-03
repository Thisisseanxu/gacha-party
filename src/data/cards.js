import { THEMES } from '@/data/constant.js'

const DATA_URL = '/data/cards.json'

export const allCards = []
export const cardMap = new Map()
export const cardNameMap = new Map()

let loadPromise = null

function normalizeCard(card) {
  const theme = typeof card.theme === 'string' ? THEMES[card.theme] || null : card.theme || null
  return {
    ...card,
    id: String(card.id),
    theme,
  }
}

export function setCards(cards) {
  allCards.splice(0, allCards.length, ...cards.map(normalizeCard))

  cardMap.clear()
  cardNameMap.clear()
  for (const card of allCards) {
    cardMap.set(card.id, card)
    cardNameMap.set(card.name, card)
  }

  return allCards
}

export async function loadCards(options = {}) {
  if (allCards.length && !options.force) return allCards
  if (loadPromise && !options.force) return loadPromise

  loadPromise = fetch(`${DATA_URL}?t=${Date.now()}`)
    .then((res) => {
      if (!res.ok) throw new Error(`加载角色数据失败：HTTP ${res.status}`)
      return res.json()
    })
    .then((data) => {
      if (!Array.isArray(data)) throw new Error('角色数据格式错误')
      return setCards(data)
    })
    .finally(() => {
      loadPromise = null
    })

  return loadPromise
}

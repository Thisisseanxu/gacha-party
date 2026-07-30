import { SP, SSR, SR, R } from '@/data/constant.js'
import { cardNameMap } from '@/data/cards.js'
import { logger } from '@/utils/logger.js'
import cardPoolsData from 'virtual:gacha-party-card-pools'

function normalizeCardPools(data) {
  const entries = Array.isArray(data) ? data : data?.pools
  if (!Array.isArray(entries)) {
    throw new Error('card_pools_full.json 格式错误：pools 必须是数组')
  }

  return entries.map((entry) => {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[1] !== 'object') {
      throw new Error('card_pools_full.json 格式错误：卡池必须为 [id, config]')
    }
    return [String(entry[0]), entry[1]]
  })
}

const rawCardPoolsInOrder = normalizeCardPools(cardPoolsData)

function parsePoolTimeMs(time) {
  if (!time) return null
  if (time instanceof Date) return time.getTime()
  if (typeof time !== 'string') return null

  const match = time.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!match) {
    const parsed = Date.parse(time)
    return Number.isNaN(parsed) ? null : parsed
  }

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime()
}

export function isCardPoolEnded(pool, now = Date.now()) {
  const finishTimeMs = parsePoolTimeMs(pool?.finishTime)
  return finishTimeMs !== null && finishTimeMs < now
}

export function isCardPoolAvailable(pool, now = Date.now()) {
  return !isCardPoolEnded(pool, now)
}

export const cardPoolsInOrder = rawCardPoolsInOrder.slice().sort((a, b) => {
  const aEnded = isCardPoolEnded(a[1])
  const bEnded = isCardPoolEnded(b[1])
  if (aEnded === bEnded) return 0
  return aEnded ? 1 : -1
})

export const cardPools = Object.fromEntries(cardPoolsInOrder)

function getCardsByNames(names, rarity = -1) {
  return names
    .map((name) => {
      const card = cardNameMap.get(name)
      if (!card) {
        logger.warn(`找不到 ${name} 对应的角色数据。请检查角色名称是否正确。`)
        return null
      }
      if (card.rarity !== -1 && card.rarity !== rarity) {
        logger.warn(
          `名称为 ${name} 的角色的稀有度是 ${card.rarity} 与 ${rarity} 不匹配。请检查角色数据。`,
        )
      }
      return card
    })
    .filter(Boolean)
}

export function getFullCardPoolData(poolId) {
  const poolConfig = cardPools[poolId]
  if (!poolConfig) return null

  const convertNamesToIds = (names) => {
    if (!Array.isArray(names)) return []
    return names
      .map((name) => {
        const card = cardNameMap.get(name)
        if (!card) {
          logger.warn(`找不到名称为 "${name}" 的角色，请检查 card_pools_full.json 配置`)
          return null
        }
        return card.id
      })
      .filter(Boolean)
  }

  const rulesWithIds = {}
  if (poolConfig.rules) {
    for (const [rarity, rule] of Object.entries(poolConfig.rules)) {
      const newRule = { ...rule }
      if (newRule.UpCards) newRule.UpCards = convertNamesToIds(newRule.UpCards)
      if (newRule.doubleRateCards) {
        newRule.doubleRateCards = convertNamesToIds(newRule.doubleRateCards)
      }
      if (Array.isArray(newRule.UpGroups)) {
        newRule.UpGroups = newRule.UpGroups.map((group) => ({
          ...group,
          cards: convertNamesToIds(group.cards),
        }))
      }
      rulesWithIds[rarity] = newRule
    }
  }

  const cardIds = {}
  if (poolConfig.cardNames) {
    for (const [rarity, names] of Object.entries(poolConfig.cardNames)) {
      cardIds[rarity] = convertNamesToIds(names)
    }
  }

  const fullCardsInPool = []
  for (const rarity of [SP, SSR, SR, R]) {
    if (poolConfig.cardNames?.[rarity]) {
      fullCardsInPool.push(...getCardsByNames(poolConfig.cardNames[rarity], rarity))
    }
  }

  return { ...poolConfig, rules: rulesWithIds, cardIds, cards: fullCardsInPool }
}

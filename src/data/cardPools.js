import * as RARITY from '@/data/rarity.js'
import { allCards } from '@/data/cards.js'

// 定义卡池配置
export const cardPools = {
  // 测试限定卡池
  TestUR: {
    name: '测试限定卡池',
    hasUR: true, // 是否包含UR
    // 基础概率
    rates: {
      [RARITY.UR]: 0.02,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
      // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.UR]: {
        pity: 60, // 60抽必出UR
        boostAfter: 40, // 40抽后每抽提升UR概率
        boost: 0.001, // 每抽提升2%的UR概率（41抽UR变为 0.04，42抽0.06......）
      },
      [RARITY.SSR]: {
        doubleRateCards: [1307], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.UR]: [11006],
      [RARITY.SSR]: [1301, 1302, 1305, 1307, 1310],
      [RARITY.SR]: [1103, 1104, 1207, 1303, 1405, 1604, 1606, 1702, 1205, 1304, 1805, 1202],
      [RARITY.R]: [1101, 1204, 1107, 1306, 1406, 1607],
    },
  }, // 测试常驻卡池
  TestSSR: {
    name: '测试常驻卡池',
    // 基础概率
    hasUR: false, // 是否包含UR
    rates: {
      [RARITY.SSR]: 0.08,
      [RARITY.SR]: 0.2,
      // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SSR]: {
        pity: 60, // 60抽必出SSR
        pityUP: true, // 触发保底时必定抽到UP的SSR
        UpTrigger: true, // 该卡池有UP机制
        UpCards: [1105], // UP角色列表（如果这次SSR不是UP角色，则下次必定是列表中的角色）
      },
    },
    cardIds: {
      [RARITY.SSR]: [1105, 1102],
      [RARITY.SR]: [1103],
      [RARITY.R]: [1101],
    },
  },
}

/**
 * 跟据稀有度和ID列表从 allCards 中获取角色对象
 *
 * @param {Array<number>} ids - 角色的ID列表
 * @param {string|number} [rarity] - 可选，用于验证稀有度是否匹配。-1表示不进行稀有度验证。
 * @returns {Array<Object>} 返回一个包含角色对象的数组。
 */
function getCardsByIds(ids, rarity = -1) {
  return ids
    .map((id) => {
      const card = allCards.find((c) => c.id === id)
      if (!card) {
        console.warn(`找不到 ${id} 对应的角色数据。请检查角色ID是否正确。`)
        return null
      }
      if (card.rarity !== -1 && card.rarity !== rarity) {
        console.warn(
          `ID为 ${id} 的角色的稀有度是 ${card.rarity} 与 ${rarity} 不匹配。请检查角色数据。`,
        )
      }
      return card
    })
    .filter(Boolean) // 过滤掉为 null 的值
}

/**
 * 根据卡池配置信息获取完整的角色数据
 *
 * @param {Array<number>} ids - 角色的ID列表
 * @returns {Array<Object>} 返回一个包含 角色对象的数组。
 */
export function getFullCardPoolData(poolId) {
  const poolConfig = cardPools[poolId]
  if (!poolConfig) {
    return null
  }

  const fullCardsInPool = []
  // 遍历每种稀有度，并根据ID从 allCards 中获取完整角色数据
  for (const rarity of [RARITY.UR, RARITY.SSR, RARITY.SR, RARITY.R]) {
    if (poolConfig.cardIds[rarity]) {
      fullCardsInPool.push(...getCardsByIds(poolConfig.cardIds[rarity], rarity))
    }
  }

  return {
    ...poolConfig,
    cards: fullCardsInPool, // 将完整角色数据添加到返回对象中
  }
}

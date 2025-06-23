import * as RARITY from '@/data/rarity.js'
import { allCards } from '@/data/cards.js'

// 定义卡池配置
export const cardPools = {
  // 网游卡池
  108: {
    name: '塔菲扭蛋',
    imageUrl: '/images/cardpools-icon/108.webp',
    // 基础概率
    rates: {
      [RARITY.UR]: 0.015,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
      // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.UR]: {
        pity: 60, // 60抽必出UR
        boostAfter: 40, // 40抽后每抽提升UR概率
        boost: 0.02, // 每抽提升2%的UR概率（41抽UR变为 0.04，42抽0.06......）
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
  },
  // 电玩大战卡池
  3: {
    name: '常驻扭蛋-电玩大战',
    imageUrl: '/images/cardpools-icon/3.webp',
    // 基础概率
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
        UpCards: [1301, 1302, 1305, 1310], // UP角色列表（如果这次SSR不是UP角色，则下次必定是列表中的角色）
      },
    },
    cardIds: {
      [RARITY.SSR]: [
        1102, 1106, 1108, 1109, 1201, 1209, 1203, 1204999, 1301, 1302, 1305, 1310, 1401, 1402, 1403,
        1701, 1703, 1704, 1708, 1601, 1602, 1603, 1608, 1801, 1806, 1803, 1504, 1804,
      ],
      [RARITY.SR]: [1103, 1104, 1207, 1303, 1405, 1604, 1606, 1702, 1205, 1304, 1805, 1202],
      [RARITY.R]: [1101, 1204, 1107, 1306, 1406, 1607],
    },
  },
  // 只出UR池
  TestUpdate: {
    name: '超绝卡池',
    // 基础概率
    rates: {
      [RARITY.UR]: 1.0,
    },
    cardIds: {
      [RARITY.UR]: [1110, 1111, 1709, 11006, 1211, 1609],
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

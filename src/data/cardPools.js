import * as RARITY from '@/data/rarity.js'
import { allCards } from '@/data/cards.js'

// 因代码限制，目前每个卡池必须包含rules属性，空的也可以
// 定义卡池配置
export const cardPools = {
  // 入梦童话国
  UR03: {
    type: '限定',
    name: '入梦童话国',
    imageUrl: '/images/cardpools-icon/21.webp',
    // 基础概率
    rates: {
      [RARITY.UR]: 0.02,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.UR]: {
        pity: 60, // 60抽必出UR
        boostAfter: 40, // 40抽后每抽提升UR概率
        boost: 0.02, // 每抽提升2%的UR概率（41抽UR变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: [1906, 1211],
      },
      [RARITY.SSR]: {
        doubleRateCards: [1206], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.UR]: [1906, 1211],
      [RARITY.SSR]: [1201, 1203, 1204999, 1206, 1209],
      [RARITY.SR]: [1103, 1104, 1207, 1303, 1405, 1604, 1606, 1702, 1205, 1304, 1805, 1202],
      [RARITY.R]: [1101, 1204, 1107, 1306, 1406, 1607],
    },
  },
  // 网游卡池
  UR02: {
    type: '限定',
    name: '塔菲扭蛋',
    imageUrl: '/images/cardpools-icon/108.webp',
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
  // 车手盲盒机
  UR999: {
    type: '限定',
    name: '车手盲盒机',
    imageUrl: '/images/cardpools-icon/29.webp',
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
        boost: 0.02, // 每抽提升2%的UR概率（41抽UR变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: [1110, 1111],
      },
      [RARITY.SSR]: {
        doubleRateCards: [1105], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.UR]: [1110, 1111],
      [RARITY.SSR]: [1105, 1102, 1108, 1106, 1109],
      [RARITY.SR]: [1103, 1104, 1207, 1303, 1405, 1604, 1606, 1702, 1205, 1304, 1805, 1202],
      [RARITY.R]: [1101, 1204, 1107, 1306, 1406, 1607],
    },
  },
  // 常驻扭蛋
  Normal01: {
    type: '常驻',
    name: '常驻扭蛋',
    imageUrl: '/images/cardpools-icon/9.webp',
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
        SelectUpCardsGroup: true, // 新增：标记为可从多组UP中选择
        UpGroups: [
          {
            id: 1, // UP组ID
            name: '甜品派对', // 组的显示名称
            image_url: '/images/cardpools-icon/1.webp', // 组的封面图片URL
            cards: [1102, 1106, 1108, 1109], // 该组包含的卡片ID列表
          },
          {
            id: 2,
            name: '梦境守护',
            image_url: '/images/cardpools-icon/2.webp',
            cards: [1201, 1209, 1203, 1204999],
          },
          {
            id: 3,
            name: '电玩大战',
            image_url: '/images/cardpools-icon/3.webp',
            cards: [1301, 1302, 1305, 1310],
          },
          {
            id: 4,
            name: '电音国度',
            image_url: '/images/cardpools-icon/4.webp',
            cards: [1401, 1402, 1403, 1504],
          },
          {
            id: 6,
            name: '冰雪世界',
            image_url: '/images/cardpools-icon/6.webp',
            cards: [1701, 1703, 1704, 1708],
          },
          {
            id: 5,
            name: '火焰国度',
            image_url: '/images/cardpools-icon/5.webp',
            cards: [1601, 1602, 1603, 1608],
          },
          {
            id: 8,
            name: '水流世界',
            image_url: '/images/cardpools-icon/8.webp',
            cards: [1801, 1806, 1803, 1804],
          },
        ],
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
  // 所有UR角色卡池
  AllUR: {
    type: '特殊',
    name: '超爽UR卡池',
    rates: {
      [RARITY.UR]: 1.0,
    },
    cardIds: {
      [RARITY.UR]: allCards.filter((card) => card.rarity === RARITY.UR).map((card) => card.id),
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

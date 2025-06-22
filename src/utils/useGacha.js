import { computed, ref } from 'vue'
import { getFullCardPoolData } from '@/data/cardPools' // 从 cardPools.js 导入获取完整卡池数据的函数
import * as RARITY from '@/data/rarity.js'

/**
 * 加权随机函数，根据权重随机选择一个数组项
 * @param {Array<{value: any, weight: number}>} weightedItems - 包含值和权重的数组
 * @returns {any} 随机选中的值
 */
function weightedRandom(weightedItems) {
  const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0)
  let randomNum = Math.random() * totalWeight

  for (let i = 0; i < weightedItems.length; i++) {
    randomNum -= weightedItems[i].weight
    if (randomNum <= 0) {
      return weightedItems[i].value
    }
  }
  return weightedItems[weightedItems.length - 1].value
}
/**
 * 抽卡逻辑Hook，包括单抽、十连抽、抽卡历史记录等功能。
 *
 * @param {string} poolId - 当前抽卡池的唯一标识符，用于获取对应卡池数据。
 * @returns {import('vue').ComputedRef<Object>} currentPool - 当前卡池的详细数据（响应式）。
 * @returns {import('vue').Ref<Array>} gachaHistory - 抽卡历史记录（响应式）。
 * @returns {import('vue').Ref<Array>} lastPulledCards - 最近一次抽到的角色列表（响应式）。
 * @returns {import('vue').ComputedRef<number>} totalPulls - 总抽卡次数（响应式）。
 * @returns {import('vue').ComputedRef<Object>} rarityCounts - 各稀有度累计抽到的数量统计（响应式）。
 * @returns {Function} performSinglePull - 执行单抽操作的函数。
 * @returns {Function} performTenPulls - 执行十连操作的函数。
 *
 * @example
 * const {
 *   currentPool,
 *   gachaHistory,
 *   lastPulledCards,
 *   totalPulls,
 *   totalRarity,
 *   performSinglePull,
 *   performTenPulls
 * } = useGacha('standard');
 */
export function useGacha(poolId) {
  // 根据传入的 poolId 获取当前卡池的详细数据
  const currentPool = computed(() => getFullCardPoolData(poolId))

  // 存储抽卡历史和当前抽到的角色
  const gachaHistory = ref([]) // 存储所有抽到的角色
  const lastPulledCards = ref([]) // 存储最近一次抽到的角色（单抽或十连）

  // 总抽卡次数
  const totalPulls = computed(() => gachaHistory.value.length)

  // 稀有度计数器
  const rarityCounts = computed(() => {
    const counts = {
      [RARITY.UR]: 0,
      [RARITY.SSR]: 0,
      [RARITY.SR]: 0,
      [RARITY.R]: 0,
    }
    gachaHistory.value.forEach((card) => {
      if (counts[card.rarity] !== undefined) {
        counts[card.rarity]++
      }
    })
    return counts
  })

  /**
   * 根据当前卡池的概率和累计抽卡次数，获取调整后的稀有度概率
   * (这里是预留功能点，目前只返回基础概率)
   * @param {number} currentTotalPulls - 当前总抽卡次数
   * @returns {Object<string, number>} 调整后的稀有度概率对象
   */
  const getAdjustedRates = (currentTotalPulls) => {
    console.log(`当前总抽卡次数: ${currentTotalPulls}`)
    // TODO: 在这里实现保底、概率提升等逻辑
    // 例如：
    // if (currentTotalPulls > 50 && !hasPulledSSRInLast(50)) {
    //     adjustedRates[RARITY.SSR] += 0.01;
    // }
    // 目前返回基础概率
    return currentPool.value.rates
  }

  /**
   * 执行一次抽卡操作
   * @param {number} currentTotalPulls - 用于调整概率的当前总抽卡次数
   * @returns {Object} 抽到的角色对象
   */
  const pullOne = (currentTotalPulls) => {
    if (!currentPool.value || !currentPool.value.cards) {
      console.error('卡池数据未加载或无效。')
      return null
    }

    // 获取调整后的稀有度概率
    const adjustedRates = getAdjustedRates(currentTotalPulls)

    // const UpTrigger_SSR = currentPool.value.rules[RARITY.SSR]?.UpTrigger || false
    const UpTrigger_SSR = false

    // 构建加权稀有度列表
    const rarityWeights = []

    // 向稀有度权重列表中添加每个稀有度的概率
    Object.entries(adjustedRates).forEach(([rarity, rate]) => {
      rarityWeights.push({
        value: rarity,
        weight: rate,
      })
    })

    // 自动计算最低稀有度 R 的权重，确保 R 稀有度的权重是剩余概率
    const sumOfDefinedRates = rarityWeights.reduce((sum, item) => sum + item.weight, 0)
    rarityWeights.push({
      value: RARITY.R,
      weight: Math.max(0, 1 - sumOfDefinedRates), // 确保概率不为负
    })

    // 抽卡！根据概率随机选择一个稀有度
    const selectedRarity = weightedRandom(rarityWeights)

    let possibleCards = []
    // 获取抽到的稀有度对应的所有角色，如果触发对应稀有度的UP机制，则只获取UP角色
    if (UpTrigger_SSR && selectedRarity === RARITY.SSR) {
      // 如果是up机制，筛选出up角色
      possibleCards = currentPool.value.cards.filter(
        (card) => card.rarity === selectedRarity && card.isUp,
      )
    } else {
      // 如果不是up机制，获取所有该稀有度的角色
      possibleCards = currentPool.value.cards.filter((card) => card.rarity === selectedRarity)
    }

    // 如果某种稀有度没有角色，返回错误角色
    if (possibleCards.length === 0) {
      console.warn(`当前卡池中没有 ${selectedRarity} 稀有度的角色。`)
      return { id: 'error', name: '卡池出现错误', rarity: RARITY.R }
    }

    // 在该稀有度的角色中随机选择一张 (平分概率)
    const randomIndex = Math.floor(Math.random() * possibleCards.length)
    const pulledCard = possibleCards[randomIndex]

    return pulledCard
  }

  /**
   * 执行单抽
   */
  const performSinglePull = () => {
    const card = pullOne(totalPulls.value) // 传入当前总抽卡次数
    if (card) {
      gachaHistory.value.push(card)
      lastPulledCards.value = [card] // 单抽只显示一张
    }
  }

  /**
   * 执行十连抽
   */
  const performTenPulls = () => {
    const pulledCards = []
    for (let i = 0; i < 10; i++) {
      const card = pullOne(totalPulls.value + i) // 每次抽卡时更新累计次数
      if (card) {
        pulledCards.push(card)
      }
    }
    gachaHistory.value.push(...pulledCards) // 将十张角色添加到历史记录
    lastPulledCards.value = pulledCards // 十连抽显示十张
  }

  return {
    currentPool,
    gachaHistory,
    lastPulledCards,
    totalPulls,
    rarityCounts,
    performSinglePull,
    performTenPulls,
  }
}

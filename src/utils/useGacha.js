import { computed, ref, watchEffect, toValue } from 'vue'
import { getFullCardPoolData } from '@/data/cardPools' // 从 cardPools.js 导入获取完整卡池数据的函数
import * as RARITY from '@/data/rarity.js'
import { logger } from '@/utils/logger.js'

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
 * @param {import('vue').Ref<number>} selectedUpCard - 可选，用户选择的UP角色ID（如果有UP机制）。
 * @returns {import('vue').ComputedRef<Object>} currentPool - 当前卡池的详细数据（响应式）。
 * @returns {import('vue').Ref<Array>} gachaHistory - 抽卡历史记录（响应式）。
 * @returns {import('vue').Ref<Array>} lastPulledCards - 最近一次抽到的角色列表（响应式）。
 * @returns {import('vue').ComputedRef<number>} totalPulls - 总抽卡次数（响应式）。
 * @returns {import('vue').ComputedRef<Object>} rarityCounts - 各稀有度累计抽到的数量统计（响应式）。
 * @returns {Function} performSinglePull - 执行单抽操作的函数。
 * @returns {Function} performTenPulls - 执行十连操作的函数。
 * @returns {Function} setSelectedUpGroup - 设置用户选择的UP组的函数
 * @returns {import('vue').Ref<Object>} selectedUpGroup - 当前选择的UP组
 *
 * @example
 * const {
 *   currentPool,
 *   gachaHistory,
 *   lastPulledCards,
 *   totalPulls,
 *   totalRarity,
 *   performSinglePull,
 *   performTenPulls,
 *   setSelectedUpGroup,
 *   selectedUpGroup,
 *   performMultiPulls,
 * } = useGacha('standard');
 */
export function useGacha(poolId, selectedUpCard) {
  // 根据传入的 poolId 获取当前卡池的详细数据
  const currentPool = computed(() => getFullCardPoolData(toValue(poolId)))

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

  // 保底规则的抽数计数器
  const pityCounters = ref(0)

  // 递增概率规则的抽数计数器
  const boostCounters = ref(0)

  // UP保底状态：true表示下一次是UP，false表示正常判断
  const nextIsUP = ref(false)

  const pityRarity = ref(null)
  const pityValue = ref(null)
  const boostRarity = ref(null)
  const boostAfter = ref(null)
  const boostValue = ref(null)
  const pityUP = ref(false)
  const UpTrigger = ref(false) // 代表当前卡池是否有UP触发规则
  const poolHasSelectUpCardsGroup = ref(false) // 标记卡池是否支持UP组选择
  const selectableUpGroups = ref([]) // 存储可供选择的UP组的完整数据
  const selectedUpGroup = ref(null) // 用户选择的UP组

  watchEffect(() => {
    // 当 currentPool.value 变化时，这个watchEffect会重新运行
    // 它会追踪 currentPool.value 及其内部属性的变化
    if (currentPool.value && currentPool.value.rules) {
      // 重置，确保每次卡池规则变化时都重新计算
      pityRarity.value = null
      pityValue.value = null
      pityUP.value = false
      boostRarity.value = null
      boostAfter.value = null
      boostValue.value = null

      poolHasSelectUpCardsGroup.value = false
      selectableUpGroups.value = []
      selectedUpGroup.value = null

      // 遍历规则，查找哪个稀有度有pity规则
      for (const [rarity, rule] of Object.entries(currentPool.value.rules)) {
        if (rule) {
          if (rule.pity) {
            pityRarity.value = rarity
            pityValue.value = rule.pity
            pityUP.value = rule.pityUP || false
          }
          if (rule.boostAfter && rule.boost) {
            boostRarity.value = rarity
            boostAfter.value = rule.boostAfter
            boostValue.value = rule.boost
          }
          if (rule.UpTrigger) {
            UpTrigger.value = true // 如果有UP触发规则，则设置为true
          }
          selectableUpGroups.value = rule.UpGroups || [] // 获取可选UP组数据

          if (rule.SelectUpCardsGroup && rule.UpGroups) {
            poolHasSelectUpCardsGroup.value = true
            selectedUpGroup.value = rule.UpGroups[0] // 默认选择第一个UP组
          }
        }
      }
    }
  })

  /**
   * 设置用户选择的UP组
   * @param {string} group - 选择的UP组
   */
  const setSelectedUpGroup = (group) => {
    if (!poolHasSelectUpCardsGroup.value) {
      logger.warn('当前卡池不支持UP组选择。')
      return
    }
    // 检查选择的UP组是否在可选组列表中
    if (!group || !selectableUpGroups.value.some((g) => g.id === group.id)) {
      logger.warn(`尝试选择无效的UP组: ${group.name} (${group.id})`)
      return
    }
    // 如果选择的UP组在可选组列表中，则设置为当前选择
    selectedUpGroup.value = group
    logger.log(`已选择UP组: ${group.name} (${group.id}， UP池变为：${group.cards})`)
  }

  /**
   * 根据当前卡池的概率和累计抽卡次数，获取调整后的稀有度概率
   * @param {number} currentTotalPulls - 当前总抽卡次数
   * @returns {Object<string, number>} 调整后的稀有度概率对象
   */
  const getAdjustedRates = () => {
    if (!currentPool.value || !currentPool.value.rates) {
      return {}
    }

    const baseRates = { ...currentPool.value.rates } // 复制基础概率

    // 计算R的概率
    baseRates[RARITY.R] = 1 - Object.values(baseRates).reduce((sum, rate) => sum + rate, 0)

    let adjustedRates = { ...baseRates } // 存储调整后的概率
    // 如果有boost规则，且当前抽卡次数大于boostAfter，则调整概率
    // 每抽额外提升boost值*（boostCounters-boostAfter）的概率
    if (boostRarity.value && boostCounters.value > boostAfter.value) {
      const boostIncrement = boostValue.value * (boostCounters.value - boostAfter.value)
      adjustedRates[boostRarity.value] = +(
        adjustedRates[boostRarity.value] + boostIncrement
      ).toFixed(4)
      // 多出来的概率从R中扣除
      adjustedRates[RARITY.R] = +(adjustedRates[RARITY.R] - boostIncrement).toFixed(4)

      // DEBUG: 在触发boost机制时提示
      logger.log('Boost触发：当前稀有度概率:', adjustedRates)
    }

    return adjustedRates
  }

  /**
   * 执行一次抽卡操作
   * @returns {Object} 抽到的角色对象
   */
  const pullOne = () => {
    if (!currentPool.value || !currentPool.value.cards) {
      logger.error('卡池数据未加载或无效。')
      return null
    }

    boostCounters.value++
    pityCounters.value++

    let selectedRarity = RARITY.R // 默认稀有度为R;
    // 如果pityRarity不为空且当前抽卡次数达到保底，直接选中对应的稀有度
    if (pityRarity.value && pityCounters.value >= pityValue.value) {
      selectedRarity = pityRarity.value
      if (pityUP.value) {
        nextIsUP.value = true // 如果是UP保底，则下次必定是UP角色
        // DEBUG: 输出UP保底信息
        logger.log('触发UP保底：抽到UP(组)的角色')
      } else {
        // DEBUG: 输出保底信息
        logger.log(`触发保底：抽到 ${selectedRarity} 稀有度角色`)
      }
      pityCounters.value = 0 // 重置保底计数器
    } else {
      // 否则计算稀有度概率并抽取
      const adjustedRates = getAdjustedRates()
      // 将概率转换为加权数组
      const rarityWeights = Object.keys(adjustedRates).map((rarity) => ({
        value: rarity,
        weight: adjustedRates[rarity],
      }))
      // 抽卡！根据概率随机选择一个稀有度
      selectedRarity = weightedRandom(rarityWeights)
      // 如果选中的稀有度是保底稀有度，则重置保底计数器
      if (selectedRarity === pityRarity.value) {
        pityCounters.value = 0 // 重置保底计数器
      }
      // DEBUG: 输出当前抽到的稀有度和所有稀有度的概率
      // logger.log(`抽到的稀有度：${selectedRarity}，当前概率：`, adjustedRates)
    }

    // 如果当前稀有度有boost规则，且没有选中对应的稀有度，则增加boost计数器
    if (boostRarity.value && selectedRarity === boostRarity.value) {
      boostCounters.value = 0 // 重置boost计数器
    }

    const rulesForRarity = currentPool.value.rules
      ? currentPool.value.rules[selectedRarity]
      : undefined
    let possibleCards = []
    // 获取抽到的稀有度对应的所有角色，如果触发对应稀有度的UP机制，则只获取UP角色
    if (nextIsUP.value && rulesForRarity?.UpTrigger) {
      let upCardPoolIds = []
      // 确定UP池中有哪些角色ID
      if (rulesForRarity.SelectUpCards && selectedUpCard?.value) {
        // 如果是“自选UP”模式并且已选择UP角色，UP池就是用户选择的UP角色
        upCardPoolIds = [selectedUpCard.value]
      } else if (
        // 如果是“可选UP组”模式，并且用户已选择UP组，UP池就是用户选择的UP组中的角色
        rulesForRarity.SelectUpCardsGroup &&
        selectedUpGroup.value
      ) {
        // UP组的角色ID列表
        upCardPoolIds = selectedUpGroup.value.cards || []
      } else {
        // 否则，UP池是规则中定义的所有UP角色
        upCardPoolIds = rulesForRarity.UpCards || []
      }
      possibleCards = currentPool.value.cards.filter(
        (card) => card.rarity === selectedRarity && upCardPoolIds.includes(card.id),
      )
      nextIsUP.value = false // 重置UP状态
      // DEBUG: 输出UP角色信息
      logger.log(`触发UP机制，当前UP角色（组）：`, upCardPoolIds)
    } else {
      possibleCards = currentPool.value.cards.filter((card) => card.rarity === selectedRarity)
    }

    // 如果某种稀有度没有角色，返回错误角色
    if (possibleCards.length === 0) {
      logger.warn(`出现卡池没有对应卡的情况，请检查卡池设置和保底规则。`)
      return { id: 404, name: '卡池出现错误', rarity: '', imageUrl: '/images/cards/404.webp ' }
    }

    let pulledCard = null
    // 在该稀有度的角色中随机选择一张 (平分概率)
    // 如果possible cards当前有doubleRateCards，则这张卡的概率会翻倍
    if (possibleCards.length === 1) {
      pulledCard = possibleCards[0] // 如果只有一张卡，直接返回
    } else {
      if (currentPool.value.rules && rulesForRarity?.doubleRateCards) {
        const doubleRateCards = rulesForRarity.doubleRateCards
        possibleCards = possibleCards.map((card) => {
          if (doubleRateCards.includes(card.id)) {
            // DEBUG: 输出双倍卡信息
            logger.log(`触发双倍卡机制，当前的卡为`, card)
            return { value: card, weight: 2 } // 将双倍概率卡的权重设置为2
          }
          return { value: card, weight: 1 } // 其他卡的权重为1
        })
      } else {
        possibleCards = possibleCards.map((card) => ({ value: card, weight: 1 })) // 所有卡的权重为1
      }
      pulledCard = weightedRandom(possibleCards)
    }

    if (
      // 如果有UP机制且需要选择UP角色，且当前抽到的不是选中的角色，则下次必定是UP角色
      (rulesForRarity?.UpTrigger &&
        rulesForRarity.SelectUpCards &&
        pulledCard.id !== selectedUpCard?.value) ||
      // 如果有UP机制且需要选择UP组，且当前抽到的不是选中的UP组中的角色，则下次必定是UP角色
      (rulesForRarity?.UpTrigger &&
        rulesForRarity.SelectUpCardsGroup &&
        selectedUpGroup.value &&
        !selectedUpGroup.value.cards.includes(pulledCard.id))
    ) {
      nextIsUP.value = true // 下次抽卡必定是UP角色
    }

    return pulledCard
  }

  /**
   * 执行单抽
   */
  const performSinglePull = () => {
    const card = pullOne() // 传入当前总抽卡次数
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
      const card = pullOne() // 每次抽卡时更新累计次数
      if (card) {
        pulledCards.push(card)
      }
    }
    gachaHistory.value.push(...pulledCards) // 将十张角色添加到历史记录
    lastPulledCards.value = pulledCards // 十连抽显示十张
  }

  /**
   * 测试用：执行指定次数的批量抽卡模拟。
   * 它直接返回本次批量抽卡的结果统计。
   * @param {number} pullCount - 要模拟的抽卡次数。
   * @returns {Object} 本次抽卡各稀有度的数量统计，例如 { UR: 1, SSR: 10, ... }。
   */
  const performMultiPulls = (pullCount) => {
    logger.log(`模拟抽卡,卡池：${currentPool.value?.id} 执行 ${pullCount} 次抽卡`)

    if (!currentPool.value || pullCount <= 0) {
      return null
    }
    // 使用单独计数器来统计各稀有度的数量
    const localRarityCounts = {
      [RARITY.UR]: 0,
      [RARITY.SSR]: 0,
      [RARITY.SR]: 0,
      [RARITY.R]: 0,
    }

    for (let i = 0; i < pullCount; i++) {
      // 循环执行单抽逻辑
      const pulledCard = pullOne()

      if (pulledCard) {
        // 将抽到的角色添加到计数器
        if (localRarityCounts[pulledCard.rarity] !== undefined) {
          localRarityCounts[pulledCard.rarity]++
        }
      }
    }

    // 6. 返回本次模拟的统计结果
    return localRarityCounts
  }

  return {
    currentPool,
    gachaHistory,
    lastPulledCards,
    totalPulls,
    rarityCounts,
    performSinglePull,
    performTenPulls,
    performMultiPulls,
    setSelectedUpGroup,
    selectedUpGroup,
  }
}

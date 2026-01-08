<template>
  <div class="custom-gacha-page-background">
    <div class="config-container">
      <div class="button-group">
        <router-link to="/chouka" class="back-home-button-config">返回主页</router-link>
        <button @click="resetConfiguration" class="reset-button-config">重置配置</button>
      </div>
      <h1 class="config-title">创建自定义卡池</h1>
      <p class="config-description">在这里创建你独一无二的梦想卡池！</p>

      <div class="config-section">
        <h2 class="section-title">1. 基础信息</h2>
        <div class="form-group">
          <label for="poolName">卡池名称</label>
          <input id="poolName" type="text" v-model="customPool.name" placeholder="例如：我的梦想卡池" />
        </div>
      </div>

      <div class="config-section">
        <h2 class="section-title">2. 选择卡牌加入卡池</h2>
        <div v-for="rarity in rarities" :key="rarity" class="rarity-section">
          <h3 :class="`text-rarity-${rarity.toLowerCase()}`">{{ rarity }} 卡池</h3>
          <div class="card-selector-grid">
            <div v-for="card in groupedCards[rarity]" :key="card.id" class="card-option"
              :class="{ selected: selectedCardIds[rarity].includes(card.id) }"
              @click="toggleCardSelection(rarity, card.id)">
              <img :src="card.imageUrl" :alt="card.name" class="card-image" />
              <div class="card-name">{{ card.name }}</div>
              <div class="checkmark">✔</div>
            </div>
          </div>
        </div>
      </div>

      <div class="config-section">
        <h2 class="section-title">3. 配置概率和规则</h2>
        <div class="form-grid-rates">
          <div class="form-group">
            <label for="spRate">SP 基础概率 (%)</label>
            <input id="spRate" type="number" v-model.number="customPool.rates.SP" min="0" max="100" step="0.01" />
          </div>
          <div class="form-group">
            <label for="ssrRate">SSR 基础概率 (%)</label>
            <input id="ssrRate" type="number" v-model.number="customPool.rates.SSR" min="0" max="100" step="0.1" />
          </div>
          <div class="form-group">
            <label for="srRate">SR 基础概率 (%)</label>
            <input id="srRate" type="number" v-model.number="customPool.rates.SR" min="0" max="100" step="1" />
          </div>
        </div>

        <div class="advanced-rules">
          <div v-if="selectedCardIds.SP.length > 0">
            <h3 class="subsection-title">SP角色UP候选 (可多选，将在抽卡页进行N选1)</h3>
            <div class="card-selector-grid-small">
              <div v-for="cardId in selectedCardIds.SP" :key="cardId" class="card-option-small"
                :class="{ selected: upCandidateIds.includes(cardId) }" @click="toggleUpCandidate(cardId)">
                <img :src="cardMap.get(cardId)?.imageUrl" :alt="cardMap.get(cardId)?.name" class="card-image" />
                <div class="checkmark">✔</div>
              </div>
            </div>
          </div>

          <div v-if="selectedCardIds.SSR.length > 0">
            <h3 class="subsection-title">SSR角色双倍概率 (可多选)</h3>
            <div class="card-selector-grid-small">
              <div v-for="cardId in selectedCardIds.SSR" :key="cardId" class="card-option-small"
                :class="{ selected: doubleRateSSRIds.includes(cardId) }" @click="toggleDoubleRateSSR(cardId)">
                <img :src="cardMap.get(cardId)?.imageUrl" :alt="cardMap.get(cardId)?.name" class="card-image" />
                <div class="checkmark">✔</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button @click="navigateToGachaPage" class="finalize-button">创建卡池并开始抽卡</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as RARITY from '@/data/rarity.js'
import { cardMap, allCards } from '@/data/cards.js'
import { colors } from '@/styles/colors.js'
import pako from 'pako'
import { logger } from '@/utils/logger'

const router = useRouter()

// 定义用于localStorage的key
const storageKey = 'customGachaPoolConfig'

// 默认配置的函数
const getDefaultConfig = () => ({
  name: '我的梦想卡池',
  rates: { SP: 1.25, SSR: 8, SR: 20 },
  selectedCardIds: { SP: [], SSR: [], SR: [], R: [] },
  upCandidateIds: [],
  doubleRateSSRIds: [],
})

// 配置状态
// 使用默认配置函数进行初始化
const customPool = ref({
  name: getDefaultConfig().name,
  rates: { ...getDefaultConfig().rates },
})
const selectedCardIds = ref(getDefaultConfig().selectedCardIds)
const upCandidateIds = ref(getDefaultConfig().upCandidateIds)
const doubleRateSSRIds = ref(getDefaultConfig().doubleRateSSRIds)

const rarities = [RARITY.SP, RARITY.SSR, RARITY.SR, RARITY.R]
const groupedCards = rarities.reduce((acc, rarity) => {
  acc[rarity] = allCards.filter((card) => card.rarity === rarity)
  return acc
}, {})

// 页面挂载时加载配置
onMounted(() => {
  const savedConfig = localStorage.getItem(storageKey)
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig)
      customPool.value.name = parsedConfig.name
      customPool.value.rates = parsedConfig.rates
      selectedCardIds.value = parsedConfig.selectedCardIds
      upCandidateIds.value = parsedConfig.upCandidateIds
      doubleRateSSRIds.value = parsedConfig.doubleRateSSRIds
    } catch (e) {
      logger.error('解析自定义卡池配置失败:', e)
      // 如果解析失败，重置为默认值
      resetConfiguration()
    }
  }
})

// 保存配置到localStorage的函数
const saveConfiguration = () => {
  const configToSave = {
    name: customPool.value.name,
    rates: customPool.value.rates,
    selectedCardIds: selectedCardIds.value,
    upCandidateIds: upCandidateIds.value,
    doubleRateSSRIds: doubleRateSSRIds.value,
  }
  localStorage.setItem(storageKey, JSON.stringify(configToSave))
}

// 重置配置的函数
const resetConfiguration = () => {
  const defaultConfig = getDefaultConfig()
  customPool.value.name = defaultConfig.name
  customPool.value.rates = { ...defaultConfig.rates }
  selectedCardIds.value = defaultConfig.selectedCardIds
  upCandidateIds.value = defaultConfig.upCandidateIds
  doubleRateSSRIds.value = defaultConfig.doubleRateSSRIds
  localStorage.removeItem(storageKey)
  alert('配置已重置为默认值！')
}

const toggleCardSelection = (rarity, cardId) => {
  const set = selectedCardIds.value[rarity]
  const index = set.indexOf(cardId)
  if (index > -1) {
    set.splice(index, 1)
    if (rarity === RARITY.SP) toggleUpCandidate(cardId, true)
    if (rarity === RARITY.SSR) toggleDoubleRateSSR(cardId, true)
  } else {
    set.push(cardId)
  }
}

const toggleUpCandidate = (cardId, forceRemove = false) => {
  const index = upCandidateIds.value.indexOf(cardId)
  if (forceRemove) {
    if (index > -1) upCandidateIds.value.splice(index, 1)
    return
  }
  if (index > -1) upCandidateIds.value.splice(index, 1)
  else upCandidateIds.value.push(cardId)
}

const toggleDoubleRateSSR = (cardId, forceRemove = false) => {
  const index = doubleRateSSRIds.value.indexOf(cardId)
  if (forceRemove) {
    if (index > -1) doubleRateSSRIds.value.splice(index, 1)
    return
  }
  if (index > -1) doubleRateSSRIds.value.splice(index, 1)
  else doubleRateSSRIds.value.push(cardId)
}

const navigateToGachaPage = () => {
  saveConfiguration() // 保存配置到localStorage
  const allSelectedIds = Object.values(selectedCardIds.value).flat()
  if (allSelectedIds.length === 0) {
    alert('请至少向卡池中添加一张卡牌！')
    return
  }

  // 构建最小化的配置对象
  const minifiedConfig = {
    n: customPool.value.name,
    r: {
      s: selectedCardIds.value.SP.length > 0 ? customPool.value.rates.SP / 100 : 0,
      x: selectedCardIds.value.SSR.length > 0 ? customPool.value.rates.SSR / 100 : 0,
      r: selectedCardIds.value.SR.length > 0 ? customPool.value.rates.SR / 100 : 0,
    },
    c: {
      s: selectedCardIds.value.SP,
      x: selectedCardIds.value.SSR,
      r: selectedCardIds.value.SR,
      n: selectedCardIds.value.R,
    },
    // rules -> u
    u: {},
  }

  // 最小化 SP 规则 (upCandidateIds -> d, SelectUpCards -> l)
  if (selectedCardIds.value.SP.length > 0 && upCandidateIds.value.length > 0) {
    minifiedConfig.u.s = {
      d: upCandidateIds.value,
      l: 1,
    }
  }

  // 最小化 SSR 规则 (doubleRateSSRIds -> b)
  if (selectedCardIds.value.SSR.length > 0 && doubleRateSSRIds.value.length > 0) {
    minifiedConfig.u.x = {
      b: doubleRateSSRIds.value,
    }
  }

  // 如果没有R卡，则重新计算并覆盖概率
  if (selectedCardIds.value.R.length === 0) {
    const totalRate = minifiedConfig.r.s + minifiedConfig.r.x + minifiedConfig.r.r
    if (totalRate > 0) {
      minifiedConfig.r.s = minifiedConfig.r.s / totalRate
      minifiedConfig.r.x = minifiedConfig.r.x / totalRate
      minifiedConfig.r.r = minifiedConfig.r.r / totalRate
    }
  }

  // 压缩并编码
  const jsonString = JSON.stringify(minifiedConfig)
  const compressed = pako.deflate(jsonString)
  let binaryString = ''
  for (let i = 0; i < compressed.length; i++) {
    binaryString += String.fromCharCode(compressed[i])
  }
  const encodedData = btoa(binaryString)

  // 跳转
  router.push({
    name: '抽卡模拟器',
    params: { poolId: 'custom' },
    query: { data: encodedData },
  })
}
</script>

<style scoped>
/* 样式与之前版本保持一致 */
.custom-gacha-page-background {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 2rem 1rem;
  color: v-bind('colors.text.primary');
}

.config-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: v-bind('colors.background.content');
  padding: 1.5rem min(4vw, 2rem);
  border-radius: 12px;
  border: 1px solid v-bind('colors.border.primary');
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.config-title {
  font-size: 2.5rem;
  text-align: center;
  color: v-bind('colors.text.highlight');
}

.config-description {
  text-align: center;
  color: v-bind('colors.text.secondary');
  margin-top: -1.5rem;
}

.config-section {
  border-top: 1px solid v-bind('colors.border.secondary');
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: v-bind('colors.text.secondary');
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  color: v-bind('colors.text.primary');
  font-size: 1rem;
  box-sizing: border-box;
}

.form-grid-rates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.rarity-section {
  margin-bottom: 1.5rem;
}

.rarity-section h3 {
  border-bottom: 2px solid;
  padding-bottom: 8px;
  margin-bottom: 1rem;
}

.text-rarity-sp {
  border-color: v-bind('colors.rarity.sp');
  color: v-bind('colors.rarity.sp');
}

.text-rarity-ssr {
  border-color: v-bind('colors.rarity.ssr');
  color: v-bind('colors.rarity.ssr');
}

.text-rarity-sr {
  border-color: v-bind('colors.rarity.sr');
  color: v-bind('colors.rarity.sr');
}

.text-rarity-r {
  border-color: v-bind('colors.rarity.r');
  color: v-bind('colors.rarity.r');
}

.card-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 86px);
  gap: 1rem;
  justify-content: center;
}

.card-option {
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.card-option .card-image {
  width: 100%;
  display: block;
}

.card-option .card-name {
  font-size: 0.8rem;
  text-align: center;
  padding: 4px 0px;
  background: v-bind('colors.shadow.primaryHover');
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
}

.card-option .checkmark {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: v-bind('colors.shadow.primaryHover');
  color: v-bind('colors.text.primary');
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-option.selected {
  border-color: v-bind('colors.brand.primary');
  transform: scale(1.05);
}

.card-option.selected .checkmark {
  opacity: 1;
}

.advanced-rules {
  padding-top: 1rem;
  border-top: 1px solid v-bind('colors.border.secondary');
}

.subsection-title {
  font-size: 1.1rem;
  color: v-bind('colors.text.secondary');
  margin-bottom: 1rem;
}

.card-selector-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
}

.card-option-small {
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.card-option-small .card-image {
  width: 100%;
  display: block;
}

.card-option-small .checkmark {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: v-bind('colors.text.primary');
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-option-small.selected {
  border-color: v-bind('colors.brand.primary');
}

.card-option-small.selected .checkmark {
  opacity: 1;
}

.finalize-button,
.back-home-button-config,
.reset-button-config {
  margin-top: 1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  color: v-bind('colors.text.primary');
  padding: 1rem 1.5rem;
  font-size: 1.2rem;
  background-color: v-bind('colors.brand.primary');
  text-align: center;
  text-decoration: none;
}

.finalize-button:hover {
  background-color: v-bind('colors.brand.hover');
}

.back-home-button-config {
  background-color: v-bind('colors.background.lighter');
  font-size: 1rem;
  display: block;
}

.back-home-button-config:hover {
  background-color: v-bind('colors.background.hover');
}

.reset-button-config {
  background-color: v-bind('colors.brand.primary');
  font-size: 1rem;
  display: block;
}

.reset-button-config:hover {
  background-color: v-bind('colors.brand.hover');
}
</style>

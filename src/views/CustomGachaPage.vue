<template>
  <div class="custom-gacha-page-background">
    <router-link
      :to="{ name: '抽卡模拟器', params: { poolId: latestPoolId } }"
      class="back-home-button-config"
    >
      <Return theme="outline" size="24" />
      <span class="back-text">返回抽卡</span>
      <span class="back-text-short">返回</span>
    </router-link>

    <div class="config-container">
      <h1 class="config-title">创建自定义卡池</h1>
      <p class="config-description">在这里创建你独一无二的梦想卡池！</p>

      <div class="config-section config-section-first">
        <div class="form-group">
          <label for="poolName">卡池名称</label>
          <input
            id="poolName"
            type="text"
            v-model="customPool.name"
            placeholder="例如：我的梦想卡池"
          />
        </div>
      </div>

      <div class="config-section">
        <CharacterSelector
          v-model="allSelectedCardIds"
          :character-list="allCards"
          title="选择卡池角色"
          sub-title="可用主题和稀有度筛选快速定位角色"
          show-real-name-toggle
          hide-qban-toggle
          show-select-filtered
        />
        <div class="selected-summary">
          <span
            v-for="rarity in rarities"
            :key="rarity"
            class="summary-chip"
            :class="`summary-chip-${rarity.toLowerCase()}`"
          >
            {{ rarity }} {{ selectedCardIds[rarity].length }}
          </span>
        </div>
      </div>

      <div class="config-section">
        <div class="form-grid-rates">
          <div class="form-group">
            <label for="spRate">SP 基础概率 (%)</label>
            <input
              id="spRate"
              type="number"
              v-model.number="customPool.rates.SP"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div class="form-group">
            <label for="ssrRate">SSR 基础概率 (%)</label>
            <input
              id="ssrRate"
              type="number"
              v-model.number="customPool.rates.SSR"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div class="form-group">
            <label for="srRate">SR 基础概率 (%)</label>
            <input
              id="srRate"
              type="number"
              v-model.number="customPool.rates.SR"
              min="0"
              max="100"
              step="1"
            />
          </div>
        </div>

        <div class="advanced-rules">
          <div v-if="selectedCardIds.SP.length > 0">
            <h3 class="subsection-title">SP规则</h3>
            <div class="rule-mode-tabs">
              <button
                v-for="mode in spRuleModes"
                :key="mode.value"
                class="rule-mode-tab"
                :class="{ active: spRuleMode === mode.value }"
                @click="spRuleMode = mode.value"
              >
                {{ mode.label }}
              </button>
            </div>
            <p class="rule-hint">{{ activeSpRuleDescription }}</p>

            <CharacterSelector
              v-if="spRuleMode === 'select-up'"
              v-model="upCandidateIds"
              :character-list="selectedSpCards"
              title="SP角色UP候选"
              sub-title="抽卡页会从候选中选择当前UP角色"
              hide-theme-filter
              hide-rarity-filter
              hide-qban-toggle
            />

            <div
              v-else-if="spRuleMode === 'wish' || spRuleMode === 'wish-guarantee'"
              class="wish-config"
            >
              <div class="form-group inline-form-group">
                <label for="maxWishSelection">心愿数量</label>
                <input
                  id="maxWishSelection"
                  type="number"
                  v-model.number="maxWishSelection"
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div v-if="selectedCardIds.SSR.length > 0">
            <h3 class="subsection-title">SSR角色双倍概率 (可多选)</h3>
            <CharacterSelector
              v-model="doubleRateSSRIds"
              :character-list="selectedSsrCards"
              title="SSR双倍概率角色"
              sub-title="选中的SSR在同稀有度内权重翻倍"
              hide-theme-filter
              hide-rarity-filter
              hide-qban-toggle
            />
          </div>
        </div>
      </div>

      <button @click="navigateToGachaPage" class="finalize-button">创建卡池并开始抽卡</button>
    </div>
    <button @click="resetConfiguration" class="reset-button-config">重置配置</button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SP, SSR, SR, R } from '@/data/constant.js'
import { cardMap, allCards } from '@/data/cards.js'
import pako from 'pako'
import { logger } from '@/utils/logger'
import { cardPools } from '@/data/cardPools'
import CharacterSelector from '@/components/CharacterSelector.vue'
import { Return } from '@icon-park/vue-next'

const router = useRouter()
const latestPoolId = Object.keys(cardPools)[0]

// 定义用于localStorage的key
const storageKey = 'customGachaPoolConfig'

// 默认配置的函数
const getDefaultConfig = () => ({
  name: '我的梦想卡池',
  rates: { [SP]: 1.25, [SSR]: 8, [SR]: 20 },
  selectedCardIds: { [SP]: [], [SSR]: [], [SR]: [], [R]: [] },
  upCandidateIds: [],
  doubleRateSSRIds: [],
  spRuleMode: 'select-up',
  maxWishSelection: 4,
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
const spRuleMode = ref(getDefaultConfig().spRuleMode)
const maxWishSelection = ref(getDefaultConfig().maxWishSelection)

const rarities = [SP, SSR, SR, R]
const spRuleModes = [
  { value: 'select-up', label: '多UP池' },
  { value: 'wish', label: '心愿自选' },
  { value: 'wish-guarantee', label: '带保底的心愿自选' },
]

const allSelectedCardIds = computed({
  get() {
    return Object.values(selectedCardIds.value).flat()
  },
  set(ids) {
    const next = { [SP]: [], [SSR]: [], [SR]: [], [R]: [] }
    ids.forEach((id) => {
      const rarity = cardMap.get(id)?.rarity
      if (next[rarity]) next[rarity].push(id)
    })
    selectedCardIds.value = next
    upCandidateIds.value = upCandidateIds.value.filter((id) => next[SP].includes(id))
    doubleRateSSRIds.value = doubleRateSSRIds.value.filter((id) => next[SSR].includes(id))
  },
})

const selectedSpCards = computed(() =>
  selectedCardIds.value[SP].map((id) => cardMap.get(id)).filter(Boolean),
)
const selectedSsrCards = computed(() =>
  selectedCardIds.value[SSR].map((id) => cardMap.get(id)).filter(Boolean),
)
const activeSpRuleDescription = computed(() => {
  if (spRuleMode.value === 'wish-guarantee') {
    return '抽卡页选择心愿角色后，还要指定当前UP；若歪了，下次SP必定为当前UP。'
  }
  if (spRuleMode.value === 'wish') {
    return '抽卡页从SP池中选择指定数量的心愿角色，SP结果只会在心愿角色中产生。'
  }
  return '抽卡页会在这里选中的候选角色中选择当前UP，歪后下次SP必定为当前UP。'
})

// 页面挂载时加载配置
onMounted(() => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }

  const savedConfig = localStorage.getItem(storageKey)
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig)
      customPool.value.name = parsedConfig.name
      customPool.value.rates = parsedConfig.rates
      selectedCardIds.value = parsedConfig.selectedCardIds
      upCandidateIds.value = parsedConfig.upCandidateIds
      doubleRateSSRIds.value = parsedConfig.doubleRateSSRIds
      spRuleMode.value = parsedConfig.spRuleMode || 'select-up'
      maxWishSelection.value = parsedConfig.maxWishSelection || 4
    } catch (e) {
      logger.error('解析自定义卡池配置失败:', e)
      // 如果解析失败，重置为默认值
      resetConfiguration(false)
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
    spRuleMode: spRuleMode.value,
    maxWishSelection: maxWishSelection.value,
  }
  localStorage.setItem(storageKey, JSON.stringify(configToSave))
}

// 重置配置的函数
const resetConfiguration = (shouldConfirm = true) => {
  if (shouldConfirm && !window.confirm('确定要重置自定义卡池配置吗？当前选择和规则都会清空。')) {
    return
  }
  const defaultConfig = getDefaultConfig()
  customPool.value.name = defaultConfig.name
  customPool.value.rates = { ...defaultConfig.rates }
  selectedCardIds.value = defaultConfig.selectedCardIds
  upCandidateIds.value = defaultConfig.upCandidateIds
  doubleRateSSRIds.value = defaultConfig.doubleRateSSRIds
  spRuleMode.value = defaultConfig.spRuleMode
  maxWishSelection.value = defaultConfig.maxWishSelection
  localStorage.removeItem(storageKey)
  alert('配置已重置为默认值！')
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

  if (
    selectedCardIds.value.SP.length > 0 &&
    (spRuleMode.value === 'wish' || spRuleMode.value === 'wish-guarantee')
  ) {
    minifiedConfig.u.s = {
      w: 1,
      m: Math.max(1, Math.min(maxWishSelection.value || 4, selectedCardIds.value.SP.length)),
      g: spRuleMode.value === 'wish-guarantee' ? 1 : 0,
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
  position: relative;
  background-color: var(--color-background-primary);
  min-height: 100vh;
  padding: 0.75rem 1rem 5rem;
  color: var(--color-text-primary);
}

.config-container {
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-content);
  padding: 1rem min(4vw, 2rem) 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-border-primary);
}

.config-title {
  font-size: 2rem;
  text-align: center;
  color: var(--color-text-highlight);
  margin: 0;
}

.config-description {
  text-align: center;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0;
}

.config-section {
  border-top: 1px solid var(--color-border-secondary);
  margin-top: 1rem;
  padding-top: 1rem;
}

.config-section-first {
  border-top: none;
  margin-top: 1rem;
  padding-top: 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 1rem;
  box-sizing: border-box;
}

.form-grid-rates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.advanced-rules {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-secondary);
}

.subsection-title {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.finalize-button {
  margin-top: 1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  color: var(--color-text-primary);
  padding: 1rem 1.5rem;
  font-size: 1.2rem;
  background-color: var(--color-brand-primary);
  text-align: center;
  text-decoration: none;
}

.finalize-button:hover {
  background-color: var(--color-brand-hover);
}

.back-home-button-config {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: bold;
  background: var(--color-background-content);
  padding: 0.4rem 0.7rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 1px solid var(--color-border-primary);
  font-size: 0.85rem;
}

.back-home-button-config:hover {
  transform: translateX(-2px);
  background-color: var(--color-background-hover);
}

.back-text {
  display: none;
}

.back-text-short {
  display: inline;
}

.reset-button-config {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 20;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  color: var(--color-text-primary);
  padding: 0.85rem 1.1rem;
  background-color: var(--color-brand-primary);
  font-size: 0.95rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.reset-button-config:hover {
  transform: translateY(-2px);
  background-color: var(--color-brand-hover);
}

.selected-summary,
.rule-mode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-summary {
  justify-content: center;
  margin-top: 0.75rem;
}

.summary-chip,
.rule-mode-tab {
  border: 1px solid var(--color-border-primary);
  background: var(--color-background-light);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  font-weight: bold;
}

.summary-chip-sp {
  color: var(--color-rarity-sp);
}

.summary-chip-ssr {
  color: var(--color-rarity-ssr);
}

.summary-chip-sr {
  color: var(--color-rarity-sr);
}

.summary-chip-r {
  color: var(--color-rarity-r);
}

.rule-mode-tab {
  cursor: pointer;
  transition: all 0.15s;
}

.rule-mode-tab.active {
  background: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
  color: var(--color-text-black);
}

.rule-hint {
  margin: 0.75rem 0 1rem;
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.inline-form-group {
  max-width: 220px;
}

:deep(.character-selection-container) {
  max-width: none;
  margin-bottom: 0;
  border-radius: 8px;
}

:deep(.selection-title) {
  font-size: 1.15rem;
}

@media (min-width: 768px) {
  .back-home-button-config {
    top: 20px;
    left: 20px;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .back-text {
    display: inline;
  }

  .back-text-short {
    display: none;
  }
}
</style>

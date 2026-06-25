<template>
  <div class="background" :class="{ 'smooth-transition': isReady }">
    <router-link to="/" class="back-btn">
      <return theme="outline" size="24" />
      <span class="back-text">返回首页</span>
      <span class="back-text-short">返回</span>
    </router-link>

    <div class="fuke-container" :class="{ 'smooth-transition': isReady }">
      <header class="page-header">
        <h1 class="title">UP计时器</h1>
      </header>

      <div class="rarity-toggle">
        <button
          v-for="r in ['SP', 'SSR']"
          :key="r"
          class="rarity-chip"
          :class="[r, { active: rarity === r }]"
          @click="rarity = r"
        >
          {{ r }}
        </button>
      </div>

      <div class="special-pool-toggle">
        <SwitchComponent v-model="includeSpecialPools" label="计算特殊卡池" />
      </div>

      <!-- 窄屏模式下的 panel 切换器 -->
      <div class="panel-tabs" v-if="availablePanels.length > 1">
        <button
          v-for="p in availablePanels"
          :key="p.id"
          class="panel-tab"
          :class="{ active: activePanel === p.id }"
          @click="activePanel = p.id"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="panels-wrapper">
        <!-- Panel: 未UP计时 -->
        <section class="panel" v-show="isPanelVisible('daysSince')">
          <h2 class="panel-title">未UP计时</h2>
          <div v-if="daysSinceList.length" class="panel-body">
            <div
              v-for="role in daysSinceList"
              :key="role.id"
              class="row-card clickable"
              @click="openRolePopup(role)"
            >
              <img
                :src="cardMap.get(role.id)?.qban_url || ''"
                :alt="cardMap.get(role.id)?.name || role.id"
                class="row-avatar"
                :class="role.rarity"
              />
              <div class="row-main">
                <div class="row-name">
                  {{ cardMap.get(role.id)?.name || role.id }}
                  <span v-if="role.isCurrentlyAvailable" class="up-now">UP 中</span>
                </div>
                <div class="row-sub">最近：{{ role.lastPoolName }}</div>
              </div>
              <div class="row-metric">
                <span class="metric-num">{{ role.daysSince }}</span>
                <span class="metric-unit">天</span>
              </div>
            </div>
          </div>
          <p v-else class="empty">暂无数据</p>
        </section>

        <!-- Panel: UP次数排行 -->
        <section class="panel" v-show="isPanelVisible('count')">
          <h2 class="panel-title">UP次数</h2>
          <div v-if="countGroups.length" class="panel-body">
            <div v-for="group in countGroups" :key="group.count" class="count-row">
              <div class="count-label">
                <span class="count-num">{{ group.count }}</span>
                <span class="count-unit">次 UP</span>
              </div>
              <div class="role-row">
                <div
                  v-for="role in group.roles"
                  :key="role.id"
                  class="role-chip"
                  :class="role.rarity"
                  @click="openRolePopup(role)"
                >
                  <img
                    :src="cardMap.get(role.id)?.qban_url || ''"
                    :alt="cardMap.get(role.id)?.name || role.id"
                    class="role-avatar"
                  />
                  <span class="role-name">{{ cardMap.get(role.id)?.name || role.id }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="empty">暂无数据</p>
        </section>

        <!-- Panel: UP间隔排行（仅 SP） -->
        <section class="panel" v-show="isPanelVisible('interval')" v-if="rarity === 'SP'">
          <h2 class="panel-title">UP间隔排行</h2>
          <div class="sub-toggle">
            <button
              v-for="m in intervalModes"
              :key="m.value"
              class="filter-chip"
              :class="{ active: intervalMode === m.value }"
              @click="intervalMode = m.value"
            >
              {{ m.label }}
            </button>
          </div>
          <div v-if="intervalList.length" class="panel-body">
            <div
              v-for="role in intervalList"
              :key="role.id"
              class="row-card clickable"
              @click="openRolePopup(role)"
            >
              <img
                :src="cardMap.get(role.id)?.qban_url || ''"
                :alt="cardMap.get(role.id)?.name || role.id"
                class="row-avatar"
                :class="role.rarity"
              />
              <div class="row-main">
                <div class="row-name">{{ cardMap.get(role.id)?.name || role.id }}</div>
                <template v-if="role.intervalFromPool && role.intervalToPool">
                  <div class="row-sub row-sub-multi">
                    <span class="pool-tag">起</span>{{ role.intervalFromPool }}
                  </div>
                  <div class="row-sub row-sub-multi">
                    <span class="pool-tag">末</span>{{ role.intervalToPool }}
                  </div>
                </template>
                <div v-else-if="role.intervalSubtitle" class="row-sub">
                  {{ role.intervalSubtitle }}
                </div>
              </div>
              <div class="row-metric">
                <span class="metric-num">{{ role.intervalValue }}</span>
                <span class="metric-unit">天</span>
              </div>
            </div>
          </div>
          <p v-else class="empty">暂无数据</p>
        </section>
      </div>
    </div>

    <!-- 角色历史 UP 情况 popup -->
    <PopUp
      :display="popupRole !== null"
      :title="popupRole ? `${cardMap.get(popupRole.id)?.name || popupRole.id} 历史UP情况` : ''"
      @close="popupRole = null"
    >
      <div v-if="popupRole" class="popup-body role-appearance-popup-body">
        <img
          :src="cardMap.get(popupRole.id)?.qban_url || ''"
          :alt="cardMap.get(popupRole.id)?.name || popupRole.id"
          class="popup-avatar"
          :class="popupRole.rarity"
        />
        <dl class="popup-stats">
          <div class="stat-row">
            <dt>历史 UP 次数</dt>
            <dd>{{ popupRole.appearanceCount }} 次</dd>
          </div>
          <div class="stat-row">
            <dt>UP 卡池</dt>
            <dd>
              <span v-for="(app, idx) in popupRole.appearances" :key="idx" class="pool-name">{{
                app.poolName
              }}</span>
            </dd>
          </div>
          <div class="stat-row">
            <dt>最快UP间隔</dt>
            <dd>{{ popupRole.minInterval !== null ? popupRole.minInterval + ' 天' : '—' }}</dd>
          </div>
          <div class="stat-row">
            <dt>最久UP间隔</dt>
            <dd>{{ popupRole.maxInterval !== null ? popupRole.maxInterval + ' 天' : '—' }}</dd>
          </div>
          <div class="stat-row">
            <dt>平均UP间隔</dt>
            <dd>{{ popupRole.avgInterval !== null ? popupRole.avgInterval + ' 天' : '—' }}</dd>
          </div>
        </dl>
      </div>
    </PopUp>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Return } from '@icon-park/vue-next'
import { cardMap, cardNameMap } from '@/data/cards.js'
import { cardPoolsInOrder, isCardPoolAvailable } from '@/data/cardPools.js'
import PopUp from '@/components/PopUp.vue'
import SwitchComponent from '@/components/SwitchComponent.vue'

const isReady = ref(false)
const rarity = ref('SP')
const intervalMode = ref('min')
const popupRole = ref(null)
const includeSpecialPools = ref(false)

const CORE_UP_POOL_TYPES = new Set(['限定', '限定复刻', '联动', '联动复刻'])

const intervalModes = [
  { value: 'min', label: '最快UP' },
  { value: 'max', label: '最久未UP' },
  { value: 'avg', label: '平均间隔' },
]

function parseTimeMs(text) {
  if (!text) return null
  const ms = new Date(text.replace(' ', 'T')).getTime()
  return Number.isNaN(ms) ? null : ms
}

function shouldIncludeAppearancePool(pool, includeSpecial) {
  if (pool.startTime == null || pool.finishTime == null) return false
  if (includeSpecial) return true
  return CORE_UP_POOL_TYPES.has(pool.type)
}

// 收集需要排除的 SP id —— 只要在 type 为「高级常驻」的卡池中作为 SP 出现，就视为高级常驻角色
function collectAdvancePermanentSpIds() {
  const ids = new Set()
  for (const [, pool] of cardPoolsInOrder) {
    if (pool.type !== '高级常驻') continue
    const spNames = (pool.cardNames && pool.cardNames.SP) || []
    for (const name of spNames) {
      const card = cardNameMap.get(name)
      if (card && card.rarity === 'SP') ids.add(card.id)
    }
  }
  return ids
}

const excludedSpIds = collectAdvancePermanentSpIds()

function buildRoleAppearances(includeSpecial) {
  const data = new Map()

  for (const [poolKey, pool] of cardPoolsInOrder) {
    if (!shouldIncludeAppearancePool(pool, includeSpecial)) continue

    const cardNamesByRarity = pool.cardNames || {}

    for (const rarityKey of ['SP', 'SSR']) {
      const names = cardNamesByRarity[rarityKey] || []
      for (const name of names) {
        const card = cardNameMap.get(name)
        if (!card || card.rarity !== rarityKey) continue
        if (rarityKey === 'SP' && excludedSpIds.has(card.id)) continue

        let entry = data.get(card.id)
        if (!entry) {
          entry = {
            id: card.id,
            rarity: card.rarity,
            appearances: [],
            isInPermanent: false,
            isCurrentlyAvailable: false,
          }
          data.set(card.id, entry)
        }

        entry.appearances.push({
          poolKey,
          poolName: pool.name,
          startTime: pool.startTime,
          finishTime: pool.finishTime,
        })

        if (isCardPoolAvailable(pool)) {
          entry.isCurrentlyAvailable = true
        }
      }
    }
  }

  const list = []
  for (const entry of data.values()) {
    if (!entry.appearances.length) continue

    entry.appearances.sort(
      (a, b) => (parseTimeMs(a.startTime) ?? 0) - (parseTimeMs(b.startTime) ?? 0),
    )

    const intervals = []
    const startIntervals = []
    for (let i = 0; i < entry.appearances.length - 1; i++) {
      const prevStart = parseTimeMs(entry.appearances[i].startTime)
      const prevFinish = parseTimeMs(entry.appearances[i].finishTime)
      const nextStart = parseTimeMs(entry.appearances[i + 1].startTime)
      if (prevStart === null || nextStart === null) {
        startIntervals.push(null)
      } else {
        startIntervals.push(Math.max(0, Math.floor((nextStart - prevStart) / 86400000)))
      }

      if (prevFinish === null || nextStart === null) {
        intervals.push(null)
      } else {
        intervals.push(Math.max(0, Math.floor((nextStart - prevFinish) / 86400000)))
      }
    }

    const validStartIntervals = startIntervals.filter((v) => v !== null)
    const minInterval = validStartIntervals.length ? Math.min(...validStartIntervals) : null
    const maxInterval = validStartIntervals.length ? Math.max(...validStartIntervals) : null
    const avgInterval = validStartIntervals.length
      ? Math.round(
          (validStartIntervals.reduce((a, b) => a + b, 0) / validStartIntervals.length) * 10,
        ) / 10
      : null

    const last = entry.appearances[entry.appearances.length - 1]

    list.push({
      ...entry,
      appearanceCount: entry.appearances.length,
      lastPoolKey: last.poolKey,
      lastPoolName: last.poolName,
      lastPoolStartTime: last.startTime,
      lastPoolFinishTime: last.finishTime,
      intervals,
      startIntervals,
      minInterval,
      maxInterval,
      avgInterval,
    })
  }

  list.sort((a, b) => {
    const at = parseTimeMs(a.lastPoolStartTime) ?? 0
    const bt = parseTimeMs(b.lastPoolStartTime) ?? 0
    if (bt !== at) return bt - at
    return Number(a.id) - Number(b.id)
  })

  return list
}

const roleAppearancesList = computed(() => buildRoleAppearances(includeSpecialPools.value))

const today = ref(new Date())

const isWideViewport = ref(false)
let mediaQuery = null
function updateViewport(e) {
  isWideViewport.value = e.matches
}

onMounted(() => {
  setTimeout(() => {
    isReady.value = true
  }, 50)
  mediaQuery = window.matchMedia('(min-width: 1100px)')
  isWideViewport.value = mediaQuery.matches
  mediaQuery.addEventListener('change', updateViewport)
})

onUnmounted(() => {
  if (mediaQuery) mediaQuery.removeEventListener('change', updateViewport)
})

const filteredByRarity = computed(() =>
  roleAppearancesList.value.filter((entry) => entry.rarity === rarity.value),
)

const countGroups = computed(() => {
  const groups = new Map()
  for (const role of filteredByRarity.value) {
    if (!groups.has(role.appearanceCount)) groups.set(role.appearanceCount, [])
    groups.get(role.appearanceCount).push(role)
  }
  const sortedCounts = [...groups.keys()].sort((a, b) => b - a)
  return sortedCounts.map((count) => ({
    count,
    roles: groups
      .get(count)
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id)),
  }))
})

const daysSinceList = computed(() => {
  const todayMs = today.value.getTime()
  return filteredByRarity.value
    .map((role) => {
      const finishMs = role.lastPoolFinishTime
        ? new Date(role.lastPoolFinishTime.replace(' ', 'T')).getTime()
        : null
      const daysSince =
        finishMs !== null ? Math.max(0, Math.floor((todayMs - finishMs) / 86400000)) : null
      return { ...role, daysSince }
    })
    .filter((role) => role.daysSince !== null)
    .sort((a, b) => b.daysSince - a.daysSince)
})

const intervalList = computed(() => {
  if (rarity.value !== 'SP') return []
  const eligible = filteredByRarity.value.filter(
    (role) => role.appearanceCount >= 2 && Array.isArray(role.startIntervals),
  )
  const items = eligible
    .map((role) => {
      const validStartIntervals = role.startIntervals.filter((v) => v !== null && v !== undefined)
      if (!validStartIntervals.length && intervalMode.value !== 'avg') return null
      let intervalValue
      let fromPool = null
      let toPool = null
      let subtitle = ''
      if (intervalMode.value === 'min') {
        intervalValue = role.minInterval
        const idx = role.startIntervals.indexOf(role.minInterval)
        if (idx >= 0 && role.appearances[idx] && role.appearances[idx + 1]) {
          fromPool = role.appearances[idx].poolName
          toPool = role.appearances[idx + 1].poolName
        }
      } else if (intervalMode.value === 'max') {
        intervalValue = role.maxInterval
        const idx = role.startIntervals.indexOf(role.maxInterval)
        if (idx >= 0 && role.appearances[idx] && role.appearances[idx + 1]) {
          fromPool = role.appearances[idx].poolName
          toPool = role.appearances[idx + 1].poolName
        }
      } else {
        intervalValue = role.avgInterval
        subtitle = `总计 UP ${role.appearanceCount} 次`
      }
      return intervalValue !== null && intervalValue !== undefined
        ? {
            ...role,
            intervalValue,
            intervalFromPool: fromPool,
            intervalToPool: toPool,
            intervalSubtitle: subtitle,
          }
        : null
    })
    .filter(Boolean)

  if (intervalMode.value === 'max') {
    items.sort((a, b) => b.intervalValue - a.intervalValue)
  } else {
    items.sort((a, b) => a.intervalValue - b.intervalValue)
  }
  return items
})

const availablePanels = computed(() => {
  const base = [
    { id: 'daysSince', label: '最久未UP' },
    { id: 'count', label: 'UP次数' },
  ]
  if (rarity.value === 'SP') {
    base.push({ id: 'interval', label: 'UP间隔排行' })
  }
  return base
})

const activePanel = ref('daysSince')

watch(rarity, () => {
  popupRole.value = null
  if (!availablePanels.value.find((p) => p.id === activePanel.value)) {
    activePanel.value = availablePanels.value[0].id
  }
})

watch(includeSpecialPools, () => {
  popupRole.value = null
})

function isPanelVisible(panelId) {
  if (isWideViewport.value) return true
  return activePanel.value === panelId
}

function openRolePopup(role) {
  popupRole.value = role
}
</script>

<style scoped>
.background {
  position: fixed;
  inset: 0;
  min-height: 100svh;
  height: 100dvh;
  background-color: var(--color-background-primary);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0.4rem;
  box-sizing: border-box;
  overflow: hidden;
  overscroll-behavior: none;
}

@media (min-width: 768px) {
  .background {
    padding: 1rem;
  }
}

.background.smooth-transition {
  transition: background-color 1s ease;
}

.background::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/images/homepage_bg.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.2;
  z-index: 1;
}

.fuke-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1600px;
  height: calc(100dvh - 1.3rem);
  background-color: var(--color-background-content);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  padding: 0.6rem;
  box-sizing: border-box;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  margin-top: 0.5rem;
  min-height: 0;
}

@media (min-width: 768px) {
  .fuke-container {
    height: calc(100dvh - 2.5rem);
    border-radius: 16px;
    padding: 1.25rem;
  }
}

.fuke-container.smooth-transition {
  transition: background-color 1s ease;
}

.back-btn {
  position: absolute;
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

.back-btn:hover {
  transform: translateX(-2px);
  background: var(--color-background-light);
}

/* 默认（窄屏）只显示「返回」短文本 */
.back-text {
  display: none;
}
.back-text-short {
  display: inline;
}

@media (min-width: 768px) {
  .back-btn {
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

.page-header {
  text-align: center;
  flex-shrink: 0;
}

.title {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--color-text-primary);
  margin: 0 0 0.15rem 0;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  margin: 0 0 0.6rem 0;
}

@media (min-width: 768px) {
  .title {
    font-size: 1.8rem;
    margin-bottom: 0.25rem;
  }
  .subtitle {
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
}

.rarity-toggle {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.35rem;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .rarity-toggle {
    margin-bottom: 0.5rem;
  }
}

.rarity-chip {
  padding: 6px 18px;
  border-radius: 20px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-background-light);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.15s;
}

.rarity-chip:hover {
  border-color: var(--color-brand-primary);
}

.rarity-chip.SP.active {
  background: var(--color-rarity-sp);
  border-color: var(--color-rarity-sp);
  color: white;
}

.rarity-chip.SSR.active {
  background: var(--color-rarity-ssr);
  border-color: var(--color-rarity-ssr);
  color: white;
}

.special-pool-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .special-pool-toggle {
    margin-bottom: 1rem;
  }
}

/* --- 窄屏 panel 切换器 --- */
.panel-tabs {
  display: flex;
  background: var(--color-background-light);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 0.6rem;
  gap: 3px;
  flex-shrink: 0;
}

.panel-tab {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 7px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

.panel-tab:hover {
  color: var(--color-text-primary);
}

.panel-tab.active {
  background: var(--color-brand-primary);
  color: var(--color-text-black);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

@media (min-width: 1100px) {
  .panel-tabs {
    display: none;
  }
}

.panels-wrapper {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: 1fr;
  align-items: start;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding-right: 0.2rem;
}

@media (min-width: 768px) {
  .panels-wrapper {
    gap: 1rem;
  }
}

.panels-wrapper::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.panels-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--color-border-primary);
  border-radius: 3px;
}

@media (min-width: 1100px) {
  .panels-wrapper {
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    grid-auto-flow: column;
    align-items: stretch;
    overflow: hidden;
  }
}

.panel {
  background: var(--color-background-light);
  border-radius: 10px;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  min-height: max-content;
}

@media (min-width: 768px) {
  .panel {
    border-radius: 12px;
    padding: 1rem;
  }
}

@media (min-width: 1100px) {
  .panel {
    min-height: 0;
    overflow: hidden;
  }
}

.panel-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
  flex-shrink: 0;
  text-align: left;
}

@media (min-width: 768px) {
  .panel-title {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 1100px) {
  .panel-body {
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-height: 0;
    padding-right: 0.25rem;
  }
  .panel-body::-webkit-scrollbar {
    width: 6px;
  }
  .panel-body::-webkit-scrollbar-thumb {
    background-color: var(--color-border-primary);
    border-radius: 3px;
  }
}

.empty {
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 2rem 0;
  margin: 0;
}

/* --- UP次数榜 --- */
.count-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  position: relative;
}

.count-row::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--color-background-hover);
}

.count-row:last-child::after {
  display: none;
}

.count-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  background: var(--color-background-lighter);
  flex-shrink: 0;
}

.count-num {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--color-text-highlight);
  line-height: 1;
}

.count-unit {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.role-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.role-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 56px;
  cursor: pointer;
  transition: transform 0.15s;
}

.role-chip:hover {
  transform: translateY(-2px);
}

.role-avatar {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--color-background-avatar);
}

.role-chip.SP .role-avatar {
  border-image: linear-gradient(180deg, var(--color-rarity-sp), var(--color-rarity-ssr)) 1;
  border-style: solid;
  border-radius: 8px;
}

.role-chip.SSR .role-avatar {
  border-color: var(--color-rarity-ssr);
}

.role-name {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
  text-align: center;
  line-height: 1.1;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- row-card (用于最久未UP / 间隔排行) --- */
.row-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  background: var(--color-background-lighter);
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}

.row-card.clickable {
  cursor: pointer;
}

.row-card.clickable:hover {
  transform: translateX(2px);
  background: var(--color-background-hover);
}

.row-avatar {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--color-background-avatar);
  flex-shrink: 0;
}

.row-avatar.SP {
  border-image: linear-gradient(180deg, var(--color-rarity-sp), var(--color-rarity-ssr)) 1;
  border-style: solid;
}

.row-avatar.SSR {
  border-color: var(--color-rarity-ssr);
}

.row-main {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.row-name {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-align: left;
}

.up-now {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--color-status-success-bg);
  color: var(--color-status-success);
  font-weight: normal;
}

.row-sub {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.row-sub-multi {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
  line-height: 1.3;
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
}

.pool-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 4px;
  background: var(--color-background-hover);
  color: var(--color-text-secondary);
  font-size: 0.65rem;
  font-weight: bold;
  margin-top: 1px;
}

.row-metric {
  display: flex;
  align-items: baseline;
  gap: 2px;
  flex-shrink: 0;
}

.metric-num {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--color-text-highlight);
  line-height: 1;
}

.metric-unit {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

/* --- 间隔模式子切换 --- */
.sub-toggle {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-background-light);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
}

.filter-chip.active {
  background: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
  color: var(--color-text-black);
  font-weight: bold;
}

/* --- 角色历史 UP popup 内容 --- */
.popup-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0.5rem 0.25rem;
  flex: 1;
  min-height: 0;
}

:global(.share-modal-content:has(.role-appearance-popup-body)) {
  display: flex;
  flex-direction: column;
  max-height: min(550px, calc(100dvh - 2rem));
}

.popup-body::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.popup-body::-webkit-scrollbar-thumb {
  background-color: var(--color-border-primary);
  border-radius: 2px;
}

.popup-avatar {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 12px;
  border: 3px solid transparent;
  background: var(--color-background-avatar);
}

.popup-avatar.SP {
  border-image: linear-gradient(180deg, var(--color-rarity-sp), var(--color-rarity-ssr)) 1;
  border-style: solid;
}

.popup-avatar.SSR {
  border-color: var(--color-rarity-ssr);
}

.popup-stats {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-primary) transparent;
}

.stat-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
  padding: 0.5rem 0.6rem;
  background: var(--color-background-lighter);
  border-radius: 8px;
}

.stat-row dt {
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
  margin: 0;
  text-align: left;
}

.stat-row dd {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  text-align: left;
  word-break: break-word;
}

@media (min-width: 540px) {
  .stat-row {
    flex-direction: row;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.6rem 0.75rem;
  }
  .stat-row dt {
    font-size: 0.85rem;
    min-width: 6em;
  }
  .stat-row dd {
    font-size: 0.95rem;
    text-align: right;
  }
}

.pool-name {
  display: inline-block;
  padding: 2px 8px;
  margin: 2px;
  border-radius: 6px;
  background: var(--color-background-light);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
</style>

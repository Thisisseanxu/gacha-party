<template>
  <main class="luck-page">
    <div class="ambient ambient-one" aria-hidden="true"></div>
    <div class="ambient ambient-two" aria-hidden="true"></div>

    <div class="page-shell">
      <header class="hero">
        <div class="hero-copy">
          <h1>欧非排行榜</h1>
          <p>是谁一发入魂，又是谁在负重前行</p>
        </div>
      </header>

      <button
        type="button"
        class="mobile-pool-picker"
        :aria-expanded="mobilePoolOpen"
        @click="mobilePoolOpen = true"
      >
        <span>统计范围</span>
        <strong>{{ activeScopeName }}</strong>
        <i>›</i>
      </button>

      <div
        v-if="mobilePoolOpen"
        class="mobile-pool-backdrop"
        aria-hidden="true"
        @click="mobilePoolOpen = false"
      ></div>

      <div class="ranking-layout">
        <aside
          class="pool-panel"
          :class="{ 'mobile-open': mobilePoolOpen }"
          aria-label="统计范围选择"
        >
          <div class="pool-panel-heading">
            <div>
              <h2>统计范围</h2>
            </div>
            <span class="pool-count">{{ poolOptions.length }} 个卡池</span>
            <button
              type="button"
              class="mobile-pool-close"
              aria-label="收起统计范围"
              @click="mobilePoolOpen = false"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            class="pool-option total-option"
            :class="{ active: selectedScopeId === 'total' }"
            @click="selectScope('total')"
          >
            <span class="pool-art total-art">∞</span>
            <span class="pool-copy">
              <strong>全卡池总榜</strong>
              <small>全部卡池数据</small>
            </span>
            <span class="option-arrow">›</span>
          </button>

          <label class="pool-search">
            <span aria-hidden="true">⌕</span>
            <input v-model="poolSearch" type="search" placeholder="搜索卡池" />
          </label>

          <div class="pool-scroll">
            <section v-for="group in filteredPoolGroups" :key="group.key" class="pool-group">
              <div class="pool-group-title">
                <span>{{ group.label }}</span>
                <i>{{ group.items.length }}</i>
              </div>
              <button
                v-for="pool in group.items"
                :key="pool.id"
                type="button"
                class="pool-option"
                :class="{ active: selectedScopeId === pool.id }"
                @click="selectScope(pool.id)"
              >
                <span class="pool-art">
                  <img v-if="pool.imageUrl" :src="pool.imageUrl" :alt="pool.name" />
                  <span v-else>{{ pool.name.slice(0, 1) }}</span>
                </span>
                <span class="pool-copy">
                  <strong>{{ pool.name }}</strong>
                  <small>{{ pool.periodText }}</small>
                </span>
                <span v-if="pool.hasData" class="published-dot" title="已有榜单数据"></span>
                <span v-else class="empty-label">暂无</span>
              </button>
            </section>

            <div v-if="!filteredPoolGroups.length" class="pool-empty">没有匹配的卡池</div>
          </div>
        </aside>

        <section class="board-panel" aria-live="polite">
          <div v-if="isInitialLoading" class="state-panel">
            <span class="state-spinner"></span>
            <h2>正在读取排行榜</h2>
            <p>马上就能见证欧气与非气的碰撞。</p>
          </div>

          <div v-else-if="refreshError && !rankingData" class="state-panel error-state">
            <span class="state-icon">!</span>
            <h2>排行榜加载失败</h2>
            <p>{{ refreshError }}</p>
            <button type="button" @click="loadRankingData()">重新加载</button>
          </div>

          <div v-else-if="!isTotalScope && isActivePoolLoading" class="state-panel">
            <span class="state-spinner"></span>
            <h2>正在读取卡池榜单</h2>
            <p>{{ selectedPoolName }}的数据正在加载。</p>
          </div>

          <div v-else-if="!isTotalScope && activePoolError" class="state-panel error-state">
            <span class="state-icon">!</span>
            <h2>卡池榜单加载失败</h2>
            <p>{{ activePoolError }}</p>
            <button type="button" @click="loadPoolBoard(selectedScopeId, { force: true })">
              重新加载
            </button>
          </div>

          <template v-else-if="activeBoard && (isTotalScope || activeBoardHasEntries)">
            <div class="board-heading">
              <div class="scope-title">
                <span v-if="isTotalScope" class="scope-badge">∞</span>
                <span v-else class="scope-cover">
                  <img
                    v-if="activePoolImageUrl"
                    :src="activePoolImageUrl"
                    :alt="selectedPoolName"
                  />
                  <b v-else>池</b>
                </span>
                <div class="scope-copy">
                  <h2>{{ activeBoardTitle }}</h2>
                  <p>{{ rangeText }}</p>
                </div>
              </div>

              <div v-if="activeBoardCanShowDrops || rankingData?.isSample" class="scope-stats">
                <button
                  v-if="activeBoardCanShowDrops"
                  type="button"
                  class="drop-visibility-toggle"
                  role="switch"
                  :aria-checked="showDropDetails"
                  @click="showDropDetails = !showDropDetails"
                >
                  <span class="switch-track"><i></i></span>
                  <span>显示抽到角色</span>
                </button>
                <em v-if="rankingData?.isSample">演示数据</em>
              </div>
            </div>

            <div class="mode-tabs" role="tablist" aria-label="榜单类型">
              <button
                type="button"
                role="tab"
                :aria-selected="rankingMode === 'lucky'"
                :class="{ active: rankingMode === 'lucky' }"
                @click="rankingMode = 'lucky'"
              >
                <span class="mode-icon lucky-icon">✦</span>
                <span><strong>最欧 TOP 30</strong><small>平均出货抽数由低到高</small></span>
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="rankingMode === 'unlucky'"
                :class="{ active: rankingMode === 'unlucky' }"
                @click="rankingMode = 'unlucky'"
              >
                <span class="mode-icon unlucky-icon">♠</span>
                <span><strong>最非 TOP 30</strong><small>平均出货抽数由高到低</small></span>
              </button>
            </div>

            <div class="table-caption">
              <span>{{ modeDescription }}</span>
              <span class="average-legend"
                ><i></i>平均抽数为所有{{ activeTargetRarity }}平均花费的抽数，会计算垫池行为</span
              >
            </div>

            <div class="ranking-table" :class="`mode-${rankingMode}`">
              <div class="table-head" :class="{ 'with-sp': activeBoardShowsDrops }">
                <span>排名</span>
                <span>玩家 ID</span>
                <span>范围抽数</span>
                <span>平均抽数</span>
                <span v-if="activeBoardShowsDrops">抽到的 SP</span>
              </div>

              <ol class="ranking-list">
                <li
                  v-for="(entry, index) in currentEntries"
                  :key="`${rankingMode}-${entry.playerId}-${index}`"
                  class="ranking-row"
                  :class="[{ podium: index < 3 }, `rank-${index + 1}`]"
                >
                  <span class="rank-cell">
                    <i v-if="index < 3" class="medal">{{ medalFor(index) }}</i>
                    <b v-else>{{ index + 1 }}</b>
                  </span>
                  <span class="player-cell">
                    <strong>{{ entry.playerId }}</strong>
                  </span>
                  <span class="number-cell">
                    <strong>{{ formatInteger(entry.pulls) }}</strong
                    ><small>抽</small>
                  </span>
                  <span class="average-cell">
                    <strong>{{ formatAverage(entry.averagePulls) }}</strong
                    ><small>抽 / {{ activeTargetRarity }}</small>
                  </span>
                  <span v-if="activeBoardShowsDrops" class="sp-cell">
                    <span v-for="drop in entry.sp" :key="drop.cardId" class="sp-chip">
                      <img
                        v-if="getSpImage(drop)"
                        :src="getSpImage(drop)"
                        :alt="getSpName(drop.cardId)"
                        :title="getSpName(drop.cardId)"
                      />
                      <b>×{{ drop.count }}</b>
                    </span>
                  </span>
                </li>
              </ol>
            </div>
          </template>

          <div v-else class="state-panel empty-state">
            <span class="state-icon">◇</span>
            <h2>{{ selectedPoolName }}暂未发布榜单</h2>
            <p>数据持续更新中...敬请期待！</p>
            <button type="button" @click="selectScope('total')">查看全卡池总榜</button>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cardMap } from '@/data/cards.js'
import { cardPoolsInOrder, isCardPoolAvailable } from '@/data/cardPools.js'
import { normalizeLuckRankingIndex, normalizeLuckRankingPoolData } from '@/utils/luckRankingData.js'

const DATA_URL = '/data/luck-ranking.json'
const POOL_DATA_BASE_URL = '/data/luck-ranking-pools'
const REFRESH_INTERVAL_SECONDS = 30 * 60
const CACHE_KEY = 'gacha-party-luck-ranking-index-cache-v2'
const POOL_CACHE_PREFIX = 'gacha-party-luck-ranking-pool-cache-v2:'

const rankingData = ref(null)
const poolBoards = ref(new Map())
const loadingPoolIds = ref(new Set())
const poolErrors = ref(new Map())
const isInitialLoading = ref(true)
const refreshError = ref('')
const lastCheckedAt = ref(null)
const lastRefreshAttemptAt = ref(null)
const selectedScopeId = ref('total')
const rankingMode = ref('lucky')
const poolSearch = ref('')
const mobilePoolOpen = ref(false)
const showDropDetails = ref(true)

let refreshTimer = null
let requestSequence = 0

const dataPoolsById = computed(
  () => new Map((rankingData.value?.pools || []).map((pool) => [pool.poolId, pool])),
)

const poolOptions = computed(() => {
  const builtInIds = new Set()
  const builtIn = cardPoolsInOrder.map(([id, pool]) => {
    const normalizedId = String(id)
    const publishedPool = dataPoolsById.value.get(normalizedId)
    const loadedBoard = poolBoards.value.get(normalizedId)
    builtInIds.add(normalizedId)
    return {
      id: normalizedId,
      name: publishedPool?.poolName || pool.name,
      imageUrl: publishedPool?.imageUrl || pool.imageUrl || '',
      startTime: pool.startTime || '',
      finishTime: pool.finishTime || '',
      active: isCardPoolAvailable(pool),
      hasData: Boolean(publishedPool) && (!loadedBoard || boardHasEntries(loadedBoard)),
      periodText: formatPoolPeriod(pool.startTime, pool.finishTime),
    }
  })

  const dynamicOnly = (rankingData.value?.pools || [])
    .filter((pool) => !builtInIds.has(pool.poolId))
    .map((pool) => ({
      id: pool.poolId,
      name: pool.poolName,
      imageUrl: pool.imageUrl,
      startTime: '',
      finishTime: '',
      active: false,
      hasData:
        !poolBoards.value.has(pool.poolId) || boardHasEntries(poolBoards.value.get(pool.poolId)),
      periodText: '已发布榜单',
    }))

  return [...builtIn, ...dynamicOnly]
})

const filteredPoolGroups = computed(() => {
  const query = poolSearch.value.trim().toLowerCase()
  const filtered = poolOptions.value.filter(
    (pool) => !query || pool.name.toLowerCase().includes(query) || pool.id.includes(query),
  )

  return [
    { key: 'active', label: '进行中', items: filtered.filter((pool) => pool.active) },
    { key: 'past', label: '往期卡池', items: filtered.filter((pool) => !pool.active) },
  ].filter((group) => group.items.length)
})

const isTotalScope = computed(() => selectedScopeId.value === 'total')
const activePoolOption = computed(() =>
  poolOptions.value.find((pool) => pool.id === selectedScopeId.value),
)
const activeBoard = computed(() => {
  if (!rankingData.value) return null
  return isTotalScope.value
    ? rankingData.value.total
    : poolBoards.value.get(selectedScopeId.value) || null
})
const activeBoardTitle = computed(() =>
  isTotalScope.value ? '全卡池总榜' : selectedPoolName.value,
)
const selectedPoolName = computed(() => activePoolOption.value?.name || '该卡池')
const activePoolImageUrl = computed(() => activePoolOption.value?.imageUrl || '')
const activeScopeName = computed(() =>
  isTotalScope.value ? '全卡池总榜 · 全部卡池数据' : selectedPoolName.value,
)
const currentEntries = computed(() => activeBoard.value?.[rankingMode.value] || [])
const activeTargetRarity = computed(() => activeBoard.value?.targetRarity || 'SP')
const activeBoardCanShowDrops = computed(
  () => !isTotalScope.value && activeTargetRarity.value === 'SP',
)
const activeBoardShowsDrops = computed(() => activeBoardCanShowDrops.value && showDropDetails.value)
const activeBoardHasEntries = computed(
  () => (activeBoard.value?.lucky.length || 0) + (activeBoard.value?.unlucky.length || 0) > 0,
)
const isActivePoolLoading = computed(() => loadingPoolIds.value.has(selectedScopeId.value))
const activePoolError = computed(() => poolErrors.value.get(selectedScopeId.value) || '')
const rangeText = computed(() => {
  if (!activeBoard.value) return ''
  return `${formatDate(activeBoard.value.range.start)} — ${formatDate(activeBoard.value.range.end)}`
})
const modeDescription = computed(() =>
  rankingMode.value === 'lucky'
    ? '数值越低越欧，需满足一定条件才可上榜'
    : '数值越高越非，需满足一定条件才可上榜',
)
function formatInteger(value) {
  return new Intl.NumberFormat('zh-CN').format(value || 0)
}

function boardHasEntries(board) {
  return Boolean((board?.lucky.length || 0) + (board?.unlucky.length || 0))
}

function formatAverage(value) {
  return Number(value).toFixed(2).replace(/\.00$/, '')
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '未注明'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatPoolPeriod(start, end) {
  if (!start && !end) return '长期开放'
  if (!end) return `${formatDate(start)} 起`
  return `${formatDate(start)} — ${formatDate(end)}`
}

function medalFor(index) {
  return ['1', '2', '3'][index]
}

function getSpImage(drop) {
  return cardMap.get(String(drop.cardId))?.qban_url || ''
}

function getSpName(cardId) {
  return cardMap.get(String(cardId))?.name || `角色 ${cardId}`
}

function selectScope(scopeId) {
  selectedScopeId.value = scopeId
  mobilePoolOpen.value = false
  if (scopeId !== 'total') loadPoolBoard(scopeId)
}

function loadLocalCache() {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || 'null')
    if (!cached || !Number.isFinite(cached.cachedAt) || !cached.data) return false

    rankingData.value = normalizeLuckRankingIndex(cached.data)
    lastCheckedAt.value = cached.cachedAt
    isInitialLoading.value = false
    return true
  } catch {
    return false
  }
}

function poolCacheKey(poolId) {
  return `${POOL_CACHE_PREFIX}${poolId}`
}

function loadCachedPoolBoard(poolId) {
  try {
    const cached = JSON.parse(window.localStorage.getItem(poolCacheKey(poolId)) || 'null')
    if (!cached || cached.generatedAt !== rankingData.value?.generatedAt || !cached.data)
      return false
    const board = normalizeLuckRankingPoolData(cached.data, poolId)
    poolBoards.value = new Map(poolBoards.value).set(poolId, board)
    return true
  } catch {
    return false
  }
}

function savePoolCache(poolId, data, generatedAt) {
  try {
    window.localStorage.setItem(poolCacheKey(poolId), JSON.stringify({ generatedAt, data }))
  } catch {
    // 缓存不可用时仅影响离线读取，不影响当前页面。
  }
}

function setPoolLoading(poolId, loading) {
  const next = new Set(loadingPoolIds.value)
  if (loading) next.add(poolId)
  else next.delete(poolId)
  loadingPoolIds.value = next
}

function setPoolError(poolId, message) {
  const next = new Map(poolErrors.value)
  if (message) next.set(poolId, message)
  else next.delete(poolId)
  poolErrors.value = next
}

async function loadPoolBoard(poolId, { force = false } = {}) {
  poolId = String(poolId)
  if (!rankingData.value || !dataPoolsById.value.has(poolId)) return
  if (!force && poolBoards.value.has(poolId)) return
  if (!force && loadCachedPoolBoard(poolId)) return

  const expectedGeneratedAt = rankingData.value.generatedAt
  setPoolLoading(poolId, true)
  setPoolError(poolId, '')
  try {
    const response = await fetch(
      `${POOL_DATA_BASE_URL}/${encodeURIComponent(poolId)}.json?_=${Date.now()}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } },
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const rawData = await response.json()
    const board = normalizeLuckRankingPoolData(rawData, poolId)
    if (rankingData.value?.generatedAt !== expectedGeneratedAt) return
    poolBoards.value = new Map(poolBoards.value).set(poolId, board)
    savePoolCache(poolId, rawData, expectedGeneratedAt)
  } catch (error) {
    setPoolError(poolId, error instanceof Error ? error.message : '未知错误')
  } finally {
    setPoolLoading(poolId, false)
  }
}

function saveLocalCache(data, cachedAt) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ cachedAt, data }))
  } catch {
    // 隐私模式或存储空间不足时仍可正常显示本次网络数据。
  }
}

function scheduleRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer)
  const latestActivityAt = Math.max(lastCheckedAt.value || 0, lastRefreshAttemptAt.value || 0)
  const elapsed = latestActivityAt ? Date.now() - latestActivityAt : 0
  const delay = Math.max(1000, REFRESH_INTERVAL_SECONDS * 1000 - elapsed)
  refreshTimer = window.setTimeout(async () => {
    await loadRankingData()
    scheduleRefresh()
  }, delay)
}

async function loadRankingData() {
  const requestId = ++requestSequence
  lastRefreshAttemptAt.value = Date.now()
  if (!rankingData.value) isInitialLoading.value = true

  try {
    const url = `${DATA_URL}?_=${Date.now()}`
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const rawData = await response.json()
    const normalized = normalizeLuckRankingIndex(rawData)
    if (requestId !== requestSequence) return
    const checkedAt = Date.now()
    const versionChanged =
      rankingData.value?.generatedAt && rankingData.value.generatedAt !== normalized.generatedAt
    rankingData.value = normalized
    if (versionChanged) {
      poolBoards.value = new Map()
      poolErrors.value = new Map()
    }
    refreshError.value = ''
    lastCheckedAt.value = checkedAt
    saveLocalCache(rawData, checkedAt)
    if (selectedScopeId.value !== 'total' && dataPoolsById.value.has(selectedScopeId.value)) {
      await loadPoolBoard(selectedScopeId.value, { force: Boolean(versionChanged) })
    }
  } catch (error) {
    if (requestId !== requestSequence) return
    refreshError.value = error instanceof Error ? error.message : '未知错误'
  } finally {
    if (requestId === requestSequence) {
      isInitialLoading.value = false
    }
  }
}

async function manualRefresh() {
  await loadRankingData()
  scheduleRefresh()
}

function refreshWhenVisible() {
  if (document.visibilityState !== 'visible') return
  const latestActivityAt = Math.max(lastCheckedAt.value || 0, lastRefreshAttemptAt.value || 0)
  if (!latestActivityAt || Date.now() - latestActivityAt >= REFRESH_INTERVAL_SECONDS * 1000) {
    manualRefresh()
  }
}

onMounted(async () => {
  const hasLocalCache = loadLocalCache()
  const cacheIsFresh =
    hasLocalCache &&
    Date.now() - lastCheckedAt.value >= 0 &&
    Date.now() - lastCheckedAt.value < REFRESH_INTERVAL_SECONDS * 1000

  if (!cacheIsFresh) await loadRankingData()
  scheduleRefresh()
  document.addEventListener('visibilitychange', refreshWhenVisible)
})

onBeforeUnmount(() => {
  if (refreshTimer) window.clearTimeout(refreshTimer)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
})
</script>

<style scoped>
.luck-page {
  --lucky: #33d6b2;
  --lucky-soft: rgba(51, 214, 178, 0.13);
  --unlucky: #ff7f66;
  --unlucky-soft: rgba(255, 127, 102, 0.13);
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 12%, rgba(66, 180, 172, 0.12), transparent 32rem),
    radial-gradient(circle at 92% 76%, rgba(238, 129, 91, 0.1), transparent 34rem),
    var(--color-background-primary);
  color: var(--color-text-primary);
  text-align: left;
}

.ambient {
  position: fixed;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.12;
  pointer-events: none;
}

.ambient-one {
  top: -10rem;
  left: -8rem;
  background: var(--lucky);
}

.ambient-two {
  right: -8rem;
  bottom: -10rem;
  background: var(--unlucky);
}

.page-shell {
  position: relative;
  z-index: 1;
  width: min(1480px, 100%);
  min-height: 100dvh;
  margin: 0 auto;
  padding: 26px clamp(18px, 4vw, 56px) 18px;
  box-sizing: border-box;
}

.hero {
  margin-bottom: 18px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 4.6rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.hero-copy p {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.98rem;
}

.ranking-layout {
  display: grid;
  grid-template-columns: 292px minmax(0, 1fr);
  height: clamp(500px, calc(100dvh - 180px), 820px);
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  border-radius: 20px;
  background: color-mix(in srgb, var(--color-background-content) 96%, transparent);
  box-shadow: 0 20px 60px var(--color-shadow-primary);
}

.pool-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px 14px 14px;
  border-right: 1px solid var(--color-border-primary);
  background: color-mix(in srgb, var(--color-background-light) 58%, transparent);
}

.pool-panel-heading,
.pool-group-title,
.board-heading,
.table-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pool-panel-heading {
  padding: 0 6px 14px;
}

.pool-panel-heading h2 {
  margin: 0;
  font-size: 1.12rem;
}

.pool-count {
  color: var(--color-text-tertiary);
  font-size: 0.68rem;
}

.mobile-pool-close {
  display: none;
}

.pool-option {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.pool-option:hover {
  background: var(--color-background-hover);
}

.pool-option.active {
  border-color: color-mix(in srgb, var(--lucky) 55%, transparent);
  background: var(--lucky-soft);
  box-shadow: inset 3px 0 0 var(--lucky);
}

.total-option {
  margin-bottom: 12px;
  background: color-mix(in srgb, var(--color-background-content) 82%, transparent);
}

.pool-art {
  display: grid;
  width: 96px;
  min-width: 54px;
  height: 42px;
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  border-radius: 10px;
  background: var(--color-background-lighter);
  color: var(--color-text-secondary);
  font-weight: 900;
  flex: 0 10 96px;
  place-items: center;
}

.pool-art img {
  width: 96px;
  max-width: none;
  height: 42px;
  object-fit: cover;
  object-position: left center;
}

.total-art {
  width: 42px;
  min-width: 42px;
  flex-basis: 42px;
  border-color: color-mix(in srgb, var(--lucky) 45%, transparent);
  background: linear-gradient(145deg, var(--lucky-soft), var(--unlucky-soft));
  color: var(--lucky);
  font-size: 1.35rem;
}

.pool-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.pool-copy strong,
.pool-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pool-copy strong {
  font-size: 0.8rem;
}

.pool-copy small {
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: 0.62rem;
}

.option-arrow {
  color: var(--lucky);
  font-size: 1.3rem;
}

.published-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lucky);
  box-shadow: 0 0 0 3px var(--lucky-soft);
}

.empty-label {
  color: var(--color-text-tertiary);
  font-size: 0.6rem;
}

.pool-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 2px 10px;
  padding: 8px 10px;
  border: 1px solid var(--color-border-primary);
  border-radius: 10px;
  background: var(--color-input-background);
  color: var(--color-text-tertiary);
}

.pool-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-input-text);
  font-size: 0.75rem;
}

.pool-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-color: var(--color-scrollbar) transparent;
  scrollbar-width: thin;
}

.pool-group + .pool-group {
  margin-top: 15px;
}

.pool-group-title {
  padding: 5px 8px;
  color: var(--color-text-tertiary);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.pool-group-title i {
  font-style: normal;
}

.pool-empty {
  padding: 40px 10px;
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
  text-align: center;
}

.board-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  padding: clamp(18px, 3vw, 34px);
}

.board-heading {
  gap: 20px;
  padding-bottom: 12px;
}

.scope-title {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 13px;
}

.scope-badge {
  display: grid;
  width: 46px;
  height: 46px;
  border: 1px solid color-mix(in srgb, var(--lucky) 45%, transparent);
  border-radius: 12px;
  background: var(--lucky-soft);
  color: var(--lucky);
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  place-items: center;
}

.scope-cover {
  display: grid;
  width: 105px;
  min-width: 54px;
  height: 46px;
  flex: 0 10 105px;
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  background: var(--color-background-light);
  color: var(--lucky);
  place-items: center;
}

.scope-cover img {
  width: 105px;
  max-width: none;
  height: 46px;
  object-fit: cover;
  object-position: left center;
}

.scope-cover b {
  font-size: 0.7rem;
}

.scope-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.scope-title h2 {
  margin: 0;
  overflow: hidden;
  font-size: clamp(1.25rem, 2vw, 1.65rem);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scope-title p {
  margin: 5px 0 0;
  color: var(--color-text-tertiary);
  font-size: 0.72rem;
}

.scope-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drop-visibility-toggle,
.scope-stats em {
  padding: 7px 9px;
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  color: var(--color-text-tertiary);
  font-size: 0.66rem;
  font-style: normal;
  white-space: nowrap;
}

.drop-visibility-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--color-background-light);
  cursor: pointer;
}

.switch-track {
  position: relative;
  width: 28px;
  height: 16px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--color-border-primary);
  transition: background-color 0.18s ease;
}

.switch-track i {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-background-content);
  box-shadow: 0 1px 3px var(--color-shadow-primary);
  inset: 2px auto 2px 2px;
  transition: transform 0.18s ease;
}

.drop-visibility-toggle[aria-checked='true'] {
  border-color: color-mix(in srgb, var(--lucky) 42%, transparent);
  color: var(--color-text-primary);
}

.drop-visibility-toggle[aria-checked='true'] .switch-track {
  background: var(--lucky);
}

.drop-visibility-toggle[aria-checked='true'] .switch-track i {
  transform: translateX(12px);
}

.scope-stats em {
  border-color: color-mix(in srgb, var(--unlucky) 40%, transparent);
  background: var(--unlucky-soft);
  color: var(--unlucky);
  font-weight: 800;
}

.eligible-sp-list {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 7px 9px;
  border: 1px solid var(--color-border-primary);
  border-radius: 11px;
  background: var(--color-background-light);
}

.eligible-sp-list > span {
  color: var(--color-text-tertiary);
  font-size: 0.64rem;
  font-weight: 700;
  white-space: nowrap;
}

.eligible-sp-list > div {
  display: flex;
  min-width: 0;
  gap: 7px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.eligible-sp-card {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
}

.eligible-sp-card img {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  object-fit: cover;
}

.eligible-sp-card strong {
  font-size: 0.66rem;
}

.mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 5px;
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  background: var(--color-background-light);
}

.mode-tabs button {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
}

.mode-tabs button:first-child.active {
  border-color: color-mix(in srgb, var(--lucky) 45%, transparent);
  background: var(--lucky-soft);
  color: var(--lucky);
}

.mode-tabs button:last-child.active {
  border-color: color-mix(in srgb, var(--unlucky) 45%, transparent);
  background: var(--unlucky-soft);
  color: var(--unlucky);
}

.mode-icon {
  display: grid;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--color-background-content);
  font-size: 1rem;
  flex: 0 0 auto;
  place-items: center;
}

.mode-tabs button > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.mode-tabs strong {
  color: var(--color-text-primary);
  font-size: 0.86rem;
}

.mode-tabs small {
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: 0.62rem;
}

.table-caption {
  gap: 12px;
  padding: 8px 2px;
  color: var(--color-text-tertiary);
  font-size: 0.67rem;
}

.average-legend {
  white-space: nowrap;
}

.average-legend i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: currentColor;
}

.ranking-table {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  border-radius: 14px;
}

.table-head,
.ranking-row {
  display: grid;
  grid-template-columns:
    minmax(42px, 0.03fr)
    minmax(78px, 0.08fr)
    minmax(70px, 0.03fr)
    minmax(100px, 1fr);
  align-items: center;
}

.table-head.with-sp,
.ranking-row:has(.sp-cell) {
  grid-template-columns:
    minmax(42px, 0.03fr)
    minmax(78px, 0.08fr)
    minmax(70px, 0.03fr)
    minmax(100px, 0.2fr)
    minmax(180px, 2fr);
}

.table-head {
  min-height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-background-light);
  color: var(--color-text-tertiary);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.ranking-list {
  min-height: 0;
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-color: var(--color-scrollbar) transparent;
  scrollbar-width: thin;
}

.ranking-row {
  min-height: 50px;
  padding: 0 14px;
  border-bottom: 1px solid var(--color-border-primary);
  transition: background-color 0.18s ease;
}

.ranking-row:last-child {
  border-bottom: 0;
}

.ranking-row:hover {
  background: var(--color-background-light);
}

.ranking-row.podium {
  background: linear-gradient(90deg, var(--active-soft, var(--lucky-soft)), transparent 60%);
}

.mode-unlucky .ranking-row.podium {
  --active-soft: var(--unlucky-soft);
}

.rank-cell {
  display: flex;
  align-items: center;
}

.rank-cell b {
  width: 28px;
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
  text-align: center;
}

.medal {
  display: grid;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #d9a72e;
  color: #fff;
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 900;
  box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.14);
  place-items: center;
}

.rank-2 .medal {
  background: #8e9baa;
}

.rank-3 .medal {
  background: #b97950;
}

.player-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.player-cell strong {
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.number-cell strong,
.average-cell strong {
  font-size: 0.9rem;
}

.number-cell small,
.average-cell small {
  margin-left: 3px;
  color: var(--color-text-tertiary);
  font-size: 0.6rem;
}

.average-cell strong {
  color: var(--lucky);
  font-size: 1rem;
}

.mode-unlucky .average-cell strong {
  color: var(--unlucky);
}

.sp-cell {
  display: flex;
  min-width: 0;
  flex-wrap: nowrap;
  gap: 4px;
  padding: 2px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.sp-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px 2px 2px;
  border: 1px solid var(--color-border-primary);
  border-radius: 999px;
  background: var(--color-background-light);
  font-size: 0.6rem;
}

.sp-chip img {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  object-fit: cover;
}

.sp-chip b {
  color: var(--color-rarity-sp);
  white-space: nowrap;
}

.state-panel {
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.state-panel h2 {
  margin: 18px 0 6px;
  font-size: 1.2rem;
}

.state-panel p {
  max-width: 480px;
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 0.8rem;
}

.state-panel button {
  margin-top: 20px;
  padding: 9px 16px;
  border: 1px solid color-mix(in srgb, var(--lucky) 50%, transparent);
  border-radius: 9px;
  background: var(--lucky-soft);
  color: var(--lucky);
  font-weight: 700;
  cursor: pointer;
}

.state-icon,
.state-spinner {
  display: grid;
  width: 58px;
  height: 58px;
  border: 1px solid var(--color-border-primary);
  border-radius: 18px;
  background: var(--color-background-light);
  color: var(--color-text-tertiary);
  font-size: 1.5rem;
  font-weight: 300;
  place-items: center;
}

.state-spinner::before {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-primary);
  border-top-color: var(--lucky);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  content: '';
}

.error-state .state-icon {
  color: var(--unlucky);
}

.mobile-pool-picker {
  display: none;
}

.mobile-pool-backdrop {
  display: none;
}

.page-note {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 6px 0;
  color: var(--color-text-tertiary);
  font-size: 0.64rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 1041px) and (orientation: landscape) {
  .page-shell {
    width: min(1680px, 100%);
  }

  .ranking-layout {
    grid-template-columns: 330px minmax(0, 1fr);
  }
}

@media (max-width: 1040px) {
  .page-shell {
    padding-inline: 18px;
  }

  .ranking-layout {
    grid-template-columns: 245px minmax(0, 1fr);
  }

  .pool-art:not(.total-art) {
    width: 72px;
    flex-basis: 72px;
  }

  .table-head.with-sp,
  .ranking-row:has(.sp-cell) {
    grid-template-columns:
      minmax(40px, 0.03fr)
      minmax(76px, 0.08fr)
      minmax(68px, 0.03fr)
      minmax(96px, 0.18fr)
      minmax(150px, 1.7fr);
  }
}

@media (max-width: 760px) {
  .page-shell {
    padding: 24px 12px 18px;
  }

  .hero {
    margin-bottom: 14px;
  }

  .hero h1 {
    font-size: 2.6rem;
  }

  .pool-art:not(.total-art) {
    width: 96px;
    flex-basis: 96px;
  }

  .mobile-pool-picker {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    padding: 10px 12px;
    border: 1px solid var(--color-border-primary);
    border-radius: 12px;
    background: var(--color-background-content);
    color: var(--color-text-primary);
    text-align: left;
    cursor: pointer;
  }

  .mobile-pool-picker span {
    color: var(--color-text-tertiary);
    font-size: 0.7rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .mobile-pool-picker strong {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    font-size: 0.78rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-pool-picker i {
    color: var(--lucky);
    font-size: 1.2rem;
    font-style: normal;
    transform: rotate(90deg);
  }

  .mobile-pool-backdrop {
    position: fixed;
    z-index: 200;
    display: block;
    inset: 0;
    background: var(--color-background-overlay);
    backdrop-filter: blur(3px);
  }

  .ranking-layout {
    display: block;
    height: auto;
    min-height: 620px;
    border-radius: 16px;
  }

  .pool-panel {
    display: none;
  }

  .pool-panel.mobile-open {
    position: fixed;
    z-index: 201;
    inset: 68px 12px 12px;
    display: flex;
    max-height: calc(100dvh - 80px);
    padding-top: 16px;
    border: 1px solid var(--color-border-primary);
    border-radius: 17px;
    background: var(--color-background-content);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
  }

  .mobile-pool-close {
    display: grid;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--color-border-primary);
    border-radius: 8px;
    background: var(--color-background-light);
    color: var(--color-text-secondary);
    font-size: 1.1rem;
    cursor: pointer;
    place-items: center;
  }

  .board-panel {
    padding: 15px 10px;
  }

  .board-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .eligible-sp-list {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .scope-stats {
    width: 100%;
  }

  .mode-tabs button {
    gap: 8px;
    padding: 10px;
  }

  .mode-tabs small,
  .mode-icon {
    display: none;
  }

  .table-caption {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .ranking-table {
    overflow-x: hidden;
  }

  .table-head,
  .ranking-row {
    width: 100%;
    min-width: 0;
    grid-template-columns:
      minmax(34px, 0.45fr)
      minmax(70px, 1fr)
      minmax(58px, 0.75fr)
      minmax(78px, 1fr);
  }

  .table-head.with-sp,
  .ranking-row:has(.sp-cell) {
    grid-template-columns:
      minmax(34px, 0.45fr)
      minmax(70px, 1fr)
      minmax(58px, 0.75fr)
      minmax(78px, 1fr);
  }

  .table-head {
    padding-inline: 8px;
  }

  .table-head.with-sp > span:last-child {
    display: none;
  }

  .ranking-row {
    padding-inline: 8px;
  }

  .ranking-row:has(.sp-cell) {
    row-gap: 5px;
    padding-block: 8px;
  }

  .ranking-row .sp-cell {
    grid-column: 2 / -1;
    flex-wrap: wrap;
    padding: 0;
    overflow-x: visible;
  }

  .ranking-list {
    max-height: none;
    overflow-y: visible;
  }

  .page-note {
    flex-direction: column;
    gap: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

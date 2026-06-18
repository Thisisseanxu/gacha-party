<template>
  <div class="gacha-analysis-shell">
    <div class="analysis-toolbar">
      <button class="ghost-button" @click="emit('reset-view')">
        <ArrowLeft size="18" />
        返回
      </button>
    </div>

    <div class="dashboard-grid">
      <div class="summary-column">
        <div class="panel profile-panel">
          <div class="profile-row">
            <div class="profile-intro">
              <button class="uid-line" @click="showFullUid = !showFullUid">
                <span>UID:</span>
                <strong>{{ displayPlayerId }}</strong>
                <PreviewCloseOne v-if="!showFullUid" class="uid-hidden-icon" size="18" />
              </button>
              <button
                class="achievement-title"
                :style="achievementStyle"
                @click="achievementMode = achievementMode === 'recent' ? 'history' : 'recent'"
              >
                <span class="achievement-mode">{{ achievementModeText }}</span>
                {{ achievementTitle }}
              </button>
              <p>
                高级抽数：<b>{{ totalOverview.advancedPulls }}</b> 抽
              </p>
              <p>
                普通抽数：<b>{{ totalOverview.normalPulls }}</b> 抽
              </p>
              <p>
                SP总数：<b>{{ totalOverview.spCount }}</b>
              </p>
            </div>
            <div class="latest-sp">
              <img
                :src="latestSp?.imageUrl || placeholderImage"
                :alt="latestSp?.name || '暂无SP'"
              />
              <span>{{ latestSp ? '最新SP角色' : '暂无SP记录' }}</span>
            </div>
          </div>
          <div v-if="gachaAchievements.length" class="achievement-badges" aria-label="抽卡成就">
            <span v-for="item in gachaAchievements" :key="item.key" class="achievement-badge">
              {{ item.name }}<b v-if="item.count > 1">×{{ item.count }}</b>
            </span>
          </div>
          <div class="profile-metrics">
            <div>
              <b>{{ formatAverage(totalOverview.avgSp) }}</b>
              <span>每SP花费</span>
            </div>
            <div>
              <b>{{ formatAverage(groupAnalyses.normal.avgSsr) }}</b>
              <span>常驻池每金</span>
            </div>
          </div>
        </div>

        <nav ref="dashboardTabsRef" class="dashboard-tabs" aria-label="抽卡分析内容">
          <button
            v-for="section in sections"
            :key="section.id"
            :data-section-id="section.id"
            :class="{ active: activeSection === section.id }"
            @click="selectSection(section.id)"
          >
            {{ section.name }}
          </button>
          <div class="dashboard-nav-underline" :style="dashboardUnderlineStyle"></div>
        </nav>

        <section
          :id="sections[0].id"
          class="panel summary-panel mode-panel"
          :class="{ active: activeSection === 'summary' }"
        >
          <header class="panel-header">
            <div>
              <h3>抽卡统计</h3>
            </div>
          </header>

          <div class="pool-switch-row">
            <button type="button" class="scroll-cue left" @click="scrollPoolTabs('summary', -1)">
              ‹
            </button>
            <div
              ref="summaryTabsRef"
              class="group-tabs compact"
              @wheel.prevent="handlePoolTabsWheel($event, 'summary')"
              @pointerdown="startPoolTabsDrag($event, 'summary')"
              @pointermove="movePoolTabsDrag"
              @pointerup="endPoolTabsDrag"
              @pointercancel="endPoolTabsDrag"
              @pointerleave="endPoolTabsDrag"
            >
              <button
                v-for="group in groupList"
                :key="group.key"
                :data-group-key="group.key"
                :class="{ active: summaryGroupKey === group.key }"
                @click="selectSummaryGroup(group.key)"
              >
                {{ group.name }}
              </button>
              <div class="group-tabs-underline" :style="summaryTabsUnderlineStyle"></div>
            </div>
            <button type="button" class="scroll-cue right" @click="scrollPoolTabs('summary', 1)">
              ›
            </button>
            <label class="ssr-toggle">
              SSR
              <input v-model="showSummarySsr" type="checkbox" />
            </label>
          </div>

          <div class="summary-stats">
            <div>
              <b>{{ selectedSummary.totalPulls }}</b>
              <span>总抽卡</span>
            </div>
            <div v-if="!isNormalSummary">
              <b>{{ selectedSummary.spCount }}</b>
              <span>SP数</span>
            </div>
            <div>
              <b>{{ selectedSummary.ssrCount }}</b>
              <span>SSR数</span>
            </div>
          </div>

          <div class="sp-timeline">
            <article
              v-for="item in selectedSummaryTimeline"
              :key="item.key"
              class="timeline-row"
              :class="{ simple: !shouldShowSummarySsr }"
            >
              <div class="timeline-body">
                <div
                  class="history-item-bar"
                  :style="getHistoryItemStyle(item.count, isNormalSummary)"
                >
                  <div class="char-info">
                    <img
                      :src="item.imageUrl"
                      :alt="item.name"
                      class="avatar-lg"
                      :class="{ placeholder: item.isPityPlaceholder }"
                      :style="
                        item.isPityPlaceholder
                          ? getPlaceholderAvatarStyle(item.count, isNormalSummary)
                          : null
                      "
                    />
                    <span class="char-title">{{ item.name }}</span>
                  </div>
                  <div class="pull-info">
                    <span class="pull-count">{{ item.count }}</span>
                  </div>
                </div>
                <div v-if="shouldShowSummarySsr" class="timeline-bottom">
                  <span class="pool-name">{{
                    item.isPityPlaceholder ? '当前' : formatShortDate(item.createdAt)
                  }}</span>
                  <div class="ssr-strip">
                    <template v-if="item.ssrInSegment?.length">
                      <img
                        v-for="ssr in item.ssrInSegment"
                        :key="ssr.key"
                        :src="ssr.imageUrl"
                        :alt="ssr.name"
                        :title="ssr.name"
                      />
                    </template>
                  </div>
                </div>
              </div>
            </article>
            <p v-if="selectedSummaryTimeline.length === 0" class="empty-text">
              {{ summaryEmptyText }}
            </p>
          </div>
        </section>
      </div>

      <section
        :id="sections[1].id"
        class="panel card-mode-panel mode-panel"
        :class="{ active: activeSection === 'card-mode' }"
      >
        <header class="panel-header">
          <div>
            <h3>角色一览</h3>
          </div>
        </header>

        <div class="card-mode-list">
          <article v-for="pool in cardModePools" :key="pool.key" class="card-pool-card">
            <header class="card-pool-header">
              <div class="card-pool-main">
                <span v-if="pool.title" class="pool-title-badge" :style="pool.titleStyle">
                  {{ pool.title }}
                </span>
                <h4>{{ pool.displayName }}</h4>
              </div>
              <div class="card-pool-stats">
                <div>
                  <b>{{ pool.totalPulls }}</b>
                  <small>抽卡数</small>
                </div>
                <div>
                  <b>{{ formatAverageOne(pool.average) }}</b>
                  <small>{{ pool.averageLabel }}</small>
                </div>
                <div>
                  <b>{{ pool.hitCount }}</b>
                  <small>{{ pool.hitLabel }}</small>
                </div>
              </div>
            </header>

            <div v-if="pool.history.length" class="character-overview-grid">
              <div
                v-for="item in pool.visibleHistory"
                :key="item.key"
                class="overview-item compact"
                :style="{ backgroundColor: getAlphaBgWithCount(item.count, pool.isNormal) }"
              >
                <img :src="item.imageUrl" :alt="item.name" class="overview-avatar" />
                <span class="overview-pull-count">{{ item.count }}</span>
              </div>
            </div>
            <div v-if="pool.canExpand || pool.canCollapse" class="card-pool-actions">
              <button v-if="pool.canCollapse" type="button" @click="collapseCardPool(pool.key)">
                收起
              </button>
              <button v-if="pool.canExpand" type="button" @click="expandCardPool(pool.key)">
                查看更多
              </button>
            </div>
            <p v-if="pool.history.length === 0" class="empty-text">{{ pool.emptyText }}</p>
          </article>
        </div>
      </section>

      <section
        :id="sections[2].id"
        class="panel recent-panel mode-panel"
        :class="{ active: activeSection === 'recent-pools' }"
      >
        <header class="panel-header">
          <div>
            <h3>卡池详情</h3>
          </div>
        </header>

        <div class="recent-list">
          <article v-for="pool in recentPools" :key="pool.id" class="pool-card">
            <header class="pool-card-header">
              <div class="pool-card-main">
                <h4>{{ pool.name }}</h4>
                <span>{{ pool.timeLabel }}</span>
              </div>
              <div v-if="pool.totalPulls" class="pool-stats">
                <div>
                  <b>{{ pool.totalPulls }}</b>
                  <small>抽卡数</small>
                </div>
                <div v-if="!pool.isNormal">
                  <b>{{ pool.spCount }}</b>
                  <small>SP数</small>
                </div>
                <div>
                  <b>{{ pool.ssrCount }}</b>
                  <small>SSR数</small>
                </div>
              </div>
              <div v-else class="pool-not-pulled">未抽取</div>
            </header>
            <p v-if="pool.spCount" class="pool-sp-summary">
              <b v-if="pool.title" :style="pool.titleStyle">{{ pool.title }}</b>
              该卡池平均<span>{{ pool.avgSpText }}</span
              >抽出SP
            </p>
            <div v-if="pool.spCards.length" class="pool-card-grid sp-cards">
              <article v-for="card in pool.spCards" :key="card.id" class="mini-card sp-card">
                <img :src="card.imageUrl" :alt="card.name" />
                <span>{{ card.count }}</span>
              </article>
            </div>
            <div v-if="pool.ssrCards.length" class="pool-card-grid ssr-cards">
              <article v-for="card in pool.ssrCards" :key="card.id" class="mini-card ssr-card">
                <img :src="card.imageUrl" :alt="card.name" />
                <span>{{ card.count }}</span>
              </article>
            </div>
          </article>
          <p v-if="recentPools.length === 0" class="empty-text">暂无卡池信息。</p>
        </div>
      </section>
    </div>

    <button v-if="showBackToTop" class="back-to-top" @click="scrollPageTop">↑</button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowLeft, PreviewCloseOne } from '@icon-park/vue-next'

import { cardMap } from '@/data/cards.js'
import { SP, SSR } from '@/data/constant.js'
import { colors } from '@/styles/colors.js'

const props = defineProps({
  limitGachaData: { type: Array, required: true },
  normalGachaData: { type: Array, required: true },
  advancedNormalGachaData: { type: Array, required: true },
  otherGachaData: { type: Object, required: true },
  eventGachaData: { type: Array, required: true },
  limitedFukeGachaData: { type: Array, required: true },
  eventFukeGachaData: { type: Array, required: true },
  playerId: { type: String, required: true },
  jsonInput: { type: String, required: true },
  LIMITED_CARD_POOLS_ID: { type: Array, default: () => [] },
  EVENT_CARD_POOLS_ID: { type: Array, default: () => [] },
  LIMITED_FUKE_CARD_POOLS_ID: { type: Array, default: () => [] },
  EVENT_FUKE_CARD_POOLS_ID: { type: Array, default: () => [] },
  OTHER_CARD_POOLS_ID: { type: Array, default: () => [] },
  CARDPOOLS_NAME_MAP: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['reset-view'])

const placeholderImage = '/images/characters/placeholder.webp'
const sections = [
  { id: 'summary', name: '抽卡统计' },
  { id: 'card-mode', name: '角色一览' },
  { id: 'recent-pools', name: '近期卡池' },
]

const activeSection = ref('summary')
const summaryGroupKey = ref('limited')
const poolMeta = ref({ names: {}, times: {} })
const showFullUid = ref(false)
const achievementMode = ref('recent')
const showBackToTop = ref(false)
const showSummarySsr = ref(true)
const dashboardTabsRef = ref(null)
const dashboardUnderlineStyle = ref({ left: '0px', width: '0px' })
const summaryTabsRef = ref(null)
const summaryTabsUnderlineStyle = ref({ left: '0px', width: '0px' })
const poolTabsDrag = ref(null)
const CARD_MODE_PAGE_SIZE = 60
const expandedCardPools = ref({})

const LIMITPOOL_TITLE_MAP = {
  32: {
    title: '天选之子',
    text_color: colors.text.highlight,
    background: colors.game.primary,
  },
  34.5: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  35.75: { title: '小欧皇', background: colors.colorOfLuck.low },
  37.5: { title: '平平无奇', background: colors.colorOfLuck.medium },
  39: { title: '小非酋', background: colors.colorOfLuck.high },
  41: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '面目全非', background: colors.colorOfLuck.veryHigh },
}

const NORMALPOOL_TITLE_MAP = {
  8.75: {
    title: '天选之子',
    text_color: colors.text.highlight,
    background: colors.game.primary,
  },
  9.75: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  10.5: { title: '小欧皇', background: colors.colorOfLuck.low },
  11.5: { title: '平平无奇', background: colors.colorOfLuck.medium },
  12.25: { title: '小非酋', background: colors.colorOfLuck.high },
  13.25: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '面目全非', background: colors.colorOfLuck.veryHigh },
}

const countSameTimeTenPulls = (records, predicate = () => true) => {
  const groups = new Map()
  for (const record of records) {
    const key = `${record.gachaId}-${record.createdAt}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(record)
  }
  return Array.from(groups.values()).filter((group) => group.length === 10 && predicate(group))
    .length
}

const ACHIEVEMENT_RULES = [
  {
    key: 'triple-sp',
    name: '十连四红！！！',
    count: ({ records }) =>
      countSameTimeTenPulls(
        records,
        (group) => group.filter((item) => item.rarity === SP).length >= 4,
      ),
  },
  {
    key: 'triple-sp',
    name: '十连三红！',
    count: ({ records }) =>
      countSameTimeTenPulls(
        records,
        (group) => group.filter((item) => item.rarity === SP).length === 3,
      ),
  },
  {
    key: 'double-sp',
    name: '十连双红',
    count: ({ records }) =>
      countSameTimeTenPulls(
        records,
        (group) => group.filter((item) => item.rarity === SP).length === 2,
      ),
  },
  {
    key: 'super-lucky',
    name: '超欧',
    count: ({ spHistory }) => spHistory.filter((item) => item.count < 15).length,
  },
  {
    key: 'single-pull-sp',
    name: '一发入魂',
    count: ({ spHistory }) => spHistory.filter((item) => item.count === 1).length,
  },
  {
    key: 'super-unlucky',
    name: '超非',
    count: ({ spHistory }) => spHistory.filter((item) => item.count > 50).length,
  },
  {
    key: 'hard-pity',
    name: '究极保底',
    count: ({ spHistory }) => spHistory.filter((item) => item.count === 60).length,
  },
]

onMounted(async () => {
  try {
    const response = await fetch(`/data/gacha_pools.json?t=${Date.now()}`)
    if (response.ok) poolMeta.value = await response.json()
  } catch {
    poolMeta.value = { names: {}, times: {} }
  }
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  window.addEventListener('resize', updateNavigationUnderlines)
  handleWindowScroll()
  requestAnimationFrame(updateNavigationUnderlines)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleWindowScroll)
  window.removeEventListener('resize', updateNavigationUnderlines)
})

const handleWindowScroll = () => {
  showBackToTop.value = window.scrollY > 420
}

const updateDashboardUnderline = () => {
  const tabs = dashboardTabsRef.value
  if (!tabs) return
  const activeButton = tabs.querySelector(`[data-section-id="${activeSection.value}"]`)
  if (!activeButton) return
  dashboardUnderlineStyle.value = {
    left: `${activeButton.offsetLeft}px`,
    width: `${activeButton.offsetWidth}px`,
  }
}

const selectSection = (id) => {
  activeSection.value = id
  requestAnimationFrame(updateDashboardUnderline)
}

const updateSummaryTabsUnderline = () => {
  const tabs = summaryTabsRef.value
  if (!tabs) return
  const activeButton = tabs.querySelector(`[data-group-key="${summaryGroupKey.value}"]`)
  if (!activeButton) return
  summaryTabsUnderlineStyle.value = {
    left: `${activeButton.offsetLeft}px`,
    width: `${activeButton.offsetWidth}px`,
  }
}

const updateNavigationUnderlines = () => {
  updateDashboardUnderline()
  updateSummaryTabsUnderline()
}

const selectSummaryGroup = (key) => {
  summaryGroupKey.value = key
  requestAnimationFrame(updateSummaryTabsUnderline)
}

const scrollPageTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getPoolTabsElement = (type) => (type === 'summary' ? summaryTabsRef.value : null)

const scrollPoolTabs = (type, direction) => {
  const element = getPoolTabsElement(type)
  if (!element) return
  element.scrollBy({
    left: direction * Math.max(120, element.clientWidth * 0.72),
    behavior: 'smooth',
  })
}

const handlePoolTabsWheel = (event, type) => {
  const element = getPoolTabsElement(type)
  if (!element) return
  element.scrollLeft += event.deltaX || event.deltaY
}

const startPoolTabsDrag = (event, type) => {
  if (event.target?.closest?.('button')) return
  if (event.pointerType !== 'mouse') return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const element = getPoolTabsElement(type)
  if (!element) return
  poolTabsDrag.value = {
    element,
    pointerId: event.pointerId,
    startX: event.clientX,
    startScrollLeft: element.scrollLeft,
    moved: false,
  }
  element.setPointerCapture?.(event.pointerId)
}

const movePoolTabsDrag = (event) => {
  const drag = poolTabsDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return
  const delta = event.clientX - drag.startX
  if (Math.abs(delta) > 3) drag.moved = true
  drag.element.scrollLeft = drag.startScrollLeft - delta
}

const endPoolTabsDrag = (event) => {
  const drag = poolTabsDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return
  drag.element.releasePointerCapture?.(event.pointerId)
  poolTabsDrag.value = null
}

const getPoolName = (id) =>
  props.CARDPOOLS_NAME_MAP?.[String(id)] || poolMeta.value.names?.[String(id)] || `卡池${id}`

const getCardInfoAndRemovePrefix = (itemId) => {
  const id = String(itemId)
  const cardId = id.startsWith('15') ? id.slice(2) : id
  return cardMap.get(cardId) || null
}

const normalizeRecord = (record) => {
  const card = getCardInfoAndRemovePrefix(record.item_id)
  const rawCreatedAt = Number(record.created_at) || 0
  const createdAtMs = rawCreatedAt > 0 && rawCreatedAt < 1e12 ? rawCreatedAt * 1000 : rawCreatedAt
  return {
    ...(card || {
      id: String(record.item_id),
      name: `未知角色 (${record.item_id})`,
      rarity: 'UNKNOWN',
      imageUrl: placeholderImage,
    }),
    key: `${record.gacha_id}-${record.id}-${record.item_id}`,
    recordId: record.id,
    gachaId: String(record.gacha_id),
    poolName: getPoolName(record.gacha_id),
    createdAt: rawCreatedAt,
    createdAtMs,
  }
}

const sortRecordsAsc = (records) =>
  [...records].sort(
    (a, b) =>
      (Number(a.created_at) || 0) - (Number(b.created_at) || 0) ||
      (Number(a.id) || 0) - (Number(b.id) || 0),
  )

const sortHistoryAsc = (a, b) =>
  a.createdAt - b.createdAt || (Number(a.recordId) || 0) - (Number(b.recordId) || 0)

const sortHistoryDesc = (a, b) =>
  b.createdAt - a.createdAt || (Number(b.recordId) || 0) - (Number(a.recordId) || 0)

const calculateAverage = (items) =>
  items.length ? items.reduce((total, item) => total + item, 0) / items.length : 0

const buildCharacterCards = (history) => {
  const stats = new Map()
  for (const item of history) {
    const existing = stats.get(item.id)
    if (existing) {
      existing.count += 1
      existing.firstCount = Math.min(existing.firstCount, item.count)
      existing.latestAt = Math.max(existing.latestAt, item.createdAt)
    } else {
      stats.set(item.id, {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        rarity: item.rarity,
        count: 1,
        firstCount: item.count,
        latestAt: item.createdAt,
      })
    }
  }
  return Array.from(stats.values()).sort((a, b) => b.latestAt - a.latestAt)
}

const mergeAnalyses = (name, analyses) => {
  const totalPulls = analyses.reduce((total, item) => total + item.totalPulls, 0)
  const spHistory = analyses
    .flatMap((item) => item.spHistory)
    .sort(sortHistoryDesc)
  const ssrHistory = analyses
    .flatMap((item) => item.ssrHistory)
    .sort(sortHistoryDesc)
  const records = analyses.flatMap((item) => item.records).sort(sortHistoryDesc)
  const currentSpPity = analyses.reduce((total, item) => total + item.currentSpPity, 0)
  const currentSsrPity = analyses.reduce((total, item) => total + item.currentSsrPity, 0)
  const currentSsrInSegment = analyses
    .flatMap((item) => item.currentSsrInSegment || [])
    .sort(sortHistoryAsc)

  return {
    name,
    totalPulls,
    spCount: spHistory.length,
    ssrCount: ssrHistory.length,
    currentSpPity,
    currentSsrPity,
    currentSsrInSegment,
    avgSp: calculateAverage(spHistory.map((item) => item.count)),
    avgSsr: calculateAverage(ssrHistory.map((item) => item.count)),
    spHistory,
    ssrHistory,
    records,
    spCards: buildCharacterCards(spHistory),
    ssrCards: buildCharacterCards(ssrHistory),
  }
}

const buildPoolAnalysis = (records, name = '') => {
  const sorted = sortRecordsAsc(records)
  let spCounter = 0
  let ssrCounter = 0
  let ssrInSegment = []
  const normalizedRecords = []
  const spHistory = []
  const ssrHistory = []

  for (const raw of sorted) {
    const item = normalizeRecord(raw)
    normalizedRecords.push(item)
    spCounter += 1
    ssrCounter += 1

    if (item.rarity === SSR) {
      const ssrItem = { ...item, count: ssrCounter }
      ssrHistory.push(ssrItem)
      ssrInSegment.push(ssrItem)
      ssrCounter = 0
    }

    if (item.rarity === SP) {
      spHistory.push({
        ...item,
        count: spCounter,
        ssrInSegment: [...ssrInSegment].sort(sortHistoryAsc),
      })
      spCounter = 0
      ssrInSegment = []
    }
  }

  return mergeAnalyses(name, [
    {
      totalPulls: sorted.length,
      currentSpPity: spCounter,
      currentSsrPity: ssrCounter,
      currentSsrInSegment: [...ssrInSegment].sort(sortHistoryAsc),
      spHistory,
      ssrHistory,
      records: normalizedRecords,
    },
  ])
}

const analysisByPoolId = computed(() => {
  const all = [
    ...props.limitGachaData,
    ...props.eventGachaData,
    ...props.limitedFukeGachaData,
    ...props.eventFukeGachaData,
    ...props.normalGachaData,
    ...props.advancedNormalGachaData,
    ...Object.values(props.otherGachaData).flat(),
  ]
  const grouped = new Map()
  for (const record of all) {
    const id = String(record.gacha_id)
    if (!grouped.has(id)) grouped.set(id, [])
    grouped.get(id).push(record)
  }
  return new Map(
    Array.from(grouped.entries()).map(([id, records]) => [
      id,
      buildPoolAnalysis(records, getPoolName(id)),
    ]),
  )
})

const buildAnalysesForIds = (ids) =>
  ids.map((id) => analysisByPoolId.value.get(String(id))).filter(Boolean)

const groupAnalyses = computed(() => {
  const limitedBase = buildPoolAnalysis(props.limitGachaData, '限定')
  const eventBase = buildPoolAnalysis(props.eventGachaData, '联动')
  const limitedFuke = mergeAnalyses(
    '限定复刻',
    buildAnalysesForIds(props.LIMITED_FUKE_CARD_POOLS_ID),
  )
  const eventFuke = mergeAnalyses('联动复刻', buildAnalysesForIds(props.EVENT_FUKE_CARD_POOLS_ID))
  const advancedNormal = buildPoolAnalysis(props.advancedNormalGachaData, '高级常驻')
  const normal = buildPoolAnalysis(props.normalGachaData, '常驻')

  return {
    limited: limitedBase,
    limitedFuke,
    event: eventBase,
    eventFuke,
    advancedNormal,
    normal,
  }
})

const getPoolStartTime = (id) => parsePoolDate(poolMeta.value.times?.[String(id)]?.start)

const getAnalysisLatestTime = (analysis) =>
  analysis.records.reduce((latest, item) => Math.max(latest, item.createdAtMs || 0), 0)

const otherPoolGroups = computed(() =>
  props.OTHER_CARD_POOLS_ID.map((id) => {
    const poolId = String(id)
    const analysis =
      analysisByPoolId.value.get(poolId) || buildPoolAnalysis([], getPoolName(poolId))
    return {
      key: `pool-${poolId}`,
      poolId,
      name: getPoolName(poolId),
      sortTime: getPoolStartTime(poolId) || getAnalysisLatestTime(analysis),
      ...analysis,
    }
  }).sort((a, b) => b.sortTime - a.sortTime || Number(b.poolId) - Number(a.poolId)),
)

const groupList = computed(() => [
  { key: 'limited', name: '限定', ...groupAnalyses.value.limited },
  { key: 'limitedFuke', name: '限定复刻', ...groupAnalyses.value.limitedFuke },
  { key: 'event', name: '联动', ...groupAnalyses.value.event },
  { key: 'eventFuke', name: '联动复刻', ...groupAnalyses.value.eventFuke },
  { key: 'advancedNormal', name: '高级常驻', ...groupAnalyses.value.advancedNormal },
  { key: 'normal', name: '常驻', ...groupAnalyses.value.normal },
  ...otherPoolGroups.value,
])

const selectedSummary = computed(
  () => groupList.value.find((item) => item.key === summaryGroupKey.value) || groupList.value[0],
)

const isNormalSummary = computed(() => selectedSummary.value?.key === 'normal')
const shouldShowSummarySsr = computed(() => showSummarySsr.value && !isNormalSummary.value)
const buildPityPlaceholder = (group) => {
  const isNormal = group.key === 'normal'
  const count = isNormal ? group.currentSsrPity : group.currentSpPity
  if (!count) return null
  return {
    key: `${group.key}-current-pity`,
    id: `${group.key}-current-pity`,
    name: '已垫',
    imageUrl: placeholderImage,
    rarity: isNormal ? SSR : SP,
    count,
    createdAt: 0,
    createdAtMs: 0,
    ssrInSegment: isNormal ? [] : group.currentSsrInSegment || [],
    isPityPlaceholder: true,
  }
}
const selectedSummaryTimeline = computed(() => {
  const history = isNormalSummary.value
    ? selectedSummary.value.ssrHistory
    : selectedSummary.value.spHistory
  const placeholder = buildPityPlaceholder(selectedSummary.value)
  return placeholder ? [placeholder, ...history] : history
})
const summaryEmptyText = computed(() =>
  isNormalSummary.value ? '暂无SSR记录。' : '暂无SP记录，SSR统计可在卡池详情查看',
)

const totalOverview = computed(() => {
  const groups = groupList.value
  const advancedGroups = groups.filter((group) => group.key !== 'normal')
  const normalPulls = groupAnalyses.value.normal.totalPulls
  const advancedPulls = advancedGroups.reduce((total, group) => total + group.totalPulls, 0)
  const spHistory = groups
    .flatMap((group) => group.spHistory)
    .sort(sortHistoryDesc)
  const ssrHistory = groups.flatMap((group) => group.ssrHistory)
  const scoreSpHistory = advancedGroups
    .filter((group) => group.key !== 'advancedNormal')
    .flatMap((group) => group.spHistory)
  return {
    totalPulls: normalPulls + advancedPulls,
    normalPulls,
    advancedPulls,
    spCount: spHistory.length,
    ssrCount: ssrHistory.length,
    avgSp: calculateAverage(scoreSpHistory.map((item) => item.count)),
    currentSpPity: groups.reduce((total, group) => total + group.currentSpPity, 0),
    currentSsrPity: groups.reduce((total, group) => total + group.currentSsrPity, 0),
    latestSp: spHistory[0] || null,
  }
})

const latestSp = computed(() => totalOverview.value.latestSp)
const titleForValue = (value, titleMap = LIMITPOOL_TITLE_MAP, fallback = '静待SP') => {
  if (!value)
    return {
      title: fallback,
      background: colors.background.lighter,
      text_color: colors.text.primary,
    }
  const sortedKeys = Object.keys(titleMap)
    .map(Number)
    .sort((a, b) => a - b)
  const key = sortedKeys.find((item) => value <= item)
  return titleMap[key] || titleMap[120]
}

const appendPoolSuffix = (name) => (String(name).endsWith('池') ? name : `${name}池`)

const cardModePools = computed(() =>
  groupList.value.map((group) => {
    const isNormal = group.key === 'normal'
    const shouldShowTitle = group.key !== 'advancedNormal'
    const history = isNormal ? group.ssrHistory : group.spHistory
    const average = isNormal ? group.avgSsr : group.avgSp
    const title =
      shouldShowTitle && average
        ? titleForValue(average, isNormal ? NORMALPOOL_TITLE_MAP : LIMITPOOL_TITLE_MAP)
        : null
    const visibleCount = expandedCardPools.value[group.key] || CARD_MODE_PAGE_SIZE
    return {
      ...group,
      isNormal,
      history,
      visibleHistory: history.slice(0, visibleCount),
      displayName: appendPoolSuffix(group.name),
      average,
      title: title?.title || '',
      titleStyle: {
        backgroundColor: title?.background,
        color: title?.text_color || colors.text.primary,
      },
      averageLabel: isNormal ? '每SSR花费' : '每SP花费',
      hitLabel: isNormal ? '出金数' : '出红数',
      hitCount: isNormal ? group.ssrCount : group.spCount,
      canExpand: history.length > visibleCount,
      canCollapse: visibleCount > CARD_MODE_PAGE_SIZE,
      emptyText: isNormal ? '暂无SSR记录。' : '暂无SP记录。',
    }
  }),
)

const expandCardPool = (key) => {
  expandedCardPools.value = {
    ...expandedCardPools.value,
    [key]: (expandedCardPools.value[key] || CARD_MODE_PAGE_SIZE) + CARD_MODE_PAGE_SIZE,
  }
}

const collapseCardPool = (key) => {
  const next = { ...expandedCardPools.value }
  delete next[key]
  expandedCardPools.value = next
}

const scoreAnalyses = computed(() => [
  buildPoolAnalysis(props.limitGachaData, '限定'),
  buildPoolAnalysis(props.eventGachaData, '联动'),
  ...buildAnalysesForIds(props.LIMITED_FUKE_CARD_POOLS_ID),
  ...buildAnalysesForIds(props.EVENT_FUKE_CARD_POOLS_ID),
  ...otherPoolGroups.value,
])

const gachaAchievements = computed(() => {
  const context = {
    records: scoreAnalyses.value.flatMap((analysis) => analysis.records),
    spHistory: scoreAnalyses.value.flatMap((analysis) => analysis.spHistory),
  }
  return ACHIEVEMENT_RULES.map((rule) => ({
    key: rule.key,
    name: rule.name,
    count: rule.count(context),
  })).filter((item) => item.count > 0)
})

const historicalScoreAverage = computed(() =>
  calculateAverage(
    scoreAnalyses.value.flatMap((analysis) => analysis.spHistory).map((item) => item.count),
  ),
)

const recentScoreAverage = computed(() => {
  const recentSpHistory = scoreAnalyses.value
    .flatMap((analysis) => analysis.spHistory)
    .sort(sortHistoryDesc)
    .slice(0, 20) // 取最近20条SP记录的平均抽数
  return calculateAverage(recentSpHistory.map((item) => item.count))
})

const achievementValue = computed(() =>
  achievementMode.value === 'recent' ? recentScoreAverage.value : historicalScoreAverage.value,
)

const achievement = computed(() => titleForValue(achievementValue.value))
const achievementTitle = computed(() => achievement.value.title)
const achievementModeText = computed(() =>
  achievementMode.value === 'recent' ? '近期\n评价' : '全部\n卡池',
)
const achievementStyle = computed(() => ({
  backgroundColor: achievement.value.background,
  color: achievement.value.text_color || colors.text.primary,
}))

const maskedPlayerId = computed(() => {
  const id = String(props.playerId || '')
  return `${id.slice(0, 2)}***${id.slice(-2)}`
})
const displayPlayerId = computed(() => (showFullUid.value ? props.playerId : maskedPlayerId.value))

const formatAverage = (value) => (value > 0 ? `${value.toFixed(2)}抽` : '暂无')
const formatAverageOne = (value) => (value > 0 ? `${value.toFixed(1)}抽` : '暂无')

const parsePoolDate = (dateText) => {
  if (!dateText) return 0
  const parsed = new Date(String(dateText).replace(' ', 'T')).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

const formatPoolDatePart = (dateText) => {
  const date = new Date(String(dateText).replace(' ', 'T'))
  if (Number.isNaN(date.getTime()))
    return String(dateText || '')
      .slice(2, 10)
      .replace(/-/g, '/')
  return `${String(date.getFullYear()).slice(2)}/${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}/${String(date.getDate()).padStart(2, '0')}`
}

const formatPoolDateRange = (time, isPermanentPool = false) => {
  if (isPermanentPool || !time?.finish) return '常驻'
  return `${formatPoolDatePart(time.start)}至${formatPoolDatePart(time.finish)}`
}

const formatShortDate = (timestamp) => {
  const raw = Number(timestamp) || 0
  const date = new Date(raw > 0 && raw < 1e12 ? raw * 1000 : raw)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getFullYear()).slice(2)}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`
}

const isPoolOpen = (time) => {
  if (!time) return true
  if (!time.finish) return true
  const finish = new Date(String(time.finish).replace(' ', 'T')).getTime()
  return Number.isFinite(finish) && finish >= Date.now()
}

const poolIdIn = (poolId, ids) => ids.map(String).includes(String(poolId))

const getPoolDetailSpHistory = (poolId, fallbackAnalysis) => {
  const id = String(poolId)
  if (poolIdIn(id, props.LIMITED_CARD_POOLS_ID)) {
    return groupAnalyses.value.limited.spHistory.filter((item) => item.gachaId === id)
  }
  if (poolIdIn(id, props.EVENT_CARD_POOLS_ID)) {
    return groupAnalyses.value.event.spHistory.filter((item) => item.gachaId === id)
  }
  if (poolIdIn(id, props.LIMITED_FUKE_CARD_POOLS_ID)) {
    return groupAnalyses.value.limitedFuke.spHistory.filter((item) => item.gachaId === id)
  }
  if (poolIdIn(id, props.EVENT_FUKE_CARD_POOLS_ID)) {
    return groupAnalyses.value.eventFuke.spHistory.filter((item) => item.gachaId === id)
  }
  if (id === '10000') {
    return groupAnalyses.value.advancedNormal.spHistory.filter((item) => item.gachaId === id)
  }
  if (id === '9') {
    return groupAnalyses.value.normal.spHistory.filter((item) => item.gachaId === id)
  }
  return fallbackAnalysis.spHistory.filter((item) => item.gachaId === id)
}

const recentPools = computed(() => {
  const names = { ...props.CARDPOOLS_NAME_MAP, ...(poolMeta.value.names || {}) }
  const times = poolMeta.value.times || {}
  const ids = new Set([...Object.keys(names), ...Object.keys(times), '9', '10000'])

  return Array.from(ids)
    .map((id) => {
      const poolId = String(id)
      const time = times[id] || {}
      const analysis = analysisByPoolId.value.get(poolId) || buildPoolAnalysis([], getPoolName(id))
      const open = isPoolOpen(time)
      const isNormal = poolId === '9'
      const isAdvancedNormal = poolId === '10000'
      const permanent = isNormal || isAdvancedNormal || !time.finish
      const spHistory = getPoolDetailSpHistory(poolId, analysis)
      const avgSp = calculateAverage(spHistory.map((item) => item.count))
      const title = isAdvancedNormal ? null : titleForValue(avgSp)
      return {
        id: poolId,
        name: getPoolName(id),
        timeLabel: formatPoolDateRange(time, permanent),
        startTime: parsePoolDate(time.start),
        open: open && !permanent,
        permanent,
        isNormal,
        isAdvancedNormal,
        totalPulls: analysis.totalPulls,
        spCount: spHistory.length,
        ssrCount: analysis.ssrCount,
        avgSpText: avgSp.toFixed(2),
        title: title?.title || '',
        titleStyle: {
          backgroundColor: title?.background,
          color: title?.text_color || colors.text.primary,
        },
        spCards: buildCharacterCards(spHistory),
        ssrCards: analysis.ssrCards,
      }
    })
    .filter((pool) => pool.open || pool.permanent || pool.totalPulls > 0)
    .sort((a, b) => {
      const rank = (pool) => {
        if (pool.open) return 0
        if (pool.permanent) return 1
        return 2
      }
      const rankDiff = rank(a) - rank(b)
      if (rankDiff) return rankDiff
      return b.startTime - a.startTime
    })
})

const getHistoryProgressColor = (count, isNormal = false) => {
  if ((isNormal && count < 10) || (!isNormal && count < 31)) {
    return colors.colorOfLuck.veryLow
  } else if ((isNormal && count < 15) || (!isNormal && count < 41)) {
    return colors.colorOfLuck.medium
  } else {
    return colors.colorOfLuck.veryHigh
  }
}

const getHistoryItemStyle = (count, isNormal = false) => {
  const percentage = Math.min(count / 60, 1) * 95 + 5
  const progressBarColor = getHistoryProgressColor(count, isNormal)
  return {
    background: `linear-gradient(to right, ${progressBarColor} ${percentage}%, ${colors.colorOfLuck.background} ${percentage}%)`,
  }
}

const getPlaceholderAvatarStyle = (count, isNormal = false) => ({
  backgroundColor: getHistoryProgressColor(count, isNormal),
})

const getAlphaBgWith = (type) => {
  const colorMap = {
    veryHigh: colors.colorOfLuck.veryHigh,
    medium: colors.colorOfLuck.medium,
    veryLow: colors.colorOfLuck.veryLow,
  }
  return (colorMap[type] || 'transparent').replace(/[\d.]+\)$/g, '0.3)')
}

const getAlphaBgWithCount = (count, isNormal = false) => {
  if (isNormal) {
    if (count < 10) return getAlphaBgWith('veryLow')
    if (count < 15) return getAlphaBgWith('medium')
    return getAlphaBgWith('veryHigh')
  }
  if (count < 31) return getAlphaBgWith('veryLow')
  if (count < 41) return getAlphaBgWith('medium')
  return getAlphaBgWith('veryHigh')
}
</script>

<style scoped>
.gacha-analysis-shell {
  width: min(100%, 1680px);
  margin: 0 auto;
  padding: 14px;
  color: v-bind('colors.text.primary');
}

.analysis-toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid v-bind('colors.border.lighter');
  border-radius: 999px;
  background: v-bind('colors.background.overlay');
  color: v-bind('colors.text.primary');
  padding: 8px 14px;
  font-weight: 700;
  cursor: pointer;
}

.dashboard-tabs {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 0 4px;
  border-bottom: 2px solid v-bind('colors.border.lighter');
  background: v-bind('colors.background.content');
}

.group-tabs button {
  min-width: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: v-bind('colors.text.primary');
  padding: 10px 8px;
  font-weight: 900;
  cursor: pointer;
}

.group-tabs button.active {
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
}

.dashboard-tabs button {
  flex: 1 1 0;
  min-width: 0;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  color: v-bind('colors.text.secondary');
  padding: 8px 8px 9px;
  font-weight: 900;
  cursor: pointer;
  transition:
    color 0.2s ease-in-out,
    background-color 0.2s ease-in-out;
}

.dashboard-tabs button:hover {
  background: v-bind('colors.background.hover');
  color: v-bind('colors.text.primary');
}

.dashboard-tabs button.active {
  background: transparent;
  color: v-bind('colors.brand.primary');
}

.dashboard-nav-underline {
  position: absolute;
  bottom: -2px;
  height: 3px;
  border-radius: 999px;
  background: v-bind('colors.brand.primary');
  transition:
    left 0.3s ease-in-out,
    width 0.3s ease-in-out;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.mode-panel {
  display: none;
}

.mode-panel.active {
  display: block;
}

.panel {
  min-width: 0;
  border: 2px solid v-bind('colors.border.lighter');
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    v-bind('colors.background.light') 0%,
    v-bind('colors.background.content') 100%
  );
  box-shadow:
    inset 0 0 0 1px v-bind('colors.shadow.white'),
    0 10px 28px v-bind('colors.shadow.primary');
  overflow: hidden;
}

.profile-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 1rem;
}

.profile-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 4px;
}

.profile-intro {
  min-width: 0;
  text-align: left;
}

.profile-intro p,
.latest-sp span,
.pool-name,
.empty-text {
  color: v-bind('colors.text.secondary');
}

.uid-line,
.achievement-title {
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.uid-line {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  padding: 0;
  background: transparent;
  color: v-bind('colors.text.primary');
  text-align: left;
  white-space: nowrap;
}

.uid-line strong {
  min-width: 0;
  overflow: hidden;
  font-size: 1.2rem;
  text-overflow: ellipsis;
}

.uid-hidden-icon {
  flex: 0 0 auto;
  color: v-bind('colors.text.highlight');
}

.achievement-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0 4px 0;
  padding: 8px 12px;
  border-radius: 9px;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1;
  word-break: keep-all;
  box-shadow: 0 3px 0 v-bind('colors.shadow.primaryHover');
}

.achievement-mode {
  order: -1;
  white-space: pre-line;
  opacity: 0.86;
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.05;
  text-align: center;
}

.profile-intro p {
  margin: 0.125rem 0;
  font-size: 1.1rem;
}

.achievement-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.achievement-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 22px;
  padding: 2px 8px;
  border: 1px solid v-bind('colors.border.lighter');
  border-radius: 999px;
  color: v-bind('colors.text.secondary');
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.1;
  background: v-bind('colors.brand.primaryBackground');
}

.achievement-badge b {
  color: v-bind('colors.text.highlight');
  font-size: 0.76rem;
}

.profile-intro b,
.profile-metrics b,
.summary-stats b,
.card-pool-stats b,
.pool-stats b {
  color: v-bind('colors.text.highlight');
}

.latest-sp {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.latest-sp img {
  width: 96px;
  height: 96px;
  border: 4px solid v-bind('colors.border.lighter');
  border-radius: 50%;
  object-fit: cover;
}

.latest-sp span {
  text-align: center;
  line-height: 1.3;
}

.profile-metrics {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.profile-metrics div,
.summary-stats div {
  min-width: 0;
  text-align: center;
}

.profile-metrics b,
.summary-stats b,
.card-pool-stats b {
  display: block;
  font-size: 1.25rem;
  line-height: 1.05;
}

.profile-metrics span,
.summary-stats span,
.card-pool-stats small,
.pool-stats small {
  display: block;
  color: v-bind('colors.text.light');
  font-weight: 700;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  background: v-bind('colors.background.darker');
}

.panel-header h3,
.pool-card h4 {
  margin: 0;
}

.panel-header h3 {
  font-size: 1.35rem;
}

.pool-switch-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: v-bind('colors.background.content');
}

.summary-panel .pool-switch-row {
  grid-template-columns: auto minmax(0, 1fr) auto auto;
}

.group-tabs {
  position: relative;
  display: flex;
  min-width: 0;
  gap: 18px;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid v-bind('colors.border.lighter');
  cursor: grab;
  touch-action: pan-x pan-y;
  overscroll-behavior-inline: contain;
  -webkit-overflow-scrolling: touch;
  user-select: none;
}

.group-tabs:active {
  cursor: grabbing;
}

.group-tabs::-webkit-scrollbar {
  display: none;
}

.group-tabs button {
  position: relative;
  flex: 0 0 auto;
  min-width: max-content;
  padding: 8px 0 10px;
  border-radius: 0;
  background: transparent;
  color: v-bind('colors.text.light');
}

.group-tabs.compact button {
  padding-inline: 0;
}

.group-tabs button.active {
  background: transparent;
  color: v-bind('colors.text.highlight');
}

.group-tabs-underline {
  position: absolute;
  bottom: -1px;
  height: 2px;
  border-radius: 999px;
  background: v-bind('colors.text.highlight');
  content: '';
  pointer-events: none;
  transition:
    left 0.3s ease-in-out,
    width 0.3s ease-in-out;
}

.scroll-cue {
  width: 24px;
  min-width: 24px;
  height: 32px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: v-bind('colors.text.highlight');
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
}

.ssr-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: v-bind('colors.text.primary');
  font-weight: 900;
  white-space: nowrap;
}

.ssr-toggle input {
  accent-color: v-bind('colors.brand.primary');
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
  gap: 10px;
  padding: 14px 18px 0;
}

.sp-timeline,
.recent-list {
  padding: 8px;
}

.timeline-row {
  padding: 4px 0;
  border-bottom: 1px solid v-bind('colors.border.secondary');
}

.timeline-row.simple {
  border-bottom: 0;
}

.timeline-row:last-child {
  border-bottom: 0;
}

.avatar-lg {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  border: 0;
  border-radius: 50%;
  background-color: transparent;
  object-fit: cover;
  position: relative;
  z-index: 2;
}

.avatar-lg.placeholder {
  background-color: v-bind('colors.background.avatar');
}

.timeline-body,
.history-item-bar {
  min-width: 0;
}

.history-item-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  margin-left: 1.25rem;
  padding: 0 0.5rem;
  border-radius: 0 40px 40px 0;
  position: relative;
  z-index: 1;
}

.char-info {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  margin-left: -1.75rem;
  position: relative;
  z-index: 2;
}

.char-title {
  min-width: 0;
  overflow: hidden;
  font-weight: 900;
  color: v-bind('colors.text.primary');
  text-shadow: 1px 1px 3px v-bind('colors.textShadow');
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pull-info {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.pull-count {
  color: v-bind('colors.text.highlight');
  font-size: 1.15rem;
  font-weight: 900;
  text-align: right;
  text-shadow: 1px 1px 3px v-bind('colors.textShadow');
}

.timeline-bottom {
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  align-items: start;
  margin-top: 0.25rem;
}

.pool-name {
  min-width: 0;
  color: v-bind('colors.text.secondary');
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ssr-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 30px;
}

.ssr-strip img {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
}

.card-mode-panel {
  border: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.card-mode-panel > .panel-header {
  margin-bottom: 8px;
  border: 2px solid v-bind('colors.border.lighter');
  border-radius: 14px;
}

.card-mode-list {
  display: grid;
  gap: 8px;
}

.card-pool-card {
  overflow: hidden;
  border: 2px solid v-bind('colors.border.lighter');
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    v-bind('colors.background.light') 0%,
    v-bind('colors.background.content') 100%
  );
  box-shadow:
    inset 0 0 0 1px v-bind('colors.shadow.white'),
    0 10px 28px v-bind('colors.shadow.primary');
}

.card-pool-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
  align-items: center;
  padding: 9px 10px;
  background: v-bind('colors.background.darker');
}

.card-pool-main {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 7.5rem;
  align-items: center;
  gap: 4px;
}

.pool-title-badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  min-height: 24px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.05;
  text-align: center;
}

.card-pool-header h4 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: v-bind('colors.text.primary');
  font-size: 1rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-pool-stats {
  display: flex;
  flex: 0 1 auto;
  justify-content: flex-end;
  gap: 4px;
  text-align: center;
}

.card-pool-stats div {
  min-width: 2.85rem;
}

.card-pool-stats b {
  font-size: 1rem;
}

.card-pool-stats small {
  font-size: 0.75rem;
  line-height: 1.1;
  white-space: nowrap;
}

.character-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 58px);
  gap: 6px;
  justify-content: center;
  padding: 10px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 58px;
  padding: 3px 0 0;
  border-radius: 6px;
  text-align: center;
}

.overview-avatar {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  background-color: v-bind('colors.shadow.white');
  object-fit: cover;
}

.overview-pull-count {
  color: v-bind('colors.text.highlight');
  margin: 1px 0;
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1.1;
}

.card-pool-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 0 10px 10px;
}

.card-pool-actions button {
  border: 1px solid v-bind('colors.brand.warnBorder');
  border-radius: 999px;
  background: v-bind('colors.brand.primaryBackground');
  color: v-bind('colors.text.highlight');
  padding: 5px 14px;
  font-weight: 900;
  cursor: pointer;
}

.pool-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(62px, 1fr));
  gap: 10px;
}

.mini-card {
  position: relative;
  overflow: hidden;
  border: 1px solid v-bind('colors.brand.warnBorder');
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    v-bind('colors.rarity.ssr') 0%,
    v-bind('colors.rarity.ssr') 68%,
    v-bind('colors.background.lighter') 68%,
    v-bind('colors.background.lighter') 100%
  );
}

.mini-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.mini-card span {
  display: block;
  min-height: 24px;
  color: v-bind('colors.text.primary');
  text-align: center;
  font-weight: 900;
}

.recent-list {
  display: grid;
  gap: 14px;
}

.pool-card {
  overflow: hidden;
  border: 2px solid v-bind('colors.border.lighter');
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    v-bind('colors.background.light') 0%,
    v-bind('colors.background.content') 100%
  );
  box-shadow:
    inset 0 0 0 1px v-bind('colors.shadow.white'),
    0 10px 28px v-bind('colors.shadow.primary');
}

.pool-card-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
  align-items: center;
  padding: 9px 10px;
  background: v-bind('colors.background.darker');
}

.pool-card-main {
  display: flex;
  min-width: 0;
  flex: 1 1 8rem;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.pool-card h4 {
  margin: 0;
  color: v-bind('colors.text.primary');
  font-size: 1rem;
  font-weight: 900;
}

.pool-card-header span {
  color: v-bind('colors.text.light');
  font-size: 0.78rem;
  font-weight: 700;
}

.pool-stats {
  display: flex;
  flex: 0 1 auto;
  justify-content: flex-end;
  gap: 4px;
  text-align: center;
}

.pool-stats div {
  min-width: 2.85rem;
}

.pool-stats b {
  display: block;
  color: v-bind('colors.text.highlight');
  font-size: 1rem;
  font-weight: 900;
}

.pool-stats small {
  display: block;
  color: v-bind('colors.text.primary');
  font-size: 0.75rem;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
}

.pool-not-pulled {
  color: v-bind('colors.text.highlight');
  font-size: 1rem;
  font-weight: 900;
}

.pool-sp-summary {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  margin: 0;
  padding: 8px 10px 0;
  color: v-bind('colors.text.light');
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
  text-align: left;
}

.pool-sp-summary span {
  color: v-bind('colors.text.highlight');
  font-weight: 900;
}

.pool-sp-summary b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  min-height: 24px;
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.05;
  vertical-align: middle;
}

.pool-card-grid {
  justify-content: start;
  padding: 10px 10px 0;
}

.pool-card-grid:last-child {
  padding-bottom: 10px;
}

.sp-cards {
  grid-template-columns: repeat(auto-fill, 58px);
  gap: 6px;
}

.ssr-cards {
  grid-template-columns: repeat(auto-fill, 46px);
  gap: 2px;
  padding-top: 8px;
}

.mini-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 58px;
  padding: 3px 0 0;
  border: 0;
  border-radius: 6px;
  text-align: center;
}

.mini-card.sp-card {
  background: v-bind('colors.rarity.sp');
}

.mini-card.ssr-card {
  width: 46px;
  background: v-bind('colors.rarity.ssr');
}

.mini-card img {
  width: 52px;
  height: 52px;
  margin-bottom: 3px;
  border-radius: 6px;
}

.mini-card.ssr-card img {
  width: 40px;
  height: 40px;
}

.mini-card span {
  display: block;
  width: 100%;
  min-height: 1.25rem;
  border-radius: 0 0 6px 6px;
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.primary');
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.25rem;
}

.empty-text {
  margin: 4px 0;
  text-align: center;
}

.back-to-top {
  position: fixed;
  right: max(14px, env(safe-area-inset-right));
  bottom: max(18px, env(safe-area-inset-bottom));
  z-index: 10;
  width: 44px;
  height: 44px;
  border: 2px solid v-bind('colors.border.lighter');
  border-radius: 50%;
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  font-size: 1.4rem;
  font-weight: 900;
  box-shadow: 0 10px 24px v-bind('colors.shadow.primary');
  cursor: pointer;
}

@media (min-width: 1080px) {
  .dashboard-tabs {
    display: none;
  }

  .mode-panel,
  .mode-panel.active {
    display: block;
  }

  .dashboard-grid {
    align-items: start;
    flex-direction: row;
  }

  .summary-column {
    flex: 1 1 0;
  }

  .card-mode-panel,
  .recent-panel {
    flex: 1 1 0;
  }
}

@media (min-width: 1480px) {
  .summary-column {
    flex: 2 1 0;
    flex-direction: row;
    align-items: start;
  }

  .summary-column > .profile-panel,
  .summary-column > .summary-panel {
    flex: 1 1 0;
  }
}

@media (max-width: 620px) {
  .gacha-analysis-shell {
    padding: 10px;
  }

  .achievement-title {
    max-width: 100%;
  }

  .pool-card header {
    grid-template-columns: 1fr;
  }

  .pool-stats {
    justify-content: start;
  }

  .panel-header,
  .sp-timeline,
  .recent-list {
    padding: 12px;
  }

  .summary-stats {
    padding: 12px 12px 0;
  }

  .character-overview-grid {
    grid-template-columns: repeat(auto-fill, 54px);
  }

  .overview-item {
    width: 54px;
  }

  .overview-avatar {
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 1079px) {
  .mode-panel > .panel-header {
    display: none;
  }
}

@media (max-width: 380px) {
  .dashboard-tabs button {
    padding: 8px 5px;
    font-size: 0.92rem;
  }

  .achievement-title {
    gap: 7px;
    padding: 7px 9px;
    font-size: 1.28rem;
  }

  .achievement-mode {
    font-size: 0.72rem;
  }
}
</style>

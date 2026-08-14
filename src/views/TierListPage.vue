<template>
  <main class="tier-list-page">
    <div class="tier-list-shell">
      <section class="workspace" aria-label="角色分级工作区">
        <section
          class="board-panel panel-card"
          aria-labelledby="board-title"
        >
          <div class="selection-hint" :class="{ active: selectedIds.size }">
            <span class="hint-dot"></span>
            <span v-if="selectedIds.size"
              >已选 {{ selectedIds.size }} 位角色，点击任意分级行放入</span
            >
            <span v-else>可拖动角色卡片，或在下方选中后点击分级行</span>
            <div class="board-actions">
              <button class="subtle-button" type="button" @click="resetBoard">清空排序</button>
              <button class="subtle-button" type="button" @click="toggleFullscreen">
                {{ isFullscreen ? '退出全屏' : '全屏显示' }}
              </button>
              <button
                class="export-button"
                type="button"
                :disabled="isExporting"
                @click="exportBoardImage"
              >
                {{ isExporting ? '生成中…' : '导出 PNG' }}
              </button>
            </div>
          </div>

          <div
            ref="boardCaptureRef"
            class="board-capture"
            :class="{ 'manual-fullscreen': isManualFullscreen }"
          >
            <div class="panel-heading">
              <div>
                <h2
                  v-if="!isEditingTitle"
                  id="board-title"
                  class="board-title"
                  title="点击编辑榜单标题"
                  @click="startTitleEditing"
                >
                  {{ boardTitle }}
                </h2>
                <input
                  v-else
                  ref="titleInput"
                  v-model="titleDraft"
                  class="board-title-input"
                  type="text"
                  maxlength="40"
                  aria-label="榜单标题"
                  @blur="finishTitleEditing"
                  @keydown.enter.prevent="finishTitleEditing"
                  @keydown.esc.prevent="cancelTitleEditing"
                />
              </div>
              <div v-if="isFullscreen" class="board-header-actions">
                <button type="button" class="fullscreen-exit-button" @click="toggleFullscreen">
                  退出全屏
                </button>
              </div>
            </div>

            <div class="tier-board">
              <article
                v-for="tier in tiers"
                :key="tier.id"
                class="tier-row"
                :class="{ 'has-selection': selectedIds.size }"
                @click="addSelectedToTier(tier.id)"
                @dragover.prevent
                @drop="handleDrop($event, tier.id)"
              >
                <div class="tier-label" :style="{ '--tier-color': tier.color }">
                  <span class="tier-name">{{ tier.name }}</span>
                </div>
                <div class="tier-dropzone">
                  <div v-if="!cardsInTier(tier.id).length" class="empty-tier">
                    点击此处放入选中角色
                  </div>
                  <div
                    v-for="card in cardsInTier(tier.id)"
                    :key="card.id"
                    class="rank-card"
                    draggable="true"
                    @click.stop
                    @dragstart="handleDragStart($event, card.id)"
                    @dragover.prevent.stop
                    @drop.stop="handleDrop($event, tier.id, card.id)"
                  >
                    <img :src="getCardImage(card)" :alt="card.name" />
                    <span>{{ card.name }}</span>
                    <button
                      class="remove-card"
                      type="button"
                      :aria-label="`将${card.name}移出分级`"
                      @click.stop="unassignCard(card.id)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <aside
          class="selector-panel panel-card"
          aria-labelledby="selector-title"
          @dragover.prevent
          @drop="dropOnUnranked"
        >
          <div class="selector-tools">
            <label class="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                v-model="searchQuery"
                type="search"
                placeholder="搜索角色名称"
                aria-label="搜索角色名称"
              />
            </label>
            <button
              v-if="filteredUnrankedCards.length"
              class="select-all-button"
              type="button"
              @click="toggleFilteredSelection"
            >
              {{ allFilteredSelected ? '取消全选' : '全选当前' }}
            </button>
          </div>

          <div class="filter-group" v-if="availableThemes.length">
            <div class="filter-chips">
              <button
                v-for="theme in availableThemes"
                :key="theme.id"
                type="button"
                class="filter-chip"
                :class="{ active: activeTheme === theme.id }"
                @click="toggleTheme(theme.id)"
              >
                <img v-if="theme.icon" :src="theme.icon" :alt="theme.name" />
                {{ theme.name }}
              </button>
            </div>
          </div>

          <div class="filter-group" v-if="availableRarities.length">
            <div class="filter-chips">
              <button
                v-for="rarity in availableRarities"
                :key="rarity"
                type="button"
                class="filter-chip rarity-filter"
                :class="[rarity.toLowerCase(), { active: activeRarity === rarity }]"
                @click="toggleRarity(rarity)"
              >
                {{ rarity }}
              </button>
            </div>
          </div>

          <div v-if="filteredUnrankedCards.length" class="unranked-grid">
            <button
              v-for="card in filteredUnrankedCards"
              :key="card.id"
              type="button"
              class="selector-card"
              :class="{ selected: selectedIds.has(card.id) }"
              :aria-pressed="selectedIds.has(card.id)"
              draggable="true"
              @click="toggleSelection(card.id)"
              @dragstart="handleDragStart($event, card.id)"
            >
              <img :src="getCardImage(card)" :alt="card.name" />
              <span>{{ card.name }}</span>
              <i v-if="selectedIds.has(card.id)" class="selected-mark">✓</i>
            </button>
          </div>
          <div v-else class="selector-empty">
            <span class="empty-icon">✦</span>
            <p>{{ unrankedCards.length ? '没有符合筛选条件的角色' : '所有角色都已完成分类' }}</p>
            <button
              v-if="unrankedCards.length"
              type="button"
              class="text-button"
              @click="clearFilters"
            >
              清除筛选
            </button>
          </div>
        </aside>
      </section>
    </div>

    <button
      class="settings-fab"
      type="button"
      aria-label="打开分级设置"
      @click="settingsOpen = true"
    >
      <span aria-hidden="true">⚙</span>
      <span>分级设置</span>
    </button>

    <div v-if="settingsOpen" class="settings-backdrop" @click.self="settingsOpen = false">
      <section
        class="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div class="dialog-heading">
          <div>
            <h2 id="settings-title">分级设置</h2>
          </div>
          <button
            type="button"
            class="close-button"
            aria-label="关闭设置"
            @click="settingsOpen = false"
          >
            ×
          </button>
        </div>

        <div class="template-section">
          <span class="setting-label">快速套用模板</span>
          <div class="template-grid">
            <button
              type="button"
              class="template-option"
              :class="{ active: templateMode === 'image' }"
              @click="applyTemplate('image')"
            >
              <span class="template-preview image-preview"
                ><i>夯</i><i>顶级</i><i>人上人</i><i>NPC</i><i>拉完了</i></span
              >
              <span>图片同款</span>
            </button>
            <button
              type="button"
              class="template-option"
              :class="{ active: templateMode === 't' }"
              @click="applyTemplate('t')"
            >
              <span class="template-preview t-preview"
                ><i>t0</i><i>t1</i><i>t2</i><i>t3</i><i>t4</i><i>t5</i></span
              >
              <span>t0 — t5</span>
            </button>
          </div>
        </div>

        <div class="settings-section">
          <div class="setting-row-title"></div>
          <input
            v-model="boardTitle"
            class="title-setting-input"
            type="text"
            maxlength="40"
            placeholder="输入榜单标题"
            aria-label="榜单标题"
          />
        </div>

        <div class="settings-section">
          <div class="image-mode-switch" role="group" aria-label="选择角色图片样式">
            <button
              type="button"
              :class="{ active: imageMode === 'portrait' }"
              @click="imageMode = 'portrait'"
            >
              立绘
            </button>
            <button
              type="button"
              :class="{ active: imageMode === 'qban' }"
              :disabled="!hasQban"
              @click="imageMode = 'qban'"
            >
              Q版
            </button>
          </div>
          <p v-if="!hasQban" class="setting-tip setting-note">当前角色素材没有可用的 Q 版图片。</p>
        </div>

        <div class="settings-section">
          <div class="setting-row-title">
            <span class="setting-label">分级名称与颜色</span>
            <span class="setting-tip">点击颜色可修改</span>
          </div>
          <div class="tier-settings-list">
            <div v-for="(tier, index) in tiers" :key="tier.id" class="tier-setting-row">
              <span class="drag-handle" aria-hidden="true">⋮⋮</span>
              <input
                v-model="tier.name"
                class="tier-name-input"
                :aria-label="`第${index + 1}级名称`"
                maxlength="12"
              />
              <input
                v-model="tier.color"
                class="color-input"
                type="color"
                :aria-label="`${tier.name}背景颜色`"
              />
              <button
                type="button"
                class="delete-tier-button"
                :disabled="tiers.length <= 1"
                :aria-label="`删除${tier.name}`"
                @click="removeTier(tier.id)"
              >
                ×
              </button>
            </div>
          </div>
          <button type="button" class="add-tier-button" @click="addTier">＋ 添加分级</button>
        </div>

        <div class="dialog-footer">
          <button type="button" class="confirm-button" @click="settingsOpen = false">完成</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { allCards, loadCards } from '@/data/cards.js'
import { R, SR, SSR, SP, THEMES } from '@/data/constant.js'
import { toPng } from 'html-to-image'
import { logger } from '@/utils/logger.js'

const STORAGE_KEY = 'gacha-party-tier-list'
const RARITY_ORDER = [SP, SSR, SR, R]
const THEME_ORDER = ['cake', 'dream', 'elec', 'music', 'ice', 'fire', 'water', 'appliance', 'eiji']

const templates = {
  image: [
    { name: '夯', color: '#ff3b30' },
    { name: '顶级', color: '#ffb511' },
    { name: '人上人', color: '#f4ee00' },
    { name: 'NPC', color: '#f5e5b8' },
    { name: '拉完了', color: '#f7f7f7' },
  ],
  t: [
    { name: 't0', color: '#ff796d' },
    { name: 't1', color: '#ffb86b' },
    { name: 't2', color: '#f6de69' },
    { name: 't3', color: '#9cdb9c' },
    { name: 't4', color: '#8dc6e8' },
    { name: 't5', color: '#c2a7de' },
  ],
}

const isInGameCard = (card) =>
  !card.notInGame && !card.isNotInGame && !card.isnotingame && !card.notingame

const cards = ref(allCards.filter(isInGameCard))
const tiers = ref(createTiers('image'))
const assignments = ref({})
const tierOrder = ref({})
const selectedIds = ref(new Set())
const templateMode = ref('image')
const boardTitle = ref('我的角色榜单')
const titleDraft = ref('')
const titleInput = ref(null)
const isEditingTitle = ref(false)
const imageMode = ref('portrait')
const boardCaptureRef = ref(null)
const isFullscreen = ref(false)
const isExporting = ref(false)
const settingsOpen = ref(false)
const searchQuery = ref('')
const activeTheme = ref(null)
const activeRarity = ref(null)

const isManualFullscreen = computed(
  () =>
    isFullscreen.value &&
    !(typeof document !== 'undefined' && document.fullscreenElement === boardCaptureRef.value),
)

function createTiers(templateName) {
  return templates[templateName].map((tier, index) => ({
    ...tier,
    id: `${templateName}-${index}`,
  }))
}

onMounted(async () => {
  cards.value = (await loadCards()).filter(isInGameCard)
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved?.tiers?.length) tiers.value = saved.tiers
    if (saved?.assignments) {
      const gameCardIds = new Set(cards.value.map((card) => card.id))
      assignments.value = Object.fromEntries(
        Object.entries(saved.assignments).filter(([cardId]) => gameCardIds.has(cardId)),
      )
    }
    if (saved?.tierOrder) {
      const validTierIds = new Set(tiers.value.map((tier) => tier.id))
      const gameCardIds = new Set(cards.value.map((card) => card.id))
      tierOrder.value = Object.fromEntries(
        Object.entries(saved.tierOrder)
          .filter(([tierId]) => validTierIds.has(tierId))
          .map(([tierId, cardIds]) => [
            tierId,
            Array.isArray(cardIds) ? cardIds.filter((cardId) => gameCardIds.has(cardId)) : [],
          ]),
      )
    }
    if (saved?.templateMode === 't') templateMode.value = 't'
    if (typeof saved?.boardTitle === 'string' && saved.boardTitle.trim()) {
      boardTitle.value = saved.boardTitle
    }
    if (saved?.imageMode === 'qban' && cards.value.some((card) => card.qban_url)) {
      imageMode.value = 'qban'
    }
  } catch {
    // Ignore invalid local data and use the default board.
  }
})

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

watch(
  [tiers, assignments, tierOrder, templateMode, boardTitle, imageMode],
  () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tiers: tiers.value,
          assignments: assignments.value,
          tierOrder: tierOrder.value,
          templateMode: templateMode.value,
          boardTitle: boardTitle.value,
          imageMode: imageMode.value,
        }),
      )
    }
  },
  { deep: true },
)

const availableThemes = computed(() =>
  THEME_ORDER.filter((id) => cards.value.some((card) => card.theme?.id === id)).map(
    (id) => THEMES[id],
  ),
)

const availableRarities = computed(() =>
  RARITY_ORDER.filter((rarity) => cards.value.some((card) => card.rarity === rarity)),
)

const assignedCount = computed(() => Object.keys(assignments.value).length)
const hasQban = computed(() => cards.value.some((card) => card.qban_url))

const unrankedCards = computed(() =>
  cards.value
    .filter((card) => !assignments.value[card.id])
    .sort((a, b) => {
      const aIndex = RARITY_ORDER.indexOf(a.rarity)
      const bIndex = RARITY_ORDER.indexOf(b.rarity)
      return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex)
    }),
)

const filteredUnrankedCards = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return unrankedCards.value.filter((card) => {
    const matchesQuery =
      !query ||
      card.name.toLowerCase().includes(query) ||
      card.realname?.toLowerCase().includes(query)
    const matchesTheme = !activeTheme.value || card.theme?.id === activeTheme.value
    const matchesRarity = !activeRarity.value || card.rarity === activeRarity.value
    return matchesQuery && matchesTheme && matchesRarity
  })
})

function getCardImage(card) {
  return imageMode.value === 'qban' && card.qban_url ? card.qban_url : card.imageUrl
}

function handleFullscreenChange() {
  isFullscreen.value =
    typeof document !== 'undefined' && document.fullscreenElement === boardCaptureRef.value
}

async function toggleFullscreen() {
  if (!boardCaptureRef.value) return

  if (isFullscreen.value && !document.fullscreenElement) {
    isFullscreen.value = false
    return
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (boardCaptureRef.value.requestFullscreen) {
      await boardCaptureRef.value.requestFullscreen()
    } else {
      isFullscreen.value = true
    }
  } catch (error) {
    logger.error('进入全屏失败:', error)
    isFullscreen.value = true
  }
}

async function exportBoardImage() {
  if (!boardCaptureRef.value || isExporting.value) return

  isExporting.value = true
  try {
    await nextTick()
    const captureElement = boardCaptureRef.value
    const pendingImages = Array.from(captureElement.querySelectorAll('img'))
      .filter((image) => !image.complete)
      .map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', resolve, { once: true })
          }),
      )
    await Promise.all(pendingImages)
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    const bounds = captureElement.getBoundingClientRect()
    const exportWidth = Math.ceil(Math.max(bounds.width, captureElement.scrollWidth))
    // html-to-image 会把 height 写回克隆节点；额外留出底部空间，避免 flex 换行后的最后一行被裁切。
    const exportHeight = Math.ceil(Math.max(bounds.height, captureElement.scrollHeight)) + 24
    const dataUrl = await toPng(captureElement, {
      pixelRatio: 2,
      backgroundColor: getComputedStyle(captureElement).backgroundColor,
      width: exportWidth,
      height: exportHeight,
      style: {
        width: `${exportWidth}px`,
        height: `${exportHeight}px`,
        overflow: 'visible',
      },
      skipFonts: false,
      cacheBust: false,
    })
    const link = document.createElement('a')
    const safeTitle = boardTitle.value.trim().replace(/[\\/:*?"<>|]/g, '') || '角色分级榜单'
    link.download = `${safeTitle}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    logger.error('生成榜单图片失败:', error)
    alert('导出失败，请稍后重试')
  } finally {
    isExporting.value = false
  }
}

function startTitleEditing() {
  titleDraft.value = boardTitle.value
  isEditingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

function finishTitleEditing() {
  const nextTitle = titleDraft.value.trim()
  boardTitle.value = nextTitle || '我的角色榜单'
  isEditingTitle.value = false
}

function cancelTitleEditing() {
  isEditingTitle.value = false
  titleDraft.value = boardTitle.value
}

const allFilteredSelected = computed(
  () =>
    filteredUnrankedCards.value.length > 0 &&
    filteredUnrankedCards.value.every((card) => selectedIds.value.has(card.id)),
)

function cardsInTier(tierId) {
  const cardMap = new Map(cards.value.map((card) => [card.id, card]))
  return orderedCardIds(tierId)
    .map((cardId) => cardMap.get(cardId))
    .filter(Boolean)
}

function orderedCardIds(
  tierId,
  sourceAssignments = assignments.value,
  sourceOrder = tierOrder.value,
) {
  const assignedIds = cards.value
    .filter((card) => sourceAssignments[card.id] === tierId)
    .map((card) => card.id)
  const savedOrder = Array.isArray(sourceOrder[tierId]) ? sourceOrder[tierId] : []
  return [
    ...savedOrder.filter((cardId) => assignedIds.includes(cardId)),
    ...assignedIds.filter((cardId) => !savedOrder.includes(cardId)),
  ]
}

function toggleSelection(cardId) {
  const next = new Set(selectedIds.value)
  if (next.has(cardId)) next.delete(cardId)
  else next.add(cardId)
  selectedIds.value = next
}

function toggleFilteredSelection() {
  const next = new Set(selectedIds.value)
  if (allFilteredSelected.value) filteredUnrankedCards.value.forEach((card) => next.delete(card.id))
  else filteredUnrankedCards.value.forEach((card) => next.add(card.id))
  selectedIds.value = next
}

function toggleTheme(themeId) {
  activeTheme.value = activeTheme.value === themeId ? null : themeId
}

function toggleRarity(rarity) {
  activeRarity.value = activeRarity.value === rarity ? null : rarity
}

function clearFilters() {
  searchQuery.value = ''
  activeTheme.value = null
  activeRarity.value = null
}

function addSelectedToTier(tierId) {
  if (!selectedIds.value.size) return
  ;[...selectedIds.value].forEach((cardId) => {
    if (cards.value.some((card) => card.id === cardId)) assignCardToTier(cardId, tierId)
  })
  selectedIds.value = new Set()
}

function handleDragStart(event, cardId) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', cardId)
}

function handleDrop(event, tierId, beforeCardId = null) {
  const cardId = event.dataTransfer.getData('text/plain')
  if (!cardId) return
  assignCardToTier(cardId, tierId, beforeCardId)
  const next = new Set(selectedIds.value)
  next.delete(cardId)
  selectedIds.value = next
}

function assignCardToTier(cardId, tierId, beforeCardId = null) {
  if (!cards.value.some((card) => card.id === cardId)) return

  const nextAssignments = { ...assignments.value, [cardId]: tierId }
  const nextOrder = Object.fromEntries(
    Object.entries(tierOrder.value).map(([id, cardIds]) => [id, [...cardIds]]),
  )
  Object.keys(nextOrder).forEach((id) => {
    nextOrder[id] = nextOrder[id].filter((idInOrder) => idInOrder !== cardId)
  })

  const destinationIds = orderedCardIds(tierId).filter((id) => id !== cardId)
  const insertIndex = beforeCardId ? destinationIds.indexOf(beforeCardId) : -1
  if (insertIndex >= 0) destinationIds.splice(insertIndex, 0, cardId)
  else destinationIds.push(cardId)
  nextOrder[tierId] = destinationIds

  assignments.value = nextAssignments
  tierOrder.value = nextOrder
}

function dropOnUnranked(event) {
  const cardId = event.dataTransfer.getData('text/plain')
  if (!cardId) return
  unassignCard(cardId)
}

function unassignCard(cardId) {
  const next = { ...assignments.value }
  delete next[cardId]
  assignments.value = next
  tierOrder.value = Object.fromEntries(
    Object.entries(tierOrder.value).map(([tierId, cardIds]) => [
      tierId,
      cardIds.filter((id) => id !== cardId),
    ]),
  )
}

function resetBoard() {
  if (!assignedCount.value || window.confirm('确定要清空当前排序吗？')) {
    assignments.value = {}
    tierOrder.value = {}
    selectedIds.value = new Set()
  }
}

function applyTemplate(templateName) {
  const oldTiers = tiers.value
  const nextTiers = createTiers(templateName)
  const nextAssignments = {}
  const nextOrder = {}
  Object.entries(assignments.value).forEach(([cardId, tierId]) => {
    const oldIndex = oldTiers.findIndex((tier) => tier.id === tierId)
    if (oldIndex >= 0 && nextTiers[oldIndex]) nextAssignments[cardId] = nextTiers[oldIndex].id
  })
  oldTiers.forEach((tier, oldIndex) => {
    const nextTier = nextTiers[oldIndex]
    if (!nextTier) return
    nextOrder[nextTier.id] = orderedCardIds(tier.id).filter((cardId) => nextAssignments[cardId])
  })
  tiers.value = nextTiers
  assignments.value = nextAssignments
  tierOrder.value = nextOrder
  selectedIds.value = new Set()
  templateMode.value = templateName
}

function addTier() {
  const index = tiers.value.length
  tiers.value = [
    ...tiers.value,
    { id: `custom-${Date.now()}`, name: `新分级${index + 1}`, color: '#6b7280' },
  ]
}

function removeTier(tierId) {
  if (tiers.value.length <= 1) return
  const next = { ...assignments.value }
  Object.keys(next).forEach((cardId) => {
    if (next[cardId] === tierId) delete next[cardId]
  })
  assignments.value = next
  const nextOrder = { ...tierOrder.value }
  delete nextOrder[tierId]
  tierOrder.value = nextOrder
  tiers.value = tiers.value.filter((tier) => tier.id !== tierId)
}
</script>

<style scoped>
.tier-list-page {
  min-height: 100dvh;
  padding: clamp(0.5rem, 1vw, 1rem);
  box-sizing: border-box;
  background: var(--color-background-primary);
}

.tier-list-shell {
  width: min(1500px, 100%);
  margin: 0 auto;
}
.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  margin: 0 auto 1.5rem;
}
.back-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
}
.back-link:hover {
  color: var(--color-brand-primary);
}
.eyebrow,
.section-kicker {
  margin: 1.35rem 0 0.35rem;
  color: var(--color-brand-primary);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  font-weight: 700;
  text-transform: uppercase;
}
h2,
p {
  margin-top: 0;
}
.page-intro {
  max-width: 650px;
  margin-bottom: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}
.header-stats {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: end;
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(290px, 340px);
  gap: 1rem;
  align-items: start;
}
.panel-card {
  background: color-mix(in srgb, var(--color-background-content) 92%, transparent);
  border: 1px solid var(--color-border-primary);
  border-radius: 18px;
  box-shadow: 0 18px 50px var(--color-shadow-primary);
}
.board-panel {
  min-width: 0;
  padding: clamp(0.5rem, 1vw, 1rem);
}
.board-capture:fullscreen,
.board-capture.manual-fullscreen {
  width: 100vw;
  height: 100dvh;
  box-sizing: border-box;
  overflow: auto;
  padding: clamp(1rem, 3vw, 2.5rem);
  border: 0;
  border-radius: 0;
  background: var(--color-background-primary);
}
.board-capture {
  width: 100%;
  box-sizing: border-box;
  padding: clamp(0.25rem, 1vw, 1rem);
  background: var(--color-background-content);
}
.board-capture.manual-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 100;
}
.selector-panel {
  position: sticky;
  top: 1rem;
  padding: 1.25rem;
}
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 0.6rem 0 0.6rem;
}
.panel-heading h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.3rem;
}
.board-header-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.fullscreen-exit-button {
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-brand-primary);
  border-radius: 7px;
  color: var(--color-brand-primary);
  background: var(--color-brand-primary-background);
  cursor: pointer;
  font-size: 0.78rem;
  white-space: nowrap;
}
.fullscreen-exit-button:hover {
  color: var(--color-text-black);
  background: var(--color-brand-primary);
}
.board-title {
  cursor: text;
  border-radius: 6px;
  transition:
    color 0.2s,
    background-color 0.2s;
}
.board-title:hover {
  color: var(--color-brand-primary);
  background: var(--color-brand-primary-background);
}
.board-title-input,
.title-setting-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-brand-primary);
  border-radius: 7px;
  outline: 0;
  color: var(--color-input-text);
  background: var(--color-input-background);
  font: inherit;
}
.board-title-input {
  min-width: min(360px, 70vw);
  color: var(--color-text-primary);
  font-size: 1.3rem;
  font-weight: 700;
}
.subtle-button,
.select-all-button,
.text-button {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.78rem;
}
.subtle-button:hover,
.select-all-button:hover,
.text-button:hover {
  color: var(--color-brand-primary);
}
.selection-hint {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2.4rem;
  padding: 0.6rem 0.8rem;
  border: 1px dashed var(--color-border-primary);
  border-radius: 10px;
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
}
.selection-hint.active {
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
  background: var(--color-brand-primary-background);
}
.hint-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-text-tertiary);
}
.selection-hint.active .hint-dot {
  background: var(--color-brand-primary);
  box-shadow: 0 0 0 4px var(--color-brand-primary-background);
}
.board-actions {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 0.55rem;
  margin-left: auto;
}
.export-button {
  padding: 0.42rem 0.7rem;
  border: 1px solid var(--color-brand-primary);
  border-radius: 7px;
  color: var(--color-text-black);
  background: var(--color-brand-primary);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
.export-button:hover:not(:disabled) {
  background: var(--color-brand-hover);
}
.export-button:disabled {
  cursor: wait;
  opacity: 0.6;
}
.tier-board {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.tier-row {
  display: grid;
  grid-template-columns: clamp(82px, 14%, 140px) minmax(0, 1fr);
  min-height: 90px;
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  background: var(--color-background-darker);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.tier-row.has-selection:hover {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 2px var(--color-brand-primary-background);
  cursor: pointer;
}
.tier-label {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  overflow: hidden;
  background: var(--tier-color);
  color: #191919;
}
.tier-name {
  z-index: 1;
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(0.95rem, 2vw, 1.3rem);
  font-weight: 850;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tier-count {
  z-index: 1;
  font-size: 0.7rem;
  opacity: 0.65;
}
.tier-dropzone {
  display: flex;
  align-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.2rem;
}
.empty-tier {
  align-self: center;
  padding: 1rem;
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
  opacity: 0.8;
}
.rank-card,
.selector-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  background: var(--color-background-light);
}
.rank-card {
  width: 60px;
  border-radius: 8px;
  cursor: grab;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.22);
  transition:
    transform 0.2s,
    border-color 0.2s;
}
.rank-card:hover {
  z-index: 1;
  border-color: var(--color-brand-primary);
  transform: translateY(-3px);
}
.rank-card:active {
  cursor: grabbing;
}
.rank-card img,
.selector-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
.rank-card span,
.selector-card span {
  display: block;
  overflow: hidden;
  padding: 0.2rem 0.25rem 0.3rem;
  color: var(--color-text-primary);
  font-size: 0.61rem;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.remove-card {
  position: absolute;
  top: 2px;
  right: 2px;
  display: grid;
  width: 19px;
  height: 19px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: white;
  background: rgba(0, 0, 0, 0.58);
  cursor: pointer;
  opacity: 0;
  place-items: center;
}
.rank-card:hover .remove-card,
.remove-card:focus-visible {
  opacity: 1;
}
.selector-heading {
  align-items: end;
}
.remaining-count {
  display: grid;
  min-width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: var(--color-text-black);
  background: var(--color-brand-primary);
  font-weight: 800;
  place-items: center;
}
.selector-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}
.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 0.4rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-input-border);
  border-radius: 9px;
  color: var(--color-text-tertiary);
  background: var(--color-input-background);
}
.search-box input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  color: var(--color-input-text);
  background: transparent;
  font-size: 0.8rem;
}
.select-all-button {
  white-space: nowrap;
}
.filter-group {
  margin: 0 0 0.85rem;
}
.filter-label,
.setting-label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--color-text-tertiary);
  font-size: 0.72rem;
}
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border-primary);
  border-radius: 999px;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 0.7rem;
}
.filter-chip:hover,
.filter-chip.active {
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
  background: var(--color-brand-primary-background);
}
.filter-chip img {
  width: 15px;
  height: 15px;
  object-fit: contain;
}
.rarity-filter.active {
  color: var(--color-text-black);
  background: var(--rarity-color);
}
.rarity-filter.sp {
  --rarity-color: var(--color-rarity-sp, #ff553d);
}
.rarity-filter.ssr {
  --rarity-color: var(--color-rarity-ssr, #ffa628);
}
.rarity-filter.sr {
  --rarity-color: var(--color-rarity-sr, #cb2dff);
}
.rarity-filter.r {
  --rarity-color: var(--color-rarity-r, #5692ff);
}
.unranked-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
  max-height: min(56vh, 640px);
  overflow: auto;
  padding: 0.15rem;
  scrollbar-width: thin;
}
.selector-card {
  padding: 0;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s,
    border-color 0.18s,
    box-shadow 0.18s;
}
.selector-card:hover {
  border-color: var(--color-brand-primary);
  transform: translateY(-2px);
}
.selector-card.selected {
  border-color: var(--color-brand-primary);
  box-shadow:
    0 0 0 2px var(--color-brand-primary),
    0 5px 15px rgba(0, 0, 0, 0.18);
}
.selected-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: var(--color-text-black);
  background: var(--color-brand-primary);
  font-size: 0.75rem;
  font-style: normal;
  font-weight: 900;
  place-items: center;
}
.selector-empty {
  display: grid;
  padding: 3rem 1rem;
  color: var(--color-text-tertiary);
  text-align: center;
  place-items: center;
}
.empty-icon {
  color: var(--color-brand-primary);
  font-size: 2rem;
}
.selector-empty p {
  margin: 0.5rem 0;
  font-size: 0.8rem;
}
.settings-fab {
  position: fixed;
  right: clamp(1rem, 3vw, 2.5rem);
  bottom: clamp(1rem, 3vw, 2.5rem);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-brand-primary);
  border-radius: 999px;
  color: var(--color-text-black);
  background: var(--color-brand-primary);
  box-shadow: 0 8px 24px var(--color-shadow-primary);
  cursor: pointer;
  font-weight: 750;
}
.settings-fab:hover {
  background: var(--color-brand-hover);
  transform: translateY(-2px);
}
.settings-fab span:first-child {
  font-size: 1.15rem;
}
.settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  padding: 1rem;
  overflow: auto;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(5px);
  place-items: center;
}
.settings-dialog {
  width: min(560px, 100%);
  max-height: min(90dvh, 800px);
  overflow: auto;
  padding: 1.5rem;
  border: 1px solid var(--color-border-primary);
  border-radius: 18px;
  background: var(--color-background-content);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}
.dialog-heading {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1.2rem;
}
.dialog-heading h2 {
  margin: 0;
  color: var(--color-text-primary);
}
.close-button {
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  color: var(--color-text-secondary);
  background: var(--color-background-lighter);
  cursor: pointer;
  font-size: 1.4rem;
}
.close-button:hover {
  color: var(--color-text-primary);
}
.template-section,
.settings-section {
  padding: 1rem 0;
  border-top: 1px solid var(--color-border-primary);
}
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}
.template-option {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.65rem;
  border: 1px solid var(--color-border-primary);
  border-radius: 10px;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.template-option.active,
.template-option:hover {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-primary-background);
}
.template-preview {
  display: flex;
  gap: 2px;
  width: 100%;
  height: 42px;
  overflow: hidden;
  border-radius: 6px;
}
.template-preview i {
  display: grid;
  flex: 1;
  min-width: 0;
  color: #1b1b1b;
  font-size: 0.58rem;
  font-style: normal;
  font-weight: 800;
  place-items: center;
}
.image-preview i:nth-child(1) {
  background: #ff3b30;
}
.image-preview i:nth-child(2) {
  background: #ffb511;
}
.image-preview i:nth-child(3) {
  background: #f4ee00;
}
.image-preview i:nth-child(4) {
  background: #f5e5b8;
}
.image-preview i:nth-child(5) {
  background: #f7f7f7;
}
.t-preview i:nth-child(1) {
  background: #ff796d;
}
.t-preview i:nth-child(2) {
  background: #ffb86b;
}
.t-preview i:nth-child(3) {
  background: #f6de69;
}
.t-preview i:nth-child(4) {
  background: #9cdb9c;
}
.t-preview i:nth-child(5) {
  background: #8dc6e8;
}
.t-preview i:nth-child(6) {
  background: #c2a7de;
}
.setting-row-title {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.setting-tip {
  color: var(--color-text-tertiary);
  font-size: 0.7rem;
}
.title-setting-input {
  margin-top: 0.15rem;
  font-size: 0.85rem;
}
.image-mode-switch {
  display: flex;
  gap: 0.35rem;
}
.image-mode-switch button {
  flex: 1;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--color-border-primary);
  border-radius: 7px;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
}
.image-mode-switch button:hover:not(:disabled),
.image-mode-switch button.active {
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
  background: var(--color-brand-primary-background);
}
.image-mode-switch button:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
  opacity: 0.55;
}
.setting-note {
  margin: 0.45rem 0 0;
}
.tier-settings-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.tier-setting-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.drag-handle {
  color: var(--color-text-tertiary);
  letter-spacing: -0.2em;
}
.tier-name-input {
  min-width: 0;
  flex: 1;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-input-border);
  border-radius: 7px;
  outline: 0;
  color: var(--color-input-text);
  background: var(--color-input-background);
}
.tier-name-input:focus {
  border-color: var(--color-brand-primary);
}
.color-input {
  width: 2.2rem;
  height: 2.2rem;
  padding: 0.18rem;
  border: 1px solid var(--color-input-border);
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
}
.delete-tier-button {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  color: var(--color-status-error);
  background: transparent;
  cursor: pointer;
  font-size: 1.25rem;
}
.delete-tier-button:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}
.add-tier-button {
  margin-top: 0.7rem;
  padding: 0.5rem 0.7rem;
  border: 1px dashed var(--color-border-dashed);
  border-radius: 7px;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
}
.add-tier-button:hover {
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
}
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: var(--color-text-tertiary);
  font-size: 0.72rem;
}
.confirm-button {
  padding: 0.55rem 1.1rem;
  border: 0;
  border-radius: 8px;
  color: var(--color-text-black);
  background: var(--color-brand-primary);
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  .selector-panel {
    position: static;
  }
  .unranked-grid {
    max-height: none;
  }
}

@media (max-width: 640px) {
  .tier-list-page {
    padding: 1rem 0.7rem 5.5rem;
  }
  .page-header {
    display: block;
  }
  .header-stats {
    justify-content: start;
    margin-top: 1rem;
  }
  .tier-row {
    grid-template-columns: 70px minmax(0, 1fr);
    min-height: 104px;
  }
  .tier-dropzone {
    gap: 0.3rem;
    padding: 0.4rem;
  }
  .rank-card {
    width: 62px;
  }
  .rank-card span {
    font-size: 0.6rem;
  }
  .selection-hint {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .board-actions {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
  .empty-tier {
    padding: 0.7rem;
    font-size: 0.68rem;
  }
  .settings-dialog {
    padding: 1.1rem;
  }
}
</style>

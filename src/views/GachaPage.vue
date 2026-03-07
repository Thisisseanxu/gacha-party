<template>
  <div class="gacha-bg-fill" :style="bgFillStyle">

    <!-- 返回主页按钮：屏幕左上角，不随画布缩放，点击退出全屏并返回主页 -->
    <button class="back-to-home-btn" @click="exitFullscreenAndGoHome" title="返回主页">
      <BackOne theme="outline" :size="26" :fill="colors.text.primary" />
    </button>

    <div class="gacha-landscape-root" :style="canvasStyle" :class="{ 'overlay-active': showGachaResultOverlay }">

      <!-- 左侧卡池列表 -->
      <aside class="pool-panel" v-show="!showGachaResultOverlay">
        <nav class="pool-list">
          <div v-for="[id, pool] in sortedPools" :key="id" class="pool-item radius-8"
            :class="{ active: route.params.poolId === id }" @click="navigateToPool(id)">
            <img v-if="pool.imageUrl" :src="pool.imageUrl" :alt="pool.name" class="pool-item-image" />
            <span v-else class="pool-item-name">{{ pool.name }}</span>
          </div>

          <div class="pool-item pool-item--custom radius-8" :class="{ active: route.params.poolId === 'custom' }"
            @click="navigateToCustomPool">
            <span class="custom-pool-icon">＋</span>
            <span class="custom-pool-label">自定义卡池</span>
          </div>
        </nav>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="main-panel" v-if="currentPool" v-show="!showGachaResultOverlay">

        <!-- 左侧内容列 -->
        <div class="content-col">

          <!-- 顶部栏：卡池名 -->
          <div class="top-bar">
            <div class="top-bar__title">
              <div class="title-row">
                <h1 class="pool-name">{{ currentPool.name }}</h1>
                <button class="pool-info-btn" @click="showProbabilityPopup = true" title="概率公示">
                  <Info theme="outline" :size="18" :fill="colors.text.secondary" />
                </button>
                <button v-if="isCustomPool" @click="shareCustomPool" class="gacha-button btn-confirm">分享卡池</button>
                <button v-if="isCustomPool" @click="goBackToEdit" class="gacha-button btn-primary">重新编辑</button>
              </div>
              <button v-if="poolSsrCards.length > 0" @click="showSsrPopup = true" class="button btn-secondary"
                style="font-size: 1.25rem;">
                卡池SSR一览 ({{ poolSsrCards.length }})
              </button>
            </div>
          </div>

          <!-- 选择区：UP选卡 / 心愿自选（横向滚动，UP组另置于底部） -->
          <div class="selection-area">

            <div v-if="isSelectableUpPool" class="up-select-group">
              <span class="selection-label">{{ upCardDetails.length > 1 ? '选择UP角色：' : '当前UP：' }}</span>
              <div class="selection-scroll">
                <div v-for="card in upCardDetails" :key="card.id"
                  :class="['up-card-option', `rarity-border-${card.rarity.toLowerCase()}`, { selected: selectedUpCard === card.id }]"
                  @click="selectUpCard(card.id)">
                  <img :src="card.imageUrl" :alt="card.name" class="up-card-image" />
                  <span class="up-card-name">{{ card.name }}</span>
                </div>
              </div>
            </div>

            <div v-else-if="isWishPool" class="wish-select-group">
              <span class="selection-label">心愿角色 ({{ selectedWishCards.length }}/4)：</span>
              <div class="selection-scroll">
                <div v-for="card in selectableWishCards" :key="card.id" class="wish-card-option"
                  :class="{ selected: selectedWishCards.includes(card.id) }" @click="toggleWishCard(card.id)">
                  <div class="image-wrapper">
                    <img :src="card.imageUrl" :alt="card.name" class="wish-card-image" />
                    <div v-if="selectedWishCards.includes(card.id)" class="wish-badge">
                      {{ selectedWishCards.indexOf(card.id) + 1 }}
                    </div>
                    <div v-else class="wish-mask"></div>
                  </div>
                  <span class="wish-card-name">{{ card.name }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- 底部操作栏（无分隔线，靠右对齐） -->
          <div class="controls-bar">
            <div class="controls-right-block">
              <!-- UP组选择（在按钮上方） -->
              <div v-if="isSelectableUpGroupPool" class="up-group-in-controls">
                <span class="selection-label-sm">选择UP组：</span>
                <div class="up-group-scroll">
                  <div v-for="group in selectableUpGroup" :key="group.id"
                    :class="['up-group-item', { selected: group.id === selectedUpGroup?.id }]"
                    @click="setSelectedUpGroup(group)">
                    <img v-if="group.image_url" :src="group.image_url" :alt="group.name" class="up-group-image" />
                    <span v-else class="up-group-name">{{ group.name }}</span>
                  </div>
                </div>
              </div>
              <!-- 保底计数 + 抽卡按钮 -->
              <div class="controls-pull-row">
                <!-- 共享保底开关（最左侧） -->
                <div class="shared-pity-control">
                  <SwitchComponent v-model="sharedPity" label="共享保底" />
                </div>
                <div class="pity-counter" v-if="pityDisplayText">
                  <span class="pity-number">{{ pityRemaining }}</span>
                  <span class="pity-label">{{ pityDisplayText }}</span>
                </div>
                <div class="pull-buttons" v-if="!isWishPool || selectedWishCards.length === 4">
                  <button @click="checkAndPull(1)" class="gacha-button single-pull">单抽</button>
                  <button @click="checkAndPull(10)" class="gacha-button ten-pull">十抽</button>
                </div>
                <div v-else class="wish-incomplete-warning">
                  必须选择 4 个角色才能抽卡
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- 右侧历史记录悬浮列 -->
        <div class="history-float">
          <!-- 稀有度统计 -->
          <div class="rarity-counts" v-if="gachaHistory.length > 0">
            <span v-if="rarityCounts[SP]" class="rarity-count-item text-rarity-sp">限定×{{ rarityCounts[SP] }}</span>
            <span v-if="rarityCounts[SSR]" class="rarity-count-item text-rarity-ssr">SSR×{{ rarityCounts[SSR] }}</span>
            <span v-if="rarityCounts[SR]" class="rarity-count-item text-rarity-sr">SR×{{ rarityCounts[SR] }}</span>
            <span v-if="rarityCounts[R]" class="rarity-count-item text-rarity-r">R×{{ rarityCounts[R] }}</span>
          </div>
          <!-- 历史记录列表（竖排，10条/页） -->
          <div class="history-list">
            <p v-if="gachaHistory.length === 0" class="history-empty">暂无记录</p>
            <div v-for="(card, index) in paginatedHistory" :key="card.id + '_' + index"
              :class="['history-item', `text-rarity-${card.rarity.toLowerCase()}`]">{{ card.name }}</div>
          </div>
          <!-- 翻页按钮 -->
          <div class="history-pagination" v-if="totalHistoryPages > 1">
            <button class="hist-page-btn" @click="prevHistoryPage" :disabled="historyPage === 1">上一页</button>
            <span class="hist-page-info">{{ historyPage }}/{{ totalHistoryPages }}</span>
            <button class="hist-page-btn" @click="nextHistoryPage"
              :disabled="historyPage === totalHistoryPages">下一页</button>
          </div>
        </div>

      </main>

      <p v-else class="loading-text">卡池加载中或不存在...</p>

      <!-- 结果动画 overlay（画布内，bg-fill 的背景图延伸到字母框区域） -->
      <div v-if="showGachaResultOverlay" class="gacha-result-overlay">
        <div class="overlay-content">
          <h2 class="overlay-title">恭喜获得</h2>
          <div class="pulled-cards-container" ref="cardsContainerRef">
            <transition-group name="card-reveal" tag="div" class="pulled-cards-grid"
              :class="{ 'grid-ten-pull': lastPullCount === 10 }">
              <div v-for="(card, index) in displayedCards" :key="card.id + '_' + index"
                :class="['card-item', `rarity-bg-${card.rarity.toLowerCase()}`]">
                <div :class="[
                  'card-image-wrapper',
                  `rarity-border-${card.rarity.toLowerCase()}`,
                  { 'highlight-rarity': isHighlightRarity(card.rarity) },
                ]">
                  <img :src="card.imageUrl || '/images/cards/1101.webp'" :alt="`${card.name}的立绘图`" class="card-image" />
                </div>
                <p class="card-name">{{ card.name }}</p>
              </div>
            </transition-group>
          </div>
          <div class="result-actions">
            <button @click="checkAndPull(lastPullCount)" class="confirm-button single-pull" :disabled="isAnimating">
              {{ isAnimating ? '...' : `再来${lastPullCount}抽` }}
            </button>
            <button @click="confirmGachaResult" class="confirm-button ten-pull" :disabled="isAnimating">
              {{ isAnimating ? '...' : '确定' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 分享弹窗 -->
      <PopUp :display="showSharePopUp" title="分享你的卡池" @close="closeSharePopUp">
        <p class="share-modal-text-info">长按二维码保存或点击下方链接复制分享</p>
        <div class="qr-code-container">
          <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="卡池分享二维码" class="share-modal-qr-code" />
          <p v-else>二维码生成中...</p>
        </div>
        <textarea readonly class="share-modal-textarea" @click="copyShareText" v-model="shareText"></textarea>
        <p v-if="copyStatusMessage" class="copy-status-message">{{ copyStatusMessage }}</p>
      </PopUp>

      <!-- 卡池类型不一致警告 -->
      <PopUp :display="showPoolTypeMismatch" title="切换不同类型卡池" @close="cancelPoolSwitch">
        <p class="pool-type-warning-text">
          正在从「{{ currentPool?.type }}」切换到「{{ pendingPoolType }}」，<br>
          两者类型不同，继续切换将会<strong>重置所有保底信息</strong>。
        </p>
        <div class="button-group">
          <button @click="confirmPoolSwitch" class="button btn-confirm">继续切换</button>
          <button @click="cancelPoolSwitch" class="button btn-secondary">稍后再说</button>
        </div>
      </PopUp>

      <!-- SSR详情弹窗 -->
      <PopUp :display="showSsrPopup" title="卡池SSR一览" @close="showSsrPopup = false">
        <div class="ssr-popup-grid">
          <div v-for="card in poolSsrCards" :key="card.id" class="ssr-list-item">
            <img :src="card.imageUrl" :alt="card.name" class="ssr-list-card-image" />
            <span v-if="upSsrIds.has(card.id)" class="up-marker">UP</span>
            <p class="ssr-list-card-name">{{ card.name }}</p>
          </div>
        </div>
      </PopUp>

      <!-- 概率公示弹窗 -->
      <PopUp :display="showProbabilityPopup" title="概率公示" @close="showProbabilityPopup = false">
        <div class="probability-popup-content">
          <p>本模拟器使用1.25%的基础概率来拟合游戏内的2%的综合概率</p>
          <p>
            <strong>常驻卡池：</strong>抽到SSR的概率为8%，SR为20%。连续59次未出UP组SSR，第60抽必为UP组中的SSR角色。获取SSR时，有50%概率为UP组中的SSR角色，若"歪"，则下次抽到SSR必为UP组中的SSR角色。
          </p>
          <p>
            <strong>限定卡池：</strong>抽到限定的综合概率为2%，40抽未出则之后的每抽概率额外提升2%。SSR为6%，SR为20%。60抽必出限定角色。获取限定角色时，有50%概率为UP的限定角色，若"歪"，则下次抽到限定必为UP限定角色。
          </p>
          <p class="probability-footer">本项目完全开源，欢迎前往<a href="https://github.com/Thisisseanxu/gacha-party"
              target="_blank">Github</a>参与开发，或加入Q群 1049576192 交流。</p>
        </div>
      </PopUp>

    </div>

  </div><!-- /.gacha-bg-fill -->

  <!-- 全屏提示：Teleport 到 body，确保竖屏时不随画布旋转 -->
  <Teleport to="body">
    <div v-if="showOrientationPrompt" class="gacha-orient-overlay" @click.self="showOrientationPrompt = false"
      :style="{ backgroundColor: colors.background.overlay }">
      <div class="gacha-orient-box" :style="{
        backgroundColor: colors.background.content,
        border: `1px solid ${colors.border.primary}`,
        color: colors.text.primary,
      }">
        <p style="font-size:1rem; margin:0; line-height:1.5;">建议进入全屏横屏模式以获得最佳体验</p>
        <div class="button-group">
          <button @click="enterFullscreen" class="button btn-confirm">进入全屏</button>
          <button @click="showOrientationPrompt = false" class="button btn-secondary">稍后再说</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGacha } from '@/utils/useGacha'
import { SP, SSR, SR, R } from '@/data/constant.js'
import { cardPools } from '@/data/cardPools'
import { cardMap } from '@/data/cards'
import { colors } from '@/styles/colors.js'
import { getGachaSource } from '@/utils/getGachaSource.js'
import QRCode from 'qrcode'

import PopUp from '@/components/PopUp.vue'
import SwitchComponent from '@/components/SwitchComponent.vue'
import { BackOne, Info } from '@icon-park/vue-next'
import { logger } from '@/utils/logger'

// 模板有多个根节点（div + Teleport），禁用自动属性继承以消除 Vue 警告
defineOptions({ inheritAttrs: false })

// 动画相关
const showGachaResultOverlay = ref(false)
const displayedCards = ref([])
const isAnimating = ref(false)
let animationTimeout = null
const cardsContainerRef = ref(null)

// 分享弹窗
const showSharePopUp = ref(false)
const shareText = ref('')
const qrCodeDataUrl = ref('')
const copyStatusMessage = ref('')

// SSR详情弹窗
const showSsrPopup = ref(false)

// 概率公示弹窗
const showProbabilityPopup = ref(false)

// 全屏/横屏提示
const showOrientationPrompt = ref(true)

const enterFullscreen = async () => {
  showOrientationPrompt.value = false
  try {
    await document.documentElement.requestFullscreen()
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape').catch(() => { })
    }
  } catch {
    // 全屏被拒绝或不支持，忽略
  }
}

const exitFullscreenAndGoHome = async () => {
  if (document.fullscreenElement) {
    try { await document.exitFullscreen() } catch { /* 忽略 */ }
  }
  router.push({ name: '主页' })
}

// 16:10 固定画布缩放布局
const CANVAS_W = 1200
const CANVAS_H = 675
const canvasStyle = ref({})

// 抽卡时背景填充层切换为背景图，延伸到画布外的黑边区域
const bgFillStyle = computed(() =>
  showGachaResultOverlay.value
    ? { backgroundImage: "url('/images/gacha_bg.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}
)

const updateLayout = () => {
  const sw = window.innerWidth
  const sh = window.innerHeight
  const isPortrait = sh > sw

  if (isPortrait) {
    // 竖屏：顺时针旋转90°后缩放到填满屏幕
    // 旋转后有效宽=sh, 有效高=sw
    const scale = Math.min(sh / CANVAS_W, sw / CANVAS_H)
    // 令画布中心对齐屏幕中心，变换序：scale → rotate(90deg) → translate
    // 画布中心(W/2,H/2)经过 scale→rotate→translate 后到达 (sw/2, sh/2)
    // rotate(90deg): (x,y)→(-y,x) → 画布中心 (-H*s/2, W*s/2) → 加偏移
    const tx = sw / 2 + (CANVAS_H / 2) * scale
    const ty = sh / 2 - (CANVAS_W / 2) * scale
    canvasStyle.value = {
      transform: `translate(${tx}px, ${ty}px) rotate(90deg) scale(${scale})`,
      transformOrigin: '0 0',
    }
  } else {
    // 横屏：居中缩放
    const scale = Math.min(sw / CANVAS_W, sh / CANVAS_H)
    const tx = (sw - CANVAS_W * scale) / 2
    const ty = (sh - CANVAS_H * scale) / 2
    canvasStyle.value = {
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      transformOrigin: '0 0',
    }
  }
}

onMounted(() => {
  updateLayout()
  window.addEventListener('resize', updateLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
})

// 路由
const route = useRoute()
const router = useRouter()

const isCustomPool = computed(() => route.params.poolId === 'custom')
const gachaSource = computed(() => getGachaSource(route))

// ===== 共享保底开关 & 卡池切换 =====
const sharedPity = ref(false)
const showPoolTypeMismatch = ref(false)
const pendingPoolId = ref(null)
const pendingPoolType = computed(() => {
  if (!pendingPoolId.value || pendingPoolId.value === 'custom') return '自定义'
  return cardPools[pendingPoolId.value]?.type || ''
})

const doNavigate = (id) => {
  if (id === 'custom') {
    router.push({ name: '自定义卡池' })
  } else {
    router.push({ name: '抽卡模拟器', params: { poolId: id } })
  }
}

const navigateToPool = (id) => {
  if (id === route.params.poolId) return
  if (!sharedPity.value) {
    // 关闭共享保底：直接重置并跳转
    resetAll()
    doNavigate(id)
    return
  }
  // 开启共享保底：检查卡池类型是否一致
  const currentType = currentPool.value?.type
  const newType = cardPools[id]?.type
  if (currentType && newType && currentType !== newType) {
    pendingPoolId.value = id
    showPoolTypeMismatch.value = true
    return
  }
  doNavigate(id)
}

const navigateToCustomPool = () => {
  if (!sharedPity.value) resetAll()
  router.push({ name: '自定义卡池' })
}

const confirmPoolSwitch = () => {
  showPoolTypeMismatch.value = false
  if (pendingPoolId.value) {
    resetAll()
    doNavigate(pendingPoolId.value)
    pendingPoolId.value = null
  }
}

const cancelPoolSwitch = () => {
  showPoolTypeMismatch.value = false
  pendingPoolId.value = null
}

const lastPullCount = ref(1)
// 卡池类型判断
const isSelectableUpPool = computed(
  () => currentPool.value?.rules?.[SP]?.SelectUpCards === true,
)
const isSelectableUpGroupPool = computed(
  () => currentPool.value?.rules?.[SSR]?.SelectUpCardsGroup === true,
)
const isWishPool = computed(() => currentPool.value?.rules?.[SP]?.WishSelection === true)

// 根据 isAvailable 属性排序卡池列表
const sortedPools = computed(() => {
  return Object.entries(cardPools).sort(([, poolA], [, poolB]) => {
    const isAvailableA = !!poolA.isAvailable
    const isAvailableB = !!poolB.isAvailable
    if (isAvailableA === isAvailableB) return 0
    return isAvailableA ? -1 : 1
  })
})

// UP卡选择
const selectedUpCard = ref(null)
const selectableUpGroup = computed(() => currentPool.value?.rules?.[SSR]?.UpGroups || [])

// 心愿卡选择
const selectableWishCards = computed(() => {
  if (!isWishPool.value) return []
  return currentPool.value.cardIds?.[SP]?.map((id) => cardMap.get(id))
})
const selectedWishCards = ref([])

const isHighlightRarity = (rarity) => rarity === SP || rarity === SSR

const getDelayTime = (rarity) => {
  switch (rarity) {
    case SP: return 1000
    case SSR: return 500
    default: return 100
  }
}

const startPullAnimation = () => {
  displayedCards.value = []
  isAnimating.value = true
  const cardsToAnimate = lastPulledCards.value
  let index = 0

  function revealNextCard() {
    if (index < cardsToAnimate.length) {
      const card = cardsToAnimate[index]
      const delay = getDelayTime(card.rarity)
      displayedCards.value.push(card)
      nextTick(() => {
        if (cardsContainerRef.value) {
          cardsContainerRef.value.scrollTop = cardsContainerRef.value.scrollHeight
        }
      })
      index++
      animationTimeout = setTimeout(revealNextCard, delay)
    } else {
      isAnimating.value = false
    }
  }
  revealNextCard()
}

const stopAnimation = () => {
  if (animationTimeout) clearTimeout(animationTimeout)
  isAnimating.value = false
  displayedCards.value = lastPulledCards.value
  nextTick(() => {
    if (cardsContainerRef.value) {
      cardsContainerRef.value.scrollTop = cardsContainerRef.value.scrollHeight
    }
  })
}

const {
  currentPool,
  gachaHistory,
  lastPulledCards,
  rarityCounts,
  performSinglePull,
  performTenPulls,
  resetAll,
  setSelectedUpGroup,
  selectedUpGroup,
  pityCounters,
  pityRarity,
  pityValue,
} = useGacha(gachaSource, selectedUpCard, selectedWishCards)

// 保底剩余计算
const pityRemaining = computed(() =>
  pityValue.value ? pityValue.value - pityCounters.value : null,
)

const pityDisplayText = computed(() => {
  if (!pityRarity.value || !pityValue.value) return null
  if (pityRarity.value === SP) return '抽内必得SP'
  if (pityRarity.value === SSR && isSelectableUpGroupPool.value) return '抽内必得UP组SSR'
  return `抽内必得${pityRarity.value}`
})

// 历史记录分页（竖排，10条/页，最新在前）
const historyPage = ref(1)
const HISTORY_PER_PAGE = 10
const totalHistoryPages = computed(() =>
  Math.max(1, Math.ceil(gachaHistory.value.length / HISTORY_PER_PAGE)),
)
const paginatedHistory = computed(() => {
  const reversed = [...gachaHistory.value].reverse()
  const start = (historyPage.value - 1) * HISTORY_PER_PAGE
  return reversed.slice(start, start + HISTORY_PER_PAGE)
})
const prevHistoryPage = () => { if (historyPage.value > 1) historyPage.value-- }
const nextHistoryPage = () => { if (historyPage.value < totalHistoryPages.value) historyPage.value++ }
watch(() => gachaHistory.value.length, () => { historyPage.value = 1 })

// UP卡详情
const upCardDetails = computed(() => {
  if (!isSelectableUpPool.value) return []
  const upCardIds = currentPool.value.rules[SP].UpCards || []
  return upCardIds.map((id) => cardMap.get(id)).filter(Boolean)
})

watch(upCardDetails, (list) => {
  if (list.length > 0) {
    const exists = list.find((c) => c.id === selectedUpCard.value)
    if (!exists) {
      selectedUpCard.value = list[0].id
    }
  } else {
    selectedUpCard.value = null
  }
}, { immediate: true })

// UP SSR ID集合
const upSsrIds = computed(() => {
  const ids = new Set()
  const ssrRules = currentPool.value?.rules?.[SSR]
  if (!ssrRules) return ids
  if (ssrRules.SelectUpCardsGroup && selectedUpGroup.value?.cards) {
    selectedUpGroup.value.cards.forEach((id) => ids.add(id))
  }
  if (ssrRules.doubleRateCards) {
    ssrRules.doubleRateCards.forEach((id) => ids.add(id))
  }
  return ids
})

// 卡池内所有SSR
const poolSsrCards = computed(() => {
  if (!currentPool.value?.cards) return []
  return currentPool.value.cards
    .filter((card) => card && card.rarity === SSR)
    .sort((a, b) => {
      const aIsUp = upSsrIds.value.has(a.id)
      const bIsUp = upSsrIds.value.has(b.id)
      if (aIsUp && !bIsUp) return -1
      if (!aIsUp && bIsUp) return 1
      return a.id - b.id
    })
})

// 标题更新
watch(
  currentPool,
  (newPool) => {
    document.title = newPool?.name ? `${newPool.name}卡池模拟-织夜工具箱` : '抽卡模拟器'
  },
  { immediate: true, deep: true },
)

// UP卡选择
const selectUpCard = (cardId) => {
  selectedUpCard.value = cardId
}

// 心愿卡选择
const toggleWishCard = (cardId) => {
  const index = selectedWishCards.value.indexOf(cardId)
  if (index > -1) {
    selectedWishCards.value.splice(index, 1)
  } else {
    if (selectedWishCards.value.length >= 4) {
      return
    }
    selectedWishCards.value.push(cardId)
  }
}

const checkAndPull = (count) => {
  lastPullCount.value = count
  if (isWishPool.value && selectedWishCards.value.length !== 4) {
    return
  }
  if (count === 1) {
    performSinglePull()
  } else {
    performTenPulls()
  }
  showGachaResultOverlay.value = true
  nextTick(startPullAnimation)
}

const confirmGachaResult = () => {
  if (isAnimating.value) {
    stopAnimation()
  } else {
    showGachaResultOverlay.value = false
  }
}

const goBackToEdit = () => router.back()

// 分享自定义卡池
const shareCustomPool = async () => {
  if (!isCustomPool.value || !currentPool.value) return
  qrCodeDataUrl.value = ''
  copyStatusMessage.value = ''

  const poolName = currentPool.value.name
  const data = encodeURIComponent(route.query.data)
  const shareUrl = `${window.location.origin}${route.path}?data=${data}`
  const textToShare = `这是我在织夜工具箱创建的【${poolName}】卡池，快来试试吧！\n${shareUrl}`
  shareText.value = textToShare

  await nextTick()

  try {
    const dataUrl = await QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'H',
    })
    qrCodeDataUrl.value = dataUrl
  } catch (err) {
    logger.error('二维码生成失败:', err)
    qrCodeDataUrl.value = ''
  }
  showSharePopUp.value = true
}

const closeSharePopUp = () => {
  showSharePopUp.value = false
}

const copyShareText = async (event) => {
  try {
    await navigator.clipboard.writeText(shareText.value)
    copyStatusMessage.value = '已复制到剪贴板！'
    event.target.select()
  } catch (err) {
    copyStatusMessage.value = '复制失败，请手动复制。'
    logger.error('复制失败: ', err)
  }
  setTimeout(() => { copyStatusMessage.value = '' }, 2000)
}
</script>

<style scoped>
/* ===== 背景填充层：用背景色覆盖画布外的空白区域 ===== */
.gacha-bg-fill {
  position: fixed;
  inset: 0;
  background-color: v-bind('colors.background.primary');
}

/* ===== 返回主页按钮（屏幕左上角，不受画布 transform 影响） ===== */
.back-to-home-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  border: 1px solid v-bind('colors.border.primary');
  background-color: v-bind('colors.background.content');
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.2s, transform 0.15s;
  line-height: 0;
}

.back-to-home-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* ===== 16:10 固定画布（1400×875），由 JS scale() 适配所有屏幕 ===== */
.gacha-landscape-root {
  position: absolute;
  top: 0;
  left: 0;
  width: 1200px;
  height: 675px;
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 675px;
  overflow: hidden;
  background-color: v-bind('colors.background.primary');
  color: v-bind('colors.text.primary');
}

/* 抽卡展示时隐藏布局，画布背景透明，让 bg-fill 的背景图无缝延伸到黑边区域 */
.gacha-landscape-root.overlay-active {
  background-color: transparent;
}

/* ===== 左侧卡池列表（无背景/边框/滚动条） ===== */
.pool-panel {
  /* 高度由 grid-template-columns 控制，不显式设置 */
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  background-color: transparent;
}

.pool-panel::-webkit-scrollbar {
  display: none;
}

.pool-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
}

.pool-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.7;
  transition: opacity 0.2s, border-color 0.2s, transform 0.15s;
  flex-shrink: 0;
}

.pool-item:hover {
  opacity: 1;
  transform: scale(1.02);
}

.pool-item.active {
  border-color: v-bind('colors.brand.primary');
  opacity: 1;
}

.pool-item-image {
  width: 105%;
  aspect-ratio: 2.5;
  object-fit: cover;
  display: block;
}

.pool-item-name {
  display: block;
  padding: 0.75rem;
  font-size: 0.975rem;
  font-weight: bold;
  text-align: center;
  color: v-bind('colors.text.secondary');
  background-color: v-bind('colors.background.content');
}

/* 自定义卡池入口 */
.pool-item--custom {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  gap: 4px;
  min-height: 65px;
  background: linear-gradient(135deg,
      v-bind('colors.brand.primaryBackground'),
      v-bind('colors.background.lighter'));
  border: 1.5px dashed v-bind('colors.brand.primary');
  text-decoration: none;
  border-radius: 6px;
}

.pool-item--custom.active {
  border-style: solid;
}

.custom-pool-icon {
  font-size: 1.75rem;
  color: v-bind('colors.brand.primary');
  line-height: 1;
  font-style: normal;
}

.custom-pool-label {
  font-size: 0.875rem;
  font-weight: bold;
  color: v-bind('colors.brand.primary');
}

/* ===== 主内容区（两列：内容 + 历史） ===== */
.main-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.content-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 10px 10px 10px 14px;
  gap: 8px;
  flex: 1;
}

/* ===== 顶部栏 ===== */
.top-bar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
}

.top-bar__title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  flex-shrink: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pool-name {
  font-size: 2rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  margin: 0;
  white-space: nowrap;
}

/* 卡池名旁的圆形信息按钮 */
.pool-info-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid v-bind('colors.border.primary');
  background-color: v-bind('colors.background.content');
  cursor: pointer;
  opacity: 0.65;
  transition: opacity 0.2s, transform 0.15s;
  flex-shrink: 0;
  line-height: 0;
}

.pool-info-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* ===== 右侧历史悬浮列 ===== */
.history-float {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 360px;
  max-height: calc(100% - 20px);
  z-index: 20;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid v-bind('colors.border.primary');
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  gap: 0.25rem;
  background-color: v-bind('colors.background.content');
  overflow: hidden;
  box-sizing: border-box;
}

.rarity-counts {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 100%;
  padding-bottom: 4px;
  border-bottom: 1px solid v-bind('colors.border.primary');
}

.rarity-count-item {
  font-size: 1rem;
  font-weight: bold;
  white-space: nowrap;
}

.history-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  overflow: hidden;
}

.history-item {
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.history-empty {
  font-size: 0.75rem;
  color: v-bind('colors.text.tertiary');
  text-align: center;
  margin: 0;
}

.history-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.hist-page-btn {
  cursor: pointer;
  background: transparent;
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.75rem;
  line-height: 1;
}

.hist-page-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.hist-page-info {
  font-size: 0.75rem;
  color: v-bind('colors.text.secondary');
  white-space: nowrap;
}

/* ===== 选择区（弹性填充，内容贴底对齐） ===== */
.selection-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  /* 不使用 overflow:hidden，否则会裁切卡片 scale 动画 */
}


.up-select-group,
.wish-select-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  min-width: 0;
  flex-shrink: 0;
  width: 100%;
}

.selection-label {
  font-size: 0.82rem;
  font-weight: bold;
  color: v-bind('colors.text.secondary');
  white-space: nowrap;
  align-self: flex-end;
  text-align: right;
}

/* 换行容器（禁止横向滚动，超出后多行，可纵向滚动，内容靠右） */
.selection-scroll {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: v-bind('colors.scrollbar') transparent;
  padding: 10px 4px;
  max-height: 240px;
  min-width: 0;
  align-items: flex-start;
  align-content: flex-start;
}

.selection-scroll::-webkit-scrollbar {
  width: 4px;
}

.selection-scroll::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.scrollbar');
  border-radius: 2px;
}

/* UP卡选项 */
.up-card-option {
  cursor: pointer;
  padding: 4px;
  border-radius: 10px;
  border: 3px solid transparent;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.up-card-option:hover {
  transform: scale(1.05);
}

.up-card-option.selected {
  transform: scale(1.08);
}

.up-card-option.selected.rarity-border-sp {
  box-shadow: 0 0 2px v-bind('colors.rarity.sp');
}

.up-card-option.selected.rarity-border-ssr {
  box-shadow: 0 0 2px v-bind('colors.rarity.ssr');
}

.up-card-image {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  display: block;
  object-fit: cover;
}

.up-card-name {
  font-size: 0.75rem;
  color: v-bind('colors.text.primary');
  white-space: nowrap;
}

/* 心愿卡选项 */
.wish-card-option {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  width: 72px;
}

.wish-card-option .image-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.wish-card-option .wish-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wish-card-option.selected .image-wrapper {
  border-color: v-bind('colors.rarity.sp');
  box-shadow: 0 0 8px v-bind('colors.rarity.sp');
  transform: scale(1.05);
}

.wish-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: v-bind('colors.rarity.sp');
  color: white;
  width: 22px;
  height: 22px;
  border-bottom-left-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
}

.wish-mask {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s;
}

.wish-card-option:hover .wish-mask {
  background-color: rgba(0, 0, 0, 0);
}

.wish-card-option.selected .wish-mask {
  background-color: transparent;
}

.wish-card-name {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* UP组选项 */
.up-group-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid v-bind('colors.border.primary');
  transition: all 0.2s;
  flex-shrink: 0;
  width: 140px;
  background-color: v-bind('colors.background.content');
}

.up-group-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
}

.up-group-item.selected {
  border-color: v-bind('colors.rarity.ssr');
  box-shadow: 0 0 16px -4px v-bind('colors.rarity.ssr');
}

.up-group-image {
  width: 100%;
  aspect-ratio: 16/7;
  object-fit: cover;
  display: block;
}

.up-group-name {
  display: block;
  padding: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  text-align: center;
  color: v-bind('colors.text.primary');
}

/* ===== 底部操作栏（无分隔线，右对齐） ===== */
.controls-bar {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  flex-shrink: 0;
}

.controls-right-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.controls-pull-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* UP组（贴近抽卡按钮，标签在上，内容靠右） */
.up-group-in-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  max-width: 100%;
}

.selection-label-sm {
  font-size: 0.75rem;
  font-weight: bold;
  color: v-bind('colors.text.secondary');
  flex-shrink: 0;
  white-space: nowrap;
}

.up-group-scroll {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: v-bind('colors.scrollbar') transparent;
  padding: 4px 2px;
  max-height: 180px;
  align-content: flex-start;
  justify-content: flex-end;
}

.up-group-scroll::-webkit-scrollbar {
  width: 3px;
}

.up-group-scroll::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.scrollbar');
  border-radius: 2px;
}

/* 保底计数器 */
.pity-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
  gap: 1px;
}

.pity-number {
  font-size: 1.6rem;
  font-weight: bold;
  color: v-bind('colors.rarity.sp');
  line-height: 1;
}

.pity-label {
  font-size: 0.65rem;
  color: v-bind('colors.text.secondary');
  white-space: nowrap;
}

/* 抽卡按钮行 */
.pull-buttons {
  display: flex;
  gap: 10px;
}

.wish-incomplete-warning {
  font-size: 0.9rem;
  font-weight: bold;
  color: v-bind('colors.text.secondary');
  padding: 0.65rem 0;
}

/* ===== 通用按钮样式 ===== */
.button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: white;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.gacha-button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: white;
  padding: 0.75rem 3rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.gacha-button:hover {
  transform: translateY(-2px);
}

.single-pull {
  background-color: v-bind('colors.gacha.singlePull');
}

.ten-pull {
  background-color: v-bind('colors.gacha.tenPull');
}

.btn-confirm {
  background-color: v-bind('colors.brand.confirm');
}

.btn-confirm:hover {
  background-color: v-bind('colors.brand.confirmHover');
}

.btn-primary {
  background-color: v-bind('colors.brand.primary');
}

.btn-primary:hover {
  background-color: v-bind('colors.brand.hover');
}

.btn-secondary {
  background-color: v-bind('colors.button.secondaryBg');
  color: v-bind('colors.button.secondaryText');
  border: 1px solid v-bind('colors.border.primary');
}

.btn-secondary:hover {
  background-color: v-bind('colors.background.hover');
}

.loading-text {
  grid-column: 2;
  text-align: center;
  font-size: 1.1rem;
  color: v-bind('colors.text.secondary');
  padding: 4rem 0;
  align-self: center;
}

/* ===== 结果动画 overlay（背景透明，依赖 bg-fill 的背景图） ===== */
.gacha-result-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
}

.overlay-content {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.overlay-title {
  color: v-bind('colors.text.highlight');
  font-size: 2.2em;
  margin-bottom: 1.5rem;
}

.pulled-cards-container {
  width: 100%;
  overflow-y: auto;
  padding: 1rem;
  margin: auto
}

.pulled-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
}

.pulled-cards-grid.grid-ten-pull {
  grid-template-columns: repeat(5, 1fr) !important;
}

.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.card-image-wrapper {
  width: 110px;
  height: 110px;
  padding: 5px;
  border-radius: 12px;
  border-width: 4px;
  border-style: solid;
  position: relative;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.card-name {
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
}

.result-actions {
  display: flex;
  gap: 20px;
  margin-top: auto;
}

.confirm-button {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  padding: 0.9rem 4rem;
  margin-top: 0;
  font-size: 1.1em;
  color: white;
}

.confirm-button:disabled {
  cursor: wait;
}

.confirm-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

/* ===== SSR弹窗内容 ===== */
.ssr-popup-grid {
  display: grid;
  overflow-y: auto;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0 1.2rem;
  padding-top: 0.5rem;
  max-height: 20rem;
}

.ssr-list-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ssr-list-card-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 3px solid v-bind('colors.rarity.ssr');
  object-fit: cover;
  background-color: #2c2c2c;
}

.ssr-list-card-name {
  font-size: 0.78rem;
  margin-top: 0.4rem;
  color: v-bind('colors.text.secondary');
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.up-marker {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: v-bind('colors.brand.cancel');
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  z-index: 5;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* ===== 概率公示弹窗内容 ===== */
.probability-popup-content {
  text-align: left;
  padding: 0.25rem 0.5rem;
  line-height: 1.8;
  color: v-bind('colors.text.secondary');
}

.probability-popup-content p {
  margin-bottom: 0.75rem;
}

.probability-popup-content p:last-child {
  margin-bottom: 0;
}

.probability-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid v-bind('colors.border.primary');
}

.probability-footer a {
  color: v-bind('colors.text.highlight');
  text-decoration: none;
  font-weight: bold;
}

.probability-footer a:hover {
  text-decoration: underline;
}

/* ===== 分享弹窗 ===== */
.share-modal-text-info {
  font-size: 0.9rem;
  color: v-bind('colors.text.secondary');
  margin-bottom: 1.5rem;
}

.qr-code-container {
  padding: 10px;
  background-color: white;
  border-radius: 8px;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.share-modal-qr-code {
  display: block;
}

.share-modal-textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  color: v-bind('colors.text.primary');
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
  cursor: pointer;
}

.copy-status-message {
  margin-top: 0.5rem;
  color: v-bind('colors.brand.primary');
  font-weight: bold;
  font-size: 0.9rem;
  min-height: 1.2em;
}

/* ===== 全屏提示（Teleport 到 body，:global 确保样式生效） ===== */
:global(.gacha-orient-overlay) {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

:global(.gacha-orient-box) {
  border-radius: 14px;
  padding: 2rem 2.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  max-width: 320px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* ===== 稀有度颜色 ===== */
.text-rarity-sp,
.rarity-border-sp {
  color: v-bind('colors.rarity.sp');
  border-color: v-bind('colors.rarity.sp');
}

.text-rarity-ssr,
.rarity-border-ssr {
  color: v-bind('colors.rarity.ssr');
  border-color: v-bind('colors.rarity.ssr');
}

.text-rarity-sr,
.rarity-border-sr {
  color: v-bind('colors.rarity.sr');
  border-color: v-bind('colors.rarity.sr');
}

.text-rarity-r,
.rarity-border-r {
  color: v-bind('colors.rarity.r');
  border-color: v-bind('colors.rarity.r');
}

.rarity-bg-sp {
  background: radial-gradient(ellipse at center, rgba(222, 33, 30, 0.3) 0%, rgba(222, 33, 30, 0) 70%);
}

.rarity-bg-ssr {
  background: radial-gradient(ellipse at center, rgba(232, 119, 33, 0.3) 0%, rgba(232, 119, 33, 0) 70%);
}

.rarity-bg-sr {
  background: radial-gradient(ellipse at center, rgba(178, 30, 251, 0.25) 0%, rgba(178, 30, 251, 0) 70%);
}

/* ===== 高光动画 ===== */
@keyframes highlight-flash-sp {

  0%,
  100% {
    box-shadow: 0 0 10px 2px v-bind('colors.rarity.sp');
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 28px 8px v-bind('colors.rarity.sp');
    transform: scale(1.08);
  }
}

@keyframes highlight-flash-ssr {

  0%,
  100% {
    box-shadow: 0 0 10px 2px v-bind('colors.rarity.ssr');
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 28px 8px v-bind('colors.rarity.ssr');
    transform: scale(1.08);
  }
}

.highlight-rarity.rarity-border-sp {
  animation: highlight-flash-sp 1s ease-in-out;
}

.highlight-rarity.rarity-border-ssr {
  animation: highlight-flash-ssr 0.5s ease-in-out;
}

/* ===== 卡片弹出动画 ===== */
.card-reveal-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.card-reveal-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(50px);
}

.card-reveal-leave-active {
  transition: opacity 0.2s ease;
}

.card-reveal-leave-to {
  opacity: 0;
}

/* 竖屏旋转与缩放由 JS updateLayout() 动态计算并注入 canvasStyle */
</style>

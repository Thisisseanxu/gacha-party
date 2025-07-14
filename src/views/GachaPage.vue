<template>
  <div class="gacha-page-background">
    <div class="gacha-page">
      <template v-if="!showGachaResultOverlay">
        <div class="header-container">
          <h1>{{ currentPool ? currentPool.name : '未知卡池' }}</h1>
          <router-link to="/chouka" class="back-home-button">返回主页</router-link>
        </div>

        <div v-if="currentPool" class="gacha-main-content card">
          <div class="controls-and-switch">
            <div class="gacha-controls">
              <button @click="handleSinglePull" class="gacha-button single-pull">单抽</button>
              <button @click="handleTenPulls" class="gacha-button ten-pull">十连抽</button>
            </div>
            <SwitchComponent v-if="currentPool.type === '限定'" label="使用旧概率（2%）" v-model="useOldRate" />
          </div>

          <div v-if="isSelectableUpGroupPool" class="select-up-group-container">
            <h3 @click="toggleUpGroupExpansion" class="collapsible-header">
              <span>{{ isUpGroupExpanded ? '▼' : '▶' }}</span>
              指定UP角色组: {{ isUpGroupExpanded ? '' : selectedUpGroup?.name || '请选择' }}
            </h3>
            <transition name="collapse-transition">
              <div v-if="isUpGroupExpanded" class="up-group-list">
                <div v-for="group in selectableUpGroup" :key="group.id"
                  :class="['up-group-item', { 'selected': group.id === selectedUpGroup?.id }]"
                  @click="setSelectedUpGroup(group)">
                  <img v-if="group.image_url" :src="group.image_url" :alt="group.name + '组封面'" class="up-group-image">
                  <h4 v-else>{{ group.name }}</h4>
                </div>
              </div>
            </transition>
          </div>

          <div v-if="isSelectableUpPool" class="select-up-container">
            <h3 class="select-up-title">请选择UP角色：</h3>
            <div class="up-cards-selection">
              <div v-for="card in upCardDetails" :key="card.id"
                :class="['up-card-option', `rarity-border-${card.rarity.toLowerCase()}`, { 'selected': selectedUpCard === card.id }]"
                @click="selectUpCard(card.id)">
                <img :src="card.imageUrl" :alt="card.name" class="up-card-image">
              </div>
            </div>
          </div>
        </div>

        <div class="gacha-stats card">
          <h2>抽卡统计</h2>
          <p>总抽卡次数: {{ totalPulls }}</p>
          <ul class="rarity-counts-list">
            <li v-if="rarityCounts[RARITY.SP] > 0" class="text-rarity-sp">限定: {{ rarityCounts[RARITY.SP] }}</li>
            <li v-if="rarityCounts[RARITY.SSR] > 0" class="text-rarity-ssr">SSR: {{ rarityCounts[RARITY.SSR] }}</li>
            <li v-if="rarityCounts[RARITY.SR] > 0" class="text-rarity-sr">SR: {{ rarityCounts[RARITY.SR] }}</li>
            <li v-if="rarityCounts[RARITY.R] > 0" class="text-rarity-r">R: {{ rarityCounts[RARITY.R] }}</li>
          </ul>

          <h3>完整抽卡历史</h3>
          <div class="gacha-history-list">
            <div v-for="(card, index) in paginatedGachaHistory" :key="card.id + '_' + card.name + '_' + index"
              :class="['history-item', `text-rarity-${card.rarity.toLowerCase()}`]">
              {{ card.name }} ({{ card.rarity === RARITY.SP ? '限定' : card.rarity }})
            </div>
            <p v-if="gachaHistory.length === 0" class="no-history-text">暂无抽卡历史。</p>
          </div>

          <div v-if="totalPages > 1" class="pagination-controls">
            <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
            <span>{{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
          </div>
        </div>
        <p v-if="!currentPool" class="loading-text">卡池加载中或不存在...</p>
      </template>

      <div v-if="showGachaResultOverlay" class="gacha-result-overlay">
        <div class="overlay-content">
          <h2 class="overlay-title">恭喜获得</h2>
          <div class="pulled-cards-container" ref="cardsContainerRef">
            <transition-group name="card-reveal" tag="div" class="pulled-cards-grid">
              <div v-for="(card, index) in displayedCards" :key="card.id + '_' + index"
                :class="['card-item', `rarity-bg-${card.rarity.toLowerCase()}`]">
                <div
                  :class="['card-image-wrapper', `rarity-border-${card.rarity.toLowerCase()}`, { 'highlight-rarity': isHighlightRarity(card.rarity) }]">
                  <img :src="card.imageUrl || '/images/cards/1101.webp'" :alt="`${card.name}的立绘图`" class="card-image">
                </div>
                <p class="card-name">{{ card.name }}</p>
              </div>
            </transition-group>
          </div>
          <button @click="confirmGachaResult" class="confirm-button" :disabled="isAnimating">
            {{ isAnimating ? '...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useGacha } from '@/utils/useGacha';
import * as RARITY from '@/data/rarity.js'
import { cardMap } from '@/data/cards';
import SwitchComponent from '@/components/SwitchComponent.vue';
import { colors } from '@/styles/colors.js';
import pako from 'pako'; // 引入 pako

// --- 动画相关ref ---
const showGachaResultOverlay = ref(false);
const displayedCards = ref([]);
const isAnimating = ref(false);
let animationTimeout = null;
const cardsContainerRef = ref(null); // 卡片容器引用

const isHighlightRarity = (rarity) => {
  return rarity === RARITY.SP || rarity === RARITY.SSR;
};

const startPullAnimation = () => {
  displayedCards.value = [];
  isAnimating.value = true;

  const cardsToAnimate = lastPulledCards.value;
  let index = 0;

  // 逐个显示卡片的递归函数
  function revealNextCard() {
    if (index < cardsToAnimate.length) {
      const card = cardsToAnimate[index];
      const delay = isHighlightRarity(card.rarity) ? 300 : 100; // 抽到高稀有度时增加动画间隔时间

      displayedCards.value.push(card);

      // 当显示新卡片时，确保容器滚动到底部
      nextTick(() => {
        if (cardsContainerRef.value) {
          cardsContainerRef.value.scrollTop = cardsContainerRef.value.scrollHeight;
        }
      });

      index++;
      animationTimeout = setTimeout(revealNextCard, delay);
    } else {
      isAnimating.value = false;
    }
  }
  revealNextCard();
};

const stopAnimation = () => {
  if (animationTimeout) {
    clearTimeout(animationTimeout);
  }
  isAnimating.value = false;
  displayedCards.value = lastPulledCards.value;
  nextTick(() => {
    if (cardsContainerRef.value) {
      cardsContainerRef.value.scrollTop = cardsContainerRef.value.scrollHeight;
    }
  });
};


// --- Style颜色绑定 ---
const colorBgPrimary = colors.background.primary;
const colorBgContent = colors.background.content;
const colorBgLight = colors.background.light;
const colorBgLighter = colors.background.lighter;
const colorBgHover = colors.background.hover;

const colorTextPrimary = colors.text.primary;
const colorTextSecondary = colors.text.secondary;
const colorTextTertiary = colors.text.tertiary;
const colorTextDisabled = colors.text.disabled;
const colorTextHighlight = colors.text.highlight;

const colorBorder = colors.border.primary;

const colorBtnSingle = colors.gacha.singlePull;
const colorBtnSingleHover = colors.gacha.singlePullHover;
const colorBtnTen = colors.gacha.tenPull;
const colorBtnTenHover = colors.gacha.tenPullHover;
const colorBtnConfirm = colors.gacha.confirm;
const colorBtnConfirmHover = colors.gacha.confirmHover;
const colorBtnBack = colors.brand.primary;
const colorBtnBackHover = colors.brand.hover;

const colorRaritySP = colors.rarity.ur;
const colorRaritySSR = colors.rarity.ssr;
const colorRaritySR = colors.rarity.sr;
const colorRarityR = colors.rarity.r;

// --- 组件逻辑 ---
const route = useRoute();
const selectedUpCard = ref(null);
const useOldRate = ref(false);

// 动态获取卡池源
const gachaSource = computed(() => {
  // 检查是否是自定义卡池并带有数据
  if (route.params.poolId === 'custom' && route.query.data) {
    try {
      // Base64 解码 -> pako 解压缩 -> JSON 解析
      const binaryString = atob(route.query.data);
      const compressed = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        compressed[i] = binaryString.charCodeAt(i);
      }
      const jsonString = pako.inflate(compressed, { to: 'string' });
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('解析自定义卡池数据失败:', error);
      // 如果解析失败，可以返回一个默认卡池ID或进行错误处理
      return 'Normal01';
    }
  }
  // 否则，使用路由参数中的 poolId
  return route.params.poolId;
});


const {
  currentPool,
  gachaHistory,
  lastPulledCards,
  totalPulls,
  rarityCounts,
  performSinglePull,
  performTenPulls,
  setSelectedUpGroup,
  selectedUpGroup,
} = useGacha(gachaSource, selectedUpCard, useOldRate);

const isSelectableUpPool = computed(() => currentPool.value?.rules?.[RARITY.SP]?.SelectUpCards === true);
const isSelectableUpGroupPool = computed(() => currentPool.value?.rules?.[RARITY.SSR]?.SelectUpCardsGroup === true);
const selectableUpGroup = computed(() => currentPool.value?.rules?.[RARITY.SSR]?.UpGroups || []);

const upCardDetails = computed(() => {
  if (!isSelectableUpPool.value) return [];
  const upCardIds = currentPool.value.rules.SP.UpCards || [];
  return upCardIds.map(id => cardMap.get(id)).filter(Boolean);
});

watch(currentPool, (newPool) => {
  if (newPool?.rules?.SP?.SelectUpCards && newPool.rules.SP.UpCards?.length > 0) {
    selectedUpCard.value = newPool.rules.SP.UpCards[0];
  } else {
    selectedUpCard.value = null;
  }
  document.title = newPool?.name ? `${newPool.name} - 织夜工具箱` : '抽卡模拟器';
}, { immediate: true, deep: true });

const selectUpCard = (cardId) => {
  selectedUpCard.value = cardId;
};

const itemsPerPage = 10;
const currentPage = ref(1);

const totalPages = computed(() => {
  if (!Array.isArray(gachaHistory.value)) return 0;
  return Math.ceil(gachaHistory.value.length / itemsPerPage);
});

const paginatedGachaHistory = computed(() => {
  const reversedHistory = [...gachaHistory.value].reverse();
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return reversedHistory.slice(start, end);
});

const isUpGroupExpanded = ref(true);
const toggleUpGroupExpansion = () => {
  isUpGroupExpanded.value = !isUpGroupExpanded.value;
};

const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

watch(totalPulls, () => {
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value;
  } else if (totalPages.value === 0) {
    currentPage.value = 1;
  }
}, { immediate: true });

const handleSinglePull = () => {
  performSinglePull();
  showGachaResultOverlay.value = true;
  nextTick(startPullAnimation);
};

const handleTenPulls = () => {
  performTenPulls();
  showGachaResultOverlay.value = true;
  nextTick(startPullAnimation);
};

const confirmGachaResult = () => {
  if (isAnimating.value) {
    stopAnimation();
  } else {
    showGachaResultOverlay.value = false;
  }
};
</script>

<style scoped>
.gacha-page-background {
  background-color: v-bind(colorBgPrimary);
  min-height: 100vh;
  padding: 2rem 1rem;
}

.gacha-page {
  max-width: 900px;
  margin: 0 auto;
  color: v-bind(colorTextPrimary);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.card {
  background-color: v-bind(colorBgContent);
  padding: 1.5rem 2rem;
  border-radius: 12px;
  border: 1px solid v-bind(colorBorder);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: -1rem;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
}

.loading-text {
  text-align: center;
  font-size: 1.2rem;
  color: v-bind(colorTextSecondary);
  padding: 4rem 0;
}

/* --- 交互组件样式 --- */
.controls-and-switch {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.gacha-controls {
  display: flex;
  gap: 1rem;
}

.gacha-button,
.back-home-button,
.pagination-controls button,
.confirm-button {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  color: white;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
}

.single-pull {
  background-color: v-bind(colorBtnSingle);
}

.single-pull:hover {
  background-color: v-bind(colorBtnSingleHover);
  transform: translateY(-2px);
}

.ten-pull {
  background-color: v-bind(colorBtnTen);
}

.ten-pull:hover {
  background-color: v-bind(colorBtnTenHover);
  transform: translateY(-2px);
}

.back-home-button {
  background-color: v-bind(colorBtnBack);
  text-decoration: none;
}

.back-home-button:hover {
  background-color: v-bind(colorBtnBackHover);
}

/* --- UP选择相关样式 --- */
.select-up-container,
.select-up-group-container {
  margin-top: 2rem;
  border-top: 1px solid v-bind(colorBorder);
  padding-top: 1.5rem;
}

.select-up-title,
.collapsible-header {
  font-weight: bold;
  margin: 0 0 1.5rem 0;
  color: v-bind(colorTextPrimary);
}

.collapsible-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  transition: opacity 0.2s ease;
}

.collapsible-header:hover {
  opacity: 0.8;
}

.collapsible-header span {
  margin-right: 8px;
  width: 1em;
  text-align: center;
}

.up-cards-selection,
.up-group-list {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.up-card-option {
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  border: 4px solid transparent;
  transition: transform 0.2s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.up-card-option:hover {
  transform: scale(1.05);
}

.up-card-option.selected {
  transform: scale(1.1);
}

.up-card-image {
  width: 80px;
  height: 80px;
  display: block;
  border-radius: 8px;
}

.up-group-item {
  cursor: pointer;
  width: clamp(280px, 45%, 320px);
  border: 2px solid v-bind(colorBorder);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  background-color: v-bind(colorBgPrimary);
}

.up-group-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.4);
}

.up-group-item.selected {
  border-color: v-bind(colorRaritySSR);
  box-shadow: 0 0 20px -5px v-bind(colorRaritySSR);
}

.up-group-image {
  width: 100%;
  height: auto;
  aspect-ratio: 16/7;
  object-fit: cover;
}

/* --- 历史记录相关样式 --- */
.gacha-stats h2,
.gacha-stats h3 {
  color: v-bind(colorTextPrimary);
  border-bottom: 1px solid v-bind(colorBorder);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.gacha-stats>p {
  color: v-bind(colorTextSecondary);
  font-size: 1rem;
}

.rarity-counts-list {
  list-style: none;
  padding: 0;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.rarity-counts-list li {
  font-weight: bold;
  background-color: v-bind(colorBgPrimary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.gacha-history-list {
  background-color: v-bind(colorBgPrimary);
  min-height: 300px;
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  padding: 5px 0;
}

.no-history-text {
  text-align: center;
  color: v-bind(colorTextTertiary);
  margin-top: 2rem;
}

.pagination-controls {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination-controls button {
  background-color: v-bind(colorBgLighter);
}

.pagination-controls button:hover:not(:disabled) {
  background-color: v-bind(colorBgHover);
}

.pagination-controls button:disabled {
  background-color: v-bind(colorBgLight);
  color: v-bind(colorTextDisabled);
  cursor: not-allowed;
}

/* --- 结果叠加层样式 --- */
.gacha-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  background-image: url('/images/gacha_bg.webp');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
}

.gacha-result-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 1;
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
  color: v-bind(colorTextHighlight);
  font-size: 2.5em;
  margin-bottom: 2rem;
}

.pulled-cards-container {
  width: 100%;
  max-width: 90vw;
  max-height: 70vh;
  overflow-y: auto;
  padding: 1rem;
}

.pulled-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
}

.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.card-image-wrapper {
  width: 120px;
  height: 120px;
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
  font-size: 1rem;
  white-space: nowrap;
}

.confirm-button {
  padding: 1rem 4rem;
  margin-top: auto;
  font-size: 1.2em;
  background-color: v-bind(colorBtnConfirm);
  color: #1a1a1a;
  border: none;
  min-width: 120px;
}

.confirm-button:hover:not(:disabled) {
  background-color: v-bind(colorBtnConfirmHover);
}

.confirm-button:disabled {
  cursor: wait;
}


/* --- 稀有度颜色 --- */
.text-rarity-sp,
.rarity-border-sp {
  color: v-bind(colorRaritySP);
  border-color: v-bind(colorRaritySP);
}

.text-rarity-ssr,
.rarity-border-ssr {
  color: v-bind(colorRaritySSR);
  border-color: v-bind(colorRaritySSR);
}

.text-rarity-sr,
.rarity-border-sr {
  color: v-bind(colorRaritySR);
  border-color: v-bind(colorRaritySR);
}

.text-rarity-r,
.rarity-border-r {
  color: v-bind(colorRarityR);
  border-color: v-bind(colorRarityR);
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

.up-card-option.selected.rarity-border-sp {
  box-shadow: 0 0 15px v-bind(colorRaritySP);
}

.up-card-option.selected.rarity-border-ssr {
  box-shadow: 0 0 15px v-bind(colorRaritySSR);
}

/* --- 动画关键帧 & 过渡 --- */

@keyframes highlight-flash {

  0%,
  100% {
    box-shadow: 0 0 10px 2px v-bind(colorRaritySP);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 30px 10px v-bind(colorRaritySP);
    transform: scale(1.1);
  }
}

.highlight-rarity.rarity-border-sp,
.highlight-rarity.rarity-border-ssr {
  animation: highlight-flash 0.6s ease-in-out;
}

/* 角色弹出动画 */
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

.collapse-transition-enter-active,
.collapse-transition-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 500px;
  overflow: hidden;
}

.collapse-transition-enter-from,
.collapse-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

/* 移动端适配 */
@media (max-width: 900px) {
  .pulled-cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 1.5rem;
    /* 一行最多5个角色 */
    max-width: calc(5 * 80px + 4 * 1rem);
    margin-left: auto;
    margin-right: auto;
  }

  .card-image-wrapper {
    width: 80px;
    height: 80px;
  }

  .card-name {
    font-size: 1rem;
  }

  .overlay-title {
    font-size: 2.5em;
  }
}
</style>

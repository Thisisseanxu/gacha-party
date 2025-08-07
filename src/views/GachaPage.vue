<template>
  <div class="gacha-page-background">
    <div class="gacha-page">
      <template v-if="!showGachaResultOverlay">
        <div class="header-container">
          <div class="title-with-share">
            <h1>{{ currentPool ? currentPool.name : '未知卡池' }}</h1>
            <button v-if="isCustomPool" @click="shareCustomPool" class="share-button">分享卡池</button>
          </div>
          <router-link v-if="!isCustomPool" to="/chouka" class="back-home-button">返回</router-link>
          <button v-else @click="goBackToEdit" class="back-home-button">重新编辑</button>
        </div>

        <div v-if="currentPool" class="gacha-main-content card">
          <div class="controls-and-switch">
            <div class="gacha-controls">
              <button @click="toChallenge" v-if="currentPool.type === '限定'"
                class="gacha-button challenge-button">进入挑战赛</button>
              <div class="gacha-controls">
                <button @click="handleSinglePull" class="gacha-button single-pull">单抽</button>
                <button @click="handleTenPulls" class="gacha-button ten-pull">十连抽</button>
              </div>
            </div>
          </div>

          <div v-if="isSelectableUpPool" class="select-up-container">
            <h3 class="select-up-title">{{ upCardDetails.length > 1 ? '请选择UP的限定角色：' : '当前卡池限定角色为：' }}</h3>
            <div class="up-cards-selection">
              <div v-for="card in upCardDetails" :key="card.id"
                :class="['up-card-option', `rarity-border-${card.rarity.toLowerCase()}`, { 'selected': selectedUpCard === card.id }]"
                @click="selectUpCard(card.id)">
                <img :src="card.imageUrl" :alt="card.name" class="up-card-image">
              </div>
            </div>
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
    <PopUp :display="showSharePopUp" title="分享你的卡池" @close="closeSharePopUp">
      <p class="share-modal-text-info">长按二维码保存或点击下方链接复制分享</p>

      <div class="qr-code-container">
        <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="卡池分享二维码" class="share-modal-qr-code">
        <p v-else>二维码生成中...</p>
      </div>

      <textarea readonly class="share-modal-textarea" @click="copyShareText" v-model="shareText"></textarea>

      <p v-if="copyStatusMessage" class="copy-status-message">{{ copyStatusMessage }}</p>
    </PopUp>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGacha } from '@/utils/useGacha';
import * as RARITY from '@/data/rarity.js'
import { cardMap } from '@/data/cards';
import { colors } from '@/styles/colors.js';
import { getGachaSource } from '@/utils/getGachaSource.js';
import QRCode from 'qrcode';

import PopUp from '@/components/PopUp.vue';

// 动画相关的ref
const showGachaResultOverlay = ref(false);
const displayedCards = ref([]);
const isAnimating = ref(false);
let animationTimeout = null;
const cardsContainerRef = ref(null); // 卡片容器引用

// 控制分享弹窗的ref
const showSharePopUp = ref(false);
const shareText = ref('');
const qrCodeDataUrl = ref('');
const copyStatusMessage = ref('');

const isHighlightRarity = (rarity) => {
  return rarity === RARITY.SP || rarity === RARITY.SSR;
};

const getDelayTime = (rarity) => {
  switch (rarity) {
    case RARITY.SP:
      return 1000; // 限定卡片
    case RARITY.SSR:
      return 500; // SSR卡片
    case RARITY.SR:
      return 100; // SR卡片
    case RARITY.R:
      return 100; // R卡片
    default:
      return 100; // 默认延迟
  }
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
      const delay = getDelayTime(card.rarity);
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

// 组件逻辑
const route = useRoute();
const router = useRouter(); // 获取路由实例
const selectedUpCard = ref(null);

// 动态获取卡池数据
const isCustomPool = computed(() => route.params.poolId === 'custom');
const gachaSource = computed(() => getGachaSource(route));

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
} = useGacha(gachaSource, selectedUpCard);

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

// 将当前所有的param传递给挑战赛页面
// 假设当前为/chouka/zaodaoji，则跳转到/choukatiaozhansai/zaodaoji
// 假设当前为自定义卡池，则跳转到/choukatiaozhansai/custom?data=...
const toChallenge = () => {
  const currentPath = route.path;
  const currentQuery = route.query;
  const challengePath = currentPath.replace('/chouka', '/choukatiaozhansai');
  router.push({ path: challengePath, query: currentQuery });
};

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

const goBackToEdit = () => {
  router.back();
};

// 分享自定义卡池
const shareCustomPool = async () => {
  if (!isCustomPool.value || !currentPool.value) return;
  // 重置状态
  qrCodeDataUrl.value = ''; // 先清空，显示“生成中”
  copyStatusMessage.value = '';

  const poolName = currentPool.value.name;
  const data = encodeURIComponent(route.query.data);
  const shareUrl = `${window.location.origin}${route.path}?data=${data}`;
  const textToShare = `这是我在织夜工具箱创建的【${poolName}】卡池，快来试试吧！\n${shareUrl}`;

  shareText.value = textToShare;

  // 确保弹窗和canvas元素已渲染到DOM中
  await nextTick();

  try {
    // 使用 toDataURL 方法直接生成 Base64 格式的图片数据
    const dataUrl = await QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'H'
    });
    // 将生成的数据URL赋值给ref，<img>标签会自动显示图片
    qrCodeDataUrl.value = dataUrl;
  } catch (err) {
    console.error('二维码生成失败:', err);
    // 可以在这里设置一个错误提示
    qrCodeDataUrl.value = ''; // 清空以显示错误或提示
  }
  showSharePopUp.value = true;
};

// 关闭弹窗
const closeSharePopUp = () => {
  showSharePopUp.value = false;
};

// 复制分享文本到剪贴板
const copyShareText = async (event) => {
  try {
    await navigator.clipboard.writeText(shareText.value);
    copyStatusMessage.value = '已复制到剪贴板！';
    event.target.select(); // 选中textarea中的所有文本以提供视觉反馈
  } catch (err) {
    copyStatusMessage.value = '复制失败，请手动复制。';
    console.error('复制失败: ', err);
  }
  // 2秒后清除提示信息
  setTimeout(() => {
    copyStatusMessage.value = '';
  }, 2000);
};

</script>

<style scoped>
/* 分享按钮样式 */
.title-with-share {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

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

/* 移除分享按钮的特定颜色，使其与其他按钮风格一致 */
.share-button {
  background-color: v-bind('colors.brand.confirm');
}

.share-button:hover {
  background-color: v-bind('colors.brand.confirmHover');
}


.gacha-page-background {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 2rem 1rem;
}

.gacha-page {
  max-width: 900px;
  margin: 0 auto;
  color: v-bind(colorTextPrimary);
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.card {
  background-color: v-bind('colors.background.content');
  padding: 1.5rem 2rem;
  border-radius: 12px;
  border: 1px solid v-bind('colors.border.primary');
}

.header-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: -1rem;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  text-wrap: wrap;
}

.loading-text {
  text-align: center;
  font-size: 1.2rem;
  color: v-bind('colors.text.secondary');
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.gacha-button,
.back-home-button,
.pagination-controls button,
.confirm-button,
.share-button {
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
  background-color: v-bind('colors.gacha.singlePull');
}

.single-pull:hover {
  background-color: v-bind('colors.gacha.singlePullHover');
  transform: translateY(-2px);
}

.ten-pull {
  background-color: v-bind('colors.gacha.tenPull');
}

.ten-pull:hover {
  background-color: v-bind('colors.gacha.tenPullHover');
  transform: translateY(-2px);
}

.challenge-button {
  background-color: v-bind('colors.brand.cancel');
}

.challenge-button:hover {
  background-color: v-bind('colors.brand.cancelHover');
  transform: translateY(-2px);
}

.back-home-button {
  background-color: v-bind('colors.brand.primary');
  text-decoration: none;
}

.back-home-button:hover {
  background-color: v-bind('colors.brand.hover');
}

/* --- UP选择相关样式 --- */
.select-up-container,
.select-up-group-container {
  margin-top: 2rem;
  border-top: 1px solid v-bind('colors.border.primary');
  padding-top: 1.5rem;
}

.select-up-title,
.collapsible-header {
  font-weight: bold;
  margin: 0 0 1.5rem 0;
  color: v-bind('colors.text.primary');
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
  border: 2px solid v-bind('colors.border.primary');
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  background-color: v-bind('colors.background.primary');
}

.up-group-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.4);
}

.up-group-item.selected {
  border-color: v-bind('colors.rarity.ssr');
  box-shadow: 0 0 20px -5px v-bind('colors.rarity.ssr');
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
  color: v-bind('colors.text.primary');
  border-bottom: 1px solid v-bind('colors.border.primary');
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.gacha-stats>p {
  color: v-bind('colors.text.secondary');
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
  background-color: v-bind('colors.background.primary');
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.gacha-history-list {
  background-color: v-bind('colors.background.primary');
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
  color: v-bind('colors.text.tertiary');
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
  background-color: v-bind('colors.background.lighter');
}

.pagination-controls button:hover:not(:disabled) {
  background-color: v-bind('colors.background.hover');
}

.pagination-controls button:disabled {
  background-color: v-bind('colors.background.light');
  color: v-bind('colors.text.disabled');
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
  color: v-bind('colors.text.highlight');
  font-size: 2.5em;
  margin-bottom: 2rem;
}

.pulled-cards-container {
  width: 100%;
  max-width: 90vw;
  max-height: 70vh;
  overflow-y: auto;
  padding: 1rem;
  margin-top: auto;
  margin-bottom: auto;
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
  background-color: v-bind('colors.gacha.confirm');
  color: #1a1a1a;
  border: none;
  min-width: 120px;
}

.confirm-button:hover:not(:disabled) {
  background-color: v-bind('colors.gacha.confirmHover');
}

.confirm-button:disabled {
  cursor: wait;
}


/* --- 稀有度颜色 --- */
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

.up-card-option.selected.rarity-border-sp {
  box-shadow: 0 0 15px v-bind('colors.rarity.sp');
}

.up-card-option.selected.rarity-border-ssr {
  box-shadow: 0 0 15px v-bind('colors.rarity.ssr');
}

/* --- 动画关键帧 & 过渡 --- */

@keyframes highlight-flash-sp {

  0%,
  100% {
    box-shadow: 0 0 10px 2px v-bind('colors.rarity.sp');
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 30px 10px v-bind('colors.rarity.sp');
    transform: scale(1.1);
  }
}

@keyframes highlight-flash-ssr {

  0%,
  100% {
    box-shadow: 0 0 10px 2px v-bind('colors.rarity.ssr');
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 30px 10px v-bind('colors.rarity.ssr');
    transform: scale(1.1);
  }
}

.highlight-rarity.rarity-border-sp {
  animation: highlight-flash-sp 1s ease-in-out;
}

.highlight-rarity.rarity-border-ssr {
  animation: highlight-flash-ssr 0.5s ease-in-out;
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
    /* 一行最多五个角色 */
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

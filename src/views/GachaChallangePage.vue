<template>
  <div class="gacha-page-background">
    <div class="gacha-page">
      <template v-if="!showGachaResultOverlay">
        <div class="header-container">
          <div class="header-title">
            <h1>抽卡挑战赛</h1>
            <h2>（熊月规则v2）</h2>
          </div>
        </div>

        <div class="challenge-stats-overview card">
          <div class="stat-item">
            <span class="stat-label">目标卡池</span>
            <span class="stat-value pool-name">{{ currentPool ? currentPool.name : '加载中...' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总得分</span>
            <span class="stat-value score">{{ totalScore }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">剩余抽数</span>
            <span class="stat-value pulls">{{ remainingPulls }} / {{ CHALLENGE_PULL_LIMIT }}</span>
          </div>
        </div>

        <div v-if="currentPool" class="gacha-main-content card">
          <div class="controls-container">
            <div v-if="!challengeInProgress" class="challenge-end-controls">
              <h2>挑战结束！</h2>
              <p>你的最终得分为: {{ totalScore }}</p>
              <button @click="resetChallenge" class="gacha-button ten-pull">再试一次</button>
            </div>
            <button v-else @click="handleChallengePull" class="gacha-button ten-pull" :disabled="remainingPulls <= 0">
              进行十连抽 ({{ remainingPulls / 10 }} 次机会)
            </button>
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

          <router-link to="/chouka" class="back-home-button">退出挑战</router-link>
        </div>

        <div class="gacha-stats card">
          <h2>挑战历史记录</h2>
          <div class="challenge-history-list">
            <div v-if="challengeHistory.length === 0" class="no-history-text">
              <p>暂无挑战记录。</p>
              <p>点击上方“进行十连抽”开始你的挑战吧！</p>
            </div>
            <div v-else v-for="(pull, index) in challengeHistory" :key="index" class="history-pull-item">
              <div class="pull-header">
                <h4>第 {{ index + 1 }} 次十连抽</h4>
                <span :class="['pull-score', { 'positive-score': pull.score > 0 }]">得分: +{{ pull.score }}</span>
              </div>
              <div class="pull-cards">
                <span v-for="(card, cardIndex) in pull.cards" :key="cardIndex"
                  :class="`text-rarity-${card.rarity.toLowerCase()}`">
                  {{ card.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p v-if="!currentPool" class="loading-text">卡池加载中或不存在...</p>
      </template>

      <div v-if="showGachaResultOverlay" class="gacha-result-overlay">
        <div class="overlay-content">
          <h2 class="overlay-title">恭喜获得</h2>
          <h3 v-if="currentPullScore > 0" class="overlay-score good-score">本次得分: +{{ currentPullScore }}</h3>
          <h3 v-else class="overlay-score">本次得分: 0</h3>
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
import { colors } from '@/styles/colors.js';
import { getGachaSource } from '@/utils/getGachaSource.js';

// 挑战赛配置
const CHALLENGE_PULL_LIMIT = 200; // 规定总抽数

// 挑战赛状态
const totalScore = ref(0);
const remainingPulls = ref(CHALLENGE_PULL_LIMIT);
const challengeInProgress = ref(true);
const currentPullScore = ref(0);
const challengeHistory = ref([]); // 存储每次十连的结果和得分

// 动画相关 ref
const showGachaResultOverlay = ref(false);
const displayedCards = ref([]);
const isAnimating = ref(false);
let animationTimeout = null;
const cardsContainerRef = ref(null);

const isHighlightRarity = (rarity) => {
  return rarity === RARITY.SP || rarity === RARITY.SSR;
};

// 组件逻辑
const route = useRoute();
const selectedUpCard = ref(null);

// 动态获取卡池数据
const gachaSource = computed(() => getGachaSource(route));

const {
  currentPool,
  lastPulledCards,
  performTenPulls,
  resetGachaHistory,
} = useGacha(gachaSource, selectedUpCard, ref(false)); // 挑战模式不使用旧概率

// --- 核心计分逻辑 ---
const calculateScore = (cards) => {
  const spCount = cards.filter(c => c.rarity === RARITY.SP).length;
  const ssrCount = cards.filter(c => c.rarity === RARITY.SSR).length;
  let score = 0;

  // 计算SP得分
  if (spCount === 1) {
    score += 10;
  } else if (spCount >= 2) {
    score += spCount * 20; // 双SP及以上每个SP得20分
  }

  // 计算SSR得分
  if (ssrCount === 1) {
    score += 5;
  } else if (ssrCount === 2) {
    score += 15; // 5 + 5 + 5 额外分数
  } else if (ssrCount === 3) {
    score += 20; // 5 + 5 + 5 + 5 额外分数
  } else if (ssrCount === 4) {
    score += 30; // 5 + 5 + 5 + 5 + 10 额外分数
  } else if (ssrCount >= 5) {
    score += ssrCount * 10; // 五个及以上SSR每个得10分
  }

  return score;
};

const handleChallengePull = () => {
  if (remainingPulls.value <= 0) return;

  performTenPulls();
  remainingPulls.value -= 10;

  const score = calculateScore(lastPulledCards.value);
  currentPullScore.value = score;
  totalScore.value += score;

  // 记录到挑战历史
  challengeHistory.value.unshift({ cards: [...lastPulledCards.value], score: score });

  if (remainingPulls.value <= 0) {
    challengeInProgress.value = false;
  }

  showGachaResultOverlay.value = true;
  nextTick(startPullAnimation);
};

const resetChallenge = () => {
  totalScore.value = 0;
  remainingPulls.value = CHALLENGE_PULL_LIMIT;
  challengeInProgress.value = true;
  currentPullScore.value = 0;
  challengeHistory.value = [];
  resetGachaHistory(); // 重置 useGacha 内部的历史记录
  showGachaResultOverlay.value = false;
};


// --- 动画 & 结果确认 ---
const startPullAnimation = () => {
  displayedCards.value = [];
  isAnimating.value = true;
  const cardsToAnimate = lastPulledCards.value;
  let index = 0;

  function revealNextCard() {
    if (index < cardsToAnimate.length) {
      const card = cardsToAnimate[index];
      const delay = isHighlightRarity(card.rarity) ? 300 : 100;
      displayedCards.value.push(card);
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
  if (animationTimeout) clearTimeout(animationTimeout);
  isAnimating.value = false;
  displayedCards.value = lastPulledCards.value;
  nextTick(() => {
    if (cardsContainerRef.value) {
      cardsContainerRef.value.scrollTop = cardsContainerRef.value.scrollHeight;
    }
  });
};

const confirmGachaResult = () => {
  if (isAnimating.value) {
    stopAnimation();
  } else {
    showGachaResultOverlay.value = false;
  }
};

// UP卡选择逻辑
const isSelectableUpPool = computed(() => currentPool.value?.rules?.[RARITY.SP]?.SelectUpCards === true);
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
  document.title = newPool?.name ? `挑战: ${newPool.name} - 织夜工具箱` : '抽卡挑战赛';
}, { immediate: true, deep: true });

const selectUpCard = (cardId) => {
  selectedUpCard.value = cardId;
};

</script>

<style scoped>
.gacha-page-background {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 2rem 1rem;
}

.gacha-page {
  max-width: 900px;
  margin: 0 auto;
  color: v-bind('colors.text.primary');
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: -1rem;
}

.header-title {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
}

h1,
h2 {
  margin: 0;
  color: v-bind('colors.text.primary');
}

.loading-text,
.no-history-text {
  text-align: center;
  font-size: 1.2rem;
  color: v-bind('colors.text.secondary');
  padding: 4rem 0;
}

.no-history-text p {
  margin: 0.5rem 0;
}

/* --- 挑战赛专属样式 --- */
.challenge-stats-overview {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  text-align: center;
  padding: 1rem 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9rem;
  color: v-bind('colors.text.secondary');
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
}

.stat-value.score {
  color: v-bind('colors.rarity.ssr');
}

.stat-value.pool-name {
  font-size: 1.5rem;
}

.controls-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
}

.challenge-end-controls {
  text-align: center;
}

.challenge-end-controls h2 {
  font-size: 2em;
  color: v-bind('colors.rarity.sp');
  margin-bottom: 0.5rem;
}

.challenge-end-controls p {
  font-size: 1.2em;
  margin-bottom: 1.5rem;
}

.challenge-history-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-pull-item {
  background-color: v-bind('colors.background.primary');
  border-radius: 8px;
  padding: 1rem;
  border-left: 5px solid v-bind('colors.border.primary');
}

.pull-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid v-bind('colors.border.primary');
}

.pull-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.pull-score {
  font-weight: bold;
  font-size: 1.1rem;
  color: v-bind('colors.text.secondary');
}

.pull-score.positive-score {
  color: v-bind('colors.rarity.ssr');
}

.pull-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.pull-cards span {
  font-size: 0.9rem;
}

/* --- 按钮 & 交互 --- */
.gacha-button,
.back-home-button,
.confirm-button {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.2rem;
}

.ten-pull {
  background-color: v-bind('colors.gacha.tenPull');
}

.ten-pull:hover:not(:disabled) {
  background-color: v-bind('colors.gacha.tenPullHover');
  transform: translateY(-2px);
}

.ten-pull:disabled {
  background-color: #555;
  cursor: not-allowed;
  transform: none;
}


.back-home-button {
  background-color: v-bind('colors.rarity.ssr');
  text-decoration: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
}

.back-home-button:hover {
  background-color: v-bind('colors.brand.hover');
}

/* --- UP选择 (样式继承) --- */
.select-up-container {
  border-top: 1px solid v-bind('colors.border.primary');
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.select-up-title {
  font-weight: bold;
  margin: 0 0 1.5rem 0;
  color: v-bind('colors.text.primary');
}

.up-cards-selection {
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
  margin-bottom: 0.5rem;
}

.overlay-score {
  font-size: 1.8em;
  margin-bottom: 1rem;
  color: #eee;
}

.overlay-score.good-score {
  color: v-bind('colors.rarity.ssr');
  text-shadow: 0 0 10px v-bind('colors.rarity.ssr');
}

.pulled-cards-container {
  width: 100%;
  max-width: 90vw;
  max-height: 65vh;
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

/* --- 动画 --- */
@keyframes highlight-flash {

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

.highlight-rarity.rarity-border-sp,
.highlight-rarity.rarity-border-ssr {
  animation: highlight-flash 0.6s ease-in-out;
}

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

/* 移动端适配 */
@media (max-width: 900px) {
  .pulled-cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 1rem;
    max-width: calc(5 * 80px + 4 * 1rem);
    margin-left: auto;
    margin-right: auto;
  }

  .card-image-wrapper {
    width: 80px;
    height: 80px;
  }

  .card-name {
    font-size: 0.9rem;
  }

  .overlay-title {
    font-size: 2em;
  }

  .overlay-score {
    font-size: 1.5em;
  }
}
</style>

<template>
  <div class="custom-gacha-page-background">
    <div class="config-container card">
      <router-link to="/chouka" class="back-home-button-config">返回主页</router-link>
      <h1 class="config-title">自定义卡池构建器</h1>
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
              :class="{ 'selected': selectedCardIds[rarity].includes(card.id) }"
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
                :class="{ 'selected': upCandidateIds.includes(cardId) }" @click="toggleUpCandidate(cardId)">
                <img :src="cardMap.get(cardId)?.imageUrl" :alt="cardMap.get(cardId)?.name" class="card-image" />
                <div class="checkmark">✔</div>
              </div>
            </div>
          </div>

          <div v-if="selectedCardIds.SSR.length > 0">
            <h3 class="subsection-title">SSR角色双倍概率 (可多选)</h3>
            <div class="card-selector-grid-small">
              <div v-for="cardId in selectedCardIds.SSR" :key="cardId" class="card-option-small"
                :class="{ 'selected': doubleRateSSRIds.includes(cardId) }" @click="toggleDoubleRateSSR(cardId)">
                <img :src="cardMap.get(cardId)?.imageUrl" :alt="cardMap.get(cardId)?.name" class="card-image" />
                <div class="checkmark">✔</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button @click="navigateToGachaPage" class="finalize-button">创建卡池并开始抽卡</button>
      <router-link to="/chouka" class="back-home-button-config">返回主页</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import * as RARITY from '@/data/rarity.js';
import { cardMap, allCards } from '@/data/cards.js';
import { colors } from '@/styles/colors.js';
import pako from 'pako';

const router = useRouter();

// --- 配置状态 ---
const customPool = ref({
  name: '我的梦想卡池',
  rates: { SP: 1.25, SSR: 8, SR: 20 },
});
const selectedCardIds = ref({ SP: [], SSR: [], SR: [], R: [] });
const upCandidateIds = ref([]);
const doubleRateSSRIds = ref([]);

const rarities = [RARITY.SP, RARITY.SSR, RARITY.SR, RARITY.R];
const groupedCards = rarities.reduce((acc, rarity) => {
  acc[rarity] = allCards.filter(card => card.rarity === rarity);
  return acc;
}, {});

const toggleCardSelection = (rarity, cardId) => {
  const set = selectedCardIds.value[rarity];
  const index = set.indexOf(cardId);
  if (index > -1) {
    set.splice(index, 1);
    if (rarity === RARITY.SP) toggleUpCandidate(cardId, true);
    if (rarity === RARITY.SSR) toggleDoubleRateSSR(cardId, true);
  } else {
    set.push(cardId);
  }
};

const toggleUpCandidate = (cardId, forceRemove = false) => {
  const index = upCandidateIds.value.indexOf(cardId);
  if (forceRemove) {
    if (index > -1) upCandidateIds.value.splice(index, 1);
    return;
  }
  if (index > -1) upCandidateIds.value.splice(index, 1); else upCandidateIds.value.push(cardId);
};

const toggleDoubleRateSSR = (cardId, forceRemove = false) => {
  const index = doubleRateSSRIds.value.indexOf(cardId);
  if (forceRemove) {
    if (index > -1) doubleRateSSRIds.value.splice(index, 1);
    return;
  }
  if (index > -1) doubleRateSSRIds.value.splice(index, 1); else doubleRateSSRIds.value.push(cardId);
};

const navigateToGachaPage = () => {
  const poolCards = [];
  rarities.forEach(rarity => {
    selectedCardIds.value[rarity].forEach(id => {
      if (cardMap.has(id)) poolCards.push({ ...cardMap.get(id) });
    });
  });

  if (poolCards.length === 0) {
    alert('请至少向卡池中添加一张卡牌！');
    return;
  }

  const rules = {};
  if (selectedCardIds.value.SP.length > 0) {
    rules[RARITY.SP] = {
      pity: 60,
      boostAfter: 40,
      boost: 0.02,
      UpTrigger: upCandidateIds.value.length > 0,
      SelectUpCards: upCandidateIds.value.length > 0,
      UpCards: [...upCandidateIds.value],
    };
  }
  if (selectedCardIds.value.SSR.length > 0) {
    rules[RARITY.SSR] = {
      doubleRateCards: [...doubleRateSSRIds.value],
    };
  }
  // 如果对应稀有度没有卡牌被选中，则自动设置概率为0
  if (selectedCardIds.value.SP.length === 0) customPool.value.rates.SP = 0;
  if (selectedCardIds.value.SSR.length === 0) customPool.value.rates.SSR = 0;
  if (selectedCardIds.value.SR.length === 0) customPool.value.rates.SR = 0;
  // 如果没有设置R卡池，则自动设置其他稀有度的总概率为100%（按原比例换算）
  if (selectedCardIds.value.R.length === 0) {
    const totalRate = customPool.value.rates.SP + customPool.value.rates.SSR + customPool.value.rates.SR;
    customPool.value.rates.SP = (customPool.value.rates.SP / totalRate) * 100;
    customPool.value.rates.SSR = (customPool.value.rates.SSR / totalRate) * 100;
    customPool.value.rates.SR = (customPool.value.rates.SR / totalRate) * 100;
  }

  const finalPoolConfig = {
    id: 'custom',
    name: customPool.value.name,
    cards: poolCards,
    rules: rules,
    rates: {
      SP: customPool.value.rates.SP / 100,
      SSR: customPool.value.rates.SSR / 100,
      SR: customPool.value.rates.SR / 100,
    },
  };

  const jsonString = JSON.stringify(finalPoolConfig);
  const compressed = pako.deflate(jsonString);
  let binaryString = '';
  for (let i = 0; i < compressed.length; i++) {
    binaryString += String.fromCharCode(compressed[i]);
  }
  const encodedData = btoa(binaryString);

  router.push({
    name: '抽卡页面',
    params: { poolId: 'custom' }, // 使用一个固定的param来标识这是自定义卡池
    query: { data: encodedData },
  });
};

</script>

<style scoped>
/* 样式与之前版本保持一致 */
.custom-gacha-page-background {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 2rem 1rem;
  color: v-bind('colors.text.primary');
}

.card {
  background-color: v-bind('colors.background.content');
  padding: 1.5rem 2rem;
  border-radius: 12px;
  border: 1px solid v-bind('colors.border.primary');
}

.config-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  padding-top: 1.5rem;
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
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
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
  padding: 4px;
  background: rgba(0, 0, 0, 0.6);
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
  background: rgba(0, 0, 0, 0.7);
  color: white;
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
  margin-top: 2rem;
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
  color: white;
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
.back-home-button-config {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  color: white;
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
</style>

<template>
  <div class="gacha-page">
    <template v-if="!showGachaResultOverlay">
      <div class="header-container">
        <router-link to="/chouka" class="back-home-button">返回主页</router-link>
        <h1>{{ currentPool ? currentPool.name : '未知卡池' }}</h1>
      </div>

      <div v-if="currentPool">
        <div class="gacha-controls">
          <button @click="handleSinglePull" class="gacha-button single-pull">单抽</button>
          <button @click="handleTenPulls" class="gacha-button ten-pull">十连抽</button>
        </div>
        <SwitchComponent label="使用旧概率（2%）" v-model="useOldRate" />
      </div>
      <p v-else>卡池加载中或不存在...</p>

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

      <div class="gacha-stats">
        <h2>抽卡统计：</h2>
        <p>总抽卡次数: {{ totalPulls }}</p>
        <ul>
          <li v-if="rarityCounts[RARITY.UR] > 0">限定: {{ rarityCounts[RARITY.UR] }} 次</li>
          <li v-if="rarityCounts[RARITY.SSR] > 0">SSR: {{ rarityCounts[RARITY.SSR] }} 次</li>
          <li v-if="rarityCounts[RARITY.SR] > 0">SR: {{ rarityCounts[RARITY.SR] }} 次</li>
          <li v-if="rarityCounts[RARITY.R] > 0">R: {{ rarityCounts[RARITY.R] }} 次</li>
        </ul>

        <h3>完整抽卡历史：</h3>
        <div class="gacha-history-list">
          <div v-for="(card, index) in paginatedGachaHistory" :key="card.id + '_' + card.name + '_' + index"
            :class="['history-item', `text-rarity-${card.rarity.toLowerCase()}`]">
            {{ card.name }} ({{ card.rarity === RARITY.UR ? '限定' : card.rarity }})
          </div>
          <p v-if="gachaHistory.length === 0">暂无抽卡历史。</p>
        </div>

        <div v-if="totalPages > 1" class="pagination-controls">
          <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        </div>
      </div>
    </template>

    <div v-if="showGachaResultOverlay" class="gacha-result-overlay">
      <h2>恭喜获得</h2>
      <div class="pulled-cards-container">
        <div v-for="card in lastPulledCards" :key="card.id + Math.random()"
          :class="['card-item', `rarity-${card.rarity.toLowerCase()}`]">
          <img :src="card.imageUrl || '/images/cards/1101.webp'" :alt="`${card.name}的立绘图`" class="card-image">
          <p class="card-name">{{ card.name }}</p>
        </div>
      </div>
      <button @click="confirmGachaResult" class="confirm-button">确定</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useGacha } from '@/utils/useGacha';
import * as RARITY from '@/data/rarity.js'
import { cardMap } from '@/data/cards';
import SwitchComponent from '@/components/SwitchComponent.vue';

const route = useRoute();
const poolId = computed(() => route.params.poolId);


const selectedUpCard = ref(null);
const useOldRate = ref(false); // 是否使用旧的抽卡概率

// 使用抽卡函数，传入当前卡池ID
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
} = useGacha(poolId.value, selectedUpCard, useOldRate); // 注意：这里必须传入 .value 属性

const isSelectableUpPool = computed(() => {
  return currentPool.value?.rules?.[RARITY.UR]?.SelectUpCards === true;
});

const isSelectableUpGroupPool = computed(() => {
  return currentPool.value?.rules?.[RARITY.SSR]?.SelectUpCardsGroup === true;
});

const selectableUpGroup = computed(() => {
  return currentPool.value?.rules?.[RARITY.SSR]?.UpGroups || [];
});

// 获取可选UP角色列表
const upCardDetails = computed(() => {
  if (!isSelectableUpPool.value) {
    return [];
  }
  const upCardIds = currentPool.value.rules.UR.UpCards || [];
  return upCardIds.map(id => cardMap.get(id)).filter(Boolean);
});

// 监听卡池数据，自动设置默认的UP角色
watch(currentPool, (newPool) => {
  if (newPool?.rules?.UR?.SelectUpCards && newPool.rules.UR.UpCards?.length > 0) {
    // 默认选择第一个UP角色
    selectedUpCard.value = newPool.rules.UR.UpCards[0];
  } else {
    selectedUpCard.value = null;
  }
  if (newPool && newPool.name) {
    document.title = `${newPool.name} - 盲盒派对小助手抽卡模拟器`;
  } else {
    document.title = '抽卡模拟器'; // 如果卡池不存在，显示默认标题
  }
}, { immediate: true }); // immediate确保组件加载时立即执行一次

// 选择UP按钮的方法
const selectUpCard = (cardId) => {
  selectedUpCard.value = cardId;
};

// 历史记录分页逻辑
const itemsPerPage = 7; // 每页显示7条记录
const currentPage = ref(1);   // 当前页码，默认为第一页

// 计算总页数
const totalPages = computed(() => {
  // 确保 gachaHistory.value 是一个数组
  if (!Array.isArray(gachaHistory.value)) {
    return 0;
  }
  return Math.ceil(gachaHistory.value.length / itemsPerPage);
});

// 计算当前页需要展示的抽卡记录
const paginatedGachaHistory = computed(() => {
  // 为了让最新抽到的卡片显示在第一页（即列表顶部），我们先反转 gachaHistory
  const reversedHistory = [...gachaHistory.value].reverse(); // 创建一个副本并反转

  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return reversedHistory.slice(start, end);
});

// 控制UP组的展开与收起
const isUpGroupExpanded = ref(true);
const toggleUpGroupExpansion = () => {
  isUpGroupExpanded.value = !isUpGroupExpanded.value;
};

// 跳转到上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// 跳转到下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// 当抽卡历史改变时，确保当前页码不会超出总页数
// 比如，如果用户在第5页，然后历史记录减少了，总页数变成了3页，
// 那么需要将 currentPage 重置为 3。
// 我们可以通过 watch 监听 totalPages 或 gachaHistory.length
watch(totalPulls, () => {
  // 如果当前页码大于总页数，将其设置为总页数
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value;
  } else if (totalPages.value === 0) { // 如果没有记录了
    currentPage.value = 1;
  }
}, { immediate: true }); // immediate: true 确保在组件挂载时也执行一次检查

const showGachaResultOverlay = ref(false); // 控制抽卡结果叠加层的显示与隐藏
// 处理单抽点击事件
const handleSinglePull = () => {
  performSinglePull(); // 执行抽卡逻辑
  showGachaResultOverlay.value = true; // 显示抽卡结果叠加层
};

// 处理十连抽点击事件
const handleTenPulls = () => {
  performTenPulls(); // 执行抽卡逻辑
  showGachaResultOverlay.value = true; // 显示抽卡结果叠加层
};

// 确认抽卡结果，隐藏叠加层
const confirmGachaResult = () => {
  showGachaResultOverlay.value = false; // 隐藏抽卡结果叠加层
};
</script>

<style scoped>
.gacha-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  position: relative;
  min-height: 100%;
  min-height: -webkit-fill-available;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  color: #333;
  font-size: 1.5em;
}

/* 按钮样式 */
.gacha-controls {
  margin-bottom: 10px;
}

.gacha-button,
.back-home-button,
.pagination-controls button,
.confirm-button {
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  font-weight: bold;
}

.gacha-button {
  padding: 12px 25px;
  margin: 0 10px;
  font-size: 1.1em;
  border: none;
  color: white;
}

.single-pull {
  background-color: #e110d0;
}

.single-pull:hover {
  background-color: #b610c2;
}

.ten-pull {
  background-color: rgb(230, 195, 0);
}

.ten-pull:hover {
  background-color: rgb(200, 170, 0);
}

.back-home-button {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border: none;
  font-size: 16px;
  font-weight: normal;
}

.back-home-button:hover {
  background-color: #0056b3;
}

/* 选择UP（组）组件样式 */
.select-up-container,
.select-up-group-container {
  margin: 25px 0;
  border-radius: 10px;
  padding: 20px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
}

.select-up-container {
  padding: 15px;
  background-color: rgba(0, 0, 0, 0.05);
  border: none;
}

.select-up-title,
.select-up-group-container h3 {
  font-weight: bold;
  margin: 0 0 15px 0;
  color: #333;
}

.select-up-group-container h3 {
  color: #007bff;
  margin-bottom: 20px;
}

.up-cards-selection,
.up-group-list {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.up-group-list {
  flex-wrap: wrap;
}

.up-card-option {
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  background-clip: padding-box;
  border: 4px solid transparent;
  transition: transform 0.2s ease, border-color 0.3s ease;
}

.up-card-option:hover {
  transform: scale(1.05);
}

.up-card-option.selected {
  transform: scale(1.1);
  box-shadow: 0 0 15px gold;
}

.up-card-image {
  width: 80px;
  height: 80px;
  display: block;
  border-radius: 4px;
}

.up-group-item {
  cursor: pointer;
  width: 320px;
  height: 140px;
  border: 2px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #eee;
}

.up-group-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.up-group-item.selected {
  border-color: #ff9100;
  box-shadow: 0 0 20px rgba(255, 145, 0, 0.8);
  transform: scale(1.02);
}

.up-group-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.up-group-item h4 {
  color: #333;
  font-size: 1.2em;
  text-align: center;
  padding: 10px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-up-group-container .collapsible-header {
  color: #007bff;
  margin-bottom: 20px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  transition: opacity 0.2s ease;
}

.select-up-group-container .collapsible-header:hover {
  opacity: 0.8;
}

.collapsible-header span {
  margin-right: 8px;
  width: 1em;
  display: inline-block;
  text-align: center;
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

/* 抽卡历史样式 */
.gacha-stats {
  margin-top: 50px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.gacha-stats ul {
  list-style: none;
  padding: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.gacha-stats li {
  font-weight: bold;
  color: #555;
}

.gacha-history-list {
  max-height: 250px;
  min-height: 230px;
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 10px;
  margin-top: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
  text-align: left;
}

.history-item {
  padding: 5px 0;
  border-bottom: 1px dashed #eee;
  font-size: 0.9em;
  color: #444;
}


.history-item:last-child {
  border-bottom: none;
}

.text-rarity-ur {
  color: #ff0000;
  font-weight: bold;
}

.text-rarity-ssr {
  color: #ff9100;
  font-weight: bold;
}

.text-rarity-sr {
  color: #cc00ff;
}

.text-rarity-r {
  color: #00ccff;
}

.pagination-controls {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination-controls button {
  padding: 8px 15px;
  border: 1px solid #007bff;
  background-color: #007bff;
  color: white;
  font-weight: normal;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-controls button:disabled {
  background-color: #cccccc;
  border-color: #cccccc;
  cursor: not-allowed;
}

.pagination-controls span {
  font-weight: bold;
  color: #333;
}

/* 抽卡结果叠加层样式 */
.gacha-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/images/gacha-bg.webp') center/cover no-repeat rgb(162, 37, 225);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
  padding: 20px;
  box-sizing: border-box;
}

.gacha-result-overlay h2 {
  color: #fff;
  margin: 1%;
  font-size: 2em;
}

.pulled-cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5vh 10vw;
  min-width: 400px;
  max-width: 85%;
  max-height: 80%;
  overflow-y: auto;
}

.card-item {
  background-color: #333;
  border: 1px solid #555;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  width: 120px;
  padding: 10px;
}

.card-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.card-name {
  font-weight: bold;
  margin: 5px;
  color: #ffffff;
}

.confirm-button {
  height: 2.5em;
  padding: 0 50px;
  margin-top: 30px;
  font-size: 1.5em;
  background-color: rgb(255, 215, 0);
  border: 2px solid #000000;
  border-radius: 1.25em;
  color: white;
}

.confirm-button:hover {
  background-color: rgb(240, 235, 143);
}

/* 稀有度颜色 */
/* TODO: 将所有颜色放在一个文件里管理，后续增加深色功能 */
.rarity-ur {
  background-color: #ff0000;
}

.rarity-ssr {
  background-color: #ff9100;
}

.rarity-sr {
  background-color: #cc00ff;
}

.rarity-r {
  background-color: #00ccff;
}

.rarity-border-ur {
  border-color: #ff4d4d;
}

.rarity-border-ssr {
  border-color: #ff9100;
}

.rarity-border-sr {
  border-color: #cc00ff;
}

.rarity-border-r {
  border-color: #00ccff;
}

.rarity-border-ur.selected {
  border-color: #ff0000;
}

.rarity-border-ssr.selected {
  border-color: #ffd700;
}

.rarity-border-sr.selected {
  border-color: #ff00ff;
}

.rarity-border-r.selected {
  border-color: #00ffff;
}
</style>

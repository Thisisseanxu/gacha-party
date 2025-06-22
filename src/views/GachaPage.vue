<template>
  <div class="gacha-page">
    <template v-if="!showGachaResultOverlay">
      <router-link to="/" class="back-link">返回主页</router-link>
      <h1>{{ currentPool ? currentPool.name : '未知卡池' }}</h1>

      <div v-if="currentPool" class="gacha-controls">
        <button @click="handleSinglePull" class="gacha-button single-pull">单抽</button>
        <button @click="handleTenPulls" class="gacha-button ten-pull">十连抽</button>
      </div>
      <p v-else>卡池加载中或不存在...</p>

      <div class="gacha-stats">
        <h2>抽卡统计：</h2>
        <p>总抽卡次数: {{ totalPulls }}</p>
        <ul>
          <li v-if="currentPool.hasUR">限定: {{ rarityCounts[RARITY.UR] }} 次</li>
          <li>SSR: {{ rarityCounts[RARITY.SSR] }} 次</li>
          <li>SR: {{ rarityCounts[RARITY.SR] }} 次</li>
          <li>R: {{ rarityCounts[RARITY.R] }} 次</li>
        </ul>

        <h3>完整抽卡历史：</h3>
        <div class="gacha-history-list">
          <div v-for="(card, index) in paginatedGachaHistory" :key="card.id + '_' + card.name + '_' + index"
            class="history-item">
            {{ card.name }} ({{ card.rarity }})
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
          <img :src="card.imageUrl || '/images/cards/1101.png'" :alt="`${card.name}的立绘图`" class="card-image">
          <p class="card-name">{{ card.name }}</p>
        </div>
      </div>
      <button @click="confirmGachaResult" class="confirm-button">确定</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useGacha } from '@/utils/useGacha';
import * as RARITY from '@/data/rarity.js'

const route = useRoute();
const poolId = computed(() => route.params.poolId);

// 使用抽卡函数，传入当前卡池ID
const {
  currentPool,
  gachaHistory,
  lastPulledCards,
  totalPulls,
  rarityCounts,
  performSinglePull,
  performTenPulls,
} = useGacha(poolId.value); // 注意：这里必须传入 .value 属性

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
import { watch } from 'vue';
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
  padding: 20px;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  min-height: 100%;
  min-height: -webkit-fill-available;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: #007bff;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

/* 现有 UI 元素，在叠加层显示时不展示 */
.back-link,
h2,
.gacha-controls,
.gacha-stats {
  transition: opacity 0.3s ease;
}

.gacha-controls {
  margin-bottom: 40px;
}

.gacha-button {
  padding: 12px 25px;
  margin: 0 10px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
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

/* 抽卡结果叠加层样式 */
.gacha-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/gacha-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: rgb(162, 37, 225);
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
  min-width: 400px;
  max-width: 85%;
  max-height: 80%;
  overflow-y: auto;
  gap: 5vh 10vw;
}

.card-item {
  background-color: #333;
  border: 1px solid #555;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  width: 120px;
  height: auto;
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
  padding: 0px 50px;
  font-size: 1.5em;
  font-weight: bold;
  position: relative;
  background-color: rgb(255, 215, 0);
  color: rgb(255, 255, 255);
  border: 2px solid #000000;
  border-radius: 1.25em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 30px;
  height: 2.5em;
}

.confirm-button:hover {
  background-color: rgb(240, 235, 143);
}

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
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 10px;
  margin-top: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
  text-align: left;
  min-height: 230px;
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

.pagination-controls {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination-controls button {
  padding: 8px 15px;
  border: 1px solid #007bff;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-controls button:disabled {
  background-color: #cccccc;
  border-color: #cccccc;
  cursor: not-allowed;
}

.pagination-controls button:not(:disabled):hover {
  background-color: #0056b3;
}

.pagination-controls span {
  font-weight: bold;
  color: #333;
}

/* 稀有度颜色 */
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
</style>

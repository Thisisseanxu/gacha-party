<template>
  <div class="simulator-page">
    <div class="simulator-container card">
      <h1 class="title">测试用抽卡模拟器</h1>

      <div class="config-item">
        <label for="pull-count">模拟抽卡次数:</label>
        <input id="pull-count" v-model.number="pullCount" type="number" min="1" placeholder="例如: 1000" />
      </div>

      <div class="advanced-config">
        <h2 class="config-title">高级配置</h2>
        <p class="config-description">
          请根据卡池规则手动输入ID。留空则表示不启用该项配置。
        </p>
        <div class="config-grid">
          <div class="config-item">
            <label for="pool-id">卡池ID:</label>
            <input id="pool-id" v-model.trim="poolIdInput" type="text" placeholder="例如: standard" />
          </div>

          <div class="config-item">
            <label for="up-group-id">UP组ID:</label>
            <input id="up-group-id" v-model.trim="upGroupIdInput" type="text" placeholder="例如: group_a" />
          </div>

          <div class="config-item">
            <label for="up-card-id">自选UP卡牌ID:</label>
            <input id="up-card-id" v-model.trim="upCardIdInput" type="text" placeholder="例如: 1001 (需要卡池支持)" />
          </div>
        </div>
      </div>

      <button class="simulate-button" @click="runSimulation" :disabled="isSimulating">
        {{ isSimulating ? '正在疯狂计算中...' : `开始模拟` }}
      </button>

      <div v-if="simulationResult" class="results-section">
        <h2 class="results-title">
          模拟结果 (池: {{ activePoolIdForDisplay }}, 共 {{ totalResultPulls }} 抽)
        </h2>
        <ul class="results-list">
          <li v-for="(count, rarity) in simulationResult" :key="rarity" :class="`rarity-text-${rarity}`">
            <span class="rarity-label">{{ rarity }}</span>
            <div class="bar-container">
              <div class="bar" :style="{ width: calculatePercentage(count) }"></div>
            </div>
            <span class="rarity-count">{{ count.toLocaleString() }} 张</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useGacha } from '@/utils/useGacha';
import { logger, setLogLevel } from '@/utils/logger.js';

// --- 输入框状态定义 ---
const pullCount = ref(1000);
const poolIdInput = ref('standard'); // 默认卡池ID
const upCardIdInput = ref('');      // 自选UP卡ID输入
const upGroupIdInput = ref('');     // UP组ID输入

// --- 模拟过程状态 ---
const isSimulating = ref(false);
const simulationResult = ref(null);
const activePoolIdForDisplay = ref(''); // 用于在结果中显示本次模拟实际使用的卡池ID

// --- 为 useGacha 准备响应式参数 ---
// 这些 ref 会被传入 useGacha，当它们变化时，useGacha 内部会自动响应
const reactivePoolId = ref(poolIdInput.value);
const reactiveUpCardId = computed(() => {
  // 将输入的字符串转为数字，如果输入为空则为 undefined
  const id = parseInt(upCardIdInput.value, 10);
  return isNaN(id) ? undefined : id;
});

// --- 初始化 Gacha Logic ---
// 传入响应式的卡池ID和UP卡ID
const {
  currentPool,
  setSelectedUpGroup,
  performMultiPulls,
} = useGacha(reactivePoolId, reactiveUpCardId);

// --- 计算属性 ---
const totalPullsInResult = computed(() => {
  if (!simulationResult.value) return 0;
  return Object.values(simulationResult.value).reduce((sum, count) => sum + count, 0);
});

const totalResultPulls = computed(() => {
  return totalPullsInResult.value.toLocaleString();
});

const calculatePercentage = (count) => {
  if (!totalPullsInResult.value) return '0%';
  const percentage = (count / totalPullsInResult.value) * 100;
  return `${percentage.toFixed(2)}%`;
};

// --- 核心方法 ---
const runSimulation = async () => {
  if (!pullCount.value || pullCount.value <= 0) {
    alert('请输入有效的抽卡次数！');
    return;
  }
  if (!poolIdInput.value) {
    alert('请输入卡池ID！');
    return;
  }

  isSimulating.value = true;
  simulationResult.value = null;

  // 更新将要传递给 useGacha 的状态
  reactivePoolId.value = poolIdInput.value;

  // 确保 reactivePoolId 在 useGacha 内部生效
  await nextTick();

  // 设置UP组（如果输入了ID且有这个规则）
  if (upGroupIdInput.value && upGroupIdInput.value.trim() !== '') {
    const availableGroups = currentPool.value?.rules?.SSR?.SelectUpCardsGroup || [];
    const groupToSet = availableGroups.find(g => g.id === upGroupIdInput.value);
    if (groupToSet) {
      setSelectedUpGroup(groupToSet);
      logger.log('模拟器: 已设置UP组 ->', groupToSet.name);
    } else {
      logger.warn(`模拟器: 在当前卡池中未找到ID为 "${upGroupIdInput.value}" 的UP组。`);
      // 如果找不到，则设置为第一个可用的UP组
      setSelectedUpGroup(currentPool.value?.rules?.SSR?.SelectUpCardsGroup[0] || null);
    }
  }

  // 确保 setSelectedUpGroup 的效果已在 useGacha 内部生效
  await nextTick();

  // 执行模拟
  // 使用 setTimeout 将耗时操作推迟到下一个事件循环，以确保UI能立即渲染
  setTimeout(() => {
    setLogLevel('warn'); // 设置日志级别避免日志输出影响性能
    activePoolIdForDisplay.value = reactivePoolId.value; // 记录本次模拟的卡池ID
    const results = performMultiPulls(pullCount.value);

    simulationResult.value = results;
    isSimulating.value = false;
  }, 50);
};
</script>

<style scoped>
.simulator-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  min-height: 80vh;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}

.card {
  background: #ffffff;
  border-radius: 8px;
  padding: 2rem 2.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
}

.title {
  text-align: center;
  color: #333;
  margin-top: 0;
  margin-bottom: 2rem;
}

.config-item {
  margin-bottom: 1rem;
}

.config-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.config-item input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dcdcdc;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.config-item input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.advanced-config {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.config-title {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.config-description {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.simulate-button {
  width: 100%;
  padding: 0.8rem 1rem;
  margin-top: 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
  background-color: #1890ff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s, opacity 0.3s;
}

.simulate-button:hover:not(:disabled) {
  background-color: #40a9ff;
}

.simulate-button:disabled {
  background-color: #b0b0b0;
  cursor: not-allowed;
  opacity: 0.7;
}

.results-section {
  margin-top: 2rem;
  border-top: 1px solid #f0f0f0;
  padding-top: 1.5rem;
}

.results-title {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}

.results-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.results-list li {
  display: grid;
  grid-template-columns: 50px 1fr 100px;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
}

.rarity-label {
  font-weight: bold;
}

.bar-container {
  width: 100%;
  background-color: #e9e9e9;
  border-radius: 4px;
  height: 20px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background-color: #1890ff;
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
  text-align: right;
  color: white;
  font-size: 0.8em;
  line-height: 20px;
  padding-right: 5px;
}

.rarity-count {
  text-align: right;
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
  color: #555;
}

/* 稀有度颜色 */
.rarity-text-UR {
  color: #d66b00;
}

.rarity-text-SSR {
  color: #d42c2a;
}

.rarity-text-SR {
  color: #a335ee;
}

.rarity-text-R {
  color: #0070dd;
}

.rarity-text-UR+.bar-container>.bar {
  background-color: #d66b00;
}

.rarity-text-SSR+.bar-container>.bar {
  background-color: #d42c2a;
}

.rarity-text-SR+.bar-container>.bar {
  background-color: #a335ee;
}

.rarity-text-R+.bar-container>.bar {
  background-color: #0070dd;
}
</style>

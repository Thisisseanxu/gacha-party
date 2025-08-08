<template>
  <div class="gacha-analysis-container">
    <div class="gacha-analysis-page">
      <button @click="emit('reset-view')" class="button">← 返回</button>

      <div>
        <div class="header-top-row">
          <SelectorComponent v-model="CurrentSelectedPool" :options="cardPoolOptions" option-text-key="name"
            option-value-key="id">
            <template #trigger>
              <div class="title-bar">
                <span>
                  {{ playerId }}-{{ CARDPOOLS_NAME_MAP[CurrentSelectedPool] }}
                </span>
              </div>
            </template>
          </SelectorComponent>

          <CustomPlayerTitle v-if="analysisForTitle"
            :titleMap="CurrentSelectedPool === 'Normal' ? NORMALPOOL_TITLE_MAP : LIMITPOOL_TITLE_MAP"
            :value="CurrentSelectedPool === 'Normal' ? analysisForTitle.avgPullsForSSR : analysisForTitle.avgPullsForSP" />
        </div>
        <div
          :class="{ 'total-pulls': true, 'highlight': CurrentSelectedPool !== 'Limited' && CurrentSelectedPool !== 'Normal' && CurrentSelectedPool !== '10000' }">
          {{
            CurrentSelectedPool === 'Normal' ? normalAnalysis.totalPulls :
              CurrentSelectedPool === '10000' ? Normal10000Analysis.totalPulls :
                singleAnalysis.totalPulls
          }} <span class="pulls-text">抽</span>
        </div>

        <div v-if="singleAnalysis.SinglePulls > 0" class="tertiary-text">{{ '该卡池抽取' +
          singleAnalysis.SinglePulls + '次'
        }}<br />
          抽数会计算到最终抽出限定的卡池中
        </div>
        <div class="pity-counters" v-if="CurrentSelectedPool !== '9'">
          <div class="history-item"
            :style="{ ...getHistoryItemStyle(CurrentSelectedPool === '10000' ? (Normal10000Analysis?.SP ?? 0) : (limitAnalysis?.SP ?? 0)), flex: '1' }"
            v-if="CurrentSelectedPool !== 'Normal'">
            <span>距上个限定 </span>
            <span class="pity-count">{{ CurrentSelectedPool === '10000' ? (Normal10000Analysis?.SP ?? 0) :
              (limitAnalysis?.SP ?? 0) }}</span>
          </div>
          <div class="history-item"
            :style="{ ...getHistoryItemStyle(CurrentSelectedPool === 'Normal' ? (normalAnalysis?.SSR ?? 0) : (CurrentSelectedPool === '10000' ? (Normal10000Analysis?.SSR ?? 0) : (limitAnalysis?.SSR ?? 0)), CurrentSelectedPool === 'Normal'), flex: '1' }">
            <span>距上个SSR</span>
            <span class="pity-count">{{
              CurrentSelectedPool === 'Normal' ? (normalAnalysis?.SSR ?? 0) :
                CurrentSelectedPool === '10000' ? (Normal10000Analysis?.SSR ?? 0) :
                  (limitAnalysis?.SSR ?? 0)
            }}</span>
          </div>
        </div>
        <div class="tertiary-text">{{ dateRange }}
        </div>
      </div>

      <div class="stats-overview">
        <div class="stat-box" v-if="CurrentSelectedPool === 'Normal'">
          <div class="stat-title">SSR数量</div>
          <div class="stat-value">{{ normalAnalysis.totalSSRs }}</div>
        </div>
        <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
          <div class="stat-title">限定平均</div>
          <div
            v-if="(CurrentSelectedPool === '10000' ? Normal10000Analysis?.avgPullsForSP : singleAnalysis?.avgPullsForSP) > 0"
            :class="{ 'stat-value': true, 'highlight': CurrentSelectedPool !== 'Limited' }">{{
              (CurrentSelectedPool === '10000' ? Normal10000Analysis.avgPullsForSP :
                singleAnalysis.avgPullsForSP).toFixed(2)
            }} 抽
          </div>
          <div v-else class="stat-value">暂无数据</div>
        </div>

        <div class="stat-vertical-layout" v-if="CurrentSelectedPool !== 'Normal'">
          <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
            <div v-if="(CurrentSelectedPool === '10000' ? Normal10000Analysis?.maxSP : singleAnalysis?.maxSP) > 0"
              :class="{ 'stat-value': true, 'highlight': CurrentSelectedPool !== 'Limited' }">最非 {{
                CurrentSelectedPool === '10000' ? Normal10000Analysis.maxSP : singleAnalysis.maxSP
              }} 抽
            </div>
            <div v-else class="stat-value">未抽到</div>
          </div>
          <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
            <div
              v-if="(CurrentSelectedPool === '10000' ? Normal10000Analysis?.minSP : singleAnalysis?.minSP) > 0 && (CurrentSelectedPool === '10000' ? Normal10000Analysis?.minSP : singleAnalysis?.minSP) !== Infinity"
              :class="{ 'stat-value': true, 'highlight': CurrentSelectedPool !== 'Limited' }">最欧 {{
                CurrentSelectedPool === '10000' ? Normal10000Analysis.minSP : singleAnalysis.minSP
              }} 抽
            </div>
            <div v-else class="stat-value">限定</div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-title">SSR平均</div>
          <div v-if="CurrentSelectedPool === 'Normal'" class="stat-value">
            {{ normalAnalysis.avgPullsForSSR > 0 ? normalAnalysis.avgPullsForSSR.toFixed(2) + ' 抽' : '暂无数据' }}
          </div>
          <div v-if="CurrentSelectedPool !== 'Normal'" class="stat-value">{{ (CurrentSelectedPool === '10000' ?
            Normal10000Analysis?.avgPullsForSSR : singleAnalysis?.avgPullsForSSR) > 0 ?
            (CurrentSelectedPool === '10000' ? Normal10000Analysis.avgPullsForSSR :
              singleAnalysis.avgPullsForSSR).toFixed(2) + ' 抽' : '暂无数据' }}</div>
        </div>
        <div class="stat-vertical-layout" v-if="CurrentSelectedPool === 'Normal'">
          <div class="stat-box" v-if="CurrentSelectedPool === 'Normal'">
            <div v-if="normalAnalysis.maxSSR > 0" class="stat-value">最非 {{ normalAnalysis.maxSSR }} 抽</div>
            <div v-else class="stat-value">未抽到</div>
          </div>
          <div class="stat-box" v-if="CurrentSelectedPool === 'Normal'">
            <div v-if="normalAnalysis.minSSR > 0 && normalAnalysis.minSSR !== Infinity" class="stat-value">最欧 {{
              normalAnalysis.minSSR }} 抽</div>
            <div v-else class="stat-value">SSR</div>
          </div>
        </div>
      </div>

      <div>
        <div class="history-nav">
          <button ref="progressBarButton" class="nav-button" :class="{ active: activeTab === 'progressBar' }"
            @click="activeTab = 'progressBar'">
            进度条
          </button>
          <button ref="characterOverviewButton" class="nav-button"
            :class="{ active: activeTab === 'characterOverview' }" @click="activeTab = 'characterOverview'">
            角色一览
          </button>
          <button ref="quantityStatisticsButton" class="nav-button"
            :class="{ active: activeTab === 'quantityStatistics' }" @click="activeTab = 'quantityStatistics'">
            数量统计
          </button>
          <div class="nav-underline" :style="underlineStyle"></div>
        </div>

        <!-- 进度条区域 -->
        <div v-if="activeTab === 'progressBar'" class="history-list" ref="historyListRef">
          <div
            v-for="(item, index) in (CurrentSelectedPool === 'Normal' ? normalAnalysis?.SSRHistory : (CurrentSelectedPool === '10000' ? Normal10000Analysis?.SPHistory : singleAnalysis?.SPHistory))"
            :key="index" class="history-item"
            :style="getHistoryItemStyle(item.count, CurrentSelectedPool === 'Normal')">
            <div class="char-info">
              <img :src="item.imageUrl" :alt="item.name" class="char-avatar">
              <span class="char-name">{{ item.name }}</span>
            </div>
            <div class="pull-info">
              <span class="pull-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- 角色一览区域 -->
        <div v-if="activeTab === 'characterOverview'" class="character-overview-list">
          <div
            v-for="(item, index) in (CurrentSelectedPool === 'Normal' ? normalAnalysis?.SSRHistory : (CurrentSelectedPool === '10000' ? Normal10000Analysis?.SPHistory : singleAnalysis?.SPHistory))"
            :key="index" class="overview-item"
            :style="{ backgroundColor: getAlphaBgWithCount(item.count, CurrentSelectedPool === 'Normal') }">
            <img :src="item.imageUrl" :alt="item.name" class="overview-avatar">
            <span class="overview-name">{{ item.name }}</span>
            <span class="overview-pull-count">{{ item.count }}</span>
          </div>
        </div>

        <!-- 数量统计区域 -->
        <div v-if="activeTab === 'quantityStatistics'" class="quantity-statistics-list">
          <div v-for="item in quantityStatistics" :key="item.id" class="quantity-item"
            :style="{ backgroundColor: getAlphaBgWith(item.rarity) }">
            <img :src="item.imageUrl" :alt="item.name" class="quantity-avatar">
            <span class="quantity-name">{{ item.name }}</span>
            <span class="quantity-pull-count">x {{ item.count }}</span>
          </div>
          <p v-if="quantityStatistics.length === 0" class="no-history-text full-width">暂无记录</p>
        </div>
      </div>

      <div class="full-history-section">
        <h3 class="section-title">{{ CARDPOOLS_NAME_MAP[CurrentSelectedPool] }}抽卡历史记录</h3>
        <div class="full-history-list">
          <div v-for="item in paginatedHistory" :key="item.gacha_id" :class="['full-history-item', item.rarity]">
            <div class="char-info">
              <img :src="item.imageUrl" :alt="item.name" class="char-avatar">
              <span class="char-name">{{ item.name }}</span>
            </div>
            <span :class="['rarity-' + item.rarity]">{{ item.date.slice(2) }}</span>
            <!-- 为了保证手机端能在一行内显示，将年份缩短为两位数 -->
          </div>
          <p v-if="fullHistory.length === 0" class="no-history-text">暂无抽卡历史。</p>
        </div>
        <div class="pagination-controls">
          <span class="items-per-page-label">每页显示</span>
          <SelectorComponent v-model="itemsPerPage" :options="[
            { number: 7, text: '7' },
            { number: 10, text: '10' },
            { number: 20, text: '20' },
          ]" option-text-key="number" option-value-key="number" style="min-width: 30px;">
            <template #trigger>
              <div class="selector-trigger">
                {{ itemsPerPage }}
              </div>
            </template>
          </SelectorComponent>
          <span class="items-per-page-label">条记录</span>
        </div>
        <div v-if="totalPages > 1" class="pagination-controls">
          <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
          <span>
            第
            <input type="number" id="LimitPageInput" class="page-input" v-model="pageInput" @keyup.enter="goToPage"
              @blur="goToPage" min="1" :max="totalPages" />
            页 / 共 {{ totalPages }} 页
          </span>
          <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        </div>
      </div>
      <div
        style="text-align: center; padding: 20px 0; display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <button @click="exportPoolData" class="button">导出{{ CARDPOOLS_NAME_MAP[CurrentSelectedPool]
          }}卡池记录 (Excel)</button>
        <button @click="downloadCompressedData" class="button">下载抽卡记录文件</button>
        <button v-if="isDev" @click="downloadDecompressedData" class="button">下载未压缩的文件[DEV]</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import pako from 'pako';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';

import { cardMap } from '@/data/cards.js';
import * as RARITY from '@/data/rarity.js';
import { colors } from '@/styles/colors.js';
import { logger } from '@/utils/logger.js';

import SelectorComponent from '@/components/SelectorComponent.vue';
import CustomPlayerTitle from '@/components/CustomPlayerTitle.vue';

// 接收传入的参数
const props = defineProps({
  limitGachaData: {
    type: Array,
    required: true,
  },
  normalGachaData: {
    type: Array,
    required: true,
  },
  advancedNormalGachaData: {
    type: Array,
    required: true,
  },
  playerId: {
    type: String,
    required: true,
  },
  jsonInput: {
    type: String,
    required: true,
  }
});

console.log(props)

// 绑定父组件的重置事件给返回按钮
const emit = defineEmits(['reset-view']);

// 卡池id和名称的映射
const CARDPOOLS_NAME_MAP = {
  'Normal': '常驻扭蛋',
  'Limited': '限定扭蛋',
  '9': '常驻扭蛋',
  '29': '车手盲盒机',
  '40': '塔菲扭蛋',
  '41': '童话国盲盒机',
  '42': '扭蛋大作战',
  '43': '早稻叽',
  '10000': '高级常驻扭蛋'
};
const LIMITED_CARD_POOLS_ID = ['29', '40', '41', '42', '43']; // 限定卡池的ID列表

// 抽数小于字典键值时显示对应称号
const LIMITPOOL_TITLE_MAP = {
  32: { title: '天选之子', text_color: 'rgb(255, 215, 0)', background: 'rgb(128, 0, 128)' },
  34.5: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  35.75: { title: '小欧皇', background: colors.colorOfLuck.low },
  37.5: { title: '平平无奇', background: colors.colorOfLuck.medium },
  39: { title: '小非酋', background: colors.colorOfLuck.high },
  41: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '艰难依旧坚持', background: colors.colorOfLuck.veryHigh },
};
const NORMALPOOL_TITLE_MAP = {
  10: { title: '天选之子', text_color: 'rgb(255, 215, 0)', background: 'rgb(128, 0, 128)' },
  11: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  11.75: { title: '小欧皇', background: colors.colorOfLuck.low },
  13: { title: '平平无奇', background: colors.colorOfLuck.medium },
  13.75: { title: '小非酋', background: colors.colorOfLuck.high },
  14.75: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '艰难依旧坚持', background: colors.colorOfLuck.veryHigh },
};

const CurrentSelectedPool = ref("Limited"); // 控制显示哪个卡池
// 合成下拉框的选项
const cardPoolOptions = ref([
  { id: 'Limited', name: CARDPOOLS_NAME_MAP['Limited'] }, // 限定卡池总览
  { id: '10000', name: CARDPOOLS_NAME_MAP['10000'] }, // 高级常驻卡池
  { id: 'Normal', name: CARDPOOLS_NAME_MAP['Normal'] }, // 常驻卡池
  ...LIMITED_CARD_POOLS_ID.map(id => ({ id, name: CARDPOOLS_NAME_MAP[id] })).reverse(), // 单卡池，反转以确保新的在上
]);

// 导航栏相关的响应式变量
const activeTab = ref('progressBar');
const progressBarButton = ref(null);
const quantityStatisticsButton = ref(null);
const characterOverviewButton = ref(null);
const underlineStyle = ref({});
// 检查是否为开发环境
const isDev = import.meta.env.DEV;

// 计算列表平均值的通用函数
const calculateAverage = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const getCardInfoAndRemovePrefix = (itemId) => {
  // id格式为15xxxx，而cardMap中没有15前缀，直接是xxxx，因此需要转换
  let cardId = itemId.startsWith('15') ? itemId.slice(2) : itemId; // 去掉前缀 "15"
  return cardMap.get(cardId) || null;
};

// 限定卡池分析逻辑
const limitAnalysis = computed(() => {
  // 仅当有有效数据时才执行计算
  if (props.limitGachaData.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  // 将数据改成从最久远到最近排序，方便计算抽数
  const records = [...props.limitGachaData].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  let SPCounter = 0, SSRCounter = 0;
  const SPHistory = [], SSRHistory = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }
    SPCounter++;
    SSRCounter++;
    if (cardInfo.rarity === RARITY.SP) {
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id });
      SSRCounter = 0;
    }
  });

  return {
    totalPulls: records.length,
    SP: SPCounter,
    SSR: SSRCounter,
    avgPullsForSP: calculateAverage(SPHistory.map(item => item.count)),
    avgPullsForSSR: calculateAverage(SSRHistory.map(item => item.count)),
    maxSP: Math.max(...SPHistory.map(item => item.count), 0),
    minSP: Math.min(...SPHistory.map(item => item.count), Infinity),
    SPHistory,
    SSRHistory,
    records,
  };
});

// 限定卡池单卡池分析逻辑
const singleAnalysis = computed(() => {
  if (!limitAnalysis.value) return null;
  if (LIMITED_CARD_POOLS_ID.includes(CurrentSelectedPool.value)) {
    // 如果选择了特定卡池，则只分析该卡池的记录，注意转换成数字
    const filteredSPHistory = limitAnalysis.value.SPHistory.filter(item => item.gacha_id === Number(CurrentSelectedPool.value));
    const filteredSSRHistory = limitAnalysis.value.SSRHistory.filter(item => item.gacha_id === Number(CurrentSelectedPool.value));
    return {
      totalPulls: filteredSPHistory.reduce((sum, item) => sum + item.count, 0),
      SinglePulls: fullHistory.value.length, // 这里问历史记录要一下单卡池的总抽数
      avgPullsForSP: calculateAverage(filteredSPHistory.map(item => item.count)),
      avgPullsForSSR: filteredSSRHistory.length > 0 ? fullHistory.value.length / filteredSSRHistory.length : 0, // SSR平均抽数改为总抽数除以SSR数量
      maxSP: Math.max(...filteredSPHistory.map(item => item.count), 0),
      minSP: Math.min(...filteredSPHistory.map(item => item.count), Infinity),
      SPHistory: filteredSPHistory,
      SSRHistory: filteredSSRHistory
    };
  }
  return { ...limitAnalysis.value }; // 如果选中的卡池不存在，则返回全部限定卡池的分析数据
});

// 高级常驻卡池分析逻辑
const Normal10000Analysis = computed(() => {
  // 仅当有有效数据时才执行计算
  if (props.advancedNormalGachaData.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  // 将数据改成从最久远到最近排序，方便计算抽数
  const records = [...props.advancedNormalGachaData].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  let SPCounter = 0, SSRCounter = 0;
  const SPHistory = [], SSRHistory = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`(高级常驻) 未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }
    SPCounter++;
    SSRCounter++;
    if (cardInfo.rarity === RARITY.SP) {
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id });
      SSRCounter = 0;
    }
  });

  return {
    totalPulls: records.length,
    SP: SPCounter,
    SSR: SSRCounter,
    avgPullsForSP: calculateAverage(SPHistory.map(item => item.count)),
    avgPullsForSSR: calculateAverage(SSRHistory.map(item => item.count)),
    maxSP: Math.max(...SPHistory.map(item => item.count), 0),
    minSP: Math.min(...SPHistory.map(item => item.count), Infinity),
    SPHistory,
    SSRHistory,
    records,
  };
});


// 常驻卡池分析逻辑
const normalAnalysis = computed(() => {
  if (props.normalGachaData.length === 0) return { totalPulls: 0, SSR: 0, avgPullsForSSR: 0, maxSSR: 0, minSSR: 0, SSRHistory: [], totalSSRs: 0 };
  const records = [...props.normalGachaData].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  let SSRCounter = 0;
  const SSRHistory = [], SSRPulls = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`(常驻池)未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }
    SSRCounter++;
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.unshift({ ...cardInfo, count: SSRCounter });
      SSRPulls.push(SSRCounter);
      SSRCounter = 0;
    }
  });

  return {
    totalPulls: records.length, SSR: SSRCounter,
    avgPullsForSSR: calculateAverage(SSRPulls),
    maxSSR: SSRPulls.length > 0 ? Math.max(...SSRPulls) : 0,
    minSSR: SSRPulls.length > 0 ? Math.min(...SSRPulls) : 0,
    SSRHistory, totalSSRs: SSRPulls.length,
  };
});

// 为称号组件提供数据
const analysisForTitle = computed(() => {
  if (CurrentSelectedPool.value === 'Normal') {
    return normalAnalysis.value?.avgPullsForSSR > 0 ? normalAnalysis.value : null;
  }
  if (CurrentSelectedPool.value === '10000') {
    return Normal10000Analysis.value?.avgPullsForSP > 0 ? Normal10000Analysis.value : null;
  }
  return singleAnalysis.value?.avgPullsForSP > 0 ? singleAnalysis.value : null;
});

/**
 * 根据抽数计算出金进度条背景样式
 * @param {object} count - 当前抽数
 * @param {boolean} isNormal - 是否为常驻池模式（常驻池出货概率阈值不同）
 * @returns {object} - 一个包含背景样式的对象
 */
const getHistoryItemStyle = (count, isNormal = false) => {
  const percentage = (count / 60) * 100;
  let progressBarColor;
  // 根据不同卡池和抽数应用不同颜色
  if ((isNormal && count < 10) || (!isNormal && count < 31)) progressBarColor = colors.colorOfLuck.veryLow;
  else if ((isNormal && count < 15) || (!isNormal && count < 41)) progressBarColor = colors.colorOfLuck.medium;
  else progressBarColor = colors.colorOfLuck.veryHigh;
  return { background: `linear-gradient(to right, ${progressBarColor} ${percentage}%, ${colors.colorOfLuck.background} ${percentage}%)` };
};

// 数量统计计算逻辑
const quantityStatistics = computed(() => {
  // 辅助函数：用于从历史记录中生成统计数据
  const generateStats = (history, rarity) => {
    if (!history || history.length === 0) return [];
    const stats = new Map();
    history.forEach(item => {
      const existing = stats.get(item.id);
      if (existing) existing.count++;
      else stats.set(item.id, { ...item, rarity, count: 1 });
    });
    // 将 Map 转换为数组并按角色id排序
    return Array.from(stats.values()).sort((a, b) => a.id - b.id);
  };

  const pool = CurrentSelectedPool.value;
  // 如果是常驻池则直接返回SSR统计

  if (pool === 'Normal') {
    return generateStats(normalAnalysis.value?.SSRHistory, RARITY.SSR);
  }
  if (pool === '10000') {
    const spStats = generateStats(Normal10000Analysis.value?.SPHistory, RARITY.SP);
    const ssrStats = generateStats(Normal10000Analysis.value?.SSRHistory, RARITY.SSR);
    return [...spStats, ...ssrStats];
  }
  // 默认处理所有其他限定池
  const spStats = generateStats(singleAnalysis.value?.SPHistory, RARITY.SP);
  const ssrStats = generateStats(singleAnalysis.value?.SSRHistory, RARITY.SSR);
  // 合并列表，SP在前，SSR在后
  return [...spStats, ...ssrStats];
});


// 动态下划线核心逻辑
const updateUnderline = () => {
  const buttons = {
    progressBar: progressBarButton.value,
    characterOverview: characterOverviewButton.value,
    quantityStatistics: quantityStatisticsButton.value,
  };
  const activeButton = buttons[activeTab.value];
  if (activeButton) {
    underlineStyle.value = {
      left: `${activeButton.offsetLeft}px`,
      width: `${activeButton.offsetWidth}px`,
    };
  }
};

watch(activeTab, async () => {
  // 等待DOM更新完成再计算位置
  await nextTick();
  updateUnderline();
});

onMounted(() => {
  nextTick(updateUnderline);
  window.addEventListener('resize', updateUnderline);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateUnderline);
});

// 根据传入的参数获取对应的修改过透明度的背景颜色
const getAlphaBgWith = (type) => {
  const colorMap = {
    [RARITY.SP]: colors.rarity.sp, [RARITY.SSR]: colors.rarity.ssr,
    [RARITY.SR]: colors.rarity.sr, [RARITY.R]: colors.rarity.r,
    "veryHigh": colors.colorOfLuck.veryHigh, "medium": colors.colorOfLuck.medium,
    "veryLow": colors.colorOfLuck.veryLow,
  };
  return (colorMap[type] || 'transparent').replace(/[\d.]+\)$/g, '0.3)');
};

const getAlphaBgWithCount = (count, isNormal = false) => {
  // 根据抽数和卡池类型返回不同的背景颜色
  if (isNormal) {
    if (count < 10) return getAlphaBgWith("veryLow");
    if (count < 15) return getAlphaBgWith("medium");
    return getAlphaBgWith("veryHigh");
  } else {
    if (count < 31) return getAlphaBgWith("veryLow");
    if (count < 41) return getAlphaBgWith("medium");
    return getAlphaBgWith("veryHigh");
  }
};

// 历史记录分页逻辑
const currentPage = ref(1);
const itemsPerPage = ref(10);
const pageInput = ref(1);

const fullHistory = computed(() => {
  let data = [];
  if (CurrentSelectedPool.value === 'Normal') {
    data = [...props.normalGachaData];
  } else if (CurrentSelectedPool.value === '10000') {
    data = [...props.advancedNormalGachaData];
  } else {
    data = [...props.limitGachaData];
    if (CurrentSelectedPool.value !== 'Limited') {
      data = data.filter(r => r.gacha_id === Number(CurrentSelectedPool.value));
    }
  }
  return data.sort((a, b) => b.created_at - a.created_at || b.id - a.id).map(record => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    const defaultCard = { name: `未知角色 (${record.item_id})`, rarity: RARITY.R, imageUrl: '/images/cards/placeholder.webp' };
    const createdAt = new Date(record.created_at * 1000);
    const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, '0')}/${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}:${String(createdAt.getSeconds()).padStart(2, '0')}`;
    return { ...(cardInfo || defaultCard), gacha_id: record.id, created_at: record.created_at, date: formattedDate };
  });
});

// 计算当前卡池最早和最新的抽卡记录的时间范围
const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.') : '';
const dateRange = computed(() => {
  if (fullHistory.value.length === 0) return '';
  const startDate = formatDate(fullHistory.value[fullHistory.value.length - 1]?.created_at);
  const endDate = formatDate(fullHistory.value[0]?.created_at);
  return `${startDate} - ${endDate}`;
});

const totalPages = computed(() => Math.ceil(fullHistory.value.length / itemsPerPage.value));
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return fullHistory.value.slice(start, start + itemsPerPage.value);
});

// 跳转页面的函数
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const goToPage = () => {
  const page = Math.floor(Number(pageInput.value));
  currentPage.value = (page >= 1 && page <= totalPages.value) ? page : currentPage.value;
  pageInput.value = currentPage.value;
};

// 监听限定卡池选择变化，重置页码为1
watch(CurrentSelectedPool, () => { currentPage.value = 1; });
// 监听 currentPage 的变化，同步更新输入框的值
watch(currentPage, (newPage) => { pageInput.value = newPage; });
// 监听 itemsPerPage 的变化，重置页码为1
watch(itemsPerPage, () => {
  currentPage.value = 1;
  // 更新最小高度以适应新的每页条数
  nextTick(() => {
    const listEl = document.querySelector('.full-history-list');
    if (listEl) listEl.style.minHeight = `${itemsPerPage.value * 64}px`;
  });
});

// 将 'rgba(r, g, b, a)' 格式的颜色字符串转换为 'AARRGGBB'
const getExcelColor = (rgbaColor) => {
  // 使用正则表达式从 'rgba(r, g, b, a)' 中提取出 r, g, b, a 的值
  const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)/);
  if (!match) return 'FF000000';
  const toHex = c => Number(c).toString(16).padStart(2, '0'); // 将数字转换为十六进制
  return `${toHex(Math.round(parseFloat(match[4]) * 255))}${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`.toUpperCase();
};

// 下载压缩后的JSON源数据
const downloadCompressedData = () => {
  if (!props.jsonInput.trim()) return alert('没有可供下载的数据。');
  try {
    // 如果数据已经是压缩格式，直接下载
    const parsed = JSON.parse(props.jsonInput);
    if (parsed && parsed.compressed) {
      const blob = new Blob([props.jsonInput], { type: 'application/json;charset=utf-8' });
      return FileSaver.saveAs(blob, `抽卡记录-${props.playerId || 'data'}.json`);
    }
    // 如果不是，则进行压缩
    const gzipped = pako.gzip(JSON.stringify(parsed));
    const base64Data = btoa(String.fromCharCode.apply(null, gzipped));
    const output = { compressed: true, data: base64Data };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `抽卡记录-${props.playerId || 'data'}.json`);
  } catch (e) {
    alert(`处理数据时出错: ${e.message}`);
  }
};

// (仅开发环境) 下载解压后的JSON源数据
const downloadDecompressedData = () => {
  if (!props.jsonInput.trim()) return alert('没有可供下载的数据。');
  try {
    let finalData;
    const parsed = JSON.parse(props.jsonInput);
    // 如果是压缩格式，则解压
    if (parsed && parsed.compressed) {
      const binaryString = atob(parsed.data);
      const bytes = new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i));
      finalData = JSON.parse(pako.inflate(bytes, { to: 'string' }));
    } else {
      finalData = parsed;
    }
    // 格式化JSON并创建下载链接
    const blob = new Blob([JSON.stringify(finalData, null, 3)], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `未压缩的抽卡记录-${props.playerId || 'data'}.json`);
  } catch (e) {
    alert(`处理或解析数据时出错: ${e.message}`);
  }
};

// 将抽卡记录导出为 Excel 文件
const exportToExcel = async (filename, historyData) => {
  if (historyData.length === 0) return alert('没有数据可供导出。');
  // 创建工作簿和工作表
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('抽卡记录');
  // 设置表头和列宽
  worksheet.columns = [
    { header: '序号', key: 'id', width: 10 }, { header: '角色名称', key: 'name', width: 25 },
    { header: '稀有度', key: 'rarity', width: 10 }, { header: '抽到时间', key: 'date', width: 35 }
  ];
  // 设置表头样式
  worksheet.getRow(1).font = { bold: true, name: '黑体', size: 14 }; // 首选无衬线字体
  // 定义不同稀有度的样式
  const rarityStyles = {
    SP: { font: { color: { argb: getExcelColor(colors.rarity.sp) }, bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: getExcelColor(colors.brand.hover) } } },
    SSR: { font: { color: { argb: getExcelColor(colors.rarity.ssr) }, bold: true } },
    SR: { font: { color: { argb: getExcelColor(colors.rarity.sr) } } },
    R: { font: { color: { argb: getExcelColor(colors.rarity.r) } } },
  };
  // 遍历数据并添加行，同时应用样式，同时加上序号，最旧的数据为1，最新的数据为最大值
  historyData.forEach((item, i) => {
    const style = rarityStyles[item.rarity] || { font: { color: { argb: getExcelColor(colors.text.primary) } } }; // 根据稀有度选择样式
    const row = worksheet.addRow({ id: historyData.length - i, ...item });
    row.eachCell(cell => cell.style = { ...style, font: { ...style.font, name: '黑体', size: 14 } }); // 首选无衬线字体
  });
  // 设置冻结首行和自动筛选
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = { from: 'A1', to: { row: 1, column: worksheet.columns.length } };
  // 生成文件并使用 FileSaver.js 来保存文件
  const buffer = await workbook.xlsx.writeBuffer();
  FileSaver.saveAs(new Blob([buffer]), filename);
};

// 触发导出抽卡记录的函数
const exportPoolData = () => {
  exportToExcel('盲盒派对' + CARDPOOLS_NAME_MAP[CurrentSelectedPool.value] + '抽卡记录.xlsx', fullHistory.value);
};
</script>

<style scoped>
.gacha-analysis-container {
  background-color: v-bind('colors.background.content');
  padding: 15px;
  margin: 10px;
  min-width: 300px;
  width: 500px;
  border-radius: 12px;
}

.gacha-analysis-page>div:not(:first-child) {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid v-bind('colors.background.light');
}

.button {
  background-color: v-bind('colors.background.lighter');
  color: v-bind('colors.text.light');
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.button:hover {
  background-color: v-bind('colors.background.hover');
}


.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.title-bar {
  display: flex;
  justify-content: flex-start;
  font-size: 1rem;
  font-weight: bold;
}

.total-pulls {
  font-size: 3.5rem;
  font-weight: bold;
  letter-spacing: -2px;
}

.highlight {
  color: v-bind('colors.text.highlight');
}

.highlight:visited {
  color: v-bind('colors.text.highlight');
}

.pulls-text {
  font-size: 1rem;
  font-weight: normal;
  margin-left: 8px;
}

.pity-counters {
  display: flex;
  gap: 20px;
  border-radius: 8px;
}

.pity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: v-bind('colors.text.secondary');
}

.pity-count {
  font-weight: bold;
  font-size: 1.2rem;
  color: v-bind('colors.text.highlight');
}

.tertiary-text {
  margin-top: 10px;
  color: v-bind('colors.text.tertiary');
  font-size: 0.9rem;
}

.stats-overview {
  display: flex;
  flex-direction: row;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.stat-vertical-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 5px;
}

.stat-box {
  background-color: v-bind('colors.background.light');
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 5px 0px;
}

.stat-box .stat-title {
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
}

.stat-box .stat-value {
  font-size: 1.1rem;
  font-weight: bold;
}

.history-nav {
  position: relative;
  display: flex;
  justify-content: center;
  border-bottom: 2px solid v-bind('colors.background.lighter');
  margin-bottom: 6px;
}

.nav-button {
  background-color: transparent;
  border: none;
  padding: 4px 20px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  color: v-bind('colors.text.secondary');
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
  border-radius: 8px 8px 0 0;
}

.nav-button:hover {
  color: v-bind('colors.text.primary');
  background-color: v-bind('colors.background.hover');
}

.nav-button.active {
  color: v-bind('colors.brand.primary');
  background-color: transparent;
}

.nav-underline {
  position: absolute;
  bottom: -2px;
  height: 3px;
  background-color: v-bind('colors.brand.primary');
  border-radius: 1.5px;
  transition: left 0.3s ease-in-out, width 0.3s ease-in-out;
}

.history-list,
.quantity-statistics-list,
.character-overview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: v-bind('colors.scrollbar') transparent;
  transition: scrollbar-color 0.5s ease-out;
}

.quantity-statistics-list,
.character-overview-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, 72px);
  gap: 6px;
  justify-content: center;
}

.history-list::-webkit-scrollbar,
.quantity-statistics-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track,
.quantity-statistics-list::-webkit-scrollbar-track {
  background: transparent;
}

.history-list::-webkit-scrollbar-thumb,
.quantity-statistics-list::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.scrollbar');
  border-radius: 3px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  position: relative;
  z-index: 1;
}

.quantity-item,
.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3px 0px 0px 0px;
  border-radius: 6px;
  text-align: center;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 72px;
}

.quantity-item:hover,
.overview-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.quantity-avatar,
.overview-avatar {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  margin-bottom: 4px;
  background-color: v-bind('colors.background.avatar');
}

.quantity-name,
.overview-name {
  font-weight: bold;
  font-size: 0.7rem;
  color: v-bind('colors.text.primary');
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quantity-pull-count,
.overview-pull-count {
  font-size: 1rem;
  font-weight: bold;
  color: v-bind('colors.text.highlight');
}

.no-history-text.full-width {
  grid-column: 1 / -1;
}

.char-info {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.char-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: v-bind('colors.background.avatar');
  object-fit: cover;
  position: relative;
  z-index: 2;
}

.char-name {
  font-weight: bold;
  text-shadow: 1px 1px 3px v-bind('colors.textShadow');
}

.pull-info {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.pull-count {
  font-size: 1.2rem;
  font-weight: bold;
  color: v-bind('colors.brand.primary');
  text-align: right;
  text-shadow: 1px 1px 3px v-bind('colors.textShadow');
}

.full-history-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid v-bind('colors.background.lighter');
}

.section-title {
  font-size: 1.1rem;
  color: v-bind('colors.text.secondary');
  margin-bottom: 16px;
}

.full-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 640px;
}

.no-history-text {
  color: v-bind('colors.text.tertiary');
  text-align: center;
  padding: 20px 0;
}

.full-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: v-bind('colors.background.light');
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 4px solid transparent;
}

.full-history-item.SP {
  border-left-color: v-bind('colors.rarity.sp');
}

.full-history-item.SSR {
  border-left-color: v-bind('colors.rarity.ssr');
}

.full-history-item.SR {
  border-left-color: v-bind('colors.rarity.sr');
}

.full-history-item.R {
  border-left-color: v-bind('colors.rarity.r');
}

.rarity-SP {
  color: v-bind('colors.rarity.sp');
  font-weight: bold;
}

.rarity-SSR {
  color: v-bind('colors.rarity.ssr');
  font-weight: bold;
}

.rarity-SR {
  color: v-bind('colors.rarity.sr');
  font-weight: bold;
}

.rarity-R {
  color: v-bind('colors.rarity.r');
  font-weight: bold;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
  margin-top: 8px;
}

.pagination-controls span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  width: 50px;
  padding: 4px;
  text-align: center;
  background-color: v-bind('colors.background.light');
  color: v-bind('colors.text.primary');
  border: 1px solid v-bind('colors.background.lighter');
  border-radius: 4px;
  font-size: inherit;
}

.page-input:focus {
  outline: none;
  border-color: v-bind('colors.brand.primary');
}

.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.pagination-controls button {
  background-color: v-bind('colors.background.lighter');
  color: v-bind('colors.text.light');
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: v-bind('colors.background.hover');
}

.pagination-controls button:disabled {
  background-color: v-bind('colors.background.light');
  color: v-bind('colors.text.disabled');
  cursor: not-allowed;
}
</style>

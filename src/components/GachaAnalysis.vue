<template>
  <div class="gacha-analysis-container">
    <div class="gacha-analysis-page">
      <div class="gacha-analysis-button-container">
        <button @click="emit('reset-view')" class="button">
          <ArrowLeft size="20" /> 返回
        </button>
        <button @click="startReviewAnimation" class="button"
          v-if="!isSinglePool && CurrentSelectedPool !== 'AllLimited'">
          <template v-if="!isReviewing">
            <History size="20" /> 回顾
          </template>
          <template v-else>
            <Square size="20" /> 停止回顾
          </template>
        </button>
        <button @click="shareAnalysisImage" class="button" v-if="!isReviewing">
          <Share size="20" /> 分享
        </button>
        <button @click="switchReviewSpeed" class="button" v-if="isReviewing">
          {{ reviewSpeedText }}
        </button>
      </div>

      <div ref="analysisContentRef" class="analysis-content-wrapper">
        <div class="analysis-section">
          <span class="tertiary-text">{{ dateRange }} UID: {{ playerId }}</span>
          <div class="header-top-row">
            <div class="selector-wrapper">
              <SelectorComponent v-model="CurrentSelectedPool" :options="cardPoolOptions" collapsible
                option-text-key="name" option-value-key="id" :disabled="isReviewing" style="min-width: 10.9rem;">
                <!-- 9字*1.1+1间距 -->
                <template #trigger>
                  <div class="title-bar">
                    <span>
                      {{ CARDPOOLS_NAME_MAP[CurrentSelectedPool] }}
                    </span>
                  </div>
                </template>
              </SelectorComponent>
              <Transition name="fade">
                <div v-if="showPoolHint" class="pool-hint-bubble">
                  ↑点击这里可以切换不同的卡池
                </div>
              </Transition>
            </div>

            <CustomPlayerTitle v-if="analysisForTitle"
              :titleMap="CurrentSelectedPool === 'Normal' ? NORMALPOOL_TITLE_MAP : LIMITPOOL_TITLE_MAP"
              :value="CurrentSelectedPool === 'Normal' ? analysisForTitle.avgPullsForSSR : analysisForTitle.avgPullsForSP" />
          </div>
          <div :class="{ 'total-pulls': true, 'highlight': isSinglePool }">
            {{
              CurrentSelectedPoolAnalysis?.totalPulls ?? 0
            }} <span class="pulls-text">抽</span>
          </div>

          <div v-if="singleLimitAnalysis.SinglePulls > 0" class="tertiary-text">{{ '该卡池抽取' +
            singleLimitAnalysis.SinglePulls + '次'
          }}<br />
            抽数会计算到最终抽出限定的卡池中
          </div>
          <div class="pity-counters" v-if="!isSinglePool && CurrentSelectedPool !== 'AllLimited'">
            <div class="history-item"
              :style="{ ...getHistoryItemStyle(CurrentSelectedPoolAnalysis?.SP ?? 0), flex: '1' }"
              v-if="CurrentSelectedPool !== 'Normal'">
              <span>距上个限定 </span>
              <span class="pity-count">{{ CurrentSelectedPoolAnalysis?.SP ?? 0 }}</span>
            </div>
            <div class="history-item"
              :style="{ ...getHistoryItemStyle(CurrentSelectedPool === 'Normal' ? (normalAnalysis?.SSR ?? 0) : CurrentSelectedPoolAnalysis?.SSR ?? 0, CurrentSelectedPool === 'Normal'), flex: '1' }">
              <span>距上个SSR</span>
              <span class="pity-count">{{
                CurrentSelectedPoolAnalysis?.SSR ?? 0
                }}</span>
            </div>
          </div>
        </div>
        <div class="analysis-section">
          <div class="tabs" v-if="CurrentSelectedPool !== 'AllLimited'">
            <button ref="dataStatsButton" class="nav-button" :class="{ active: statsActiveTab === 'dataStats' }"
              @click="statsActiveTab = 'dataStats'">
              数据统计
            </button>
            <button ref="percentageAnalysisButton" class="nav-button"
              :class="{ active: statsActiveTab === 'percentageAnalysis' }"
              @click="statsActiveTab = 'percentageAnalysis'">
              占比分析
            </button>
            <div class="nav-underline" :style="statsUnderlineStyle"></div>
          </div>

          <div v-if="statsActiveTab === 'dataStats'" class="stats-overview">
            <div class="stat-box" v-if="CurrentSelectedPool === 'Normal'">
              <div class="stat-title">SSR数量</div>
              <div class="stat-value">{{ normalAnalysis.totalSSRs }}</div>
            </div>
            <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
              <div class="stat-title">限定平均</div>
              <div v-if="CurrentSelectedPoolAnalysis?.avgPullsForSP > 0"
                :class="{ 'stat-value': true, 'highlight': isSinglePool }">{{
                  CurrentSelectedPoolAnalysis?.avgPullsForSP.toFixed(2)
                }} 抽
              </div>
              <div v-else class="stat-value">暂无数据</div>
            </div>

            <div class="stat-vertical-layout" v-if="CurrentSelectedPool !== 'Normal'">
              <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
                <div v-if="CurrentSelectedPoolAnalysis?.maxSP > 0"
                  :class="{ 'stat-value': true, 'highlight': isSinglePool }">
                  最非
                  {{
                    CurrentSelectedPoolAnalysis?.maxSP
                  }} 抽
                </div>
                <div v-else class="stat-value">未抽到</div>
              </div>
              <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
                <div v-if="CurrentSelectedPoolAnalysis?.minSP > 0 && CurrentSelectedPoolAnalysis?.minSP !== Infinity"
                  :class="{ 'stat-value': true, 'highlight': isSinglePool }">最欧 {{
                    CurrentSelectedPoolAnalysis?.minSP
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
              <div v-if="CurrentSelectedPool !== 'Normal'" class="stat-value">{{
                CurrentSelectedPoolAnalysis?.avgPullsForSSR
                  > 0 ?
                  CurrentSelectedPoolAnalysis.avgPullsForSSR.toFixed(2) + ' 抽' : '暂无数据' }}</div>
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
          <div v-if="statsActiveTab === 'percentageAnalysis'" class="percentage-analysis-container">
            <div v-if="CurrentSelectedPoolAnalysis?.totalPulls ?? 0 > 0" class="pie-chart-wrapper">
              <PieChart :chart-data="pieChartJSData" />
            </div>
            <p v-else class="no - history - text">
              暂无数据
            </p>
          </div>
        </div>
        <div class="analysis-section">
          <div class="tabs">
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
              v-for="(item, index) in (CurrentSelectedPool === 'Normal' ? normalAnalysis?.SSRHistory : CurrentSelectedPoolAnalysis?.SPHistory)"
              :key="index" class="history-item-bar"
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
              v-for="(item, index) in (CurrentSelectedPool === 'Normal' ? normalAnalysis?.SSRHistory : CurrentSelectedPoolAnalysis?.SPHistory)"
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
      </div>

      <div class="full-history-section" v-if="CurrentSelectedPool !== 'AllLimited'">
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
import html2canvas from 'html2canvas';
import { ArrowLeft, History, Share, Square } from '@icon-park/vue-next';

import { cardMap } from '@/data/cards.js';
import * as RARITY from '@/data/rarity.js';
import { colors } from '@/styles/colors.js';
import { logger } from '@/utils/logger.js';

import SelectorComponent from '@/components/SelectorComponent.vue';
import CustomPlayerTitle from '@/components/CustomPlayerTitle.vue';
import PieChart from './AnalysisPieChart.vue';

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
  qiYuanGachaData: {
    type: Array,
    required: true,
  },
  wishGachaData: {
    type: Array,
    required: true,
  },
  eventGachaData: {
    type: Array,
    required: true,
  },
  fukeGachaData: {
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
  },
  LIMITED_CARD_POOLS_ID: {
    type: Array,
  },
  EVENT_CARD_POOLS_ID: {
    type: Array,
  },
  FUKE_CARD_POOLS_ID: {
    type: Array,
  },
  CARDPOOLS_NAME_MAP: {
    type: Object,
  }
});

// 绑定父组件的重置事件给返回按钮
const emit = defineEmits(['reset-view']);

// 用于截图的ref
const analysisContentRef = ref(null);


const CARDPOOLS_NAME_MAP = {
  ...props.CARDPOOLS_NAME_MAP,
  'AllLimited': '所有卡池总览',
  'Normal': '常驻扭蛋',
  'Limited': '限定扭蛋总览',
  'Event': '联动扭蛋总览',
  'Fuke': '复刻扭蛋总览',
  'AdvanceNormal': '高级常驻扭蛋',
  'QiYuan': '祈愿盲盒',
  'Wish': '心愿自选',
};

// 抽数小于字典键值时显示对应称号
const LIMITPOOL_TITLE_MAP = {
  32: { title: '天选之子', text_color: 'rgb(255, 215, 0)', background: 'rgb(128, 0, 128)' },
  34.5: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  35.75: { title: '小欧皇', background: colors.colorOfLuck.low },
  37.5: { title: '平平无奇', background: colors.colorOfLuck.medium },
  39: { title: '小非酋', background: colors.colorOfLuck.high },
  41: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '艰难依旧坚持', background: colors.colorOfLuck.veryHigh },
}; // 区间：0-32，32-34.5，34.5-35.75，35.75-37.5，37.5-39，39-41，41+
const NORMALPOOL_TITLE_MAP = {
  8.75: { title: '天选之子', text_color: 'rgb(255, 215, 0)', background: 'rgb(128, 0, 128)' },
  9.75: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  10.5: { title: '小欧皇', background: colors.colorOfLuck.low },
  11.5: { title: '平平无奇', background: colors.colorOfLuck.medium },
  12.25: { title: '小非酋', background: colors.colorOfLuck.high },
  13.25: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '艰难依旧坚持', background: colors.colorOfLuck.veryHigh },
}; // 区间：0-8.75，8.75-9.75，9.75-10.5，10.5-11.5，11.5-12.25，12.25-13.25，13.25+

const CurrentSelectedPool = ref("Limited"); // 控制显示哪个卡池
// 合成下拉框的选项，并进行分组
const cardPoolOptions = ref([
  // 默认展开的顶级选项
  { id: 'AllLimited', name: CARDPOOLS_NAME_MAP['AllLimited'] },
  { id: 'Limited', name: CARDPOOLS_NAME_MAP['Limited'] },
  { id: 'Event', name: CARDPOOLS_NAME_MAP['Event'] },
  { id: 'Fuke', name: CARDPOOLS_NAME_MAP['Fuke'] },
  { id: 'Normal', name: CARDPOOLS_NAME_MAP['Normal'] }, // 常驻
  { id: 'AdvanceNormal', name: CARDPOOLS_NAME_MAP['AdvanceNormal'] }, // 高级常驻
  { id: 'Wish', name: CARDPOOLS_NAME_MAP['Wish'] }, // 心愿自选卡池
  // 可折叠的分组
  { id: '---', name: '限定扭蛋机' }, // 分隔符
  ...props.LIMITED_CARD_POOLS_ID.map(id => ({ id, name: CARDPOOLS_NAME_MAP[id] })).reverse(), // 单卡池，反转以确保新的在上
  { id: '---', name: '联动扭蛋机' }, // 分隔符
  ...props.EVENT_CARD_POOLS_ID.map(id => ({ id, name: CARDPOOLS_NAME_MAP[id] })).reverse(), // 联动单卡池
  { id: '---', name: '复刻扭蛋机' }, // 分隔符
  ...props.FUKE_CARD_POOLS_ID.map(id => ({ id, name: CARDPOOLS_NAME_MAP[id] })).reverse(), // 复刻单卡池
  { id: '---', name: '其他扭蛋机' }, // 分隔符
  { id: 'QiYuan', name: CARDPOOLS_NAME_MAP['QiYuan'] }, // 祈愿盲盒卡池
]);

// 删除抽数为0的卡池
cardPoolOptions.value = cardPoolOptions.value.filter(option => {
  if (option.id === 'AllLimited') {
    return [...props.limitGachaData, ...props.eventGachaData, ...props.fukeGachaData, ...props.qiYuanGachaData, ...props.wishGachaData].length > 0;
  }
  if (option.id === 'Limited') {
    return props.limitGachaData.length > 0;
  }
  if (option.id === 'Event') {
    return props.eventGachaData.length > 0;
  }
  if (option.id === 'Fuke') {
    return props.fukeGachaData.length > 0;
  }
  if (option.id === 'Normal') {
    return props.normalGachaData.length > 0;
  }
  if (option.id === 'AdvanceNormal') {
    return props.advancedNormalGachaData.length > 0;
  }
  if (option.id === 'QiYuan') {
    return props.qiYuanGachaData.length > 0;
  }
  if (option.id === 'Wish') {
    return props.wishGachaData.length > 0;
  }
  if (option.id === '---') {
    return true; // 保留分隔符
  }
  // 单卡池判断：限定池数据中有该gacha_id的记录才保留
  const allLimitedPoolsData = [...props.limitGachaData, ...props.eventGachaData, ...props.fukeGachaData];
  return allLimitedPoolsData.some(r => r.gacha_id === Number(option.id));
});

const isSinglePool = computed(() => !['Limited', 'Normal', 'AdvanceNormal', 'QiYuan', 'Wish', 'Event', 'Fuke', 'AllLimited'].includes(CurrentSelectedPool.value));

// 导航栏相关的响应式变量
const activeTab = ref('progressBar'); // 切换显示进度条/角色一览/数量统计
const progressBarButton = ref(null);
const quantityStatisticsButton = ref(null);
const showPoolHint = ref(true); // 是否显示卡池切换提示气泡
const characterOverviewButton = ref(null);
const underlineStyle = ref({});
const statsActiveTab = ref('dataStats'); // 切换显示数据统计/占比分析
const dataStatsButton = ref(null);
const percentageAnalysisButton = ref(null);
const statsUnderlineStyle = ref({});

// 回顾动画相关的变量
const isReviewing = ref(false); // 是否正在回顾
const reviewRecords = ref([]); // 用于回顾动画的临时记录数组
let animationTimer = ref(null); // 用于存储 setTimeout 的 ID，方便清除
const ANIMATION_INTERVAL = [50, 25, 5]; // 1x,2x,3x速度下的回放间隔
const reviewSpeed = ref(1);

// 倍速按钮的文本
const reviewSpeedText = computed(() => {
  if (reviewSpeed.value === 3) return '3x▶▶▶';
  if (reviewSpeed.value === 2) return '2x▶▶';
  return '1x▶';
});

// 检查是否为开发环境
const isDev = import.meta.env.DEV;

// 根据是否在回顾模式下，切换数据源
const activeLimitData = computed(() =>
  isReviewing.value && (props.LIMITED_CARD_POOLS_ID.includes(CurrentSelectedPool.value) || ['Limited', 'Event', 'Fuke'].includes(CurrentSelectedPool.value))
    ? reviewRecords.value
    : props.limitGachaData
);

const activeNormalData = computed(() =>
  isReviewing.value && CurrentSelectedPool.value === 'Normal'
    ? reviewRecords.value
    : props.normalGachaData
);

const activeEventData = computed(() =>
  isReviewing.value && CurrentSelectedPool.value === 'Event'
    ? reviewRecords.value
    : props.eventGachaData
);

const activeFukeData = computed(() =>
  isReviewing.value && CurrentSelectedPool.value === 'Fuke'
    ? reviewRecords.value
    : props.fukeGachaData
);

const activeAdvancedNormalData = computed(() =>
  isReviewing.value && CurrentSelectedPool.value === 'AdvanceNormal'
    ? reviewRecords.value
    : props.advancedNormalGachaData
);

const activeQiYuanData = computed(() =>
  isReviewing.value && CurrentSelectedPool.value === 'QiYuan'
    ? reviewRecords.value
    : props.qiYuanGachaData
);

const activeWishData = computed(() =>
  isReviewing.value && CurrentSelectedPool.value === 'Wish'
    ? reviewRecords.value
    : props.wishGachaData
);

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
  if (activeLimitData.value.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  // 将数据改成从最久远到最近排序，方便计算抽数
  const records = [...activeLimitData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
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
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id, created_at: record.created_at });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id, created_at: record.created_at });
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
const singleLimitAnalysis = computed(() => {
  if (!limitAnalysis.value) return null;
  if (props.LIMITED_CARD_POOLS_ID.includes(CurrentSelectedPool.value)) {
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

// 联动卡池分析逻辑
const eventAnalysis = computed(() => {
  if (activeEventData.value.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  const records = [...activeEventData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  let SPCounter = 0, SSRCounter = 0;
  const SPHistory = [], SSRHistory = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`(联动) 未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }
    SPCounter++;
    SSRCounter++;
    if (cardInfo.rarity === RARITY.SP) {
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id, created_at: record.created_at });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id, created_at: record.created_at });
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

// 联动卡池单卡池分析逻辑
const singleEventAnalysis = computed(() => {
  if (!eventAnalysis.value) return null;
  if (props.EVENT_CARD_POOLS_ID.includes(CurrentSelectedPool.value)) {
    const filteredSPHistory = eventAnalysis.value.SPHistory.filter(item => item.gacha_id === Number(CurrentSelectedPool.value));
    const filteredSSRHistory = eventAnalysis.value.SSRHistory.filter(item => item.gacha_id === Number(CurrentSelectedPool.value));
    return {
      totalPulls: filteredSPHistory.reduce((sum, item) => sum + item.count, 0),
      SinglePulls: fullHistory.value.length,
      avgPullsForSP: calculateAverage(filteredSPHistory.map(item => item.count)),
      avgPullsForSSR: filteredSSRHistory.length > 0 ? fullHistory.value.length / filteredSSRHistory.length : 0,
      maxSP: Math.max(...filteredSPHistory.map(item => item.count), 0),
      minSP: Math.min(...filteredSPHistory.map(item => item.count), Infinity),
      SPHistory: filteredSPHistory,
      SSRHistory: filteredSSRHistory
    };
  }
  return { ...eventAnalysis.value };
});

// 复刻卡池分析逻辑
const fukeAnalysis = computed(() => {
  if (activeFukeData.value.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  const records = [...activeFukeData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  let SPCounter = 0, SSRCounter = 0;
  const SPHistory = [], SSRHistory = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`(复刻) 未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }
    SPCounter++;
    SSRCounter++;
    if (cardInfo.rarity === RARITY.SP) {
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id, created_at: record.created_at });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id, created_at: record.created_at });
      SSRCounter = 0;
    }
  });

  return {
    totalPulls: records.length, SP: SPCounter, SSR: SSRCounter,
    avgPullsForSP: calculateAverage(SPHistory.map(item => item.count)), avgPullsForSSR: calculateAverage(SSRHistory.map(item => item.count)),
    maxSP: Math.max(...SPHistory.map(item => item.count), 0), minSP: Math.min(...SPHistory.map(item => item.count), Infinity),
    SPHistory, SSRHistory, records,
  };
});

// 复刻卡池单卡池分析逻辑
const singleFukeAnalysis = computed(() => {
  if (!fukeAnalysis.value) return null;
  if (props.FUKE_CARD_POOLS_ID.includes(CurrentSelectedPool.value)) {
    const filteredSPHistory = fukeAnalysis.value.SPHistory.filter(item => item.gacha_id === Number(CurrentSelectedPool.value));
    const filteredSSRHistory = fukeAnalysis.value.SSRHistory.filter(item => item.gacha_id === Number(CurrentSelectedPool.value));
    return {
      totalPulls: filteredSPHistory.reduce((sum, item) => sum + item.count, 0),
      SinglePulls: fullHistory.value.length,
      avgPullsForSP: calculateAverage(filteredSPHistory.map(item => item.count)),
      avgPullsForSSR: filteredSSRHistory.length > 0 ? fullHistory.value.length / filteredSSRHistory.length : 0,
      maxSP: Math.max(...filteredSPHistory.map(item => item.count), 0),
      minSP: Math.min(...filteredSPHistory.map(item => item.count), Infinity),
      SPHistory: filteredSPHistory,
      SSRHistory: filteredSSRHistory
    };
  }
  return { ...fukeAnalysis.value };
});

// 高级常驻卡池分析逻辑
const AdvanceNormalAnalysis = computed(() => {
  // 仅当有有效数据时才执行计算
  if (activeAdvancedNormalData.value.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  // 将数据改成从最久远到最近排序，方便计算抽数
  const records = [...activeAdvancedNormalData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
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
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id, created_at: record.created_at });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id, created_at: record.created_at });
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

// 祈愿盲盒卡池分析逻辑
const qiYuanAnalysis = computed(() => {
  if (activeQiYuanData.value.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  const records = [...activeQiYuanData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  let SPCounter = 0, SSRCounter = 0;
  const SPHistory = [], SSRHistory = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`(祈愿盲盒) 未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }
    SPCounter++;
    SSRCounter++;
    if (cardInfo.rarity === RARITY.SP) {
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id, created_at: record.created_at });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id, created_at: record.created_at });
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

// 心愿自选卡池分析逻辑（与祈愿盲盒相同）
const wishAnalysis = computed(() => {
  if (activeWishData.value.length === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  const records = [...activeWishData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  let SPCounter = 0, SSRCounter = 0;
  const SPHistory = [], SSRHistory = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`(心愿自选) 未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }
    SPCounter++;
    SSRCounter++;
    if (cardInfo.rarity === RARITY.SP) {
      SPHistory.unshift({ ...cardInfo, count: SPCounter, gacha_id: record.gacha_id, created_at: record.created_at });
      SPCounter = 0;
    }
    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id, created_at: record.created_at });
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

// 所有卡池总览分析逻辑
const allLimitedAnalysis = computed(() => {
  const analyses = [
    limitAnalysis.value,
    eventAnalysis.value,
    fukeAnalysis.value,
    qiYuanAnalysis.value,
    wishAnalysis.value
  ];

  let totalPulls = 0;
  let SP = 0;
  let SSR = 0;
  let SPHistory = [];
  let SSRHistory = [];
  let records = [];

  analyses.forEach(a => {
    if (!a) return;
    totalPulls += a.totalPulls;
    SP += a.SP;
    SSR += a.SSR;
    if (a.SPHistory) SPHistory.push(...a.SPHistory);
    if (a.SSRHistory) SSRHistory.push(...a.SSRHistory);
    if (a.records) records.push(...a.records);
  });

  if (totalPulls === 0) return { totalPulls: 0, SP: 0, SSR: 0, avgPullsForSP: 0, avgPullsForSSR: 0, maxSP: 0, minSP: Infinity, SPHistory: [], SSRHistory: [], records: [] };

  // 按照时间倒序排列，确保展示顺序正确
  SPHistory.sort((a, b) => b.created_at - a.created_at);
  SSRHistory.sort((a, b) => b.created_at - a.created_at);

  return {
    totalPulls,
    SP,
    SSR,
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
  if (activeNormalData.value.length === 0) return { totalPulls: 0, SSR: 0, avgPullsForSSR: 0, maxSSR: 0, minSSR: 0, SSRHistory: [], totalSSRs: 0 };
  const records = [...activeNormalData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);
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

// 根据当前选择的卡池展示对应的分析数据=
const CurrentSelectedPoolAnalysis = computed(() => {
  if (CurrentSelectedPool.value === 'AllLimited') return allLimitedAnalysis.value;
  if (CurrentSelectedPool.value === 'AdvanceNormal') return AdvanceNormalAnalysis.value;
  if (CurrentSelectedPool.value === 'QiYuan') return qiYuanAnalysis.value;
  if (CurrentSelectedPool.value === 'Wish') return wishAnalysis.value;
  if (CurrentSelectedPool.value === 'Event') return eventAnalysis.value;
  if (CurrentSelectedPool.value === 'Fuke') return fukeAnalysis.value;
  if (CurrentSelectedPool.value === 'Normal') return normalAnalysis.value;

  if (props.EVENT_CARD_POOLS_ID.includes(CurrentSelectedPool.value)) return singleEventAnalysis.value;
  if (props.FUKE_CARD_POOLS_ID.includes(CurrentSelectedPool.value)) return singleFukeAnalysis.value;

  return singleLimitAnalysis.value;
});

// 为称号组件提供数据
const analysisForTitle = computed(() => {
  const analysis = CurrentSelectedPoolAnalysis.value;
  if (CurrentSelectedPool.value === 'Normal') {
    return analysis?.avgPullsForSSR > 0 ? analysis : null;
  }
  return analysis?.avgPullsForSP > 0 ? analysis : null;
});



// 计算所有稀有度的数量
const rarityCounts = computed(() => {
  const counts = {
    SP: 0,
    SSR: 0,
    SR: 0,
    R: 0,
  };

  // 使用fullHistory过滤好的数据
  for (const item of fullHistory.value) {
    if (item.rarity === RARITY.SP) {
      counts.SP++;
    } else if (item.rarity === RARITY.SSR) {
      counts.SSR++;
    } else if (item.rarity === RARITY.SR) {
      counts.SR++;
    } else if (item.rarity === RARITY.R) {
      counts.R++;
    }
  }
  return counts;
});

const pieChartJSData = computed(() => {
  const counts = rarityCounts.value;
  // 使用作为总数
  const total = CurrentSelectedPoolAnalysis.value?.totalPulls ?? 0;

  if (total === 0) {
    return {}; // 没有数据
  }

  const calculatePercentage = (count) => (count / total) * 100;

  // 过滤掉数量为0的稀有度
  const percentageChartData = [
    { name: '限定', value: counts.SP, percentage: calculatePercentage(counts.SP), color: colors.rarity.sp },
    { name: 'SSR', value: counts.SSR, percentage: calculatePercentage(counts.SSR), color: colors.rarity.ssr },
    { name: 'SR', value: counts.SR, percentage: calculatePercentage(counts.SR), color: colors.rarity.sr },
    { name: 'R', value: counts.R, percentage: calculatePercentage(counts.R), color: colors.rarity.r },
  ].filter(item => item.value > 0);
  const labels = percentageChartData.map(d => d.name);
  const data = percentageChartData.map(d => d.value);
  const backgroundColors = percentageChartData.map(d => d.color);

  return {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColors,
        borderColor: colors.background.content, // 给色块之间留一个背景色边框
        borderWidth: 2,
      },
    ],
  };
});


// 历史区域动态下划线逻辑
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

// 数据区域动态下划线逻辑
const updateStatsUnderline = () => {
  const buttons = {
    dataStats: dataStatsButton.value,
    percentageAnalysis: percentageAnalysisButton.value,
  };
  const activeButton = buttons[statsActiveTab.value];
  if (activeButton) {
    statsUnderlineStyle.value = {
      left: `${activeButton.offsetLeft}px`,
      width: `${activeButton.offsetWidth}px`,
    };
  }
};

// 监听到切换tabs后更新下划线位置
watch(activeTab, async () => {
  // 等待DOM更新完成再计算位置
  await nextTick();
  updateUnderline();
});

watch(statsActiveTab, async () => {
  await nextTick();
  updateStatsUnderline();
});

// 组件加载时挂载监听
onMounted(() => {
  setTimeout(() => {
    showPoolHint.value = false;
  }, 5000);

  nextTick(() => {
    updateUnderline();
    updateStatsUnderline();
  });
  window.addEventListener('resize', updateUnderline);
  window.addEventListener('resize', updateStatsUnderline);
});

// 组件卸载时清理工作
onUnmounted(() => {
  window.removeEventListener('resize', updateUnderline);
  window.removeEventListener('resize', updateStatsUnderline);
  stopReviewAnimation();
});

/**
 * 根据抽数计算出金进度条背景样式
 * @param {object} count - 当前抽数
 * @param {boolean} isNormal - 是否为常驻池模式（常驻池出货概率阈值不同）
 * @returns {object} - 一个包含背景样式的对象
 */
const getHistoryItemStyle = (count, isNormal = false) => {
  // 进度条最大抽数设为60，超出部分按100%计算
  const percentage = Math.min(count / 60, 1) * 95 + 5; // 最少显示2%的进度，防止看不见
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
  if (pool === 'AdvanceNormal') {
    const spStats = generateStats(AdvanceNormalAnalysis.value?.SPHistory, RARITY.SP);
    const ssrStats = generateStats(AdvanceNormalAnalysis.value?.SSRHistory, RARITY.SSR);
    return [...spStats, ...ssrStats];
  }
  if (pool === 'QiYuan') {
    const spStats = generateStats(qiYuanAnalysis.value?.SPHistory, RARITY.SP);
    const ssrStats = generateStats(qiYuanAnalysis.value?.SSRHistory, RARITY.SSR);
    return [...spStats, ...ssrStats];
  }
  if (pool === 'Wish') {
    const spStats = generateStats(wishAnalysis.value?.SPHistory, RARITY.SP);
    const ssrStats = generateStats(wishAnalysis.value?.SSRHistory, RARITY.SSR);
    return [...spStats, ...ssrStats];
  }
  if (pool === 'Event') {
    const spStats = generateStats(eventAnalysis.value?.SPHistory, RARITY.SP);
    const ssrStats = generateStats(eventAnalysis.value?.SSRHistory, RARITY.SSR);
    return [...spStats, ...ssrStats];
  }
  if (pool === 'Fuke') {
    return generateStats(fukeAnalysis.value?.SPHistory, RARITY.SP);
  }
  // 默认处理所有其他限定池
  const analysis = CurrentSelectedPoolAnalysis.value;
  const spStats = generateStats(analysis?.SPHistory, RARITY.SP);
  const ssrStats = generateStats(analysis?.SSRHistory, RARITY.SSR);
  // 合并列表，SP在前，SSR在后
  return [...spStats, ...ssrStats];
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
  } else if (CurrentSelectedPool.value === 'AllLimited') {
    data = [...props.limitGachaData, ...props.eventGachaData, ...props.fukeGachaData, ...props.qiYuanGachaData, ...props.wishGachaData];
  } else if (CurrentSelectedPool.value === 'AdvanceNormal') {
    data = [...props.advancedNormalGachaData];
  } else if (CurrentSelectedPool.value === 'QiYuan') {
    data = [...props.qiYuanGachaData];
  } else if (CurrentSelectedPool.value === 'Wish') {
    data = [...props.wishGachaData];
  } else if (CurrentSelectedPool.value === 'Event') {
    data = [...props.eventGachaData];
  } else if (CurrentSelectedPool.value === 'Fuke') {
    data = [...props.fukeGachaData];
  } else if (CurrentSelectedPool.value === 'Limited') {
    data = [...props.limitGachaData];
  } else {
    // 适用于所有单卡池，包括限定、联动和复刻
    data = [...props.limitGachaData, ...props.eventGachaData, ...props.fukeGachaData].filter(r => r.gacha_id === Number(CurrentSelectedPool.value));
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
  // 回顾动画播放时显示最后一抽具体时间
  if (isReviewing.value) {
    // reviewRecords 是动画播放时使用的数据源
    const records = reviewRecords.value;
    // 如果动画还没开始显示提示文本
    if (records.length === 0) {
      return '即将开始回顾...';
    }
    // 获取当前动画播放到的最后一条记录
    const latestRecord = records[records.length - 1];
    return formatDateTime(latestRecord.created_at);
  }
  // 正常状态下显示日期范围
  else {
    if (CurrentSelectedPool.value === 'AllLimited') return '';
    if (fullHistory.value.length === 0) return '';
    // 计算并格式化起始和结束日期
    const startDate = formatDate(fullHistory.value[fullHistory.value.length - 1]?.created_at);
    const endDate = formatDate(fullHistory.value[0]?.created_at);
    return `${startDate} - ${endDate}`;
  }
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

// 监听限定卡池选择变化，重置页码为1，停止动画
watch(CurrentSelectedPool, () => {
  currentPage.value = 1;
  stopReviewAnimation();
  if (CurrentSelectedPool.value === 'AllLimited') {
    statsActiveTab.value = 'dataStats';
  }
});
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

// 动画相关函数
const stopReviewAnimation = () => {
  if (animationTimer.value) {
    clearTimeout(animationTimer.value);
    animationTimer.value = null;
  }
  isReviewing.value = false;
  reviewRecords.value = [];
};

// 切换速度
const switchReviewSpeed = () => {
  if (reviewSpeed.value === 3) {
    reviewSpeed.value = 1; // 重置为1x
  } else {
    reviewSpeed.value++; // 增加速度
  }
};

// 设置回放速度
const reviewInterval = computed(() => {
  switch (reviewSpeed.value) {
    case 3: return ANIMATION_INTERVAL[2]; // 3x速度
    case 2: return ANIMATION_INTERVAL[1]; // 2x速度
    default: return ANIMATION_INTERVAL[0]; // 1x速度
  }
});

const startReviewAnimation = () => {
  // 如果动画播放完成，再次点击则重置
  if (isReviewing.value) {
    stopReviewAnimation();
    return; // 点击后执行停止操作，并立即退出函数
  }

  // 停止任何正在进行的动画
  stopReviewAnimation();

  // 获取当前卡池的完整、原始数据
  let sourceData = [];
  const poolId = CurrentSelectedPool.value;
  if (poolId === 'Normal') {
    sourceData = [...props.normalGachaData];
  } else if (poolId === 'AdvanceNormal') {
    sourceData = [...props.advancedNormalGachaData];
  } else if (poolId === 'QiYuan') {
    sourceData = [...props.qiYuanGachaData];
  } else if (poolId === 'Wish') {
    sourceData = [...props.wishGachaData];
  } else if (poolId === 'Event') {
    sourceData = [...props.eventGachaData];
  } else if (poolId === 'Fuke') {
    sourceData = [...props.fukeGachaData];
  } else if (poolId === 'Limited') {
    sourceData = [...props.limitGachaData];
  } else {
    // 适用于所有单卡池，包括限定、联动和复刻
    sourceData = [...props.limitGachaData, ...props.eventGachaData, ...props.fukeGachaData].filter(r => r.gacha_id === Number(poolId));
  }

  if (sourceData.length === 0) {
    alert('当前卡池没有记录可供回顾。');
    return;
  }

  // 按时间从远到近排序
  const sortedSource = sourceData.sort((a, b) => a.created_at - b.created_at || a.id - b.id);

  // 初始化动画状态
  isReviewing.value = true;
  reviewRecords.value = []; // 确保开始时是空的
  let currentIndex = 0;

  // 定义动画的单步操作
  const animateStep = () => {
    if (currentIndex < sortedSource.length) {
      // 向临时数组中添加一条记录，触发UI更新
      reviewRecords.value.push(sortedSource[currentIndex]);
      currentIndex++;
      // 设置下一次执行
      animationTimer.value = setTimeout(animateStep, reviewInterval.value);
    } else {
      // 动画播放完毕
      animationTimer.value = null;
      isReviewing.value = false;
    }
  };

  // 启动动画
  animateStep();
};

// 分享/下载分析图
const shareAnalysisImage = async () => {
  if (!analysisContentRef.value) return;

  const PADDING = 15; // 设置截图的内边距

  try {
    const canvas = await html2canvas(analysisContentRef.value, {
      useCORS: true, // 允许加载跨域图片
      backgroundColor: colors.background.content, // 设置背景色，防止透明
      scale: 2, // 提高分辨率
      x: -PADDING, // 从元素左侧 PADDING 像素处开始截图
      width: analysisContentRef.value.offsetWidth + PADDING * 2, // 截图宽度 = 元素宽度 + 左右边距
      height: analysisContentRef.value.offsetHeight, // 截图高度
    });

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('生成图片失败！');
        return;
      }

      const filename = `盲盒派对抽卡分析-${props.playerId}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // 检查浏览器是否支持 Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '我的抽卡分析' });
        } catch (error) {
          logger.warn('分享失败，可能是用户取消了操作。回退到下载。', error);
          FileSaver.saveAs(blob, filename); // 用户取消分享或分享失败时，回退到下载
        }
      } else {
        FileSaver.saveAs(blob, filename); // 不支持分享则直接下载
      }
    }, 'image/png');
  } catch (error) {
    alert(`截图失败: ${error}`);
  }
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000); // 时间戳是秒，需要乘以1000
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};
</script>

<style scoped>
.gacha-analysis-container {
  background-color: v-bind('colors.background.content');
  padding: 0.5rem;
  margin: 0.5rem;
  min-width: 300px;
  width: 500px;
  border-radius: 12px;
}

.analysis-content-wrapper {
  padding-top: 10px;
}

.analysis-section:not(:first-child) {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 2px solid v-bind('colors.background.light');
}

.gacha-analysis-button-container {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.button {
  background-color: v-bind('colors.background.lighter');
  color: v-bind('colors.text.light');
  border: none;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.button:disabled {
  background-color: v-bind('colors.background.light');
  color: v-bind('colors.text.disabled');
  cursor: not-allowed;
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

.selector-wrapper {
  position: relative;
}

.pool-hint-bubble {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  background-color: v-bind('colors.shadow.primaryHover');
  color: v-bind('colors.text.primary');
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
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
  margin: -1rem 0rem -0.5rem 0rem;
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
  margin-top: 8px;
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
  padding: 2px 0px;
}

.stat-box .stat-title {
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
}

.stat-box .stat-value {
  font-size: 1.1rem;
  font-weight: bold;
}

.tabs {
  position: relative;
  display: flex;
  justify-content: center;
  border-bottom: 2px solid v-bind('colors.background.lighter');
  margin-bottom: 6px;
}

.nav-button {
  background-color: transparent;
  border: none;
  padding: 0 20px 4px 20px;
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

.history-item,
.history-item-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem;
  border-radius: 6px;
  border-radius: 6px;
  position: relative;
  z-index: 1;
}

.history-item-bar {
  background-color: v-bind('colors.background.lighter');
  border-radius: 0 40px 40px 0;
  margin-left: 1.25rem;
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

.history-item-bar .char-info {
  margin-left: -1.75rem;
}

.char-avatar {
  width: 2.5rem;
  height: 2.5rem;
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

.section-title {
  font-size: 1.1rem;
  color: v-bind('colors.text.secondary');
  margin-top: 10px;
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

/* 饼图相关样式 */
.pie-chart-wrapper {
  width: 100%;
  max-width: 220px;
  /* 限制最大宽度 */
  height: 220px;
  /* 限制高度 */
  position: relative;
}

.percentage-analysis-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

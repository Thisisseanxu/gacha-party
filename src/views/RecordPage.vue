<template>
  <div class="background">
    <div v-if="viewState === 'input'" class="gacha-analysis-container">
      <div v-if="viewState === 'input'" class="input-section">
        <h2 class="input-title">抽卡记录分析</h2>
        <p>此页面可分析使用抽卡记录导出工具导出的抽卡数据<br />
          工具和激活码请加 <a class="highlight"
            href="https://qm.qq.com/cgi-bin/qm/qr?k=ntxYu3FuRWgafpUguLeKdaFSt06y-TiO&jump_from=webapi&authKey=8LzsxinzBKbO6rvvvtQ4JSzXsBJDmv/1SGhBQhmoDqI8XHekcmVNpqDkE+MbzbBw"
            target="_blank">
            Q群1049576192</a> 获取
        </p>
        <p class="input-description">请在下方文本框粘贴您的抽卡记录 JSON 数据，或上传导出的文件。</p>

        <textarea v-model="jsonInput" id="jsonInput" class="json-textarea"
          placeholder='请在此处粘贴 JSON 数据... 例如：{"version":2,"9999999":{"9":[{"id":7579416,"gacha_id":9,"item_id":"151406","created_at":1751324096},...]}}'></textarea>

        <div class="button-group">
          <button @click="handleJsonAnalysis" class="action-button">开始分析</button>
          <label class="file-upload-button action-button">
            上传文件
            <input type="file" @change="handleFileUpload" accept=".json,application/json" style="display: none;" />
          </label>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="cloud-section">
          <p class="input-title">织夜云服务 BETA</p>
          <p class="input-description">【限时免费】使用激活码查询您的抽卡记录。</p>
          <input type="text" v-model="licenseInput" class="cloud-input" placeholder="在此处输入您的激活码（与导出工具相同）" />
          <button @click="handleGetRecord" class="action-button">获取云端抽卡记录</button>
        </div>

        <p v-if="cloudErrorMessage" class="error-message">{{ cloudErrorMessage }}</p>
        <p class="input-description">本网页完全开源，可查看<a class="highlight" href="https://github.com/Thisisseanxu/gacha-party"
            target="_blank">Github链接</a>提出意见/提交代码。</p>
      </div>
    </div>

    <div v-if="viewState === 'analysis'" class="gacha-analysis-container">

      <div v-if="viewState === 'analysis'" class="gacha-analysis-page">
        <button @click="resetView" class="button">← 分析新文件</button>

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

            <CustomPlayerTitle
              v-if="(CurrentSelectedPool !== 'Normal' && singleAnalysis && singleAnalysis.avgPullsForSP > 0) || (CurrentSelectedPool === 'Normal' && normalAnalysis && normalAnalysis.avgPullsForSSR > 0)"
              :titleMap="CurrentSelectedPool === 'Normal' ? NORMALPOOL_TITLE_MAP : LIMITPOOL_TITLE_MAP"
              :value="CurrentSelectedPool === 'Normal' ? normalAnalysis.avgPullsForSSR : singleAnalysis.avgPullsForSP" />
          </div>
          <div
            :class="{ 'total-pulls': true, 'highlight': CurrentSelectedPool !== 'Limited' && CurrentSelectedPool !== 'Normal' }">
            {{
              CurrentSelectedPool === 'Normal' ? normalAnalysis.totalPulls : singleAnalysis.totalPulls
            }} <span class="pulls-text">抽</span>
          </div>

          <div v-if="singleAnalysis.SinglePulls > 0" class="tertiary-text">{{ '该卡池抽取' +
            singleAnalysis.SinglePulls + '次'
          }}<br />
            抽数会计算到最终抽出限定的卡池中
          </div>
          <div class="pity-counters" v-if="CurrentSelectedPool === 'Normal' || CurrentSelectedPool === 'Limited'">
            <div class="history-item" :style="{ ...getHistoryItemStyle(limitAnalysis.SP), flex: '1' }"
              v-if="CurrentSelectedPool !== 'Normal'">
              <span>距上个限定 </span>
              <span class="pity-count">{{ limitAnalysis.SP }}</span>
            </div>
            <div class="history-item"
              :style="{ ...getHistoryItemStyle(CurrentSelectedPool === 'Normal' ? normalAnalysis.SSR : 0, isNormal = true), flex: '1' }">
              <span>距上个SSR</span>
              <span class="pity-count">{{ CurrentSelectedPool === 'Normal' ? normalAnalysis.SSR :
                limitAnalysis.SSR
              }}</span>
            </div>
          </div>
          <div class="tertiary-text">{{ CurrentSelectedPool === 'Normal' ? normalAnalysis.dateRange :
            singleAnalysis.dateRange }}
          </div>
        </div>

        <div class="stats-overview">
          <div class="stat-box" v-if="CurrentSelectedPool === 'Normal'">
            <div class="stat-title">SSR数量</div>
            <div class="stat-value">{{ normalAnalysis.totalSSRs }}</div>
          </div>
          <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
            <div class="stat-title">限定平均</div>
            <div v-if="singleAnalysis.avgPullsForSP > 0"
              :class="{ 'stat-value': true, 'highlight': CurrentSelectedPool !== 'Limited' }">{{
                singleAnalysis.avgPullsForSP.toFixed(2) }} 抽
            </div>
            <div v-else class="stat-value">暂无数据</div>
          </div>

          <div class="stat-vertical-layout" v-if="CurrentSelectedPool !== 'Normal'">
            <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
              <div v-if="singleAnalysis.maxSP > 0"
                :class="{ 'stat-value': true, 'highlight': CurrentSelectedPool !== 'Limited' }">最非 {{
                  singleAnalysis.maxSP }} 抽
              </div>
              <div v-else class="stat-value">未抽到</div>
            </div>
            <div class="stat-box" v-if="CurrentSelectedPool !== 'Normal'">
              <div v-if="singleAnalysis.minSP > 0 && singleAnalysis.minSP !== Infinity"
                :class="{ 'stat-value': true, 'highlight': CurrentSelectedPool !== 'Limited' }">最欧 {{
                  singleAnalysis.minSP }} 抽
              </div>
              <div v-else class="stat-value">限定</div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-title">SSR平均</div>
            <div v-if="CurrentSelectedPool === 'Normal'" class="stat-value">
              {{ normalAnalysis.avgPullsForSSR > 0 ? normalAnalysis.avgPullsForSSR.toFixed(2) + ' 抽' : '暂无数据' }}</div>
            <div v-if="CurrentSelectedPool !== 'Normal'" class="stat-value">{{ limitAnalysis.avgPullsForSSR > 0 ?
              singleAnalysis.avgPullsForSSR.toFixed(2) + ' 抽' : '暂无数据' }}</div>
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
              v-for="(item, index) in CurrentSelectedPool === 'Normal' ? normalAnalysis.SSRHistory : singleAnalysis.SPHistory"
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
              v-for="(item, index) in CurrentSelectedPool === 'Normal' ? normalAnalysis.SSRHistory : singleAnalysis.SPHistory"
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

      <p v-if="(!limitAnalysis || limitAnalysis.totalPulls === 0)">
        欸？好像没有抽卡记录
      </p>

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
import { verifyLicense } from '@/utils/licenseManager.js';

import SelectorComponent from '@/components/SelectorComponent.vue';
import CustomPlayerTitle from '@/components/CustomPlayerTitle.vue';

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
};
const LIMITED_CARD_POOLS_ID = ['29', '40', '41', '42', '43']; // 限定卡池ID列表

// 抽数<字典键值时显示对应称号
const LIMITPOOL_TITLE_MAP = {
  32: { title: '天选之子', text_color: 'rgb(255, 215, 0)', background: 'rgb(128, 0, 128)' },
  34.5: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  35.75: { title: '小欧皇', background: colors.colorOfLuck.low },
  37.5: { title: '平平无奇', background: colors.colorOfLuck.medium },
  39: { title: '小非酋', background: colors.colorOfLuck.high },
  41: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '艰难依旧坚持', background: colors.colorOfLuck.veryHigh }, // 设置为120以防偶尔出现的>60抽的情况
};
const NORMALPOOL_TITLE_MAP = {
  10: { title: '天选之子', text_color: 'rgb(255, 215, 0)', background: 'rgb(128, 0, 128)' },
  11: { title: '大欧皇', background: colors.colorOfLuck.veryLow },
  11.75: { title: '小欧皇', background: colors.colorOfLuck.low },
  13: { title: '平平无奇', background: colors.colorOfLuck.medium },
  13.75: { title: '小非酋', background: colors.colorOfLuck.high },
  14.75: { title: '大非酋', background: colors.colorOfLuck.veryHigh },
  120: { title: '艰难依旧坚持', background: colors.colorOfLuck.veryHigh }, // 设置为120以防偶尔出现的>60抽的情况
};


const viewState = ref('input'); // 'input' 则为用户输入 'analysis' 则为用户上传json文件
const jsonInput = ref(''); // 存储用户输入的 JSON 数据
const playerId = ref(''); // 存储玩家ID
const licenseInput = ref(''); // 绑定的许可证输入框
const LimitGachaData = ref([]); // 存储限定卡池抽卡记录
const NormalGachaData = ref([]); // 存储常驻卡池抽卡记录
const CurrentSelectedPool = ref("Limited"); // 控制限定卡池筛选指定卡池的抽卡记录
const errorMessage = ref('');
const cloudErrorMessage = ref(''); // 织夜云的错误信息
// 合成卡池选择下拉框选项
const cardPoolOptions = ref([
  { id: 'Limited', name: CARDPOOLS_NAME_MAP['Limited'] }, // 限定卡池总览
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

const handleJsonAnalysis = () => {
  errorMessage.value = '';

  if (!jsonInput.value.trim()) {
    errorMessage.value = '请输入JSON数据！';
    return;
  }

  let finalData;
  try {
    let parsedData = JSON.parse(jsonInput.value);

    // 检查是否是压缩格式
    if (parsedData && parsedData.compressed === true && typeof parsedData.data === 'string') {
      try {
        // Base64 解码
        const binaryString = atob(parsedData.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Gzip 解压
        const decompressedString = pako.inflate(bytes, { to: 'string' });
        finalData = JSON.parse(decompressedString);
        finalData.cloud = parsedData.cloud || false; // 保留云端标记

      } catch (e) {
        errorMessage.value = `解压或解析压缩数据时失败，请确认数据是否正确。错误: ${e.message}`;
        return;
      }
    } else {
      // 如果不是压缩格式，直接使用
      finalData = parsedData;
    }

  } catch (error) {
    errorMessage.value = `JSON 格式无法解析，请检查。错误详情: ${error.message}`;
    return;
  }

  if (typeof finalData !== 'object' || finalData === null || Array.isArray(finalData)) {
    errorMessage.value = '数据格式错误：顶层结构必须是一个对象 ( 形如 {"key": "value", ...} )。';
    return;
  }

  if (typeof finalData.version !== 'number' || finalData.version < 2) {
    errorMessage.value = '您的数据版本不正确。请确保使用最新版盲盒派对抽卡记录导出工具导出数据！';
    return;
  }

  playerId.value = Object.keys(finalData).find(key => key !== 'version');
  if (!playerId.value) {
    errorMessage.value = '数据格式错误：找不到玩家ID！';
    return;
  }

  const playerData = finalData[playerId.value];
  if (typeof playerData !== 'object' || playerData === null || Object.keys(playerData).length === 0) {
    errorMessage.value = '数据格式错误：玩家ID下没有任何卡池对象！';
    return;
  }

  const gachaPools = Object.values(playerData);
  if (!gachaPools.some(pool => Array.isArray(pool))) {
    errorMessage.value = '数据格式错误：未找到有效的卡池数据！';
    return;
  }

  if (finalData.cloud) {
    // 处理云端数据时要手动加上gacha_id
    for (const [gachaId, records] of Object.entries(playerData)) {
      if (Array.isArray(records)) {
        records.forEach(record => {
          if (typeof record === 'object' && record !== null) {
            record.gacha_id = Number(gachaId); // 添加 gacha_id 字段
          }
        });
      }
    }
  }

  const LimitGachaRecords = [];
  const NormalGachaRecords = [];
  for (const [gachaId, records] of Object.entries(playerData)) {
    if (gachaId === '9') {
      NormalGachaRecords.push(...records);
    } else if (LIMITED_CARD_POOLS_ID.includes(gachaId)) {
      LimitGachaRecords.push(...records);
    }
  }

  for (const item of LimitGachaRecords) {
    if (typeof item !== 'object' || item === null || !('id' in item) || !('item_id' in item) || !('created_at' in item)) {
      errorMessage.value = '数据格式错误：限定卡池抽卡记录缺少 "id" 或 "item_id" 或 "created_at" 字段';
      return;
    }
  }

  for (const item of NormalGachaRecords) {
    if (typeof item !== 'object' || item === null || !('id' in item) || !('item_id' in item) || !('created_at' in item)) {
      errorMessage.value = '数据格式错误：常驻卡池抽卡记录缺少 "id" 或 "item_id" 或 "created_at" 字段';
      return;
    }
  }

  LimitGachaData.value = LimitGachaRecords;
  NormalGachaData.value = NormalGachaRecords;
  viewState.value = 'analysis';
};

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    jsonInput.value = e.target.result; // 这里为了方便处理，直接把文件内容放进文本框，这样不用做两个逻辑，我真是个天才
    handleJsonAnalysis();
  };
  reader.onerror = () => {
    errorMessage.value = '读取文件时发生错误。';
  };
  reader.readAsText(file);
  // 清空事件
  event.target.value = '';
};

// 处理获取云端记录
const handleGetRecord = async () => {
  if (!licenseInput.value.trim()) {
    cloudErrorMessage.value = '请输入激活码！';
    return;
  }

  const licenseKey = licenseInput.value.trim();

  try {
    // 在客户端先进行一次验证
    logger.log("正在客户端验证激活码...");
    const result = verifyLicense(licenseKey);
    if (result.success !== true) {
      throw new Error(result.message || '激活码验证失败，请检查激活码是否正确。');
    }
    logger.log(`客户端验证成功, User ID: ${result.userId}`);

    const currentUrl = isDev ? 'http://localhost:8787' : window.location.origin;

    // 验证通过后，将激活码发送给Worker进行最终验证和数据获取
    const response = await fetch(`${currentUrl}/get-record`, {
      method: 'GET',
      headers: {
        'X-License-Key': licenseKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `服务器错误: ${response.status}`);
    }

    const compressedString = await response.text();
    const wrappedJson = { cloud: true, compressed: true, data: compressedString };
    jsonInput.value = JSON.stringify(wrappedJson);
    handleJsonAnalysis(); // 调用已有的分析逻辑

  } catch (error) {
    logger.error("激活码处理错误:", error);
    cloudErrorMessage.value = error.message;
  }
};

// 重置网页获取其他输入
const resetView = () => {
  viewState.value = 'input';
  jsonInput.value = '';
  LimitGachaData.value = [];
  NormalGachaData.value = [];
  errorMessage.value = '';
  playerId.value = '';
  cloudErrorMessage.value = '';
  CurrentSelectedPool.value = 'Limited';
};

// 计算列表平均值的通用函数
const calculateAverage = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const getCardInfoAndRemovePrefix = (itemId) => {
  // id格式为15xxxx，而cardMap中没有15前缀，直接是xxxx，因此需要转换
  let cardId = itemId;
  if (itemId.startsWith('15')) {
    cardId = itemId.slice(2); // 去掉前缀 "15"
  }
  return cardMap.get(cardId) || null;
};


// 限定卡池分析逻辑
const limitAnalysis = computed(() => {
  // 仅当有有效数据时才执行计算
  if (LimitGachaData.value.length === 0) return null;

  // 将数据改成从最久远到最近排序，方便计算抽数
  const records = [...LimitGachaData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);

  let SPCounter = 0;
  let SSRCounter = 0;
  const SPHistory = [];
  const SSRHistory = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }

    SPCounter++;
    SSRCounter++;

    if (cardInfo.rarity === RARITY.SP) {
      SPHistory.unshift({
        ...cardInfo,
        count: SPCounter,
        gacha_id: record.gacha_id,
      });
      SPCounter = 0;
    }

    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.push({ ...cardInfo, count: SSRCounter, gacha_id: record.gacha_id });
      SSRCounter = 0;
    }
  });

  const totalPulls = records.length;
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };
  const startDate = formatDate(records[0]?.created_at);
  const endDate = formatDate(records[records.length - 1]?.created_at);

  return {
    totalPulls,
    SinglePulls: 0,
    SP: SPCounter,
    SSR: SSRCounter,
    dateRange: `${startDate} - ${endDate}`,
    avgPullsForSP: calculateAverage(SPHistory.map(item => item.count)),
    avgPullsForSSR: calculateAverage(SSRHistory.map(item => item.count)),
    maxSP: Math.max(...SPHistory.map(item => item.count), 0),
    minSP: Math.min(...SPHistory.map(item => item.count), Infinity),
    SPHistory: SPHistory,
    SSRHistory: SSRHistory,
    records: records,
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
      SinglePulls: fullHistory.value.length,
      avgPullsForSP: calculateAverage(filteredSPHistory.map(item => item.count)),
      avgPullsForSSR: filteredSSRHistory.length > 0 ? fullHistory.value.length / filteredSSRHistory.length : 0,
      maxSP: Math.max(...filteredSPHistory.map(item => item.count), 0),
      minSP: Math.min(...filteredSPHistory.map(item => item.count), Infinity),
      SPHistory: filteredSPHistory,
      SSRHistory: filteredSSRHistory
    };
  }
  return { // 如果选中的卡池不存在，则返回全部限定卡池的分析数据
    dateRange: limitAnalysis.value.dateRange,
    totalPulls: limitAnalysis.value.totalPulls,
    SinglePulls: limitAnalysis.value.SinglePulls,
    avgPullsForSP: limitAnalysis.value.avgPullsForSP,
    avgPullsForSSR: limitAnalysis.value.avgPullsForSSR,
    maxSP: limitAnalysis.value.maxSP,
    minSP: limitAnalysis.value.minSP,
    SPHistory: limitAnalysis.value.SPHistory,
    SSRHistory: limitAnalysis.value.SSRHistory,
  };
});

// 常驻卡池分析逻辑
const normalAnalysis = computed(() => {
  if (NormalGachaData.value.length === 0) return null;

  const records = [...NormalGachaData.value].sort((a, b) => a.created_at - b.created_at || a.id - b.id);

  let SSRCounter = 0;
  const SSRHistory = [];
  const SSRPulls = [];

  records.forEach((record) => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    if (!cardInfo) {
      logger.warn(`(常驻池)未找到 item_id: ${record.item_id} 的信息，已跳过。`);
      return;
    }

    SSRCounter++;

    if (cardInfo.rarity === RARITY.SSR) {
      SSRHistory.unshift({
        ...cardInfo,
        count: SSRCounter,
      });
      SSRPulls.push(SSRCounter);
      SSRCounter = 0;
    }
  });

  const totalPulls = records.length;
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };
  const startDate = formatDate(records[0]?.created_at);
  const endDate = formatDate(records[records.length - 1]?.created_at);

  return {
    totalPulls,
    SSR: SSRCounter,
    dateRange: `${startDate} - ${endDate}`,
    avgPullsForSSR: calculateAverage(SSRPulls),
    maxSSR: SSRPulls.length > 0 ? Math.max(...SSRPulls) : 0,
    minSSR: SSRPulls.length > 0 ? Math.min(...SSRPulls) : 0,
    SSRHistory: SSRHistory,
    totalSSRs: SSRPulls.length,
  };
});

/**
 * 根据抽数计算出金进度条背景样式
 * @param {object} count - 当前抽数
 * @param {boolean} isNormal - 是否为常驻池模式（常驻池出货概率阈值不同）
 * @returns {object} - 一个包含背景样式的对象
 */
const getHistoryItemStyle = (count, isNormal = false) => {
  const maxCount = 60;
  const percentage = (count / maxCount) * 100;

  let progressBarColor;

  // 根据不同卡池和抽数应用不同颜色
  if ((isNormal && count < 10) || (!isNormal && count < 31)) {
    progressBarColor = colors.colorOfLuck.veryLow;
  } else if ((isNormal && count < 15) || (!isNormal && count < 41)) {
    progressBarColor = colors.colorOfLuck.medium;
  } else {
    progressBarColor = colors.colorOfLuck.veryHigh;
  }

  const backgroundColor = colors.colorOfLuck.background;
  return {
    background: `linear-gradient(to right, ${progressBarColor} ${percentage}%, ${backgroundColor} ${percentage}%)`
  };
};

// 数量统计计算逻辑
const quantityStatistics = computed(() => {
  if (!limitAnalysis.value && !normalAnalysis.value) return [];

  // 辅助函数：用于从历史记录中生成统计数据
  const generateStats = (history, rarity) => {
    if (!history || history.length === 0) return [];
    const stats = new Map();
    history.forEach(item => {
      if (stats.has(item.id)) {
        stats.get(item.id).count++;
      } else {
        stats.set(item.id, {
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          rarity: rarity, // 明确角色的稀有度
          count: 1,
        });
      }
    });
    // 将 Map 转换为数组并按角色id排序
    return Array.from(stats.values()).sort((a, b) => a.id - b.id);
  };

  // 如果是常驻池则直接返回SSR统计
  if (CurrentSelectedPool.value === 'Normal') {
    return generateStats(normalAnalysis.value?.SSRHistory, RARITY.SSR);
  }

  // 获取 SP 统计
  const spStats = generateStats(singleAnalysis.value?.SPHistory, RARITY.SP);
  // 获取 SSR 统计
  const ssrStats = generateStats(singleAnalysis.value?.SSRHistory, RARITY.SSR);

  // 合并列表，SP在前，SSR在后
  return [...spStats, ...ssrStats];
});

// 动态下划线核心逻辑
const updateUnderline = () => {
  let activeButton;
  switch (activeTab.value) {
    case 'characterOverview':
      activeButton = characterOverviewButton.value;
      break;
    case 'quantityStatistics':
      activeButton = quantityStatisticsButton.value;
      break;
    case 'progressBar':
    default:
      activeButton = progressBarButton.value;
      break;
  }

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

watch(viewState, async (newState) => {
  if (newState === 'analysis') {
    // 确保DOM已经更新，导航栏已渲染
    await nextTick();
    updateUnderline();
  }
});

onMounted(() => {
  window.addEventListener('resize', updateUnderline);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateUnderline);
});

// 根据传入的参数获取对应的修改过透明度的背景颜色
const getAlphaBgWith = (type) => {
  switch (type) {
    case RARITY.SP:
      return colors.rarity.sp.replace(/[\d.]+\)$/g, `${0.3})`);
    case RARITY.SSR:
      return colors.rarity.ssr.replace(/[\d.]+\)$/g, `${0.3})`);
    case RARITY.SR:
      return colors.rarity.sr.replace(/[\d.]+\)$/g, `${0.3})`);
    case RARITY.R:
      return colors.rarity.r.replace(/[\d.]+\)$/g, `${0.3})`);
    case "veryHigh":
      return colors.colorOfLuck.veryHigh.replace(/[\d.]+\)$/g, `${0.3})`);
    case "medium":
      return colors.colorOfLuck.medium.replace(/[\d.]+\)$/g, `${0.3})`);
    case "veryLow":
      return colors.colorOfLuck.veryLow.replace(/[\d.]+\)$/g, `${0.3})`);
    default:
      return 'transparent'; // 默认返回透明色
  }
};

const getAlphaBgWithCount = (count, isNormal = false) => {
  // 根据抽数和卡池类型返回不同的背景颜色
  if (isNormal) {
    if (count < 10) return getAlphaBgWith("veryLow");
    else if (count < 15) return getAlphaBgWith("medium");
    else return getAlphaBgWith("veryHigh");
  } else {
    if (count < 31) return getAlphaBgWith("veryLow");
    else if (count < 41) return getAlphaBgWith("medium");
    else return getAlphaBgWith("veryHigh");
  }
};

// 历史记录分页逻辑
const currentPage = ref(1);
const itemsPerPage = ref(10);
const pageInput = ref(1);

const fullHistory = computed(() => {
  let filteredData = [];
  if (CurrentSelectedPool.value === 'Normal') {
    filteredData = [...NormalGachaData.value];
  } else {
    if (LimitGachaData.value.length === 0) return [];
    filteredData = [...LimitGachaData.value]
    if (CurrentSelectedPool.value !== 'Limited') {
      filteredData = filteredData.filter(record => record.gacha_id === Number(CurrentSelectedPool.value));
    }
  }
  return filteredData.sort((a, b) => b.created_at - a.created_at || b.id - a.id).map(record => {
    const cardInfo = getCardInfoAndRemovePrefix(record.item_id);
    const defaultCard = { name: `未知角色 (${record.item_id})`, rarity: RARITY.R, imageUrl: '/images/cards/placeholder.webp' };
    const createdAt = new Date(record.created_at * 1000);
    const formattedDate = `${createdAt.getFullYear().toString()}/${String(createdAt.getMonth() + 1).padStart(2, '0')}/${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}:${String(createdAt.getSeconds()).padStart(2, '0')}`;
    return { ...(cardInfo || defaultCard), gacha_id: record.id, date: formattedDate };
  });
});

const totalPages = computed(() => Math.ceil(fullHistory.value.length / itemsPerPage.value));
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return fullHistory.value.slice(start, end);
});
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

// 跳转到指定页面的函数
const goToPage = () => {
  const page = Math.floor(Number(pageInput.value));
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  } else {
    // 如果输入无效，则将输入框的值重置为当前页码
    pageInput.value = currentPage.value;
  }
};

// 监听限定卡池选择变化，重置页码为1
watch(CurrentSelectedPool, () => {
  currentPage.value = 1;
});

// 监听 currentPage 的变化，同步更新输入框的值
watch(currentPage, (newPage) => {
  pageInput.value = newPage;
});

// 监听 itemsPerPage 的变化，重置页码为1
watch(itemsPerPage, () => {
  currentPage.value = 1;
  // 更新最小高度以适应新的每页条数
  nextTick(() => {
    const fullHistoryList = document.querySelector('.full-history-list');
    if (fullHistoryList) {
      fullHistoryList.style.minHeight = `${itemsPerPage.value * 64}px`;
    }
  });
});

// 将 'rgba(r, g, b, a)' 格式的颜色字符串转换为 'AARRGGBB'
const getExcelColor = (rgbaColor) => {
  // 使用正则表达式从 'rgba(r, g, b, a)' 中提取出 r, g, b, a 的值
  const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)/);
  if (match) {
    // 将数字转换为十六进制
    const toHex = (c) => {
      const hex = Number(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    const r = toHex(match[1]);
    const g = toHex(match[2]);
    const b = toHex(match[3]);
    // a的值是0-1的小数，需要转换为0-255的整数
    const a = toHex(Math.round(parseFloat(match[4]) * 255));
    // 拼接成 'AARRGGBB' 格式并转为大写
    return `${a}${r}${g}${b}`.toUpperCase();
  }
  // 如果格式不匹配，打印警告并返回一个默认颜色（黑色）
  logger.warn(`颜色格式非RGBA或无法解析: ${rgbaColor}, 已默认使用纯黑色。`);
  return 'FF000000';
};

// 下载压缩后的JSON源数据
const downloadCompressedData = () => {
  if (!jsonInput.value.trim()) {
    alert('没有可供下载的数据。');
    return;
  }
  try {
    let parsedData = JSON.parse(jsonInput.value);

    // 如果数据已经是压缩格式，直接下载
    if (parsedData && parsedData.compressed === true) {
      const blob = new Blob([jsonInput.value], { type: 'application/json;charset=utf-8' });
      FileSaver.saveAs(blob, `gacha-records-${playerId.value || 'data'}-compressed.json`);
      return;
    }

    // 如果不是，则进行压缩
    const uint8Array = pako.gzip(JSON.stringify(parsedData));
    let binaryString = '';
    // 将 Uint8Array 转换为二进制字符串
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    // Base64 编码
    const base64Data = btoa(binaryString);

    const outputObject = {
      compressed: true,
      data: base64Data,
    };

    const blob = new Blob([JSON.stringify(outputObject, null, 2)], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `gacha-records-${playerId.value || 'data'}-compressed.json`);
  } catch (e) {
    alert(`处理数据时出错，请检查JSON格式是否正确: ${e.message}`);
  }
};

// (仅开发环境) 下载解压后的JSON源数据
const downloadDecompressedData = () => {
  if (!jsonInput.value.trim()) {
    alert('没有可供下载的数据。');
    return;
  }
  let finalData;
  try {
    let parsedData = JSON.parse(jsonInput.value);

    // 如果是压缩格式，则解压
    if (parsedData && parsedData.compressed === true && typeof parsedData.data === 'string') {
      const binaryString = atob(parsedData.data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decompressedString = pako.inflate(bytes, { to: 'string' });
      finalData = JSON.parse(decompressedString);
    } else {
      // 如果不是，则直接使用
      finalData = parsedData;
    }

    // 格式化JSON并创建下载链接
    const prettyJson = JSON.stringify(finalData, null, 3);
    const blob = new Blob([prettyJson], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `gacha-records-${playerId.value || 'data'}-decompressed.json`);
  } catch (e) {
    alert(`处理或解析数据时出错: ${e.message}`);
  }
};


// 将抽卡记录导出为 Excel 文件
const exportToExcel = async (filename, historyData) => {
  if (historyData.length === 0) {
    alert('没有数据可供导出。');
    return;
  }
  // 创建工作簿和工作表
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('抽卡记录');
  // 设置表头和列宽
  worksheet.columns = [
    { header: '序号', key: 'id', width: 10 },
    { header: '角色名称', key: 'name', width: 25 },
    { header: '稀有度', key: 'rarity', width: 10 },
    { header: '抽到时间', key: 'date', width: 35 }
  ];
  // 设置表头样式
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, name: '黑体', family: 4, size: 14 }; // 首选无衬线字体
  // 定义不同稀有度的样式
  const rarityStyles = {
    SP: {
      font: { color: { argb: getExcelColor('colors.rarity.sp') }, bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: getExcelColor('colors.brand.hover') } }
    },
    SSR: { font: { color: { argb: getExcelColor('colors.rarity.ssr') }, bold: true } },
    SR: { font: { color: { argb: getExcelColor('colors.rarity.sr') } } },
    R: { font: { color: { argb: getExcelColor('colors.rarity.r') } } },
  };
  const defaultStyle = { font: { color: { argb: getExcelColor('colors.text.primary') } } };
  // 遍历数据并添加行，同时应用样式，同时加上序号，最旧的数据为1，最新的数据为最大值
  let index = historyData.length
  historyData.forEach(item => {
    const { name, rarity, date } = item;
    // 根据稀有度选择样式
    const baseStyle = rarityStyles[rarity] || defaultStyle
    const style = { ...baseStyle, font: { ...baseStyle.font, name: '黑体', family: 4, size: 14 } }; // 首选无衬线字体
    // 添加一行数据
    const row = worksheet.addRow({ id: index--, name, rarity, date });
    // 为该行的每个单元格应用样式
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.style = style;
    });
  });
  // 设置冻结窗格和自动筛选
  // 冻结首行
  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];
  // 在第一行开启自动筛选
  worksheet.autoFilter = {
    from: 'A1',
    to: { row: 1, column: worksheet.columns.length }
  };
  // 生成文件并使用 FileSaver.js 来保存文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  FileSaver.saveAs(blob, filename);
};

// 导出抽卡记录的函数
const exportPoolData = () => {
  exportToExcel('盲盒派对' + CARDPOOLS_NAME_MAP[CurrentSelectedPool.value] + '抽卡记录.xlsx', fullHistory.value);
};
</script>

<style scoped>
.background {
  min-height: 100vh;
  background-color: v-bind('colors.background.primary');
  color: v-bind('colors.text.primary');
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5vw;
}

.gacha-analysis-container {
  background-color: v-bind('colors.background.content');
  padding: 15px;
  margin: 10px;
  min-width: 300px;
  width: 500px;
  border-radius: 12px;
}

/* --- 上传记录区域 --- */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}

.input-title {
  font-size: 1.8rem;
  margin: 0;
}

.input-description {
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
  margin: 0;
}

.json-textarea {
  min-height: 200px;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind(colorBorderPrimary);
  /* 假设定义了 colorBorderPrimary */
  border-radius: 8px;
  color: v-bind('colors.text.primary');
  padding: 12px;
  font-size: 0.85rem;
  resize: vertical;
  width: auto;
}

.json-textarea:focus {
  outline: none;
  border-color: v-bind('colors.brand.primary');
}

.button-group {
  display: flex;
  gap: 12px;
}

.cloud-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid v-bind('colors.background.light');
}

.cloud-input {
  padding: 12px;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind(colorBorderPrimary);
  border-radius: 8px;
  color: v-bind('colors.text.primary');
  font-size: 1rem;
}

.cloud-input:focus {
  outline: none;
  border-color: v-bind('colors.brand.primary');
}

.action-button {
  flex-grow: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: v-bind('colors.brand.hover');
}

.file-upload-button {
  text-align: center;
}

.error-message {
  color: v-bind('colors.status.error');
  background-color: v-bind('colors.status.errorBg');
  border: 1px solid v-bind('colors.status.error');
  padding: 10px;
  border-radius: 8px;
  margin: 0;
  font-size: 0.9rem;
  word-break: break-word;
}

/* --- 分析结果区域 --- */
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
  /* 两端对齐，左边靠左，右边靠右 */
  justify-content: space-between;
  /* 垂直居中对齐 */
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
  /* 为防止和背景颜色相近，暂时使用金色 */
}

.tertiary-text {
  margin-top: 10px;
  color: v-bind('colors.text.tertiary');
  font-size: 0.9rem;
}

/* 统计数据概览 */
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

/* 导航栏样式 */
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
  /* 贴在边框上 */
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

/* 数量统计网格布局 */
.quantity-statistics-list,
.character-overview-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, 72px);
  gap: 6px;
  justify-content: center;
}

/* --- 适配 Webkit 内核浏览器 (Chrome, Edge, Safari) --- */
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

/* 卡片样式 */
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

/* 卡片内头像样式 */
.quantity-avatar,
.overview-avatar {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  /* 方形圆角 */
  object-fit: cover;
  margin-bottom: 4px;
  background-color: v-bind('colors.background.avatar');
}

/* 卡片内名称样式 */
.quantity-name,
.overview-name {
  font-weight: bold;
  font-size: 0.7rem;
  color: v-bind('colors.text.primary');
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 名称过长时显示省略号 */
}

.quantity-pull-count,
.overview-pull-count {
  font-size: 1rem;
  font-weight: bold;
  color: v-bind('colors.text.highlight');
}

/* 确保 “无记录” 提示能横跨整个网格 */
.no-history-text.full-width {
  grid-column: 1 / -1;
  /* 横跨所有列 */
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

/* 完整抽卡历史 */
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
  /* 设置最小宽度防止记录不够时页面跳动 */
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

/* 不同稀有度的左边框颜色 */
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

/* 不同稀有度的文字颜色 */
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

/* 分页控制 */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
  margin-top: 8px;
}

/* 分页输入框样式 */
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

/* 隐藏数字输入框的上下箭头 */
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

<template>
  <div class="background">
    <div v-if="viewState === 'input'" class="gacha-analysis-container">
      <div class="input-section">
        <h2 class="input-title">抽卡记录分析</h2>
      </div>

      <div class="cloud-section">
        <p class="input-description">使用您的激活码读取云端的抽卡记录。<br />（请先使用小程序导出抽卡记录并上传！）</p>
        <p class="input-description highlight">小程序码和教程请见下方（PC端在右侧）<br />织夜工具箱所有工具均使用同一个激活码</p>
        <input type="text" v-model="fetchPlayerIdInput" class="cloud-input" placeholder="请输入您的玩家ID" />
        <input type="text" v-model="fetchLicenseInput" class="cloud-input" placeholder="请输入您的激活码（与导出工具相同）" />
        <p class="input-description">使用则代表您同意<a class="highlight" @click="openAgreementPopUp" href="#">《织夜云服务用户协议》</a>
          <br />
          上传记录可能会有延迟，如果没更新请稍后查询
        </p>
        <div class="button-group">
          <!-- <button @click="handleOnlineUpdate" :disabled="isFetchingOnline" class="action-button">
              {{ isFetchingOnline ? '正在在线获取...' : '在线获取' }}
            </button> -->
          <button @click="handleGetRecord" :disabled="isFetchingOnline" class="action-button">读取抽卡记录</button>
        </div>
        <p v-if="cloudMessage" class="success-message">{{ cloudMessage }}</p>
        <p v-if="cloudErrorMessage" class="error-message">{{ cloudErrorMessage }}</p>
      </div>

      <div class="input-section split">
        <p class="input-description">请在下方文本框粘贴您的抽卡记录数据<br />或点击按钮上传导出的json文件。</p>
        <textarea v-model="jsonInput" id="jsonInput" class="json-textarea"
          placeholder='请在此处粘贴小程序复制的数据... 例如：{"cloud":true,"compressed":true,"data":"H4sIAAAAAAAAA53dya7s...99vsvX//3t//537//9399/Tr9/v9asS3vop0CAA=="}'></textarea>
        <div class="button-group">
          <button @click="handleJsonAnalysis" class="action-button" :disabled="isFetchingOnline">开始分析</button>
          <button @click="triggerFileUpload" class="action-button" :disabled="isFetchingOnline">上传文件</button>
          <input type="file" ref="fileUploader" @change="handleFileUpload" accept=".json,application/json"
            style="display: none;" />
        </div>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    </div>
    <div v-if="viewState === 'input'" class="gacha-analysis-container">

      <div class="mp-weixin">
        <p>使用小程序获取抽卡记录<br /><span class="highlight">微信搜索“织夜工具箱”或扫描小程序码</span></p>
        <a href="weixin://dl/business/?appid=wx1e9dcc30a4481663">
          <img src="/images/mp_weixin.jpg" class="mp-weixin-image" />
        </a>
        <p>使用教程</p>
        <div style="width: 100%; position: relative; padding-bottom: 56.25%; height: 0;">
          <iframe
            src="//player.bilibili.com/player.html?isOutside=true&aid=115111482167059&bvid=BV1ZZhXzGEVd&cid=32027246871&p=1&autoplay=0"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" scrolling="no" border="0"
            frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
        </div>
      </div>

      <p class="input-description"><span class="highlight"></span><br />
        需要帮助？加入 <a class="highlight"
          href="https://qm.qq.com/cgi-bin/qm/qr?k=ntxYu3FuRWgafpUguLeKdaFSt06y-TiO&jump_from=webapi&authKey=8LzsxinzBKbO6rvvvtQ4JSzXsBJDmv/1SGhBQhmoDqI8XHekcmVNpqDkE+MbzbBw"
          target="_blank">
          Q群1049576192</a> 愉快交流吧
      </p>
      <p class="input-description">当前版本：v{{ appVersion }}</p>
    </div>

    <GachaAnalysis v-if="viewState === 'analysis'" :limit-gacha-data="LimitGachaData"
      :normal-gacha-data="NormalGachaData" :advanced-normal-gacha-data="AdvanceNormalGachaData"
      :qi-yuan-gacha-data="QiYuanGachaData" :wish-gacha-data="WishGachaData" :player-id="playerId"
      :json-input="jsonInput" :LIMITED_CARD_POOLS_ID="LIMITED_CARD_POOLS_ID" :CARDPOOLS_NAME_MAP="CARDPOOLS_NAME_MAP"
      @reset-view="resetView" />

    <div class="gacha-analysis-container" v-if="viewState === 'analysis'">
      <div class="cloud-section">
        <p class="input-title">织夜云服务</p>
        <p class="input-description">手动将当前的抽卡记录上传至云端</p>
        <p class="input-description highlight">普通用户每24小时在所有工具内只能上传一次！</p>
        <input type="text" v-model="uploadLicenseInput" class="cloud-input" placeholder="请输入您的激活码（与导出工具相同）" />
        <p class="input-description">使用本服务则代表您同意<a class="highlight" @click="openAgreementPopUp" href="#">《织夜云用户协议》</a>
        </p>
        <button @click="handleUploadRecord" :disabled="isUploading" class="action-button">
          {{ isUploading ? '正在上传...' : '上传抽卡记录' }}
        </button>
        <p v-if="cloudMessage" class="success-message">{{ cloudMessage }}</p>
        <p v-if="cloudErrorMessage" class="error-message">{{ cloudErrorMessage }}</p>
      </div>
    </div>
    <PopUp :display="showAgreementPopUp" title="《织夜云服务用户协议》" @close="closeAgreementPopUp">
      <p>欢迎使用织夜云服务！<br />在使用前，请您仔细阅读以下用户协议：</p>
      <ol class="agreement-list">
        <li>
          <strong>服务描述与接受条款：</strong>
          本服务（“织夜云”）是一个为《盲盒派对》玩家提供抽卡记录上传、存储和分析的辅助工具。您点击“我已阅读并同意”按钮并继续使用本服务，即表示您已同意并接受本协议的所有条款。
        </li>
        <li>
          <strong>用户责任：</strong> 您应对您上传的数据以及您的激活码和玩家ID的准确性负全部责任。请妥善保管您的激活码，任何通过您激活码进行的操作，都将被视为您本人的行为。
        </li>
        <li>
          <strong>数据使用与隐私保护：</strong>
          我们承诺保护您的个人隐私。您上传的原始抽卡记录将与您的玩家ID关联存储。我们可能会将您的数据（在去除所有可识别的个人身份信息，如玩家ID后）用于匿名的统计分析，以改善服务或生成宏观的游戏数据报告。我们不会将您的个人数据与任何第三方分享，除非法律法规另有规定。
        </li>
        <li>
          <strong>退出服务：</strong> 如果您希望退出本服务，可以随时停止使用。对于已上传的数据，您可以通过关于页的联系方式或加入QQ群组与我们联系并要求删除数据。
        </li>
        <li>
          <strong>服务变更、中断或终止：</strong> 本服务目前免费提供。我们保留随时修改、中断或终止服务的权利，恕不另行通知。我们不保证服务的永久可用性。
        </li>
        <li>
          <strong>免责说明：</strong>
          因黑客攻击、服务器故障、自然灾害等不可抗力因素导致的数据丢失、损坏或泄露，我们将尽力恢复，但不承担任何法律责任。强烈建议您在上传云端的同时，也在本地保留一份数据备份。您对自己上传的原始抽卡记录拥有完整的所有权，本网站不对数据真实性提供担保。您通过本服务获取抽卡记录的行为视为您本人的自愿行为，我们不对您在使用本工具时导致您抽卡记录，游戏账号等的任何直接或间接损失承担责任。
        </li>
        <li>
          <strong>协议修改：</strong> 我们有权根据需要不时地修改本协议。协议修改后，如果您继续使用本服务，即视为您已接受修改后的协议。
        </li>
      </ol>
      <button @click="closeAgreementPopUp" class="action-button">我已阅读并同意</button>
    </PopUp>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import pako from 'pako';
import { logger } from '@/utils/logger.js';
import { verifyLicense } from '@/utils/licenseManager.js';
import { colors } from '@/styles/colors.js';

import GachaAnalysis from '@/components/GachaAnalysis.vue'; // 导入分析结果展示组件
import PopUp from '@/components/PopUp.vue'; // 导入弹窗组件

const appVersion = __VERSION__;

const viewState = ref('input'); // 'input' 为用户输入模式 'analysis' 则展示分析结果
const jsonInput = ref(''); // 存储用户输入的 JSON 数据
const playerId = ref(''); // 存储玩家ID
const LimitGachaData = ref([]); // 存储限定卡池抽卡记录
const NormalGachaData = ref([]); // 存储常驻卡池抽卡记录
const AdvanceNormalGachaData = ref([]); // 存储高级常驻卡池抽卡记录
const QiYuanGachaData = ref([]); // 存储祈愿盲盒卡池抽卡记录
const WishGachaData = ref([]); // 存储心愿自选卡池抽卡记录

const errorMessage = ref('');
const showAgreementPopUp = ref(false); // 控制用户协议弹窗显示
const isDev = import.meta.env.DEV;

const LIMITED_CARD_POOLS_ID = ['29', '40', '41', '42', '43', "44", "46", "48", "49", "50", "51", "52", "53", "54", "55", "58", "59", "107"]; // 限定卡池ID列表
const CARDPOOLS_NAME_MAP = {
  'Normal': '常驻扭蛋',
  'Limited': '限定扭蛋',
  'AdvanceNormal': '高级常驻扭蛋',
  'QiYuan': '祈愿盲盒',
  'Wish': '心愿自选',
  '9': '常驻扭蛋',
  '29': '车手盲盒机',
  '40': '塔菲扭蛋',
  '41': '童话国盲盒机',
  '42': '扭蛋大作战-海军',
  '43': '早稻叽',
  '44': '仲夏扭蛋',
  '46': '车手盲盒机-复刻1',
  '47': '祈愿盲盒',
  '48': '童话国盲盒机-复刻1',
  '49': '游园邀请',
  '50': '暮色邀请函',
  '51': '塔菲扭蛋-复刻1',
  '52': '车手盲盒机-复刻2',
  '53': '萌鬼认可证',
  '54': '早稻叽-复刻1',
  '55': '超频扭蛋机',
  '58': '厨娘来啦！',
  '59': '仲夏扭蛋-复刻1',
  '107': '地下车手招募',
  '1000': '心愿自选',
  '10000': '高级常驻扭蛋'
};

// 本地保存激活码
const LICENSE_KEY = 'gachaLicenseKey';
const PLAYER_ID_KEY = 'gachaPlayerId';

// 客户端冷却时间配置
const FRONTEND_COOLDOWNS = {
  // 读取记录 (get-record)
  getRecord: {
    admin: 30 * 1000,           // 管理员: 30秒
    subscribed: 3 * 60 * 1000,  // 订阅用户: 3分钟
    normal: 30 * 60 * 1000,     // 普通用户: 30分钟
  },
  // 在线获取记录 (start-update-task)
  onlineUpdate: {
    admin: 1 * 60 * 60 * 1000,            // 管理员: 1小时
    subscribed: 24 * 60 * 60 * 1000,  // 订阅用户: 24小时
    normal: 'unavailable',            // 普通用户: 不可用
  },
  // 手动上传记录 (upload-record)
  uploadRecord: {
    admin: 5 * 60 * 1000,            // 管理员: 5分钟
    subscribed: 1 * 60 * 60 * 1000,  // 订阅用户: 1小时
    normal: 12 * 60 * 60 * 1000,     // 普通用户: 12小时
  },
};

// 通过按钮来驱动Input
const fileUploader = ref(null);
const triggerFileUpload = () => {
  fileUploader.value.click();
};

const loadInputData = () => {
  const savedKey = localStorage.getItem(LICENSE_KEY);
  const savedPlayerId = localStorage.getItem(PLAYER_ID_KEY);
  if (savedKey) {
    fetchLicenseInput.value = savedKey;
    uploadLicenseInput.value = savedKey;
  }
  if (savedPlayerId) {
    fetchPlayerIdInput.value = savedPlayerId;
  }
};

const saveInputData = (key = null, playerId = null) => {
  if (key) {
    localStorage.setItem(LICENSE_KEY, key);
  }
  if (playerId) {
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  loadInputData();
};

onMounted(() => {
  // 页面加载时，尝试从localStorage加载已保存的激活码
  loadInputData();
});

// 云端获取抽卡记录相关的变量
const fetchPlayerIdInput = ref(''); // 绑定的玩家ID输入框
const fetchLicenseInput = ref(''); // 绑定的许可证输入框
const cloudMessage = ref(''); // 织夜云的成功消息
const cloudErrorMessage = ref(''); // 织夜云的错误信息
const isFetchingOnline = ref(false); // 是否正在在线获取数据的状态
// const pollingIntervalId = ref(null); // 存储轮询的定时器ID

// 上传抽卡记录相关的变量
const uploadLicenseInput = ref('');
const isUploading = ref(false);


// 分析 JSON 数据
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
    if (parsedData?.compressed && typeof parsedData.data === 'string') {
      try {
        // Base64 解码
        const binaryString = atob(parsedData.data);
        const bytes = new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i));
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

  // 数据验证检查
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
  if (!Object.values(playerData).some(Array.isArray)) {
    errorMessage.value = '数据格式错误：未找到有效的卡池数据！';
    return;
  }

  // 默认给每条记录添加gacha_id字段
  for (const [gachaId, records] of Object.entries(playerData)) {
    if (Array.isArray(records)) {
      records.forEach(record => { if (record) record.gacha_id = Number(gachaId); });
    }
  }

  // 分离限定卡池和常驻卡池数据
  const LimitGachaRecords = [];
  const NormalGachaRecords = [];
  const AdvanceNormalRecords = []; // 用于存储高级常驻卡池的记录
  const QiYuanGachaRecords = []; // 用于存储祈愿盲盒卡池的记录
  const WishGachaRecords = []; // 用于存储心愿自选卡池的记录
  for (const [gachaId, records] of Object.entries(playerData)) {
    if (gachaId === '9') NormalGachaRecords.push(...records); // 常驻卡池ID固定为9
    else if (gachaId === '10000') { AdvanceNormalRecords.push(...records); }// 高级常驻卡池ID固定为10000
    else if (gachaId === '47') QiYuanGachaRecords.push(...records); // 目前祈愿盲盒卡池ID固定为47
    else if (gachaId === '1000') WishGachaRecords.push(...records); // 心愿自选卡池ID固定为1000
    else if (LIMITED_CARD_POOLS_ID.includes(gachaId)) LimitGachaRecords.push(...records);
  }

  // 验证抽卡记录格式
  const isValidRecord = item => typeof item === 'object' && item !== null && 'id' in item && 'item_id' in item && 'created_at' in item;
  if (!LimitGachaRecords.every(isValidRecord)) {
    errorMessage.value = '数据格式错误：部分限定卡池抽卡记录缺少必须字段。';
    return;
  }
  if (!NormalGachaRecords.every(isValidRecord)) {
    errorMessage.value = '数据格式错误：部分常驻卡池抽卡记录缺少必须字段。';
    return;
  }
  if (!AdvanceNormalGachaData.value.every(isValidRecord)) {
    errorMessage.value = '数据格式错误：部分高级常驻卡池抽卡记录缺少必须字段。';
    return;
  }
  if (!QiYuanGachaData.value.every(isValidRecord)) {
    errorMessage.value = '数据格式错误：部分祈愿盲盒卡池抽卡记录缺少必须字段。';
    return;
  }
  if (!WishGachaData.value.every(isValidRecord)) {
    errorMessage.value = '数据格式错误：部分心愿自选卡池抽卡记录缺少必须字段。';
    return;
  }

  LimitGachaData.value = LimitGachaRecords;
  NormalGachaData.value = NormalGachaRecords;
  AdvanceNormalGachaData.value = AdvanceNormalRecords;
  QiYuanGachaData.value = QiYuanGachaRecords;
  WishGachaData.value = WishGachaRecords;
  viewState.value = 'analysis'; // 切换到分析视图
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
  reader.onerror = () => errorMessage.value = '读取文件时发生错误。';
  reader.readAsText(file);
  // 清空事件
  event.target.value = '';
};

// 获取worker的URL，开发模式下使用地址+8787端口，生产模式下直接使用当前地址
const WorkerUrl = ref('');
onMounted(() => {
  const url = new URL(window.location.href);
  if (isDev) {
    WorkerUrl.value = `${url.protocol}//${url.hostname}:8787`;
  } else {
    WorkerUrl.value = url.origin;
  }
});

const milisecondsToTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours > 0 ? hours + '小时 ' : ''}${minutes > 0 || hours > 0 ? minutes % 60 + '分钟 ' : ''}${seconds % 60}秒`;
};

/**
 * 统一获取功能的冷却时间
 * @param {'getRecord' | 'onlineUpdate' | 'uploadRecord'} type - 功能类型
 * @returns {{locked: boolean, timeLeft: number}}
 */
const getCooldown = (type) => {
  const lockKey = `gachaCooldownLock_${type}`;
  try {
    const lockInfo = localStorage.getItem(lockKey);
    if (!lockInfo) return { locked: false, timeLeft: 0 };

    const { expiry } = JSON.parse(lockInfo);

    if (Date.now() > expiry) {
      localStorage.removeItem(lockKey);
      return { locked: false, timeLeft: 0 };
    }
    return { locked: true, timeLeft: expiry - Date.now() };
  } catch (error) {
    logger.error(`获取 ${type} 的冷却状态时出错:`, error);
    return { locked: true, timeLeft: -1 }; // 返回-1表示错误
  }
};

/**
 * 统一设置功能的冷却时间
 * @param {'getRecord' | 'onlineUpdate' | 'uploadRecord'} type - 功能类型
 * @param {boolean} isAdmin - 是否为管理员
 * @param {boolean} isExpired - 激活码是否过期 (true代表普通用户, false代表订阅用户)
 * @param {number} [overrideDuration] - 可选，用于覆盖配置中的默认时长（例如，从后端获取的精确剩余时间）
 */
const setCooldown = (type, isAdmin, isExpired, overrideDuration = null) => {
  const userType = isAdmin ? 'admin' : (isExpired ? 'normal' : 'subscribed');

  // 如果是普通用户且功能不可用，则直接返回
  if (FRONTEND_COOLDOWNS[type][userType] === 'unavailable') {
    return;
  }

  const duration = overrideDuration ?? FRONTEND_COOLDOWNS[type][userType];

  if (duration <= 0) {
    // 如果时长为0或负数，则表示解除锁定
    localStorage.removeItem(`gachaCooldownLock_${type}`);
    return;
  }

  const expiryTime = Date.now() + duration;
  const lockInfo = JSON.stringify({ expiry: expiryTime });
  const lockKey = `gachaCooldownLock_${type}`;

  try {
    localStorage.setItem(lockKey, lockInfo);
  } catch (error) {
    logger.error(`设置 ${type} 的冷却状态时出错:`, error);
    cloudErrorMessage.value = '设置功能锁定状态失败，请检查浏览器本地存储。';
  }
};


const CACHE_PREFIX = 'gachaRecord_';
/**
 * 管理本地缓存的抽卡记录，实现LRU（最近最少使用）策略。
 * @param {string} userID - 要缓存数据的用户ID。
 * @param {string} data - 要缓存的抽卡记录数据（Base64字符串）。
 */
const addRecordToCache = (userID, data) => {
  try {
    // 获取当前的访问顺序列表
    let order = JSON.parse(localStorage.getItem("gachaRecord_access_order")) || [];

    // 如果此用户已在缓存中，先从顺序列表中移除，稍后会加到末尾
    const existingIndex = order.indexOf(userID);
    if (existingIndex > -1) {
      order.splice(existingIndex, 1);
    }

    // 检查缓存是否已满
    if (order.length >= 5) {
      // 如果已满，移除最久未使用的记录（列表的第一个元素）
      const oldestUserID = order.shift(); // .shift()会移除并返回数组的第一个元素
      localStorage.removeItem(CACHE_PREFIX + oldestUserID);
      logger.log(`缓存已满，已移除最旧的记录: ${oldestUserID}`);
    }

    // 将新记录的ID添加到列表末尾，标记为最新
    order.push(userID);

    // 存入新数据和更新后的顺序列表
    localStorage.setItem(CACHE_PREFIX + userID, data);
    localStorage.setItem("gachaRecord_access_order", JSON.stringify(order));

    logger.log(`记录 ${userID} 已成功缓存。当前缓存顺序:`, order);

  } catch (error) {
    logger.error("管理本地缓存时出错:", error);
    // 如果发生错误，清空所有的缓存记录
    for (const key in localStorage) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    // 清空访问顺序列表
    localStorage.removeItem("gachaRecord_access_order");

    cloudErrorMessage.value = '管理本地缓存失败，可能存储已满。';
  }
};

// 获取记录成功后保存到本地
const saveFetchedRecord = (userID, data) => {
  addRecordToCache(userID, data);
};
// 在云端不可用时，尝试读取本地存储的记录
const loadLocalRecord = (userID) => {
  try {
    const data = localStorage.getItem(`gachaRecord_${userID}`);
    return data;
  } catch (error) {
    logger.error("从本地存储加载记录时出错:", error);
  }
  return null;
};

// 处理云端获取抽卡记录的函数
const handleGetRecord = async () => {
  cloudMessage.value = '';
  cloudErrorMessage.value = '';
  if (!fetchLicenseInput.value.trim()) {
    cloudErrorMessage.value = '请输入激活码！';
    return;
  }
  const licenseKey = fetchLicenseInput.value.trim();
  const fetchPlayerId = fetchPlayerIdInput.value.trim();
  if (!fetchPlayerId || isNaN(fetchPlayerId)) {
    cloudErrorMessage.value = '玩家ID必须为数字且不能为空！';
    return;
  }
  isFetchingOnline.value = true;
  try {
    logger.log("正在客户端验证激活码...");
    const result = verifyLicense(licenseKey);
    if (!result.success) throw new Error(result.message || '激活码验证失败，请检查激活码是否正确。');

    const isAdmin = String(result.userId).length === 9 && String(result.userId).startsWith('33');
    if (!isAdmin && String(result.userId) !== fetchPlayerId) {
      throw new Error(`激活码与玩家ID不匹配！`);
    }

    // 使用统一的冷却时间检查函数
    const lockTime = getCooldown('getRecord');
    if (lockTime.locked && lockTime.timeLeft > 0) {
      // --- 新增：检查并使用本地缓存 ---
      const localData = loadLocalRecord(fetchPlayerId);
      if (localData) {
        logger.warn(`读取请求处于冷却中，当前展示的是本地缓存数据。剩余冷却时间: ${milisecondsToTime(lockTime.timeLeft)}`);
        const wrappedJson = { cloud: true, compressed: true, data: localData };
        jsonInput.value = JSON.stringify(wrappedJson);
        cloudMessage.value = `服务器繁忙，已从本地缓存读取记录...`;
        handleJsonAnalysis();
        cloudMessage.value = '';
        return; // 使用缓存后，终止后续网络请求
      }
      // 如果没有缓存，才提示冷却中
      cloudErrorMessage.value = `查询次数已达上限，请在 ${milisecondsToTime(lockTime.timeLeft)} 后再试。`;
      return;
    } else if (lockTime.locked && lockTime.timeLeft === -1) {
      cloudErrorMessage.value = '获取查询状态失败，请检查浏览器的本地存储设置。';
      return;
    }
    logger.log(`客户端验证成功`);

    cloudMessage.value = '正在查询中...';
    // 验证通过后，将激活码发送给Worker进行最终验证和数据获取
    const response = await fetch(`${WorkerUrl.value}/get-record`, {
      method: 'GET',
      headers: { 'X-License-Key': licenseKey, 'X-Player-ID': fetchPlayerId },
    });
    if (response.ok) {
      saveInputData(licenseKey, fetchPlayerId); // 保存激活码和玩家ID
      // 使用统一的冷却时间设置函数
      setCooldown('getRecord', isAdmin, result.isExpired);
    } else {
      // 即使请求失败，也设置一个较短的冷却时间，防止恶意请求
      setCooldown('getRecord', isAdmin, result.isExpired, 60 * 1000); // 失败时锁定1分钟
      throw new Error(await response.text() || `服务器错误: ${response.status}`);
    }

    const compressedString = await response.text();
    saveFetchedRecord(fetchPlayerId, compressedString); // 保存到本地存储
    const wrappedJson = { cloud: true, compressed: true, data: compressedString };
    jsonInput.value = JSON.stringify(wrappedJson);
    cloudMessage.value = '已成功获取云端记录，正在分析中...';
    handleJsonAnalysis(); // 调用已有的分析逻辑分析合成的json
    cloudMessage.value = '';
  } catch (error) {
    logger.error(error);
    cloudErrorMessage.value = `查询失败：${error.message}`;
    cloudMessage.value = '';
  } finally {
    isFetchingOnline.value = false;
  }
};

// ==========（暂时停用）===========
// 轮询函数
// const pollTaskStatus = async (playerId, licenseKey) => {
//   logger.log(`正在轮询玩家 ${playerId} 的任务状态`);
//   try {
//     // 注意：这里的路由是 /task-status/:playerId
//     const response = await fetch(`${WorkerUrl.value}/task-status/${playerId}`);
//     if (!response.ok) {
//       throw new Error(`无法获取任务状态: ${response.status}`);
//     }
//     const data = await response.json();

//     if (data.success) {
//       cloudMessage.value = data.progress || '正在处理...';

//       // 任务完成或失败，停止轮询
//       if (data.status === 'completed' || data.status === 'failed') {
//         stopPolling();
//         isFetchingOnline.value = false;

//         if (data.status === 'completed') {
//           cloudMessage.value = data.progress + "已上传！"; // 显示最终成功信息
//           // 任务成功后，设置前端冷却锁
//           const licenseInfo = verifyLicense(licenseKey);
//           const isAdmin = String(licenseInfo.userId).length === 9 && String(licenseInfo.userId).startsWith('33');
//           setCooldown('onlineUpdate', isAdmin, licenseInfo.isExpired);

//           // 重新读取一次完整的云端记录来刷新页面
//           await handleGetRecord();
//         } else { // status === 'failed'
//           cloudErrorMessage.value = `任务失败: ${data.error}`;
//         }
//       }
//     } else {
//       throw new Error(data.message || '获取状态失败');
//     }
//   } catch (error) {
//     logger.error("轮询时出错:", error);
//     cloudErrorMessage.value = `查询状态时出错: ${error.message}`;
//     stopPolling();
//     isFetchingOnline.value = false;
//   }
// };
// 启动轮询
// const startPolling = (playerId, licenseKey) => {
//   stopPolling(); // 先确保没有正在运行的轮询
//   isFetchingOnline.value = true;
//   cloudMessage.value = "正在获取最新状态...";
//   // 立即执行一次，然后设置定时器
//   pollTaskStatus(playerId, licenseKey);
//   pollingIntervalId.value = setInterval(() => pollTaskStatus(playerId, licenseKey), 7000); // 每7秒轮询一次
// };

// 停止轮询
// const stopPolling = () => {
//   if (pollingIntervalId.value) {
//     clearInterval(pollingIntervalId.value);
//     pollingIntervalId.value = null;
//   }
// };

// 在线更新主函数
// const handleOnlineUpdate = async () => {
//   isFetchingOnline.value = true;
//   cloudErrorMessage.value = '';
//   cloudMessage.value = '';

//   const playerId = fetchPlayerIdInput.value.trim();
//   const licenseKey = fetchLicenseInput.value.trim();

//   if (!licenseKey || !playerId) {
//     cloudErrorMessage.value = '请输入玩家ID和激活码！';
//     return;
//   }

//   try {
//     // 客户端预验证
//     const result = verifyLicense(licenseKey);
//     if (!result.success) {
//       throw new Error(result.message || '激活码验证失败。');
//     }
//     const isAdmin = String(result.userId).length === 9 && String(result.userId).startsWith('33');

//     // 普通用户不可用
//     if (!isAdmin && result.isExpired) {
//       cloudErrorMessage.value = '普通会员暂时无法使用在线获取功能。';
//       isFetchingOnline.value = false;
//       return;
//     }

//     // 检查前端冷却锁
//     const lock = getCooldown('onlineUpdate');
//     if (lock.locked) {
//       if (lock.timeLeft > 0) {
//         cloudErrorMessage.value = `请求过于频繁，请在 ${milisecondsToTime(lock.timeLeft)} 后再试。`;
//         isFetchingOnline.value = false;
//         return;
//       } else if (lock.timeLeft === -1) {
//         throw new Error('获取本地锁定状态失败，请检查浏览器设置。');
//       }
//     }

//     cloudMessage.value = "正在连接服务器以启动更新任务...";
//     // 解除查询记录的冷却锁，以供后续调用
//     setCooldown('getRecord', isAdmin, result.isExpired, -1);


//     // 调用Worker启动任务
//     const response = await fetch(`${WorkerUrl.value}/start-update-task`, {
//       method: 'POST',
//       headers: {
//         'X-License-Key': licenseKey,
//         'X-Player-Id': playerId,
//       },
//     });

//     const data = await response.json();

//     // 检查响应是否成功，并且后端返回了成功状态
//     if (response.ok && data.success) {
//       // 任务启动成功 (status: 'started') 或已在运行 (status: 'already_running')
//       // 两种情况都直接开始轮询
//       logger.log(`Task status: ${data.status}. Starting polling for player ${playerId}.`);
//       startPolling(playerId, licenseKey);
//     } else if (response.status === 429) {
//       // 处理Worker返回的频率限制，使用后端返回的精确剩余时间
//       setCooldown('onlineUpdate', isAdmin, result.isExpired, data.timeLeft);
//       cloudErrorMessage.value = `更新过于频繁，请在 ${milisecondsToTime(data.timeLeft)} 后再试。`;
//       cloudMessage.value = '';
//       isFetchingOnline.value = false;
//     } else {
//       // 处理其他错误
//       throw new Error(data.message || `启动任务失败 (${response.status})`);
//     }

//   } catch (error) {
//     logger.error("在线更新时出错:", error);
//     cloudErrorMessage.value = error.message;
//     isFetchingOnline.value = false;
//   }
// };
// ================================

// 处理上传抽卡记录到云端
const handleUploadRecord = async () => {
  isUploading.value = true;
  cloudMessage.value = '';
  cloudErrorMessage.value = '';

  try {
    const licenseKey = uploadLicenseInput.value.trim();
    const localPlayerId = playerId.value.trim();
    if (!licenseKey || !localPlayerId) {
      throw new Error('玩家ID和激活码均不能为空。');
    }
    logger.log("正在本地验证激活码以进行上传...");
    const validationResult = verifyLicense(licenseKey);
    if (!validationResult.success) {
      throw new Error(validationResult.message || '激活码无效。');
    }

    const isAdmin = String(validationResult.userId).length === 9 && String(validationResult.userId).startsWith('33');
    const lockTime = getCooldown('uploadRecord');
    if (lockTime.locked && lockTime.timeLeft > 0) {
      cloudErrorMessage.value = `上传次数已达上限，请在 ${milisecondsToTime(lockTime.timeLeft)} 后再试。`;
      isUploading.value = false;
      return;
    } else if (lockTime.locked && lockTime.timeLeft === -1) {
      cloudErrorMessage.value = '获取上传状态失败，请检查浏览器的本地存储设置。';
      isUploading.value = false;
      return;
    }
    if (!isAdmin && String(validationResult.userId) !== localPlayerId) {
      throw new Error(`激活码与玩家ID不匹配！`);
    }
    logger.log(`本地验证成功`);

    let dataToProcess;
    const parsedInput = JSON.parse(jsonInput.value);

    // 如果输入数据是压缩格式，则解压缩
    if (parsedInput?.compressed) {
      const binaryString = atob(parsedInput.data);
      const bytes = new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i));
      dataToProcess = JSON.parse(pako.inflate(bytes, { to: 'string' }));
    } else {
      dataToProcess = parsedInput;
    }

    // 清洗数据，删除 gacha_id 字段
    const playerData = dataToProcess[localPlayerId];
    if (!playerData) {
      throw new Error(`当前JSON数据中找不到玩家ID ${localPlayerId} 的记录。`);
    }

    for (const poolId in playerData) {
      if (Array.isArray(playerData[poolId])) {
        playerData[poolId].forEach(record => {
          // 删除 gacha_id 以节省空间
          if ('gacha_id' in record && String(record.gacha_id) == poolId) {
            delete record.gacha_id;
          }
        });
      }
    }
    logger.log("数据清洗完成，已移除所有 gacha_id。");

    // 压缩数据
    const cleanedJsonString = JSON.stringify(dataToProcess);
    const compressedData = pako.gzip(cleanedJsonString);
    const finalPayload = btoa(String.fromCharCode.apply(null, compressedData));
    logger.log("数据已重新压缩并编码为Base64。");

    // 上传数据到服务器
    const response = await fetch(`${WorkerUrl.value}/upload-record`, {
      method: 'POST',
      headers: {
        'X-License-Key': licenseKey,
        'X-Player-ID': localPlayerId,
        'Content-Type': 'text/plain',
      },
      body: finalPayload,
    });

    const responseJson = await response.json(); // 服务器返回的JSON响应中message为错误信息，timeLeft为剩余锁定时间（单位：毫秒）
    if (response.ok) {
      cloudMessage.value = `抽卡记录上传成功！`;
      saveInputData(licenseKey); // 保存激活码
      setCooldown('uploadRecord', isAdmin, validationResult.isExpired);
      // 上传成功后立即取消本地的读取锁定状态
      setCooldown('getRecord', isAdmin, validationResult.isExpired, 0);
    } else if (response.status === 429) { // 后端返回“过于频繁”
      cloudErrorMessage.value = responseJson.message;
      if (responseJson.timeLeft > 0) {
        cloudErrorMessage.value += ` 请在 ${milisecondsToTime(responseJson.timeLeft)} 后再试。`;
        setCooldown('uploadRecord', isAdmin, validationResult.isExpired, responseJson.timeLeft);
      } else {
        throw new Error(cloudErrorMessage.value);
      }
    } else { // 其他错误
      throw new Error(responseJson.message || `服务器错误: ${response.status}`);
    }

  } catch (error) {
    logger.error(error);
    cloudErrorMessage.value = `上传记录时出错: ${error.message}`;
    cloudMessage.value = ''; // Clear any pending messages
  } finally {
    isUploading.value = false;
  }
};


// 打开或关闭用户协议弹窗
const openAgreementPopUp = () => showAgreementPopUp.value = true;
const closeAgreementPopUp = () => showAgreementPopUp.value = false;

// 重置网页
const resetView = () => {
  viewState.value = 'input';
  jsonInput.value = '';
  LimitGachaData.value = [];
  NormalGachaData.value = [];
  errorMessage.value = '';
  playerId.value = '';
  cloudErrorMessage.value = '';
  cloudMessage.value = '';
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

.highlight {
  color: v-bind('colors.text.highlight');
}

.json-textarea {
  min-height: 200px;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
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
  padding-top: 16px;
}

.split {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid v-bind('colors.background.light');
}

.cloud-input {
  padding: 12px;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
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
  flex: 1;
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

.action-button:hover:not(:disabled) {
  background-color: v-bind('colors.brand.hover');
}

.action-button:disabled {
  background-color: v-bind('colors.background.light');
  color: v-bind('colors.text.disabled');
  cursor: not-allowed;
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

.success-message {
  color: v-bind('colors.status.success');
  background-color: v-bind('colors.status.successBg');
  border: 1px solid v-bind('colors.status.success');
  padding: 10px;
  border-radius: 8px;
  margin: 0;
  font-size: 0.9rem;
  word-break: break-word;
}

/* 为协议列表添加样式 */
.agreement-list {
  max-height: 20rem;

  overflow-y: auto;

  /* 美化列表，增加一些内边距和边框 */
  border: 1px solid #e0e0e0;
  /* 左侧留出空间给数字序号 */
  padding: 0 0 0 20px;
  border-radius: 8px;
  background-color: v-bind('colors.shadow.primaryHover');
}

/* 列表项的样式 */
.agreement-list li {
  /* 设置行高和行间距 */
  line-height: 1.6;
  margin-bottom: 12px;
  /* 文字靠左侧对齐 */
  text-align: left;
}

/* 隐藏滚动条轨道（在兼容的浏览器中） */
.agreement-list::-webkit-scrollbar {
  width: 6px;
}

.agreement-list::-webkit-scrollbar-track {
  background: transparent;
}

.agreement-list::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.scrollbar');
  border-radius: 3px;
}

.mp-weixin-image {
  width: 128px;
  height: 128px;
  border-radius: 64px;
}

.mp-weixin {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 12px;
  color: v-bind('colors.text.primary');
  font-size: 1rem;
}
</style>

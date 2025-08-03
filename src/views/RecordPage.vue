<template>
  <div class="background">
    <div v-if="viewState === 'input'" class="gacha-analysis-container">
      <div class="input-section">
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

        <div class="cloud-section split">
          <p class="input-title">织夜云服务 BETA</p>
          <p class="input-description">【限时免费】使用激活码查询您的抽卡记录。</p>
          <input type="text" v-model="fetchPlayerIdInput" class="cloud-input" placeholder="请输入您的玩家ID" />
          <input type="text" v-model="fetchLicenseInput" class="cloud-input" placeholder="在此处输入您的激活码（与导出工具相同）" />
          <button @click="handleGetRecord" class="action-button">获取云端抽卡记录</button>
        </div>
        <p v-if="cloudErrorMessage" class="error-message">{{ cloudErrorMessage }}</p>

        <p class="input-description">本网页完全开源，可查看<a class="highlight" href="https://github.com/Thisisseanxu/gacha-party"
            target="_blank">Github链接</a>提出意见/提交代码。</p>
      </div>
    </div>

    <GachaAnalysis v-if="viewState === 'analysis'" :limit-gacha-data="LimitGachaData"
      :normal-gacha-data="NormalGachaData" :player-id="playerId" :json-input="jsonInput" @reset-view="resetView" />

    <div class="gacha-analysis-container" v-if="viewState === 'analysis'">
      <div class="cloud-section">
        <p class="input-title">织夜云服务 BETA</p>
        <p class="input-description">如果您有织夜云服务的时长，则可将当前页面的抽卡记录上传至云端（每天一次）</p>
        <input type="text" v-model="uploadLicenseInput" class="cloud-input" placeholder="在此处输入您的激活码（需有效的织夜云服务时长）" />
        <button @click="handleUploadRecord" :disabled="isUploading" class="action-button">
          {{ isUploading ? '正在上传...' : '上传记录至云端' }}
        </button>
        <p v-if="uploadMessage" class="success-message">{{ uploadMessage }}</p>
        <p v-if="uploadErrorMessage" class="error-message">{{ uploadErrorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import pako from 'pako';
import { logger } from '@/utils/logger.js';
import { verifyLicense } from '@/utils/licenseManager.js';
import { colors } from '@/styles/colors.js';

// 导入分析组件
import GachaAnalysis from '@/components/GachaAnalysis.vue';

const viewState = ref('input'); // 'input' 为用户输入模式 'analysis' 则展示分析结果
const jsonInput = ref(''); // 存储用户输入的 JSON 数据
const playerId = ref(''); // 存储玩家ID
const LimitGachaData = ref([]); // 存储限定卡池抽卡记录
const NormalGachaData = ref([]); // 存储常驻卡池抽卡记录
const errorMessage = ref('');
const isDev = import.meta.env.DEV;

const LIMITED_CARD_POOLS_ID = ['29', '40', '41', '42', '43']; // 限定卡池ID列表

// 云端获取抽卡记录相关的变量
const fetchPlayerIdInput = ref(''); // 绑定的玩家ID输入框
const fetchLicenseInput = ref(''); // 绑定的许可证输入框
const cloudErrorMessage = ref(''); // 织夜云的错误信息

// 上传抽卡记录相关的变量
const uploadLicenseInput = ref('');
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadErrorMessage = ref('');

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
  if (finalData.cloud) {
    // 处理云端数据时要手动加上gacha_id
    for (const [gachaId, records] of Object.entries(playerData)) {
      if (Array.isArray(records)) {
        records.forEach(record => { if (record) record.gacha_id = Number(gachaId); });
      }
    }
  }

  // 分离限定卡池和常驻卡池数据
  const LimitGachaRecords = [];
  const NormalGachaRecords = [];
  for (const [gachaId, records] of Object.entries(playerData)) {
    if (gachaId === '9') NormalGachaRecords.push(...records); // 常驻卡池ID固定为9
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

  LimitGachaData.value = LimitGachaRecords;
  NormalGachaData.value = NormalGachaRecords;
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
  return `${hours}小时 ${minutes % 60}分钟 ${seconds % 60}秒`;
};

//  处理云端获取的抽卡记录
const handleGetRecord = async () => {
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
  try {
    logger.log("正在客户端验证激活码...");
    const result = verifyLicense(licenseKey);
    if (!result.success) throw new Error(result.message || '激活码验证失败，请检查激活码是否正确。');
    let userID = String(result.userId);
    if ((String(result.userId) !== fetchPlayerId) && (userID.slice(2) !== fetchPlayerId)) {
      if (!(userID.length === 9 && userID.startsWith('33') && !result.isExpired)) {
        throw new Error(`激活码已过期！`);
      }
    }
    logger.log(`客户端验证成功`);

    // 验证通过后，将激活码发送给Worker进行最终验证和数据获取
    const response = await fetch(`${WorkerUrl.value}/get-record`, {
      method: 'GET',
      headers: { 'X-License-Key': licenseKey, 'X-Player-ID': fetchPlayerId },
    });
    if (!response.ok) throw new Error(await response.text() || `服务器错误: ${response.status}`);

    const compressedString = await response.text();
    const wrappedJson = { cloud: true, compressed: true, data: compressedString };
    jsonInput.value = JSON.stringify(wrappedJson);
    handleJsonAnalysis(); // 调用已有的分析逻辑分析合成的json
  } catch (error) {
    logger.error("激活码处理错误:", error);
    cloudErrorMessage.value = error.message;
  }
};

// 设置上传锁定状态
const setUploadLock = (userID, duration) => {
  const expiryTime = Date.now() + duration;
  const lockInfo = JSON.stringify({ expiry: expiryTime });
  try {
    localStorage.setItem("gachaUploadTimestampLock" + userID, lockInfo);
  } catch (error) {
    logger.error("设置上传状态时出错:", error);
    uploadErrorMessage.value = '设置上传状态失败，请检查浏览器的本地存储设置。';
  }
};
// 检查上传锁定状态
const UploadLockTime = (userID) => {
  try {
    const lockInfo = localStorage.getItem("gachaUploadTimestampLock" + userID);
    if (!lockInfo) return false;
    const { expiry } = JSON.parse(lockInfo);
    if (Date.now() > expiry) {
      localStorage.removeItem("gachaUploadTimestampLock" + userID);
      return { locked: false, timeLeft: 0 };
    }
    return { locked: true, timeLeft: expiry - Date.now() };
  } catch (error) {
    logger.error("获取上传状态时出错:", error);
    return { locked: true, timeLeft: -1 };
  }
};

// 处理上传抽卡记录到云端
const handleUploadRecord = async () => {
  isUploading.value = true;
  uploadMessage.value = '';
  uploadErrorMessage.value = '';

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
    if (validationResult.isExpired) {
      throw new Error('您没有可用的织夜云服务时长，无法上传数据。');
    }
    const userID = String(validationResult.userId);
    const lockTime = UploadLockTime(userID);
    if (lockTime.locked && lockTime.timeLeft > 0) {
      uploadErrorMessage.value = `上传次数已达上限，请在 ${milisecondsToTime(lockTime.timeLeft)} 后再试。`;
      isUploading.value = false;
      return;
    } else if (lockTime.locked && lockTime.timeLeft === -1) {
      uploadErrorMessage.value = '获取上传状态失败，请检查浏览器的本地存储设置。';
      return;
    }
    if (!((userID === localPlayerId) || (userID.length === 9 && userID.startsWith('33')))) {
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
    uploadMessage.value = '正在上传，请稍候...';
    const response = await fetch(`${WorkerUrl.value}/upload-record`, {
      method: 'POST',
      headers: {
        'X-License-Key': licenseKey,
        'X-Player-ID': localPlayerId,
        'Content-Type': 'text/plain',
      },
      body: finalPayload,
    });

    const responseText = await response.text();
    if (response.ok) {
      uploadMessage.value = `上传成功！${responseText}`;
      setUploadLock(userID, userID === localPlayerId ? 20 * 60 * 60 * 1000 : 60 * 1000); // 设置上传锁定时间
    } else if (response.status === 429) { // 后端返回“过于频繁”
      const responseContent = responseText.split('.');
      uploadErrorMessage.value = responseContent[0] || '上传过于频繁，请稍后再试。';
      setUploadLock(userID, responseContent[1] ? parseInt(responseContent[1]) : (userID === localPlayerId ? 20 * 60 * 60 * 1000 : 60 * 1000));
      throw new Error(uploadErrorMessage.value || '上传过于频繁，请稍后再试。');
    } else { // 其他错误
      throw new Error(responseText || `服务器错误: ${response.status}`);
    }

  } catch (error) {
    logger.error("上传记录时出错:", error);
    uploadErrorMessage.value = error.message;
    uploadMessage.value = ''; // Clear any pending messages
  } finally {
    isUploading.value = false;
  }
};

// 重置网页
const resetView = () => {
  viewState.value = 'input';
  jsonInput.value = '';
  LimitGachaData.value = [];
  NormalGachaData.value = [];
  errorMessage.value = '';
  playerId.value = '';
  cloudErrorMessage.value = '';
  uploadLicenseInput.value = '';
  uploadErrorMessage.value = '';
  uploadMessage.value = '';
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
</style>

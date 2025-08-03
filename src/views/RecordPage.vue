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
        <div class="cloud-section">
          <p class="input-title">织夜云服务 BETA</p>
          <p class="input-description">【限时免费】使用激活码查询您的抽卡记录。</p>
          <input type="text" v-model="licenseInput" class="cloud-input" placeholder="在此处输入您的激活码（与导出工具相同）" />
          <button @click="handleGetRecord" class="action-button">获取云端抽卡记录</button>
          <p v-if="isDev">awa</p>
        </div>
        <p v-if="cloudErrorMessage" class="error-message">{{ cloudErrorMessage }}</p>
        <p class="input-description">本网页完全开源，可查看<a class="highlight" href="https://github.com/Thisisseanxu/gacha-party"
            target="_blank">Github链接</a>提出意见/提交代码。</p>
      </div>
    </div>

    <GachaAnalysis v-if="viewState === 'analysis'" :limit-gacha-data="LimitGachaData"
      :normal-gacha-data="NormalGachaData" :player-id="playerId" :json-input="jsonInput" @reset-view="resetView" />
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

const viewState = ref('input'); // 'input' 则为用户输入 'analysis' 则为用户上传json文件
const jsonInput = ref(''); // 存储用户输入的 JSON 数据
const playerId = ref(''); // 存储玩家ID
const licenseInput = ref(''); // 绑定的许可证输入框
const LimitGachaData = ref([]); // 存储限定卡池抽卡记录
const NormalGachaData = ref([]); // 存储常驻卡池抽卡记录
const errorMessage = ref('');
const cloudErrorMessage = ref(''); // 织夜云的错误信息
const isDev = import.meta.env.DEV;

const LIMITED_CARD_POOLS_ID = ['29', '40', '41', '42', '43']; // 限定卡池ID列表

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

//  处理云端获取的抽卡记录
const handleGetRecord = async () => {
  if (!licenseInput.value.trim()) {
    cloudErrorMessage.value = '请输入激活码！';
    return;
  }
  const licenseKey = licenseInput.value.trim();
  try {
    logger.log("正在客户端验证激活码...");
    const result = verifyLicense(licenseKey);
    if (!result.success) throw new Error(result.message || '激活码验证失败，请检查激活码是否正确。');
    logger.log(`客户端验证成功, User ID: ${result.userId}`);

    const currentUrl = window.location.origin;
    // 验证通过后，将激活码发送给Worker进行最终验证和数据获取
    const response = await fetch(`${currentUrl}/get-record`, {
      method: 'GET',
      headers: { 'X-License-Key': licenseKey }
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

// 重置网页
const resetView = () => {
  viewState.value = 'input';
  jsonInput.value = '';
  LimitGachaData.value = [];
  NormalGachaData.value = [];
  errorMessage.value = '';
  playerId.value = '';
  cloudErrorMessage.value = '';
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
  margin-top: 16px;
  padding-top: 16px;
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
</style>

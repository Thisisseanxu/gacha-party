<template>
  <div class="background">
    <div class="chat-page-container">
      <h1 class="page-title">盲盒派对聊天生成器</h1>

      <div v-if="isSelectionMode" class="character-selection-container">
        <h2 class="selection-title">选择出场的角色</h2>
        <p class="selection-description">放心，你可以随时回来重选！</p>

        <div class="selection-toolbar">
          <SwitchComponent v-model="showRealName" label="显示角色真名" />
        </div>

        <div class="card-selector-grid">
          <div v-for="card in allCards" :key="card.id" class="card-option"
            :class="{ 'selected': selectedCharacterIds.includes(card.id) }" @click="toggleCharacterSelection(card.id)">
            <img :src="card.imageUrl" :alt="card.name" class="card-image" />
            <div class="card-name">{{ showRealName && card.realname ? card.realname : card.name }}</div>
            <div class="checkmark">✔</div>
          </div>
        </div>

        <button @click="confirmSelection" class="finalize-button">开始创作</button>
      </div>

      <template v-else>
        <div class="chat-editor" ref="chatEditorRef">
          <div class="editor-row">
            <select v-model="newMessage.cardId" class="editor-select">
              <option :value="null" disabled>选择聊天角色</option>
              <option v-for="card in cardOptions" :key="card.id" :value="card.id">
                {{ card.name }}
              </option>
            </select>
          </div>
          <div class="editor-row">
            <input v-model="customName" type="text" class="editor-input" placeholder="自定义名称 (可选，会覆盖角色名)" />
          </div>
          <div class="editor-row">
            <textarea v-model="newMessage.text" class="editor-textarea" placeholder="输入对话内容..."
              :disabled="chatLog[editingIndex]?.type === 'image'"></textarea>
            <button v-if="editingIndex === null" @click="triggerImageUpload" class="editor-button image-button">
              添加图片
            </button>
            <input type="file" ref="imageInputRef" @change="onImageSelected" accept="image/*" style="display: none;" />
          </div>
          <div class="editor-row editor-action-row">
            <button @click="handleFormSubmit" class="editor-button">
              {{ editingIndex !== null ? '修改这条消息' : insertingIndex !== null ? '在此后插入消息' : '添加对话' }}
            </button>
            <button v-if="editingIndex !== null" @click="exitEditing" class="editor-button cancel">
              取消修改
            </button>
            <button v-if="insertingIndex !== null" @click="exitInserting" class="editor-button cancel">
              取消插入
            </button>
          </div>
          <div class="actions-container">
            <button @click="enterSelectionMode" class="action-button">重选角色</button>
            <button v-if="chatLog.length > 0" @click="exportChatLog" class="action-button">导出对话</button>
            <button @click="triggerImport" class="action-button">导入对话</button>
            <button @click="toggleFullscreen" class="action-button">
              {{ isFullscreen ? '退出全屏' : '全屏显示' }}
            </button>
            <input type="file" ref="fileInput" @change="importChatLog" accept=".json" style="display: none;" />
            <div class="width-slider-container">
              <label for="width-slider">宽度：{{ chatLogWidth }}%</label>
              <input type="range" id="width-slider" v-model="chatLogWidth" min="10" max="100" step="1" />
            </div>
          </div>
        </div>

        <p class="hint">提示：点击对话即可进行编辑、插入、删除等操作。</p>
        <div class="chat-log-container" ref="chatContainerRef">
          <div class="chat-log" :style="{ width: chatLogWidth + 'vw' }">
            <div v-for="(message, index) in chatLog" :key="index" class="chat-message"
              :class="{ 'editing-highlight': index === editingIndex, 'insert-highlight-after': index === insertingIndex, [message.position]: true }"
              @click="openEditMenu(index)">

              <template v-if="message.position === 'center'">
                <div class="bubble center">{{ message.text }}</div>
              </template>

              <template v-else>
                <img v-if="message.position === 'left'" :src="getCardAvatar(message.cardId)" alt="avatar"
                  class="avatar" />
                <div class="message-content">
                  <div v-if="message.displayName" class="character-name">
                    {{ message.displayName }}
                  </div>
                  <div class="bubble">
                    <img v-if="message.type === 'image'" :src="message.text" class="message-image" alt="用户图片" />
                    <span v-else>{{ message.text }}</span>
                  </div>
                </div>
              </template>

            </div>
          </div>
        </div>

        <div v-if="editMenu.visible" class="overlay" @click="closeEditMenu">
          <div class="edit-menu-container">
            <h3 class="edit-menu-title">编辑消息</h3>
            <button class="edit-menu-button" @click="startEditing">编辑这条消息</button>
            <button v-if="chatLog[editMenu.index].type === 'image'" class="edit-menu-button"
              @click="triggerImageReplace">
              重新上传图片
            </button>
            <button class="edit-menu-button" @click="startInserting">在此后插入消息</button>
            <button class="edit-menu-button delete" @click="deleteMessage">删除消息</button>
            <button class="edit-menu-button close" @click="closeEditMenu">关闭</button>
          </div>
        </div>
      </template>
      <p class="input-description">使用则代表您同意<a class="highlight" @click="openAgreementPopUp" href="#">《织夜工具箱创作条款》</a>
      </p>
    </div>
  </div>

  <PopUp :display="showAgreementPopUp" title="《织夜工具箱创作条款》" @close="closeAgreementPopUp">
    <p>欢迎使用织夜工具箱！<br />在使用前，请您仔细阅读以下用户协议：</p>
    <ol class="agreement-list">
      <li>
        <strong>服务描述与接受条款：</strong>
        织夜工具箱是一个为《盲盒派对》玩家提供增强体验的工具。若您点击“我已阅读并同意”按钮并继续使用本服务，即表示您已同意并接受本协议的所有条款。
      </li>
      <li>
        <strong>版权信息：</strong>
        工具箱中所使用的所有角色形象、名称及相关内容均为其各自版权所有者所有。织夜工具箱仅用其提供非营利性服务，我们尊重并支持版权保护，任何未经授权的商用均属侵权行为。您可以在非商业用途下自由使用/分享本工具箱生成的内容。
      </li>
      <li>
        <strong>用户责任：</strong> 您使用织夜工具箱时，需确保遵守相关法律法规及游戏运营商的规定。若您使用本服务进行任何违法或违规行为，您将承担全部责任，织夜工具箱对此不承担任何责任。
      </li>
      <li>
        <strong>数据使用与隐私保护：</strong>
        我们承诺保护您的个人隐私。目前织夜工具箱不收集任何个人数据，所有聊天记录和图片数据均存储在您的本地浏览器中。
      </li>
      <li>
        <strong>服务变更、中断或终止：</strong> 本服务免费提供。我们保留随时修改、中断或终止服务的权利，恕不另行通知。
      </li>
      <li>
        <strong>协议修改：</strong> 我们有权根据需要不时地修改本协议。协议修改后，如果您继续使用本服务，即视为您已接受修改后的协议。
      </li>
    </ol>
    <button @click="closeAgreementPopUp" class="action-button">我已阅读并同意</button>
  </PopUp>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { allCards } from '@/data/cards.js';
import { colors } from '@/styles/colors.js';
import SwitchComponent from '@/components/SwitchComponent.vue';
import PopUp from '@/components/PopUp.vue';

const showAgreementPopUp = ref(false);
const openAgreementPopUp = () => {
  showAgreementPopUp.value = true;
};
const closeAgreementPopUp = () => {
  showAgreementPopUp.value = false;
};

// true: 显示角色选择界面, false: 显示聊天编辑器
const isSelectionMode = ref(true);
// 存储用户选择的角色ID
const selectedCharacterIds = ref([]);
// 用于本地存储的键名
const characterSelectionKey = 'chatCharacterSelection';
const autoSaveKey = 'chatAutoSaveLog';
// 开关，是否显示角色真名
const showRealName = ref(true);

// 切换角色的选中状态
const toggleCharacterSelection = (cardId) => {
  const index = selectedCharacterIds.value.indexOf(cardId);
  if (index > -1) {
    selectedCharacterIds.value.splice(index, 1);
  } else {
    selectedCharacterIds.value.push(cardId);
  }
};

// 确认选择，进入聊天编辑器
const confirmSelection = () => {
  isSelectionMode.value = false;
};

// 返回角色选择界面
const enterSelectionMode = () => {
  isSelectionMode.value = true;
};

// 存储所有聊天记录
const chatLog = ref([]);

// 每个聊天记录的格式
const newMessage = ref({
  displayName: null,
  cardId: null,
  text: '',
  type: 'text',
  position: 'left',
});

// 自定义名称
const customName = ref('');

// 监听 cardId 的变化，自动设置 position 属性
watch(() => newMessage.value.cardId, (newCardId) => {
  if (newCardId === "_旁白") {
    newMessage.value.position = 'center';
  } else if (newCardId === '_班长') {
    newMessage.value.position = 'right';
  } else {
    newMessage.value.position = 'left';
  }
  // 清空自定义名称
  customName.value = '';
});

// 生成下拉选择器的选项
const cardOptions = computed(() => {
  // 从 allCards 中过滤出完整的角色对象
  const selectedCards = allCards
    .filter(card => selectedCharacterIds.value.includes(card.id))
    .map(card => ({
      id: card.id,
      name: card.realname ? `${card.name} (${card.realname})` : card.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

  // 在列表最前面添加默认的“班长”和“旁白”
  return [
    { id: '_班长', name: '班长' },
    { id: '_旁白', name: '旁白' },
    ...selectedCards
  ];
});

const getCardAvatar = (cardId) => {
  const card = allCards.find(c => c.id === cardId);
  return card ? card.imageUrl : '/images/cards/placeholder.jpg';
};

const getCardName = (cardId) => {
  if (cardId === '_班长' || cardId === '_旁白') {
    return null; // 不需要名称
  }
  const card = allCards.find(c => c.id === cardId);
  return card ? card.realname ? card.realname : card.name : '未知角色';
};

// 添加新消息到聊天记录
const addMessage = () => {
  if (!newMessage.value.cardId || !newMessage.value.text) {
    alert('请选择一个角色并输入对话内容。');
    return;
  }
  let displayName = null;
  // 如果自定义名称不为空，则优先使用自定义名称
  if (customName.value.trim()) {
    displayName = customName.value;
  }
  // 否则使用角色的默认名称
  displayName = getCardName(newMessage.value.cardId);
  chatLog.value.push({
    ...newMessage.value,
    displayName: displayName, // 将最终要显示的名字存入消息对象
  });

  // 清空文本框和自定义名称框
  newMessage.value.text = '';
};

// 图片上传功能
const imageInputRef = ref(null); // 新增：对文件输入框的引用
// 防止内存泄漏，跟踪所有创建的临时图片URL
const createdImageUrls = new Set();
// 当前图片上传模式
const imageUploadMode = ref('add'); // 'add' 或 'replace'

// 点击“添加图片”按钮时，触发隐藏的文件选择框
const triggerImageUpload = () => {
  imageUploadMode.value = 'add';
  if (!newMessage.value.cardId) {
    alert('请先选择一个角色，再添加图片。');
    return;
  }
  if (newMessage.value.cardId === '_旁白') {
    alert('旁白不允许发送图片。');
    return;
  }
  imageInputRef.value?.click();
};

// 触发“重新上传图片”
const triggerImageReplace = () => {
  imageUploadMode.value = 'replace';
  imageInputRef.value?.click();
  closeEditMenu();
};
const onImageSelected = (event) => {
  if (imageUploadMode.value === 'add') {
    addImageMessage(event);
  } else {
    replaceImageMessage(event);
  }
};

// 当用户选择了图片文件后
const addImageMessage = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 生成临时的 blob URL
  const imageUrl = URL.createObjectURL(file);
  createdImageUrls.add(imageUrl); // 跟踪这个URL以便后续清理

  // 创建消息
  const displayName = customName.value || getCardName(newMessage.value.cardId);

  let position = 'left';
  if (newMessage.value.cardId === '_旁白') position = 'center';
  else if (newMessage.value.cardId === '_班长') position = 'right';

  // 在插入模式下，插入到指定位置后
  if (insertingIndex.value !== null) {
    chatLog.value.splice(insertingIndex.value + 1, 0, {
      cardId: newMessage.value.cardId,
      text: imageUrl, // text 字段现在存储URL
      type: 'image', // 类型为 image
      displayName: displayName,
      customName: customName.value,
      position: position,
    });
    exitInserting();
    event.target.value = ''; // 清空文件输入框
  } else {
    // 添加新消息到末尾
    chatLog.value.push({
      cardId: newMessage.value.cardId,
      text: imageUrl, // text 字段现在存储URL
      type: 'image', // 类型为 image
      displayName: displayName,
      customName: customName.value,
      position: position,
    });
  }
  // 清空文件输入框的值，以便连续选择同一张图片
  event.target.value = '';
};

const replaceImageMessage = (event) => {
  const file = event.target.files[0];
  const index = editMenu.value.index;
  if (!file || index === null) return;

  const messageToUpdate = chatLog.value[index];
  const oldUrl = messageToUpdate.text;

  // 释放旧的URL以回收内存
  URL.revokeObjectURL(oldUrl);
  createdImageUrls.delete(oldUrl);

  // 创建并跟踪新的URL
  const newUrl = URL.createObjectURL(file);
  createdImageUrls.add(newUrl);

  // 更新消息内容
  messageToUpdate.text = newUrl;

  // 清空文件输入框
  event.target.value = '';
};

// 编辑菜单
const editMenu = ref({
  visible: false,
  index: null,
});

// 编辑模式
const editingIndex = ref(null); // null 表示不在编辑模式, 数字表示正在编辑的消息索引
const chatEditorRef = ref(null); // 用于滚动到编辑区
const insertingIndex = ref(null); // null 表示不在插入模式, 数字表示要插入消息的目标索引

// 重置编辑器状态
const resetEditor = () => {
  newMessage.value.cardId = null;
  newMessage.value.text = '';
  customName.value = '';
};

// 触发编辑消息
const startEditing = () => {
  const index = editMenu.value.index;
  if (index === null) return;

  // 进入编辑模式
  exitInserting(); // 取消插入模式
  editingIndex.value = index;
  const message = chatLog.value[index];

  // 检查并添加当前编辑的角色ID (如果该角色已被移除)
  const isSpecialId = message.cardId === '_班长' || message.cardId === '_旁白';
  if (!isSpecialId && !selectedCharacterIds.value.includes(message.cardId)) {
    selectedCharacterIds.value.push(message.cardId);
  }
  newMessage.value.cardId = message.cardId;
  // 加载消息数据到编辑器
  // 使用 nextTick 确保添加角色而更新的选项已渲染
  nextTick(() => {
    customName.value = message.displayName;
    if (message.type === 'image') {
      newMessage.value.text = '【图片消息】'; // 图片消息不加载文本
    } else {
      newMessage.value.text = message.text; // 其他情况加载文本
    }
  });

  closeEditMenu();
  // 滚动到编辑器
  chatEditorRef.value?.scrollIntoView({ behavior: 'smooth' });
};

// 修改完成
const updateMessage = () => {
  if (editingIndex.value === null || !newMessage.value.cardId || !newMessage.value.text) {
    alert('请确保已选择角色并填写内容。');
    return;
  }

  const messageToUpdate = chatLog.value[editingIndex.value];

  // 旁白不允许发送图片
  if (newMessage.value.cardId === '_旁白') {
    alert('旁白不允许发送图片。');
    return;
  }

  // 从编辑器读取数据并更新
  messageToUpdate.cardId = newMessage.value.cardId;
  messageToUpdate.text = newMessage.value.text;
  messageToUpdate.displayName = customName.value ? customName.value : getCardName(newMessage.value.cardId);

  // 根据新角色更新消息位置
  const newCardId = newMessage.value.cardId;
  if (newCardId === "_旁白") messageToUpdate.position = 'center';
  else if (newCardId === '_班长') messageToUpdate.position = 'right';
  else messageToUpdate.position = 'left';

  exitEditing();
};

// 退出编辑模式并重置编辑器
const exitEditing = () => {
  editingIndex.value = null;
  resetEditor();
};

// 进入插入消息模式
const startInserting = () => {
  const index = editMenu.value.index;
  if (index === null) return;

  // 如果当前在编辑模式，先取消
  exitEditing();

  insertingIndex.value = index;
  closeEditMenu();
  resetEditor(); // 清空编辑器以便输入新内容
  chatEditorRef.value?.scrollIntoView({ behavior: 'smooth' });
};

// 执行插入操作
const insertMessage = () => {
  if (insertingIndex.value === null || !newMessage.value.cardId || !newMessage.value.text) {
    alert('请选择一个角色并输入对话内容。');
    return;
  }

  let displayName = customName.value.trim() ? customName.value.trim() : getCardName(newMessage.value.cardId);

  const messageToInsert = {
    ...newMessage.value,
    displayName: displayName,
  };

  // 使用 splice 在指定位置后插入新消息
  chatLog.value.splice(insertingIndex.value + 1, 0, messageToInsert);

  exitInserting(); // 退出插入模式并重置
};

// 退出插入模式
const exitInserting = () => {
  insertingIndex.value = null;
  resetEditor();
};

// 根据模式决定添加/修改/插入消息
const handleFormSubmit = () => {
  if (editingIndex.value !== null) {
    updateMessage();
  } else if (insertingIndex.value !== null) {
    insertMessage();
  } else {
    addMessage();
  }
};

// 删除消息
const deleteMessage = () => {
  const index = editMenu.value.index;
  if (index === null) return;
  if (window.confirm('确定要删除这条消息吗？')) {
    chatLog.value.splice(index, 1);
    // 如果删除的是正在编辑的消息，则取消编辑
    if (editingIndex.value === index) {
      exitEditing();
    }
  }
  closeEditMenu();
};

// 开关菜单
const openEditMenu = (index) => {
  editMenu.value.index = index;
  editMenu.value.visible = true;
  toggleFullscreen(false); // 退出全屏以便操作
};
const closeEditMenu = () => {
  editMenu.value.visible = false;
};

// 导出聊天记录为 JSON 文件
const exportChatLog = () => {
  if (chatLog.value.length === 0) {
    alert('没有聊天记录可以导出。');
    return;
  }

  // 将聊天记录数组转换为格式化的 JSON 字符串
  const dataStr = JSON.stringify(chatLog.value, null, 2);
  // 创建一个 Blob 对象
  const blob = new Blob([dataStr], { type: 'application/json' });
  // 创建一个下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `织夜工具箱-导演模式-${new Date().toISOString().slice(0, 10)}.json`;
  // 触发点击事件以下载文件
  link.click();
  // 释放 URL 对象
  URL.revokeObjectURL(url);
};

// 导入聊天记录的相关逻辑
const fileInput = ref(null);

// 点击“导入”按钮触发隐藏的文件输入框
const triggerImport = () => {
  fileInput.value.click();
};

// 选择文件后，读取并解析文件
const importChatLog = (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      // 验证导入的数据格式是否正确
      if (Array.isArray(importedData)) {
        if (window.confirm('导入新的聊天记录会覆盖当前内容，确定要继续吗？')) {
          chatLog.value = importedData;
        }
      } else {
        throw new Error('文件格式不正确，需要是数组格式。');
      }
    } catch (error) {
      alert(`导入失败：${error.message}`);
    } finally {
      // 清空文件输入
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};

// 全屏功能
// 引用聊天容器元素实现全屏
const chatContainerRef = ref(null);
// 是否处于全屏状态
const isFullscreen = ref(false);
const chatLogWidth = ref(100); // 聊天记录容器的宽度百分比

// 切换全屏状态
const toggleFullscreen = (forceToggle = null) => {
  // 检查浏览器是否支持全屏 API
  if (!document.fullscreenEnabled) {
    alert('您的浏览器不支持全屏功能。');
    return;
  }
  // 强制退出全屏
  if (forceToggle === false) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    return;
  }
  // 强制进入全屏
  if (forceToggle === true) {
    if (!document.fullscreenElement) {
      chatContainerRef.value.requestFullscreen();
    }
    return;
  }
  // 如果当前不是全屏状态，则请求进入全屏
  if (!document.fullscreenElement) {
    chatContainerRef.value.requestFullscreen();
  }
  // 如果当前是全屏状态，则退出全屏
  else {
    document.exitFullscreen();
  }
};

// 监听全屏变化事件，更新 isFullscreen 状态
const updateFullscreenState = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// 自动保存聊天记录到本地存储
const autoSaveChatLog = () => {
  localStorage.setItem(autoSaveKey, JSON.stringify(chatLog.value));
};
// 每间隔15秒自动保存一次聊天记录
setInterval(autoSaveChatLog, 15000);

// 在组件挂载时加载已保存的角色选择
onMounted(() => {
  const savedSelection = localStorage.getItem(characterSelectionKey);
  if (savedSelection) {
    try {
      selectedCharacterIds.value = JSON.parse(savedSelection);
      // 如果有保存的记录，直接进入聊天模式，提升体验
      isSelectionMode.value = false;
    } catch (e) {
      console.error("解析已选角色配置失败:", e);
      // 解析失败则停留在选择模式
      isSelectionMode.value = true;
    }
  } else {
    // 首次访问，停留在选择模式
    isSelectionMode.value = true;
  }
  // 如果有保存的聊天记录，加载它们
  const savedLog = localStorage.getItem(autoSaveKey);
  try {
    let savedChatLog = JSON.parse(savedLog);
    if (savedChatLog && savedChatLog.length > 0) {
      // 等待3秒后提示用户加载
      setTimeout(() => {
        if (window.confirm('检测到自动保存的聊天记录，是否加载？这将覆盖当前内容。')) {
          chatLog.value = savedChatLog;
        }
      }, 1000);
    }
  } catch (e) {
    console.error("解析自动保存的聊天记录失败:", e);
  }

  document.addEventListener('fullscreenchange', updateFullscreenState);
});

onUnmounted(() => {
  // 组件卸载前清理所有创建的临时图片URL
  createdImageUrls.forEach(url => URL.revokeObjectURL(url));
  // 组件卸载前移除监听器
  document.removeEventListener('fullscreenchange', updateFullscreenState);
});
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

.character-selection-container {
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  padding: 1.5rem 2rem;
  border-radius: 12px;
  margin-bottom: 20px;
}

.selection-title {
  margin-top: 0rem;
  font-size: 1.8rem;
  text-align: center;
  color: v-bind('colors.text.primary');
}

.selection-description {
  text-align: center;
  color: v-bind('colors.text.secondary');
  margin-top: -1rem;
}

.selection-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.card-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
  gap: 0.8rem;
  justify-content: center;
}

.card-option {
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  background-color: v-bind('colors.background.light');
}

.card-option:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px v-bind('colors.shadow.primary');
}

.card-option .card-image {
  width: 100%;
  display: block;
}

.card-option .card-name {
  font-size: 0.8rem;
  text-align: center;
  padding: 4px 2px;
  background: v-bind('colors.shadow.primaryHover');
  backdrop-filter: blur(2px);
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  color: v-bind('colors.text.primary');
}

.card-option .checkmark {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.primary');
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s;
}

.card-option.selected {
  border-color: v-bind('colors.brand.primary');
}

.card-option.selected .checkmark {
  opacity: 1;
  transform: scale(1);
}

.finalize-button {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  margin-top: 1rem;
  padding: 0.5rem;
  width: 100%;
  font-size: 1.2rem;
  background-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
}

.finalize-button:hover {
  background-color: v-bind('colors.brand.hover');
}

.chat-page-container {
  padding: 8px;
  width: 100%;
  max-width: 800px;
  font-family: 'Inter', sans-serif;
  color: v-bind('colors.text.primary');
  overflow: hidden;
}

.page-title {
  text-align: center;
  font-size: 2em;
  color: v-bind('colors.text.highlight');
  margin-bottom: 20px;
}

/* 小按钮样式 */
.actions-container {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 按钮样式 */
.action-button {
  padding: 8px 16px;
  border: 1px solid #344767;
  background-color: #ccc;
  color: #344767;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #344767;
  color: #ccc;
}

/* 滑块容器的样式 */
.width-slider-container {
  display: flex;
  align-items: center;
  gap: 8px;
  color: v-bind('colors.text.secondary');
  padding: 8px 12px;
  border: 1px solid #344767;
  border-radius: 5px;
  background-color: #ccc;
}

.width-slider-container label {
  white-space: nowrap;
  /* 防止标签换行 */
  font-weight: bold;
  color: #344767;
}

.width-slider-container input[type="range"] {
  cursor: pointer;
  width: 100px;
}

.hint {
  text-align: center;
  color: #888;
  font-size: 0.9em;
  margin: 5px;
}

.chat-log-container {
  background-color: v-bind('colors.game.backgroundBlack');
  border-radius: 8px;
  padding: 10px;
  height: 50vh;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  /* 隐藏滚动条的样式 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: flex;
  justify-content: center;
}

.chat-log-container::-webkit-scrollbar {
  display: none;
}

/* 全屏状态下的样式 */
.chat-log-container:fullscreen {
  border-radius: 0;
}

.chat-log {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
  cursor: pointer;
  /* 鼠标悬停时显示为可点击手势 */
  user-select: none;
  /* 防止长按时选中文本 */
  -webkit-user-select: none;
  /* 兼容 Safari */
}

.avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.character-name {
  font-weight: bold;
  margin-bottom: 5px;
  color: white;
  font-size: 1.4rem;
}

/* 聊天气泡样式 */
.bubble {
  background-color: v-bind('colors.game.primary');
  color: white;
  border-radius: 15px;
  padding: 4px 8px 6px 8px;
  position: relative;
  text-align: left;
  font-family: 'Source Han Sans SC VF';
  font-weight: 500;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 聊天气泡的小尾巴 (左上角) */
.chat-message.left .bubble::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  top: 0;
  left: 0;
  border-style: solid;
  border-width: 0 7px 9px 0;
  rotate: 20deg;
  border-color: transparent v-bind('colors.game.primary') transparent transparent;
}

/* 右侧消息 */
.chat-message.right {
  align-self: flex-end;
  text-align: right;
}

.chat-message.right .message-content {
  align-items: flex-end;
}

.chat-message.right .bubble {
  background-color: white;
  color: v-bind('colors.game.primaryText');
}

/* 右侧消息气泡的小尾巴 (右上角) */
.chat-message.right .bubble::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  top: 0;
  right: 0;
  border-style: solid;
  border-width: 0 0 9px 7px;
  rotate: -20deg;
  border-color: transparent transparent transparent white;
}

/* 旁白消息 */
.chat-message.center {
  align-self: center;
  /* 自身在 flex 容器中居中 */
  width: 100%;
  justify-content: center;
}

/* 旁白的气泡样式 */
.bubble.center {
  background-color: #8f8989;
  /* 浅灰色底 */
  color: black;
  /* 黑色文字 */
  max-width: 70%;
  /* 防止过长 */
  text-align: center;
  /* 文字居中对齐 */
  padding: 2px 8px 4px 8px;
  /* 缩小垂直内间距 */
  white-space: pre-wrap;
  word-break: break-word;
}

/* 图片消息 */
.message-image {
  max-width: 20rem;
  /* 限制图片最大宽度 */
  max-height: 20rem;
  /* 限制图片最大高度 */
  background-color: #eee;
  /* 图片加载前的占位背景色 */
  object-fit: cover;
  /* 保持图片比例 */
}

/* 编辑器样式 */
.chat-editor {
  background-color: v-bind('colors.background.content');
  padding: 15px;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
}

.editor-row {
  margin-bottom: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

/* 输入框样式 */
.editor-select,
.editor-textarea,
.editor-button,
.editor-input {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  font-size: 1em;
  box-sizing: border-box;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
}

.editor-textarea {
  height: 80px;
  resize: vertical;
}

.image-button {
  width: auto;
  min-width: 80px;
  height: 60px;
  padding: 4px;
  margin-left: 4px;
}

.editor-button {
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
  background-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
}

.editor-button:hover {
  background-color: v-bind('colors.brand.hover');
}

/* 叠加层样式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 编辑菜单样式 */
.edit-menu-container {
  background-color: rgb(153, 153, 153);
  color: #333;
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* 按钮之间的间距 */
  width: 90%;
  max-width: 300px;
}

.edit-menu-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.2em;
  color: #111;
}

.edit-menu-button {
  padding: 10px 15px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  color: #333;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s, border-color 0.2s;
  text-align: center;
}

.edit-menu-button:hover {
  background-color: #f0f0f0;
  border-color: #bbb;
}

.edit-menu-button.delete {
  background-color: #fff1f0;
  border-color: #ffa39e;
  color: #cf1322;
}

.edit-menu-button.delete:hover {
  background-color: #ffccc7;
}

.edit-menu-button.close {
  margin-top: 10px;
  /* 与功能按钮分隔开 */
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.edit-menu-button.close:hover {
  background-color: #bae7ff;
}

/* 编辑行高亮样式 */
.editing-highlight {
  border: 2px solid #4CAF50;
  /* 绿色边框 */
  border-radius: 8px;
  padding: 5px;
  margin: -7px -5px;
  /* 使用负边距防止布局移动 */
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.7);
  transition: all 0.3s ease-in-out;
}

/* 编辑器操作按钮行样式 */
.editor-action-row {
  display: flex;
  gap: 10px;
}

/* 插入行高亮样式 */
.insert-highlight-after {
  border-bottom: 2px solid #4CAF50;
  /* 绿色横线 */
  padding: 5px;
  margin: -7px -5px;
  /* 使用负边距防止布局移动 */
  transition: all 0.3s ease-in-out;
}

.editor-action-row .editor-button {
  flex-grow: 1;
}

/* 取消按钮的特定样式 */
.editor-action-row .editor-button.cancel {
  background-color: #da606a;
  color: v-bind('colors.text.primary');
}

.editor-action-row .editor-button.cancel:hover {
  background-color: #df9993;
  color: v-bind('colors.text.primary');
}

.highlight {
  color: v-bind('colors.text.highlight');
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
</style>

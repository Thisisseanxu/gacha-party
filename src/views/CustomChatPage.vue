<template>
  <div class="chat-page-container">
    <FloatingHomeButton />
    <h1 class="page-title">自定义聊天生成器</h1>

    <div class="chat-editor">
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
        <textarea v-model="newMessage.text" class="editor-textarea" placeholder="输入对话内容..."></textarea>
      </div>
      <div class="editor-row">
        <button @click="addMessage" class="editor-button">添加对话</button>
      </div>
      <div class="actions-container">
        <button v-if="chatLog.length > 0" @click="exportChatLog" class="action-button">导出所有消息</button>
        <button @click="triggerImport" class="action-button">导入消息</button>
        <button @click="toggleFullscreen" class="action-button">
          {{ isFullscreen ? '退出全屏' : '全屏显示' }}
        </button>
        <input type="file" ref="fileInput" @change="importChatLog" accept=".json" style="display: none;" />
      </div>
    </div>


    <p class="long-press-hint">提示：长按某条消息可以删除它。</p>

    <div class="chat-log-container {{ isFullscreen ? 'fullscreen' : '' }} " ref="chatContainerRef">
      <div class="chat-log">
        <div v-for="(message, index) in chatLog" :key="index" class="chat-message" :class="{ right: message.isRight }"
          @mousedown="startPress(index)" @mouseup="cancelPress" @mouseleave="cancelPress"
          @touchstart.prevent="startPress(index)" @touchend="cancelPress" @touchmove="cancelPress">
          <img v-if="!message.isRight" :src="getCardAvatar(message.cardId)" alt="avatar" class="avatar" />
          <div class="message-content">
            <div v-if="message.displayName" class="character-name">
              {{ message.displayName }}
            </div>
            <div class="bubble">
              {{ message.text }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import FloatingHomeButton from '../components/FloatingHomeButton.vue';
import { allCards } from '@/data/cards.js';
import { colors } from '@/styles/colors.js';


// 存储所有聊天记录
const chatLog = ref([]);

// 每个聊天记录的格式
const newMessage = ref({
  displayName: null,
  cardId: null,
  text: '',
  isRight: false,
});

// 新增：自定义名称的响应式变量
const customName = ref('');

// 监听 cardId 的变化，自动设置 isRight 属性
watch(() => newMessage.value.cardId, (newCardId) => {
  // 如果选择的是“班长”，则消息放在右侧，否则在左侧
  newMessage.value.isRight = newCardId === 'banzhang';
  // 清空自定义名称
  customName.value = '';
});

// 修改：一个计算属性，用于生成下拉选择器的选项
const cardOptions = computed(() => {
  const sortedCards = allCards.map(card => ({
    id: card.id,
    name: card.name
  })).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

  // 在列表最前面添加“班长”选项
  return [
    { id: 'banzhang', name: '班长' },
    ...sortedCards
  ];
});

const getCardAvatar = (cardId) => {
  const card = allCards.find(c => c.id === cardId);
  return card ? card.imageUrl : '/images/cards/placeholder.jpg';
};

const getCardName = (cardId) => {
  const card = allCards.find(c => c.id === cardId);
  return card ? card.name : '未知角色';
};

// 修改：添加新消息到聊天记录
const addMessage = () => {
  if (!newMessage.value.cardId || !newMessage.value.text.trim()) {
    alert('请选择一个角色并输入对话内容。');
    return;
  }
  let displayName = null;
  // 如果自定义名称不为空，则优先使用自定义名称
  if (customName.value.trim()) {
    displayName = customName.value.trim();
  }
  // 否则，如果不是班长，则使用角色的默认名称
  else if (newMessage.value.cardId !== 'banzhang') {
    displayName = getCardName(newMessage.value.cardId);
  }
  // 如果是班长且没有自定义名称，则 displayName 为 null，不显示名字

  chatLog.value.push({
    ...newMessage.value,
    displayName: displayName, // 将最终要显示的名字存入消息对象
  });

  // 清空文本框和自定义名称框
  newMessage.value.text = '';
};


// --- 新增：长按删除功能逻辑 ---
let longPressTimer = null;
// 定义长按的时间阈值
const LONG_PRESS_DURATION = 500;

// 按下时开始计时
const startPress = (index) => {
  // 清除任何可能存在的旧计时器
  cancelPress();
  // 创建一个新计时器
  longPressTimer = setTimeout(() => {
    // 长按时长足够，执行删除操作
    deleteMessage(index);
  }, LONG_PRESS_DURATION);
};

// 释放时取消计时
const cancelPress = () => {
  clearTimeout(longPressTimer);
};

const deleteMessage = (index) => {
  // 弹出确认框，防止误删
  if (window.confirm('确定要删除这条消息吗？')) {
    chatLog.value.splice(index, 1);
  }
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

// 切换全屏状态
const toggleFullscreen = () => {
  // 检查浏览器是否支持全屏 API
  if (!document.fullscreenEnabled) {
    alert('您的浏览器不支持全屏功能。');
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

// 在组件挂载后，添加对全屏变化的事件监听
onMounted(() => {
  document.addEventListener('fullscreenchange', updateFullscreenState);
});

// 组件卸载前移除监听器
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState);
});

</script>

<style scoped>
.chat-page-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: #333;
}

.page-title {
  text-align: center;
  font-size: 2em;
  color: #344767;
  margin-bottom: 20px;
}

/* 小按钮样式 */
.actions-container {
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* 按钮样式 */
.action-button {
  padding: 8px 16px;
  border: 1px solid #344767;
  background-color: #fff;
  color: #344767;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #344767;
  color: white;
}


.long-press-hint {
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
}

.chat-log-container::-webkit-scrollbar {
  display: none;
}

/* 全屏状态下的样式 */
.chat-log-container:fullscreen {
  height: 100%;
  border-radius: 0;
  padding: 20px;
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

.bubble {
  background-color: v-bind('colors.game.primary');
  color: white;
  border-radius: 15px;
  padding: 6px 8px;
  position: relative;
  text-align: left;
  font-family: 'Source Han Sans SC VF';
  font-weight: 500;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
}

/* 聊天气泡的小尾巴 (左上角) */
.chat-message:not(.right) .bubble::before {
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


/* 编辑器样式 */
.chat-editor {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.editor-row {
  margin-bottom: 10px;
}

/* 输入框样式 */
.editor-select,
.editor-textarea,
.editor-button,
.editor-input {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  font-size: 1em;
  box-sizing: border-box;
}

.editor-textarea {
  height: 80px;
  resize: vertical;
}

.editor-button {
  background-color: #344767;
  color: white;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.editor-button:hover {
  background-color: #4a5d80;
}
</style>

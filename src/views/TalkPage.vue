<template>
  <div class="background">
    <div class="talk-page-container">
      <!-- 聊天主窗口 (类似App界面) -->
      <div class="chat-app-window">
        <!-- 顶部标题栏 -->
        <div class="window-header">
          <h2 class="window-title">聊天编辑器</h2>
          <div class="header-actions">
            <button class="icon-btn" @click="toggleFullScreen" title="全屏模式">
              <full-screen-one theme="outline" size="20" fill="#fff" />
            </button>
          </div>
        </div>

        <!-- 聊天内容区 -->
        <div class="chat-body" ref="chatBodyRef">
          <div class="canvas-scaler" :style="scalerStyle">
            <div class="chat-canvas" ref="captureRef" :style="canvasStyle">
              <div class="chat-log">
                <div v-if="chatLog.length === 0" class="empty-hint">
                  暂无消息，请在下方选择角色并发送...
                </div>
                <div v-for="(message, index) in chatLog" :key="index" class="chat-message"
                  :class="[message.position, { 'editing': index === editingIndex }]" @click="openEditMenu(index)">

                  <!-- 旁白 (Center) -->
                  <template v-if="message.position === 'center'">
                    <div class="bubble center">{{ message.text }}</div>
                  </template>

                  <!-- 左右侧消息 -->
                  <template v-else>
                    <!-- 头像 (Left) -->
                    <div v-if="message.position === 'left' && message.cardId !== '_班长'" class="avatar-container">
                      <img :src="getCardAvatar(message.cardId)" class="avatar" />
                    </div>

                    <!-- 内容 -->
                    <div class="message-content">
                      <div v-if="message.displayName" class="character-name">{{ message.displayName }}</div>
                      <div :class="message.type === 'image' ? 'image-bubble' : 'bubble'">
                        <img v-if="message.type === 'image'" :src="message.text" class="msg-img" />
                        <span v-else>{{ message.text }}</span>
                      </div>
                    </div>

                    <!-- 头像 (Right) -->
                    <div v-if="message.position === 'right' && message.cardId !== '_班长'" class="avatar-container right">
                      <img :src="getCardAvatar(message.cardId)" class="avatar" />
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="window-footer">
          <!-- 角色选择栏 -->
          <div class="char-selector-bar">
            <div class="char-item" :class="{ active: newMessage.cardId === '_班长' }" @click="selectChar('_班长')">
              <div class="char-icon placeholder-icon">班</div>
              <span class="char-label">班长</span>
            </div>
            <div class="char-item" :class="{ active: newMessage.cardId === '_旁白' }" @click="selectChar('_旁白')">
              <div class="char-icon placeholder-icon narrator">旁</div>
              <span class="char-label">旁白</span>
            </div>

            <div v-for="card in quickCharList" :key="card.id" class="char-item"
              :class="{ active: newMessage.cardId === card.id }" @click="selectChar(card.id)">
              <img :src="card.imageUrl" class="char-icon" />
              <span class="char-label">{{ card.name }}</span>
            </div>

            <div class="char-item add" @click="showCharSelectorModal = true">
              <div class="char-icon add-icon">+</div>
              <span class="char-label">添加</span>
            </div>
          </div>

          <!-- 消息编辑栏 -->
          <div class="input-toolbar">
            <div class="toolbar-row">
              <button class="tool-btn icon-only" @click="triggerImageUpload" title="发送图片">
                📷
              </button>
              <div class="input-box">
                <textarea v-model="newMessage.text" placeholder="输入对话..." rows="1"
                  @keydown.enter.exact.prevent="handleFormSubmit"></textarea>
              </div>
              <button class="send-btn" @click="handleFormSubmit">
                {{ editingIndex !== null ? '修改' : '发送' }}
              </button>
            </div>
            <div class="toolbar-options">
              <input v-model="customName" placeholder="自定义昵称 (可选)" class="mini-input" />
              <SwitchComponent v-if="newMessage.cardId && newMessage.cardId !== '_旁白'" v-model="isRightSide"
                label="右侧显示" />
              <button v-if="editingIndex !== null" @click="exitEditing" class="cancel-btn">取消编辑</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 设置与存档区域 -->
      <div class="settings-panel">
        <h3>工具箱</h3>
        <div class="tools-grid">
          <div class="tool-group">
            <label>导出设置 (px)</label>
            <div class="input-group">
              <input type="number" v-model="previewConfig.width" class="config-input" placeholder="宽" />
              <span>x</span>
              <input type="number" v-model="previewConfig.height" class="config-input" placeholder="高" />
            </div>
            <button @click="generateImage" class="tool-btn primary">导出图片</button>
          </div>
          <div class="tool-group">
            <label>数据管理</label>
            <div class="btn-group">
              <button @click="openSaveLoadMenu" class="tool-btn">存档/读档</button>
              <button @click="clearChat" class="tool-btn danger">清空</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input type="file" ref="imageInputRef" @change="onImageSelected" accept="image/*" style="display: none" />
    <input type="file" ref="fileInput" @change="handleImportFile" accept=".json" style="display: none" />

    <!-- 角色选择弹窗 -->
    <div v-if="showCharSelectorModal" class="modal-overlay" @click.self="showCharSelectorModal = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>选择角色</h3>
          <button class="close-btn" @click="showCharSelectorModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="toolbar">
            <button @click="openCreateCharModal" class="action-button small">新建角色</button>
            <SwitchComponent v-model="showRealName" label="显示真名" />
          </div>
          <CharacterSelector v-model="selectedCharacterIds" v-model:customCharacters="customCharacters"
            :characterList="displayableCharacterList" :showRealName="showRealName" mode="multiple" />
        </div>
        <div class="modal-footer">
          <button @click="showCharSelectorModal = false" class="action-button">完成</button>
        </div>
      </div>
    </div>

    <!-- 编辑菜单 -->
    <div v-if="editMenu.visible" class="modal-overlay" @click="closeEditMenu">
      <div class="edit-menu-container" @click.stop>
        <h3 class="edit-menu-title">消息操作</h3>
        <button class="edit-menu-button" @click="startEditing">编辑</button>
        <button v-if="chatLog[editMenu.index]?.type === 'image'" class="edit-menu-button" @click="triggerImageReplace">
          更换图片
        </button>
        <button class="edit-menu-button" @click="startInserting">在此后插入</button>
        <button class="edit-menu-button delete" @click="deleteMessage">删除</button>
        <button class="edit-menu-button close" @click="closeEditMenu">取消</button>
      </div>
    </div>

    <!-- 存档/读档菜单 -->
    <div v-if="showSaveLoadMenu" class="modal-overlay" @click.self="closeSaveLoadMenu">
      <div class="save-load-menu">
        <button class="close-menu-top-right" @click="closeSaveLoadMenu">×</button>
        <h3 class="menu-title">存档管理</h3>
        <div class="slot-section">
          <div class="slot-header">自动存档</div>
          <div class="slot-item">
            <span class="slot-time-small">{{ autoSaveTime ? formatTime(autoSaveTime) : '暂无' }}</span>
            <div class="slot-row-bottom">
              <button class="action-button" @click="loadAutoSave" :disabled="!autoSaveTime">读取</button>
              <button class="action-button" @click="exportSlot('auto')" :disabled="!autoSaveTime">导出</button>
            </div>
          </div>
        </div>
        <div class="slot-section">
          <div class="slot-header">手动存档</div>
          <div v-for="(slot, index) in slotsData" :key="index" class="slot-item">
            <div class="slot-row-top">
              <input v-model="slot.name" class="slot-name-input" placeholder="存档名" />
              <button class="delete-slot-btn" @click="clearSlot(index + 1)" v-if="slot.timestamp">×</button>
            </div>
            <div class="slot-row-bottom">
              <button class="action-button save-btn" @click="saveToSlot(index + 1)">保存</button>
              <button class="action-button" @click="loadFromSlot(index + 1)">读取</button>
              <button class="action-button" @click="exportSlot(index + 1)" :disabled="!slot.timestamp">导出</button>
              <button class="action-button" @click="triggerImportToSlot(index + 1)">导入</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义角色表单 -->
    <div v-if="charForm.visible" class="modal-overlay" @click="closeCharForm">
      <div class="custom-character-form" @click.stop>
        <h3>{{ charForm.mode === 'create' ? '创建角色' : '修复角色' }}</h3>
        <div class="form-row">
          <label>名称</label>
          <input type="text" v-model="charForm.name" placeholder="输入名字" />
        </div>
        <div class="form-row">
          <label>头像</label>
          <button @click="triggerCharAvatarUpload" class="action-button">
            {{ charForm.avatar ? '更换图片' : '上传图片' }}
          </button>
          <input type="file" ref="charFormAvatarInputRef" @change="handleCharAvatarSelected" accept="image/*"
            style="display: none" />
        </div>
        <div v-if="charForm.avatar" class="avatar-preview-container">
          <img :src="charForm.avatar" class="avatar-preview" />
        </div>
        <div class="form-actions">
          <button @click="saveCharForm" class="action-button">保存</button>
          <button @click="closeCharForm" class="action-button cancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
import { allCards } from '@/data/cards.js'
import { colors } from '@/styles/colors.js'
import CharacterSelector from '@/components/CharacterSelector.vue'
import SwitchComponent from '@/components/SwitchComponent.vue'
import { logger } from '@/utils/logger'
import { saveToDB, loadFromDB, deleteFromDB, DB_KEYS } from '@/utils/chatStorage.js'
import { toPng } from 'html-to-image'
import { FullScreenOne } from '@icon-park/vue-next'

// --- 状态定义 ---
const showCharSelectorModal = ref(false)
const showRealName = ref(false)
const selectedCharacterIds = ref([]) // 快捷栏中的角色ID
const customCharacters = ref([]) // 自定义角色列表

// 聊天核心数据
const chatLog = ref([])
const newMessage = ref({
  displayName: null,
  cardId: null,
  text: '',
  type: 'text',
  position: 'left',
})
const customName = ref('')
const isRightSide = ref(false)

// 编辑/插入模式
const editingIndex = ref(null)
const insertingIndex = ref(null)
const editMenu = ref({ visible: false, index: null })

// 预览配置
const previewConfig = ref({
  width: 540,
  height: 800,
  radius: 0,
})
const chatBodyRef = ref(null)
const scale = ref(1)
const captureRef = ref(null)
const isFullscreen = ref(false)

// --- 计算属性 ---

// 快捷栏显示的角色列表
const quickCharList = computed(() => {
  const predefined = allCards.filter(c => selectedCharacterIds.value.includes(c.id))
  const custom = customCharacters.value.filter(c => selectedCharacterIds.value.includes(c.id))
  return [...predefined, ...custom]
})

// 角色选择器用的完整列表
const displayableCharacterList = computed(() => {
  const formattedCustom = customCharacters.value.map((c) => ({
    ...c,
    realname: c.name,
    isCustom: true,
  }))
  return [...allCards.filter((card) => /^\d+$/.test(card.id)), ...formattedCustom]
})

const scalerStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'center center',
  width: `${previewConfig.value.width}px`,
  height: `${previewConfig.value.height}px`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}))

const canvasStyle = computed(() => {
  return {
    width: `${previewConfig.value.width}px`,
    height: `${previewConfig.value.height}px`,
    borderRadius: `${previewConfig.value.radius}px`,
  }
})

const updateScale = () => {
  if (!chatBodyRef.value) return
  const bodyRect = chatBodyRef.value.getBoundingClientRect()
  const availableW = bodyRect.width
  const availableH = bodyRect.height
  const contentW = previewConfig.value.width
  const contentH = previewConfig.value.height

  scale.value = Math.min(availableW / contentW, availableH / contentH)
}

// --- 核心逻辑 ---

// 选择角色
const selectChar = (id) => {
  newMessage.value.cardId = id

  // 自动设置方向
  if (id === '_班长') {
    isRightSide.value = true
  } else if (id === '_旁白') {
    isRightSide.value = false // 旁白居中，此值不影响
  } else {
    // 切换到其他角色时，默认左侧，除非用户手动改过
    isRightSide.value = false
  }

  // 清空自定义名称，使用默认
  customName.value = ''
}

// 获取头像
const getCardAvatar = (cardId) => {
  if (cardId === '_班长') return '/images/cards/placeholder.jpg' // 需替换为实际班长头像或占位
  if (cardId === '_旁白') return ''
  const card = allCards.find(c => c.id === cardId) || customCharacters.value.find(c => c.id === cardId)
  return card ? card.imageUrl : '/images/cards/placeholder.jpg'
}

// 获取名字
const getCardName = (cardId) => {
  if (cardId === '_班长') return '班长'
  if (cardId === '_旁白') return '旁白'
  const card = allCards.find(c => c.id === cardId) || customCharacters.value.find(c => c.id === cardId)
  return card ? (card.realname || card.name) : '未知'
}

// 提交消息 (发送/修改/插入)
const handleFormSubmit = () => {
  if (!newMessage.value.cardId || !newMessage.value.text) return

  const displayName = customName.value || getCardName(newMessage.value.cardId)
  let position = 'left'
  if (newMessage.value.cardId === '_旁白') position = 'center'
  else position = isRightSide.value ? 'right' : 'left'

  const msgData = {
    ...newMessage.value,
    displayName,
    position
  }

  if (editingIndex.value !== null) {
    // 修改
    chatLog.value[editingIndex.value] = msgData
    exitEditing()
  } else if (insertingIndex.value !== null) {
    // 插入
    chatLog.value.splice(insertingIndex.value + 1, 0, msgData)
    exitInserting()
  } else {
    // 发送
    chatLog.value.push(msgData)
    // 滚动到底部
    nextTick(() => {
      if (captureRef.value) captureRef.value.scrollTop = captureRef.value.scrollHeight
    })
  }

  // 清空输入，但保留角色选择
  newMessage.value.text = ''
}

// --- 图片处理 ---
const imageInputRef = ref(null)
const imageUploadMode = ref('add')

const triggerImageUpload = () => {
  imageUploadMode.value = 'add'
  if (!newMessage.value.cardId) {
    alert('请先选择角色')
    return
  }
  imageInputRef.value?.click()
}

const triggerImageReplace = () => {
  imageUploadMode.value = 'replace'
  imageInputRef.value?.click()
  closeEditMenu()
}

const onImageSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const imageUrl = URL.createObjectURL(file)

  const displayName = customName.value || getCardName(newMessage.value.cardId)
  let position = 'left'
  if (newMessage.value.cardId === '_旁白') position = 'center'
  else position = isRightSide.value ? 'right' : 'left'

  const msgData = {
    cardId: newMessage.value.cardId,
    text: imageUrl,
    type: 'image',
    imageBlob: file,
    displayName,
    position
  }

  if (imageUploadMode.value === 'replace' && editMenu.value.index !== null) {
    const oldMsg = chatLog.value[editMenu.value.index]
    if (oldMsg.text) URL.revokeObjectURL(oldMsg.text)
    chatLog.value[editMenu.value.index] = { ...oldMsg, ...msgData }
  } else {
    chatLog.value.push(msgData)
    nextTick(() => {
      if (captureRef.value) captureRef.value.scrollTop = captureRef.value.scrollHeight
    })
  }
  event.target.value = ''
}

// --- 编辑菜单逻辑 ---
const openEditMenu = (index) => {
  editMenu.value = { visible: true, index }
}
const closeEditMenu = () => {
  editMenu.value.visible = false
}

const startEditing = () => {
  const index = editMenu.value.index
  if (index === null) return
  editingIndex.value = index
  const msg = chatLog.value[index]

  newMessage.value.cardId = msg.cardId
  newMessage.value.text = msg.type === 'image' ? '[图片]' : msg.text
  customName.value = msg.displayName === getCardName(msg.cardId) ? '' : msg.displayName
  isRightSide.value = msg.position === 'right'

  closeEditMenu()
}

const exitEditing = () => {
  editingIndex.value = null
  newMessage.value.text = ''
  customName.value = ''
}

const startInserting = () => {
  insertingIndex.value = editMenu.value.index
  closeEditMenu()
  newMessage.value.text = ''
}

const exitInserting = () => {
  insertingIndex.value = null
  newMessage.value.text = ''
}

const deleteMessage = () => {
  const index = editMenu.value.index
  if (index !== null) {
    const msg = chatLog.value[index]
    if (msg.type === 'image' && msg.text) URL.revokeObjectURL(msg.text)
    chatLog.value.splice(index, 1)
    if (editingIndex.value === index) exitEditing()
  }
  closeEditMenu()
}

const clearChat = () => {
  if (confirm('确定清空所有对话吗？')) {
    chatLog.value = []
    exitEditing()
  }
}

// --- 导出图片 ---
const generateImage = async () => {
  if (!captureRef.value) return
  try {
    const dataUrl = await toPng(captureRef.value, {
      pixelRatio: 2,
      backgroundColor: null,
      width: previewConfig.value.width,
      height: previewConfig.value.height,
    })
    const link = document.createElement('a')
    link.download = `MomoTalk-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    logger.error('导出失败', err)
    alert('导出失败')
  }
}

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    if (chatBodyRef.value) {
      chatBodyRef.value.requestFullscreen().catch(err => {
        logger.error('全屏失败', err)
      })
    }
  } else {
    document.exitFullscreen()
  }
}

// --- 存档/读档 (复用逻辑) ---
const showSaveLoadMenu = ref(false)
const autoSaveTime = ref(null)
const slotsData = ref([{}, {}, {}])
const fileInput = ref(null)
const targetImportSlot = ref(null)

const openSaveLoadMenu = async () => {
  autoSaveTime.value = await loadFromDB(DB_KEYS.AUTO_SAVE_TIME)
  for (let i = 1; i <= 3; i++) {
    const data = await loadFromDB(DB_KEYS[`SLOT_${i}`])
    slotsData.value[i - 1] = data ? { name: data.name, timestamp: data.timestamp } : {}
  }
  showSaveLoadMenu.value = true
}
const closeSaveLoadMenu = () => showSaveLoadMenu.value = false

const formatTime = (ts) => new Date(ts).toLocaleString()

const restoreChatLog = (log) => {
  chatLog.value = log
  // 恢复图片URL
  log.forEach(msg => {
    if (msg.type === 'image' && msg.imageBlob) {
      msg.text = URL.createObjectURL(msg.imageBlob)
    }
  })
  closeSaveLoadMenu()
}

const loadAutoSave = async () => {
  const log = await loadFromDB(DB_KEYS.CHAT_LOG)
  if (log) restoreChatLog(log)
}

const saveToSlot = async (index) => {
  const name = slotsData.value[index - 1].name || `存档 ${index}`
  const data = { name, timestamp: Date.now(), chatLog: toRaw(chatLog.value) }
  await saveToDB(DB_KEYS[`SLOT_${index}`], data)
  slotsData.value[index - 1] = { name, timestamp: data.timestamp }
}

const loadFromSlot = async (index) => {
  const data = await loadFromDB(DB_KEYS[`SLOT_${index}`])
  if (data) restoreChatLog(data.chatLog)
}

const clearSlot = async (index) => {
  await deleteFromDB(DB_KEYS[`SLOT_${index}`])
  slotsData.value[index - 1] = {}
}

const exportSlot = async (index) => {
  // 简化版导出逻辑
  const key = index === 'auto' ? DB_KEYS.CHAT_LOG : DB_KEYS[`SLOT_${index}`]
  const data = await loadFromDB(key)
  if (!data) return

  // 处理图片Blob转Base64略... (可复用CustomChatPage逻辑)
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `backup-${index}.json`
  link.click()
}

const triggerImportToSlot = (index) => {
  targetImportSlot.value = index
  fileInput.value.click()
}

const handleImportFile = (e) => {
  // 简化版导入逻辑
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      // 假设数据格式正确
      const slotKey = DB_KEYS[`SLOT_${targetImportSlot.value}`]
      await saveToDB(slotKey, data)
      alert('导入成功')
      openSaveLoadMenu() // 刷新
    } catch (err) {
      alert('导入失败')
      logger.error('导入失败', err)
    }
  }
  reader.readAsText(file)
}

// --- 自定义角色表单 ---
const charForm = ref({ visible: false, mode: 'create', name: '', avatar: null })
const charFormAvatarInputRef = ref(null)

const openCreateCharModal = () => {
  charForm.value = { visible: true, mode: 'create', id: `custom_${Date.now()}`, name: '', avatar: null }
}
const closeCharForm = () => charForm.value.visible = false
const triggerCharAvatarUpload = () => charFormAvatarInputRef.value?.click()
const handleCharAvatarSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => charForm.value.avatar = ev.target.result
    reader.readAsDataURL(file)
  }
}
const saveCharForm = () => {
  if (charForm.value.name && charForm.value.avatar) {
    customCharacters.value.push({
      id: charForm.value.id,
      name: charForm.value.name,
      imageUrl: charForm.value.avatar,
      isCustom: true
    })
    closeCharForm()
  }
}

// --- 生命周期 ---
watch(chatLog, (val) => {
  if (val.length) {
    saveToDB(DB_KEYS.CHAT_LOG, toRaw(val))
    saveToDB(DB_KEYS.AUTO_SAVE_TIME, Date.now())
  }
}, { deep: true })

watch(selectedCharacterIds, (val) => {
  localStorage.setItem('talkPageSelectedChars', JSON.stringify(val))
}, { deep: true })

watch(customCharacters, (val) => {
  saveToDB(DB_KEYS.CUSTOM_CHARS, toRaw(val))
}, { deep: true })

watch(previewConfig, () => {
  nextTick(updateScale)
}, { deep: true })

onMounted(async () => {
  const savedChars = localStorage.getItem('talkPageSelectedChars')
  if (savedChars) selectedCharacterIds.value = JSON.parse(savedChars)

  const savedCustom = await loadFromDB(DB_KEYS.CUSTOM_CHARS)
  if (savedCustom) customCharacters.value = savedCustom
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
  window.addEventListener('resize', updateScale)
  nextTick(updateScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})
</script>

<style scoped>
.background {
  min-height: 100vh;
  background-color: v-bind('colors.background.primary');
  color: v-bind('colors.text.primary');
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

.talk-page-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 聊天主窗口 */
.chat-app-window {
  display: flex;
  flex-direction: column;
  background-color: v-bind('colors.game.backgroundBlack');
  border: 1px solid v-bind('colors.border.primary');
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  margin: 0 auto;
  transition: all 0.3s;
  width: 100%;
  max-width: 800px;
  height: 100vh;
}

.window-header {
  background: v-bind('colors.background.darker');
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.window-title {
  margin: 0;
  font-size: 1rem;
  color: #fff;
}

.chat-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-canvas {
  background-color: v-bind('colors.game.backgroundBlack');
  overflow-y: auto;
  position: relative;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.chat-canvas::-webkit-scrollbar {
  display: none;
}

.chat-log {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 100%;
}

.empty-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 50px;
}

/* 消息样式 */
.chat-message {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
  cursor: pointer;
}

.chat-message.editing {
  outline: 2px solid v-bind('colors.brand.confirm');
  outline-offset: 4px;
  border-radius: 4px;
}

.avatar-container {
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
  margin-right: 10px;
}

.avatar-container.right {
  margin-right: 0;
  margin-left: 10px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 10rem;
}

.character-name {
  font-weight: bold;
  margin-bottom: 5px;
  color: #fff;
  font-size: 1.4rem;
}

.bubble,
.image-bubble {
  background-color: v-bind('colors.game.primary');
  color: white;
  border-radius: 15px;
  padding: 0.25rem 0.5rem 0.375rem 0.5rem;
  position: relative;
  text-align: left;
  font-family: 'Source Han Sans SC VF';
  font-weight: 500;
  font-size: 1.4rem;
  line-height: 1.2;
  display: flex;
  align-items: center;
  white-space: pre-wrap;
  word-break: break-word;
}

.image-bubble {
  padding: 6px;
  background-color: transparent;
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

.bubble.center {
  background-color: v-bind('colors.game.narratorBg');
  color: v-bind('colors.game.narratorText');
  text-align: left;
  padding: 2px 8px 4px 8px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 1rem;
  border-radius: 15px;
  margin: 0 auto;
}

.msg-img {
  max-width: 20rem;
  max-height: 20rem;
  object-fit: cover;
  border-radius: 8px;
}

/* 底部操作区 */
.window-footer {
  background: v-bind('colors.background.content');
  padding: 10px;
  border-top: 1px solid v-bind('colors.border.primary');
}

.char-selector-bar {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px 0;
  border-bottom: 1px solid v-bind('colors.border.primary');
}

.char-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  min-width: 60px;
}

.char-item:hover,
.char-item.active {
  opacity: 1;
  transform: translateY(-2px);
}

.char-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
}

.char-icon.add-icon {
  background: v-bind('colors.brand.confirm');
  font-size: 1.5rem;
}

.char-label {
  font-size: 0.8rem;
  margin-top: 4px;
  white-space: nowrap;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolbar-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-box {
  flex: 1;
  background: v-bind('colors.input.background');
  border-radius: 20px;
  padding: 0 15px;
  border: 1px solid v-bind('colors.border.primary');
}

.chat-input {
  width: 100%;
  background: transparent;
  border: none;
  color: v-bind('colors.text.primary');
  padding: 10px 0;
  resize: none;
  outline: none;
  font-size: 1rem;
  height: 44px;
  line-height: 24px;
}

.tool-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: v-bind('colors.button.defaultBg');
  color: v-bind('colors.button.defaultText');
  cursor: pointer;
  font-weight: bold;
  white-space: nowrap;
}

.tool-btn.primary,
.send-btn {
  background: v-bind('colors.brand.primary');
  color: #000;
}

.send-btn {
  padding: 0 20px;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

.toolbar-options {
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 0.9rem;
}

.mini-input {
  background: v-bind('colors.input.background');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
  padding: 4px 8px;
  border-radius: 4px;
  width: 120px;
}

/* 设置面板 */
.settings-panel {
  background: v-bind('colors.background.content');
  border-radius: 12px;
  padding: 15px;
}

.tools-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-input {
  width: 60px;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.input.background');
  color: v-bind('colors.text.primary');
  text-align: center;
}

/* 弹窗通用样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: v-bind('colors.background.content');
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: v-bind('colors.text.secondary');
  cursor: pointer;
}

.edit-menu-container {
  background: v-bind('colors.background.content');
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 200px;
}

.edit-menu-button {
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: v-bind('colors.button.defaultBg');
  color: v-bind('colors.button.defaultText');
}

.edit-menu-button.delete {
  background: v-bind('colors.button.dangerBg');
  color: v-bind('colors.button.dangerText');
}
</style>

<template>
  <div class="background">
    <div class="chat-page-container">
      <h1 class="page-title">导演模式</h1>

      <div v-if="isSelectionMode" class="selection-mode-container">
        <div class="selection-toolbar">
          <button @click="openCreateCharModal" class="action-button create-char-btn">
            创建新角色
          </button>
          <SwitchComponent v-model="showRealName" label="显示角色真名" />
        </div>
        <CharacterSelector v-model="selectedCharacterIds" v-model:customCharacters="customCharacters"
          :characterList="displayableCharacterList" :showRealName="showRealName" mode="multiple" />
        <button @click="confirmSelection" class="finalize-button" :disabled="selectedCharacterIds.length === 0">
          开始创作 →
        </button>
      </div>

      <div v-else class="strategy-editor">
        <div class="controls-panel card" ref="chatEditorRef">
          <h2>聊天配置</h2>

          <div class="editor-row">
            <select v-model="newMessage.cardId" class="editor-select" style="flex: 1">
              <option :value="null" disabled>选择聊天角色</option>
              <option v-for="card in cardOptions" :key="card.id" :value="card.id" class="option-text">
                {{ card.name }}
              </option>
            </select>
            <SwitchComponent v-if="
              newMessage?.cardId && newMessage.cardId !== '_旁白' && newMessage.cardId !== '_班长'
            " v-model="isRightSide" label="右侧" style="margin-left: 10px" />
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
            <input type="file" ref="imageInputRef" @change="onImageSelected" accept="image/*" style="display: none" />
          </div>
          <div class="editor-row editor-action-row">
            <button @click="handleFormSubmit" class="editor-button">
              {{
                editingIndex !== null
                  ? '修改这条消息'
                  : insertingIndex !== null
                    ? '在此后插入消息'
                    : '添加对话'
              }}
            </button>
            <button v-if="editingIndex !== null" @click="exitEditing" class="editor-button cancel">
              取消修改
            </button>
            <button v-if="insertingIndex !== null" @click="exitInserting" class="editor-button cancel">
              取消插入
            </button>
          </div>

          <div class="control-group">
            <label>导出图片设置</label>
            <div class="config-row">
              <div class="config-item">
                <span>宽度</span>
                <input type="number" v-model="previewConfig.width" class="mini-input" />
              </div>
              <div class="config-item">
                <span>高度</span>
                <input type="number" v-model="previewConfig.height" class="mini-input" />
              </div>
              <div class="config-item">
                <span>圆角</span>
                <input type="number" v-model="previewConfig.radius" class="mini-input" />
              </div>
            </div>
          </div>

          <div class="actions-container">
            <button @click="generateImage" class="action-button export-btn">导出图片</button>
            <button @click="enterSelectionMode" class="action-button">重选角色</button>
            <button @click="openSaveLoadMenu" class="action-button">存档/读档</button>
            <input type="file" ref="fileInput" @change="handleImportFile" accept=".json" style="display: none" />
          </div>
        </div>

        <div class="preview-wrapper" ref="previewWrapper">
          <p class="preview-hint">↓ 预览区域 (可滚动) ↓</p>
          <button v-if="!isFullscreen" class="fullscreen-btn" @click="toggleFullScreen" title="全屏预览">
            <full-screen-one theme="outline" size="20" fill="#fff" />
          </button>
          <div class="capture-area-wrapper" :style="previewStyle">
            <div class="chat-log-container" ref="captureRef" :style="{
              width: previewConfig.width + 'px',
              height: previewConfig.height + 'px',
              borderRadius: previewConfig.radius + 'px',
            }">
              <div class="chat-log">
                <div v-for="(message, index) in chatLog" :key="index" class="chat-message" :class="{
                  'editing-highlight': index === editingIndex,
                  'insert-highlight-after': index === insertingIndex,
                  [message.position]: true,
                }" @click="openEditMenu(index)">
                  <template v-if="message.position === 'center'">
                    <div class="bubble center">{{ message.text }}</div>
                  </template>

                  <template v-else>
                    <div v-if="
                      message.position === 'left' &&
                      message.cardId !== '_班长' &&
                      isCardMissing(message.cardId)
                    " class="avatar missing-avatar"
                      @click.stop="openRepairCharModal(message.cardId, message.displayName)">
                      丢失<br /><span style="font-size: 0.8em">点击修复</span>
                    </div>
                    <img v-else-if="message.position === 'left' && message.cardId !== '_班长'"
                      :src="getCardAvatar(message.cardId)" :alt="message.displayName + '头像'" class="avatar" />
                    <div class="message-content">
                      <div v-if="message.displayName" class="character-name">
                        {{ message.displayName }}
                      </div>
                      <div :class="{
                        'image-bubble': message.type === 'image',
                        bubble: message.type !== 'image',
                      }">
                        <template v-if="message.type === 'image'">
                          <img v-if="message.text" :src="message.text" class="message-image" alt="图片消息" />
                          <div v-else class="image-placeholder">
                            图片数据丢失<br />点击编辑重新上传
                          </div>
                        </template>
                        <span v-else>{{ message.text }}</span>
                      </div>
                    </div>
                    <div v-if="
                      message.position === 'right' &&
                      message.cardId !== '_班长' &&
                      isCardMissing(message.cardId)
                    " class="avatar right-avatar missing-avatar"
                      @click.stop="openRepairCharModal(message.cardId, message.displayName)">
                      丢失<br /><span style="font-size: 0.8em">点击修复</span>
                    </div>
                    <img v-else-if="message.position === 'right' && message.cardId !== '_班长'"
                      :src="getCardAvatar(message.cardId)" :alt="message.displayName + '头像'"
                      class="avatar right-avatar" />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="agreement">
        使用则代表您同意<a class="highlight" @click="openAgreementPopUp" href="#">《织夜工具箱创作条款》</a>
      </p>
    </div>
  </div>
  <!-- 编辑菜单 -->
  <div v-if="editMenu.visible" class="overlay" @click="closeEditMenu">
    <div class="edit-menu-container">
      <button class="close-menu-top-right" @click="closeEditMenu">×</button>
      <h3 class="edit-menu-title">编辑消息</h3>
      <button class="edit-menu-button" @click="startEditing">编辑这条消息</button>
      <button v-if="chatLog[editMenu.index].type === 'image'" class="edit-menu-button" @click="triggerImageReplace">
        重新上传图片
      </button>
      <button class="edit-menu-button" @click="startInserting">在此后插入消息</button>
      <button class="edit-menu-button delete" @click="deleteMessage">删除消息</button>
    </div>
  </div>
  <!-- 存档/读档菜单 -->
  <div v-if="showSaveLoadMenu" class="overlay" @click.self="closeSaveLoadMenu">
    <div class="save-load-menu">
      <button class="close-menu-top-right" @click="closeSaveLoadMenu">×</button>
      <h3 class="menu-title">存档管理</h3>

      <div class="slot-section">
        <div class="slot-header">自动存档 (退出浏览器后可在此恢复)</div>
        <div class="slot-item">
          <div class="slot-row-top" style="justify-content: center">
            <span class="slot-time-small">{{
              autoSaveTime ? formatTime(autoSaveTime) : '暂无记录'
              }}</span>
          </div>
          <div class="slot-row-bottom">
            <button class="action-button" @click="loadAutoSave" :disabled="!autoSaveTime">
              读取
            </button>
            <button class="action-button" @click="exportSlot('auto')" :disabled="!autoSaveTime">
              导出
            </button>
          </div>
        </div>
      </div>
      <div class="slot-section">
        <div class="slot-header">手动存档</div>
        <div v-for="(slot, index) in slotsData" :key="index" class="slot-item">
          <div class="slot-row-top">
            <input v-model="slot.name" class="slot-name-input" :placeholder="'点击输入存档名'" />
            <span class="slot-time-small">{{
              slot.timestamp ? formatTime(slot.timestamp) : '空'
              }}</span>
            <button class="delete-slot-btn" @click="clearSlot(index + 1)" title="删除存档" v-if="slot.timestamp">
              ×
            </button>
          </div>
          <div class="slot-row-bottom">
            <button class="action-button save-btn" @click="saveToSlot(index + 1)">保存</button>
            <button class="action-button" @click="loadFromSlot(index + 1)">读取</button>
            <button class="action-button" @click="exportSlot(index + 1)" :disabled="!slot.timestamp">
              导出文件
            </button>
            <button class="action-button" @click="triggerImportToSlot(index + 1)">导入文件</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 统一的角色编辑/修复弹窗 -->
  <div v-if="charForm.visible" class="overlay" @click="closeCharForm">
    <div class="custom-character-form" @click.stop>
      <h3>{{ charForm.mode === 'create' ? '创建自定义角色' : '修复丢失角色' }}</h3>
      <div class="form-row">
        <label>角色名称</label>
        <input type="text" v-model="charForm.name" placeholder="输入角色名字" />
      </div>
      <div class="form-row">
        <label>角色头像</label>
        <button @click="triggerCharAvatarUpload" class="action-button">
          {{ charForm.avatar ? '更换图片' : '上传图片' }}
        </button>
        <input type="file" ref="charFormAvatarInputRef" @change="handleCharAvatarSelected" accept="image/*"
          style="display: none" />
      </div>
      <div v-if="charForm.avatar" class="avatar-preview-container">
        <p>头像预览：</p>
        <img :src="charForm.avatar" alt="头像预览" class="avatar-preview" />
      </div>
      <div class="form-actions">
        <button @click="saveCharForm" class="action-button">
          {{ charForm.mode === 'create' ? '保存角色' : '保存并修复' }}
        </button>
        <button @click="closeCharForm" class="action-button cancel">取消</button>
      </div>
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
        <strong>用户责任：</strong>
        您使用织夜工具箱时，需确保遵守相关法律法规及游戏运营商的规定。若您使用本服务进行任何违法或违规行为，您将承担全部责任，织夜工具箱对此不承担任何责任。
      </li>
      <li>
        <strong>数据使用与隐私保护：</strong>
        我们承诺保护您的个人隐私。目前织夜工具箱不收集任何个人数据，所有聊天记录和图片数据均存储在您的本地浏览器中。
      </li>
      <li>
        <strong>服务变更、中断或终止：</strong>
        本服务免费提供。我们保留随时修改、中断或终止服务的权利，恕不另行通知。
      </li>
      <li>
        <strong>协议修改：</strong>
        我们有权根据需要不时地修改本协议。协议修改后，如果您继续使用本服务，即视为您已接受修改后的协议。
      </li>
    </ol>
    <button @click="closeAgreementPopUp" class="action-button">我已阅读并同意</button>
  </PopUp>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
import { allCards } from '@/data/cards.js'
import { colors } from '@/styles/colors.js'
import PopUp from '@/components/PopUp.vue'
import CharacterSelector from '@/components/CharacterSelector.vue'
import { logger } from '@/utils/logger'
import { saveToDB, loadFromDB, deleteFromDB, DB_KEYS } from '@/utils/chatStorage.js'
import { toPng } from 'html-to-image'
import SwitchComponent from '@/components/SwitchComponent.vue'
import { FullScreenOne } from '@icon-park/vue-next'

const showAgreementPopUp = ref(false)
const openAgreementPopUp = () => {
  showAgreementPopUp.value = true
}
const closeAgreementPopUp = () => {
  showAgreementPopUp.value = false
}

// true: 显示角色选择界面, false: 显示聊天编辑器
const isSelectionMode = ref(true)
const showRealName = ref(false)
// 存储用户选择的角色ID
const selectedCharacterIds = ref([])
// 用于本地存储的键名
const characterSelectionKey = 'chatCharacterSelection'

// 预览配置
const previewConfig = ref({
  width: 540,
  height: 450,
  radius: 0,
})
const captureRef = ref(null)
const previewWrapper = ref(null)
const isFullscreen = ref(false)
const originalPreviewConfig = ref(null)

const toggleFullScreen = async () => {
  if (!previewWrapper.value) return
  if (!document.fullscreenElement) {
    try {
      await previewWrapper.value.requestFullscreen()
    } catch (e) {
      logger.error('进入全屏失败', e)
    }
  } else {
    document.exitFullscreen()
  }
}

const handleFullscreenChange = () => {
  if (document.fullscreenElement) {
    isFullscreen.value = true
    originalPreviewConfig.value = { ...previewConfig.value }
    previewConfig.value.width = window.innerWidth
    previewConfig.value.height = window.innerHeight
    previewConfig.value.radius = 0
  } else {
    isFullscreen.value = false
    if (originalPreviewConfig.value) {
      previewConfig.value = { ...originalPreviewConfig.value }
      originalPreviewConfig.value = null
    }
  }
}

// 保存预览配置
watch(previewConfig, (newConfig) => {
  if (isFullscreen.value) return
  localStorage.setItem('customChatPreviewConfig', JSON.stringify(newConfig))
})

// 修复预览区设置修改后不立即生效的问题
watch(
  previewConfig,
  () => {
    nextTick(updatePreviewScale)
  },
  { deep: true },
)

// 自定义角色相关状态
const customCharacters = ref([])

// 统一的角色表单状态 (创建/修复)
const charForm = ref({
  visible: false,
  mode: 'create', // 'create' | 'repair'
  id: null,
  name: '',
  avatar: null,
})
const charFormAvatarInputRef = ref(null)

const openCreateCharModal = () => {
  charForm.value = {
    visible: true,
    mode: 'create',
    id: `custom_${Date.now()}`,
    name: '',
    avatar: null,
  }
}

const openRepairCharModal = (cardId, currentDisplayName) => {
  charForm.value = {
    visible: true,
    mode: 'repair',
    id: cardId,
    name: currentDisplayName || '',
    avatar: null,
  }
}

const closeCharForm = () => {
  charForm.value.visible = false
}

const triggerCharAvatarUpload = () => {
  charFormAvatarInputRef.value?.click()
}

const handleCharAvatarSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    charForm.value.avatar = e.target.result
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

const saveCharForm = () => {
  if (!charForm.value.name.trim() || !charForm.value.avatar) {
    alert('请填写名称并上传头像')
    return
  }
  const newChar = {
    id: charForm.value.id,
    name: charForm.value.name.trim(),
    imageUrl: charForm.value.avatar,
    isCustom: true,
  }
  customCharacters.value.push(newChar)
  closeCharForm()
}

const displayableCharacterList = computed(() => {
  const formattedCustom = customCharacters.value.map((c) => ({
    ...c,
    realname: c.name,
    isCustom: true,
  }))
  // 仅包含纯数字id的预设角色
  return [...allCards.filter((card) => /^\d+$/.test(card.id)), ...formattedCustom]
})

// 监听自定义角色数组的变化，并自动保存到localStorage
watch(
  customCharacters,
  (newValue) => {
    // 使用 toRaw 确保保存的是普通对象
    saveToDB(
      DB_KEYS.CUSTOM_CHARS,
      newValue.map((c) => toRaw(c)),
    )
  },
  { deep: true },
)

// 确认选择，进入聊天编辑器
const confirmSelection = () => {
  isSelectionMode.value = false
  nextTick(() => {
    updatePreviewScale()
  })
}

// 返回角色选择界面
const enterSelectionMode = () => {
  isSelectionMode.value = true
}

// 存储所有聊天记录
const chatLog = ref([])

// 每个聊天记录的格式
const newMessage = ref({
  displayName: null,
  cardId: null,
  text: '',
  type: 'text',
  position: 'left',
})

// 自定义名称
const customName = ref('')
// 控制消息是否显示在右侧
const isRightSide = ref(false)

// 监听 cardId 的变化，自动设置 position 属性
watch(
  () => newMessage.value.cardId,
  (newCardId) => {
    if (newCardId === '_旁白') {
      newMessage.value.position = 'center'
    } else if (newCardId === '_班长') {
      isRightSide.value = true
      newMessage.value.position = 'right'
    } else {
      isRightSide.value = false
      newMessage.value.position = 'left'
    }
    // 清空自定义名称
    customName.value = ''
  },
)

// 监听开关变化，更新 position
watch(isRightSide, (val) => {
  if (newMessage.value.cardId === '_旁白') return
  newMessage.value.position = val ? 'right' : 'left'
})

// 生成下拉选择器的选项
const cardOptions = computed(() => {
  // 从 allCards 中过滤出完整的角色对象
  const selectedPredefined = allCards
    .filter((card) => selectedCharacterIds.value.includes(card.id))
    .map((card) => ({
      id: card.id,
      name: card.realname ? `${card.name} (${card.realname})` : card.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))

  // 从 customCharacters 中过滤
  const selectedCustom = customCharacters.value
    .filter((card) => selectedCharacterIds.value.includes(card.id))
    .map((card) => ({
      id: card.id,
      name: `${card.name} (自定义)`,
    }))

  return [
    { id: '_班长', name: '班长' },
    { id: '_旁白', name: '旁白' },
    ...selectedPredefined,
    ...selectedCustom, // 添加到列表
  ]
})

const getCardAvatar = (cardId) => {
  // 优先在预设角色中查找
  const predefinedCard = allCards.find((c) => c.id === cardId)
  if (predefinedCard) {
    return predefinedCard.imageUrl
  }
  // 如果找不到，则在自定义角色中查找
  const customCard = customCharacters.value.find((c) => c.id === cardId)
  if (customCard) {
    return customCard.imageUrl
  }
  // 都找不到则返回占位图
  return '/images/cards/placeholder.jpg'
}

const getCardName = (cardId) => {
  if (cardId === '_班长' || cardId === '_旁白') {
    return null
  }
  // 优先在预设角色中查找
  const predefinedCard = allCards.find((c) => c.id === cardId)
  if (predefinedCard) {
    return predefinedCard.realname || predefinedCard.name
  }
  // 如果找不到，则在自定义角色中查找
  const customCard = customCharacters.value.find((c) => c.id === cardId)
  if (customCard) {
    return customCard.name
  }
  return '未知角色'
}

const isCardMissing = (cardId) => {
  if (!cardId || cardId === '_旁白' || cardId === '_班长') return false
  const exists =
    allCards.some((c) => c.id === cardId) || customCharacters.value.some((c) => c.id === cardId)
  return !exists
}

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// 添加新消息到聊天记录
const addMessage = () => {
  if (!newMessage.value.cardId || !newMessage.value.text) {
    alert('请选择一个角色并输入对话内容。')
    return
  }
  let displayName = null
  // 如果自定义名称不为空，则优先使用自定义名称
  if (customName.value.trim()) {
    displayName = customName.value
  } else {
    // 否则使用角色的默认名称
    displayName = getCardName(newMessage.value.cardId)
  }
  chatLog.value.push({
    ...newMessage.value,
    displayName: displayName, // 将最终要显示的名字存入消息对象
  })

  // 清空文本框和自定义名称框
  newMessage.value.text = ''
}

// 图片上传功能
const imageInputRef = ref(null) // 新增：对文件输入框的引用
// 当前图片上传模式
const imageUploadMode = ref('add') // 'add' 或 'replace'

// 点击“添加图片”按钮时，触发隐藏的文件选择框
const triggerImageUpload = () => {
  imageUploadMode.value = 'add'
  if (!newMessage.value.cardId) {
    alert('请先选择一个角色，再添加图片。')
    return
  }
  if (newMessage.value.cardId === '_旁白') {
    alert('旁白不允许发送图片。')
    return
  }
  imageInputRef.value?.click()
}

// 触发“重新上传图片”
const triggerImageReplace = () => {
  imageUploadMode.value = 'replace'
  imageInputRef.value?.click()
  closeEditMenu()
}
const onImageSelected = (event) => {
  if (imageUploadMode.value === 'add') {
    addImageMessage(event)
  } else {
    replaceImageMessage(event)
  }
}

// 当用户选择了图片文件后
const addImageMessage = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 生成临时的 blob URL
  const imageUrl = URL.createObjectURL(file)

  // 创建消息
  const displayName = customName.value || getCardName(newMessage.value.cardId)

  let position = 'left'
  if (newMessage.value.cardId === '_旁白') position = 'center'
  else position = isRightSide.value ? 'right' : 'left'

  // 在插入模式下，插入到指定位置后
  if (insertingIndex.value !== null) {
    chatLog.value.splice(insertingIndex.value + 1, 0, {
      cardId: newMessage.value.cardId,
      text: imageUrl, // text 字段现在存储URL
      type: 'image', // 类型为 image
      imageBlob: file, // 存储 Blob 对象以便保存到 IndexedDB
      displayName: displayName,
      customName: customName.value,
      position: position,
    })
    exitInserting()
    event.target.value = '' // 清空文件输入框
  } else {
    // 添加新消息到末尾
    chatLog.value.push({
      cardId: newMessage.value.cardId,
      text: imageUrl, // text 字段现在存储URL
      type: 'image', // 类型为 image
      imageBlob: file, // 存储 Blob 对象以便保存到 IndexedDB
      displayName: displayName,
      customName: customName.value,
      position: position,
    })
  }
  // 清空文件输入框的值，以便连续选择同一张图片
  event.target.value = ''
}

const replaceImageMessage = (event) => {
  const file = event.target.files[0]
  const index = editMenu.value.index
  if (!file || index === null) return

  const messageToUpdate = chatLog.value[index]
  const oldUrl = messageToUpdate.text

  // 释放旧的URL以回收内存
  URL.revokeObjectURL(oldUrl)

  // 创建并跟踪新的URL
  const newUrl = URL.createObjectURL(file)

  // 更新消息内容
  messageToUpdate.text = newUrl
  messageToUpdate.imageBlob = file // 更新 Blob 对象

  // 清空文件输入框
  event.target.value = ''
}

// 编辑菜单
const editMenu = ref({
  visible: false,
  index: null,
})

// 编辑模式
const editingIndex = ref(null) // null 表示不在编辑模式, 数字表示正在编辑的消息索引
const chatEditorRef = ref(null) // 用于滚动到编辑区
const insertingIndex = ref(null) // null 表示不在插入模式, 数字表示要插入消息的目标索引

// 重置编辑器状态
const resetEditor = () => {
  newMessage.value.cardId = null
  newMessage.value.text = ''
  customName.value = ''
}

// 触发编辑消息
const startEditing = () => {
  const index = editMenu.value.index
  if (index === null) return

  // 进入编辑模式
  exitInserting() // 取消插入模式
  editingIndex.value = index
  const message = chatLog.value[index]

  // 检查并添加当前编辑的角色ID (如果该角色已被移除)
  const isSpecialId = message.cardId === '_班长' || message.cardId === '_旁白'
  if (!isSpecialId && !selectedCharacterIds.value.includes(message.cardId)) {
    selectedCharacterIds.value.push(message.cardId)
  }
  newMessage.value.cardId = message.cardId

  // 恢复开关状态
  nextTick(() => {
    if (message.cardId !== '_旁白') {
      isRightSide.value = message.position === 'right'
    }
  })

  // 加载消息数据到编辑器
  // 使用 nextTick 确保添加角色而更新的选项已渲染
  nextTick(() => {
    customName.value = message.displayName
    if (message.type === 'image') {
      newMessage.value.text = '【图片消息】' // 图片消息不加载文本
    } else {
      newMessage.value.text = message.text // 其他情况加载文本
    }
  })

  closeEditMenu()
  // 滚动到编辑器
  chatEditorRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// 修改完成
const updateMessage = () => {
  if (editingIndex.value === null || !newMessage.value.cardId || !newMessage.value.text) {
    alert('请确保已选择角色并填写内容。')
    return
  }

  const messageToUpdate = chatLog.value[editingIndex.value]
  // 从编辑器读取数据并更新
  messageToUpdate.cardId = newMessage.value.cardId
  messageToUpdate.text = newMessage.value.text
  messageToUpdate.displayName = customName.value
    ? customName.value
    : getCardName(newMessage.value.cardId)

  // 根据新角色更新消息位置
  const newCardId = newMessage.value.cardId
  if (newCardId === '_旁白') messageToUpdate.position = 'center'
  else messageToUpdate.position = isRightSide.value ? 'right' : 'left'

  exitEditing()
}

// 退出编辑模式并重置编辑器
const exitEditing = () => {
  editingIndex.value = null
  resetEditor()
}

// 进入插入消息模式
const startInserting = () => {
  const index = editMenu.value.index
  if (index === null) return

  // 如果当前在编辑模式，先取消
  exitEditing()

  insertingIndex.value = index
  closeEditMenu()
  resetEditor() // 清空编辑器以便输入新内容
  chatEditorRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// 执行插入操作
const insertMessage = () => {
  if (insertingIndex.value === null || !newMessage.value.cardId || !newMessage.value.text) {
    alert('请选择一个角色并输入对话内容。')
    return
  }

  let displayName = customName.value.trim()
    ? customName.value.trim()
    : getCardName(newMessage.value.cardId)

  const messageToInsert = {
    ...newMessage.value,
    displayName: displayName,
  }

  // 使用 splice 在指定位置后插入新消息
  chatLog.value.splice(insertingIndex.value + 1, 0, messageToInsert)

  exitInserting() // 退出插入模式并重置
}

// 退出插入模式
const exitInserting = () => {
  insertingIndex.value = null
  resetEditor()
}

// 根据模式决定添加/修改/插入消息
const handleFormSubmit = () => {
  if (editingIndex.value !== null) {
    updateMessage()
  } else if (insertingIndex.value !== null) {
    insertMessage()
  } else {
    addMessage()
  }
}

// 删除消息
const deleteMessage = () => {
  const index = editMenu.value.index
  if (index === null) return
  if (window.confirm('确定要删除这条消息吗？')) {
    const msg = chatLog.value[index]
    if (msg.type === 'image' && msg.text) {
      URL.revokeObjectURL(msg.text)
    }
    chatLog.value.splice(index, 1)
    // 如果删除的是正在编辑的消息，则取消编辑
    if (editingIndex.value === index) {
      exitEditing()
    }
  }
  closeEditMenu()
}

// 开关菜单
const openEditMenu = (index) => {
  editMenu.value.index = index
  editMenu.value.visible = true
}
const closeEditMenu = () => {
  editMenu.value.visible = false
}

// 导出指定存档
const exportSlot = async (slotIndex) => {
  let dataToExport = null
  let fileName = ''

  if (slotIndex === 'auto') {
    dataToExport = await loadFromDB(DB_KEYS.CHAT_LOG)
    if (!dataToExport || dataToExport.length === 0) {
      alert('自动存档为空')
      return
    }
    fileName = `织夜工具箱-自动存档-${new Date().toISOString().slice(0, 10)}.json`
  } else {
    const key = DB_KEYS[`SLOT_${slotIndex}`]
    const data = await loadFromDB(key)
    if (!data || !data.chatLog) {
      alert('该存档为空')
      return
    }
    dataToExport = data.chatLog
    const name = data.name || `存档${slotIndex}`
    fileName = `织夜工具箱-${name}-${new Date().toISOString().slice(0, 10)}.json`
  }

  // 将图片转换为Base64以便导出
  if (dataToExport) {
    dataToExport = await Promise.all(
      dataToExport.map(async (msg) => {
        const newMsg = { ...msg }
        if (newMsg.type === 'image' && newMsg.imageBlob) {
          try {
            newMsg.imageBase64 = await blobToBase64(newMsg.imageBlob)
            // 导出时不保留 blob 对象和临时 URL，减小体积并避免混淆
            delete newMsg.imageBlob
            delete newMsg.text
          } catch (e) {
            logger.error('图片导出转换失败', e)
          }
        }
        return newMsg
      }),
    )
  }

  const dataStr = JSON.stringify(dataToExport, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// 导入聊天记录的相关逻辑
const fileInput = ref(null)
const targetImportSlot = ref(null)

const triggerImportToSlot = (slotIndex) => {
  targetImportSlot.value = slotIndex
  fileInput.value.click()
}

const handleImportFile = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const importedData = JSON.parse(e.target.result)
      if (!Array.isArray(importedData)) {
        throw new Error('文件格式不正确，需要是数组格式。')
      }

      // 处理导入的数据，将 Base64 还原为 Blob
      const processedData = await Promise.all(
        importedData.map(async (msg) => {
          if (msg.type === 'image' && msg.imageBase64) {
            try {
              const res = await fetch(msg.imageBase64)
              const blob = await res.blob()
              msg.imageBlob = blob
              // 移除 base64 字符串以节省内存
              delete msg.imageBase64
            } catch (err) {
              logger.error('图片导入还原失败', err)
            }
          }
          return msg
        }),
      )

      if (targetImportSlot.value !== null) {
        const index = targetImportSlot.value
        const key = DB_KEYS[`SLOT_${index}`]

        // 尝试保留原有名称
        const existing = await loadFromDB(key)
        const name = existing?.name || `存档 ${index}`

        const newData = {
          name,
          timestamp: Date.now(),
          chatLog: processedData,
        }

        await saveToDB(key, newData)

        // 更新UI
        slotsData.value[index - 1] = {
          name: newData.name,
          timestamp: newData.timestamp,
        }
        alert(`成功导入到存档 ${index}`)
      }
    } catch (error) {
      alert(`导入失败：${error.message}`)
    } finally {
      // 清空文件输入
      event.target.value = ''
      targetImportSlot.value = null
    }
  }
  reader.readAsText(file)
}
const previewScale = ref(1)

const updatePreviewScale = () => {
  if (!previewWrapper.value) return
  if (isFullscreen.value) {
    // 修复移动端全屏旋转后尺寸不对的问题
    if (
      previewConfig.value.width !== window.innerWidth ||
      previewConfig.value.height !== window.innerHeight
    ) {
      previewConfig.value.width = window.innerWidth
      previewConfig.value.height = window.innerHeight
    }
    previewScale.value = 1
    return
  }
  const wrapperWidth = previewWrapper.value.clientWidth
  // 目标宽度为配置宽度 + 左右留白
  const targetWidth = previewConfig.value.width + 40

  if (wrapperWidth < targetWidth) {
    previewScale.value = wrapperWidth / targetWidth
  } else {
    previewScale.value = 1
  }
}

const previewStyle = computed(() => {
  if (previewScale.value >= 1) return {}
  return {
    transform: `scale(${previewScale.value})`,
    transformOrigin: 'top center',
    marginBottom: `${-(previewConfig.value.height * (1 - previewScale.value))}px`,
  }
})

// 生成图片
const generateImage = async () => {
  if (!captureRef.value) return

  // 临时重置缩放以保证生成图片的清晰度和尺寸
  const originalScale = previewScale.value
  previewScale.value = 1

  const scrollTop = captureRef.value.scrollTop
  const chatLogEl = captureRef.value.querySelector('.chat-log')
  const originalTransform = chatLogEl.style.transform

  // 临时调整DOM以模拟滚动位置，解决html-to-image不支持scrolled element的问题
  captureRef.value.scrollTop = 0
  chatLogEl.style.transform = `translateY(-${scrollTop}px)`

  try {
    await nextTick()
    const dataUrl = await toPng(captureRef.value, {
      pixelRatio: 2,
      backgroundColor: null, // 保持透明背景，以便圆角生效
      width: previewConfig.value.width,
      height: previewConfig.value.height,
      skipFonts: false,
      cacheBust: false,
    })
    const link = document.createElement('a')
    link.download = `聊天记录-${new Date().toISOString().slice(0, 10)}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    logger.error('生成图片失败:', err)
    alert('生成失败')
  } finally {
    chatLogEl.style.transform = originalTransform
    captureRef.value.scrollTop = scrollTop
    previewScale.value = originalScale // 恢复缩放
  }
}

// 监听聊天记录变化，实现自动存档功能
watch(
  chatLog,
  (newVal) => {
    // 避免在清空记录时保存空数据
    if (!newVal || newVal.length === 0) return
    // 使用 toRaw 确保保存的是普通对象，保留 Blob
    saveToDB(
      DB_KEYS.CHAT_LOG,
      newVal.map((msg) => toRaw(msg)),
    )
    saveToDB(DB_KEYS.AUTO_SAVE_TIME, Date.now())
  },
  { deep: true },
)

// 监听选择的角色ID，保存到 localStorage (ID列表较小，保持使用 localStorage)
watch(
  selectedCharacterIds,
  (newVal) => {
    localStorage.setItem(characterSelectionKey, JSON.stringify(newVal))
  },
  { deep: true },
)

// --- 存档/读档 逻辑 ---
const showSaveLoadMenu = ref(false)
const autoSaveTime = ref(null)
const slotsData = ref([
  { name: '', timestamp: null },
  { name: '', timestamp: null },
  { name: '', timestamp: null },
])

const formatTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}

const openSaveLoadMenu = async () => {
  const t = await loadFromDB(DB_KEYS.AUTO_SAVE_TIME)
  autoSaveTime.value = t

  for (let i = 1; i <= 3; i++) {
    const key = DB_KEYS[`SLOT_${i}`]
    const data = await loadFromDB(key)
    if (data) {
      slotsData.value[i - 1] = {
        name: data.name || '',
        timestamp: data.timestamp,
      }
    } else {
      slotsData.value[i - 1] = { name: '', timestamp: null }
    }
  }
  showSaveLoadMenu.value = true
}

const closeSaveLoadMenu = () => {
  showSaveLoadMenu.value = false
}

const restoreChatLog = (logData) => {
  chatLog.value.forEach((msg) => {
    if (msg.type === 'image' && msg.text) {
      URL.revokeObjectURL(msg.text)
    }
  })

  logData.forEach((msg) => {
    if (msg.type === 'image' && msg.imageBlob) {
      try {
        // 重新创建临时 URL
        msg.text = URL.createObjectURL(msg.imageBlob)
      } catch (e) {
        logger.error('恢复图片消息失败', e)
        msg.text = ''
      }
    }
  })
  // 将存档中出现的有效角色添加到已选列表
  const validIds = new Set(selectedCharacterIds.value)
  logData.forEach((msg) => {
    if (msg.cardId && msg.cardId !== '_旁白' && msg.cardId !== '_班长') {
      if (!isCardMissing(msg.cardId)) {
        validIds.add(msg.cardId)
      }
    }
  })
  selectedCharacterIds.value = Array.from(validIds)
  chatLog.value = logData
}

const loadAutoSave = async () => {
  if (chatLog.value.length > 0) {
    if (!confirm('当前编辑内容将被覆盖，确定读取自动存档吗？')) return
  }
  const log = await loadFromDB(DB_KEYS.CHAT_LOG)
  if (log && log.length > 0) {
    restoreChatLog(log)
    closeSaveLoadMenu()
    isSelectionMode.value = false
  } else {
    alert('读取失败或无记录')
  }
}

const saveToSlot = async (index) => {
  const slotKey = DB_KEYS[`SLOT_${index}`]
  if (slotsData.value[index - 1].timestamp) {
    if (
      !confirm(
        `存档 "${slotsData.value[index - 1].name || `存档 ${index}`}" 已有内容，确定要覆盖吗？`,
      )
    ) {
      return
    }
  }
  const name = slotsData.value[index - 1].name || `存档 ${index}`
  const data = {
    name,
    timestamp: Date.now(),
    chatLog: chatLog.value.map((msg) => toRaw(msg)),
  }
  await saveToDB(slotKey, data)
  slotsData.value[index - 1].timestamp = data.timestamp
}

const loadFromSlot = async (index) => {
  const isSlotEmpty = !slotsData.value[index - 1].timestamp
  if (chatLog.value.length > 0) {
    const msg = isSlotEmpty
      ? '该存档为空，读取将清空当前对话，确定吗？'
      : '当前编辑内容将被覆盖，确定读取该存档吗？'
    if (!confirm(msg)) return
  }

  if (isSlotEmpty) {
    restoreChatLog([])
    closeSaveLoadMenu()
    return
  }

  const slotKey = DB_KEYS[`SLOT_${index}`]
  const data = await loadFromDB(slotKey)
  if (data && data.chatLog) {
    restoreChatLog(data.chatLog)
    closeSaveLoadMenu()
    isSelectionMode.value = false
  } else {
    restoreChatLog([])
    closeSaveLoadMenu()
  }
}

const clearSlot = async (index) => {
  if (!slotsData.value[index - 1].timestamp) return

  if (!confirm(`确定要删除存档 ${index} 吗？此操作无法撤销。`)) return

  const slotKey = DB_KEYS[`SLOT_${index}`]
  await deleteFromDB(slotKey)

  slotsData.value[index - 1] = { name: '', timestamp: null }
}

// 在组件挂载时加载已保存的角色选择以及自定义角色
onMounted(async () => {
  const savedCustomCharacters = await loadFromDB(DB_KEYS.CUSTOM_CHARS)
  if (savedCustomCharacters) {
    customCharacters.value = savedCustomCharacters
  }
  const savedSelection = localStorage.getItem(characterSelectionKey)
  if (savedSelection) {
    try {
      selectedCharacterIds.value = JSON.parse(savedSelection)
    } catch (e) {
      logger.error('解析已选角色配置失败:', e)
      // 解析失败则停留在选择模式
      isSelectionMode.value = true
    }
  } else {
    // 首次访问，停留在选择模式
    isSelectionMode.value = true
  }

  // 进入页面时应用保存的预览配置
  const savedPreviewConfig = localStorage.getItem('customChatPreviewConfig')
  if (savedPreviewConfig) {
    try {
      const parsedConfig = JSON.parse(savedPreviewConfig)
      previewConfig.value = {
        ...previewConfig.value,
        ...parsedConfig,
      }
    } catch (e) {
      logger.error('解析预览配置失败:', e)
    }
  }

  window.addEventListener('resize', updatePreviewScale)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  updatePreviewScale()
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePreviewScale)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
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

.chat-page-container {
  padding: 8px;
  width: 100%;
  color: v-bind('colors.text.primary');
  box-sizing: border-box;
}

.page-title {
  text-align: center;
  font-size: 2em;
  color: v-bind('colors.text.highlight');
  margin: 10px 0;
}

/* 布局容器 */
.strategy-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  align-items: flex-start;
}

.controls-panel {
  flex: 1;
  min-width: 300px;
  background: v-bind('colors.background.content');
  padding: 15px;
  border-radius: 12px;
  height: fit-content;
  box-sizing: border-box;
  border: 1px solid v-bind('colors.border.primary');
}

.controls-panel h2 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.5rem;
  color: v-bind('colors.text.highlight');
  border-bottom: 1px solid v-bind('colors.border.primary');
  padding-bottom: 10px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: v-bind('colors.text.highlight');
}

/* 小按钮样式 */
.actions-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid v-bind('colors.border.primary');
}

.actions-container .action-button {
  flex: 1;
}

/* 按钮样式 */
.action-button {
  padding: 0.5rem 1rem;
  border: none;
  background-color: v-bind('colors.button.defaultBg');
  color: v-bind('colors.button.defaultText');
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: v-bind('colors.button.hoverBg');
  color: v-bind('colors.button.hoverText');
}

.export-btn {
  background-color: v-bind('colors.brand.confirm');
  color: white;
  border: none;
}

.config-row {
  display: flex;
  gap: 10px;
}

.config-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.config-item span {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.mini-input {
  width: 100%;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.input.background');
  color: v-bind('colors.input.text');
  box-sizing: border-box;
}

/* 预览区样式 */
.preview-wrapper {
  flex: 2;
  min-width: 300px;
  overflow: hidden;
  border: 2px dashed v-bind('colors.border.dashed');
  background: v-bind('colors.background.darker');
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  min-height: 600px;
  position: relative;
}

.preview-hint {
  color: v-bind('colors.text.secondary');
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.fullscreen-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background-color 0.2s;
}

.fullscreen-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.preview-wrapper:fullscreen {
  width: 100vw;
  height: 100vh;
  padding: 0;
  border: none;
  border-radius: 0;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-wrapper:fullscreen .preview-hint {
  display: none;
}

.preview-wrapper:fullscreen .capture-area-wrapper {
  box-shadow: none;
}

.chat-log-container {
  background-color: v-bind('colors.game.backgroundBlack');
  overflow-y: auto;
  overflow-x: hidden;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative;
  box-sizing: border-box;
  padding: 20px;
}

.chat-log-container::-webkit-scrollbar {
  display: none;
}

.chat-log {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  min-height: 100%;
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

.avatar.missing-avatar {
  background-color: v-bind('colors.status.errorBg');
  border: 2px dashed v-bind('colors.status.error');
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: v-bind('colors.status.error');
  cursor: pointer;
  text-align: center;
  line-height: 1.2;
}

.avatar.right-avatar {
  margin-right: 0;
  margin-left: 10px;
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
  color: white;
  font-size: 1.4rem;
}

/* 聊天气泡样式 */
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
  background-color: v-bind('colors.game.narratorBg');
  /* 浅紫色底 */
  color: v-bind('colors.game.narratorText');
  /* 浅灰文字 */
  text-align: left;
  /* 文字对齐 */
  padding: 2px 8px 4px 8px;
  /* 缩小垂直内间距 */
  white-space: pre-wrap;
  word-break: break-word;
  /* 文字字号缩小 */
  font-size: 1rem;
}

/* 图片消息 */
.message-image {
  max-width: 20rem;
  /* 限制图片最大宽度 */
  max-height: 20rem;
  /* 限制图片最大高度 */
  background-color: transparent;
  /* 图片加载前的占位背景色 */
  object-fit: cover;
  /* 保持图片比例 */
  border-radius: 8px;
}

.image-placeholder {
  width: 200px;
  height: 150px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  font-size: 0.9rem;
  padding: 10px;
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
  background-color: v-bind('colors.input.background');
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

/* 修复角色弹窗样式 (复用 CharacterSelector 的样式) */
.custom-character-form {
  background-color: v-bind('colors.background.content');
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 90%;
  max-width: 400px;
  border: 1px solid v-bind('colors.border.primary');
}

.custom-character-form h3 {
  text-align: center;
  margin-top: 0;
  color: v-bind('colors.text.primary');
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row label {
  font-weight: bold;
  font-size: 0.9em;
  color: v-bind('colors.text.secondary');
}

.form-row input[type='text'] {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  font-size: 1em;
  box-sizing: border-box;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
}

.avatar-preview-container {
  text-align: center;
}

.avatar-preview {
  max-width: 100px;
  max-height: 100px;
  border-radius: 8px;
  border: 2px solid v-bind('colors.border.primary');
  margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.form-actions .action-button {
  flex-grow: 1;
}

.form-actions .action-button.cancel {
  background-color: v-bind('colors.button.secondaryBg');
  border-color: v-bind('colors.button.secondaryBg');
  color: v-bind('colors.button.secondaryText');
}

.form-actions .action-button.cancel:hover {
  filter: brightness(0.9);
}

/* 编辑菜单样式 */
.edit-menu-container {
  position: relative;
  background-color: v-bind('colors.background.content');
  color: v-bind('colors.text.primary');
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
  color: v-bind('colors.text.highlight');
}

.edit-menu-button {
  padding: 10px 15px;
  border: none;
  background-color: v-bind('colors.button.defaultBg');
  color: v-bind('colors.button.defaultText');
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition:
    background-color 0.2s,
    border-color 0.2s;
  text-align: center;
  font-weight: bold;
}

.edit-menu-button:hover {
  background-color: v-bind('colors.button.hoverBg');
  color: v-bind('colors.button.hoverText');
}

.edit-menu-button.delete {
  background-color: v-bind('colors.button.dangerBg');
  border-color: v-bind('colors.button.dangerBorder');
  color: v-bind('colors.button.dangerText');
}

.edit-menu-button.delete:hover {
  filter: brightness(0.95);
}

.edit-menu-button.close {
  margin-top: 10px;
  /* 与功能按钮分隔开 */
  background-color: v-bind('colors.background.light');
  border-color: v-bind('colors.border.primary');
}

.edit-menu-button.close:hover {
  filter: brightness(0.95);
}

/* 存档菜单样式 */
.save-load-menu {
  position: relative;
  background-color: v-bind('colors.background.content');
  color: v-bind('colors.text.primary');
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 80vh;
  overflow-y: auto;
}

.menu-title {
  text-align: center;
  margin: 0;
  color: v-bind('colors.text.highlight');
}

.slot-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-header {
  font-weight: bold;
  color: v-bind('colors.text.secondary');
  font-size: 0.9em;
}

.slot-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: v-bind('colors.background.light');
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.slot-info {
  flex: 1;
}

.slot-row-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slot-row-bottom {
  display: flex;
  gap: 5px;
}

.slot-name-input {
  flex: 1;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.input.background');
  color: v-bind('colors.input.text');
  min-width: 0;
}

.slot-time-small {
  font-size: 0.75em;
  color: v-bind('colors.text.secondary');
  white-space: nowrap;
}

.slot-row-bottom {
  display: flex;
  gap: 5px;
  width: 100%;
}

.slot-row-bottom .action-button {
  flex: 1;
  padding: 6px 0;
  font-size: 0.9em;
}

.delete-slot-btn {
  background: v-bind('colors.button.dangerBg');
  color: v-bind('colors.button.dangerText');
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  margin-left: 5px;
}

.save-btn {
  background-color: v-bind('colors.brand.confirm');
  color: white;
  border: none;
}

.close-menu-top-right {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  line-height: 1;
  padding: 5px;
}

/* 编辑行高亮样式 */
.editing-highlight {
  border: 2px solid v-bind('colors.brand.confirm');
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
  border-bottom: 2px solid v-bind('colors.brand.confirm');
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
  background-color: v-bind('colors.button.dangerBg');
  color: v-bind('colors.button.dangerText');
}

.editor-action-row .editor-button.cancel:hover {
  filter: brightness(0.95);
}

.highlight {
  color: v-bind('colors.text.highlight');
}

/* 为协议列表添加样式 */
.agreement-list {
  max-height: 20rem;
  overflow-y: auto;
  /* 美化列表，增加一些内边距和边框 */
  border: 2px solid v-bind('colors.border.primary');
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

.watermark {
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 20px;
  padding-bottom: 10px;
}

.selection-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  max-width: 800px;
  margin: 0 auto 10px auto;
}

.finalize-button {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  position: fixed;
  bottom: 40px;
  right: 40px;
  padding: 15px 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  z-index: 999;
  font-size: 1.2rem;
  background-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
}

.finalize-button:hover {
  background-color: v-bind('colors.brand.hover');
}

.finalize-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-char-btn {
  background-color: v-bind('colors.brand.confirm');
  color: white;
  border-color: v-bind('colors.brand.confirm');
}

.create-char-btn:hover {
  background-color: v-bind('colors.brand.confirmHover');
  color: white;
}
</style>

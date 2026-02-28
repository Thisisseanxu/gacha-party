<template>
  <div class="page-container">
    <div class="content-wrap">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="$router.back()">← 返回</button>

      <!-- 角色头部信息 -->
      <div class="char-header" v-if="card">
        <div class="char-avatar-wrap">
          <img :src="charConfig?.image_url || card.qban_url || card.imageUrl" class="char-avatar" :alt="card.name" />
        </div>
        <div class="char-info">
          <div class="char-realname">{{ card.realname || card.name }}</div>
          <div class="char-cardname">{{ card.name }}</div>
          <div class="char-theme" v-if="charConfig?.theme">
            <img :src="charConfig.theme.icon" class="theme-icon" :alt="charConfig.theme.name" />
            <span>{{ charConfig.theme.name }}</span>
            <div class="char-rarity" :class="card.rarity?.toLowerCase()">{{ card.rarity }}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-row">
        <button class="action-btn primary" @click="createNew">+ 创建新攻略</button>
        <button class="action-btn secondary" @click="showImportInput = !showImportInput">
          {{ showImportInput ? '收起' : '导入攻略代码' }}
        </button>
      </div>

      <!-- 导入代码输入 -->
      <div v-if="showImportInput" class="import-code-section">
        <textarea v-model="importCodeInput" class="code-input" rows="3" placeholder="粘贴攻略代码（由编辑器导出）"></textarea>
        <button class="action-btn primary" :disabled="!importCodeInput.trim()" @click="openFromCode">
          用此代码打开编辑器
        </button>
        <div v-if="importCodeError" class="import-error">{{ importCodeError }}</div>
      </div>

      <!-- 攻略列表 -->
      <section class="strategies-section">
        <div class="section-title">
          <span>现有攻略</span>
          <span class="count-badge">{{ strategies.length }}</span>
        </div>

        <div v-if="loading" class="empty-msg">加载中…</div>
        <div v-else-if="strategies.length === 0" class="empty-msg">暂无攻略，快来创建第一个吧！</div>

        <div v-for="(item, idx) in strategies" :key="idx" class="strategy-card"
          :class="{ 'featured-card': item.isFeatured }">
          <div class="strategy-card-header">
            <span class="strategy-title">
              <span v-if="item.isFeatured" class="featured-badge">精选</span>
              {{ item.data.customTitle || `攻略 #${idx + 1}` }}
            </span>
            <div class="card-btn-group">
              <template v-if="isAdmin">
                <button class="card-action-btn feature-btn" @click.stop="doToggleFeature(item)"
                  :disabled="adminLoadingId === item.id">
                  {{ item.isFeatured ? '取消精选' : '设精选' }}
                </button>
                <button class="card-action-btn overwrite-btn" @click.stop="editOverwrite(item)"
                  :disabled="adminLoadingId === item.id">
                  覆盖编辑
                </button>
                <button class="card-action-btn delete-btn" @click.stop="doDelete(item)"
                  :disabled="adminLoadingId === item.id">
                  删除
                </button>
              </template>
              <button class="edit-btn" @click="editStrategy(item.code)">编辑</button>
            </div>
          </div>

          <!-- 攻略图预览 -->
          <div class="preview-click-wrapper" @click="openPreview(idx)">
            <HuizhangPreviewImage :strategy="item.data" :charConfig="charConfig"
              @generated="(url) => onImageGenerated(idx, url)" />
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- 管理员操作 Toast -->
  <div v-if="adminToast" class="admin-toast">{{ adminToast }}</div>

  <!-- 全屏预览 Overlay -->
  <div v-if="showPreview" class="preview-overlay" @click="closePreview">
    <div class="preview-container">
      <HuizhangPreviewImage v-if="previewStrategy" :strategy="previewStrategy.data" :charConfig="charConfig"
        :previewSrc="generatedImages[previewIndex]" class="fullscreen-preview" />

      <!-- 左右导航区域 -->
      <div class="nav-zone left" v-if="previewIndex > 0" @click.stop="prevStrategy">
        <span class="nav-arrow">&lt;</span>
        <span class="nav-text">上一个</span>
      </div>
      <div class="nav-zone right" v-if="previewIndex < strategies.length - 1" @click.stop="nextStrategy">
        <span class="nav-arrow">&gt;</span>
        <span class="nav-text">下一个</span>
      </div>


      <div class="preview-info" v-if="previewStrategy">
        <h3>{{ previewStrategy.data.customTitle || '未命名攻略' }}</h3>
        <div class="preview-meta">
          <span class="index-indicator">{{ previewIndex + 1 }} / {{ strategies.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allCards } from '@/data/cards.js'
import { getCharConfig } from '@/data/huizhang.js'
import { decodeStrategy } from '@/utils/huizhangCode.js'
import { colors } from '@/styles/colors.js'
import HuizhangPreviewImage from '@/components/HuizhangPreviewImage.vue'
import { useHuizhangGuides } from '@/composables/useHuizhangGuides.js'

const route = useRoute()
const router = useRouter()
const charId = computed(() => route.params.charId)

const showImportInput = ref(false)
const importCodeInput = ref('')
const importCodeError = ref('')

const { init, getGuidesForChar, loading, isAdminLoggedIn, adminDeleteGuide, adminToggleFeature } = useHuizhangGuides()

// 管理员模式：有有效 token 时开启
const isAdmin = computed(() => isAdminLoggedIn())

// 管理员操作加载态
const adminLoadingId = ref(null)

const card = computed(() => allCards.find((c) => c.id === charId.value) || null)
const charConfig = computed(() => getCharConfig(charId.value))

// 缓存已生成的图片URL，避免全屏预览时重复生成
const generatedImages = ref({})
const onImageGenerated = (index, url) => {
  generatedImages.value[index] = url
}

// 从 D1 加载的攻略列表，格式与原来保持兼容
const strategies = computed(() =>
  getGuidesForChar(charId.value)
    .filter((g) => g.data !== null)
    .map((g) => ({ id: g.id, code: g.code, data: g.data, isFeatured: g.isFeatured })),
)

onMounted(async () => {
  await init()
  window.addEventListener('keyup', onKeyup)
})

onUnmounted(() => {
  window.removeEventListener('keyup', onKeyup)
  document.body.style.overflow = ''
})

const createNew = () => {
  router.push(`/huizhang/edit?charId=${charId.value}`)
}

const editStrategy = (code) => {
  router.push(`/huizhang/edit?code=${encodeURIComponent(code)}`)
}

const openFromCode = () => {
  importCodeError.value = ''
  try {
    decodeStrategy(importCodeInput.value.trim()) // validate
    router.push(`/huizhang/edit?code=${encodeURIComponent(importCodeInput.value.trim())}`)
  } catch {
    importCodeError.value = '无法解析此代码，请确认代码完整且未损坏。'
  }
}

// 管理员操作
const adminToast = ref('')
const adminToastTimer = ref(null)
function showAdminToast(msg) {
  adminToast.value = msg
  clearTimeout(adminToastTimer.value)
  adminToastTimer.value = setTimeout(() => { adminToast.value = '' }, 2500)
}

async function doDelete(item) {
  if (!window.confirm(`确认删除攻略「${item.data.customTitle || '#' + item.id}」？此操作不可撤销。`)) return
  adminLoadingId.value = item.id
  try {
    await adminDeleteGuide(item.id)
    showAdminToast('已删除')
  } catch (e) {
    showAdminToast('删除失败: ' + e.message)
  } finally {
    adminLoadingId.value = null
  }
}

async function doToggleFeature(item) {
  adminLoadingId.value = item.id
  try {
    await adminToggleFeature(item.id, !item.isFeatured)
    showAdminToast(item.isFeatured ? '已取消精选' : '已设为精选')
  } catch (e) {
    showAdminToast('操作失败: ' + e.message)
  } finally {
    adminLoadingId.value = null
  }
}

function editOverwrite(item) {
  router.push(`/huizhang/edit?code=${encodeURIComponent(item.code)}&overwriteId=${item.id}`)
}

// 全屏预览逻辑
const showPreview = ref(false)
const previewIndex = ref(0)
const previewStrategy = computed(() => strategies.value[previewIndex.value])

const openPreview = (index) => {
  previewIndex.value = index
  showPreview.value = true
  document.body.style.overflow = 'hidden'
}

const closePreview = () => {
  showPreview.value = false
  document.body.style.overflow = ''
  // 清除 URL 中的 viewCode 参数
  if (route.query.viewCode) {
    router.replace({ query: { ...route.query, viewCode: undefined } })
  }
}

const prevStrategy = () => {
  if (previewIndex.value > 0) previewIndex.value--
}

const nextStrategy = () => {
  if (previewIndex.value < strategies.value.length - 1) previewIndex.value++
}

const onKeyup = (e) => {
  if (!showPreview.value) return
  if (e.key === 'Escape') closePreview()
  if (e.key === 'ArrowLeft') prevStrategy()
  if (e.key === 'ArrowRight') nextStrategy()
}

// 监听路由参数，自动打开对应攻略
watch([strategies, () => route.query.viewCode], ([list, code]) => {
  if (code && list.length && !showPreview.value) {
    const idx = list.findIndex(s => s.code === code)
    if (idx !== -1) {
      openPreview(idx)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: v-bind('colors.background.primary');
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  color: v-bind('colors.text.primary');
}

.content-wrap {
  width: 100%;
  max-width: 900px;
  padding: 0.5rem 0.5rem 4rem;
}

.back-btn {
  background: none;
  border: none;
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.3rem 0;
  margin-bottom: 0.8rem;
  transition: color 0.15s;
}

.back-btn:hover {
  color: v-bind('colors.brand.primary');
}

/* 角色头部 */
.char-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 12px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.8rem;
}

.char-avatar {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  background: v-bind('colors.background.lighter');
  flex-shrink: 0;
}

.char-realname {
  font-size: 1.2rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
}

.char-cardname {
  font-size: 0.85rem;
  color: v-bind('colors.text.secondary');
}

.char-theme {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: v-bind('colors.text.secondary');
  margin-top: 3px;
}

.theme-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.char-rarity {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: bold;
  padding: 1px 7px;
  border-radius: 4px;
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.primary');
}

.char-rarity.sp {
  color: v-bind('colors.rarity.sp');
}

.char-rarity.ssr {
  color: v-bind('colors.rarity.ssr');
}

.char-rarity.sr {
  color: v-bind('colors.rarity.sr');
}

.char-rarity.r {
  color: v-bind('colors.rarity.r');
}

/* 操作按钮行 */
.action-row {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.action-btn {
  flex: 1;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
  border: 1px solid v-bind('colors.border.primary');
}

.action-btn.primary {
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  border-color: v-bind('colors.brand.primary');
  font-weight: bold;
}

.action-btn.primary:hover {
  background: v-bind('colors.brand.hover');
}

.action-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.secondary {
  background: v-bind('colors.background.content');
  color: v-bind('colors.text.secondary');
}

.action-btn.secondary:hover {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}

/* 导入代码 */
.import-code-section {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 10px;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.code-input {
  width: 100%;
  background: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 6px;
  color: v-bind('colors.text.primary');
  font-size: 0.8rem;
  padding: 0.5rem;
  resize: vertical;
  box-sizing: border-box;
  font-family: monospace;
}

.import-error {
  color: v-bind('colors.status.error');
  font-size: 0.85rem;
}

/* 攻略列表 */
.strategies-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  border-left: 3px solid v-bind('colors.brand.primary');
  padding-left: 0.6rem;
  margin-bottom: 0.3rem;
}

.count-badge {
  font-size: 0.78rem;
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.secondary');
  border-radius: 10px;
  padding: 1px 8px;
}

.empty-msg {
  text-align: center;
  color: v-bind('colors.text.secondary');
  padding: 2rem;
  background: v-bind('colors.background.content');
  border-radius: 10px;
  border: 1px dashed v-bind('colors.border.primary');
}

/* 攻略卡片 */
.strategy-card {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.strategy-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.strategy-title {
  font-size: 1rem;
  font-weight: bold;
  color: v-bind('colors.brand.primary');
}

.edit-btn {
  padding: 4px 14px;
  border-radius: 6px;
  background: v-bind('colors.background.lighter');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.85rem;
  flex-shrink: 0;
  transition: all 0.15s;
}

.edit-btn:hover {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}

.strategy-meta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.author {
  color: v-bind('colors.text.tertiary');
  font-size: 0.82rem;
}

.stars-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stars-label {
  color: v-bind('colors.text.tertiary');
  font-size: 0.78rem;
}

.star-chip {
  font-size: 0.78rem;
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.secondary');
  border-radius: 4px;
  padding: 1px 5px;
}

.preview-click-wrapper {
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-click-wrapper:hover {
  transform: scale(1.01);
}

/* 全屏预览 Overlay */
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  padding: 4px;
  box-sizing: border-box;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;
}

.fullscreen-preview {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.fullscreen-preview :deep(.rendered-img) {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.nav-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 15%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.2s;
  color: white;
  font-size: 3rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  flex-direction: column;
  min-width: 50px;
}

.nav-zone:hover {
  opacity: 1;
}

.nav-zone.left {
  left: 0;
}

.nav-zone.left:hover {
  background: linear-gradient(to right, rgba(0, 0, 0, 0.5), transparent);
}

.nav-zone.right {
  right: 0;
}

.nav-zone.right:hover {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.5), transparent);
}

.nav-text {
  font-size: 1rem;
  margin-top: -10px;
}

.preview-info {
  margin-top: 1.5rem;
  text-align: center;
  color: white;
}

.preview-info h3 {
  margin: 0 0 0.3rem;
  font-size: 1.2rem;
}

.preview-meta {
  font-size: 0.9rem;
  opacity: 0.8;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* 管理员相关 */
.featured-card {
  border-color: v-bind('colors.brand.primary');
}

.featured-badge {
  display: inline-block;
  font-size: 0.7rem;
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  border-radius: 4px;
  padding: 1px 6px;
  margin-right: 4px;
  vertical-align: middle;
  font-weight: bold;
}

.card-btn-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.card-action-btn {
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s;
  white-space: nowrap;
}

.card-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feature-btn {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
  background: transparent;
}
.feature-btn:not(:disabled):hover {
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
}

.overwrite-btn {
  border-color: v-bind('colors.text.secondary');
  color: v-bind('colors.text.secondary');
  background: transparent;
}
.overwrite-btn:not(:disabled):hover {
  border-color: v-bind('colors.text.primary');
  color: v-bind('colors.text.primary');
}

.delete-btn {
  border-color: v-bind('colors.status.error');
  color: v-bind('colors.status.error');
  background: transparent;
}
.delete-btn:not(:disabled):hover {
  background: v-bind('colors.status.error');
  color: #fff;
}

.admin-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.9rem;
  z-index: 3000;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  pointer-events: none;
}
</style>

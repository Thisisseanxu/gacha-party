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

        <div v-for="(item, idx) in strategies" :key="idx" class="strategy-card">
          <div class="strategy-card-header">
            <span class="strategy-title">{{ item.data.customTitle || `攻略 #${idx + 1}` }}</span>
            <button class="edit-btn" @click="editStrategy(item.code)">编辑</button>
          </div>

          <!-- 攻略图预览 -->
          <HuizhangPreviewImage :strategy="item.data" :charConfig="charConfig" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allCards } from '@/data/cards.js'
import { getCharConfig } from '@/data/huizhang.js'
import { decodeStrategy } from '@/utils/huizhangCode.js'
import { colors } from '@/styles/colors.js'
import HuizhangPreviewImage from '@/components/HuizhangPreviewImage.vue'

const route = useRoute()
const router = useRouter()
const charId = computed(() => route.params.charId)

const strategies = ref([]) // [{ code: string, data: Object }]
const loading = ref(true)
const showImportInput = ref(false)
const importCodeInput = ref('')
const importCodeError = ref('')

const strategyModules = import.meta.glob('/src/data/huizhangdata/*.js', { eager: false })

const card = computed(() => allCards.find((c) => c.id === charId.value) || null)
const charConfig = computed(() => getCharConfig(charId.value))

onMounted(async () => {
  const path = `/src/data/huizhangdata/${charId.value}.js`
  const loader = strategyModules[path]
  if (loader) {
    try {
      const mod = await loader()
      const codes = mod.default || []
      strategies.value = codes.map((code) => {
        try {
          return { code, data: decodeStrategy(code) }
        } catch {
          return null
        }
      }).filter(Boolean)
    } catch {
      strategies.value = []
    }
  }
  loading.value = false
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
</style>

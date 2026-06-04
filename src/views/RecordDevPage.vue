<template>
  <div class="dev-background">
    <main class="dev-shell">
      <header class="dev-header">
        <div>
          <p class="eyebrow">抽卡记录工具</p>
          <h1>云端记录调试</h1>
        </div>
        <RouterLink class="analysis-link" to="/fenxi">返回分析页</RouterLink>
      </header>

      <section class="panel">
        <div class="panel-title">
          <h2>身份信息</h2>
          <span :class="['role-badge', isAdmin ? 'admin' : 'normal']">
            {{ roleLabel }}
          </span>
        </div>

        <label class="field">
          <span>玩家 ID</span>
          <input
            v-model.trim="playerId"
            type="text"
            inputmode="numeric"
            placeholder="请输入玩家ID"
          />
        </label>

        <label class="field">
          <span>激活码</span>
          <input v-model.trim="licenseKey" type="text" placeholder="请输入激活码" />
        </label>
      </section>

      <section class="tool-grid">
        <article class="panel">
          <div class="panel-title">
            <h2>下载记录</h2>
          </div>
          <p class="hint">从云端读取该玩家的抽卡记录，并保存为分析页可直接上传的 JSON 文件。</p>
          <button
            class="primary-button"
            type="button"
            :disabled="isDownloading"
            @click="downloadRecord"
          >
            {{ isDownloading ? '正在下载...' : '下载 JSON 文件' }}
          </button>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h2>上传记录</h2>
          </div>
          <p class="hint">选择分析页导出的压缩 JSON，或旧版原始记录 JSON，上传到云端记录库。</p>
          <input
            ref="fileInput"
            class="file-input"
            type="file"
            accept=".json,application/json"
            @change="handleFileChange"
          />
          <div v-if="selectedFileName" class="file-name">{{ selectedFileName }}</div>
          <button
            class="primary-button"
            type="button"
            :disabled="isUploading"
            @click="uploadRecord"
          >
            {{ isUploading ? '正在上传...' : '上传到云端' }}
          </button>
        </article>
      </section>

      <p v-if="message" class="status-message success">{{ message }}</p>
      <p v-if="errorMessage" class="status-message error">{{ errorMessage }}</p>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import pako from 'pako'
import { colors } from '@/styles/colors.js'
import { verifyLicense } from '@/utils/licenseManager.js'

const LICENSE_KEY = 'gachaLicenseKey'
const PLAYER_ID_KEY = 'gachaPlayerId'
const DOWNLOAD_COOLDOWN_KEY = 'gachaDevDownloadCooldown'
const UPLOAD_COOLDOWN_KEY = 'gachaDevUploadCooldown'

const DOWNLOAD_COOLDOWNS = {
  admin: 60 * 1000,
  normal: 15 * 60 * 1000,
}

const playerId = ref('')
const licenseKey = ref('')
const selectedFile = ref(null)
const selectedFileName = ref('')
const message = ref('')
const errorMessage = ref('')
const isDownloading = ref(false)
const isUploading = ref(false)
const now = ref(Date.now())
const workerUrl = ref('')
let tickTimer = null

const licenseResult = computed(() => {
  if (!licenseKey.value) return null
  try {
    return verifyLicense(licenseKey.value)
  } catch (error) {
    return { success: false, message: error.message, userId: null, isExpired: true }
  }
})

const isAdmin = computed(() => {
  const userId = String(licenseResult.value?.userId || '')
  return userId.startsWith('33') && userId.length === 9
})

const roleLabel = computed(() => {
  if (!licenseKey.value) return '未验证'
  if (!licenseResult.value?.success) return '激活码无效'
  return isAdmin.value ? '管理员' : '普通用户'
})

onMounted(() => {
  playerId.value = localStorage.getItem(PLAYER_ID_KEY) || ''
  licenseKey.value = localStorage.getItem(LICENSE_KEY) || ''

  const url = new URL(window.location.href)
  workerUrl.value = import.meta.env.DEV ? `${url.protocol}//${url.hostname}:8787` : url.origin
  tickTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (tickTimer) window.clearInterval(tickTimer)
})

function validateIdentity() {
  message.value = ''
  errorMessage.value = ''

  const id = playerId.value.trim()
  const key = licenseKey.value.trim()
  if (!id || !/^\d+$/.test(id)) throw new Error('玩家ID必须为数字且不能为空。')
  if (!key) throw new Error('请输入激活码。')

  const result = verifyLicense(key)
  if (!result.success) throw new Error(result.message || '激活码验证失败。')

  const admin = String(result.userId).startsWith('33') && String(result.userId).length === 9
  if (!admin && String(result.userId) !== id) {
    throw new Error('激活码与玩家ID不匹配。')
  }

  localStorage.setItem(PLAYER_ID_KEY, id)
  localStorage.setItem(LICENSE_KEY, key)
  return { id, key, admin }
}

function getCooldown(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const { expiry } = JSON.parse(raw)
    const timeLeft = Number(expiry || 0) - now.value
    if (timeLeft <= 0) {
      localStorage.removeItem(key)
      return 0
    }
    return timeLeft
  } catch {
    localStorage.removeItem(key)
    return 0
  }
}

function setCooldown(key, milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return
  localStorage.setItem(key, JSON.stringify({ expiry: Date.now() + milliseconds }))
  now.value = Date.now()
}

function assertCooldownAvailable(key, label) {
  const timeLeft = getCooldown(key)
  if (timeLeft > 0) {
    throw new Error(`${label}冷却中，请在 ${millisecondsToTime(timeLeft)} 后再试。`)
  }
}

function millisecondsToTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60
  return minutes > 0 ? `${minutes}分${restSeconds}秒` : `${restSeconds}秒`
}

async function downloadRecord() {
  if (isDownloading.value) return

  try {
    const { id, key, admin } = validateIdentity()
    assertCooldownAvailable(DOWNLOAD_COOLDOWN_KEY, '下载')

    isDownloading.value = true
    const response = await fetch(`${workerUrl.value}/get-record`, {
      method: 'GET',
      headers: {
        'X-License-Key': key,
        'X-Player-ID': id,
      },
    })
    const text = await response.text()
    if (!response.ok) throw new Error(text || `服务器错误：${response.status}`)

    const wrappedJson = {
      cloud: true,
      compressed: true,
      data: text,
    }
    saveJsonFile(wrappedJson, `抽卡记录-${id}-${formatDate(new Date())}.json`)
    setCooldown(DOWNLOAD_COOLDOWN_KEY, admin ? DOWNLOAD_COOLDOWNS.admin : DOWNLOAD_COOLDOWNS.normal)
    message.value = '下载完成。该文件可在 /fenxi 页面直接上传分析。'
  } catch (error) {
    errorMessage.value = `下载失败：${error.message}`
  } finally {
    isDownloading.value = false
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  selectedFile.value = file || null
  selectedFileName.value = file?.name || ''
  message.value = ''
  errorMessage.value = ''
}

async function uploadRecord() {
  if (isUploading.value) return

  try {
    const { id, key } = validateIdentity()
    assertCooldownAvailable(UPLOAD_COOLDOWN_KEY, '上传')
    if (!selectedFile.value) throw new Error('请选择要上传的 JSON 文件。')

    isUploading.value = true
    const payload = await buildUploadPayload(selectedFile.value, id)
    const response = await fetch(`${workerUrl.value}/upload-record`, {
      method: 'POST',
      headers: {
        'X-License-Key': key,
        'X-Player-ID': id,
        'Content-Type': 'text/plain',
      },
      body: payload,
    })

    const responseJson = await response.json().catch(() => ({}))
    if (responseJson.timeLeft > 0) {
      setCooldown(UPLOAD_COOLDOWN_KEY, responseJson.timeLeft)
    }

    if (!response.ok) {
      throw new Error(responseJson.message || `服务器错误：${response.status}`)
    }

    message.value = responseJson.message || '上传成功。'
  } catch (error) {
    errorMessage.value = `上传失败：${error.message}`
  } finally {
    isUploading.value = false
  }
}

async function buildUploadPayload(file, id) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error(`JSON 文件无法解析：${error.message}`, { cause: error })
  }

  if (parsed?.compressed && typeof parsed.data === 'string') {
    validateCompressedRecord(parsed.data, id)
    return parsed.data
  }

  validateRawRecord(parsed, id)
  const cleaned = cleanRecordForUpload(parsed, id)
  const compressedData = pako.gzip(JSON.stringify(cleaned))
  return bytesToBase64(compressedData)
}

function validateCompressedRecord(base64Data, id) {
  try {
    const raw = JSON.parse(pako.inflate(base64ToBytes(base64Data), { to: 'string' }))
    validateRawRecord(raw, id)
  } catch (error) {
    throw new Error(`压缩记录无法解析：${error.message}`, { cause: error })
  }
}

function validateRawRecord(data, id) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('记录顶层结构必须是对象。')
  }
  if (typeof data.version !== 'number' || data.version < 2) {
    throw new Error('记录版本不正确，请上传 fenxi 页面可分析的记录 JSON。')
  }
  if (!data[id] || typeof data[id] !== 'object') {
    throw new Error(`当前文件中找不到玩家ID ${id} 的记录。`)
  }
}

function cleanRecordForUpload(data, id) {
  const cloned = JSON.parse(JSON.stringify(data))
  const playerData = cloned[id]
  for (const [poolId, records] of Object.entries(playerData)) {
    if (!Array.isArray(records)) continue
    records.forEach((record) => {
      if (record && String(record.gacha_id) === String(poolId)) {
        delete record.gacha_id
      }
    })
  }
  return cloned
}

function base64ToBytes(base64) {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function saveJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}
</script>

<style scoped>
.dev-background {
  min-height: 100vh;
  background: v-bind('colors.background.primary');
  color: v-bind('colors.text.primary');
  padding: 28px 16px;
}

.dev-shell {
  width: min(960px, 100%);
  margin: 0 auto;
  text-align: left;
}

.dev-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 6px;
  color: v-bind('colors.text.highlight');
  font-size: 0.85rem;
  font-weight: 700;
}

h1,
h2 {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  font-size: 2rem;
}

h2 {
  font-size: 1.1rem;
}

.analysis-link {
  color: v-bind('colors.text.black');
  background: v-bind('colors.brand.primary');
  border-radius: 8px;
  padding: 10px 14px;
  text-decoration: none;
  font-weight: 700;
  white-space: nowrap;
}

.panel {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 10px 24px v-bind('colors.shadow.primary');
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.field {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
}

.field input,
.file-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.input.background');
  color: v-bind('colors.input.text');
  padding: 12px;
  font: inherit;
}

.field input:focus,
.file-input:focus {
  outline: none;
  border-color: v-bind('colors.brand.primary');
}

.role-badge {
  flex-shrink: 0;
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.82rem;
  color: v-bind('colors.text.secondary');
  background: v-bind('colors.background.light');
}

.role-badge.admin {
  border-color: v-bind('colors.brand.confirm');
  color: v-bind('colors.status.success');
  background: v-bind('colors.status.successBg');
}

.role-badge.normal {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.highlight');
  background: v-bind('colors.brand.primaryBackground');
}

.hint {
  margin: 0 0 14px;
  color: v-bind('colors.text.secondary');
  line-height: 1.7;
  font-size: 0.92rem;
}

.file-name {
  margin-top: 10px;
  color: v-bind('colors.text.highlight');
  word-break: break-all;
  font-size: 0.9rem;
}

.primary-button {
  width: 100%;
  min-height: 44px;
  margin-top: 14px;
  border: none;
  border-radius: 8px;
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease;
}

.primary-button:hover:not(:disabled) {
  background: v-bind('colors.brand.hover');
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-message {
  margin: 16px 0 0;
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.6;
}

.status-message.success {
  color: v-bind('colors.status.success');
  background: v-bind('colors.status.successBg');
  border: 1px solid v-bind('colors.status.success');
}

.status-message.error {
  color: v-bind('colors.status.error');
  background: v-bind('colors.status.errorBg');
  border: 1px solid v-bind('colors.status.error');
}

@media (max-width: 720px) {
  .dev-header {
    align-items: stretch;
    flex-direction: column;
  }

  .analysis-link {
    text-align: center;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>

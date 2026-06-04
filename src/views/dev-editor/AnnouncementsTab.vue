<template>
  <div class="editor-layout announcements-editor">
    <div class="list-panel">
      <div class="panel-header">
        <input v-model="search" class="de-input" placeholder="搜索标题/ID/内容…" />
        <div class="announcement-meta">
          <span>版本 {{ version }}</span>
          <span class="count-hint">{{ filteredAnnouncements.length }} 条</span>
        </div>
      </div>
      <div class="panel-actions">
        <button class="de-btn primary" @click="newAnnouncement">+ 新增公告</button>
        <button class="de-btn" :disabled="loading" @click="loadAndSelect">重新加载</button>
      </div>
      <div v-if="loading" class="hint">加载中…</div>
      <div v-else-if="error" class="hint error">{{ error }}</div>
      <div v-else class="item-list">
        <div
          v-for="announcement in filteredAnnouncements"
          :key="announcement.id"
          :class="[
            'list-item',
            'announcement-list-item',
            { active: form.id === announcement.id, disabled: announcement.enabled === false },
          ]"
          @click="selectAnnouncement(announcement)"
        >
          <span :class="['status-dot', announcement.enabled === false ? 'off' : 'on']"></span>
          <span class="item-name">{{ announcement.title || '未命名公告' }}</span>
          <span class="item-id">#{{ announcement.id }}</span>
        </div>
      </div>
    </div>

    <div class="form-panel">
      <div v-if="!form.id && !isNew" class="form-empty">在左侧选择公告，或点击「+ 新增公告」</div>
      <template v-else>
        <div class="form-title">{{ isNew ? '新增公告' : `编辑公告 #${form.id}` }}</div>
        <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">
          {{ saveMsg.text }}
        </div>

        <div class="form-grid announcement-form-grid">
          <label>ID</label>
          <div class="inline-row">
            <input v-model="form.id" class="de-input" placeholder="announcement-20260602" />
            <button class="de-btn small" @click="fillId">生成 ID</button>
          </div>

          <label>标题</label>
          <input v-model="form.title" class="de-input" placeholder="公告标题" />

          <label>内容</label>
          <textarea v-model="form.content" class="de-textarea announcement-content"></textarea>

          <label>开始日期</label>
          <div class="date-time-row">
            <input
              v-model="form.startDate"
              class="de-input"
              placeholder="可留空，留空表示已经开始"
            />
            <input v-model="startDateTime" class="de-input" type="datetime-local" />
            <button class="de-btn small" @click="applyDateTime('startDate')">应用</button>
          </div>

          <label>结束日期</label>
          <div class="date-time-row">
            <input v-model="form.endDate" class="de-input" placeholder="可留空，留空表示永不结束" />
            <input v-model="endDateTime" class="de-input" type="datetime-local" />
            <button class="de-btn small" @click="applyDateTime('endDate')">应用</button>
          </div>

          <label>时区</label>
          <select v-model="timezoneOffset" class="de-select">
            <option value="+08:00">中国时间 +08:00</option>
            <option value="+00:00">UTC +00:00</option>
            <option value="+01:00">英国夏令时 +01:00</option>
            <option value="-04:00">美东夏令时 -04:00</option>
            <option value="-07:00">美西夏令时 -07:00</option>
            <option value="-08:00">美西标准时 -08:00</option>
          </select>

          <label>启用</label>
          <input v-model="form.enabled" type="checkbox" />

          <label>每次打开展示</label>
          <input v-model="form.showEveryOpen" type="checkbox" />

          <label>仅小程序展示</label>
          <input v-model="form.miniProgramOnly" type="checkbox" />

          <label>仅网站展示</label>
          <input v-model="form.webOnly" type="checkbox" />
        </div>

        <div class="form-section">
          <div class="form-section-title">预览</div>
          <div class="announcement-preview">
            <h3>{{ form.title || '公告标题' }}</h3>
            <p v-for="(line, index) in previewLines" :key="index">{{ line }}</p>
          </div>
        </div>

        <div class="form-actions">
          <button class="de-btn primary" :disabled="saving" @click="saveCurrent">
            {{ saving ? '保存中…' : '保存公告' }}
          </button>
          <button class="de-btn" @click="resetForm">重置</button>
          <button v-if="!isNew" class="de-btn danger" :disabled="saving" @click="removeCurrent">
            删除
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'

const { data, loading, error, load } = useEditorApi('announcements')
const { save: saveApi } = useEditorApi('announcements')

const search = ref('')
const saving = ref(false)
const saveMsg = ref(null)
const isNew = ref(false)
const originalId = ref('')
const startDateTime = ref('')
const endDateTime = ref('')
const timezoneOffset = ref('+08:00')
const originalContent = ref('')

const emptyForm = () => ({
  id: '',
  title: '',
  content: '',
  startDate: '',
  endDate: '',
  enabled: true,
  showEveryOpen: false,
  miniProgramOnly: false,
  webOnly: false,
})

const form = ref(emptyForm())

const version = computed(() => Number(data.value?.version || 1))
const announcements = computed(() =>
  Array.isArray(data.value?.announcements) ? data.value.announcements : [],
)

const filteredAnnouncements = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return announcements.value
  return announcements.value.filter((announcement) => {
    return [announcement.id, announcement.title, announcement.content]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  })
})

const previewLines = computed(() =>
  (form.value.content || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean),
)

function normalizeAnnouncement(announcement) {
  return {
    id: announcement.id || makeAnnouncementId(),
    title: announcement.title || '',
    content: announcement.content || '',
    startDate: announcement.startDate || '',
    endDate: announcement.endDate || '',
    enabled: announcement.enabled !== false,
    showEveryOpen: Boolean(announcement.showEveryOpen),
    miniProgramOnly: Boolean(announcement.miniProgramOnly),
    webOnly: Boolean(announcement.webOnly),
  }
}

function toDateTimeLocalValue(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
  return match ? match[1] : ''
}

function syncDateTimeInputs() {
  startDateTime.value = toDateTimeLocalValue(form.value.startDate)
  endDateTime.value = toDateTimeLocalValue(form.value.endDate)
}

function applyDateTime(field) {
  const value = field === 'startDate' ? startDateTime.value : endDateTime.value
  if (!value) return
  form.value[field] = `${value}:00${timezoneOffset.value}`
}

function makeAnnouncementId() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 17)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `announcement-${stamp}-${suffix}`
}

function makeUniqueAnnouncementId() {
  const existingIds = new Set(announcements.value.map((item) => item.id).filter(Boolean))
  let id = makeAnnouncementId()
  while (existingIds.has(id)) id = makeAnnouncementId()
  return id
}

function fillId() {
  form.value.id = makeUniqueAnnouncementId()
}

function selectAnnouncement(announcement) {
  isNew.value = false
  originalId.value = announcement.id || ''
  saveMsg.value = null
  form.value = normalizeAnnouncement(announcement)
  originalContent.value = form.value.content
  syncDateTimeInputs()
}

function newAnnouncement() {
  isNew.value = true
  originalId.value = ''
  originalContent.value = ''
  saveMsg.value = null
  form.value = { ...emptyForm(), id: makeUniqueAnnouncementId() }
  syncDateTimeInputs()
}

function resetForm() {
  saveMsg.value = null
  if (isNew.value) {
    newAnnouncement()
    return
  }
  const original = announcements.value.find((item) => item.id === originalId.value)
  if (original) selectAnnouncement(original)
}

function buildPayload(nextAnnouncements) {
  return {
    version: version.value + 1,
    announcements: nextAnnouncements.map(normalizeAnnouncement),
  }
}

async function persist(nextAnnouncements, message) {
  saving.value = true
  saveMsg.value = null
  try {
    const payload = buildPayload(nextAnnouncements)
    await saveApi(payload)
    saveMsg.value = { ok: true, text: `${message}，版本已更新到 ${payload.version}` }
    isNew.value = false
    await load()
    const current = announcements.value.find((item) => item.id === form.value.id)
    if (current) selectAnnouncement(current)
    else form.value = emptyForm()
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

async function saveCurrent() {
  const current = normalizeAnnouncement(form.value)
  if (!current.id || !current.title) {
    saveMsg.value = { ok: false, text: 'ID 和标题不能为空' }
    return
  }
  if (current.miniProgramOnly && current.webOnly) {
    saveMsg.value = { ok: false, text: '不能同时设置“仅小程序展示”和“仅网站展示”' }
    return
  }

  const duplicate = announcements.value.some(
    (item) => item.id === current.id && (isNew.value || item.id !== originalId.value),
  )
  if (duplicate) {
    saveMsg.value = { ok: false, text: 'ID 已存在' }
    return
  }

  const others = announcements.value.filter((item) => item.id !== originalId.value)
  await persist([current, ...others], '保存成功')
}

async function removeCurrent() {
  await persist(
    announcements.value.filter((item) => item.id !== (originalId.value || form.value.id)),
    '删除成功',
  )
}

async function loadAndSelect() {
  await load()
  if (announcements.value.length) selectAnnouncement(announcements.value[0])
}

function handleGlobalKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (!saving.value && form.value.id) saveCurrent()
  }
}

onMounted(() => {
  loadAndSelect()
  window.addEventListener('keydown', handleGlobalKeyDown)
})

watch(
  () => form.value.content,
  (content) => {
    if (isNew.value || !originalId.value || form.value.id !== originalId.value) return
    if (content !== originalContent.value) {
      form.value.id = makeUniqueAnnouncementId()
      saveMsg.value = {
        ok: true,
        text: '内容已修改，已自动生成新 ID。保存后会作为新公告再次展示。',
      }
    }
  },
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>

<style scoped>
.announcements-editor {
  align-items: stretch;
}

.announcement-meta,
.inline-row,
.date-time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.announcement-meta {
  justify-content: space-between;
  color: #aaa;
  font-size: 12px;
}

.announcement-list-item.disabled {
  opacity: 0.6;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.status-dot.on {
  background: #50c050;
}

.status-dot.off {
  background: #777;
}

.announcement-form-grid {
  grid-template-columns: 130px 1fr;
}

.date-time-row .de-input:first-child {
  flex: 1;
}

.date-time-row .de-input[type='datetime-local'] {
  width: 210px;
}

.announcement-content {
  min-height: 180px;
}

.announcement-preview {
  background: #2a2b30;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  text-align: left;
}

.announcement-preview h3 {
  margin: 0 0 10px;
  color: #fff;
}

.announcement-preview p {
  margin: 0 0 8px;
  color: #ccc;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>

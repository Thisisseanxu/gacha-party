<template>
  <div class="editor-layout">
    <!-- 左侧：角色列表 -->
    <div class="list-panel">
      <div class="panel-header">
        <input v-model="search" class="de-input" placeholder="搜索角色 ID 或名称…" />
      </div>
      <div class="panel-actions">
        <button class="de-btn primary" @click="newEntry">+ 新增角色配置</button>
        <span class="count-hint">{{ filteredEntries.length }} 条</span>
      </div>
      <div v-if="loading" class="hint">加载中…</div>
      <div v-else-if="error" class="hint error">{{ error }}</div>
      <div v-else class="item-list">
        <div
          v-for="[charId] in filteredEntries"
          :key="charId"
          :class="['list-item', { active: form.charId === String(charId) }]"
          @click="selectEntry(charId)"
        >
          <span class="item-id">#{{ charId }}</span>
          <span class="item-name">{{ charNameMap?.[charId] ?? '' }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：编辑表单 -->
    <div class="form-panel">
      <div class="form-title">
        {{ form.charId ? `角色 #${form.charId} 徽章槽位` : '选择或新增角色' }}
      </div>
      <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</div>

      <div class="form-grid" style="margin-bottom: 12px;">
        <label>角色 ID</label>
        <input
          v-model="form.charId"
          class="de-input"
          :disabled="!isNew"
          placeholder="如 1110"
          type="number"
        />
      </div>

      <div class="form-section">
        <div class="form-section-title">
          Shape 槽位配置（{{ form.shapes.length }} 个槽位）
        </div>
        <div
          v-for="(shape, idx) in form.shapes"
          :key="idx"
          style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;"
        >
          <span style="color: #888; font-size: 11px; width: 48px;">槽位 {{ idx + 1 }}</span>
          <select v-model="form.shapes[idx]" class="de-select" style="max-width: 220px;">
            <option value="defence">SHIELD（生命 defence）</option>
            <option value="attack">DIAMOND（攻击 attack）</option>
            <option value="support">CIRCLE（支援 support）</option>
          </select>
          <button class="de-btn small danger" @click="removeSlot(idx)" title="删除此槽位">✕</button>
        </div>
        <button class="de-btn small" style="margin-top: 4px;" @click="addSlot">+ 添加槽位</button>
      </div>

      <div class="form-actions">
        <button class="de-btn primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存到 huizhang.js' }}
        </button>
        <button class="de-btn" @click="resetForm">重置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'

const { data: hzData, loading, error, load } = useEditorApi('huizhang')
const { save: saveApi } = useEditorApi('huizhang')

// 加载角色名用于辅助显示
const charNameMap = ref({})
async function loadCardNames() {
  try {
    const res = await fetch('/api/dev-editor/cards')
    const cards = await res.json()
    const map = {}
    for (const c of cards) {
      if (c.id) map[c.id] = c.name
    }
    charNameMap.value = map
  } catch {}
}

const search = ref('')
const saving = ref(false)
const saveMsg = ref(null)
const isNew = ref(false)

const form = ref({ charId: '', shapes: [] })

const filteredEntries = computed(() => {
  if (!hzData.value) return []
  return Object.entries(hzData.value).filter(([charId]) => {
    if (!search.value) return true
    const q = search.value.toLowerCase()
    const name = charNameMap.value[charId] ?? ''
    return String(charId).includes(q) || name.toLowerCase().includes(q)
  })
})

function selectEntry(charId) {
  isNew.value = false
  saveMsg.value = null
  const entry = hzData.value?.[charId]
  form.value = {
    charId: String(charId),
    shapes: entry?.shape ? [...entry.shape] : [],
  }
}

function newEntry() {
  isNew.value = true
  saveMsg.value = null
  form.value = { charId: '', shapes: ['defence', 'defence', 'defence', 'attack', 'attack', 'defence'] }
}

function addSlot() {
  form.value.shapes.push('defence')
}

function removeSlot(idx) {
  form.value.shapes.splice(idx, 1)
}

function resetForm() {
  saveMsg.value = null
  if (isNew.value) {
    form.value = { charId: '', shapes: [] }
  } else {
    selectEntry(form.value.charId)
  }
}

async function save() {
  if (!form.value.charId) {
    saveMsg.value = { ok: false, text: '角色 ID 不能为空' }
    return
  }
  if (!form.value.shapes.length) {
    saveMsg.value = { ok: false, text: '槽位不能为空' }
    return
  }
  saving.value = true
  saveMsg.value = null
  try {
    await saveApi({ charId: form.value.charId, shape: form.value.shapes })
    saveMsg.value = { ok: true, text: '保存成功！huizhang.js 已更新' }
    isNew.value = false
    await load()
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([load(), loadCardNames()])
})
</script>

<style>/* HuizhangTab */</style>

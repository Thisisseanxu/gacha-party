<template>
  <div style="max-width: 900px;">
    <div class="form-title">编辑 gacha_info.json</div>
    <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</div>
    <div v-if="loading" class="hint">加载中…</div>
    <div v-else-if="error" class="hint error">{{ error }}</div>
    <template v-else-if="db">
      <!-- GACHA_NAME_MAP -->
      <div class="form-section">
        <div class="form-section-title">GACHA_NAME_MAP（卡池 ID → 名称映射）</div>
        <KvTable v-model="db.GACHA_NAME_MAP" />
      </div>

      <!-- 未结束卡池 -->
      <div class="form-section">
        <div class="form-section-title">
          未结束卡池
          <span class="count-hint" style="margin-left: 8px;">{{ activePools.length }} 个</span>
        </div>
        <div class="active-pool-list">
          <div v-for="id in activePools" :key="id" class="active-pool-row">
            <span class="pool-id">{{ id }}</span>
            <span v-if="db.GACHA_NAME_MAP[id]" class="pool-name">{{ db.GACHA_NAME_MAP[id] }}</span>
            <span v-else class="pool-name-missing">（无名称）</span>
            <button class="de-btn small danger" @click="markEnded(id)" title="标记为已结束，将从此列表移除">
              标记已结束
            </button>
          </div>
          <div v-if="activePools.length === 0" class="hint">暂无未结束卡池</div>
        </div>
        <!-- 新增卡池 -->
        <div class="add-pool-row" style="margin-top: 10px;">
          <input
            v-model="newPoolId"
            class="de-input"
            style="width: 120px;"
            placeholder="新卡池 ID…"
            @keydown.enter="addPool"
          />
          <button class="de-btn primary" style="margin-left: 6px;" @click="addPool">
            + 添加（自动设为未结束）
          </button>
        </div>
      </div>

      <!-- 已结束卡池（折叠显示） -->
      <div class="form-section">
        <div
          class="form-section-title"
          style="cursor: pointer; user-select: none;"
          @click="showEnded = !showEnded"
        >
          已结束卡池
          <span class="count-hint" style="margin-left: 8px;">{{ db.ENDED_GACHA_IDS.length }} 个</span>
          <span style="margin-left: 8px; color: #666; font-size: 11px;">{{ showEnded ? '▲ 收起' : '▼ 展开' }}</span>
        </div>
        <div v-if="showEnded" class="active-pool-list">
          <div v-for="id in db.ENDED_GACHA_IDS" :key="id" class="active-pool-row">
            <span class="pool-id">{{ id }}</span>
            <span v-if="db.GACHA_NAME_MAP[id]" class="pool-name">{{ db.GACHA_NAME_MAP[id] }}</span>
            <span v-else class="pool-name-missing">（无名称）</span>
            <button class="de-btn small" @click="restoreActive(id)" title="恢复为未结束">
              恢复未结束
            </button>
          </div>
          <div v-if="db.ENDED_GACHA_IDS.length === 0" class="hint">暂无已结束卡池</div>
        </div>
      </div>

      <div class="form-actions">
        <button class="de-btn primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存到 gacha_info.json' }}
        </button>
        <button class="de-btn" @click="load">重新加载</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'
import KvTable from './KvTable.vue'

const { data, loading, error, load } = useEditorApi('database36')
const { save: saveApi } = useEditorApi('database36')

const saving = ref(false)
const saveMsg = ref(null)
const newPoolId = ref('')
const showEnded = ref(false)

// 直接操作 data.value.data 的快捷引用
const db = computed(() => data.value?.data ?? null)

// 未结束卡池 = AVA_GACHA_IDS - ENDED_GACHA_IDS
const activePools = computed(() => {
  if (!db.value) return []
  const ended = new Set(db.value.ENDED_GACHA_IDS)
  return db.value.AVA_GACHA_IDS.filter((id) => !ended.has(id))
})

// 新增卡池：加入 AVA_GACHA_IDS，不加入 ENDED（自动成为未结束）
function addPool() {
  const id = newPoolId.value.trim()
  if (!id) return
  const d = db.value
  if (!d.AVA_GACHA_IDS.includes(id)) {
    d.AVA_GACHA_IDS.push(id)
  }
  // 若之前在 ended 里，移除（防止历史残留）
  const ei = d.ENDED_GACHA_IDS.indexOf(id)
  if (ei !== -1) d.ENDED_GACHA_IDS.splice(ei, 1)
  newPoolId.value = ''
}

// 标记为已结束：添加到 ENDED_GACHA_IDS
function markEnded(id) {
  const d = db.value
  if (!d.ENDED_GACHA_IDS.includes(id)) {
    d.ENDED_GACHA_IDS.push(id)
  }
}

// 恢复为未结束：从 ENDED_GACHA_IDS 移除
function restoreActive(id) {
  const d = db.value
  const idx = d.ENDED_GACHA_IDS.indexOf(id)
  if (idx !== -1) d.ENDED_GACHA_IDS.splice(idx, 1)
}

async function save() {
  saving.value = true
  saveMsg.value = null
  try {
    await saveApi(data.value)
    saveMsg.value = { ok: true, text: '保存成功！gacha_info.json 已更新' }
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style>
.active-pool-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.active-pool-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  background: #2a2b30;
  border-radius: 4px;
  font-size: 12px;
}

.pool-id {
  font-family: monospace;
  color: #90b8ff;
  min-width: 40px;
  font-weight: bold;
}

.pool-name {
  flex: 1;
  color: #e0e0e0;
}

.pool-name-missing {
  flex: 1;
  color: #555;
  font-style: italic;
}
</style>

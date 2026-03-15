<template>
  <div style="max-width: 960px;">
    <div class="form-title">卡池数据（gacha_pools.json + gacha_info.json）</div>

    <div v-if="anyLoading" class="hint">加载中…</div>
    <div v-else-if="anyError" class="hint error">{{ anyError }}</div>
    <template v-else>
      <!-- 缺少名称的卡池警告 -->
      <div v-if="missingNames.length" class="missing-warn-banner">
        ⚠ 以下卡池 ID 尚未配置名称，请在名称映射中补充：
        <span v-for="id in missingNames" :key="id" class="warn-id">{{ id }}</span>
      </div>
      <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</div>

      <!-- ── 共享名称映射 ───────────────────────────── -->
      <div class="form-section">
        <div class="form-section-title">卡池名称映射（同步到两个文件）</div>
        <KvTable v-model="nameMap" />
      </div>

      <!-- ── 卡池分类 ───────────────────────────────── -->
      <div class="pools-grid">
        <!-- 限定卡池 limited -->
        <div class="form-section">
          <div class="form-section-title">限定卡池 <span class="count-hint">{{ pools.limited.length }} 个</span></div>
          <PoolList :ids="pools.limited" :name-map="nameMap" @remove="removeFrom('limited', $event)" />
          <PoolAddInput @add="addTo('limited', $event)" />
        </div>

        <!-- 联动卡池 event -->
        <div class="form-section">
          <div class="form-section-title">联动卡池 <span class="count-hint">{{ pools.event.length }} 个</span></div>
          <PoolList :ids="pools.event" :name-map="nameMap" @remove="removeFrom('event', $event)" />
          <PoolAddInput @add="addTo('event', $event)" />
        </div>

        <!-- 复刻卡池 fuke -->
        <div class="form-section">
          <div class="form-section-title">复刻卡池 <span class="count-hint">{{ pools.fuke.length }} 个</span></div>
          <PoolList :ids="pools.fuke" :name-map="nameMap" @remove="removeFrom('fuke', $event)" />
          <PoolAddInput @add="addTo('fuke', $event)" />
        </div>

        <!-- 其他（只读计算属性） -->
        <div class="form-section">
          <div class="form-section-title">
            其他 <span class="count-hint">{{ otherPools.length }} 个</span>
            <span class="readonly-hint">（只读 · 不写入文件）</span>
          </div>
          <PoolList :ids="otherPools" :name-map="nameMap" :readonly="true" />
          <div v-if="otherPools.length === 0" class="hint">所有卡池均已分类</div>
        </div>
      </div>

      <!-- ── 未结束卡池管理 ─────────────────────────── -->
      <div class="form-section">
        <div class="form-section-title">
          未结束卡池
          <span class="count-hint">{{ activePools.length }} 个</span>
        </div>
        <div class="active-pool-list">
          <div v-for="id in activePools" :key="id" class="active-pool-row">
            <span class="pool-id">{{ id }}</span>
            <span v-if="nameMap[id]" class="pool-name">{{ nameMap[id] }}</span>
            <span v-else class="no-name-warn">⚠ 无名称</span>
            <button class="de-btn small danger" @click="markEnded(id)">标记已结束</button>
          </div>
          <div v-if="activePools.length === 0" class="hint">暂无未结束卡池</div>
        </div>
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

      <!-- 已结束卡池（折叠） -->
      <div class="form-section">
        <div class="form-section-title clickable" @click="showEnded = !showEnded">
          已结束卡池
          <span class="count-hint">{{ endedIds.length }} 个</span>
          <span class="toggle-hint">{{ showEnded ? '▲ 收起' : '▼ 展开' }}</span>
        </div>
        <div v-if="showEnded" class="active-pool-list">
          <div v-for="id in endedIds" :key="id" class="active-pool-row">
            <span class="pool-id">{{ id }}</span>
            <span v-if="nameMap[id]" class="pool-name">{{ nameMap[id] }}</span>
            <span v-else class="no-name-warn">⚠ 无名称</span>
            <button class="de-btn small" @click="restoreActive(id)">恢复未结束</button>
          </div>
          <div v-if="endedIds.length === 0" class="hint">暂无已结束卡池</div>
        </div>
      </div>

      <!-- 保存 -->
      <div class="form-actions">
        <button class="de-btn primary" :disabled="saving" @click="saveAll">
          {{ saving ? '保存中…' : '保存两个文件' }}
        </button>
        <button class="de-btn" @click="reloadAll">重新加载</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'
import KvTable from './KvTable.vue'
import PoolList from './PoolList.vue'
import PoolAddInput from './PoolAddInput.vue'

// ── API ──────────────────────────────────────────────────
const { data: poolsData, loading: loadingPools, error: errorPools, load: loadPools } = useEditorApi('gacha-pools')
const { data: infoData, loading: loadingInfo, error: errorInfo, load: loadInfo } = useEditorApi('database36')
const { save: savePools } = useEditorApi('gacha-pools')
const { save: saveInfo } = useEditorApi('database36')

const saving = ref(false)
const saveMsg = ref(null)
const newPoolId = ref('')
const showEnded = ref(false)

const anyLoading = computed(() => loadingPools.value || loadingInfo.value)
const anyError = computed(() => errorPools.value || errorInfo.value || null)

// ── 共享名称映射（来自 gacha_info 的 GACHA_NAME_MAP）────
const nameMap = computed({
  get: () => infoData.value?.data?.GACHA_NAME_MAP ?? {},
  set: (v) => { if (infoData.value?.data) infoData.value.data.GACHA_NAME_MAP = v },
})

// ── gacha_pools.json 分类（直接操作 reactive 对象）───────
const pools = computed(() => poolsData.value ?? { limited: [], event: [], fuke: [] })

function addTo(category, id) {
  const list = pools.value[category]
  if (!list.includes(id)) list.push(id)
}

function removeFrom(category, id) {
  const list = pools.value[category]
  const idx = list.indexOf(id)
  if (idx !== -1) list.splice(idx, 1)
}

// ── 其他（只读）：AVA 中未分类的 ─────────────────────────
const classifiedSet = computed(
  () => new Set([...pools.value.limited, ...pools.value.event, ...pools.value.fuke]),
)

const otherPools = computed(() => {
  const ava = infoData.value?.data?.AVA_GACHA_IDS ?? []
  return ava.filter((id) => !classifiedSet.value.has(id))
})

// ── 无名称警告：所有已分类 ID 中缺少名称的 ────────────────
const missingNames = computed(() => {
  const nm = nameMap.value
  return [...classifiedSet.value].filter((id) => !nm[id])
})

// ── 未结束/已结束管理（来自 gacha_info）──────────────────
const endedIds = computed(() => infoData.value?.data?.ENDED_GACHA_IDS ?? [])

const activePools = computed(() => {
  const ended = new Set(endedIds.value)
  const ava = infoData.value?.data?.AVA_GACHA_IDS ?? []
  return ava.filter((id) => !ended.has(id))
})

function addPool() {
  const id = newPoolId.value.trim()
  if (!id) return
  const d = infoData.value.data
  if (!d.AVA_GACHA_IDS.includes(id)) d.AVA_GACHA_IDS.push(id)
  const ei = d.ENDED_GACHA_IDS.indexOf(id)
  if (ei !== -1) d.ENDED_GACHA_IDS.splice(ei, 1)
  newPoolId.value = ''
}

function markEnded(id) {
  const d = infoData.value.data
  if (!d.ENDED_GACHA_IDS.includes(id)) d.ENDED_GACHA_IDS.push(id)
}

function restoreActive(id) {
  const d = infoData.value.data
  const idx = d.ENDED_GACHA_IDS.indexOf(id)
  if (idx !== -1) d.ENDED_GACHA_IDS.splice(idx, 1)
}

// ── 保存（两个文件，同步 names）─────────────────────────
async function saveAll() {
  saving.value = true
  saveMsg.value = null
  try {
    // 将共享名称映射同步到 gacha_pools.names
    poolsData.value.names = { ...nameMap.value }
    await Promise.all([savePools(poolsData.value), saveInfo(infoData.value)])
    saveMsg.value = { ok: true, text: '保存成功！gacha_pools.json 和 gacha_info.json 已更新' }
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

async function reloadAll() {
  saveMsg.value = null
  await Promise.all([loadPools(), loadInfo()])
}

onMounted(reloadAll)
</script>

<style>
.pools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 24px;
}

.missing-warn-banner {
  background: #3a2800;
  border: 1px solid #7a5500;
  color: #ffc840;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.warn-id {
  background: #7a5500;
  color: #ffe090;
  border-radius: 3px;
  padding: 1px 6px;
  font-family: monospace;
  font-size: 11px;
}

.no-name-warn {
  flex: 1;
  color: #ffa040;
  font-size: 11px;
  font-weight: bold;
}

.readonly-hint {
  font-size: 10px;
  color: #555;
  margin-left: 6px;
  font-weight: normal;
}

.clickable {
  cursor: pointer;
  user-select: none;
}

.toggle-hint {
  margin-left: 8px;
  color: #666;
  font-size: 11px;
  font-weight: normal;
}

.add-pool-row {
  display: flex;
  align-items: center;
}
</style>

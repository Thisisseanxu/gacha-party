<template>
  <div class="gp-tab">
    <!-- ── 操作栏（粘性顶部）── -->
    <div class="gp-bar">
      <div class="gp-bar-left">
        <button class="de-btn primary small" @click="toggleNewPoolForm">+ 新建卡池</button>
        <template v-if="showNewPoolForm">
          <input v-model="newPoolId" class="de-input gp-new-input" placeholder="卡池 ID…" @keydown.enter="addPool" />
          <button class="de-btn primary small" @click="addPool">确定</button>
        </template>
      </div>
      <div class="gp-bar-right">
        <span v-if="saveMsg" :class="['gp-save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</span>
        <button class="de-btn" :disabled="saving" @click="reloadAll">重新加载</button>
        <button class="de-btn primary" :disabled="saving" @click="saveAll">{{ saving ? '保存中…' : '保存' }}</button>
      </div>
    </div>

    <div v-if="anyLoading" class="hint" style="padding: 16px 0;">加载中…</div>
    <div v-else-if="anyError" class="hint error" style="padding: 16px 0;">{{ anyError }}</div>
    <template v-else>
      <!-- ── 卡池分类（4 列，宽度不足时自动换行）── -->
      <div class="gp-cats">
        <div class="form-section gp-cat">
          <div class="form-section-title">限定 <span class="count-hint">{{ pools.limited.length }}</span></div>
          <PoolList :ids="pools.limited" :name-map="nameMap" @remove="removeFrom('limited', $event)" />
          <PoolAddInput :options="otherPoolOptions" @add="addTo('limited', $event)" />
        </div>

        <div class="form-section gp-cat">
          <div class="form-section-title">联动 <span class="count-hint">{{ pools.event.length }}</span></div>
          <PoolList :ids="pools.event" :name-map="nameMap" @remove="removeFrom('event', $event)" />
          <PoolAddInput :options="otherPoolOptions" @add="addTo('event', $event)" />
        </div>

        <div class="form-section gp-cat">
          <div class="form-section-title">复刻 <span class="count-hint">{{ pools.fuke.length }}</span></div>
          <PoolList :ids="pools.fuke" :name-map="nameMap" @remove="removeFrom('fuke', $event)" />
          <PoolAddInput :options="otherPoolOptions" @add="addTo('fuke', $event)" />
        </div>

        <div class="form-section gp-cat">
          <div class="form-section-title">
            其他（未分类）<span class="count-hint">{{ otherPools.length }}</span>
          </div>
          <PoolList v-if="otherPools.length" :ids="otherPools" :name-map="nameMap" :readonly="true" />
          <div v-else class="hint" style="font-size: 11px;">均已分类</div>
        </div>
      </div>

      <div class="gp-cats">
        <div class="form-section gp-row3-main">
          <div class="form-section-title">
            卡池名称映射 <span class="count-hint">{{ Object.keys(nameMap).length }} 条</span>
          </div>
          <div ref="namemapEl" class="gp-row3-scroll">
            <KvTable ref="kvTableRef" v-model="nameMap" />
          </div>
        </div>

        <div class="form-section gp-row3-side">
          <div class="form-section-title">未结束 <span class="count-hint">{{ activePools.length }}</span></div>
          <div class="gp-row3-scroll">
            <div v-for="id in activePools" :key="id" class="active-pool-row">
              <span class="pool-id">{{ id }}</span>
              <span v-if="nameMap[id]" class="pool-name">{{ nameMap[id] }}</span>
              <span v-else class="no-name-warn">⚠ 无名称</span>
              <button class="de-btn small danger" @click="markEnded(id)">已结束</button>
            </div>
            <div v-if="activePools.length === 0" class="hint">暂无未结束卡池</div>
          </div>
        </div>

        <div class="form-section gp-row3-side">
          <div class="form-section-title">
            已结束 <span class="count-hint">{{ endedIds.length }}</span>
          </div>
          <div class="gp-row3-scroll">
            <div v-for="id in endedIds" :key="id" class="active-pool-row">
              <span class="pool-id">{{ id }}</span>
              <span v-if="nameMap[id]" class="pool-name">{{ nameMap[id] }}</span>
              <span v-else class="no-name-warn">⚠ 无名称</span>
              <button class="de-btn small" @click="restoreActive(id)">未结束</button>
            </div>
            <div v-if="endedIds.length === 0" class="hint">暂无已结束卡池</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'
import KvTable from './KvTable.vue'
import PoolList from './PoolList.vue'
import PoolAddInput from './PoolAddInput.vue'

// ── API ──────────────────────────────────────────────
const { data: poolsData, loading: loadingPools, error: errorPools, load: loadPools } = useEditorApi('gacha-pools')
const { data: infoData, loading: loadingInfo, error: errorInfo, load: loadInfo } = useEditorApi('database36')
const { save: savePools } = useEditorApi('gacha-pools')
const { save: saveInfo } = useEditorApi('database36')

const saving = ref(false)
const saveMsg = ref(null)
const newPoolId = ref('')
const showNewPoolForm = ref(false)

const namemapEl = ref(null)
const kvTableRef = ref(null)

const anyLoading = computed(() => loadingPools.value || loadingInfo.value)
const anyError = computed(() => errorPools.value || errorInfo.value || null)

// ── 名称映射（setter 就地修改，避免引用变化触发 KvTable watch 重排序）──
const nameMap = computed({
  get: () => infoData.value?.data?.GACHA_NAME_MAP ?? {},
  set: (v) => {
    if (!infoData.value?.data) return
    const map = infoData.value.data.GACHA_NAME_MAP
    for (const k of Object.keys(map)) {
      if (!(k in v)) delete map[k]
    }
    for (const [k, val] of Object.entries(v)) {
      map[k] = val
    }
  },
})

// ── 分类 ──────────────────────────────────────────────
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

const classifiedSet = computed(
  () => new Set([...pools.value.limited, ...pools.value.event, ...pools.value.fuke]),
)

const otherPools = computed(() => {
  const ava = infoData.value?.data?.AVA_GACHA_IDS ?? []
  return ava.filter((id) => !classifiedSet.value.has(id))
})

const otherPoolOptions = computed(() =>
  otherPools.value.map((id) => ({ id, name: nameMap.value[id] || '' })),
)

// ── 未结束/已结束 ──────────────────────────────────────
const endedIds = computed(() => infoData.value?.data?.ENDED_GACHA_IDS ?? [])

const activePools = computed(() => {
  const ended = new Set(endedIds.value)
  const ava = infoData.value?.data?.AVA_GACHA_IDS ?? []
  return ava.filter((id) => !ended.has(id))
})

function toggleNewPoolForm() {
  showNewPoolForm.value = !showNewPoolForm.value
  if (!showNewPoolForm.value) newPoolId.value = ''
}

function addPool() {
  const id = newPoolId.value.trim()
  if (!id) return
  const d = infoData.value.data

  // 插入位置：在 "10000" 和 "9" 之前的最后一位
  if (!d.AVA_GACHA_IDS.includes(id)) {
    const reserved = new Set(['10000', '9'])
    const insertIdx = d.AVA_GACHA_IDS.findIndex((x) => reserved.has(x))
    if (insertIdx !== -1) {
      d.AVA_GACHA_IDS.splice(insertIdx, 0, id)
    } else {
      d.AVA_GACHA_IDS.push(id)
    }
  }

  // 从已结束列表中移除（如果有）
  const ei = d.ENDED_GACHA_IDS.indexOf(id)
  if (ei !== -1) d.ENDED_GACHA_IDS.splice(ei, 1)

  // 在名称映射底部追加一行（就地修改，不触发 watch 重排）
  if (!(id in d.GACHA_NAME_MAP)) {
    d.GACHA_NAME_MAP[id] = ''
    // 通知 KvTable 追加行并滚动到底部
    nextTick(() => {
      kvTableRef.value?.appendRow(id, '')
      nextTick(() => {
        if (namemapEl.value) namemapEl.value.scrollTop = namemapEl.value.scrollHeight
      })
    })
  }

  newPoolId.value = ''
  showNewPoolForm.value = false
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

// ── 保存 ──────────────────────────────────────────────
async function saveAll() {
  saving.value = true
  saveMsg.value = null
  try {
    poolsData.value.names = { ...nameMap.value }
    await Promise.all([savePools(poolsData.value), saveInfo(infoData.value)])
    saveMsg.value = { ok: true, text: '保存成功' }
  } catch (e) {
    saveMsg.value = { ok: false, text: `失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

async function reloadAll() {
  saveMsg.value = null
  await Promise.all([loadPools(), loadInfo()])
  nextTick(scrollAllToBottom)
}

function scrollAllToBottom() {
  for (const el of document.querySelectorAll('.gp-row3-scroll, .gp-cat .active-pool-list')) {
    el.scrollTop = el.scrollHeight
  }
}

onMounted(reloadAll)
</script>

<style scoped>
.gp-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 8px;
  background: #222328;
  border-bottom: 1px solid #333;
  margin-bottom: 8px;
  gap: 8px;
}

.gp-bar-left,
.gp-bar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.gp-new-input {
  width: 110px;
}

.gp-save-msg {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
}

.gp-save-msg.ok {
  background: #1a3a1a;
  color: #6fcf6f;
}

.gp-save-msg.err {
  background: #3a1a1a;
  color: #f07070;
}

.gp-cats {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0 14px;
}

.gp-cat {
  flex: 1;
  min-width: 250px;
}

.gp-cat :deep(.active-pool-list) {
  max-height: 230px;
  overflow-y: auto;
}

.gp-row3-main {
  flex: 2;
  min-width: 400px;
}

.gp-row3-side {
  flex: 1;
  min-width: 260px;
}

.gp-row3-scroll {
  max-height: 350px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #444 #2a2b30;
}

.gp-row3-scroll::-webkit-scrollbar {
  width: 5px;
}

.gp-row3-scroll::-webkit-scrollbar-track {
  background: #2a2b30;
}

.gp-row3-scroll::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.gp-row3-scroll::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}

.no-name-warn {
  flex: 1;
  color: #ffa040;
  font-size: 11px;
  font-weight: bold;
}
</style>

<template>
  <div class="editor-layout">
    <!-- 左侧：卡池列表 -->
    <div class="list-panel">
      <div class="panel-header">
        <select v-model="typeFilter" class="de-select">
          <option value="">全部类型</option>
          <option v-for="t in poolTypes" :key="t" :value="t">{{ t }}</option>
        </select>
        <input v-model="search" class="de-input" placeholder="搜索名称/ID…" />
      </div>
      <div class="panel-actions">
        <button class="de-btn primary" @click="newPool">+ 新增卡池</button>
        <span class="count-hint">{{ filteredPools.length }} 条</span>
      </div>
      <div v-if="loading" class="hint">加载中…</div>
      <div v-else-if="error" class="hint error">{{ error }}</div>
      <div v-else class="item-list">
        <div
          v-for="[key, pool] in filteredPools"
          :key="key"
          :class="['list-item', { active: form.poolId === key }]"
          @click="selectPool(key, pool)"
        >
          <span class="rarity-tag">{{ pool.type }}</span>
          <span class="item-name">{{ pool.name }}</span>
          <span v-if="pool.isAvailable" class="avail-dot" title="上架中">●</span>
        </div>
      </div>
    </div>

    <!-- 右侧：编辑表单 -->
    <div class="form-panel" style="overflow-y: auto; max-height: calc(100vh - 110px);">
      <div class="form-title">{{ isNew ? '新增卡池' : `编辑卡池 "${form.name}"` }}</div>
      <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</div>

      <!-- 基本信息 -->
      <div class="form-section">
        <div class="form-section-title">基本信息</div>
        <div class="form-grid">
          <label>Pool ID</label>
          <input v-model="form.poolId" class="de-input" :disabled="!isNew" placeholder="如 shangyuandenghuo" />

          <label>卡池类型</label>
          <select v-model="form.type" class="de-select">
            <option v-for="t in allTypes" :key="t" :value="t">{{ t }}</option>
          </select>

          <label>显示名称</label>
          <input v-model="form.name" class="de-input" placeholder="如 上元灯火" />

          <label>封面图 URL</label>
          <input v-model="form.imageUrl" class="de-input" placeholder="/images/cardpools-icon/10212.webp" />

          <label>是否上架</label>
          <input type="checkbox" v-model="form.isAvailable" />
        </div>
      </div>

      <!-- 基础概率 -->
      <div class="form-section">
        <div class="form-section-title">基础概率 rates</div>
        <div class="form-grid">
          <label>SP 概率</label>
          <input v-model.number="form.rates.SP" type="number" step="0.0001" min="0" max="1" class="de-input" />
          <label>SSR 概率</label>
          <input v-model.number="form.rates.SSR" type="number" step="0.01" min="0" max="1" class="de-input" />
          <label>SR 概率</label>
          <input v-model.number="form.rates.SR" type="number" step="0.01" min="0" max="1" class="de-input" />
        </div>
      </div>

      <!-- SP 规则 -->
      <div class="form-section">
        <div class="form-section-title">保底规则 rules.SP</div>
        <div class="form-grid">
          <label>pity 保底抽数</label>
          <input v-model.number="form.rulesSP.pity" type="number" class="de-input" />
          <label>boostAfter</label>
          <input v-model.number="form.rulesSP.boostAfter" type="number" class="de-input" />
          <label>boost 每次提升</label>
          <input v-model.number="form.rulesSP.boost" type="number" step="0.01" class="de-input" />
          <label>UpTrigger (UP 机制)</label>
          <input type="checkbox" v-model="form.rulesSP.UpTrigger" />
          <label>SelectUpCards (自选)</label>
          <input type="checkbox" v-model="form.rulesSP.SelectUpCards" />
          <label>UpCards（每行一名）</label>
          <textarea v-model="form.rulesSP.UpCardsText" class="de-textarea" rows="3" placeholder="果冻冰粥&#10;魔弹射手" />
        </div>
      </div>

      <!-- SSR 规则 -->
      <div class="form-section">
        <div class="form-section-title">保底规则 rules.SSR</div>
        <div class="form-grid">
          <label>pity 保底抽数</label>
          <input v-model.number="form.rulesSSR.pity" type="number" class="de-input" />
          <label>UpTrigger (UP 机制)</label>
          <input type="checkbox" v-model="form.rulesSSR.UpTrigger" />
          <label>doubleRateCards（每行一名）</label>
          <textarea v-model="form.rulesSSR.doubleRateCardsText" class="de-textarea" rows="3" placeholder="概率双倍的角色名" />
        </div>
      </div>

      <!-- 角色名单 -->
      <div class="form-section">
        <div class="form-section-title">卡池角色名单 cardNames</div>
        <div class="form-grid">
          <label>SP（每行一名）</label>
          <textarea v-model="form.cardNames.SPText" class="de-textarea" rows="3" />
          <label>SSR（每行一名）</label>
          <textarea v-model="form.cardNames.SSRText" class="de-textarea" rows="4" />
          <label>SR（每行一名）</label>
          <textarea v-model="form.cardNames.SRText" class="de-textarea" rows="4" />
          <label>R（每行一名）</label>
          <textarea v-model="form.cardNames.RText" class="de-textarea" rows="3" />
        </div>
      </div>

      <div class="form-actions">
        <button class="de-btn primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存到 cardPools.js' }}
        </button>
        <button class="de-btn" @click="resetForm">重置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'

const { data: poolsData, loading, error, load } = useEditorApi('cardpools')
const { save: saveApi } = useEditorApi('cardpools')

const poolTypes = ['限定', '常驻', '自选', '祈愿盲盒', '联动', '心愿', '高级常驻']
const allTypes = [...poolTypes, '其他']

const typeFilter = ref('')
const search = ref('')
const saving = ref(false)
const saveMsg = ref(null)
const isNew = ref(false)

function emptyForm() {
  return {
    poolId: '',
    type: '限定',
    name: '',
    imageUrl: '',
    isAvailable: true,
    rates: { SP: 0.0125, SSR: 0.06, SR: 0.2 },
    rulesSP: { pity: 60, boostAfter: 40, boost: 0.02, UpTrigger: true, SelectUpCards: false, UpCardsText: '' },
    rulesSSR: { pity: 80, UpTrigger: false, doubleRateCardsText: '' },
    cardNames: { SPText: '', SSRText: '', SRText: '', RText: '' },
  }
}

const form = ref(emptyForm())

const filteredPools = computed(() => {
  if (!poolsData.value) return []
  return Object.entries(poolsData.value).filter(([key, pool]) => {
    if (typeFilter.value && pool.type !== typeFilter.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return pool.name?.toLowerCase().includes(q) || key.toLowerCase().includes(q)
    }
    return true
  })
})

function toLines(arr) {
  return Array.isArray(arr) ? arr.join('\n') : ''
}

function fromLines(text) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function selectPool(key, pool) {
  isNew.value = false
  saveMsg.value = null
  const rSP = pool.rules?.SP ?? {}
  const rSSR = pool.rules?.SSR ?? {}
  form.value = {
    poolId: key,
    type: pool.type ?? '限定',
    name: pool.name ?? '',
    imageUrl: pool.imageUrl ?? '',
    isAvailable: !!pool.isAvailable,
    rates: {
      SP: pool.rates?.SP ?? 0.0125,
      SSR: pool.rates?.SSR ?? 0.06,
      SR: pool.rates?.SR ?? 0.2,
    },
    rulesSP: {
      pity: rSP.pity ?? 60,
      boostAfter: rSP.boostAfter ?? 40,
      boost: rSP.boost ?? 0.02,
      UpTrigger: !!rSP.UpTrigger,
      SelectUpCards: !!rSP.SelectUpCards,
      UpCardsText: toLines(rSP.UpCards),
    },
    rulesSSR: {
      pity: rSSR.pity ?? 80,
      UpTrigger: !!rSSR.UpTrigger,
      doubleRateCardsText: toLines(rSSR.doubleRateCards),
    },
    cardNames: {
      SPText: toLines(pool.cardNames?.SP),
      SSRText: toLines(pool.cardNames?.SSR),
      SRText: toLines(pool.cardNames?.SR),
      RText: toLines(pool.cardNames?.R),
    },
  }
}

function newPool() {
  isNew.value = true
  saveMsg.value = null
  form.value = emptyForm()
}

function resetForm() {
  saveMsg.value = null
  if (isNew.value) {
    form.value = emptyForm()
  } else {
    const pool = poolsData.value?.[form.value.poolId]
    if (pool) selectPool(form.value.poolId, pool)
  }
}

function buildPayload() {
  const f = form.value
  const rSP = {}
  if (f.rulesSP.pity) rSP.pity = f.rulesSP.pity
  if (f.rulesSP.boostAfter) rSP.boostAfter = f.rulesSP.boostAfter
  if (f.rulesSP.boost) rSP.boost = f.rulesSP.boost
  if (f.rulesSP.UpTrigger) rSP.UpTrigger = true
  if (f.rulesSP.SelectUpCards) rSP.SelectUpCards = true
  const upCards = fromLines(f.rulesSP.UpCardsText)
  if (upCards.length) rSP.UpCards = upCards

  const rSSR = {}
  if (f.rulesSSR.pity) rSSR.pity = f.rulesSSR.pity
  if (f.rulesSSR.UpTrigger) rSSR.UpTrigger = true
  const dCards = fromLines(f.rulesSSR.doubleRateCardsText)
  if (dCards.length) rSSR.doubleRateCards = dCards

  const cardNames = {}
  const sp = fromLines(f.cardNames.SPText)
  const ssr = fromLines(f.cardNames.SSRText)
  const sr = fromLines(f.cardNames.SRText)
  const r = fromLines(f.cardNames.RText)
  if (sp.length) cardNames.SP = sp
  if (ssr.length) cardNames.SSR = ssr
  if (sr.length) cardNames.SR = sr
  if (r.length) cardNames.R = r

  return {
    type: f.type,
    name: f.name,
    isAvailable: f.isAvailable,
    imageUrl: f.imageUrl,
    rates: { SP: f.rates.SP, SSR: f.rates.SSR, SR: f.rates.SR },
    rules: { SP: rSP, SSR: rSSR },
    cardNames,
  }
}

async function save() {
  if (!form.value.poolId) {
    saveMsg.value = { ok: false, text: 'Pool ID 不能为空' }
    return
  }
  saving.value = true
  saveMsg.value = null
  try {
    await saveApi({ poolId: form.value.poolId, data: buildPayload() })
    saveMsg.value = { ok: true, text: '保存成功！cardPools.js 已更新' }
    isNew.value = false
    await load()
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style>/* CardPoolsTab */</style>

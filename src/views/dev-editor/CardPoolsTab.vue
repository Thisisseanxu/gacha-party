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

    <!-- 右侧：编辑区域 -->
    <div class="form-panel" style="overflow-y: auto; max-height: calc(100vh - 110px)">
      <!-- 未选中时的空状态 -->
      <div v-if="!isNew && !form.poolId" class="form-empty">
        在左侧选择要编辑的卡池，或点击「+ 新增卡池」
      </div>

      <!-- 不支持可视化编辑 -->
      <template v-else-if="isUnsupported && !isNew">
        <div class="form-title">编辑卡池 "{{ form.name }}"</div>
        <div class="cp-unsupported">
          <div style="font-size: 15px; margin-bottom: 6px">⚠ 暂不支持可视化编辑</div>
          <div class="hint">该卡池含有编辑器未知的配置字段（如心愿自选、常驻等特殊规则）</div>
          <div class="hint" style="margin-top: 4px">
            请前往 <code style="color: #90b8ff">src/data/cardPools.js</code> 直接编辑源代码
          </div>
        </div>
      </template>

      <!-- 正常编辑表单 -->
      <template v-else>
        <div class="form-title">{{ isNew ? '新增卡池' : `编辑卡池 "${form.name}"` }}</div>
        <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">
          {{ saveMsg.text }}
        </div>

        <!-- 基本信息 -->
        <div class="form-section">
          <div class="form-section-title">基本信息</div>
          <div class="form-grid">
            <label>Pool ID</label>
            <input
              v-model="form.poolId"
              class="de-input"
              :disabled="!isNew"
              placeholder="如 shangyuandenghuo"
            />

            <label>卡池类型</label>
            <select v-model="form.type" class="de-select">
              <option v-for="t in allTypes" :key="t" :value="t">{{ t }}</option>
            </select>

            <label>显示名称</label>
            <input v-model="form.name" class="de-input" placeholder="如 上元灯火" />

            <label>封面图 URL</label>
            <div>
              <input
                v-model="form.imageUrl"
                class="de-input"
                style="width: 100%"
                placeholder="/images/cardpools/10212.webp"
                @blur="fixWebp('imageUrl')"
              />
              <img v-if="form.imageUrl" :src="form.imageUrl" class="img-preview" />
            </div>

            <label>是否置顶</label>
            <input type="checkbox" v-model="form.isAvailable" />
          </div>
        </div>

        <!-- 基础概率 -->
        <div class="form-section">
          <div class="form-section-title">基础概率 rates</div>
          <div class="form-grid">
            <label>SP 概率</label>
            <input
              v-model.number="form.rates.SP"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              class="de-input"
            />
            <label>SSR 概率</label>
            <input
              v-model.number="form.rates.SSR"
              type="number"
              step="0.01"
              min="0"
              max="1"
              class="de-input"
            />
            <label>SR 概率</label>
            <input
              v-model.number="form.rates.SR"
              type="number"
              step="0.01"
              min="0"
              max="1"
              class="de-input"
            />
          </div>
        </div>

        <!-- 卡池角色名单 -->
        <div class="form-section">
          <div class="form-section-title">卡池角色名单 cardNames</div>
          <div v-if="cardsLoading" class="hint">角色数据加载中…</div>
          <template v-else>
            <div class="cp-roster-block" v-for="rar in ['SP', 'SSR', 'SR', 'R']" :key="rar">
              <div class="cp-roster-label">
                <span class="rarity-tag" :data-rarity="rar">{{ rar }}</span>
                <span style="color: #aaa">{{ form.cardNames[rar].length }} 人已选</span>
                <button
                  v-if="rar === 'SR' || rar === 'R'"
                  class="de-btn"
                  style="padding: 2px 8px; font-size: 12px; margin-left: auto"
                  @click="autoSelectBaseCards(rar)"
                  title="自动勾选所有不是非游戏内角色的角色"
                >
                  自动勾选
                </button>
              </div>
              <CharacterSelector
                v-model="form.cardNames[rar]"
                :characterList="cardsByRarity[rar]"
                sub-title=""
                hide-title
                :hide-theme-filter="rar == 'SR' || rar == 'R'"
                hide-rarity-filter
                hide-qban-toggle
              />
            </div>
          </template>
        </div>

        <!-- SP 保底规则 -->
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
          </div>
          <div class="cp-roster-label" style="margin-top: 8px">
            <span style="color: #aaa; font-size: 12px"
              >UpCards — 从 SP 名单中选（{{ form.rulesSP.UpCards.length }} 人）</span
            >
          </div>
          <div v-if="spRosterCards.length === 0" class="hint">先在「角色名单」中添加 SP 角色</div>
          <CharacterSelector
            v-else
            v-model="form.rulesSP.UpCards"
            :characterList="spRosterCards"
            sub-title=""
            hide-title
            hide-theme-filter
            hide-rarity-filter
            hide-qban-toggle
          />
        </div>

        <!-- SSR 保底规则 -->
        <div class="form-section">
          <div class="form-section-title">保底规则 rules.SSR</div>
          <div class="cp-roster-label">
            <span style="color: #aaa; font-size: 12px"
              >doubleRateCards — 从 SSR 名单中选（{{
                form.rulesSSR.doubleRateCards.length
              }}
              人）</span
            >
          </div>
          <div v-if="ssrRosterCards.length === 0" class="hint">先在「角色名单」中添加 SSR 角色</div>
          <CharacterSelector
            v-else
            v-model="form.rulesSSR.doubleRateCards"
            :characterList="ssrRosterCards"
            sub-title=""
            hide-title
            hide-theme-filter
            hide-rarity-filter
            hide-qban-toggle
          />
        </div>

        <div class="form-actions">
          <button class="de-btn primary" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存到 cardPools.js' }}
          </button>
          <button class="de-btn" @click="resetForm">重置</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'
import CharacterSelector from '@/components/CharacterSelector.vue'

const { data: poolsData, loading, error, load } = useEditorApi('cardpools')
const { save: saveApi } = useEditorApi('cardpools')

const poolsEntries = computed(() => {
  if (!poolsData.value) return []
  if (Array.isArray(poolsData.value)) return poolsData.value
  return Object.entries(poolsData.value)
})

const poolsObject = computed(() => {
  return Object.fromEntries(poolsEntries.value)
})

const poolTypes = ['限定', '常驻', '自选', '祈愿盲盒', '联动', '心愿', '高级常驻']
const allTypes = [...poolTypes, '其他']

const KNOWN_SSR_KEYS = new Set(['pity', 'doubleRateCards', 'UpTrigger'])
const KNOWN_SP_KEYS = new Set([
  'pity',
  'boostAfter',
  'boost',
  'UpTrigger',
  'SelectUpCards',
  'UpCards',
])

// ── 角色数据 ──────────────────────────────────────────
const allCards = ref([])
const cardsLoading = ref(false)

async function loadCards() {
  cardsLoading.value = true
  try {
    const res = await fetch('/api/dev-editor/cards')
    const cards = await res.json()
    allCards.value = cards.map((c) => ({
      ...c,
      theme: typeof c.theme === 'string' ? { id: c.theme } : (c.theme ?? null),
    }))

    if (isNew.value) {
      if (form.value.cardNames.SR.length === 0) autoSelectBaseCards('SR')
      if (form.value.cardNames.R.length === 0) autoSelectBaseCards('R')
    }
  } catch {
    console.warn('[CardPoolsTab] 无法加载角色列表')
  } finally {
    cardsLoading.value = false
  }
}

// name ↔ id 双向映射
const nameToId = computed(() => {
  const m = {}
  for (const c of allCards.value) if (c.name && c.id) m[c.name] = c.id
  return m
})
const idToName = computed(() => {
  const m = {}
  for (const c of allCards.value) if (c.id && c.name) m[c.id] = c.name
  return m
})

const cardsByRarity = computed(() => {
  const groups = { SP: [], SSR: [], SR: [], R: [] }
  for (const c of allCards.value) {
    if (groups[c.rarity]) groups[c.rarity].push(c)
  }
  return groups
})

function namesToIds(names) {
  if (!Array.isArray(names)) return []
  return names.flatMap((n) => {
    const id = nameToId.value[n]
    if (!id) {
      console.warn('[CardPoolsTab] 找不到角色名称:', n)
      return []
    }
    return [id]
  })
}

function idsToNames(ids) {
  if (!Array.isArray(ids)) return []
  return ids.flatMap((id) => {
    const name = idToName.value[id]
    if (!name) {
      console.warn('[CardPoolsTab] 找不到角色ID:', id)
      return []
    }
    return [name]
  })
}

// ── 表单（在 watch/computed 引用前先声明）────────────────
const form = ref(emptyForm())

// 从 SP/SSR 名单中过滤出对应的 card 对象，供 UpCards/doubleRateCards 选择器使用
const spRosterCards = computed(() =>
  allCards.value.filter((c) => form.value.cardNames.SP.includes(c.id)),
)
const ssrRosterCards = computed(() =>
  allCards.value.filter((c) => form.value.cardNames.SSR.includes(c.id)),
)

const isSwitchingPool = ref(false)

// SP 名单变化时清理不再存在的 UpCards，并自动勾选新加入且符合条件（游戏内）的角色
watch(
  () => [...(form.value.cardNames.SP || [])],
  (newSP, oldSP) => {
    if (isSwitchingPool.value) return
    const prev = oldSP || []
    const added = newSP.filter((id) => !prev.includes(id))
    const addedEligible = added.filter((id) => {
      const card = allCards.value.find((c) => c.id === id)
      return card && !card.notInGame
    })
    const validUpCards = form.value.rulesSP.UpCards.filter((id) => newSP.includes(id))
    form.value.rulesSP.UpCards = Array.from(new Set([...validUpCards, ...addedEligible]))
  },
)
// SSR 名单变化时清理不再存在的 doubleRateCards
watch(
  () => form.value.cardNames.SSR,
  (newSSR) => {
    if (isSwitchingPool.value) return
    form.value.rulesSSR.doubleRateCards = form.value.rulesSSR.doubleRateCards.filter((id) =>
      newSSR.includes(id),
    )
  },
)

// 填写 poolId 时，如果封面图 url 未被用户手动修改偏离默认格式，则自动补全 default + poolid + .webp
watch(
  () => form.value.poolId,
  (newId, oldId) => {
    if (isSwitchingPool.value) return
    if (isNew.value) {
      const defaultPrefix = '/images/cardpools/'
      const oldDefaultUrl = oldId ? `${defaultPrefix}${oldId}.webp` : defaultPrefix
      if (form.value.imageUrl === oldDefaultUrl) {
        form.value.imageUrl = newId ? `${defaultPrefix}${newId}.webp` : defaultPrefix
      }
    }
  },
)

// ── 表单 ──────────────────────────────────────────────
const typeFilter = ref('')
const search = ref('')
const saving = ref(false)
const saveMsg = ref(null)
const isNew = ref(false)
const isUnsupported = ref(false)

function emptyForm() {
  return {
    poolId: '',
    type: '限定',
    name: '',
    imageUrl: '/images/cardpools/',
    isAvailable: true,
    rates: { SP: 0.0125, SSR: 0.06, SR: 0.2 },
    rulesSP: {
      pity: 60,
      boostAfter: 40,
      boost: 0.02,
      UpTrigger: true,
      SelectUpCards: true,
      UpCards: [],
    },
    rulesSSR: { doubleRateCards: [], _pity: null },
    cardNames: { SP: [], SSR: [], SR: [], R: [] },
  }
}

function fixWebp(field) {
  const v = form.value[field]
  if (v && !v.endsWith('/') && !v.endsWith('.webp')) form.value[field] = v + '.webp'
}

const filteredPools = computed(() => {
  if (!poolsData.value) return []
  return poolsEntries.value.filter(([key, pool]) => {
    if (typeFilter.value && pool.type !== typeFilter.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return pool.name?.toLowerCase().includes(q) || key.toLowerCase().includes(q)
    }
    return true
  })
})

function detectUnsupported(pool) {
  const ssrKeys = Object.keys(pool.rules?.SSR ?? {})
  const spKeys = Object.keys(pool.rules?.SP ?? {})
  return ssrKeys.some((k) => !KNOWN_SSR_KEYS.has(k)) || spKeys.some((k) => !KNOWN_SP_KEYS.has(k))
}

function selectPool(key, pool) {
  isSwitchingPool.value = true
  isNew.value = false
  saveMsg.value = null
  isUnsupported.value = detectUnsupported(pool)
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
      UpCards: namesToIds(rSP.UpCards),
    },
    rulesSSR: {
      doubleRateCards: namesToIds(rSSR.doubleRateCards),
      _pity: rSSR.pity ?? null,
    },
    cardNames: {
      SP: namesToIds(pool.cardNames?.SP),
      SSR: namesToIds(pool.cardNames?.SSR),
      SR: namesToIds(pool.cardNames?.SR),
      R: namesToIds(pool.cardNames?.R),
    },
  }
  nextTick(() => {
    isSwitchingPool.value = false
  })
}

function autoSelectBaseCards(rar) {
  if (!cardsByRarity.value[rar]) return
  form.value.cardNames[rar] = cardsByRarity.value[rar].filter((c) => !c.notInGame).map((c) => c.id)
}

function newPool() {
  isSwitchingPool.value = true
  isNew.value = true
  isUnsupported.value = false
  saveMsg.value = null
  form.value = emptyForm()

  if (allCards.value.length > 0) {
    autoSelectBaseCards('SR')
    autoSelectBaseCards('R')
  }

  nextTick(() => {
    isSwitchingPool.value = false
  })
}

function resetForm() {
  saveMsg.value = null
  if (isNew.value) {
    newPool()
  } else {
    const pool = poolsObject.value?.[form.value.poolId]
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
  const upCards = idsToNames(f.rulesSP.UpCards)
  if (upCards.length) rSP.UpCards = upCards

  const rSSR = {}
  if (f.rulesSSR._pity) rSSR.pity = f.rulesSSR._pity
  const dCards = idsToNames(f.rulesSSR.doubleRateCards)
  if (dCards.length) rSSR.doubleRateCards = dCards

  const cardNames = {}
  const sp = idsToNames(f.cardNames.SP)
  const ssr = idsToNames(f.cardNames.SSR)
  const sr = idsToNames(f.cardNames.SR)
  const r = idsToNames(f.cardNames.R)
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

function handleGlobalKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (!saving.value && (isNew.value || form.value.poolId)) {
      save()
    }
  }
}

onMounted(() => {
  Promise.all([load(), loadCards()])
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>

<style scoped>
.cp-unsupported {
  margin-top: 24px;
  padding: 20px;
  background: rgba(255, 160, 64, 0.07);
  border: 1px solid rgba(255, 160, 64, 0.3);
  border-radius: 6px;
  color: #ffa040;
}

.cp-roster-block {
  margin-bottom: 8px;
}

.cp-roster-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
</style>

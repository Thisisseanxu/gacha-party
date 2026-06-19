<template>
  <div class="editor-layout scores-editor">
    <div class="list-panel">
      <div class="panel-header">
        <input v-model="search" class="de-input" placeholder="搜索角色真名…" />
      </div>
      <div class="panel-actions">
        <span class="count-hint">{{ filteredCharacters.length }} 个角色</span>
        <span v-if="duplicateCharacterCount" class="duplicate-summary">
          {{ duplicateCharacterCount }} 个重复
        </span>
      </div>

      <div v-if="loading" class="hint">加载中…</div>
      <div v-else-if="error" class="hint error">{{ error }}</div>
      <div v-else class="item-list">
        <div
          v-for="character in filteredCharacters"
          :key="character['角色']"
          :class="[
            'list-item',
            {
              active: selectedName === character['角色'],
              duplicate: isDuplicate(character),
            },
          ]"
          :title="duplicateTitle(character)"
          @click="selectCharacter(character)"
        >
          <span class="item-name">{{ character['角色'] }}</span>
          <span v-if="isDuplicate(character)" class="duplicate-tag">数值重复</span>
        </div>
      </div>
    </div>

    <div class="form-panel">
      <div v-if="!selectedCharacter" class="form-empty">在左侧选择一个角色</div>
      <template v-else>
        <div class="form-title">编辑角色评分 · {{ selectedName }}</div>
        <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">
          {{ saveMsg.text }}
        </div>

        <div class="score-overview">
          <TendencyProfile
            :title="`${selectedName}的四维倾向`"
            :scores="form"
            :axes="axes"
            tone="character"
          />
        </div>

        <div class="score-fields">
          <div v-for="axis in axes" :key="axis.key" class="score-field">
            <label :for="`score-${axis.key}`"> {{ axis.negative }} ↔ {{ axis.positive }} </label>
            <input
              :id="`score-${axis.key}`"
              v-model.number="form[axis.key]"
              type="range"
              :min="scoreMin"
              :max="scoreMax"
            />
            <input
              v-model.number="form[axis.key]"
              class="de-input score-number"
              type="number"
              :min="scoreMin"
              :max="scoreMax"
            />
          </div>
        </div>

        <div class="portrait-section">
          <div class="section-heading">对应卡牌头像</div>
          <div v-if="matchingCards.length" class="portrait-grid">
            <div v-for="card in matchingCards" :key="card.id" class="portrait-card">
              <img :src="card.imageUrl" :alt="card.name" />
              <div class="portrait-name">{{ card.name }}</div>
              <div class="portrait-meta">{{ card.rarity }} · #{{ card.id }}</div>
            </div>
          </div>
          <div v-else class="no-portrait">cards.json 中未找到真名为“{{ selectedName }}”的卡牌</div>
        </div>

        <div v-if="currentDuplicates.length" class="duplicate-notice">
          当前四项数值与 {{ currentDuplicates.join('、') }} 完全一致
        </div>
        <div class="calibration-notice">
          修改角色倾向后，可运行 <code>npm run quiz:verify</code> 检查全部角色是否可达；
          <code>npm run quiz:calibrate</code> 只会输出人工调整建议，不会修改文件。
        </div>

        <div class="form-actions">
          <button class="de-btn primary" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存到 character_scores.json' }}
          </button>
          <button class="de-btn" @click="resetForm">重置</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import TendencyProfile from '@/components/TendencyProfile.vue'
import { dimensionEntries } from '@/utils/personalityMatch.js'

const search = ref('')
const scoresData = ref(null)
const cards = ref([])
const selectedName = ref('')
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const saveMsg = ref(null)
const form = reactive({})

const axes = computed(() => dimensionEntries(scoresData.value))
const dimensions = computed(() => axes.value.map((axis) => axis.key))
const characters = computed(() => scoresData.value?.characters || [])
const scoreMin = computed(() => scoresData.value?.scoring_scale?.min ?? 0)
const scoreMax = computed(() => scoresData.value?.scoring_scale?.max ?? 100)
const selectedCharacter = computed(() =>
  characters.value.find((character) => character['角色'] === selectedName.value),
)

const filteredCharacters = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return characters.value
  return characters.value.filter((character) => character['角色'].toLowerCase().includes(query))
})

function normalizedName(value) {
  return String(value || '').replace(/\s+/g, '')
}

const matchingCards = computed(() => {
  const name = normalizedName(selectedName.value)
  return cards.value.filter((card) => normalizedName(card.realname) === name)
})

function scoreKey(character) {
  return dimensions.value.map((dimension) => Number(character?.[dimension])).join('|')
}

const duplicateGroups = computed(() => {
  const groups = new Map()
  for (const character of characters.value) {
    const key = scoreKey(character)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(character['角色'])
  }
  return groups
})

const duplicateCharacterCount = computed(() =>
  [...duplicateGroups.value.values()]
    .filter((names) => names.length > 1)
    .reduce((count, names) => count + names.length, 0),
)

function isDuplicate(character) {
  return (duplicateGroups.value.get(scoreKey(character))?.length || 0) > 1
}

function duplicateTitle(character) {
  const names = duplicateGroups.value.get(scoreKey(character)) || []
  return names.length > 1
    ? `数值与 ${names.filter((name) => name !== character['角色']).join('、')} 相同`
    : ''
}

const currentDuplicates = computed(() => {
  if (!selectedName.value) return []
  const key = dimensions.value.map((dimension) => Number(form[dimension])).join('|')
  return (duplicateGroups.value.get(key) || []).filter((name) => name !== selectedName.value)
})

function selectCharacter(character) {
  selectedName.value = character['角色']
  saveMsg.value = null
  for (const dimension of dimensions.value) form[dimension] = character[dimension]
}

function resetForm() {
  if (selectedCharacter.value) selectCharacter(selectedCharacter.value)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [scoresResponse, cardsResponse] = await Promise.all([
      fetch('/api/dev-editor/character-scores'),
      fetch('/api/dev-editor/cards'),
    ])
    if (!scoresResponse.ok || !cardsResponse.ok) throw new Error('读取编辑器数据失败')
    scoresData.value = await scoresResponse.json()
    cards.value = await cardsResponse.json()
    if (characters.value.length) selectCharacter(characters.value[0])
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function save() {
  const invalidDimension = dimensions.value.find((dimension) => {
    const value = Number(form[dimension])
    return !Number.isFinite(value) || value < scoreMin.value || value > scoreMax.value
  })
  if (invalidDimension) {
    saveMsg.value = {
      ok: false,
      text: `${invalidDimension} 必须是 ${scoreMin.value} 至 ${scoreMax.value} 之间的数字`,
    }
    return
  }

  saving.value = true
  saveMsg.value = null
  try {
    const response = await fetch('/api/dev-editor/character-scores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character: selectedName.value,
        scores: Object.fromEntries(
          dimensions.value.map((dimension) => [dimension, Number(form[dimension])]),
        ),
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${response.status}`)
    }
    for (const dimension of dimensions.value) {
      selectedCharacter.value[dimension] = Number(form[dimension])
    }
    saveMsg.value = { ok: true, text: '保存成功！character_scores.json 已更新' }
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

function handleGlobalKeyDown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    if (selectedCharacter.value && !saving.value) save()
  }
}

onMounted(() => {
  load()
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => window.removeEventListener('keydown', handleGlobalKeyDown))
</script>

<style scoped>
.list-item.duplicate {
  background: #4a3515;
  border-color: #9a6c20;
  color: #ffe0a0;
}

.list-item.duplicate:hover {
  background: #5a411b;
}

.list-item.duplicate.active {
  background: #65491d;
  border-color: #e2a83d;
}

.duplicate-tag,
.duplicate-summary {
  color: #ffd27a;
  font-size: 10px;
}

.duplicate-tag {
  padding: 1px 5px;
  border: 1px solid #8b6425;
  border-radius: 10px;
  white-space: nowrap;
}

.duplicate-summary {
  margin-left: auto;
}

.score-overview {
  max-width: 420px;
}

.portrait-section {
  background: #1c1d21;
  border: 1px solid #33353c;
  border-radius: 6px;
}

.portrait-section {
  margin-top: 18px;
  padding: 14px;
}

.section-heading {
  color: #aaa;
  font-size: 12px;
  margin-bottom: 12px;
}

.portrait-grid {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
  scrollbar-width: thin;
  scrollbar-color: #444 #24252a;
}

.portrait-card {
  width: 110px;
  flex: 0 0 110px;
  overflow: hidden;
  background: #27282e;
  border: 1px solid #3b3d45;
  border-radius: 5px;
}

.portrait-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  object-position: top;
  background: #18191c;
}

.portrait-name,
.portrait-meta {
  padding: 5px 7px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.portrait-name {
  color: #eee;
  font-size: 12px;
}

.portrait-meta {
  color: #777;
  font-size: 10px;
  padding-bottom: 7px;
}

.no-portrait {
  color: #777;
  font-size: 12px;
  line-height: 1.6;
}

.score-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px 18px;
  margin-top: 18px;
}

.score-field {
  display: grid;
  grid-template-columns: 120px 1fr 68px;
  gap: 10px;
  align-items: center;
}

.score-field label {
  color: #aaa;
  font-size: 12px;
  text-align: left;
}

.score-field input[type='range'] {
  width: 100%;
  accent-color: #5a8fd6;
}

.score-number {
  text-align: center;
}

.duplicate-notice {
  margin-top: 14px;
  padding: 8px 10px;
  color: #ffd27a;
  background: #3f2f16;
  border: 1px solid #76551e;
  border-radius: 4px;
  font-size: 12px;
}

.calibration-notice {
  margin-top: 14px;
  padding: 8px 10px;
  color: #9ecbff;
  background: #172b42;
  border: 1px solid #315d89;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
}

.calibration-notice code {
  color: #fff;
}
</style>

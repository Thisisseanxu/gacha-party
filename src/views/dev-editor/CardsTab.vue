<template>
  <div class="editor-layout">
    <!-- 左侧：角色列表 -->
    <div class="list-panel">
      <div class="panel-header">
        <select v-model="rarityFilter" class="de-select">
          <option value="">全部稀有度</option>
          <option v-for="r in rarities" :key="r" :value="r">{{ r }}</option>
        </select>
        <input v-model="search" class="de-input" placeholder="搜索名称/ID…" />
      </div>
      <div class="panel-actions">
        <button class="de-btn primary" @click="newCard">+ 新增角色</button>
        <span class="count-hint">{{ filteredCards.length }} 条</span>
      </div>
      <div v-if="loading" class="hint">加载中…</div>
      <div v-else-if="error" class="hint error">{{ error }}</div>
      <div v-else class="item-list">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          :class="['list-item', { active: form.id === card.id }]"
          @click="selectCard(card)"
        >
          <span class="rarity-tag" :data-rarity="card.rarity">{{ card.rarity }}</span>
          <span class="item-name">{{ card.name }}</span>
          <span class="item-id">#{{ card.id }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：编辑表单 -->
    <div class="form-panel">
      <div class="form-title">{{ isNew ? '新增角色' : `编辑角色 #${form.id}` }}</div>
      <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</div>

      <div class="form-grid">
        <label>ID</label>
        <input
          v-model="form.id"
          class="de-input"
          :disabled="!isNew"
          placeholder="如 1110"
        />

        <label>名称</label>
        <input v-model="form.name" class="de-input" placeholder="如 贪吃天使" />

        <label>稀有度</label>
        <select v-model="form.rarity" class="de-select">
          <option v-for="r in rarities" :key="r" :value="r">{{ r }}</option>
        </select>

        <label>卡面图 URL</label>
        <input v-model="form.imageUrl" class="de-input" placeholder="/images/cards/1110.webp" />

        <label>真名</label>
        <input v-model="form.realname" class="de-input" placeholder="如 芙洛丽亚" />

        <label>主题属性</label>
        <select v-model="form.theme" class="de-select">
          <option v-for="th in themes" :key="th.value" :value="th.value">{{ th.label }}</option>
        </select>

        <label>Q版图 URL</label>
        <input v-model="form.qban_url" class="de-input" placeholder="/images/qban/1110.webp（可选）" />

        <label>非游戏内角色</label>
        <input type="checkbox" v-model="form.notInGame" />
      </div>

      <div class="form-actions">
        <button class="de-btn primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存到 cards.js' }}
        </button>
        <button class="de-btn" @click="resetForm">重置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'

const { data: cardsData, loading, error, load } = useEditorApi('cards')
const { save: saveApi } = useEditorApi('cards')

const rarities = ['SP', 'SSR', 'SR', 'R']
const themes = [
  { value: 'cake', label: '甜品 cake' },
  { value: 'dream', label: '梦境 dream' },
  { value: 'elec', label: '电玩 elec' },
  { value: 'music', label: '电音 music' },
  { value: 'ice', label: '寒冰 ice' },
  { value: 'fire', label: '火焰 fire' },
  { value: 'water', label: '流水 water' },
  { value: 'eiji', label: '异界 eiji' },
]

const rarityFilter = ref('')
const search = ref('')
const saving = ref(false)
const saveMsg = ref(null)
const isNew = ref(false)

const emptyForm = () => ({
  id: '',
  name: '',
  rarity: 'SSR',
  imageUrl: '',
  realname: '',
  theme: 'cake',
  qban_url: '',
  notInGame: false,
})

const form = ref(emptyForm())

const filteredCards = computed(() => {
  if (!cardsData.value) return []
  return cardsData.value.filter((c) => {
    if (rarityFilter.value && c.rarity !== rarityFilter.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return (
        c.name?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.realname?.toLowerCase().includes(q)
      )
    }
    return true
  })
})

function selectCard(card) {
  isNew.value = false
  saveMsg.value = null
  form.value = {
    id: card.id ?? '',
    name: card.name ?? '',
    rarity: card.rarity ?? 'SSR',
    imageUrl: card.imageUrl ?? '',
    realname: card.realname ?? '',
    theme: card.theme ?? 'cake',
    qban_url: card.qban_url ?? '',
    notInGame: !!card.notInGame,
  }
}

function newCard() {
  isNew.value = true
  saveMsg.value = null
  form.value = emptyForm()
}

function resetForm() {
  saveMsg.value = null
  if (isNew.value) {
    form.value = emptyForm()
  } else {
    const original = cardsData.value?.find((c) => c.id === form.value.id)
    if (original) selectCard(original)
  }
}

async function save() {
  if (!form.value.id || !form.value.name) {
    saveMsg.value = { ok: false, text: 'ID 和名称不能为空' }
    return
  }
  saving.value = true
  saveMsg.value = null
  try {
    const payload = { ...form.value }
    if (!payload.notInGame) delete payload.notInGame
    if (!payload.qban_url) delete payload.qban_url
    await saveApi(payload)
    saveMsg.value = { ok: true, text: '保存成功！cards.js 已更新' }
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

<style>/* CardsTab */</style>

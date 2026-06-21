<template>
  <main class="tendencies-page">
    <section class="page-shell">
      <header>
        <p class="eyebrow">盲盒派对 · 角色资料</p>
        <h1>角色四维倾向一览</h1>
        <p>分数越靠近两端，代表对应倾向越鲜明；接近 0 则表示两端较为均衡。</p>
        <input v-model="search" type="search" placeholder="搜索角色…" aria-label="搜索角色" />
      </header>

      <p v-if="loading" class="state-text">正在加载角色倾向…</p>
      <p v-else-if="error" class="error-text">{{ error }}</p>
      <div v-else class="character-grid">
        <article
          v-for="character in filteredCharacters"
          :key="character['角色']"
          class="character-card"
        >
          <div class="identity">
            <img
              v-if="portraitFor(character)"
              :src="portraitFor(character).qban_url || portraitFor(character).imageUrl"
              :alt="character['角色']"
            />
            <div>
              <h2>{{ character['角色'] }}</h2>
              <span>{{ portraitFor(character)?.name || '角色倾向档案' }}</span>
            </div>
          </div>
          <TendencyProfile title="四维倾向" :scores="character" :axes="axes" tone="character" />
          <p v-if="character['性格评语']" class="comment">{{ character['性格评语'] }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { allCards } from '@/data/cards.js'
import TendencyProfile from '@/components/TendencyProfile.vue'
import { dimensionEntries } from '@/utils/personalityMatch.js'

const search = ref('')
const scoreData = ref(null)
const loading = ref(true)
const error = ref('')

const axes = computed(() => dimensionEntries(scoreData.value))
const characters = computed(() => scoreData.value?.characters || [])
const filteredCharacters = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return characters.value
  return characters.value.filter((character) => character['角色'].toLowerCase().includes(query))
})

const portraitMap = computed(() => {
  const map = new Map()
  for (const card of allCards) {
    const name = normalizedName(card.realname)
    if (name && !map.has(name)) map.set(name, card)
  }
  return map
})

onMounted(async () => {
  try {
    const response = await fetch('/data/character_scores.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    scoreData.value = await response.json()
  } catch (loadError) {
    error.value = `角色倾向加载失败：${loadError.message}`
  } finally {
    loading.value = false
  }
})

function normalizedName(value) {
  return String(value || '').replace(/\s+/g, '')
}

function portraitFor(character) {
  return portraitMap.value.get(normalizedName(character['角色']))
}
</script>

<style scoped>
.tendencies-page {
  min-height: 100dvh;
  padding: 48px 20px 80px;
  box-sizing: border-box;
  color: var(--color-text-primary);
  background: var(--color-background-primary);
}

.page-shell {
  width: min(1200px, 100%);
  margin: 0 auto;
}

header {
  text-align: left;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-brand-primary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.5rem);
}

header p:last-of-type {
  color: var(--color-text-secondary);
}

input {
  width: min(420px, 100%);
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-primary);
  border-radius: 10px;
  color: var(--color-text-primary);
  background: var(--color-input-background);
  font: inherit;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 18px;
  margin-top: 32px;
}

.character-card {
  padding: 18px;
  border: 1px solid var(--color-border-primary);
  border-radius: 18px;
  background: var(--color-background-content);
}

.identity {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  text-align: left;
}

.identity img {
  width: 68px;
  height: 68px;
  border-radius: 14px;
  object-fit: cover;
  object-position: top;
  background: var(--color-background-avatar);
}

.identity h2 {
  margin: 0 0 4px;
}

.identity span,
.state-text {
  color: var(--color-text-secondary);
}

.error-text {
  color: var(--color-status-error);
}

.comment {
  margin: 14px 0 0;
  padding: 12px 14px;
  border-left: 3px solid var(--color-brand-primary);
  border-radius: 8px;
  background: var(--color-background-light);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.75;
  text-align: left;
}

@media (max-width: 480px) {
  .tendencies-page {
    padding: 28px 14px 60px;
  }

  .character-grid {
    grid-template-columns: 1fr;
  }
}
</style>

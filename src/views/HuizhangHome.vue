<template>
  <div class="page-container">
    <div class="content-wrap">
      <div class="hero-section">
        <h1 class="page-title">徽章攻略助手</h1>
        <p class="hero-sub">浏览角色徽章搭配攻略，或使用编辑器创建自己的攻略图</p>
      </div>

      <div class="main-layout">
        <!-- 精选攻略 -->
        <aside v-if="featuredItems.length > 0" class="featured-panel">
          <div class="panel-title">
            <h2 class="section-title">精选攻略</h2>
          </div>
          <div class="featured-list">
            <div v-for="item in featuredItems" :key="item.charId + item.strategy.customTitle" class="strategy-card"
              @click="goToChar(item.charId)">
              <div class="strategy-card-header">
                <!-- Q版头像 -->
                <img v-if="item.card?.qban_url" :src="item.card.qban_url" class="card-qban" :alt="item.card.name" />
                <div v-else class="card-qban-placeholder"></div>
                <!-- 文字信息 -->
                <div class="strategy-card-body">
                  <div class="card-char-name">{{ item.card?.name }}</div>
                  <div class="strategy-title-text">{{ item.strategy.customTitle || '攻略' }}</div>
                  <div class="strategy-author">by {{ item.strategy.authorName || '神秘的班长' }}</div>

                </div>
              </div>
              <div class="strategy-stars" v-if="item.strategy.stars?.length">
                <span class="stars-label">适配星级</span>
                <span v-for="s in item.strategy.stars" :key="s" class="star-chip">{{ s }}★</span>
              </div>
              <!-- 徽章搭配摘要 -->
              <div class="badge-summary" v-if="item.strategy.slots?.length">
                <span v-for="(g, i) in summarizeSlots(item.strategy.slots)" :key="i" class="badge-chip-item"
                  :style="{ color: badgeRarityColors[g.rarityId] }">
                  {{ HUIZHANG_TYPES[g.typeId]?.name || g.typeId }}
                  <template v-if="g.count > 1">×{{ g.count }}</template>
                  <span class="badge-chip-lv">Lv.{{ g.level }}</span>
                </span>
              </div>
            </div>
          </div>
        </aside>

        <!-- 浏览角色攻略 -->
        <section class="selector-panel">
          <div class="section-header">
            <h2 class="section-title">浏览角色攻略</h2>
            <p class="section-sub">选择角色查看她的所有徽章攻略</p>
          </div>
          <CharacterSelector v-model="selectedCharId" mode="single" :characterList="displayCharacterList"
            :disabledCharacterIds="disabledCharacterIds" title="选择角色查看攻略" :subTitle="null" :show-qban="true"
            :show-add-custom="true" :add-custom-always-visible="true" @confirm="onCharConfirm"
            @add-custom="openCustomCharModal" />
        </section>
      </div>
    </div>
  </div>

  <!-- 自定义角色弹窗 -->
  <div v-if="showCustomCharForm" class="overlay" @click.self="showCustomCharForm = false">
    <div class="custom-character-form">
      <h3>上传自定义角色</h3>

      <div class="compact-row">
        <div class="form-row compact-col">
          <label>角色图片</label>
          <div style="display: flex; gap: 10px; align-items: center">
            <button @click="triggerCustomCharUpload" class="form-btn" style="flex: 1">
              {{ customCharForm.image ? '更换' : '上传' }}
            </button>
            <img v-if="customCharForm.image" :src="customCharForm.image" class="avatar-preview-small" />
          </div>
          <input type="file" ref="customCharInputRef" @change="handleCustomCharImage" accept="image/*"
            style="display: none" />
        </div>
        <div class="form-row compact-col">
          <label>所属系列</label>
          <select v-model="customCharForm.theme" class="form-select">
            <option :value="null">无</option>
            <option v-for="theme in availableThemes" :key="theme.name" :value="theme">
              {{ theme.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="compact-row">
        <div class="form-row compact-col">
          <label>徽章数量</label>
          <select v-model="customCharForm.count" class="form-select" @change="updateCustomCharShapes">
            <option :value="2">2个</option>
            <option :value="4">4个</option>
            <option :value="6">6个</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <label>徽章形状配置</label>
        <div class="shape-grid">
          <div v-for="(s, i) in customCharForm.shapes" :key="i" class="shape-item">
            <select v-model="customCharForm.shapes[i]" class="form-select mini-shape-select">
              <option :value="HUIZHANG_SHAPES.CIRCLE">圆形</option>
              <option :value="HUIZHANG_SHAPES.DIAMOND">菱形</option>
              <option :value="HUIZHANG_SHAPES.SHIELD">盾形</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button @click="saveCustomChar" class="form-btn primary">确认使用</button>
        <button @click="showCustomCharForm = false" class="form-btn cancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { allCards } from '@/data/cards.js'
import { getCharConfig, HUIZHANG_SHAPES, HUIZHANG_TYPES } from '@/data/huizhang.js'
import { colors } from '@/styles/colors.js'
import CharacterSelector from '@/components/CharacterSelector.vue'
import { useHuizhangGuides } from '@/composables/useHuizhangGuides.js'

const router = useRouter()
const selectedCharId = ref('')

const { init, getFeaturedGuides } = useHuizhangGuides()

const baseCharacterList = computed(() => allCards.filter((c) => c.id.match(/^\d+$/)))

// 自定义角色
const tempCustomChar = ref(null)
const showCustomCharForm = ref(false)
const customCharForm = ref({ image: null, theme: null, count: 6, shapes: [] })
const customCharInputRef = ref(null)

const displayCharacterList = computed(() => {
  const list = [...baseCharacterList.value]
  if (tempCustomChar.value) list.unshift(tempCustomChar.value)
  return list
})

const disabledCharacterIds = computed(() =>
  baseCharacterList.value.filter((c) => !getCharConfig(c.id)).map((c) => c.id)
)

const availableThemes = computed(() => {
  const themes = new Map()
  allCards.forEach((c) => {
    const cfg = getCharConfig(c.id)
    if (cfg?.theme?.name && cfg?.theme?.icon) {
      if (!themes.has(cfg.theme.name)) themes.set(cfg.theme.name, cfg.theme)
    }
  })
  return Array.from(themes.values())
})

const cardMap = computed(() => {
  const m = new Map()
  allCards.forEach((c) => m.set(c.id, c))
  return m
})

// 精选攻略数据（从 D1 实时加载，缓存4小时）
const featuredItems = computed(() =>
  getFeaturedGuides()
    .filter((g) => g.data !== null)
    .map((g) => ({
      charId: g.charId,
      strategy: g.data,
      card: cardMap.value.get(g.charId),
      charConfig: getCharConfig(g.charId),
    })),
)

onMounted(async () => {
  await init()
})

const goToChar = (charId) => router.push(`/huizhang/char/${charId}`)

const onCharConfirm = () => {
  if (!selectedCharId.value) return
  if (tempCustomChar.value && selectedCharId.value === tempCustomChar.value.id) {
    sessionStorage.setItem('huizhang_customChar', JSON.stringify(tempCustomChar.value))
    router.push('/huizhang/edit')
  } else {
    router.push(`/huizhang/char/${selectedCharId.value}`)
  }
}

// 自定义角色逻辑
const openCustomCharModal = () => {
  customCharForm.value = {
    image: null,
    theme: availableThemes.value[0] || null,
    count: 6,
    shapes: Array(6).fill(HUIZHANG_SHAPES.CIRCLE),
  }
  showCustomCharForm.value = true
}

const triggerCustomCharUpload = () => customCharInputRef.value?.click()

const handleCustomCharImage = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => { customCharForm.value.image = e.target.result }
  reader.readAsDataURL(file)
  event.target.value = ''
}

const updateCustomCharShapes = () => {
  const count = Number(customCharForm.value.count)
  const current = customCharForm.value.shapes
  if (count > current.length) {
    for (let i = current.length; i < count; i++) current.push(HUIZHANG_SHAPES.CIRCLE)
  } else {
    customCharForm.value.shapes = current.slice(0, count)
  }
}

const saveCustomChar = () => {
  if (!customCharForm.value.image) {
    alert('请上传图片')
    return
  }
  tempCustomChar.value = {
    id: `custom_temp_${Date.now()}`,
    name: '自定义角色',
    imageUrl: customCharForm.value.image,
    qban_url: customCharForm.value.image,
    theme: customCharForm.value.theme,
    rarity: null,
    isCustom: false,
    config: {
      count: Number(customCharForm.value.count),
      shapes: [...customCharForm.value.shapes],
    },
  }
  selectedCharId.value = tempCustomChar.value.id
  showCustomCharForm.value = false
}

// 徽章摘要：合并相同稀有度+类型+等级的槽位
// 颜色从 colors.badgeRarity 取，随主题切换自动更新
const badgeRarityColors = computed(() => ({
  '0': colors.badgeRarity.empty,
  '1': colors.badgeRarity.blue,
  '2': colors.badgeRarity.purple,
  '3': colors.badgeRarity.gold,
  '4': colors.badgeRarity.red,
}))

const summarizeSlots = (slots) => {
  if (!slots?.length) return []
  const groups = new Map()
  slots.forEach((slot) => {
    if (slot.rarityId === '0') return // 跳过空槽
    const key = `${slot.rarityId}|${slot.typeId}|${slot.level}`
    if (!groups.has(key)) groups.set(key, { ...slot, count: 0 })
    groups.get(key).count++
  })
  return Array.from(groups.values())
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: v-bind('colors.background.primary');
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  color: v-bind('colors.text.primary');
}

.content-wrap {
  width: 100%;
  max-width: 1400px;
  padding: 0.5rem 0.5rem 4rem;
}

.hero-section {
  text-align: center;
  padding: 0.6rem 0 1rem;
}

.page-title {
  font-size: 1.8rem;
  color: v-bind('colors.text.primary');
  margin: 0 0 0.3rem;
}

.hero-sub {
  color: v-bind('colors.text.secondary');
  margin: 0;
  font-size: 0.9rem;
}

/* 双栏布局 */
.main-layout {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

/* 精选面板 — 宽屏：左侧固定、可滚动 */
.featured-panel {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 0.5rem;
  max-height: calc(100dvh - 1rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: v-bind('colors.scrollbar') transparent;
}

.featured-panel::-webkit-scrollbar {
  width: 4px;
}

.featured-panel::-webkit-scrollbar-track {
  background: transparent;
}

.featured-panel::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.scrollbar');
  border-radius: 2px;
}

.panel-title {
  margin-bottom: 0.6rem;
}

.section-header {
  margin-bottom: 0.6rem;
}

.section-title {
  font-size: 1.1rem;
  color: v-bind('colors.text.primary');
  margin: 0 0 0.1rem;
  padding-left: 0.6rem;
}

.section-sub {
  color: v-bind('colors.text.secondary');
  font-size: 0.82rem;
  margin: 0.1rem 0 0 0.9rem;
}

/* 角色选择面板 */
.selector-panel {
  flex: 1;
  min-width: 0;
}

/* 精选攻略列表 — 宽屏：垂直排列 */
.featured-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* 攻略卡片 */
.strategy-card {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 0.15rem;
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 12px;
  padding: 0.65rem;
  cursor: pointer;
  transition: all 0.2s;
}

.strategy-card:hover {
  border-color: v-bind('colors.brand.primary');
  box-shadow: 0 3px 12px v-bind('colors.shadow.primary');
  transform: translateY(-1px);
}

.strategy-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.card-qban {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: v-bind('colors.background.lighter');
}

.card-qban-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: v-bind('colors.background.lighter');
  flex-shrink: 0;
}

.strategy-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-char-name {
  font-size: 0.78rem;
  color: v-bind('colors.text.secondary');
}

.strategy-title-text {
  color: v-bind('colors.brand.primary');
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.strategy-author {
  color: v-bind('colors.text.tertiary');
  font-size: 0.72rem;
}

.strategy-stars {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}

.stars-label {
  color: v-bind('colors.text.tertiary');
  font-size: 0.68rem;
}

.star-chip {
  font-size: 0.68rem;
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.secondary');
  border-radius: 3px;
  padding: 1px 3px;
}

/* 徽章摘要 */
.badge-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 3px;
}

.badge-chip-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.72rem;
  font-weight: 600;
  background: v-bind('colors.background.lighter');
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
}

.badge-chip-lv {
  font-size: 0.66rem;
  font-weight: 400;
  opacity: 0.75;
}

/* 窄屏 / 竖屏：精选在上方，横向滚动 */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }

  .featured-panel {
    width: 100%;
    position: static;
    max-height: none;
    overflow-y: visible;
  }

  .featured-list {
    flex-direction: row;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 0.5rem;
    gap: 0.6rem;
    scrollbar-width: thin;
    scrollbar-color: v-bind('colors.scrollbar') transparent;
  }

  .featured-list::-webkit-scrollbar {
    height: 4px;
  }

  .featured-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .featured-list::-webkit-scrollbar-thumb {
    background-color: v-bind('colors.scrollbar');
    border-radius: 2px;
  }

  .strategy-card {
    flex-direction: column;
    align-items: stretch;
    width: 200px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  .card-qban,
  .card-qban-placeholder {
    width: 48px;
    height: 48px;
  }
}

/* 自定义角色弹窗 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: v-bind('colors.background.overlay');
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.custom-character-form {
  background-color: v-bind('colors.background.content');
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 5px 15px v-bind('colors.shadow.primary');
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 90%;
  max-width: 400px;
  border: 1px solid v-bind('colors.border.primary');
  max-height: 90vh;
  overflow-y: auto;
}

.custom-character-form h3 {
  text-align: center;
  margin: 0;
  color: v-bind('colors.text.primary');
  font-size: 1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row label {
  font-weight: bold;
  font-size: 0.85rem;
  color: v-bind('colors.text.secondary');
}

.compact-row {
  display: flex;
  gap: 10px;
}

.compact-col {
  flex: 1;
  min-width: 0;
}

.form-select {
  width: 100%;
  padding: 7px 8px;
  border-radius: 6px;
  border: 1px solid v-bind('colors.input.border');
  background: v-bind('colors.input.background');
  color: v-bind('colors.input.text');
  box-sizing: border-box;
  font-size: 0.88rem;
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.shape-item {
  display: flex;
  align-items: center;
}

.mini-shape-select {
  padding: 4px 2px;
  text-align: center;
  font-size: 0.82rem;
  min-width: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.form-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: bold;
  transition: all 0.15s;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.primary');
}

.form-btn.primary {
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  border-color: v-bind('colors.brand.primary');
}

.form-btn.primary:hover {
  background: v-bind('colors.brand.hover');
}

.form-btn.cancel {
  color: v-bind('colors.text.secondary');
}

.form-btn.cancel:hover {
  border-color: v-bind('colors.brand.primary');
}

.avatar-preview-small {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid v-bind('colors.border.primary');
  flex-shrink: 0;
}
</style>

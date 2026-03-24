<template>
  <div class="character-selection-container">
    <h2 v-if="!hideTitle" class="selection-title">{{ title }}</h2>
    <p v-if="subTitle" class="selection-description">{{ subTitle }}</p>

    <!-- 筛选栏 -->
    <div class="filter-bar"
      v-if="(!hideThemeFilter && availableThemes.length > 0) || (!hideRarityFilter && availableRarities.length > 0) || (!hideQbanToggle && hasAnyQban) || showRealNameToggle">
      <!-- 第一行：主题筛选 -->
      <div class="filter-row" v-if="!hideThemeFilter && availableThemes.length > 0">
        <div class="theme-chips">
          <button v-for="theme in availableThemes" :key="theme.id" class="filter-chip theme-chip"
            :class="{ active: activeThemeFilter === theme.id }" @click="toggleThemeFilter(theme.id)">
            <img v-if="theme.icon" :src="theme.icon" class="theme-chip-icon" :alt="theme.name" />
            <span>{{ theme.name }}</span>
          </button>
        </div>
      </div>
      <!-- 第二行：稀有度筛选 + 功能切换按钮 -->
      <div class="filter-row"
        v-if="(!hideRarityFilter && availableRarities.length > 0) || (!hideQbanToggle && hasAnyQban) || showRealNameToggle">
        <div v-if="!hideRarityFilter" class="rarity-chips">
          <button v-for="rarity in availableRarities" :key="rarity" class="filter-chip rarity-chip"
            :class="[rarity, { active: activeRarityFilter === rarity }]" @click="toggleRarityFilter(rarity)">
            {{ rarity }}
          </button>
        </div>
        <button v-if="showRealNameToggle" class="image-toggle-btn" :class="{ active: internalShowRealName }"
          @click="internalShowRealName = !internalShowRealName">
          真名
        </button>
        <button v-if="!hideQbanToggle && hasAnyQban" class="image-toggle-btn" :class="{ active: useQban }"
          @click="useQban = !useQban">
          {{ useQban ? '立绘' : 'Q版' }}
        </button>
      </div>
    </div>

    <div class="card-selector-grid">
      <div v-for="card in filteredCards" :key="card.id" :class="[
        'card-option',
        card.rarity ? card.rarity : '',
        { selected: isSelected(card.id), disabled: isDisabled(card) },
      ]" @click="toggleCharacterSelection(card)">
        <button v-if="card.isCustom" class="delete-custom-char-btn" @click.stop="deleteCustomCharacter(card.id)">
          &times;
        </button>
        <img :src="getDisplayImage(card)" :alt="card.name" class="card-image" />
        <div class="card-name">
          {{
            isDisabled(card)
              ? '暂不可用'
              : internalShowRealName && card.realname
                ? card.realname
                : card.name
          }}
        </div>
        <div class="checkmark">✔</div>
      </div>
      <div v-if="showAddCustomButton" class="card-option add-custom-btn" @click="emit('add-custom')">
        <div class="add-custom-icon">+</div>
        <div class="card-name">创建角色</div>
      </div>
    </div>
    <div v-if="activeThemeFilter || activeRarityFilter" class="filter-tips">
      Tips:再次点击可以取消筛选
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SP, SSR, SR, R } from '@/data/constant.js'
import { colors } from '@/styles/colors.js'
import { THEMES } from '@/data/constant.js'

const THEME_ORDER = ['cake', 'dream', 'elec', 'music', 'ice', 'fire', 'water', 'eiji']
const RARITY_ORDER = [SP, SSR, SR, R]

const props = defineProps({
  modelValue: {
    type: [Array, String, Number],
    default: () => [],
  },
  characterList: {
    type: Array,
    default: () => [],
  },
  customCharacters: {
    type: Array,
    default: () => [],
  },
  mode: {
    type: String,
    default: 'multiple', // single 为单选模式 multiple 为多选模式
    validator: (value) => ['single', 'multiple'].includes(value),
  },
  disabledCharacterIds: {
    type: Array,
    default: () => [],
  },
  showRealNameToggle: {
    type: Boolean,
    default: false,
  },
  showAddCustom: {
    type: Boolean,
    default: false,
  },
  addCustomAlwaysVisible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择出场的角色',
  },
  subTitle: {
    type: String,
    default: '放心，你可以随时回来重选！',
  },
  showQban: {
    type: Boolean,
    default: false,
  },
  hideTitle: {
    type: Boolean,
    default: false,
  },
  hideThemeFilter: {
    type: Boolean,
    default: false,
  },
  hideRarityFilter: {
    type: Boolean,
    default: false,
  },
  hideQbanToggle: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'update:customCharacters', 'confirm', 'add-custom'])

// 筛选状态
const activeThemeFilter = ref(null)
const activeRarityFilter = ref(null)
const useQban = ref(props.showQban)
const internalShowRealName = ref(props.showRealNameToggle)

// 自定义角色判断：根据 notInGame 或 isCustom 属性判断
const isCustomCard = (card) => !!card.notInGame || !!card.isCustom

const hasCustomCards = computed(() => props.characterList.some(isCustomCard))

const getDisplayImage = (card) => {
  if (useQban.value && card.qban_url) {
    return card.qban_url
  }
  return card.imageUrl
}

const toggleThemeFilter = (themeId) => {
  activeThemeFilter.value = activeThemeFilter.value === themeId ? null : themeId
}

const toggleRarityFilter = (rarity) => {
  activeRarityFilter.value = activeRarityFilter.value === rarity ? null : rarity
}

const availableThemes = computed(() => {
  const themeIds = new Set()
  props.characterList.forEach((card) => {
    if (!isCustomCard(card) && card.theme?.id) {
      themeIds.add(card.theme.id)
    }
  })
  const themes = THEME_ORDER.filter((id) => themeIds.has(id)).map((id) => THEMES[id])

  if (hasCustomCards.value) {
    themes.push({
      id: 'custom',
      name: '自定义',
      icon: null,
    })
  }
  return themes
})

const availableRarities = computed(() => {
  const rarities = new Set()
  props.characterList.forEach((card) => {
    if (!isCustomCard(card) && card.rarity) {
      rarities.add(card.rarity)
    }
  })
  return RARITY_ORDER.filter((r) => rarities.has(r))
})

const hasAnyQban = computed(() => {
  return props.characterList.some((card) => !isCustomCard(card) && card.qban_url)
})

const showAddCustomButton = computed(() => {
  if (!props.showAddCustom) return false
  if (props.addCustomAlwaysVisible) return true
  // 仅在无筛选或选中"自定义"主题时显示
  return !activeRarityFilter.value && (!activeThemeFilter.value || activeThemeFilter.value === 'custom')
})

const filteredCards = computed(() => {
  const filtered = props.characterList.filter((card) => {
    const isCustom = isCustomCard(card)

    // 应用主题筛选
    if (activeThemeFilter.value) {
      if (activeThemeFilter.value === 'custom') {
        if (!isCustom) return false
      } else if (card.theme?.id !== activeThemeFilter.value) return false
    }
    // 应用稀有度筛选
    if (activeRarityFilter.value && card.rarity !== activeRarityFilter.value) return false
    return true
  })

  // Sort by rarity (SP > SSR > SR > R), maintaining original order for same rarity
  return filtered.sort((a, b) => {
    const rarityA = RARITY_ORDER.indexOf(a.rarity)
    const rarityB = RARITY_ORDER.indexOf(b.rarity)
    const orderA = rarityA === -1 ? RARITY_ORDER.length : rarityA
    const orderB = rarityB === -1 ? RARITY_ORDER.length : rarityB
    return orderA - orderB
  })
})

const isSelected = (id) => {
  if (props.mode === 'single') {
    return props.modelValue === id
  }
  return Array.isArray(props.modelValue) && props.modelValue.includes(id)
}

const isDisabled = (card) => {
  return props.disabledCharacterIds.includes(card.id)
}

const toggleCharacterSelection = (card) => {
  if (isDisabled(card)) return

  if (props.mode === 'single') {
    emit('update:modelValue', card.id)
    emit('confirm')
  } else {
    const currentSelection = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = currentSelection.indexOf(card.id)
    if (index > -1) {
      currentSelection.splice(index, 1)
    } else {
      currentSelection.push(card.id)
    }
    emit('update:modelValue', currentSelection)
  }
}

const deleteCustomCharacter = (characterId) => {
  if (window.confirm('确定要删除这个自定义角色吗？')) {
    const index = props.customCharacters.findIndex((c) => c.id === characterId)
    if (index > -1) {
      const newCustoms = [...props.customCharacters]
      newCustoms.splice(index, 1)
      emit('update:customCharacters', newCustoms)

      // Remove from selection if present
      if (isSelected(characterId)) {
        if (props.mode === 'single') {
          emit('update:modelValue', null)
        } else {
          const newSelection = props.modelValue.filter((id) => id !== characterId)
          emit('update:modelValue', newSelection)
        }
      }
    }
  }
}
</script>

<style scoped>
.character-selection-container {
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  padding: 1rem 1rem;
  border-radius: 12px;
  margin-bottom: 20px;
  max-width: 800px;
  margin: auto;
}

.selection-title {
  margin: 0;
  font-size: 1.8rem;
  text-align: center;
  color: v-bind('colors.text.primary');
}

.selection-description {
  text-align: center;
  color: v-bind('colors.text.secondary');
  margin: 0rem;
}

/* 筛选栏 */
.filter-bar {
  margin: 0.5rem 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.theme-chips,
.rarity-chips {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 20px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.background.light');
  color: v-bind('colors.text.primary');
  cursor: pointer;
  font-size: 0.75rem;
  white-space: nowrap;
  transition: all 0.15s;
}

.theme-chip-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.filter-chip:hover {
  border-color: v-bind('colors.brand.primary');
  background: v-bind('colors.shadow.primaryHover');
}

.filter-chip.active {
  background: v-bind('colors.brand.primary');
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  font-weight: bold;
}

/* 稀有度筛选激活颜色 */
.rarity-chip.SP.active {
  background: v-bind('colors.rarity.sp');
  border-color: v-bind('colors.rarity.sp');
  color: white;
}

.rarity-chip.SSR.active {
  background: v-bind('colors.rarity.ssr');
  border-color: v-bind('colors.rarity.ssr');
  color: white;
}

.rarity-chip.SR.active {
  background: v-bind('colors.rarity.sr');
  border-color: v-bind('colors.rarity.sr');
  color: white;
}

.rarity-chip.R.active {
  background: v-bind('colors.rarity.r');
  border-color: v-bind('colors.rarity.r');
  color: white;
}

/* 图片切换按钮 */
.image-toggle-btn {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.background.light');
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.78rem;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}

.image-toggle-btn.active {
  background: v-bind('colors.brand.primary');
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  font-weight: bold;
}

.card-selector-grid {
  margin-top: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4.2rem, 1fr));
  gap: 0.8rem;
  justify-content: center;
}

.card-option {
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  background-color: v-bind('colors.background.light');
}

.card-option.SP>.card-image {
  background: linear-gradient(180deg, v-bind('colors.rarity.sp'), v-bind('colors.rarity.ssr'));
}

.card-option.SSR>.card-image {
  background-color: v-bind('colors.rarity.ssr');
}

.card-option.SR>.card-image {
  background-color: v-bind('colors.rarity.sr');
}

.card-option.R>.card-image {
  background-color: v-bind('colors.rarity.r');
}

.card-option:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px v-bind('colors.shadow.primary');
}

.card-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-option.disabled:hover {
  transform: none;
  box-shadow: none;
}

.card-option .card-image {
  width: 100%;
  display: block;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.card-option .card-name {
  font-size: 0.75rem;
  text-align: center;
  background: v-bind('colors.shadow.primaryHover');
  backdrop-filter: blur(2px);
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  color: v-bind('colors.text.white');
}

.card-option .checkmark {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.primary');
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s;
}

.card-option.selected {
  border-color: v-bind('colors.brand.primary');
}

.card-option.selected .checkmark {
  opacity: 1;
  transform: scale(1);
}

.delete-custom-char-btn {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: v-bind('colors.brand.cancel');
  color: white;
  border: 1px solid white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 0;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-option:hover .delete-custom-char-btn {
  opacity: 1;
}

.add-custom-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 4.2rem;
  border: 2px dashed v-bind('colors.border.primary');
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-custom-btn:hover {
  border-color: v-bind('colors.brand.primary');
  background: v-bind('colors.shadow.primaryHover');
  transform: translateY(-4px);
  box-shadow: 0 4px 12px v-bind('colors.shadow.primary');
}

.add-custom-icon {
  font-size: 1.8rem;
  line-height: 1;
  color: v-bind('colors.text.secondary');
  padding-bottom: 0.5rem;
}

.add-custom-btn:hover .add-custom-icon {
  color: v-bind('colors.brand.primary');
}

.add-custom-btn .card-name {
  position: static;
  background: none;
  backdrop-filter: none;
  color: v-bind('colors.text.secondary');
  padding: 0 0 0.3rem 0;
}

.add-custom-btn:hover .card-name {
  color: v-bind('colors.brand.primary');
}

.filter-tips {
  text-align: center;
  font-size: 0.8rem;
  color: v-bind('colors.text.tertiary');
  margin-top: 10px;
}
</style>

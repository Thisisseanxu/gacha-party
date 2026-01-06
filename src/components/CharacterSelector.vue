<template>
  <div class="character-selection-container">
    <h2 class="selection-title">{{ title }}</h2>
    <p v-if="subTitle" class="selection-description">{{ subTitle }}</p>

    <div class="card-selector-grid">
      <div v-for="card in filteredCards" :key="card.id"
        :class="['card-option', card.rarity ? card.rarity : '', { selected: isSelected(card.id), disabled: isDisabled(card) }]"
        @click="toggleCharacterSelection(card)">
        <button v-if="card.isCustom" class="delete-custom-char-btn"
          @click.stop="deleteCustomCharacter(card.id)">×</button>
        <img :src="card.imageUrl" :alt="card.name" class="card-image" />
        <div class="card-name">
          {{ isDisabled(card) ? '暂不可用' : (showRealName && card.realname ? card.realname : card.name) }}
        </div>
        <div class="checkmark">✔</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { colors } from '@/styles/colors.js';

const props = defineProps({
  modelValue: {
    type: [Array, String, Number],
    default: () => []
  },
  characterList: {
    type: Array,
    default: () => []
  },
  customCharacters: {
    type: Array,
    default: () => []
  },
  mode: {
    type: String,
    default: 'multiple', // single 为单选模式 multiple 为多选模式
    validator: (value) => ['single', 'multiple'].includes(value)
  },
  disabledCharacterIds: {
    type: Array,
    default: () => []
  },
  showRealName: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '选择出场的角色'
  },
  subTitle: {
    type: String,
    default: '放心，你可以随时回来重选！'
  }
});

const emit = defineEmits(['update:modelValue', 'update:customCharacters', 'confirm']);

const filteredCards = computed(() => {
  return props.characterList;
});

const isSelected = (id) => {
  if (props.mode === 'single') {
    return props.modelValue === id;
  }
  return Array.isArray(props.modelValue) && props.modelValue.includes(id);
};

const isDisabled = (card) => {
  return props.disabledCharacterIds.includes(card.id);
};

const toggleCharacterSelection = (card) => {
  if (isDisabled(card)) return;

  if (props.mode === 'single') {
    emit('update:modelValue', card.id);
    emit('confirm');
  } else {
    const currentSelection = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentSelection.indexOf(card.id);
    if (index > -1) {
      currentSelection.splice(index, 1);
    } else {
      currentSelection.push(card.id);
    }
    emit('update:modelValue', currentSelection);
  }
};

const deleteCustomCharacter = (characterId) => {
  if (window.confirm('确定要删除这个自定义角色吗？')) {
    const index = props.customCharacters.findIndex(c => c.id === characterId);
    if (index > -1) {
      const newCustoms = [...props.customCharacters];
      newCustoms.splice(index, 1);
      emit('update:customCharacters', newCustoms);

      // Remove from selection if present
      if (isSelected(characterId)) {
        if (props.mode === 'single') {
          emit('update:modelValue', null);
        } else {
          const newSelection = props.modelValue.filter(id => id !== characterId);
          emit('update:modelValue', newSelection);
        }
      }
    }
  }
};
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
  margin: 0rem
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
  color: v-bind('colors.text.primary');
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
</style>

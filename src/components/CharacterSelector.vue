<template>
  <div class="character-selection-container">
    <h2 class="selection-title">{{ title }}</h2>
    <p v-if="subTitle" class="selection-description">{{ subTitle }}</p>

    <div class="selection-toolbar">
      <button v-if="showCustom" @click="openCustomCharacterForm" class="action-button create-char-btn">创建新角色</button>
      <SwitchComponent v-if="allowRealNameToggle" v-model="showRealName" label="显示角色真名" />
    </div>

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

    <button v-if="mode !== 'single'" @click="confirmSelection" class="finalize-button" :disabled="!canConfirm">
      {{ confirmText }}
    </button>

    <div v-if="showCustomCharacterForm" class="overlay" @click="closeCustomCharacterForm">
      <div class="custom-character-form" @click.stop>
        <h3>创建自定义角色</h3>
        <div class="form-row">
          <label for="char-name">角色名称</label>
          <input id="char-name" type="text" v-model="newCustomCharacterName" placeholder="输入角色名字" />
        </div>
        <div class="form-row">
          <label>角色头像</label>
          <button @click="triggerCustomAvatarUpload" class="action-button">上传图片</button>
          <input type="file" ref="customAvatarInputRef" @change="handleCustomAvatarSelected" accept="image/*"
            style="display: none;" />
        </div>
        <div v-if="newCustomCharacterAvatar" class="avatar-preview-container">
          <p>头像预览：</p>
          <img :src="newCustomCharacterAvatar" alt="头像预览" class="avatar-preview" />
        </div>
        <div class="form-actions">
          <button @click="saveCustomCharacter" class="action-button">保存角色</button>
          <button @click="closeCustomCharacterForm" class="action-button cancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { colors } from '@/styles/colors.js';
import SwitchComponent from '@/components/SwitchComponent.vue';

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
  showCustom: {
    type: Boolean,
    default: true
  },
  confirmText: {
    type: String,
    default: '开始创作'
  },
  disabledCharacterIds: {
    type: Array,
    default: () => []
  },
  allowRealNameToggle: {
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

const showRealName = ref(false);

// Custom Character Logic
const showCustomCharacterForm = ref(false);
const newCustomCharacterName = ref('');
const newCustomCharacterAvatar = ref(null);
const customAvatarInputRef = ref(null);

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

const canConfirm = computed(() => {
  if (props.mode === 'single') {
    return !!props.modelValue;
  }
  return Array.isArray(props.modelValue) && props.modelValue.length > 0;
});

const confirmSelection = () => {
  if (canConfirm.value) {
    emit('confirm');
  }
};

// 自定义角色功能
const openCustomCharacterForm = () => {
  showCustomCharacterForm.value = true;
};

const closeCustomCharacterForm = () => {
  showCustomCharacterForm.value = false;
  newCustomCharacterName.value = '';
  newCustomCharacterAvatar.value = null;
};

const triggerCustomAvatarUpload = () => {
  customAvatarInputRef.value?.click();
};

const handleCustomAvatarSelected = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    newCustomCharacterAvatar.value = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
};

const saveCustomCharacter = () => {
  if (!newCustomCharacterName.value.trim() || !newCustomCharacterAvatar.value) {
    alert('请输入角色名称并上传头像。');
    return;
  }
  const newChar = {
    id: `custom_${Date.now()}`,
    name: newCustomCharacterName.value.trim(),
    imageUrl: newCustomCharacterAvatar.value,
  };
  const newCustoms = [...props.customCharacters, newChar];
  emit('update:customCharacters', newCustoms);
  closeCustomCharacterForm();
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
  margin: 0rem;
  font-size: 1.8rem;
  text-align: center;
  color: v-bind('colors.text.primary');
}

.selection-description {
  text-align: center;
  color: v-bind('colors.text.secondary');
  margin: 0rem
}

.selection-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card-selector-grid {
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
  font-size: 0.8rem;
  text-align: center;
  padding: 2px;
  background: v-bind('colors.background.light');
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

.finalize-button {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: bold;
  border: none;
  margin-top: 1rem;
  padding: 0.5rem;
  width: 100%;
  font-size: 1.2rem;
  background-color: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
}

.finalize-button:hover {
  background-color: v-bind('colors.brand.hover');
}

.finalize-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-char-btn {
  background-color: v-bind('colors.brand.confirm');
  color: white;
  border-color: v-bind('colors.brand.confirm');
}

.create-char-btn:hover {
  background-color: v-bind('colors.brand.confirmHover');
  color: white;
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

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.custom-character-form {
  background-color: v-bind('colors.background.content');
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 90%;
  max-width: 400px;
  border: 1px solid v-bind('colors.border.primary');
}

.custom-character-form h3 {
  text-align: center;
  margin-top: 0;
  color: v-bind('colors.text.primary');
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row label {
  font-weight: bold;
  font-size: 0.9em;
  color: v-bind('colors.text.secondary');
}

.form-row input[type="text"] {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  font-size: 1em;
  box-sizing: border-box;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
}

.avatar-preview-container {
  text-align: center;
}

.avatar-preview {
  max-width: 100px;
  max-height: 100px;
  border-radius: 8px;
  border: 2px solid v-bind('colors.border.primary');
  margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.form-actions .action-button {
  flex-grow: 1;
}

.form-actions .action-button.cancel {
  background-color: v-bind('colors.button.secondaryBg');
  border-color: v-bind('colors.button.secondaryBg');
  color: v-bind('colors.button.secondaryText');
}

.form-actions .action-button.cancel:hover {
  filter: brightness(0.9);
}

.action-button {
  padding: 8px 16px;
  border: 1px solid v-bind('colors.button.defaultBg');
  background-color: v-bind('colors.button.defaultBg');
  color: v-bind('colors.button.defaultText');
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: v-bind('colors.button.hoverBg');
  color: v-bind('colors.button.hoverText');
}
</style>

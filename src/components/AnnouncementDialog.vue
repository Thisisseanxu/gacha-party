<template>
  <PopUp
    :display="Boolean(announcement)"
    :title="announcement?.title || '公告'"
    class="announcement-dialog"
    @close="$emit('close')"
  >
    <div class="announcement-body">
      <div v-if="total > 1" class="announcement-count">{{ index + 1 }} / {{ total }}</div>
      <p v-for="(paragraph, index) in paragraphs" :key="index" class="announcement-paragraph">
        {{ paragraph }}
      </p>
      <button class="announcement-confirm" type="button" @click="$emit('close')">
        {{ isLast ? '确定' : '下一条' }}
      </button>
    </div>
  </PopUp>
</template>

<script setup>
import { computed } from 'vue'
import PopUp from './PopUp.vue'
import { colors } from '@/styles/colors.js'

const props = defineProps({
  announcement: {
    type: Object,
    default: null,
  },
  index: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
})

defineEmits(['close'])

const paragraphs = computed(() => {
  const content = props.announcement?.content || ''
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
})

const isLast = computed(() => props.index >= props.total - 1)
</script>

<style scoped>
.announcement-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.75rem 1rem 1rem;
  text-align: left;
}

.announcement-paragraph {
  margin: 0;
  color: v-bind('colors.text.secondary');
  font-size: 0.98rem;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.announcement-count {
  align-self: flex-end;
  color: v-bind('colors.text.tertiary');
  font-size: 0.85rem;
}

.announcement-confirm {
  align-self: flex-end;
  min-width: 96px;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  background: v-bind('colors.brand.confirm');
  color: v-bind('colors.text.white');
  font-weight: 700;
  cursor: pointer;
}

.announcement-confirm:hover {
  background: v-bind('colors.brand.confirmHover');
}

.announcement-confirm:active {
  transform: scale(0.98);
}

:global(.announcement-dialog .share-modal-content) {
  max-width: 560px;
}

@media (max-width: 520px) {
  .announcement-confirm {
    width: 100%;
  }
}
</style>

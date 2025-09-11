<template>
  <transition name="modal-fade">
    <div v-if="display" class="share-modal-overlay" @click.self="close">
      <div class="share-modal-content card">
        <button @click="close" class="close-modal-button">&times;</button>

        <h2 v-if="title">{{ title }}</h2>

        <slot></slot>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { colors } from '@/styles/colors.js';
defineProps({
  display: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

const close = () => {
  // 通知父组件关闭弹窗
  emit('close');
};
</script>

<style scoped>
.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: v-bind('colors.shadow.primary');
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(5px);
}

.share-modal-content {
  position: relative;
  text-align: center;
  padding: 0.5rem;
  padding-top: 3rem;
  width: 90%;
  max-width: 380px;
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 12px;
}

.share-modal-content h2 {
  margin: 0;
  color: v-bind('colors.text.primary');
}

.share-modal-content p {
  color: v-bind('colors.text.secondary');
}

.close-modal-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: v-bind('colors.text.tertiary');
  cursor: pointer;
  padding: 0;
}

.close-modal-button:hover {
  color: v-bind('colors.text.primary');
}

/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

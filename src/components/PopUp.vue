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
// 定义组件接收的属性 (Props) 和发出的事件 (Emits)
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
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(5px);
}

.share-modal-content {
  position: relative;
  text-align: center;
  padding: 2rem;
  padding-top: 3rem;
  width: 90%;
  max-width: 380px;
  /* 从父组件继承 card 样式，或者在这里定义背景色等 */
  background-color: #2c2c3e;
  /* 示例背景色 */
  border: 1px solid #4a4a6a;
  border-radius: 12px;
}

.share-modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #f0f0f0;
  /* 示例文字颜色 */
}

.close-modal-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #888;
  cursor: pointer;
  padding: 0;
}

.close-modal-button:hover {
  color: #fff;
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

<template>
  <div class="switch-wrapper" @click="toggle">
    <label v-if="label" class="switch-label">{{ label }}</label>

    <div class="switch-container" :class="{ 'is-active': modelValue }">
      <div class="switch-handle"></div>
    </div>
  </div>
</template>

<script setup>
import { colors } from '@/styles/colors.js';

const props = defineProps({
  // 控制开关状态
  modelValue: {
    type: Boolean,
    required: true,
  },
  // 左侧的文本标签
  label: {
    type: String,
    default: '', // 默认为空
  },
});

// 声明状态变化事件
const emit = defineEmits(['update:modelValue']);

// 点击时反转状态
function toggle() {
  emit('update:modelValue', !props.modelValue);
}

const colorTextSecondary = colors.text.secondary;

</script>

<style scoped>
.switch-wrapper {
  display: inline-flex;
  align-items: center;
  /* 鼠标悬浮时改变光标样式 */
  cursor: pointer;
  /* 防止用户选中文字 */
  user-select: none;
  /* 标签和开关之间的间距 */
  gap: 8px;
}

.switch-label {
  font-size: 14px;
  color: v-bind(colorTextSecondary);
}

.switch-container {
  width: 44px;
  height: 22px;
  border-radius: 11px;
  /* 关闭时的背景色 */
  background-color: #dcdfe6;
  position: relative;
  /* 背景色变化的过渡动画 */
  transition: background-color 0.3s ease;
}

.switch-handle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #ffffff;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
  /* 滑块移动的过渡动画 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 当开关处于激活状态时的样式 */
.switch-container.is-active {
  /* 激活时的背景色 (蓝色) */
  background-color: #409eff;
}

.switch-container.is-active .switch-handle {
  /* 激活时使用 transform 将滑块向右移动 */
  transform: translateX(22px);
}
</style>

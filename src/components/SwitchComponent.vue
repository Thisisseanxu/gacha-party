<template>
  <div class="switch-wrapper" @click="toggle">
    <label v-if="label" class="switch-label">{{ label }}</label>

    <div class="switch-container" :class="{ 'is-active': modelValue }">
      <div class="switch-handle"></div>
    </div>
  </div>
</template>

<script setup>
// --- Props 定义 ---
// defineProps 用于接收父组件传递过来的数据
const props = defineProps({
  // modelValue 是 v-model 的标准 prop 名称
  // 它接收一个布尔值来控制开关状态
  modelValue: {
    type: Boolean,
    required: true,
  },
  // label prop 用于接收左侧的文本标签
  label: {
    type: String,
    default: '', // 默认为空字符串
  },
});

// --- Emits 定义 ---
// defineEmits 用于声明该组件会触发哪些事件
// 'update:modelValue' 是 v-model 的标准事件名称
const emit = defineEmits(['update:modelValue']);

// --- 方法 ---
// 当用户点击组件时，调用此函数
function toggle() {
  // 触发 update:modelValue 事件，并传递相反的布尔值
  // 这会通知父组件更新绑定的 ref
  emit('update:modelValue', !props.modelValue);
}

</script>

<style scoped>
/* 使用 scoped 以确保样式只作用于当前组件 */
.switch-wrapper {
  display: inline-flex;
  /* 使用 flex 布局方便对齐 */
  align-items: center;
  cursor: pointer;
  /* 鼠标悬浮时显示为手型 */
  user-select: none;
  /* 防止用户选中文字 */
  gap: 8px;
  /* 标签和开关之间的间距 */
}

.switch-label {
  font-size: 14px;
  color: #333;
}

.switch-container {
  width: 44px;
  height: 22px;
  border-radius: 11px;
  background-color: #dcdfe6;
  /* 关闭时的背景色 */
  position: relative;
  transition: background-color 0.3s ease;
  /* 背景色变化的过渡动画 */
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
  background-color: #409eff;
  /* 激活时的背景色 (蓝色) */
}

.switch-container.is-active .switch-handle {
  /* 使用 transform 将滑块向右移动 */
  transform: translateX(22px);
}
</style>

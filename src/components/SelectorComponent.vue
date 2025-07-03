<template>
  <div class="custom-select-wrapper" ref="selectRef">
    <div class="select-trigger" @click="toggleDropdown">
      <slot name="trigger"></slot>
      <span class="arrow-indicator" :class="{ 'is-open': isOpen }"></span>
    </div>

    <div v-if="isOpen" class="options-dropdown">
      <ul>
        <li v-for="option in options" :key="option[optionValueKey]" @click="selectOption(option)"
          :class="{ 'is-selected': modelValue === option[optionValueKey] }">
          {{ option[optionTextKey] }}
        </li>
      </ul>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { colors } from '@/styles/colors.js'; // 引入颜色常量

const props = defineProps({
  // 用于 v-model 绑定，存储当前选中的值
  modelValue: {
    type: [String, Number],
    default: '',
  },
  // 选项数组，例如: [{text: '限定扭蛋', value: 'Limit'}, {text: '车手盲盒机', value: 29}]
  options: {
    type: Array,
    required: true,
  },
  // 选项对象中，用作显示文本的键名
  optionTextKey: {
    type: String,
    default: 'text',
  },
  // 选项对象中，用作实际值的键名
  optionValueKey: {
    type: String,
    default: 'value',
  },
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false); // 控制下拉框是否显示
const selectRef = ref(null); // 获取组件根元素的引用

// 控制下拉是否显示
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectOption = (option) => {
  // 使用 emit 更新 v-model 的值
  emit('update:modelValue', option[props.optionValueKey]);
  // 选择后关闭下拉框
  closeDropdown();
};

// 处理点击组件外部时自动关闭下拉框的逻辑
const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  // 组件挂载后，添加全局点击事件监听
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  // 组件卸载前，移除事件监听，防止内存泄漏
  document.removeEventListener('click', handleClickOutside);
});

const colorTriggerHover = colors.background.lighter;
const colorArrow = colors.text.secondary;

const colorDropdownBg = colors.background.light;
const colorDropdownBorder = colors.background.lighter;

const colorOptionText = colors.text.secondary;
const colorOptionTextHover = colors.text.primary;
const colorOptionHoverBg = colors.background.hover;

const colorSelectedText = colors.brand.primary;
// 派生一个带透明度的背景色
const colorSelectedBg = colors.brand.primary.replace('1)', '0.15)');

const colorScrollbar = colors.scrollbar;
</script>

<style scoped>
.custom-select-wrapper {
  /* 相对定位，确保下拉框绝对位置的正确性 */
  position: relative;
  /* 宽度由内容决定 */
  width: fit-content;
  cursor: pointer;
  /* 防止文本被选中 */
  user-select: none;
}

/* 触发器样式 */
.select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

/* 添加一个轻微的悬停效果，告知用户这里可以点击 */
.select-trigger:hover {
  background-color: v-bind(colorTriggerHover);
}

/* 箭头标识 */
.arrow-indicator {
  display: inline-block;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid v-bind(colorArrow);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

/* 展开时箭头旋转 */
.arrow-indicator.is-open {
  transform: rotate(180deg);
}

/* 下拉框容器 */
.options-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  background-color: v-bind(colorDropdownBg);
  border: 1px solid v-bind(colorDropdownBorder);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;

  /* 限定最大高度，超出部分可滚动 */
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;
}

/* 选项列表 */
.options-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 单个选项 */
.options-dropdown li {
  padding: 10px 12px;
  transition: background-color 0.2s;
  border-radius: 4px;
  white-space: nowrap;
  color: v-bind(colorOptionText);
}

.options-dropdown li:hover {
  background-color: v-bind(colorOptionHoverBg);
  color: v-bind(colorOptionTextHover);
}

/* 当前选中的选项高亮 */
.options-dropdown li.is-selected {
  color: v-bind(colorSelectedText);
  background-color: v-bind(colorSelectedBg);
  font-weight: bold;
}

/* 滚动条 */
.options-dropdown::-webkit-scrollbar {
  width: 8px;
}

.options-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.options-dropdown::-webkit-scrollbar-thumb {
  background-color: v-bind(colorScrollbar);
  border-radius: 4px;
  /* 使用下拉框背景色作为边框，制造间距感 */
  border: 2px solid v-bind(colorDropdownBg);
}

.options-dropdown::-webkit-scrollbar-thumb:hover {
  /* 悬浮时使用一个更亮的颜色 */
  background-color: v-bind(colorTriggerHover);
}
</style>

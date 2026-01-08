<template>
  <div class="custom-select-wrapper" ref="selectRef">
    <div class="select-trigger" @click="toggleDropdown">
      <slot name="trigger"></slot>
      <span class="arrow-indicator" :class="{ 'is-open': isOpen }"></span>
    </div>

    <div v-if="isOpen" class="options-dropdown">
      <ul v-if="!collapsible">
        <li v-for="option in options" :key="option[optionValueKey]">
          <div v-if="option[optionValueKey] !== '---'" @click="selectOption(option)"
            :class="{ 'is-selected': modelValue === option[optionValueKey] }">
            {{ option[optionTextKey] }}
          </div>
          <div v-else class="option-divider">
            <hr />
            <span>{{ option[optionTextKey] }}</span>
            <hr />
          </div>
        </li>
      </ul>
      <ul v-else>
        <template v-for="(group, index) in groupedOptions" :key="index">
          <!-- 如果是顶级分组，直接渲染选项 -->
          <template v-if="group.isUngrouped">
            <li v-for="option in group.options" :key="option[optionValueKey]" @click="selectOption(option)"
              :class="{ 'is-selected': modelValue === option[optionValueKey] }">
              <div>{{ option[optionTextKey] }}</div>
            </li>
          </template>
          <!-- 否则，渲染可折叠的分组 -->
          <template v-else>
            <li class="option-divider" @click="toggleGroup(group.name)">
              <span>{{ group.name }}</span>
              <span class="group-arrow-indicator" :class="{ 'is-open': expandedGroups[group.name] }"></span>
            </li>
            <template v-if="expandedGroups[group.name]">
              <li v-for="option in group.options" :key="option[optionValueKey]" @click="selectOption(option)"
                :class="{ 'is-selected': modelValue === option[optionValueKey] }">
                <div>{{ option[optionTextKey] }}</div>
              </li>
            </template>
          </template>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { colors } from '@/styles/colors.js' // 引入颜色常量

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
  // 是否开启折叠分组功能
  collapsible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false) // 控制下拉框是否显示
const selectRef = ref(null) // 获取组件根元素的引用
const expandedGroups = ref({}) // 追踪折叠分组的展开状态

// 如果开启了折叠功能，则对选项进行分组
const groupedOptions = computed(() => {
  if (!props.collapsible) return []

  const firstSeparatorIndex = props.options.findIndex((opt) => opt[props.optionValueKey] === '---')

  // 如果没有分隔符，所有选项都在一个默认展开的组里
  if (firstSeparatorIndex === -1) {
    return [{ name: 'ungrouped', options: props.options, isUngrouped: true }]
  }

  const groups = []
  let currentGroup = null

  // 第一个分隔符之前的内容作为顶级分组
  const topLevelOptions = props.options.slice(0, firstSeparatorIndex)
  if (topLevelOptions.length > 0) {
    groups.push({ name: 'ungrouped', options: topLevelOptions, isUngrouped: true })
  }

  // 后续内容按分隔符分组
  props.options.forEach((option) => {
    if (option[props.optionValueKey] === '---') {
      currentGroup = { name: option[props.optionTextKey], options: [] }
      groups.push(currentGroup)
    } else if (currentGroup && !groups.find((g) => g.isUngrouped && g.options.includes(option))) {
      currentGroup.options.push(option)
    }
  })

  return groups
})

// 将第一个可以展开的分组默认展开
if (props.collapsible) {
  const firstGroup = groupedOptions.value.find((g) => !g.isUngrouped)
  if (firstGroup) {
    expandedGroups.value[firstGroup.name] = true
  }
}

// 切换分组的展开/收起状态
const toggleGroup = (groupName) => {
  expandedGroups.value[groupName] = !expandedGroups.value[groupName]
}

// 控制下拉是否显示
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectOption = (option) => {
  // 使用 emit 更新 v-model 的值
  emit('update:modelValue', option[props.optionValueKey])
  // 选择后关闭下拉框
  closeDropdown()
}

// 处理点击组件外部时自动关闭下拉框的逻辑
const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  // 组件挂载后，添加全局点击事件监听
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  // 组件卸载前，移除事件监听
  document.removeEventListener('click', handleClickOutside)
})

const colorTriggerHover = colors.background.lighter
const colorArrow = colors.text.secondary

const colorDropdownBg = colors.background.light
const colorDropdownBorder = colors.background.lighter

const colorOptionText = colors.text.secondary
const colorOptionTextHover = colors.text.primary
const colorOptionHoverBg = colors.background.hover

const colorScrollbar = colors.scrollbar
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
  border-radius: 6px;
  transition: background-color 0.2s;
}

/* 悬停效果 */
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
  font-size: 1.1rem;

  /* 限定最大高度，超出部分可滚动 */
  max-height: 250px;
  overflow-y: auto;
  padding: 2px 0 2px 2px;
  /* 禁止横向滚动 */
  overflow-x: hidden;
}

/* 选项列表 */
.options-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 单个选项 */
.options-dropdown li {
  transition: background-color 0.2s;
  border-radius: 4px;
  white-space: nowrap;
  color: v-bind(colorOptionText);
}

.options-dropdown li>div {
  padding: 2px 2px;
}

.options-dropdown li:not(.option-divider):hover {
  background-color: v-bind(colorOptionHoverBg);
  color: v-bind(colorOptionTextHover);
}

.option-divider:hover {
  background-color: v-bind(colorOptionHoverBg);
  color: v-bind(colorOptionTextHover);
}

/* 当前选中的选项高亮 */
.options-dropdown li.is-selected {
  color: v-bind('colors.brand.primary');
  background-color: v-bind('colors.brand.primaryBackground');
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

.option-divider {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: v-bind(colorOptionText);
  font-size: 1rem;
}

/* 分组标题的箭头 */
.group-arrow-indicator {
  display: inline-block;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid v-bind(colorArrow);
  transition: transform 0.3s ease;
  flex-shrink: 0;
  margin-left: 4px;
}

/* 展开时箭头旋转 */
.group-arrow-indicator.is-open {
  transform: rotate(180deg);
}
</style>

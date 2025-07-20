<template>
  <div v-if="title" class="player-title" :style="titleStyle">
    {{ title }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定义组件接收的 props
const props = defineProps({
  // 称号映射表
  titleMap: {
    type: Object,
    required: true,
  },
  // 用于计算称号的数值
  value: {
    type: Number,
    required: true,
  }
});

// 计算当前应显示的成就对象
const achievement = computed(() => {
  // 如果传入的数值无效，则不显示任何内容
  if (props.value === null || props.value === undefined || props.value <= 0) {
    return null;
  }

  // 将映射表的键转换为数字并升序排列
  const sortedKeys = Object.keys(props.titleMap).map(Number).sort((a, b) => a - b);

  // 遍历查找第一个大于等于当前数值的阈值
  for (const key of sortedKeys) {
    if (props.value <= key) {
      // 返回对应的成就信息
      return props.titleMap[key];
    }
  }

  // 如果数值超过所有阈值，则不显示
  return null;
});

// 计算要显示的标题文本
const title = computed(() => achievement.value?.title);

// 计算组件的动态样式（背景和文字颜色）
const titleStyle = computed(() => {
  if (!achievement.value) {
    return {};
  }
  return {
    backgroundColor: achievement.value.background,
    color: achievement.value.text_color || 'white', // 如果没有提供文字颜色，默认为白色
  };
});
</script>

<style scoped>
.player-title {
  padding: 8px 8px;
  /* 圆角矩形 */
  border-radius: 9px;
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 6em;
  text-align: center;
  /* 防止内部文字换行 */
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  /* 当父容器为flex时，防止自身被压缩 */
  flex-shrink: 0;
}
</style>

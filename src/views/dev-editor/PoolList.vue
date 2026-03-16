<template>
  <div class="active-pool-list">
    <div v-for="id in ids" :key="id" class="active-pool-row">
      <span class="pool-id">{{ id }}</span>
      <span v-if="nameMap[id]" class="pool-name">{{ nameMap[id] }}</span>
      <span v-else class="no-name-warn">⚠ 无名称</span>
      <button v-if="!readonly" class="de-btn small danger" @click="$emit('remove', id)">移除</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  ids: { type: Array, default: () => [] },
  nameMap: { type: Object, default: () => ({}) },
  readonly: { type: Boolean, default: false },
})
defineEmits(['remove'])
</script>

<style scoped>
.active-pool-list {
  overflow-y: auto;
}
</style>

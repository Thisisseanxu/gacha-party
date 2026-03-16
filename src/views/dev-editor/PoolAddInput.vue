<template>
  <div class="pai-row">
    <template v-if="options.length">
      <select v-model="val" class="de-select pai-select">
        <option value="">— 选择未分类卡池 —</option>
        <option v-for="o in options" :key="o.id" :value="o.id">
          {{ o.id }}{{ o.name ? ` · ${o.name}` : '' }}
        </option>
      </select>
    </template>
    <template v-else>
      <input v-model="val" class="de-input pai-select" placeholder="卡池 ID…" @keydown.enter="add" />
    </template>
    <button class="de-btn primary small pai-btn" @click="add">+</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  options: { type: Array, default: () => [] },
})

const emit = defineEmits(['add'])
const val = ref('')

function add() {
  const v = val.value.trim()
  if (v) {
    emit('add', v)
    val.value = ''
  }
}
</script>

<style scoped>
.pai-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}
.pai-select {
  flex: 1;
  min-width: 0;
}
.pai-btn {
  white-space: nowrap;
  flex-shrink: 0;
}
</style>

<template>
  <div>
    <table class="kv-table">
      <thead>
        <tr>
          <th style="width: 70px;">ID (key)</th>
          <th>名称 (value)</th>
          <th style="width: 60px;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="idx">
          <td>
            <input v-model="row.key" class="de-input" @input="emitChange" />
          </td>
          <td>
            <input v-model="row.val" class="de-input" @input="emitChange" />
          </td>
          <td>
            <button class="de-btn small danger" @click="removeRow(idx)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="de-btn small" style="margin-top: 6px;" @click="addRow">+ 新增行</button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ modelValue: { type: Object, default: () => ({}) } })
const emit = defineEmits(['update:modelValue'])

const rows = ref(Object.entries(props.modelValue ?? {}).map(([key, val]) => ({ key, val })))

// Only reset on reference change (e.g., full reload) — NOT on in-place mutations
watch(
  () => props.modelValue,
  (v) => {
    rows.value = Object.entries(v ?? {}).map(([key, val]) => ({ key, val }))
  },
)

function emitChange() {
  const obj = {}
  for (const row of rows.value) {
    if (row.key !== '') obj[row.key] = row.val
  }
  emit('update:modelValue', obj)
}

function addRow() {
  rows.value.push({ key: '', val: '' })
  emitChange()
}

function removeRow(idx) {
  rows.value.splice(idx, 1)
  emitChange()
}

// Called externally to append a row without going through the watch cycle
function appendRow(key, val) {
  rows.value.push({ key, val })
  emitChange()
}

defineExpose({ appendRow })
</script>

<style scoped>
/* KvTable */
</style>

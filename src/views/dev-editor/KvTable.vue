<template>
  <div>
    <table class="kv-table">
      <thead>
        <tr>
          <th style="width: 70px">ID (key)</th>
          <th>名称 (value)</th>
          <th style="width: 60px"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
          :style="
            highlightColors[row.val]
              ? {
                  backgroundColor: `rgba(${highlightColors[row.val]}, 0.2)`,
                  boxShadow: `inset 4px 0 0 rgb(${highlightColors[row.val]})`,
                }
              : {}
          "
          class="kv-tr"
        >
          <td>
            <input v-model="row.key" class="de-input" @input="emitChange" />
          </td>
          <td>
            <div class="val-wrapper">
              <input v-model="row.val" class="de-input" @input="emitChange" />
              <span
                v-if="highlightColors[row.val]"
                class="dup-warn"
                :style="{ color: `rgb(${highlightColors[row.val]})` }"
              >
                ⚠️ 重复
              </span>
            </div>
          </td>
          <td>
            <button class="de-btn small danger" @click="removeRow(idx)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="de-btn small" style="margin-top: 6px" @click="addRow">+ 新增行</button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  highlightColors: { type: Object, default: () => ({}) },
})
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
.kv-tr {
  transition:
    background-color 0.2s,
    box-shadow 0.2s;
}

.val-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dup-warn {
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  animation: pulse-warn 1.2s infinite alternate;
}
@keyframes pulse-warn {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
    text-shadow: 0 0 5px currentColor;
  }
}
</style>

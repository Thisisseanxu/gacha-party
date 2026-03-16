<template>
  <div class="tag-input-area" @click="focus">
    <span v-for="(tag, idx) in modelValue" :key="idx" class="tag">
      {{ tag }}
      <span class="tag-remove" @click.stop="remove(idx)">✕</span>
    </span>
    <input
      ref="inputRef"
      v-model="newVal"
      class="tag-new-input"
      placeholder="输入 ID 后回车添加…"
      @keydown.enter.prevent="add"
      @keydown.backspace="onBackspace"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])

const newVal = ref('')
const inputRef = ref(null)

function focus() {
  inputRef.value?.focus()
}

function add() {
  const v = newVal.value.trim()
  if (v && !props.modelValue.includes(v)) {
    emit('update:modelValue', [...props.modelValue, v])
  }
  newVal.value = ''
}

function remove(idx) {
  const arr = [...props.modelValue]
  arr.splice(idx, 1)
  emit('update:modelValue', arr)
}

function onBackspace() {
  if (!newVal.value && props.modelValue.length) {
    remove(props.modelValue.length - 1)
  }
}
</script>

<style>/* TagInput */</style>

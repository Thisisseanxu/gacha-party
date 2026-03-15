<template>
  <div class="add-pool-row" style="margin-top: 6px;">
    <input v-model="val" class="de-input" style="width: 100px;" placeholder="ID…" @keydown.enter="add" />
    <button class="de-btn primary" style="margin-left: 4px;" @click="add">+ 添加</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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

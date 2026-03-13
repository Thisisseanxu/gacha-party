<template>
  <div style="max-width: 800px;">
    <div class="form-title">编辑 gacha_pools.json</div>
    <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</div>
    <div v-if="loading" class="hint">加载中…</div>
    <div v-else-if="error" class="hint error">{{ error }}</div>
    <template v-else-if="data">
      <!-- limited -->
      <div class="form-section">
        <div class="form-section-title">limited（限定卡池 ID 列表）</div>
        <TagInput v-model="data.limited" />
      </div>
      <!-- event -->
      <div class="form-section">
        <div class="form-section-title">event（活动卡池 ID 列表）</div>
        <TagInput v-model="data.event" />
      </div>
      <!-- fuke -->
      <div class="form-section">
        <div class="form-section-title">fuke（复刻卡池 ID 列表）</div>
        <TagInput v-model="data.fuke" />
      </div>
      <!-- names -->
      <div class="form-section">
        <div class="form-section-title">names（卡池 ID → 名称映射）</div>
        <KvTable v-model="data.names" />
      </div>

      <div class="form-actions">
        <button class="de-btn primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存到 gacha_pools.json' }}
        </button>
        <button class="de-btn" @click="load">重新加载</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEditorApi } from '@/composables/useEditorApi.js'
import TagInput from './TagInput.vue'
import KvTable from './KvTable.vue'

const { data, loading, error, load } = useEditorApi('gacha-pools')
const { save: saveApi } = useEditorApi('gacha-pools')

const saving = ref(false)
const saveMsg = ref(null)

async function save() {
  saving.value = true
  saveMsg.value = null
  try {
    await saveApi(data.value)
    saveMsg.value = { ok: true, text: '保存成功！gacha_pools.json 已更新' }
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style>/* GachaPoolsTab */</style>

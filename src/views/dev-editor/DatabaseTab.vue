<template>
  <div style="max-width: 800px;">
    <div class="form-title">编辑 database_36.json</div>
    <div v-if="saveMsg" :class="['save-msg', saveMsg.ok ? 'ok' : 'err']">{{ saveMsg.text }}</div>
    <div v-if="loading" class="hint">加载中…</div>
    <div v-else-if="error" class="hint error">{{ error }}</div>
    <template v-else-if="data?.data">
      <!-- AVA_GACHA_IDS -->
      <div class="form-section">
        <div class="form-section-title">AVA_GACHA_IDS（所有可用卡池 ID）</div>
        <TagInput v-model="data.data.AVA_GACHA_IDS" />
      </div>
      <!-- ENDED_GACHA_IDS -->
      <div class="form-section">
        <div class="form-section-title">ENDED_GACHA_IDS（已结束卡池 ID）</div>
        <TagInput v-model="data.data.ENDED_GACHA_IDS" />
      </div>
      <!-- GACHA_NAME_MAP -->
      <div class="form-section">
        <div class="form-section-title">GACHA_NAME_MAP（卡池 ID → 名称映射）</div>
        <KvTable v-model="data.data.GACHA_NAME_MAP" />
      </div>

      <div class="form-actions">
        <button class="de-btn primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存到 database_36.json' }}
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

const { data, loading, error, load } = useEditorApi('database36')
const { save: saveApi } = useEditorApi('database36')

const saving = ref(false)
const saveMsg = ref(null)

async function save() {
  saving.value = true
  saveMsg.value = null
  try {
    await saveApi(data.value)
    saveMsg.value = { ok: true, text: '保存成功！database_36.json 已更新' }
  } catch (e) {
    saveMsg.value = { ok: false, text: `保存失败：${e.message}` }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style>/* DatabaseTab */</style>

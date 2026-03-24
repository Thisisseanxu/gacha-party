<template>
  <div class="dev-editor-page">
    <div class="tab-bar">
      <button v-for="t in tabs" :key="t.key" :class="['tab-btn', { active: activeTab === t.key }]"
        @click="activeTab = t.key">
        {{ t.label }}
      </button>
    </div>
    <div class="tab-content">
      <CardsTab v-if="activeTab === 'cards'" />
      <CardPoolsTab v-else-if="activeTab === 'cardpools'" />
      <HuizhangTab v-else-if="activeTab === 'huizhang'" />
      <GachaPoolsTab v-else-if="activeTab === 'gachapools'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CardsTab from './dev-editor/CardsTab.vue'
import CardPoolsTab from './dev-editor/CardPoolsTab.vue'
import HuizhangTab from './dev-editor/HuizhangTab.vue'
import GachaPoolsTab from './dev-editor/GachaPoolsTab.vue'
import './dev-editor/dev-shared.css'; // 公共样式

const tabs = [
  { key: 'cards', label: '角色数据' },
  { key: 'cardpools', label: '模拟器配置' },
  { key: 'huizhang', label: '徽章槽位' },
  { key: 'gachapools', label: '卡池数据' },
]

const activeTab = ref('cards')
</script>

<style scoped>
.dev-editor-page {
  min-height: 100vh;
  background: #1a1b20;
  color: #e0e0e0;
  font-family: monospace, sans-serif;
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 12px 16px 0;
  border-bottom: 1px solid #333;
}

.tab-btn {
  padding: 8px 16px;
  background: #2a2b30;
  color: #aaa;
  border: 1px solid #444;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.tab-btn:hover {
  background: #333;
  color: #fff;
}

.tab-btn.active {
  background: #1a1b20;
  color: #fff;
  border-color: #555;
}

.tab-content {
  padding: 16px;
}
</style>

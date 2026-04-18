<template>
  <div id="app">
    <router-view> </router-view>
    <FloatingHomeButton :is-updating="isDownloading" />
  </div>
  <transition name="slide-fade">
    <div v-if="showUpdateDialog" class="update-notification">
      <div class="notification-content">
        <UpdateRotation
          theme="outline"
          size="20"
          :fill="colors.text.primary"
          :class="{ 'icon-spin': isUpdating }"
        />
        <span class="notification-text">{{
          isUpdating ? updateStatusMessage : '发现新版本！'
        }}</span>
      </div>
      <button v-if="!isUpdating" @click="confirmUpdate" class="update-button">更新</button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'App',
}
</script>

<script setup>
import { onBeforeUnmount, watch, ref } from 'vue'
import { UpdateRotation } from '@icon-park/vue-next'
import FloatingHomeButton from './components/FloatingHomeButton.vue'
import './styles/global.css'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { colors } from '@/styles/colors.js'

const isDownloading = ref(false)

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (r) {
      const handleInstalling = (worker) => {
        isDownloading.value = true
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' || worker.state === 'redundant') {
            isDownloading.value = false
          }
        })
      }

      if (r.installing) handleInstalling(r.installing)

      r.onupdatefound = () => {
        const newWorker = r.installing
        if (newWorker) handleInstalling(newWorker)
      }
    }
  },
})
// 使用 watch 监听是否有新版本

const showUpdateDialog = ref(false)
const isUpdating = ref(false)
const updateStatusMessage = ref('正在切换到新版本，请稍候...')
let updateFallbackTimer = null

watch(needRefresh, (newValue) => {
  if (newValue) {
    showUpdateDialog.value = true
    updateStatusMessage.value = '发现新版本，准备开始更新。'
  } else {
    showUpdateDialog.value = false
    isUpdating.value = false
    clearUpdateFallbackTimer()
    updateStatusMessage.value = '正在切换到新版本，请稍候...'
  }
})

function clearUpdateFallbackTimer() {
  if (updateFallbackTimer) {
    window.clearTimeout(updateFallbackTimer)
    updateFallbackTimer = null
  }
}

function confirmUpdate() {
  if (isUpdating.value) return

  if (!('serviceWorker' in navigator)) {
    window.location.reload()
    return
  }

  isUpdating.value = true
  updateStatusMessage.value = '正在切换到新版本，请稍候...'

  const handleControllerChange = () => {
    clearUpdateFallbackTimer()
    updateStatusMessage.value = '更新完成，正在刷新页面...'
    window.setTimeout(() => {
      window.location.reload()
    }, 200)
  }

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, {
    once: true,
  })

  updateServiceWorker(true)

  updateFallbackTimer = window.setTimeout(() => {
    updateStatusMessage.value = '更新超时，正在尝试刷新页面...'
    window.location.reload()
  }, 30000)
}

onBeforeUnmount(() => {
  clearUpdateFallbackTimer()
})
</script>

<style scoped>
#app {
  text-align: center;
  color: v-bind('colors.text.primary');
  min-height: 100dvh;
}

/* 左上角悬浮更新提示 */
.update-notification {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 9999;
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: v-bind('colors.text.primary');
}

.notification-text {
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

/* 更新按钮 */
.update-button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}

.update-button:hover {
  background-color: #36a473;
}

.update-button:active {
  transform: scale(0.98);
}

/* --- Vue Transition 动画 --- */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.5, 0, 0.25, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 图标旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.icon-spin {
  animation: spin 1s linear infinite;
}
</style>

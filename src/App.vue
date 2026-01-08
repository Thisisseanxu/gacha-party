<template>
  <div id="app">
    <router-view> </router-view>
    <FloatingHomeButton v-if="$route.path !== '/'" />
  </div>
  <transition name="fade">
    <div v-if="showUpdateDialog" class="update-overlay">
      <div class="update-dialog">
        <!-- 添加一个标题和图标，让弹窗更醒目 -->
        <div class="dialog-header">
          <UpdateRotation theme="outline" size="32" fill="#333" :class="{ 'icon-spin': isUpdating }" />
          <h3 class="dialog-title">{{ isUpdating ? '正在更新...' : '发现新版本！' }}</h3>
        </div>

        <div v-if="!isUpdating">
          <p class="dialog-content">
            网站已更新，点击“立即刷新”以体验最新功能，享受更流畅的浏览体验。
          </p>
          <button @click="confirmUpdate" class="update-button">立即刷新</button>
        </div>
        <div v-else class="update-progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: updateProgress + '%' }"></div>
          </div>
          <p class="progress-text">更新进度: {{ updateProgress }}%</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'App',
}
</script>

<script setup>
import { watch } from 'vue'
import { UpdateRotation } from '@icon-park/vue-next'
import FloatingHomeButton from './components/FloatingHomeButton.vue'
import './styles/global.css'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { ref } from 'vue'
import { colors } from '@/styles/colors.js'

const { needRefresh, updateServiceWorker } = useRegisterSW()
// 使用 watch 监听是否有新版本

const showUpdateDialog = ref(false)
const isUpdating = ref(false)
const updateProgress = ref(0)

watch(needRefresh, (newValue) => {
  if (newValue) {
    showUpdateDialog.value = true
  } else {
    showUpdateDialog.value = false
    isUpdating.value = false
    updateProgress.value = 0
  }
})

function confirmUpdate() {
  updateServiceWorker()
  isUpdating.value = true
  const timer = setInterval(() => {
    if (updateProgress.value < 99) {
      updateProgress.value += Math.floor(Math.random() * 5) + 1
      updateProgress.value = Math.min(updateProgress.value, 99)
    } else {
      // 在进度达到99%时调用浏览器刷新页面功能
      clearInterval(timer)
      window.location.reload()
    }
  }, 300)
}
</script>

<style scoped>
#app {
  text-align: center;
  color: v-bind('colors.text.primary');
  min-height: 100dvh;
}

/* 覆盖整个屏幕并使背景变暗 */
.update-overlay {
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  /* 添加毛玻璃效果 */
}

/* 弹窗本体 */
.update-dialog {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  /* 添加一个细微的边框 */
  text-align: left;
  /* 弹窗内容左对齐更易读 */
  transform: scale(1);
  /* 初始状态为正常大小 */
}

/* 弹窗标题 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #2c3e50;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0;
}

/* 弹窗内容文本 */
.dialog-content {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

/* 更新按钮 */
.update-button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 400;
  font-size: 1rem;
  width: 100%;
  /* 按钮横跨整个弹窗，操作更方便 */
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

/* --- 进度条样式 --- */
.update-progress-container {
  margin-top: 10px;
  margin-bottom: 10px;
}

.progress-bar {
  width: 100%;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 8px;
  background-color: #42b983;
  transition: width 0.1s linear;
}

.progress-text {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  margin: 0;
}

/* --- Vue Transition 动画 --- */
/* 进入和离开动画的持续时间 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.5, 0, 0.25, 1);
}

/* 定义进入动画的起始状态和离开动画的结束状态 */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 为弹窗主体添加入场动画 */
.fade-enter-active .update-dialog,
.fade-leave-active .update-dialog {
  transition: transform 0.3s cubic-bezier(0.5, 0, 0.25, 1);
}

.fade-enter-from .update-dialog,
.fade-leave-to .update-dialog {
  transform: scale(0.95);
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

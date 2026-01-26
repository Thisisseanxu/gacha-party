<template>
  <div class="background" :class="{ 'smooth-transition': isReady }">
    <div class="home-container" :class="{ 'smooth-transition': isReady }">
      <h1 class="title" :class="{ 'smooth-transition': isReady }">织夜工具箱</h1>

      <div class="button-group">
        <router-link to="chouka" class="btn chouka">
          <img src="/images/icons/chouka.webp" class="btn-icon" alt="icon" />
          <span>抽卡模拟器</span>
        </router-link>

        <router-link to="fenxi" class="btn fenxi">
          <img src="/images/icons/fenxi.webp" class="btn-icon" alt="icon" />
          <span>抽卡数据分析</span>
        </router-link>

        <router-link to="daoyan" class="btn daoyan">
          <img src="/images/icons/daoyan.webp" class="btn-icon" alt="icon" />
          <span>导演模式</span>
        </router-link>

        <router-link to="huizhang" class="btn huizhang">
          <img src="/images/icons/huizhang.webp" class="btn-icon" alt="icon" />
          <span>徽章攻略编辑器</span>
        </router-link>

        <button @click="handleComingSoon" :disabled="isComingSoonClicked" class="btn coming-soon">
          <img src="/images/icons/placeholder.webp" class="btn-icon" alt="icon" />
          <span>{{ comingSoonText }}</span>
        </button>
      </div>

      <div class="info-footer">
        <a href="https://github.com/Thisisseanxu/gacha-party" rel="noopener noreferrer" target="_blank"
          class="footer-link">
          <github-one theme="outline" size="20" />
          <span>开源地址</span>
        </a>

        <a href="https://qm.qq.com/cgi-bin/qm/qr?k=PD3VWuDfxO_hAVZQBreK1CjvWORTkNN2&jump_from=webapi&authKey=c4Sos3R4opf3VqerCwpPX+IOmwZUDm4hqkyT7qDGhta2fAhdUETlxFZ9wDrcRu1z"
          target="_blank" rel="noopener noreferrer" class="footer-link">
          <tencent-qq theme="outline" size="20" />
          <span>加入Q群</span>
        </a>

        <router-link to="about" class="footer-link">
          <info theme="outline" size="20" />
          <span>关于</span>
        </router-link>

        <a v-if="deferredPrompt" @click="handleInstallClick" class="footer-link">
          <install theme="outline" size="20" />
          <span>安装应用</span>
        </a>
      </div>

      <span class="version">当前版本：v{{ appVersion }}</span>
    </div>

    <button @click="toggleTheme" class="theme-toggle-btn" title="切换主题">
      <Moon v-if="currentTheme.value === 'dark'" />
      <SunOne v-else />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { colors, toggleTheme, currentTheme } from '@/styles/colors.js'
import { GithubOne, TencentQq, Install, Info, Moon, SunOne } from '@icon-park/vue-next'
import { logger } from '@/utils/logger'

const appVersion = __VERSION__

const isReady = ref(false)

onMounted(() => {
  setTimeout(() => {
    isReady.value = true
  }, 100)
})

// 创建一个 ref 保存 'beforeinstallprompt' 事件
const deferredPrompt = ref(null)
const captureInstallPrompt = (e) => {
  // 阻止浏览器默认的、自动弹出的安装提示
  e.preventDefault()
  // 保存事件对象，以便后续手动触发
  deferredPrompt.value = e
  logger.log('PWA 安装提示已被捕获，等待用户手动触发。')
}

// 设置一个监听器来捕获 'beforeinstallprompt' 事件
onMounted(() => {
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
})
onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
})

const handleInstallClick = async () => {
  if (!deferredPrompt.value) {
    return
  }
  // 调用保存的事件对象的 prompt() 方法，会弹出浏览器标准的安装窗口
  deferredPrompt.value.prompt()

  // 等待用户做出选择
  const { outcome } = await deferredPrompt.value.userChoice
  logger.log(`PWA 安装提示的用户选择: ${outcome}`)

  // 无论用户选择什么，这个事件都已经用过，无法再次使用。
  // 清空 ref，安装按钮也会因此被 v-if 隐藏。
  deferredPrompt.value = null
}

// --- 开发中按钮控制逻辑 ---
const originalComingSoonText = '更多功能即将上线'
const comingSoonText = ref(originalComingSoonText)
const isComingSoonClicked = ref(false)

const handleComingSoon = () => {
  // 如果按钮已经被点击，则不执行任何操作
  if (isComingSoonClicked.value) return

  // 更新文本并禁用按钮
  comingSoonText.value = '正在努力更新，不要戳我了！'
  isComingSoonClicked.value = true

  // 3秒后恢复按钮
  setTimeout(() => {
    comingSoonText.value = originalComingSoonText
    isComingSoonClicked.value = false
  }, 1000)
}
</script>

<style scoped>
.background {
  position: relative;
  min-height: 100dvh;
  background-color: v-bind('colors.background.primary');
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.background.smooth-transition {
  transition: background-color 1s ease;
}

.background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/homepage_bg.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 1;
}

.home-container {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 2rem;
  background-color: v-bind('colors.background.content');
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  max-width: min(100vw, 800px);
  min-width: 0;
}

.home-container.smooth-transition {
  transition: background-color 1s ease;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  margin-top: 1rem;
  margin-bottom: 2rem;
}

.title.smooth-transition {
  transition: color 1s ease;
}

.version {
  font-size: 1rem;
  color: v-bind('colors.text.tertiary');
  transition: color 0.3s ease;
}

.button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 100vw;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
  padding: 0.4rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  /* 为所有按钮添加指针手势 */
}

.btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.btn-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.chouka {
  background: linear-gradient(145deg, #8b5cf6, #6d28d9);
}

.fenxi {
  background: linear-gradient(145deg, #f9a8d4, #ec4899);
}

.daoyan {
  background: linear-gradient(145deg, #10b981, #059669);
}

.huizhang {
  background: linear-gradient(145deg, #3b82f6, #2563eb);
}

/* --- 开发中功能的按钮 --- */
.coming-soon {
  background: linear-gradient(145deg, #6b7280, #4b5563);
  color: #d1d5db;
  grid-column: 1 / -1;
  justify-content: center;
}

/* 按钮被禁用时的样式 */
.coming-soon:disabled {
  background: linear-gradient(145deg, #4b5563, #374151);
  color: #9ca3af;
  cursor: not-allowed;
  /* 禁用时显示“不可用”光标 */
  transform: none;
  /* 禁用时移除悬浮效果 */
  filter: none;
}

.info-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  row-gap: 0.8rem;
  margin-top: 2rem;
  margin-bottom: 0.8rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(58, 59, 64, 0.5);
  width: 100%;
}

.footer-link {
  display: flex;
  text-wrap: nowrap;
  align-items: center;
  gap: 0.8rem;
  color: v-bind('colors.text.highlight');
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.footer-link:hover {
  filter: brightness(1.2);
}

.theme-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
  font-size: 24px;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}
</style>

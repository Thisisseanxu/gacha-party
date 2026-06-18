<template>
  <div class="background" :class="{ 'smooth-transition': isReady }">
    <div class="home-container" :class="{ 'smooth-transition': isReady }">
      <h1 class="title" :class="{ 'smooth-transition': isReady }">织夜工具箱</h1>
      <h2 class="subtitle" :class="{ 'smooth-transition': isReady }">盲盒派对小助手</h2>

      <section class="primary-actions">
        <router-link to="fenxi" class="btn btn-primary fenxi">
          <img src="/images/icons/fenxi.webp" class="btn-icon" alt="icon" />
          <span class="btn-label">抽卡记录分析</span>
        </router-link>
        <router-link
          :to="{ name: '抽卡模拟器', params: { poolId: latestPoolId } }"
          class="btn btn-primary chouka"
        >
          <img src="/images/icons/chouka.webp" class="btn-icon" alt="icon" />
          <span class="btn-label">抽卡模拟器</span>
        </router-link>
      </section>

      <h3 class="section-divider"><span>更多功能</span></h3>

      <section class="secondary-actions">
        <router-link to="huizhang" class="btn btn-secondary">
          <img src="/images/icons/huizhang.webp" class="btn-icon" alt="icon" />
          <div class="btn-text">
            <span class="btn-title">徽章助手<sup class="beta-tag">BETA</sup></span>
            <span class="btn-subtitle">查看角色最合适的徽章搭配，加速角色养成</span>
          </div>
        </router-link>

        <router-link to="fuke" class="btn btn-secondary">
          <img src="/images/icons/fuke.webp" class="btn-icon" alt="icon" />
          <div class="btn-text">
            <span class="btn-title">UP计时器</span>
            <span class="btn-subtitle">看看你喜欢的角色有多久没UP了</span>
          </div>
        </router-link>

        <router-link to="quiz" class="btn btn-secondary">
          <img src="/images/icons/placeholder.webp" class="btn-icon" alt="icon" />
          <div class="btn-text">
            <span class="btn-title">角色性格匹配<sup class="beta-tag">NEW</sup></span>
            <span class="btn-subtitle">完成 40 道情境题，看看你最像盲盒派对中的哪位角色</span>
          </div>
        </router-link>

        <router-link to="daoyan" class="btn btn-secondary">
          <img src="/images/icons/daoyan.webp" class="btn-icon" alt="icon" />
          <div class="btn-text">
            <span class="btn-title">导演模式</span>
            <span class="btn-subtitle">自己当导演！自由创作角色和班长的聊天</span>
          </div>
        </router-link>

        <button
          @click="handleComingSoon"
          :disabled="isComingSoonClicked"
          class="btn btn-secondary coming-soon"
        >
          <img src="/images/icons/placeholder.webp" class="btn-icon" alt="icon" />
          <div class="btn-text">
            <span class="btn-title">{{ comingSoonText }}</span>
            <span class="btn-subtitle">有建议可以加Q群或在github提出噢</span>
          </div>
        </button>
      </section>

      <div class="info-footer">
        <a
          href="https://github.com/Thisisseanxu/gacha-party"
          rel="noopener noreferrer"
          target="_blank"
          class="footer-link"
        >
          <github-one theme="outline" size="20" />
          <span>开源地址</span>
        </a>

        <a
          href="https://qm.qq.com/cgi-bin/qm/qr?k=PD3VWuDfxO_hAVZQBreK1CjvWORTkNN2&jump_from=webapi&authKey=c4Sos3R4opf3VqerCwpPX+IOmwZUDm4hqkyT7qDGhta2fAhdUETlxFZ9wDrcRu1z"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
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
      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        class="beian-link"
      >
        沪ICP备2025139421号-2
      </a>
    </div>

    <button @click="toggleTheme" class="theme-toggle-btn" title="切换主题">
      <Moon v-if="currentTheme.value === 'dark'" />
      <SunOne v-else />
    </button>

    <div class="social-buttons" :class="{ retracted: isRetracted }">
      <a
        v-for="(link, index) in socialLinks"
        :key="index"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="social-btn"
        :class="link.state"
        @mouseenter="onBtnEnter(link)"
        @mouseleave="onBtnLeave(link)"
      >
        <img :src="link.icon" class="social-icon" :alt="link.label" />
        <span>{{ link.label }}</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { colors, toggleTheme, currentTheme } from '@/styles/colors.js'
import { GithubOne, TencentQq, Install, Info, Moon, SunOne } from '@icon-park/vue-next'
import { logger } from '@/utils/logger'
import { cardPoolsInOrder } from '@/data/cardPools'

const appVersion = __VERSION__

const isReady = ref(false)
const isRetracted = ref(false)
let retractTimer = null

// 获取最新的卡池ID（取第一个key）
const latestPoolId = cardPoolsInOrder[0][0]

// 友情链接配置数据
const socialLinks = ref([
  {
    url: 'https://space.bilibili.com/33809083',
    icon: '/images/bili_avatar.webp',
    label: '关注',
    state: '',
    timer: null,
  },
  {
    url: 'https://boxparty.aojiaostudio.com',
    icon: '/images/manghe_icon.webp',
    label: '官网',
    state: '',
    timer: null,
  },
  {
    url: 'https://wiki.biligame.com/gachaparty/',
    icon: '/images/bwiki_icon.webp',
    label: '攻略',
    state: '',
    timer: null,
  },
])

function onBtnEnter(item) {
  if (!isRetracted.value) return
  clearTimeout(item.timer)
  item.timer = null
  item.state = 'extended'
}

function onBtnLeave(item) {
  if (!isRetracted.value) return
  item.state = 'resting'
  item.timer = setTimeout(() => {
    item.state = ''
    item.timer = null
  }, 2000)
}

onMounted(() => {
  setTimeout(() => {
    isReady.value = true
  }, 100)
  retractTimer = setTimeout(() => {
    isRetracted.value = true
  }, 3000)
})

// 创建一个 ref 保存 'beforeinstallprompt' 事件
const deferredPrompt = ref(null)
const captureInstallPrompt = (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  logger.log('PWA 安装提示已被捕获，等待用户手动触发。')
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
})
onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
  if (retractTimer) clearTimeout(retractTimer)
  socialLinks.value.forEach((link) => clearTimeout(link.timer))
})

const handleInstallClick = async () => {
  if (!deferredPrompt.value) {
    return
  }
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  logger.log(`PWA 安装提示的用户选择: ${outcome}`)
  deferredPrompt.value = null
}

// --- 开发中按钮控制逻辑 ---
const originalComingSoonText = '功能开发中'
const comingSoonText = ref(originalComingSoonText)
const isComingSoonClicked = ref(false)

const handleComingSoon = () => {
  if (isComingSoonClicked.value) return
  comingSoonText.value = '正在努力更新'
  isComingSoonClicked.value = true
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
  padding: 1rem;
  background-color: v-bind('colors.background.content');
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  max-width: min(100dvw, 700px);
  min-width: 0;
  max-height: 95dvh;
}

.home-container.smooth-transition {
  transition: background-color 1s ease;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  margin: 0;
  flex-shrink: 0;
}

.title.smooth-transition {
  transition: color 1s ease;
}

.subtitle {
  font-size: 1.2rem;
  font-weight: normal;
  color: v-bind('colors.text.secondary');
  margin-top: 0;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.subtitle.smooth-transition {
  transition: color 1s ease;
}

.version {
  font-size: 1rem;
  color: v-bind('colors.text.tertiary');
  transition: color 0.3s ease;
  flex-shrink: 0;
}

.beian-link {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: v-bind('colors.text.tertiary');
  text-decoration: none;
  transition: color 0.3s ease;
}

.beian-link:hover {
  color: v-bind('colors.text.highlight');
  text-decoration: underline;
}

.button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 100vw;
}

/* --- 按钮通用样式 --- */
.btn {
  display: flex;
  align-items: center;
  text-decoration: none;
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background-color 0.25s ease,
    filter 0.25s ease;
  font-family: inherit;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

/* --- 主要按钮：保留渐变填充，每行最多 4 个，纵向布局 --- */
.primary-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  width: 100%;
  flex-shrink: 0;
}

.btn-primary {
  flex-direction: column;
  justify-content: center;
  padding: 0.75rem 0.25rem;
  min-height: 60px;
  border: none;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-primary .btn-label {
  font-size: 1.1rem;
  font-weight: bold;
}

.chouka {
  background: linear-gradient(145deg, #8b5cf6, #6d28d9);
}

.fenxi {
  background: linear-gradient(145deg, #f9a8d4, #ec4899);
}

/* --- 次要按钮：无填充，统一边框，一行一个，icon 左 + 文本右 --- */
.secondary-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding-top: 0.25rem;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: v-bind('colors.border.primary') transparent;
}

.secondary-actions::-webkit-scrollbar {
  width: 6px;
}

.secondary-actions::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.border.primary');
  border-radius: 3px;
}

.btn-secondary {
  flex-direction: row;
  justify-content: flex-start;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  text-align: left;
  background: transparent;
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
}

.btn-secondary:hover {
  border-color: v-bind('colors.brand.primary');
  background-color: v-bind('colors.brand.primaryBackground');
}

.btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  flex: 1;
}

.btn-title {
  font-size: 1rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
}

.btn-subtitle {
  font-size: 0.8rem;
  font-weight: normal;
  color: v-bind('colors.text.tertiary');
  margin-top: 2px;
}

.beta-tag {
  font-size: 0.6em;
  margin-left: 2px;
  vertical-align: super;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  margin: 1rem 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: normal;
  color: v-bind('colors.text.tertiary');
  flex-shrink: 0;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: v-bind('colors.border.primary');
}

.coming-soon:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 480px) {
  .primary-actions {
    grid-template-columns: 1fr 1fr;
  }
}

.info-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  row-gap: 0.8rem;
  margin-top: 1rem;
  margin-bottom: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(58, 59, 64, 0.5);
  width: 100%;
  flex-shrink: 0;
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

.social-buttons {
  position: fixed;
  bottom: 2rem;
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.social-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-left: none;
  border-radius: 0 8px 8px 0;
  margin-left: -20px;
  padding: 6px 6px 6px 26px;
  text-decoration: none;
  color: v-bind('colors.text.primary');
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.25);
  transform: translateX(0);
  transition:
    transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.2s ease,
    background-color 1s ease,
    color 1s ease,
    border-color 1s ease;
  cursor: pointer;
}

.social-btn:hover {
  transform: translateX(8px);
  box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.35);
}

.social-buttons.retracted .social-btn {
  transform: translateX(-3.2rem);
}

.social-buttons.retracted .social-btn.resting {
  transform: translateX(0);
}

.social-buttons.retracted .social-btn.extended {
  transform: translateX(8px);
  box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.35);
}

.social-icon {
  width: 3rem;
  height: 3rem;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.social-btn span {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  line-height: 1;
  letter-spacing: 0.1em;
}
</style>

<template>
  <div class="floating-wrapper" v-if="!isFullscreen && !isFloatingButtonHidden">
    <div
      class="floating-home-button"
      :class="{ stealth: isStealth, active: menuOpen }"
      @click.stop="toggleMenu"
    ></div>

    <Transition name="menu-fade">
      <div v-if="menuOpen" class="menu" @click.stop>
        <button class="menu-btn" @click="onHome" title="返回主页">
          <HomeTwo theme="outline" size="20" />
        </button>
        <button class="menu-btn" @click="onToggleTheme" title="切换主题">
          <Moon v-if="currentTheme.value === 'dark'" theme="outline" size="20" />
          <SunOne v-else theme="outline" size="20" />
        </button>
        <button class="menu-btn" @click="onToggleStealth" title="隐藏按钮">
          <PreviewCloseOne theme="outline" size="20" />
        </button>
      </div>
    </Transition>

    <div class="hints-container">
      <Transition name="fade">
        <div v-if="showHint" class="hint-bubble">{{ hintText }}</div>
      </Transition>

      <Transition name="fade">
        <div class="hint-bubble" v-if="props.isUpdateDownloading">
          <div class="spinner"></div>
          <span>发现新版本，在下载喵~</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeTwo, Moon, SunOne, PreviewCloseOne } from '@icon-park/vue-next'
import { toggleTheme, currentTheme } from '@/styles/theme.js'
import { isFloatingButtonHidden } from '@/utils/floatingButtonState.js'

const props = defineProps({
  isUpdateDownloading: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const route = useRoute()

const isFullscreen = ref(false)
const menuOpen = ref(false)
const isStealth = ref(false)

const showHint = ref(false)
const hintText = ref('')
let hintTimer = null

const HOME_HINT_COOLDOWN_MS = 60 * 1000
const HOME_HINT_DURATION_MS = 6000
const STEALTH_DURATION_MS = 15 * 60 * 1000
const STEALTH_KEY = 'floating_btn_stealth_until'

const checkFullscreen = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const showHintFor = (text, duration = HOME_HINT_DURATION_MS) => {
  hintText.value = text
  showHint.value = true
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    showHint.value = false
    hintTimer = null
  }, duration)
}

const closeMenuOnOutsideClick = () => {
  menuOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const onHome = () => {
  menuOpen.value = false
  router.push('/')
}

const onToggleTheme = () => {
  toggleTheme()
  menuOpen.value = false
}

const onToggleStealth = () => {
  if (isStealth.value) {
    isStealth.value = false
    localStorage.removeItem(STEALTH_KEY)
    showHintFor('我回来了喵~', 3000)
  } else {
    isStealth.value = true
    const until = Date.now() + STEALTH_DURATION_MS
    localStorage.setItem(STEALTH_KEY, String(until))
    showHintFor('已开启隐身，再次点我关闭喵~', 3000)
  }
  menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('fullscreenchange', checkFullscreen)
  document.addEventListener('click', closeMenuOnOutsideClick)
  checkFullscreen()

  const until = Number(localStorage.getItem(STEALTH_KEY) || 0)
  if (until && Date.now() < until) {
    isStealth.value = true
  } else if (until) {
    localStorage.removeItem(STEALTH_KEY)
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', checkFullscreen)
  document.removeEventListener('click', closeMenuOnOutsideClick)
  if (hintTimer) clearTimeout(hintTimer)
})

watch(
  () => route.path,
  (newPath) => {
    menuOpen.value = false

    if (hintTimer) {
      clearTimeout(hintTimer)
      hintTimer = null
      showHint.value = false
    }

    if (newPath === '/' || isStealth.value) {
      return
    }

    const lastTime = Number(localStorage.getItem('home_btn_hint_last_time') || 0)
    const now = Date.now()
    if (now - lastTime <= HOME_HINT_COOLDOWN_MS) return

    showHintFor('点我返回主页喵~', HOME_HINT_DURATION_MS)
    localStorage.setItem('home_btn_hint_last_time', String(now))
  },
  { immediate: true },
)
</script>

<style scoped>
.floating-wrapper {
  position: fixed;
  z-index: 9999;
  top: 5px;
  right: 5px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.floating-home-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-image: url('/images/icon.webp');
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 2px solid var(--color-shadow-white-hover);
  box-shadow: 0 4px 12px var(--color-shadow-primary);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    opacity 0.3s ease,
    border-color 0.3s ease;
  align-self: flex-end;
}

.floating-home-button:hover,
.floating-home-button.active {
  transform: scale(1.1);
  box-shadow: 0 6px 16px var(--color-shadow-primary-hover);
}

.floating-home-button.stealth {
  opacity: 0;
  border-color: transparent;
  box-shadow: none;
}

.floating-home-button.stealth:hover {
  transform: none;
  box-shadow: none;
}

.menu {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: var(--color-background-content);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 4px 12px var(--color-shadow-primary);
}

.menu-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.menu-btn:hover {
  background-color: var(--color-brand-primary-background);
  transform: scale(1.05);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.hints-container {
  position: absolute;
  right: 100%;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  padding-right: 10px;
  pointer-events: none;
}

.hint-bubble {
  pointer-events: auto;
  background-color: var(--color-shadow-primary-hover);
  color: var(--color-text-primary);
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 14px;
  white-space: nowrap;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

@media (min-width: 768px) {
  .floating-wrapper {
    top: 4vh;
    right: 4vw;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>

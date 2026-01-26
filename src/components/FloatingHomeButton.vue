<template>
  <div class="floating-wrapper">
    <div class="floating-home-button" @click="goToHome"></div>

    <div class="hints-container">
      <Transition name="fade">
        <div v-if="showHint" class="hint-bubble">点我返回主页喵~</div>
      </Transition>

      <Transition name="fade">
        <div class="hint-bubble" v-if="props.isUpdating">
          <div class="spinner"></div>
          <span>发现新版本，在下载喵~</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { colors } from '@/styles/colors.js'

const props = defineProps({
  isUpdating: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const route = useRoute()
const showHint = ref(false)

watch(() => route.path, (newPath) => {
  if (newPath === '/') {
    showHint.value = false
    return
  }

  showHint.value = true
  const lastTime = Number(localStorage.getItem('home_btn_hint_last_time') || 0)
  const now = Date.now()
  if (now - lastTime > 180000) {
    localStorage.setItem('home_btn_hint_last_time', String(now))
    setTimeout(() => {
      showHint.value = false
    }, 3000)
  } else {
    setTimeout(() => {
      showHint.value = false
    }, 1000)
  }
}, { immediate: true })

const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.floating-wrapper {
  position: fixed;
  z-index: 9999;
  /* 手机端的默认样式：距离角落较近 */
  top: 5px;
  right: 5px;
  /* 让内部元素可以相对于它定位 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.floating-home-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-image: url('/favicon.ico');
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 2px solid v-bind('colors.shadow.whiteHover');
  box-shadow: 0 4px 12px v-bind('colors.shadow.primary');
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.floating-home-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px v-bind('colors.shadow.primaryHover');
}

/* 提示气泡容器 */
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

/* 提示气泡样式 */
.hint-bubble {
  pointer-events: auto;
  background-color: v-bind('colors.shadow.primaryHover');
  color: v-bind('colors.text.primary');
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 14px;
  white-space: nowrap;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

/* 在大屏幕上离屏幕中心更近一点，方便按到 */
@media (min-width: 768px) {
  .floating-wrapper {
    /* 应用大屏幕的样式：距离角落更远 */
    top: 4vh;
    right: 4vw;
  }
}

/* 气泡动画 */
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

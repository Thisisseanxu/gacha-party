<template>
  <div class="floating-wrapper">
    <div class="floating-home-button" @click="goToHome"></div>

    <Transition name="fade">
      <div v-if="showHint" class="hint-bubble">点我返回主页喵~</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { colors } from '@/styles/colors.js'

const router = useRouter()

const showHint = ref(true)

onMounted(() => {
  // 启动一个3秒的定时器
  setTimeout(() => {
    // 3秒后，隐藏提示语
    showHint.value = false
  }, 3000)
})

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
  border: 2px solid v-bind('colors.shadow.lightHover');
  box-shadow: 0 4px 12px v-bind('colors.shadow.primary');
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.floating-home-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px v-bind('colors.shadow.primaryHover');
}

/* 提示气泡样式 */
.hint-bubble {
  /* 绝对定位，相对于 .floating-wrapper */
  position: absolute;
  /* 放在悬浮球左侧，留出一点空隙 */
  right: 100%;
  margin-right: 10px;
  background-color: v-bind('colors.shadow.primaryHover');
  color: v-bind('colors.text.primary');
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 14px;
  white-space: nowrap;
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
</style>

<template>
  <div id="app">
    <router-view>
    </router-view>
    <FloatingHomeButton v-if="$route.path !== '/'" />
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<script setup>
import { watch } from 'vue'
import FloatingHomeButton from './components/FloatingHomeButton.vue';
import './styles/global.css';
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
// 使用 watch 监听是否有新版本
watch(needRefresh, (newValue) => {
  if (newValue) {
    // 打印日志以供调试
    console.log('检测到新版本，将自动刷新页面...')
    // 直接刷新页面
    updateServiceWorker()
  }
}, { immediate: false })
</script>

<style scoped>
#app {
  text-align: center;
  color: #2c3e50;
  min-height: 100dvh;
}
</style>

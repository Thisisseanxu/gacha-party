<template>
  <div class="floating-home-button" @click="goToHome">
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToHome = () => {
  router.push('/');
};
</script>

<style scoped>
.floating-home-button {
  /* 定位 */
  position: fixed;
  top: 20px;
  left: 20px;
  /* 确保在最上层 */
  z-index: 9999;

  /* 圆形 */
  width: 50px;
  height: 50px;
  border-radius: 50%;

  /* 背景图片 */
  background-image: url('/favicon.ico');
  background-size: cover;
  background-position: center;

  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.5);
  /* 添加一个半透明的白色边框 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.floating-home-button:hover {
  transform: scale(1.1);
  /* 鼠标悬浮时放大一点 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}
</style>

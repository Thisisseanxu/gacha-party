<template>
  <div class="not-found-page">
    <div class="container">
      <div class="status-code">404</div>
      <h1 class="title">页面未找到</h1>
      <p class="description">
        抱歉，找不到您要访问的页面。如果您确信页面存在，请稍作等待后刷新页面。
      </p>
      <router-link to="/" class="home-button">返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
// !重要: 请确保这个路径是正确的
import { colors } from '../styles/colors.js'
</script>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background-color: v-bind('colors.background.primary');
  color: v-bind('colors.text.primary');
  text-align: center;
}

.container {
  max-width: 600px;
}

.status-code {
  font-size: 10rem;
  font-weight: bold;
  color: v-bind('colors.background.lighter');
  text-shadow: 4px 4px 0px v-bind('colors.background.content');
  line-height: 1;
}

.title {
  font-size: 2.5rem;
  color: v-bind('colors.text.primary');
  margin-top: 0;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 3px v-bind('colors.textShadow');
}

.description {
  font-size: 1.2rem;
  color: v-bind('colors.text.secondary');
  margin-bottom: 2.5rem;
}

.home-button {
  display: inline-block;
  padding: 12px 30px;
  font-size: 1.1rem;
  font-weight: bold;
  color: v-bind('colors.text.black');
  background-color: v-bind('colors.brand.primary');
  border: none;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.3s,
    transform 0.2s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.home-button:hover {
  background-color: v-bind('colors.brand.hover');
  transform: translateY(-3px);
}
</style>

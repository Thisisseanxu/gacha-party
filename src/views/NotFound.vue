<template>
  <div class="not-found-page">
    <div class="container">
      <div class="status-code">404</div>
      <h1 class="title">网页未找到</h1>
      <p class="description">
        抱歉，找不到您要访问的网页。<br />如果您确定页面应该存在，请稍作等待后刷新网页。
      </p>
      <router-link to="/" class="home-button">返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  text-align: center;
}

.container {
  max-width: 600px;
}

.status-code {
  font-size: 10rem;
  font-weight: bold;
  color: var(--color-text-highlight);
  text-shadow: 4px 4px 0px var(--color-shadow-white-hover);
  line-height: 1;
}

.title {
  font-size: 2.5rem;
  color: var(--color-text-primary);
  margin-top: 0;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 3px var(--color-text-shadow);
}

.description {
  font-size: 1.2rem;
  color: var(--color-text-secondary);
  margin-bottom: 2.5rem;
}

.home-button {
  display: inline-block;
  padding: 12px 30px;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-text-black);
  background-color: var(--color-brand-primary);
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
  background-color: var(--color-brand-hover);
  transform: translateY(-3px);
}
</style>

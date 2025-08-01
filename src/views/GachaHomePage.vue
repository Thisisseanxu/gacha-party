<template>
  <div class="background">
    <div class="home-page">
      <div class="header-section">
        <h1>抽卡模拟器</h1>
        <p>选择一个卡池，开始你的欧皇之旅吧！</p>
        <SwitchComponent v-model="challengeMode" label="熊月的200抽挑战赛模式" />
      </div>

      <div class="card-pool-list">
        <router-link v-for="(pool, id) in cardPools" :key="id"
          :to="challengeMode ? { name: '抽卡挑战赛', params: { poolId: id } } : { name: '抽卡模拟器', params: { poolId: id } }"
          class="card-pool-item">
          <img v-if="pool.imageUrl" :src="pool.imageUrl" :alt="pool.name + '封面'" class="pool-cover-image">
          <div v-else class="pool-name-text-wrapper">
            <h2 class="pool-name-text">{{ pool.name }}</h2>
          </div>
        </router-link>
        <router-link key="custom" :to="{ name: '自定义卡池' }" class="card-pool-item">
          <div class="pool-name-text-wrapper">
            <h2 class="pool-name-text">自定义卡池</h2>
          </div>
        </router-link>
      </div>

      <div class="info-section card">
        <h3>概率公示</h3>
        <p>本模拟器使用1.25%的基础概率来拟合游戏内的2%的综合概率</p>
        <p><strong>常驻卡池：</strong>SSR的概率为8%，SR为20%，R为72%。连续59次未出UP组SSR，第60抽必为UP组SSR。获取SSR时，有50%概率为UP角色，若“歪”，则下次SSR必为UP角色。
        </p>
        <p><strong>限定卡池：</strong>限定角色综合概率为2%，40抽后概率提升，60抽必出。SSR概率为6%，SR为20%，R为72%。UP机制与常驻池类似。</p>
        <p class="footer-link">本项目完全开源，欢迎前往 <a href="https://github.com/Thisiseanxu/gacha-party"
            target="_blank">Github</a> 参与开发，或加入Q群 1049576192 交流。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { cardPools } from '@/data/cardPools';
import { colors } from '@/styles/colors.js';
import SwitchComponent from '@/components/SwitchComponent.vue';

const challengeMode = ref(false);
</script>

<style scoped>
.background {
  position: relative;
  min-height: 100vh;
  background-color: v-bind('colors.background.primary');
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  overflow: hidden;
  justify-items: center;
}

.home-page {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  font-size: 2.5rem;
  color: v-bind('colors.text.primary');
  font-weight: bold;
}

.header-section p {
  font-size: 1.1rem;
  color: v-bind('colors.text.secondary');
}

.card-pool-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
  margin-bottom: 3rem;
}

.card-pool-item {
  text-decoration: none;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 16 / 7;
}

.card-pool-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.pool-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pool-name-text-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.pool-name-text {
  font-size: 1.8em;
  color: v-bind('colors.text.highlight');
  font-weight: bold;
  margin: 0;
}

.info-section.card {
  background-color: v-bind('colors.background.content');
  border-radius: 12px;
  padding: 2rem;
  text-align: left;
  color: v-bind('colors.text.secondary');
  line-height: 1.8;
  width: 100%;
  border: 1px solid v-bind('colors.border.primary');
}

.info-section h3 {
  font-size: 1.5rem;
  color: v-bind('colors.text.primary');
  margin-top: 0;
  margin-bottom: 1rem;
  border-bottom: 2px solid v-bind('colors.border.primary');
  padding-bottom: 0.5rem;
}

.info-section p {
  margin-bottom: 1rem;
}

.footer-link {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid v-bind('colors.border.primary');
}

.footer-link a {
  color: v-bind('colors.text.highlight');
  text-decoration: none;
  font-weight: bold;
}

.footer-link a:hover {
  text-decoration: underline;
}
</style>

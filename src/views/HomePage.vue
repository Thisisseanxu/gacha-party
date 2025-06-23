<template>
  <div class="home-page">
    <h1>欢迎来到抽卡模拟器</h1>
    <p>选择一个卡池开始抽卡吧！</p>

    <div class="card-pool-list">
      <router-link v-for="(pool, id) in limitedPools" :key="id" :to="{ name: 'Gacha', params: { poolId: id } }"
        class="card-pool-item">
        <div class="card-pool-content">
          <img v-if="pool.imageUrl" :src="pool.imageUrl" :alt="pool.name + '封面'" class="pool-cover-image">
          <h2 v-else class="pool-name-text">{{ pool.name }}</h2>
        </div>
      </router-link>

      <router-link class="card-pool-item" key="Normal" to="/gacha/Normal01">
        <div class="card-pool-content">
          <img src="/images/cardpools-icon/9.webp" alt="常驻卡池封面" class="pool-cover-image">
        </div>
      </router-link>

      <router-link class="card-pool-item" key="AllUR" to="/gacha/AllUR">
        <div class="card-pool-content">
          <h2 class="pool-name-text">超爽UR卡池</h2>
        </div>
      </router-link>
    </div>

    <div class="text-left">
      <p>概率公示：由于官方目前没有在卡池标注所谓的“基础概率”，因此本模拟器的算法与“盲盒详情”中保持一致，即：</p>
      <p>所有常驻卡池：SSR的概率每抽都为8%，如果连续59次抽卡没有获取UP组中的SSR角色，则第60抽必定获取<br />
        获取SR角色的概率为每抽20%，获取R角色的概率为每抽72%<br />
        在获取SSR角色时有50%的概率为UP角色，如本次没有获取，则下次获取SSR角色时必为UP角色之一</p>
      <p>所有限定卡池：限定角色的概率为每抽2%，如果连续40次没有获取限定角色，则下一抽的概率变为4%（以此类推，6%，8%...）<br />
        第60抽必定获取限定角色，卡池有选择限定规则时，若本次获取的限定角色不为选择的，则下次获取时必定为选择的限定角色<br />
        获取SSR角色的概率为每抽6%，获取SR角色的概率为每抽20%，获取R角色的概率为每抽72%。</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'; // 1. 从 vue 导入 computed
import { cardPools } from '@/data/cardPools';

const limitedPools = computed(() => {
  return Object.fromEntries(
    Object.entries(cardPools).filter(([, pool]) => pool.type === '限定')
  )
});
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.card-pool-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
  justify-content: center;
}

.card-pool-item {
  display: flex;
  justify-content: center;
  align-items: center;
  /* 使得整个区域可点击 */
  width: 320px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  text-decoration: none;
  /* 移除下划线 */
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card-pool-content {
  flex-grow: 1;
  width: 100%;
  overflow: hidden;
}

.card-pool-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-pool-item h2 {
  margin: 0;
  color: #007bff;
}

.card-pool-item p {
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #666;
}

.text-left {
  text-align: left;
}
</style>

<template>
    <div class="gacha-page">
        <router-link to="/">返回主页</router-link>
        <h1>{{ currentPool ? currentPool.name : '未知卡池' }}</h1>
        <p>欢迎来到 {{ currentPool ? currentPool.name : '未知卡池' }} 抽卡界面！</p>
        <p>DEBUG：当前卡池ID: {{ poolId }}</p>

        <h2>卡池中的角色：</h2>
        <ul>
            <li v-for="card in currentPool.cards" :key="card.id">
                {{ card.name }} ({{ card.rarity }})
            </li>
        </ul>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { cardPools } from '@/data/cardPools'; // 导入卡池数据

const route = useRoute();
const poolId = computed(() => route.params.poolId); // 获取路由参数

// 根据路由参数获取当前卡池数据
const currentPool = computed(() => {
    return cardPools[poolId.value];
});

// 检查当前卡池是否存在
if (!currentPool.value) {
    console.error(`未找到ID为 ${poolId.value} 的卡池`);
    // TODO 自动重定向到主页或显示错误信息
}
</script>

<style scoped>
.gacha-page {
    padding: 20px;
    text-align: center;
}

ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
}

li {
    border: 1px solid #eee;
    padding: 5px 10px;
    border-radius: 4px;
    background-color: #f9f9f9;
}
</style>
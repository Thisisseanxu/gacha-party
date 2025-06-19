<template>
    <div class="home-page">
        <h1>欢迎来到抽卡模拟器</h1>
        <p>选择一个卡池开始抽卡吧！</p>

        <div class="card-pool-list">
            <router-link v-for="(pool, id) in cardPools" :key="id" :to="{ name: 'Gacha', params: { poolId: id } }"
                class="card-pool-item">
                <h2>{{ pool.name }}</h2>
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { cardPools } from '@/data/cardPools'; // 导入卡池数据
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
    display: block;
    /* 使得整个区域可点击 */
    width: 280px;
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
</style>
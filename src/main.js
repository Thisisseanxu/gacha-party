import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router' // 导入路由相关功能

// 路由组件
import HomePage from './views/HomePage.vue' // 主页
import GachaPage from './views/GachaPage.vue' // 抽卡页面

// 2. 定义路由
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/gacha/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: 'Gacha',
    component: GachaPage,
    props: true, // 将路由参数作为props传递给组件
  },
  // TODO 404页面
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
})

// 创建Vue应用
const app = createApp(App)
app.use(router)
app.mount('#app')

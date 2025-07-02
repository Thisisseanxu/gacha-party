import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router' // 导入路由相关功能

// 路由组件
import NewHomePage from './views/HomePage.vue'// 主页
                                                  // To do分析页面
import GachaHomePage from './views/GachaHomePage.vue' // 抽卡主页
import GachaPage from './views/GachaPage.vue' // 抽卡页面
import TestGacha from './views/TestGacha.vue' // 测试抽卡页面
import RecordPage from './views/RecordPage.vue' // 抽卡记录页面

// 2. 定义路由
const routes = [
  // TODO: 为抽卡和抽卡分析添加新的主页
  {
    path: '/',
    name: '主页',
    component: HomePage,// 新主页
  },
  {
    path: '/chouka',
    name: '抽卡主页',
    component: GachaHomePage  // 原主页改为抽卡主页
  },
  {
    path: '/chouka/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: '抽卡页面',
    component: GachaPage,
    props: true, // 将路由参数作为props传递给组件
  },
  {
    path: '/test-gacha',
    name: '测试抽卡',
    component: TestGacha,
  },
  {
    path: '/fenxi',
    name: '抽卡记录分析',
    component: RecordPage,
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

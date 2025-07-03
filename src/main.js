import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router' // 导入路由相关功能

// 路由组件
import HomePage from './views/HomePage.vue' // 主页
import GachaPage from './views/GachaPage.vue' // 抽卡页面
import TestGacha from './views/TestGacha.vue' // 测试抽卡页面
import RecordPage from './views/RecordPage.vue' // 抽卡记录页面

// 2. 定义路由
const routes = [
  // TODO: 为抽卡和抽卡分析添加新的主页
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: {
      title: '盲盒派对小助手',
    },
  },
  {
    path: '/chouka', // 抽卡页面的路由
    name: '抽卡主页',
    component: HomePage,
    meta: {
      title: '抽卡模拟器主页 - 盲盒派对小助手',
    },
  },
  {
    path: '/chouka/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: '抽卡页面',
    component: GachaPage,
    props: true, // 将路由参数作为props传递给组件
    meta: {
      title: '抽卡模拟器 - 盲盒派对小助手',
    },
  },
  {
    path: '/test-gacha',
    name: '测试抽卡',
    component: TestGacha,
    meta: {
      title: '测试抽卡页面',
    },
  },
  {
    path: '/fenxi',
    name: '抽卡记录分析',
    component: RecordPage,
    meta: {
      title: '抽卡记录分析 - 盲盒派对小助手',
    },
  },
  // TODO 404页面
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
})

const defaultTitle = '盲盒派对小助手'
router.afterEach((to) => {
  // 如果路由有 meta.title，则使用它，否则使用默认标题
  document.title = to.meta.title || defaultTitle
})

// 创建Vue应用
const app = createApp(App)
app.use(router)
app.mount('#app')

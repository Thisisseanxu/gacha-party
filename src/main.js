import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router' // 导入路由相关功能

// 路由组件
import HomePage from './views/HomePage.vue'

// 定义路由
const routes = [
  {
    path: '/',
    name: '主页',
    component: HomePage,
    meta: {
      title: '织夜工具箱',
    },
  },
  {
    path: '/about',
    name: '关于',
    component: () => import('./views/AboutPage.vue'), // 关于页面组件
    meta: {
      title: '关于 - 织夜工具箱',
    },
  },
  {
    path: '/chouka',
    name: '抽卡模拟器主页',
    component: () => import('./views/GachaHomePage.vue'), // 抽卡模拟器主页组件
    meta: {
      title: '抽卡模拟器主页 - 织夜工具箱',
    },
  },
  {
    path: '/chouka/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: '抽卡模拟器',
    component: () => import('./views/GachaPage.vue'), // 抽卡页面组件
    props: true, // 将路由参数作为props传递给组件
    meta: {
      title: '抽卡模拟器 - 织夜工具箱',
    },
  },
  {
    path: '/choukatiaozhansai/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: '抽卡挑战赛',
    component: () => import('./views/GachaChallangePage.vue'), // 抽卡挑战赛页面组件
    props: true, // 将路由参数作为props传递给组件
    meta: {
      title: '抽卡挑战赛 - 熊月定制版',
    },
  },
  {
    path: '/zidingyichouka',
    name: '自定义卡池',
    component: () => import('./views/CustomGachaPage.vue'), // 自定义卡池页面组件
    meta: {
      title: '自定义卡池 - 织夜工具箱',
    },
  },
  {
    path: '/test-gacha',
    name: '测试抽卡',
    component: () => import('./views/TestGacha.vue'), // 测试抽卡页面组件
    meta: {
      title: '测试抽卡页面',
    },
  },
  {
    path: '/fenxi',
    name: '抽卡记录分析',
    component: () => import('./views/RecordPage.vue'), // 抽卡记录分析页面组件
    meta: {
      title: '抽卡记录分析 - 织夜工具箱',
    },
  },
  {
    path: '/daoyan',
    name: '导演模式',
    component: () => import('./views/CustomChatPage.vue'), // 导演模式页面组件
    meta: {
      title: '导演模式 - 织夜工具箱',
    },
  },
  {
    path: '/huizhang',
    name: '徽章编辑器',
    component: () => import('./views/HuizhangPage.vue'), // 徽章编辑器页面组件
    meta: {
      title: '徽章编辑器 - 织夜工具箱',
    },
  },
  {
    path: '/zako',
    name: 'Zako',
    component: () => import('./views/ZakoPage.vue'),
    meta: {
      title: 'Zako - 织夜工具箱',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('./views/NotFound.vue'),
  }, // 404 页面处理
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
})

const defaultTitle = '织夜工具箱'
router.afterEach((to) => {
  // 如果路由有 meta.title，则使用它，否则使用默认标题
  document.title = to.meta.title || defaultTitle
})

// 创建Vue应用
const app = createApp(App)
app.use(router)
app.mount('#app')

import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router' // 导入路由相关功能
import { loadCards } from '@/data/cards.js'
import { updatePageMeta } from '@/utils/pageMeta.js'
import { installMobileQQShareSync } from '@/utils/qqShare.js'
import { initializeTheme } from '@/styles/theme.js'
import '@/styles/theme.css'

// 路由组件
import HomePage from './views/HomePage.vue'
import { cardPoolsInOrder } from '@/data/cardPools'

const latestPoolId = cardPoolsInOrder[0][0]

initializeTheme()

// 定义路由
const routes = [
  {
    path: '/',
    name: '主页',
    component: HomePage,
    meta: {
      title: '织夜工具箱｜盲盒派对玩家工具站',
      description:
        '面向《盲盒派对》玩家的实用工具箱，提供抽卡模拟、抽卡记录分析、徽章攻略、UP 计时器与角色性格匹配等功能。',
    },
  },
  {
    path: '/about',
    name: '关于',
    component: () => import('./views/AboutPage.vue'), // 关于页面组件
    meta: {
      title: '关于 | 织夜工具箱',
      description: '了解织夜工具箱的功能、版本、作者与反馈渠道。',
    },
  },
  {
    path: '/chouka',
    alias: '/chouka/',
    redirect: () => `/chouka/${latestPoolId}`,
  },
  {
    path: '/chouka/:poolId', // 动态路由参数:poolId 用于区分不同的卡池
    name: '抽卡模拟器',
    component: () => import('./views/GachaPage.vue'), // 抽卡页面组件
    props: true, // 将路由参数作为props传递给组件
    meta: {
      title: '抽卡模拟器 | 织夜工具箱',
      description: '模拟《盲盒派对》卡池抽取、保底与 UP 机制，体验不同卡池的抽卡结果。',
    },
  },
  {
    path: '/zidingyichouka',
    name: '自定义卡池',
    component: () => import('./views/CustomGachaPage.vue'), // 自定义卡池页面组件
    meta: {
      title: '自定义卡池 | 织夜工具箱',
      description: '自由配置角色、概率与保底规则，创建并分享你的《盲盒派对》自定义卡池。',
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
      title: '抽卡记录分析 | 织夜工具箱',
      description: '导入并分析《盲盒派对》抽卡记录，查看出货率、保底分布与角色统计。',
    },
  },
  {
    path: '/fenxi/dev',
    name: '抽卡记录调试',
    component: () => import('./views/RecordDevPage.vue'),
    meta: {
      title: '抽卡记录调试 | 织夜工具箱',
    },
  },
  {
    path: '/daoyan',
    name: '导演模式',
    component: () => import('./views/CustomChatPage.vue'), // 导演模式页面组件
    meta: {
      title: '导演模式 | 织夜工具箱',
      description: '使用《盲盒派对》角色素材制作自定义聊天与剧情图片。',
    },
  },
  {
    path: '/huizhang',
    name: '徽章攻略助手',
    component: () => import('./views/HuizhangHome.vue'),
    meta: {
      title: '徽章攻略助手 | 织夜工具箱',
      description: '查询《盲盒派对》角色徽章搭配与属性攻略，快速筛选适合的徽章方案。',
    },
  },
  {
    path: '/huizhang/char/:charId',
    name: '角色徽章攻略',
    component: () => import('./views/HuizhangCharPage.vue'),
    props: true,
    meta: {
      title: '角色徽章攻略 | 织夜工具箱',
    },
  },
  {
    path: '/huizhang/edit',
    name: '徽章攻略编辑器',
    component: () => import('./views/HuizhangPage.vue'),
    meta: {
      title: '徽章攻略编辑器 | 织夜工具箱',
    },
  },
  {
    path: '/huizhang/admin',
    name: '徽章攻略管理',
    component: () => import('./views/HuizhangAdmin.vue'),
    meta: {
      title: '徽章攻略管理 | 织夜工具箱',
    },
  },
  {
    path: '/zako',
    name: 'Zako',
    component: () => import('./views/ZakoPage.vue'),
    meta: {
      title: 'Zako | 织夜工具箱',
    },
  },
  {
    path: '/fuke',
    name: '复刻计时器',
    component: () => import('./views/RoleAppearancePage.vue'),
    meta: {
      title: 'UP计时器 | 织夜工具箱',
      description: '查看《盲盒派对》角色卡池登场与复刻间隔，辅助判断未来 UP 节奏。',
    },
  },
  {
    path: '/quiz',
    name: '角色性格匹配',
    component: () => import('./views/PersonalityQuizPage.vue'),
    meta: {
      title: '角色性格匹配 | 织夜工具箱',
      description: '完成趣味性格测试，看看你与哪位《盲盒派对》角色最相似。',
    },
  },
  {
    path: '/quiz/dev',
    name: '角色四维倾向一览',
    component: () => import('./views/CharacterTendenciesPage.vue'),
    meta: {
      title: '角色四维倾向一览 | 织夜工具箱',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('./views/NotFound.vue'),
  }, // 404 页面处理
]

// 仅在开发模式下注册路由
if (import.meta.env.DEV) {
  routes.push({
    path: '/dev',
    name: '开发界面',
    component: () => import('./views/DevEditorPage.vue'),
    meta: { title: '开发界面' },
  })
}

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
})

router.afterEach((to) => {
  updatePageMeta(to)
})

async function bootstrap() {
  await loadCards()

  // 创建Vue应用
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
  installMobileQQShareSync()
}

bootstrap()

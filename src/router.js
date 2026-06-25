import HomePage from './views/HomePage.vue'
import { cardPoolsInOrder } from '@/data/cardPools.js'

const latestPoolId = cardPoolsInOrder[0][0]

export const SPA_ONLY_PATHS = [
  '/test-gacha',
  '/fenxi/dev',
  '/quiz/dev',
  '/huizhang/edit',
  '/huizhang/admin',
]

export const routes = [
  {
    path: '/',
    name: '主页',
    component: HomePage,
    meta: {
      title: '织夜工具箱｜盲盒派对玩家工具站',
      description: '面向《盲盒派对》玩家的实用工具箱，提供抽卡记录分析、徽章攻略等功能',
      ssg: true,
    },
  },
  {
    path: '/about',
    name: '关于',
    component: () => import('./views/AboutPage.vue'),
    meta: {
      title: '关于 | 织夜工具箱',
      description: '了解织夜工具箱',
      ssg: true,
    },
  },
  {
    path: '/chouka',
    alias: '/chouka/',
    redirect: () => `/chouka/${latestPoolId}`,
    meta: { ssg: true },
  },
  {
    path: '/chouka/:poolId',
    name: '抽卡模拟器',
    component: () => import('./views/GachaPage.vue'),
    props: true,
    meta: {
      title: '抽卡模拟器 | 织夜工具箱',
      description: '模拟《盲盒派对》卡池抽取，试试你的手气，体验不同卡池的抽卡结果',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/zidingyichouka',
    name: '自定义卡池',
    component: () => import('./views/CustomGachaPage.vue'),
    meta: {
      title: '自定义卡池 | 织夜工具箱',
      description: '自由配置角色、概率与保底规则，创建并分享你的《盲盒派对》自定义卡池',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/test-gacha',
    name: '测试抽卡',
    component: () => import('./views/TestGacha.vue'),
    meta: {
      title: '测试抽卡页面',
      robots: 'noindex, nofollow',
      ssg: false,
      needsCards: true,
    },
  },
  {
    path: '/fenxi',
    name: '抽卡记录分析',
    component: () => import('./views/RecordPage.vue'),
    meta: {
      title: '抽卡记录分析 | 织夜工具箱',
      description: '导入并分析《盲盒派对》抽卡记录，查看出货率、保底分布与角色统计',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/fenxi/dev',
    name: '抽卡记录调试',
    component: () => import('./views/RecordDevPage.vue'),
    meta: {
      title: '抽卡记录调试 | 织夜工具箱',
      robots: 'noindex, nofollow',
      ssg: false,
      needsCards: true,
    },
  },
  {
    path: '/daoyan',
    name: '导演模式',
    component: () => import('./views/CustomChatPage.vue'),
    meta: {
      title: '导演模式 | 织夜工具箱',
      description: '使用《盲盒派对》角色素材制作自定义聊天与剧情图片',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/huizhang',
    name: '徽章攻略助手',
    component: () => import('./views/HuizhangHome.vue'),
    meta: {
      title: '徽章攻略助手 | 织夜工具箱',
      description: '查询《盲盒派对》角色徽章搭配与属性攻略，快速筛选适合的徽章方案',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/huizhang/char/:charId',
    name: '角色徽章攻略',
    component: () => import('./views/HuizhangCharPage.vue'),
    props: true,
    meta: {
      title: '角色徽章攻略 | 织夜工具箱',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/huizhang/edit',
    name: '徽章攻略编辑器',
    component: () => import('./views/HuizhangPage.vue'),
    meta: {
      title: '徽章攻略编辑器 | 织夜工具箱',
      robots: 'noindex, nofollow',
      ssg: false,
      needsCards: true,
    },
  },
  {
    path: '/huizhang/admin',
    name: '徽章攻略管理',
    component: () => import('./views/HuizhangAdmin.vue'),
    meta: {
      title: '徽章攻略管理 | 织夜工具箱',
      robots: 'noindex, nofollow',
      ssg: false,
      needsCards: true,
    },
  },
  {
    path: '/zako',
    name: 'Zako',
    component: () => import('./views/ZakoPage.vue'),
    meta: {
      title: 'Zako | 织夜工具箱',
      ssg: true,
    },
  },
  {
    path: '/fuke',
    name: '复刻计时器',
    component: () => import('./views/RoleAppearancePage.vue'),
    meta: {
      title: 'UP计时器 | 织夜工具箱',
      description: '查看《盲盒派对》角色卡池登场与复刻间隔，辅助判断未来 UP 节奏',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/quiz',
    name: '角色性格匹配',
    component: () => import('./views/PersonalityQuizPage.vue'),
    meta: {
      title: '角色性格匹配 | 织夜工具箱',
      description: '完成趣味性格测试，看看你与哪位《盲盒派对》角色最相似',
      ssg: true,
      needsCards: true,
    },
  },
  {
    path: '/quiz/dev',
    name: '角色四维倾向一览',
    component: () => import('./views/CharacterTendenciesPage.vue'),
    meta: {
      title: '角色四维倾向一览 | 织夜工具箱',
      robots: 'noindex, nofollow',
      ssg: false,
      needsCards: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('./views/NotFound.vue'),
    meta: {
      title: '网页未找到 | 织夜工具箱',
      robots: 'noindex, nofollow',
      ssg: false,
    },
  },
]

if (import.meta.env.DEV) {
  routes.splice(routes.length - 1, 0, {
    path: '/dev',
    name: '开发界面',
    component: () => import('./views/DevEditorPage.vue'),
    meta: {
      title: '开发界面',
      robots: 'noindex, nofollow',
      ssg: false,
    },
  })
}

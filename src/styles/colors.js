import { reactive, watch } from 'vue'

const savedTheme = localStorage.getItem('app_theme') || 'dark'
export const currentTheme = reactive({ value: savedTheme })

const dark = {
  // --- 基础背景色 ---
  background: {
    primary: 'rgba(18, 18, 18, 1)', // 页面最外层背景
    content: 'rgba(26, 27, 32, 1)', // 内容容器背景
    light: 'rgba(44, 45, 50, 1)', // 输入框、统计框等较亮的背景
    lighter: 'rgba(58, 59, 64, 1)', // 按钮、边框等较浅背景
    hover: 'rgba(74, 75, 80, 1)', // 按钮悬浮状态背景
    avatar: 'rgba(51, 51, 51, 1)', // 头像占位背景
    darker: '#111111', // 更深的背景（用于预览区等）
    overlay: 'rgba(0, 0, 0, 0.6)', // 遮罩层背景
  },
  // --- 文本颜色 ---
  text: {
    primary: 'rgba(247, 244, 239, 1)', // 主要文字 (白色)
    secondary: 'rgba(204, 204, 204, 1)', // 次要文字 (灰色)
    tertiary: 'rgba(136, 136, 136, 1)', // 最次要的文字 (更深的灰色)
    black: 'rgba(26, 27, 32, 1)', // 用于亮色背景上的深色文字
    disabled: 'rgba(102, 102, 102, 1)', // 禁用状态的文字
    light: 'rgba(221, 221, 221, 1)', // 亮灰色文字
    highlight: 'rgb(235, 201, 80)', // 高亮文字
    white: '#ffffff', // 纯白文字
  },
  // --- 品牌/功能色 ---
  brand: {
    primary: 'rgba(232, 169, 100, 1)', // 主要高亮/按钮颜色
    primaryBackground: 'rgba(232, 169, 100, 0.15)', // 主要高亮背景
    hover: 'rgba(240, 195, 138, 1)', // 高亮色悬浮
    confirm: 'rgba(76, 175, 80, 1)', // 确认/成功操作颜色
    confirmHover: 'rgba(67, 160, 71, 1)', // 确认悬浮
    cancel: 'rgba(244, 67, 54, 1)', // 取消/删除操作颜色
    cancelHover: 'rgba(229, 57, 53, 1)', // 取消悬浮
    disabled: '#71717a', // 品牌色禁用状态
  },
  // --- 游戏内特定颜色 ---
  game: {
    primary: 'rgba(126, 12, 255, 1)', // 主题色
    primaryText: 'rgba(128, 0, 255, 1)', // 白底文字颜色
    backgroundBlack: 'rgba(45, 39, 57, 1)', // 黑色背景
    narratorBg: '#4B3F66', // 旁白背景
    narratorText: '#C0BCC9', // 旁白文字
  },
  // --- 稀有度颜色 ---
  rarity: {
    sp: 'rgba(255, 85, 61, 1)', // SP 稀有度颜色
    ssr: 'rgba(255, 166, 40, 1)', // SSR 稀有度颜色
    sr: 'rgba(203, 45, 255, 1)', // SR 稀有度颜色
    r: 'rgba(86, 146, 255, 1)', // R 稀有度颜色
  },
  // --- 状态与通知颜色 ---
  status: {
    error: 'rgba(255, 107, 107, 1)', // 错误文字/边框
    errorBg: 'rgba(255, 107, 107, 0.1)', // 错误信息背景
    success: 'rgba(82, 196, 26, 1)', // 成功颜色
    successBg: 'rgba(82, 196, 26, 0.1)', // 成功背景
  },
  // --- 历史记录进度条颜色 ---
  colorOfLuck: {
    veryLow: 'rgba(40, 167, 69, 1)', // 绿色 (低抽数)
    low: 'rgba(60, 180, 90, 1)', // 较浅的绿色 (较低抽数)
    medium: 'rgba(192, 154, 39, 1)', // 黄色 (中等抽数)
    high: 'rgba(199, 127, 32, 1)', // 橙色 (较高抽数)
    veryHigh: 'rgba(201, 49, 64, 1)', // 红色 (高抽数)
    background: 'rgba(74, 61, 76, 1)', // 进度条的背景
  },
  // --- 抽卡相关颜色 ---
  gacha: {
    singlePull: 'rgba(225, 16, 208, 1)', // 单抽颜色
    singlePullHover: 'rgba(182, 16, 194, 1)', // 单抽悬浮
    tenPull: 'rgb(230, 195, 0)', // 十连颜色
    tenPullHover: 'rgb(200, 170, 0)', // 十连悬浮
    confirm: 'rgb(255, 215, 0)', // 确认颜色
    confirmHover: 'rgb(240, 235, 143)', // 确认悬浮
  },
  // --- 边框颜色 ---
  border: {
    primary: 'rgba(58, 59, 64, 1)', // 主要边框
    secondary: 'rgba(44, 45, 50, 1)', // 次要边框
    dashed: '#555555', // 虚线边框
    lighter: 'rgba(58, 59, 64, 1)', // 更浅的边框
  },
  // --- 阴影 ---
  shadow: {
    primary: 'rgba(0, 0, 0, 0.3)', // 用于卡片、列表项的常规阴影
    primaryHover: 'rgba(0, 0, 0, 0.5)', // 用于悬浮时更明显的阴影
    light: 'rgba(255, 255, 255, 0.3)', // 用于深色背景上的阴影
    lightHover: 'rgba(255, 255, 255, 0.5)', // 用于深色背景上的悬浮阴影
  },
  // --- 其他 ---
  scrollbar: 'rgba(85, 85, 85, 1)', // 滚动条滑块颜色
  textShadow: 'rgba(0, 0, 0, 0.6)', // 文本阴影

  // --- 组件特定颜色 (新增) ---
  input: {
    background: '#2c2e33', // 输入框背景
    text: '#ffffff', // 输入框文字
    border: '#3f3f46', // 输入框边框
  },
  button: {
    defaultBg: '#ccc', // 默认按钮背景
    defaultText: '#344767', // 默认按钮文字
    hoverBg: '#344767', // 默认按钮悬浮背景
    hoverText: '#ccc', // 默认按钮悬浮文字
    secondaryBg: '#444444', // 次要按钮背景
    secondaryText: '#ffffff', // 次要按钮文字
    infoBg: '#607d8b', // 信息按钮背景
    dangerBg: '#fff1f0', // 危险按钮背景
    dangerText: '#cf1322', // 危险按钮文字
    dangerBorder: '#ffa39e', // 危险按钮边框
  },
  menu: {
    background: '#999999', // 菜单背景
    buttonBg: '#f9f9f9', // 菜单按钮背景
    buttonText: '#333333', // 菜单按钮文字
    buttonBorder: '#cccccc', // 菜单按钮边框
    buttonHoverBg: '#f0f0f0', // 菜单按钮悬浮背景
  },
  preview: {
    panelBg: 'rgba(30, 30, 40, 0.9)', // 预览面板背景
    text: '#ddd', // 预览文字
    highlight: '#ffca28', // 预览高亮
    shadow: '2px 2px 4px rgba(0, 0, 0, 0.8)', // 预览阴影
    watermark: 'rgba(255, 255, 255, 0.2)', // 水印
    author: 'rgba(0, 0, 0, 0.2)', // 作者署名
    overlay: 'rgba(0, 0, 0, 0.6)', // 推荐星级遮罩
    secondary: 'rgba(204, 204, 204, 1)', // 次要文字
    divideline: 'rgba(58, 59, 64, 1)', // 分隔线
  },
}

const light = {
  background: {
    primary: '#e5e6e7',
    content: '#f0f0f0',
    light: '#f8f9fa',
    lighter: '#e5e7eb',
    hover: '#d1d5db',
    avatar: '#e5e7eb',
    darker: '#e5e7eb',
    overlay: 'rgba(0, 0, 0, 0.2)',
  },
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    black: '#000000',
    disabled: '#9ca3af',
    light: '#4b5563',
    highlight: '#2563eb',
    white: '#ffffff',
  },
  brand: {
    primary: '#fbbf24',
    primaryBackground: 'rgba(251, 191, 36, 0.15)',
    hover: '#f59e0b',
    confirm: '#10b981',
    confirmHover: '#059669',
    cancel: '#ef4444',
    cancelHover: '#dc2626',
    disabled: '#d1d5db',
  },
  game: { ...dark.game }, // 游戏内颜色保持一致
  rarity: { ...dark.rarity }, // 稀有度颜色保持一致
  status: { ...dark.status }, // 状态颜色保持一致
  colorOfLuck: {
    veryLow: 'rgba(52, 199, 89, 1)', // 更鲜艳的绿色
    low: 'rgba(100, 210, 120, 1)', // 浅绿色
    medium: 'rgba(255, 190, 0, 1)', // 明亮的黄色
    high: 'rgba(255, 149, 0, 1)', // 明亮的橙色
    veryHigh: 'rgba(255, 59, 48, 1)', // 明亮的红色
    background: '#e5e7eb', // 进度条背景
  },
  gacha: { ...dark.gacha }, // 抽卡颜色保持一致
  border: {
    primary: 'rgba(229, 231, 235, 1)',
    secondary: 'rgba(209, 213, 219, 1)',
    dashed: '#9ca3af',
    lighter: 'rgba(174, 176, 189, 1)',
  },
  shadow: {
    primary: 'rgba(255, 255, 255, 0.3)',
    primaryHover: 'rgba(255, 255, 255, 0.5)',
    light: 'rgba(0, 0, 0, 0.3)',
    lightHover: 'rgba(0, 0, 0, 0.5)',
  },
  scrollbar: '#d1d5db',
  textShadow: 'none',

  input: {
    background: '#ffffff',
    text: '#1f2937',
    border: '#d1d5db',
  },
  button: {
    defaultBg: '#e5e7eb',
    defaultText: '#374151',
    hoverBg: '#374151',
    hoverText: '#e5e7eb',
    secondaryBg: '#e5e7eb',
    secondaryText: '#374151',
    infoBg: '#607d8b',
    dangerBg: '#fef2f2',
    dangerText: '#dc2626',
    dangerBorder: '#fecaca',
  },
  menu: {
    background: '#ffffff',
    buttonBg: '#f3f4f6',
    buttonText: '#1f2937',
    buttonBorder: '#e5e7eb',
    buttonHoverBg: '#e5e7eb',
  },
  preview: { ...dark.preview }, // 预览区域保持深色风格
}

export const colors = reactive(JSON.parse(JSON.stringify(dark)))

const updateColors = () => {
  const target = currentTheme.value === 'light' ? light : dark
  const deepUpdate = (targetObj, sourceObj) => {
    for (const key in sourceObj) {
      if (
        typeof sourceObj[key] === 'object' &&
        sourceObj[key] !== null &&
        !Array.isArray(sourceObj[key])
      ) {
        if (!targetObj[key]) targetObj[key] = {}
        deepUpdate(targetObj[key], sourceObj[key])
      } else {
        targetObj[key] = sourceObj[key]
      }
    }
  }
  deepUpdate(colors, target)
}

watch(
  () => currentTheme.value,
  () => {
    updateColors()
    localStorage.setItem('app_theme', currentTheme.value)
  },
  { immediate: true },
)

export const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
}

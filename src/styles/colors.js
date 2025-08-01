/**
 * 应用的颜色主题常量。
 */
export const colors = {
  // 基础背景色
  background: {
    primary: 'rgba(18, 18, 18, 1)', // 页面最外层背景
    content: 'rgba(26, 27, 32, 1)', // 内容容器背景
    light: 'rgba(44, 45, 50, 1)', // 输入框、统计框等较亮的背景
    lighter: 'rgba(58, 59, 64, 1)', // 按钮、边框等
    hover: 'rgba(74, 75, 80, 1)', // 按钮悬浮
    avatar: 'rgba(51, 51, 51, 1)', // 头像占位背景
  }, // 文本颜色
  text: {
    primary: 'rgba(255, 255, 255, 1)', // 主要文字 (白色)
    secondary: 'rgba(204, 204, 204, 1)', // 次要文字 (灰色)
    tertiary: 'rgba(136, 136, 136, 1)', // 最次要的文字 (更深的灰色)
    black: 'rgba(26, 27, 32, 1)', // 用于亮色背景上的深色文字
    disabled: 'rgba(102, 102, 102, 1)', // 禁用状态的文字
    light: 'rgba(221, 221, 221, 1)', // 亮灰色文字
    highlight: 'rgb(235, 201, 80)', // 高亮文字
  }, // 高亮色
  brand: {
    primary: 'rgba(232, 169, 100, 1)', // 主要高亮/按钮颜色
    primaryBackground: 'rgba(232, 169, 100, 0.15)', // 主要高亮背景
    hover: 'rgba(240, 195, 138, 1)', // 高亮色悬浮
  }, // 稀有度颜色
  rarity: {
    sp: 'rgba(222, 33, 30, 1)',
    ssr: 'rgba(232, 119, 33, 1)',
    sr: 'rgba(178, 30, 251, 1)',
    r: 'rgba(24, 138, 250, 1)',
  }, // 状态与通知颜色
  status: {
    error: 'rgba(255, 107, 107, 1)', // 错误文字/边框
    errorBg: 'rgba(255, 107, 107, 0.1)', // 错误信息背景
  }, // 历史记录进度条颜色
  colorOfLuck: {
    veryLow: 'rgba(40, 167, 69, 1)', // 绿色 (低抽数)
    low: 'rgba(60, 180, 90, 1)', // 较浅的绿色 (较低抽数)
    medium: 'rgba(192, 154, 39, 1)', // 黄色 (中等抽数)
    high: 'rgba(199, 127, 32, 1)', // 橙色 (较高抽数)
    veryHigh: 'rgba(201, 49, 64, 1)', // 红色 (高抽数)
    background: 'rgba(74, 61, 76, 1)', // 进度条的背景（SP历史项的原始背景）
  },
  // 新增：抽卡相关颜色
  gacha: {
    singlePull: '#e110d0',
    singlePullHover: '#b610c2',
    tenPull: 'rgb(230, 195, 0)',
    tenPullHover: 'rgb(200, 170, 0)',
    confirm: 'rgb(255, 215, 0)',
    confirmHover: 'rgb(240, 235, 143)',
  },
  // 新增：边框颜色
  border: {
    primary: 'rgba(58, 59, 64, 1)',
    secondary: 'rgba(44, 45, 50, 1)',
  },
  shadow: {
    card: 'rgba(0, 0, 0, 0.3)', // 用于卡片、列表项的常规阴影
    cardHover: 'rgba(0, 0, 0, 0.5)', // 用于悬浮时更明显的阴影
  },
  // 其他
  scrollbar: 'rgba(85, 85, 85, 1)', // 滚动条滑块颜色
  textShadow: 'rgba(0, 0, 0, 0.6)', // 文本阴影
}

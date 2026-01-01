// 判断为生产环境则默认禁用log输出
let log_enabled = import.meta.env.DEV
let warn_enabled = true
let error_enabled = true

/**
 * 设置日志级别
 *
 * @param {'debug' | 'warn' | 'error' | 'none'} level - 选定的日志级别。
 * * 'debug' - 启用所有日志输出。
 * * 'warn' - 仅启用警告和错误日志输出。
 * * 'error' - 仅启用错误日志输出。
 * * 'none' - 禁用所有日志输出。
 * @example
 * import { setLogLevel } from '@/utils/logger';
 * setLogLevel('debug') // 启用所有日志输出
 * setLogLevel('warn') // 仅启用警告和错误日志输出
 * setLogLevel('error') // 仅启用错误日志输出
 * setLogLevel('none') // 禁用所有日志输出
 */
export function setLogLevel(level) {
  log_enabled = true
  warn_enabled = true
  error_enabled = true
  switch (level) {
    case 'debug':
      break
    case 'warn':
      log_enabled = false
      break
    case 'error':
      log_enabled = false
      warn_enabled = false
      break
    default:
      break
  }
}

/**
 * 日志管理器，可以快速的控制日志是否输出
 *
 * @namespace logger
 * @property {function(...any): void} log - 记录普通日志信息
 * @property {function(...any): void} warn - 记录警告信息
 * @property {function(...any): void} error - 记录错误信息
 * @example
 * import { logger } from '@/utils/logger';
 * logger.log('抽到了限定角色！', { cardId: 123 })
 * logger.warn('连续100个抽卡未出SSR', new Error('可能是BUG'))
 * logger.error('抽到了不存在的角色', new Error('角色ID错误'))
 *
 */
export const logger = {
  /**
   * 记录普通日志信息
   * @param {...any} args - 要打印的参数
   */
  log(...args) {
    if (log_enabled) {
      console.log('日志：', ...args)
    }
  },

  /**
   * 记录警告信息
   * @param {...any} args - 要打印的参数
   */
  warn(...args) {
    if (warn_enabled) {
      console.warn('警告：', ...args)
    }
  },

  /**
   * 记录错误信息
   * @param {...any} args - 要打印的参数
   */
  error(...args) {
    if (error_enabled) {
      console.error('错误：', ...args)
    }
  },

  custom(message, ...args) {
    console.log(message, ...args)
  },
}

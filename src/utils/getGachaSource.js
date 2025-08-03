import pako from 'pako' // 引入pako库解压缩json数据
import { cardMap } from '@/data/cards' // 引入全局的cardMap，用于通过ID查找卡牌

/**
 * 根据路由信息获取卡池数据源。
 * 如果是自定义卡池，则解码、解压并还原卡池配置。
 * 否则，返回预设卡池的ID。
 * @param {object} route - Vue Router的路由对象
 * @returns {object|string} - 返回完整的卡池配置对象或预设卡池ID字符串
 */
export const getGachaSource = (route) => {
  // 检查是否是自定义卡池并带有数据
  if (route.params.poolId === 'custom' && route.query.data) {
    try {
      // Base64 解码 -> pako 解压缩 -> JSON 解析
      const binaryString = atob(route.query.data)
      const compressed = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        compressed[i] = binaryString.charCodeAt(i)
      }
      const jsonString = pako.inflate(compressed, { to: 'string' })
      const minifiedConfig = JSON.parse(jsonString)

      // 将最小化配置 "翻译" 回完整的卡池配置对象
      const finalPoolConfig = {
        id: 'custom',
        name: minifiedConfig.n, // n -> name
        rates: {
          SP: minifiedConfig.r.s, // r.s -> rates.SP
          SSR: minifiedConfig.r.x, // r.x -> rates.SSR
          SR: minifiedConfig.r.r, // r.r -> rates.SR
        },
        // 从ID数组还原完整的卡牌对象数组
        cards: [
          ...(minifiedConfig.c.s || []).map((id) => cardMap.get(id)), // c.s -> SP
          ...(minifiedConfig.c.x || []).map((id) => cardMap.get(id)), // c.x -> SSR
          ...(minifiedConfig.c.r || []).map((id) => cardMap.get(id)), // c.r -> SR
          ...(minifiedConfig.c.n || []).map((id) => cardMap.get(id)), // c.n -> R
        ].filter(Boolean), // 使用 .filter(Boolean) 移除任何可能因ID不存在而产生的undefined项
        rules: {},
      }

      // 还原SP规则 (u.s)
      if (minifiedConfig.u && minifiedConfig.u.s) {
        finalPoolConfig.rules.SP = {
          pity: 60, // 硬编码的规则
          boostAfter: 40, // 硬编码的规则
          boost: 0.02, // 硬编码的规则
          UpTrigger: true,
          SelectUpCards: !!minifiedConfig.u.s.l,
          UpCards: minifiedConfig.u.s.d,
        }
      }

      // 还原SSR规则 (u.x)
      if (minifiedConfig.u && minifiedConfig.u.x) {
        finalPoolConfig.rules.SSR = {
          doubleRateCards: minifiedConfig.u.x.b,
        }
      }

      return finalPoolConfig
    } catch (error) {
      console.error('解析自定义卡池数据失败:', error)
      // 如果解析失败，返回一个默认卡池ID
      return 'Normal01'
    }
  }

  // 如果不是自定义卡池模式，则直接使用路由参数中的 poolId
  return route.params.poolId
}

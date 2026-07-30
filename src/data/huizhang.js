import { cardMap } from '@/data/cards.js'
import huizhangData from 'virtual:gacha-party-huizhang'

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`huizhang.json 格式错误：${field} 必须是对象`)
  }
  return value
}

export const HUIZHANG_SHAPES = requireObject(huizhangData.shapes, 'shapes')
export const HUIZHANG_RARITY = requireObject(huizhangData.rarity, 'rarity')
export const HUIZHANG_TYPES = requireObject(huizhangData.types, 'types')
export const CHAR_HUIZHANG_CONFIG = requireObject(huizhangData.charConfig, 'charConfig')

export const getHuizhangBgUrl = (rarityId, shape) => `/images/huizhang/bg_${shape}_${rarityId}.webp`

export const getCharConfig = (charId) => {
  const baseConfig = CHAR_HUIZHANG_CONFIG[charId]
  if (!baseConfig) return null

  const card = cardMap.get(String(charId))
  return {
    ...baseConfig,
    theme: card?.theme || null,
    image_url: card?.qban_url || null,
  }
}

// 徽章形状 (对应文件名中的标识)
export const HUIZHANG_SHAPES = {
  CIRCLE: 'support', // 支援徽章 (圆形)
  DIAMOND: 'attack', // 攻击徽章 (菱形)
  SHIELD: 'defence', // 生命徽章 (盾形)
}

// 徽章稀有度
export const HUIZHANG_RARITY = {
  BLUE: { id: '1', name: '蓝' },
  PURPLE: { id: '2', name: '紫' },
  GOLD: { id: '3', name: '金' },
  RED: { id: '4', name: '红' },
}

// 角色所属主题（徽章左下角小图标）
export const HUIZHANG_THEMES = {
  cake: { id: 'cake', name: '甜品', icon: '/images/huizhang/attr_color_cake.webp' },
  dream: { id: 'dream', name: '梦境', icon: '/images/huizhang/attr_color_dream.webp' },
  elec: { id: 'elec', name: '电玩', icon: '/images/huizhang/attr_color_elec.webp' },
  music: { id: 'music', name: '电音', icon: '/images/huizhang/attr_color_music.webp' },
  ice: { id: 'ice', name: '寒冰', icon: '/images/huizhang/attr_color_ice.webp' },
  fire: { id: 'fire', name: '火焰', icon: '/images/huizhang/attr_color_fire.webp' },
  water: { id: 'water', name: '流水', icon: '/images/huizhang/attr_color_water.webp' },
  eiji: { id: 'eiji', name: '异界', icon: '/images/huizhang/attr_color_eiji.webp' },
}

// 获取徽章背景图片路径
export const getHuizhangBgUrl = (rarityId, shape) => {
  // shape: support(支援), attack(攻击), defence(生命)
  // rarity: 1(蓝), 2(紫), 3(金), 4(红)
  return `/images/huizhang/bg_${shape}_${rarityId}.webp`
}

// 徽章类型 (主图标类型)
export const HUIZHANG_TYPES = {
  hp: { id: 'hp', name: '生命', icon: '/images/huizhang/510030.webp' },
  atk: { id: 'atk', name: '攻击', icon: '/images/huizhang/510020.webp' },
  sup: { id: 'sup', name: '支援', icon: '/images/huizhang/510130.webp' },
  crit: { id: 'crit', name: '暴击', icon: '/images/huizhang/510010.webp' },
  critdmg: { id: 'critdmg', name: '暴伤', icon: '/images/huizhang/510050.webp' },
  control: { id: 'control', name: '异常', icon: '/images/huizhang/510110.webp' },
  cd: { id: 'cd', name: '冷却', icon: '/images/huizhang/510140.webp' },
  xp: { id: 'xp', name: '大招', icon: '/images/huizhang/510040.webp' },
  physic: { id: 'physic', name: '物理', icon: '/images/huizhang/510060.webp' },
  electro: { id: 'electro', name: '电属性', icon: '/images/huizhang/510080.webp' },
  light: { id: 'light', name: '光属性', icon: '/images/huizhang/510070.webp' },
  ice: { id: 'ice', name: '冰属性', icon: '/images/huizhang/510120.webp' },
  water: { id: 'water', name: '水属性', icon: '/images/huizhang/510100.webp' },
  fire: { id: 'fire', name: '火属性', icon: '/images/huizhang/510090.webp' },
}

// 默认的角色徽章槽位配置，长度代表槽位数量
// key 为角色ID
export const CHAR_HUIZHANG_CONFIG = {
  1102: {
    shape: [
      // 徽章槽位形状配置，从左到右、从上到下
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1102.webp', // 角色Q版立绘
    theme: HUIZHANG_THEMES.cake, // 角色所属主题
  },
  1404: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1404.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1406: {
    shape: [HUIZHANG_SHAPES.DIAMOND, HUIZHANG_SHAPES.DIAMOND],
    image_url: '/images/qban/1406.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1104: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1104.webp',
    theme: HUIZHANG_THEMES.dream,
  },
}

// 获取角色的配置
export const getCharHuizhangSlots = (charId) => {
  return CHAR_HUIZHANG_CONFIG[charId] || null
}

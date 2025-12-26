// 徽章形状 (对应文件名中的标识)
export const HUIZHANG_SHAPES = {
  CIRCLE: 'support', // 支援徽章 (圆形)
  DIAMOND: 'attack', // 攻击徽章 (菱形)
  SHIELD: 'defence', // 生命徽章 (盾形)
}

// 徽章稀有度
export const HUIZHANG_RARITY = {
  NONE: { id: '0', name: '无' },
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
  none: { id: 'none', name: '无', icon: '/images/huizhang/none.webp' },
  hp: { id: 'hp', name: '生命', act2: 6, act4: 15, icon: '/images/huizhang/510030.webp' },
  atk: { id: 'atk', name: '攻击', act2: 6, act4: 15, icon: '/images/huizhang/510020.webp' },
  sup: { id: 'sup', name: '支援', act2: 6, act4: 15, icon: '/images/huizhang/510130.webp' },
  cri: { id: 'cri', name: '暴击', act2: 6, act4: 15, icon: '/images/huizhang/510010.webp' },
  cridmg: { id: 'cridmg', name: '暴伤', act2: 12, act4: 30, icon: '/images/huizhang/510050.webp' },
  control: {
    id: 'control',
    name: '异常伤害',
    act2: 30,
    act4: 30,
    act4extra: '30% 积蓄速率',
    icon: '/images/huizhang/510110.webp',
  },
  cd: { id: 'cd', name: '冷却', act2: 4, act4: 10, icon: '/images/huizhang/510140.webp' },
  xp: { id: 'xp', name: '奥义伤害', act2: 10, act4: 25, icon: '/images/huizhang/510040.webp' },
  physic: { id: 'physic', name: '物伤', act2: 8, act4: 20, icon: '/images/huizhang/510060.webp' },
  elec: { id: 'elec', name: '电伤', act2: 8, act4: 20, icon: '/images/huizhang/510080.webp' },
  light: { id: 'light', name: '光伤', act2: 8, act4: 20, icon: '/images/huizhang/510070.webp' },
  ice: { id: 'ice', name: '冰伤', act2: 8, act4: 20, icon: '/images/huizhang/510120.webp' },
  water: { id: 'water', name: '水伤', act2: 8, act4: 20, icon: '/images/huizhang/510100.webp' },
  fire: { id: 'fire', name: '火伤', act2: 8, act4: 20, icon: '/images/huizhang/510090.webp' },
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
  1110: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1110.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1111: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1111.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1906: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1906.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1211: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1211.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1212: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1212.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1309: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1309.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1312: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1312.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1311: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1311.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1408: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1408.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1709: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1709.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1710: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1710.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1711: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1711.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1502: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1502.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1610: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1610.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1609: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1609.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1503: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1503.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1809: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1809.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1811: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1811.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1810: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1810.webp',
    theme: HUIZHANG_THEMES.water,
  },
  11006: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/11006.webp',
    theme: HUIZHANG_THEMES.eiji,
  },
  11007: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/11007.webp',
    theme: HUIZHANG_THEMES.eiji,
  },
  11008: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/11008.webp',
    theme: HUIZHANG_THEMES.eiji,
  },
  11101: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/11101.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  11105: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/11105.webp',
    theme: HUIZHANG_THEMES.music,
  },
  11009: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/11009.webp',
    theme: HUIZHANG_THEMES.eiji,
  },
  1605: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1605.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1611: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1611.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  11001: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/11001.webp',
    theme: HUIZHANG_THEMES.eiji,
  },
  11003: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/11003.webp',
    theme: HUIZHANG_THEMES.eiji,
  },
  1410: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1410.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1411: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1411.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1105: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1105.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1106: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1106.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1108: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1108.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1109: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1109.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1201: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1201.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1202: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1202.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1203: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1203.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1210: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1210.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1206: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1206.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1301: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1301.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1302: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1302.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1305: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1305.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1310: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1310.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1808: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1307.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1401: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1401.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1402: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1402.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1403: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1403.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1504: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1504.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1701: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1701.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1703: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1703.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1704: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1704.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1708: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1708.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1601: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1601.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1602: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1602.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1603: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1603.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1608: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1608.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1801: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
    ],
    image_url: '/images/qban/1801.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1803: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1803.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1807: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1804.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1806: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1806.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1407: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1407.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1706: {
    shape: [
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.CIRCLE,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1706.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1103: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1103.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1104: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1104.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1209: {
    shape: [HUIZHANG_SHAPES.CIRCLE, HUIZHANG_SHAPES.CIRCLE],
    image_url: '/images/qban/1209.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1205: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1205.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1207: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1207.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1303: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1303.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1304: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.SHIELD,
    ],
    image_url: '/images/qban/1304.webp',
    theme: HUIZHANG_THEMES.elec,
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
  1405: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1405.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1606: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1606.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1702: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1702.webp',
    theme: HUIZHANG_THEMES.ice,
  },
  1604: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1604.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1805: {
    shape: [
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1805.webp',
    theme: HUIZHANG_THEMES.water,
  },
  1101: {
    shape: [HUIZHANG_SHAPES.CIRCLE, HUIZHANG_SHAPES.CIRCLE],
    image_url: '/images/qban/1101.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1107: {
    shape: [HUIZHANG_SHAPES.DIAMOND, HUIZHANG_SHAPES.DIAMOND],
    image_url: '/images/qban/1107.webp',
    theme: HUIZHANG_THEMES.cake,
  },
  1204: {
    shape: [HUIZHANG_SHAPES.DIAMOND, HUIZHANG_SHAPES.DIAMOND],
    image_url: '/images/qban/1204.webp',
    theme: HUIZHANG_THEMES.dream,
  },
  1306: {
    shape: [HUIZHANG_SHAPES.CIRCLE, HUIZHANG_SHAPES.CIRCLE],
    image_url: '/images/qban/1306.webp',
    theme: HUIZHANG_THEMES.elec,
  },
  1406: {
    shape: [HUIZHANG_SHAPES.DIAMOND, HUIZHANG_SHAPES.DIAMOND],
    image_url: '/images/qban/1406.webp',
    theme: HUIZHANG_THEMES.music,
  },
  1607: {
    shape: [HUIZHANG_SHAPES.DIAMOND, HUIZHANG_SHAPES.DIAMOND],
    image_url: '/images/qban/1607.webp',
    theme: HUIZHANG_THEMES.fire,
  },
  1712: {
    shape: [
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.SHIELD,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
      HUIZHANG_SHAPES.DIAMOND,
    ],
    image_url: '/images/qban/1712.webp',
    theme: HUIZHANG_THEMES.fire,
  },
}

// 获取角色的配置
export const getCharConfig = (charId) => {
  return CHAR_HUIZHANG_CONFIG[charId] || null
}

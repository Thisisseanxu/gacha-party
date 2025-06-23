import * as RARITY from '@/data/rarity.js'

// 所有角色的详细数据
export const allCards = [
  // 限定角色
  { id: 1110, name: '贪吃天使', rarity: RARITY.UR, imageUrl: '/images/cards/1110.png ' },
  { id: 1111, name: '小熊工程队', rarity: RARITY.UR, imageUrl: '/images/cards/1111.png' },
  { id: 1709, name: '雪人女王', rarity: RARITY.UR, imageUrl: '/images/cards/1709.png' },
  { id: 11006, name: '王牌发明家', rarity: RARITY.UR, imageUrl: '/images/cards/11006.png' },
  { id: 1211, name: '阿芙洛', rarity: RARITY.UR, imageUrl: '/images/cards/1211.png' },
  { id: 1609, name: '菜狗狗', rarity: RARITY.UR, imageUrl: '/images/cards/1609.png' },

  // SSR 角色
  { id: 1102, name: '卷卷战士', rarity: RARITY.SSR, imageUrl: '/images/cards/1102.png' },
  { id: 1301, name: '充电千竹', rarity: RARITY.SSR, imageUrl: '/images/cards/1301.png' },
  { id: 1302, name: '首席护盾', rarity: RARITY.SSR, imageUrl: '/images/cards/1302.png' },
  { id: 1305, name: '佩宝宝', rarity: RARITY.SSR, imageUrl: '/images/cards/1305.png' },
  { id: 1307, name: '指路奈奈', rarity: RARITY.SSR, imageUrl: '/images/cards/1307.png' },
  { id: 1310, name: '电玩少女', rarity: RARITY.SSR, imageUrl: '/images/cards/1310.png' },
  { id: 1105, name: '甜甜圈治疗师', rarity: RARITY.SSR, imageUrl: '/images/cards/1105.png' },

  // SR 角色
  { id: 1103, name: '珍珠射手', rarity: RARITY.SR, imageUrl: '/images/cards/1103.png' },
  { id: 1104, name: '饼干骑士', rarity: RARITY.SR, imageUrl: '/images/cards/1104.png' },
  { id: 1207, name: '劈咔灯泡', rarity: RARITY.SR, imageUrl: '/images/cards/1207.png' },
  { id: 1303, name: '弹幕发射姬', rarity: RARITY.SR, imageUrl: '/images/cards/1303.png' },
  { id: 1405, name: '电音射手', rarity: RARITY.SR, imageUrl: '/images/cards/1405.png' },
  { id: 1604, name: '家用喷火枪', rarity: RARITY.SR, imageUrl: '/images/cards/1604.png' },
  { id: 1606, name: '液氮喷射器', rarity: RARITY.SR, imageUrl: '/images/cards/1606.png' },
  { id: 1702, name: '雪球投掷姬', rarity: RARITY.SR, imageUrl: '/images/cards/1702.png' },
  { id: 1205, name: '梦游月兔', rarity: RARITY.SR, imageUrl: '/images/cards/1205.png' },
  { id: 1304, name: '拳头礼盒', rarity: RARITY.SR, imageUrl: '/images/cards/1304.png' },
  { id: 1805, name: '消防栓红', rarity: RARITY.SR, imageUrl: '/images/cards/1805.png' },
  { id: 1202, name: '浅睡千竹', rarity: RARITY.SR, imageUrl: '/images/cards/1202.png' },

  // R 角色
  { id: 1101, name: '纸杯千竹', rarity: RARITY.R, imageUrl: '/images/cards/1101.png' },
  { id: 1204, name: '铁头娃娃', rarity: RARITY.R, imageUrl: '/images/cards/1204.png' },
  { id: 1107, name: '转转咖啡杯', rarity: RARITY.R, imageUrl: '/images/cards/1107.png' },
  { id: 1306, name: '迷你风扇', rarity: RARITY.R, imageUrl: '/images/cards/1306.png' },
  { id: 1406, name: '闪耀灯球', rarity: RARITY.R, imageUrl: '/images/cards/1406.png' },
  { id: 1607, name: '火柴女孩', rarity: RARITY.R, imageUrl: '/images/cards/1607.png' },
]

// 将角色ID和角色对象映射到一个Map中，方便通过ID快速查找角色
export const cardMap = new Map(allCards.map((card) => [card.id, card]))

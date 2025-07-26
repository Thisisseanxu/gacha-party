import * as RARITY from '@/data/rarity.js'

// 所有角色的详细数据
export const allCards = [
  // 限定角色
  { id: '1110', name: '贪吃天使', rarity: RARITY.SP, imageUrl: '/images/cards/1110.webp ' },
  { id: '1111', name: '小熊工程队', rarity: RARITY.SP, imageUrl: '/images/cards/1111.webp' },
  { id: '1709', name: '雪人女王', rarity: RARITY.SP, imageUrl: '/images/cards/1709.webp' },
  { id: '11006', name: '王牌发明家', rarity: RARITY.SP, imageUrl: '/images/cards/11006.webp' },
  { id: '1211', name: '粉白梦魇', rarity: RARITY.SP, imageUrl: '/images/cards/1211.webp' },
  { id: '1609', name: '菜狗狗', rarity: RARITY.SP, imageUrl: '/images/cards/1609.webp' },
  { id: '1906', name: '彩虹射手', rarity: RARITY.SP, imageUrl: '/images/cards/1906.webp' },
  { id: '1311', name: '赛博忍者', rarity: RARITY.SP, imageUrl: '/images/cards/1311.webp' },
  { id: '1312', name: '酷玩游戏机', rarity: RARITY.SP, imageUrl: '/images/cards/1312.webp' },
  { id: '1809', name: '海洋果冻', rarity: RARITY.SP, imageUrl: '/images/cards/1809.webp' },
  { id: '1811', name: '海军大将', rarity: RARITY.SP, imageUrl: '/images/cards/1811.webp' },
  {
    id: 'CustomSPishuan',
    name: '超·强力消防栓',
    rarity: RARITY.SP,
    imageUrl: '/images/cards/1804.webp',
  },

  // SSR 角色
  { id: '1102', name: '卷卷战士', rarity: RARITY.SSR, imageUrl: '/images/cards/1102.webp' },
  { id: '1105', name: '甜甜圈治疗师', rarity: RARITY.SSR, imageUrl: '/images/cards/1105.webp' },
  { id: '1106', name: '甜甜圈推车', rarity: RARITY.SSR, imageUrl: '/images/cards/1106.webp' },
  { id: '1108', name: '甜蜜迫击炮', rarity: RARITY.SSR, imageUrl: '/images/cards/1108.webp' },
  { id: '1109', name: '裱花千竹', rarity: RARITY.SSR, imageUrl: '/images/cards/1109.webp' },
  { id: '1201', name: '星星法师', rarity: RARITY.SSR, imageUrl: '/images/cards/1201.webp' },
  { id: '1203', name: '琉璃治疗师', rarity: RARITY.SSR, imageUrl: '/images/cards/1203.webp' },
  { id: '1210', name: '航天娃娃', rarity: RARITY.SSR, imageUrl: '/images/cards/1210.webp' },
  { id: '1206', name: '嫦娥娃娃', rarity: RARITY.SSR, imageUrl: '/images/cards/1206.webp' },
  { id: '1202', name: '梦境千竹', rarity: RARITY.SSR, imageUrl: '/images/cards/1209.webp' }, // 浅睡和梦境的图片地址相反
  { id: '1301', name: '充电千竹', rarity: RARITY.SSR, imageUrl: '/images/cards/1301.webp' },
  { id: '1302', name: '首席护盾', rarity: RARITY.SSR, imageUrl: '/images/cards/1302.webp' },
  { id: '1305', name: '佩宝宝', rarity: RARITY.SSR, imageUrl: '/images/cards/1305.webp' },
  { id: '1310', name: '电玩少女', rarity: RARITY.SSR, imageUrl: '/images/cards/1310.webp' },
  { id: '1307', name: '指路奈奈', rarity: RARITY.SSR, imageUrl: '/images/cards/1307.webp' },
  { id: '1401', name: '电音琉璃', rarity: RARITY.SSR, imageUrl: '/images/cards/1401.webp' },
  { id: '1402', name: '底鼓坦克', rarity: RARITY.SSR, imageUrl: '/images/cards/1402.webp' },
  { id: '1403', name: '歌姬小喵', rarity: RARITY.SSR, imageUrl: '/images/cards/1403.webp' },
  { id: '1701', name: '制冰机', rarity: RARITY.SSR, imageUrl: '/images/cards/1701.webp' },
  { id: '1703', name: '寒冰战士', rarity: RARITY.SSR, imageUrl: '/images/cards/1703.webp' },
  { id: '1704', name: '超可爱的织夜', rarity: RARITY.SSR, imageUrl: '/images/cards/1704.webp' },
  { id: '1708', name: '球球射手', rarity: RARITY.SSR, imageUrl: '/images/cards/1708.webp' },
  { id: '1601', name: '火焰魔女', rarity: RARITY.SSR, imageUrl: '/images/cards/1601.webp' },
  { id: '1602', name: '油瓶射手', rarity: RARITY.SSR, imageUrl: '/images/cards/1602.webp' },
  { id: '1603', name: '棉花糖战士', rarity: RARITY.SSR, imageUrl: '/images/cards/1603.webp' },
  { id: '1608', name: '椒椒射手', rarity: RARITY.SSR, imageUrl: '/images/cards/1608.webp' },
  { id: '1801', name: '竹子水车', rarity: RARITY.SSR, imageUrl: '/images/cards/1801.webp' },
  { id: '1806', name: '功夫沙袋', rarity: RARITY.SSR, imageUrl: '/images/cards/1806.webp' },
  { id: '1803', name: '水枪普拉斯', rarity: RARITY.SSR, imageUrl: '/images/cards/1803.webp' },
  { id: '1504', name: '重金属吉他', rarity: RARITY.SSR, imageUrl: '/images/cards/1504.webp' },
  { id: '1807', name: '强力消防栓', rarity: RARITY.SSR, imageUrl: '/images/cards/1804.webp' }, // 新版的强力消防栓，图片地址为1804
  { id: '1808', name: '指路奈奈', rarity: RARITY.SSR, imageUrl: '/images/cards/1307.webp' }, // 新版的指路奈奈，但是图片地址与旧版相同
  { id: '1407', name: '特别医护', rarity: RARITY.SSR, imageUrl: '/images/cards/1407.webp' },
  { id: '1706', name: '冰池娃娃', rarity: RARITY.SSR, imageUrl: '/images/cards/1706.webp' },
  {
    id: 'UPSSR',
    name: '概率提升SSR',
    rarity: RARITY.SSR,
    imageUrl: '/images/cards/placeholder.webp',
  },
  { id: 'SSR01', name: '未知SSR', rarity: RARITY.SSR, imageUrl: '/images/cards/placeholder.webp' },

  // SR 角色
  { id: '1103', name: '珍珠射手', rarity: RARITY.SR, imageUrl: '/images/cards/1103.webp' },
  { id: '1104', name: '饼干骑士', rarity: RARITY.SR, imageUrl: '/images/cards/1104.webp' },
  { id: '1207', name: '劈咔灯泡', rarity: RARITY.SR, imageUrl: '/images/cards/1207.webp' },
  { id: '1303', name: '弹幕发射姬', rarity: RARITY.SR, imageUrl: '/images/cards/1303.webp' },
  { id: '1405', name: '电音射手', rarity: RARITY.SR, imageUrl: '/images/cards/1405.webp' },
  { id: '1604', name: '家用喷火枪', rarity: RARITY.SR, imageUrl: '/images/cards/1604.webp' },
  { id: '1606', name: '液氮喷射器', rarity: RARITY.SR, imageUrl: '/images/cards/1606.webp' },
  { id: '1702', name: '雪球投掷姬', rarity: RARITY.SR, imageUrl: '/images/cards/1702.webp' },
  { id: '1205', name: '梦游月兔', rarity: RARITY.SR, imageUrl: '/images/cards/1205.webp' },
  { id: '1304', name: '拳头礼盒', rarity: RARITY.SR, imageUrl: '/images/cards/1304.webp' },
  { id: '1805', name: '消防栓红', rarity: RARITY.SR, imageUrl: '/images/cards/1805.webp' },
  { id: '1209', name: '浅睡千竹', rarity: RARITY.SR, imageUrl: '/images/cards/1202.webp' }, // 浅睡和梦境的图片地址相反
  { id: '1404', name: '贝斯战士', rarity: RARITY.SR, imageUrl: '/images/cards/1404.webp' },

  // R 角色
  { id: '1101', name: '纸杯千竹', rarity: RARITY.R, imageUrl: '/images/cards/1101.webp' },
  { id: '1204', name: '铁头娃娃', rarity: RARITY.R, imageUrl: '/images/cards/1204.webp' },
  { id: '1107', name: '转转咖啡杯', rarity: RARITY.R, imageUrl: '/images/cards/1107.webp' },
  { id: '1306', name: '迷你风扇', rarity: RARITY.R, imageUrl: '/images/cards/1306.webp' },
  { id: '1406', name: '闪耀灯球', rarity: RARITY.R, imageUrl: '/images/cards/1406.webp' },
  { id: '1607', name: '火柴女孩', rarity: RARITY.R, imageUrl: '/images/cards/1607.webp' },
  {
    id: 'CustomRishuan',
    name: '弱力消防栓',
    rarity: RARITY.R,
    imageUrl: '/images/cards/1805.webp',
  },
]

// 将角色ID和角色对象映射到一个Map中，方便通过ID快速查找角色
export const cardMap = new Map(allCards.map((card) => [card.id, card]))

import * as RARITY from '@/data/rarity.js'
import { cardMap } from '@/data/cards.js'
import { logger } from '@/utils/logger.js'

const SP_BASE_RATE = 0.0125 // SP 基础概率

// 因代码限制，目前每个卡池必须包含rules属性，空的也可以
// 定义卡池配置
export const cardPools = {
  // 圣诞邀约
  shengdanyaoyue: {
    type: '限定',
    name: '圣诞邀约',
    imageUrl: '/images/cardpools-icon/120.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1410', '1411'],
      },
    },
    cardIds: {
      [RARITY.SP]: ['1410', '1411'],
      [RARITY.SSR]: ['1401', '1402', '1403', '1504'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 酷玩爆米花
  kuwanbaomihua: {
    type: '限定',
    name: '酷玩爆米花',
    imageUrl: '/images/cardpools-icon/119.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        SelectUpCards: true, // 虽然只有一个SP，但为了显示角色还是加上
        UpCards: ['11001'],
      },
    },
    cardIds: {
      [RARITY.SP]: ['11001'],
      [RARITY.SSR]: ['1701', '1703', '1704', '1708'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 心愿自选
  xinyuan: {
    type: '自选', // 类型名称，用于UI显示
    name: '心愿自选',
    imageUrl: '/images/cardpools-icon/1000.webp',
    challengeDisabled: true, // 自选卡池不支持挑战赛
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        WishSelection: true, // 启用自选机制
        MaximumSelection: 4, // 最多可选4张心愿卡
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1407', '1706'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: [
        '1110',
        '1111',
        '11006',
        '1906',
        '1211',
        '1811',
        '1809',
        '11007',
        '1711',
        '1810',
        '1710',
        '1309',
        '1503',
        '1502',
        '1610',
        '1408',
        '11008',
        '1311',
        '1312',
        '11105',
        '11101',
      ],
      [RARITY.SSR]: [
        '1102',
        '1106',
        '1108',
        '1109',
        '1201',
        '1202',
        '1203',
        '1210',
        '1301',
        '1302',
        '1305',
        '1310',
        '1401',
        '1402',
        '1403',
        '1407',
        '1701',
        '1703',
        '1704',
        '1706',
        '1708',
        '1601',
        '1602',
        '1603',
        '1608',
        '1801',
        '1806',
        '1803',
        '1504',
        '1807',
      ],
      [RARITY.SR]: ['1103', '1104', '1207', '1303', '1405'],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406'],
    },
  },
  // 厨娘来啦
  chunianglaila: {
    type: '限定',
    name: '厨娘来啦！',
    imageUrl: '/images/cardpools-icon/10122.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1605', '1611'],
      },
    },
    cardIds: {
      [RARITY.SP]: ['1605', '1611'],
      [RARITY.SSR]: ['1601', '1602', '1603', '1608'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 超频扭蛋机
  chaopingniudanji: {
    type: '限定',
    name: '超频扭蛋机',
    imageUrl: '/images/cardpools-icon/10112.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        SelectUpCards: true, // 虽然只有一个SP，但为了显示角色还是加上
        UpCards: ['11009'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1808'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['11009'],
      [RARITY.SSR]: ['1301', '1302', '1305', '1808', '1310'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 萌鬼认可证
  mengguirenkezhen: {
    type: '限定',
    name: '萌鬼认可证',
    imageUrl: '/images/cardpools-icon/10102.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['11101', '11105'],
      },
    },
    cardIds: {
      [RARITY.SP]: ['11101', '11105'],
      [RARITY.SSR]: ['1201', '1402', '1603', '1403', '1601'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 暮色邀请函
  museyaoqinghan: {
    type: '限定',
    name: '暮色邀请函',
    imageUrl: '/images/cardpools-icon/10092.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        SelectUpCards: true, // 虽然只有一个SP，但为了显示角色还是加上
        UpCards: ['11008'],
      },
    },
    cardIds: {
      [RARITY.SP]: ['11008'],
      [RARITY.SSR]: ['1601', '1602', '1603', '1608'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 游园邀请
  youyaunyaoqing: {
    type: '限定',
    name: '游园邀请',
    imageUrl: '/images/cardpools-icon/49.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1408', '1610'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1206'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['1408', '1610'],
      [RARITY.SSR]: ['1206', '1203', '1504', '1402', '1403'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 祈愿盲盒-烧烤大师
  qiyuanmanghe1: {
    type: '祈愿盲盒',
    name: '祈愿盲盒-烧烤大师',
    imageUrl: '/images/cardpools-icon/47.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        SelectUpCards: true, // 虽然只有一个SP，但为了显示角色还是加上
        UpCards: ['1502'],
      },
    },
    cardIds: {
      [RARITY.SP]: ['1502'],
      [RARITY.SSR]: ['1601', '1602', '1603', '1608'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 地下车手招募
  dixiacheshouzhaomu: {
    type: '限定',
    name: '地下车手招募',
    imageUrl: '/images/cardpools-icon/10012.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1311', '1312'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1808'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['1311', '1312'],
      [RARITY.SSR]: ['1301', '1302', '1305', '1808', '1310'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 扭蛋大作战
  niudandazuozhan: {
    type: '限定',
    name: '扭蛋大作战',
    imageUrl: '/images/cardpools-icon/10062.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    }, // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1711', '1810'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1310'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['1711', '1810'],
      [RARITY.SSR]: ['1310', '1701', '1703', '1704', '1708'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 早稻叽
  zaodaoji: {
    type: '限定',
    name: '早稻叽',
    imageUrl: '/images/cardpools-icon/10051.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        SelectUpCards: true, // 虽然只有一个SP，但为了显示角色还是加上
        UpCards: ['11007'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1403'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['11007'],
      [RARITY.SSR]: ['1403', '1504', '1402', '1401'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 浴缸大作战
  yugangdazuozhan: {
    type: '限定',
    name: '浴缸大作战',
    imageUrl: '/images/cardpools-icon/10042.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    }, // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1809', '1811'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1803'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['1809', '1811'],
      [RARITY.SSR]: ['1803', '1801', '1806', '1807'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 童话国盲盒机
  tonghuaguomangheji: {
    type: '限定',
    name: '童话国盲盒机',
    imageUrl: '/images/cardpools-icon/10032.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1906', '1211'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1206'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['1906', '1211'],
      [RARITY.SSR]: ['1201', '1203', '1210', '1206', '1202'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 网游卡池
  wangyoukachi: {
    type: '限定',
    name: '塔菲扭蛋',
    imageUrl: '/images/cardpools-icon/108.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        SelectUpCards: true, // 虽然只有一个SP，但为了显示角色还是加上
        UpCards: ['11006'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1808'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['11006'],
      [RARITY.SSR]: ['1301', '1302', '1305', '1808', '1310'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 车手盲盒机
  cheshoumangheji: {
    type: '限定',
    name: '车手盲盒机',
    imageUrl: '/images/cardpools-icon/29.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1110', '1111'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['1105'], // 双倍概率SSR角色（限定池SSR概率提升）
      },
    },
    cardIds: {
      [RARITY.SP]: ['1110', '1111'],
      [RARITY.SSR]: ['1105', '1102', '1108', '1106', '1109'],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 常驻扭蛋
  changzhu: {
    type: '常驻',
    name: '常驻扭蛋',
    imageUrl: '/images/cardpools-icon/9.webp', // 基础概率
    challengeDisabled: true, // 常驻卡池不支持挑战赛
    rates: {
      [RARITY.SSR]: 0.08,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    }, // 保底/概率提升规则
    rules: {
      [RARITY.SSR]: {
        pity: 60, // 60抽必出SSR
        pityUP: true, // 触发保底时必定抽到UP的SSR
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCardsGroup: true, // 标记为可从多组UP中选择
        UpGroups: [
          {
            id: '1', // UP组ID
            name: '甜品派对', // 组的显示名称
            image_url: '/images/cardpools-icon/1.webp', // 组的封面图片SPL
            cards: ['1102', '1106', '1108', '1109'], // 该组包含的卡片ID列表
          },
          {
            id: '2',
            name: '梦境守护',
            image_url: '/images/cardpools-icon/2.webp',
            cards: ['1201', '1202', '1203', '1210'],
          },
          {
            id: '3',
            name: '电玩大战',
            image_url: '/images/cardpools-icon/3.webp',
            cards: ['1301', '1302', '1305', '1310'],
          },
          {
            id: '4',
            name: '电音国度',
            image_url: '/images/cardpools-icon/4.webp',
            cards: ['1401', '1402', '1403', '1504'],
          },
          {
            id: '6',
            name: '冰雪世界',
            image_url: '/images/cardpools-icon/6.webp',
            cards: ['1701', '1703', '1704', '1708'],
          },
          {
            id: '5',
            name: '火焰国度',
            image_url: '/images/cardpools-icon/5.webp',
            cards: ['1601', '1602', '1603', '1608'],
          },
          {
            id: '8',
            name: '水流世界',
            image_url: '/images/cardpools-icon/8.webp',
            cards: ['1801', '1806', '1803', '1807'],
          },
        ],
      },
    },
    cardIds: {
      [RARITY.SSR]: [
        '1102',
        '1106',
        '1108',
        '1109',
        '1201',
        '1202',
        '1203',
        '1210',
        '1301',
        '1302',
        '1305',
        '1310',
        '1401',
        '1402',
        '1403',
        '1701',
        '1703',
        '1704',
        '1708',
        '1601',
        '1602',
        '1603',
        '1608',
        '1801',
        '1806',
        '1803',
        '1504',
        '1807',
        '1807',
      ],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
  // 高级常驻扭蛋
  gaojichangzhu: {
    type: '限定',
    name: '高级常驻扭蛋',
    imageUrl: '/images/cardpools-icon/10000.webp',
    // 基础概率
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2, // 其他情况都是 R
    }, // 保底/概率提升规则
    rules: {
      [RARITY.SP]: {
        pity: 60, // 60抽必出SP
        boostAfter: 40, // 40抽后每抽提升SP概率
        boost: 0.02, // 每抽提升2%的SP概率（41抽SP变为 0.04，42抽0.06......）
        UpTrigger: true, // 该卡池有UP机制
        SelectUpCards: true, // 可以选择UpCards中的一个角色UP
        UpCards: ['1710', '1309', '1503', '1502'],
      },
    },
    cardIds: {
      [RARITY.SP]: ['1710', '1309', '1503', '1502'],
      [RARITY.SSR]: [
        '1102',
        '1106',
        '1108',
        '1109',
        '1201',
        '1202',
        '1203',
        '1210',
        '1301',
        '1302',
        '1305',
        '1310',
        '1401',
        '1402',
        '1403',
        '1701',
        '1703',
        '1704',
        '1708',
        '1601',
        '1602',
        '1603',
        '1608',
        '1801',
        '1806',
        '1803',
        '1504',
        '1807',
      ],
      [RARITY.SR]: [
        '1103',
        '1104',
        '1207',
        '1303',
        '1405',
        '1604',
        '1606',
        '1702',
        '1205',
        '1304',
        '1805',
        '1209',
        '1404',
      ],
      [RARITY.R]: ['1101', '1204', '1107', '1306', '1406', '1607'],
    },
  },
}

/**
 * 跟据稀有度和ID列表从 allCards 中获取角色对象
 *
 * @param {Array<number>} ids - 角色的ID列表
 * @param {string|number} [rarity] - 可选，用于验证稀有度是否匹配。-1表示不进行稀有度验证。
 * @returns {Array<Object>} 返回一个包含角色对象的数组。
 */
function getCardsByIds(ids, rarity = -1) {
  return ids
    .map((id) => {
      const card = cardMap.get(id) // 使用 cardMap 来获取角色数据
      if (!card) {
        logger.warn(`找不到 ${id} 对应的角色数据。请检查角色ID是否正确。`)
        return null
      }
      if (card.rarity !== -1 && card.rarity !== rarity) {
        logger.warn(
          `ID为 ${id} 的角色的稀有度是 ${card.rarity} 与 ${rarity} 不匹配。请检查角色数据。`,
        )
      }
      return card
    })
    .filter(Boolean) // 过滤掉为 null 的值
}

/**
 * 根据卡池配置信息获取完整的角色数据
 *
 * @param {Array<number>} ids - 角色的ID列表
 * @returns {Array<Object>} 返回一个包含 角色对象的数组。
 */
export function getFullCardPoolData(poolId) {
  const poolConfig = cardPools[poolId]
  if (!poolConfig) {
    return null
  }

  const fullCardsInPool = [] // 遍历每种稀有度，并根据ID从 allCards 中获取完整角色数据
  for (const rarity of [RARITY.SP, RARITY.SSR, RARITY.SR, RARITY.R]) {
    if (poolConfig.cardIds[rarity]) {
      fullCardsInPool.push(...getCardsByIds(poolConfig.cardIds[rarity], rarity))
    }
  }

  return {
    ...poolConfig,
    cards: fullCardsInPool, // 将完整角色数据添加到返回对象中
  }
}

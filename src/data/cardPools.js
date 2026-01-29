import * as RARITY from '@/data/rarity.js'
import { cardNameMap } from '@/data/cards.js'
import { logger } from '@/utils/logger.js'

const SP_BASE_RATE = 0.0125 // SP 基础概率

/**
 * =============================================================================
 * 卡池配置说明
 * =============================================================================
 *
 * 添加新卡池时，请在 cardPools 对象中添加对应配置。
 *
 * 注意事项：
 * 1. 因代码限制，目前每个卡池必须包含 rules 属性，即使为空对象也可以。
 * 2. 角色名称必须与 cards.js 中的 name 字段完全匹配。
 *
 * 配置项字段说明:
 * - type: 卡池类型 (如 '限定', '常驻', '自选', '祈愿盲盒')
 * - name: 卡池显示名称
 * - imageUrl: 卡池封面图路径
 *
 * - rates: 基础概率配置
 *   - [RARITY.SP]: SP 基础概率
 *   - [RARITY.SSR]: SSR 基础概率
 *   - [RARITY.SR]: SR 基础概率
 *   - 剩余概率自动归为 R
 *
 * - rules: 保底与概率提升规则 (按稀有度配置)
 *   - [RARITY.SP] / [RARITY.SSR]:
 *     - pity: 保底抽数 (如 60，表示60抽必出)
 *     - boostAfter: 开始概率提升的抽数 (如 40)
 *     - boost: 每次提升的概率值 (如 0.02，即每次+2%)
 *     - UpTrigger: 是否启用 UP 机制 (true/false)
 *     - SelectUpCards: 是否允许玩家从 UpCards 中自选 UP 角色 (true/false)
 *     - UpCards: UP 角色名称列表 (字符串数组)
 *     - doubleRateCards: 概率翻倍的角色名称列表 (通常用于 SSR)
 *     - WishSelection: (自选池) 是否启用心愿自选机制
 *     - MaximumSelection: (自选池) 最大可选心愿数量
 *     - pityUP: (常驻池) 触发保底时是否必定为 UP 角色
 *     - SelectUpCardsGroup: (常驻池) 是否为多组 UP 选择模式
 *     - UpGroups: (常驻池) UP 组配置列表，包含 id, name, image_url, cards
 *
 * - cardNames: 卡池包含的角色列表 (按稀有度分类的名称数组)
 * =============================================================================
 */

// 定义卡池配置
export const cardPools = {
  // 青玉之锋
  qingyuzhifeng: {
    type: '限定',
    name: '青玉之锋',
    imageUrl: '/images/cardpools-icon/10191.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['匣中冰锋', '甜蜜冰霜'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['织夜超可爱'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['匣中冰锋', '甜蜜冰霜'],
      [RARITY.SSR]: ['织夜超可爱', '制冰机', '寒冰战士', '冰匙娃娃', '球球射手'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 织梦旅行团
  zhimenglvxingtuan: {
    type: '限定',
    name: '织梦旅行团',
    imageUrl: '/images/cardpools-icon/10182.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['约定天使', '小阳伞'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['嫦娥娃娃'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['约定天使', '小阳伞'],
      [RARITY.SSR]: ['星星法师', '琉璃治疗师', '航天娃娃', '嫦娥娃娃', '深睡千竹'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 鹅崽召唤器
  euzaisaoyinqi: {
    type: '限定',
    name: '鹅崽召唤器',
    imageUrl: '/images/cardpools-icon/122.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        SelectUpCards: true,
        UpCards: ['企鹅少女'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['企鹅少女'],
      [RARITY.SSR]: ['水枪普拉斯', '强力消防栓', '功夫沙袋', '竹子水车'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 相约嘉年华
  xiangyuejianianhua: {
    type: '限定',
    name: '相约嘉年华',
    imageUrl: '/images/cardpools-icon/10162.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['绯色巧克力', '糖果轰炸机'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['甜甜圈医师'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['绯色巧克力', '糖果轰炸机'],
      [RARITY.SSR]: ['甜甜圈医师', '卷卷战士', '甜蜜迫击炮', '甜甜圈推车', '裱花千竹'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 圣诞邀约
  shengdanyaoyue: {
    type: '限定',
    name: '圣诞邀约',
    imageUrl: '/images/cardpools-icon/120.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['音叉投手', '应援战士'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['音叉投手', '应援战士'],
      [RARITY.SSR]: ['电音琉璃', '底鼓坦克', '歌姬小喵', '重金属吉他'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 酷玩爆米花
  kuwanbaomihua: {
    type: '限定',
    name: '酷玩爆米花',
    imageUrl: '/images/cardpools-icon/119.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        SelectUpCards: true,
        UpCards: ['次元加农炮'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['次元加农炮'],
      [RARITY.SSR]: ['制冰机', '寒冰战士', '织夜超可爱', '球球射手'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 心愿自选
  xinyuan: {
    type: '自选',
    name: '心愿自选',
    imageUrl: '/images/cardpools-icon/1000.webp',
    challengeDisabled: true,
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        WishSelection: true,
        MaximumSelection: 4,
      },
      [RARITY.SSR]: {
        doubleRateCards: ['特别医护', '冰匙娃娃'],
      },
    },
    cardNames: {
      [RARITY.SP]: [
        '贪吃天使',
        '小熊工程队',
        '王牌发明家',
        '彩虹射手',
        '粉白梦魔',
        '海军大将',
        '海洋果冻',
        '光之恶魔',
        '雪糕刺客',
        '深海鲨鱼',
        '可可乐',
        '电池霓昂',
        '沁心浓茶',
        '烧烤大师',
        '炽热射线',
        '键盘乐手',
        '血族女王',
        '赛博忍者',
        '酷玩游戏机',
        '乐园实验家',
        '猫猫女巫',
      ],
      [RARITY.SSR]: [
        '卷卷战士',
        '甜甜圈推车',
        '甜蜜迫击炮',
        '裱花千竹',
        '星星法师',
        '深睡千竹',
        '琉璃治疗师',
        '航天娃娃',
        '充电千竹',
        '首席护盾',
        '佩宝宝',
        '电玩少女',
        '电音琉璃',
        '底鼓坦克',
        '歌姬小喵',
        '特别医护',
        '制冰机',
        '寒冰战士',
        '织夜超可爱',
        '冰匙娃娃',
        '球球射手',
        '火焰魔女',
        '油瓶射手',
        '棉花糖战士',
        '椒椒射手',
        '竹子水车',
        '功夫沙袋',
        '水枪普拉斯',
        '重金属吉他',
        '强力消防栓',
      ],
      [RARITY.SR]: ['珍珠射手', '饼干骑士', '劈咔灯泡', '弹幕发射姬', '电音射手'],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球'],
    },
  },
  // 厨娘来啦
  chunianglaila: {
    type: '限定',
    name: '厨娘来啦！',
    imageUrl: '/images/cardpools-icon/10122.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['美味香油壶', '顶级调料罐'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['美味香油壶', '顶级调料罐'],
      [RARITY.SSR]: ['火焰魔女', '油瓶射手', '棉花糖战士', '椒椒射手'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 超频扭蛋机
  chaopingniudanji: {
    type: '限定',
    name: '超频扭蛋机',
    imageUrl: '/images/cardpools-icon/10112.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        SelectUpCards: true,
        UpCards: ['超频游戏姬'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['指路奈奈'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['超频游戏姬'],
      [RARITY.SSR]: ['充电千竹', '首席护盾', '佩宝宝', '指路奈奈', '电玩少女'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 萌鬼认可证
  mengguirenkezhen: {
    type: '限定',
    name: '萌鬼认可证',
    imageUrl: '/images/cardpools-icon/10102.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['猫猫女巫', '乐园实验家'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['猫猫女巫', '乐园实验家'],
      [RARITY.SSR]: ['星星法师', '底鼓坦克', '棉花糖战士', '歌姬小喵', '火焰魔女'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 暮色邀请函
  museyaoqinghan: {
    type: '限定',
    name: '暮色邀请函',
    imageUrl: '/images/cardpools-icon/10092.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        SelectUpCards: true,
        UpCards: ['血族女王'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['血族女王'],
      [RARITY.SSR]: ['火焰魔女', '油瓶射手', '棉花糖战士', '椒椒射手'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 游园邀请
  youyaunyaoqing: {
    type: '限定',
    name: '游园邀请',
    imageUrl: '/images/cardpools-icon/49.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['键盘乐手', '炽热射线'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['嫦娥娃娃'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['键盘乐手', '炽热射线'],
      [RARITY.SSR]: ['嫦娥娃娃', '琉璃治疗师', '重金属吉他', '底鼓坦克', '歌姬小喵'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 祈愿盲盒-烧烤大师
  qiyuanmanghe1: {
    type: '祈愿盲盒',
    name: '祈愿盲盒-烧烤大师',
    imageUrl: '/images/cardpools-icon/47.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        SelectUpCards: true,
        UpCards: ['烧烤大师'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['烧烤大师'],
      [RARITY.SSR]: ['火焰魔女', '油瓶射手', '棉花糖战士', '椒椒射手'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 地下车手招募
  dixiacheshouzhaomu: {
    type: '限定',
    name: '地下车手招募',
    imageUrl: '/images/cardpools-icon/10012.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['赛博忍者', '酷玩游戏机'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['指路奈奈'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['赛博忍者', '酷玩游戏机'],
      [RARITY.SSR]: ['充电千竹', '首席护盾', '佩宝宝', '指路奈奈', '电玩少女'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 扭蛋大作战
  niudandazuozhan: {
    type: '限定',
    name: '扭蛋大作战',
    imageUrl: '/images/cardpools-icon/10062.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['雪糕刺客', '深海鲨鱼'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['电玩少女'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['雪糕刺客', '深海鲨鱼'],
      [RARITY.SSR]: ['电玩少女', '制冰机', '寒冰战士', '织夜超可爱', '球球射手'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 早稻叽
  zaodaoji: {
    type: '限定',
    name: '早稻叽',
    imageUrl: '/images/cardpools-icon/10051.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        SelectUpCards: true,
        UpCards: ['光之恶魔'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['歌姬小喵'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['光之恶魔'],
      [RARITY.SSR]: ['歌姬小喵', '重金属吉他', '底鼓坦克', '电音琉璃'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 浴缸大作战
  yugangdazuozhan: {
    type: '限定',
    name: '浴缸大作战',
    imageUrl: '/images/cardpools-icon/10042.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['海洋果冻', '海军大将'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['水枪普拉斯'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['海洋果冻', '海军大将'],
      [RARITY.SSR]: ['水枪普拉斯', '竹子水车', '功夫沙袋', '强力消防栓'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 童话国盲盒机
  tonghuaguomangheji: {
    type: '限定',
    name: '童话国盲盒机',
    imageUrl: '/images/cardpools-icon/10032.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['彩虹射手', '粉白梦魔'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['嫦娥娃娃'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['彩虹射手', '粉白梦魔'],
      [RARITY.SSR]: ['星星法师', '琉璃治疗师', '航天娃娃', '嫦娥娃娃', '深睡千竹'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 网游卡池
  wangyoukachi: {
    type: '限定',
    name: '塔菲扭蛋',
    imageUrl: '/images/cardpools-icon/108.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        SelectUpCards: true,
        UpCards: ['王牌发明家'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['指路奈奈'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['王牌发明家'],
      [RARITY.SSR]: ['充电千竹', '首席护盾', '佩宝宝', '指路奈奈', '电玩少女'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 车手盲盒机
  cheshoumangheji: {
    type: '限定',
    name: '车手盲盒机',
    imageUrl: '/images/cardpools-icon/29.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['贪吃天使', '小熊工程队'],
      },
      [RARITY.SSR]: {
        doubleRateCards: ['甜甜圈医师'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['贪吃天使', '小熊工程队'],
      [RARITY.SSR]: ['甜甜圈医师', '卷卷战士', '甜蜜迫击炮', '甜甜圈推车', '裱花千竹'],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 常驻扭蛋
  changzhu: {
    type: '常驻',
    name: '常驻扭蛋',
    imageUrl: '/images/cardpools-icon/9.webp',
    challengeDisabled: true,
    rates: {
      [RARITY.SSR]: 0.08,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SSR]: {
        pity: 60,
        pityUP: true,
        UpTrigger: true,
        SelectUpCardsGroup: true,
        UpGroups: [
          {
            id: '1',
            name: '甜品派对',
            image_url: '/images/cardpools-icon/1.webp',
            cards: ['卷卷战士', '甜甜圈推车', '甜蜜迫击炮', '裱花千竹'],
          },
          {
            id: '2',
            name: '梦境守护',
            image_url: '/images/cardpools-icon/2.webp',
            cards: ['星星法师', '深睡千竹', '琉璃治疗师', '航天娃娃'],
          },
          {
            id: '3',
            name: '电玩大战',
            image_url: '/images/cardpools-icon/3.webp',
            cards: ['充电千竹', '首席护盾', '佩宝宝', '电玩少女'],
          },
          {
            id: '4',
            name: '电音国度',
            image_url: '/images/cardpools-icon/4.webp',
            cards: ['电音琉璃', '底鼓坦克', '歌姬小喵', '重金属吉他'],
          },
          {
            id: '6',
            name: '冰雪世界',
            image_url: '/images/cardpools-icon/6.webp',
            cards: ['制冰机', '寒冰战士', '织夜超可爱', '球球射手'],
          },
          {
            id: '5',
            name: '火焰国度',
            image_url: '/images/cardpools-icon/5.webp',
            cards: ['火焰魔女', '油瓶射手', '棉花糖战士', '椒椒射手'],
          },
          {
            id: '8',
            name: '水流世界',
            image_url: '/images/cardpools-icon/8.webp',
            cards: ['竹子水车', '功夫沙袋', '水枪普拉斯', '强力消防栓'],
          },
        ],
      },
    },
    cardNames: {
      [RARITY.SSR]: [
        '卷卷战士',
        '甜甜圈推车',
        '甜蜜迫击炮',
        '裱花千竹',
        '星星法师',
        '深睡千竹',
        '琉璃治疗师',
        '航天娃娃',
        '充电千竹',
        '首席护盾',
        '佩宝宝',
        '电玩少女',
        '电音琉璃',
        '底鼓坦克',
        '歌姬小喵',
        '制冰机',
        '寒冰战士',
        '织夜超可爱',
        '球球射手',
        '火焰魔女',
        '油瓶射手',
        '棉花糖战士',
        '椒椒射手',
        '竹子水车',
        '功夫沙袋',
        '水枪普拉斯',
        '重金属吉他',
        '强力消防栓',
        '强力消防栓',
      ],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
  // 高级常驻扭蛋
  gaojichangzhu: {
    type: '限定',
    name: '高级常驻扭蛋',
    imageUrl: '/images/cardpools-icon/10000.webp',
    rates: {
      [RARITY.SP]: SP_BASE_RATE,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
    },
    rules: {
      [RARITY.SP]: {
        pity: 60,
        boostAfter: 40,
        boost: 0.02,
        UpTrigger: true,
        SelectUpCards: true,
        UpCards: ['可可乐', '电池霓昂', '沁心浓茶', '烧烤大师'],
      },
    },
    cardNames: {
      [RARITY.SP]: ['可可乐', '电池霓昂', '沁心浓茶', '烧烤大师'],
      [RARITY.SSR]: [
        '卷卷战士',
        '甜甜圈推车',
        '甜蜜迫击炮',
        '裱花千竹',
        '星星法师',
        '深睡千竹',
        '琉璃治疗师',
        '航天娃娃',
        '充电千竹',
        '首席护盾',
        '佩宝宝',
        '电玩少女',
        '电音琉璃',
        '底鼓坦克',
        '歌姬小喵',
        '制冰机',
        '寒冰战士',
        '织夜超可爱',
        '球球射手',
        '火焰魔女',
        '油瓶射手',
        '棉花糖战士',
        '椒椒射手',
        '竹子水车',
        '功夫沙袋',
        '水枪普拉斯',
        '重金属吉他',
        '强力消防栓',
      ],
      [RARITY.SR]: [
        '珍珠射手',
        '饼干骑士',
        '劈咔灯泡',
        '弹幕发射姬',
        '电音射手',
        '家用喷火枪',
        '液氮喷射器',
        '雪球投掷姬',
        '梦游月兔',
        '拳头礼盒',
        '消防栓',
        '浅睡千竹',
        '贝斯战士',
      ],
      [RARITY.R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
    },
  },
}

/**
 * 跟据稀有度和名称列表从 allCards 中获取角色对象
 *
 * @param {Array<string>} names - 角色的名称列表
 * @param {string|number} [rarity] - 可选，用于验证稀有度是否匹配。-1表示不进行稀有度验证。
 * @returns {Array<Object>} 返回一个包含角色对象的数组。
 */
function getCardsByNames(names, rarity = -1) {
  return names
    .map((name) => {
      const card = cardNameMap.get(name) // 使用 cardMap 来获取角色数据
      if (!card) {
        logger.warn(`找不到 ${name} 对应的角色数据。请检查角色名称是否正确。`)
        return null
      }
      if (card.rarity !== -1 && card.rarity !== rarity) {
        logger.warn(
          `名称为 ${name} 的角色的稀有度是 ${card.rarity} 与 ${rarity} 不匹配。请检查角色数据。`,
        )
      }
      return card
    })
    .filter(Boolean) // 过滤掉为 null 的值
}

/**
 * 根据卡池配置信息获取完整的角色数据
 *
 * @param {string} poolId - 卡池ID
 * @returns {Array<Object>} 返回一个包含角色对象的数组
 */
export function getFullCardPoolData(poolId) {
  const poolConfig = cardPools[poolId]
  if (!poolConfig) {
    return null
  }

  // 将名称数组转换为ID数组
  const convertNamesToIds = (names) => {
    if (!Array.isArray(names)) return []
    return names
      .map((name) => {
        const card = cardNameMap.get(name)
        if (!card) {
          logger.warn(`找不到名称为 "${name}" 的角色，请检查 cardPools.js 配置`)
          return null
        }
        return card.id
      })
      .filter(Boolean)
  }

  // 处理 rules 中的名称转ID，以兼容 GachaPage.vue 的逻辑
  const rulesWithIds = {}
  if (poolConfig.rules) {
    for (const [rarity, rule] of Object.entries(poolConfig.rules)) {
      const newRule = { ...rule }

      // 转换 UpCards
      if (newRule.UpCards) {
        newRule.UpCards = convertNamesToIds(newRule.UpCards)
      }

      // 转换 doubleRateCards
      if (newRule.doubleRateCards) {
        newRule.doubleRateCards = convertNamesToIds(newRule.doubleRateCards)
      }

      // 转换 UpGroups (常驻池等)
      if (newRule.UpGroups && Array.isArray(newRule.UpGroups)) {
        newRule.UpGroups = newRule.UpGroups.map((group) => ({
          ...group,
          cards: convertNamesToIds(group.cards),
        }))
      }

      rulesWithIds[rarity] = newRule
    }
  }

  // 生成 cardIds 供 GachaPage 使用
  const cardIds = {}
  if (poolConfig.cardNames) {
    for (const [rarity, names] of Object.entries(poolConfig.cardNames)) {
      cardIds[rarity] = convertNamesToIds(names)
    }
  }

  const fullCardsInPool = [] // 遍历每种稀有度，并根据ID从 allCards 中获取完整角色数据
  for (const rarity of [RARITY.SP, RARITY.SSR, RARITY.SR, RARITY.R]) {
    if (poolConfig.cardNames[rarity]) {
      fullCardsInPool.push(...getCardsByNames(poolConfig.cardNames[rarity], rarity))
    }
  }

  return {
    ...poolConfig,
    rules: rulesWithIds, // 使用转换后的 rules
    cardIds: cardIds, // 添加 cardIds 字段以兼容旧逻辑
    cards: fullCardsInPool, // 将完整角色数据添加到返回对象中
  }
}

import { SP, SSR, SR, R } from '@/data/constant.js'
import { cardNameMap } from '@/data/cards.js'
import { logger } from '@/utils/logger.js'

const SP_BASE_RATE = 0.0125 // SP 基础概率

// 卡池配置。本文件由 盲盒派对数据自动化/update_gacha_party_data.py 生成。
/**
 * =============================================================================
 * 卡池配置说明
 * =============================================================================
 *
 * 添加新卡池时，请在 cardPools 对象中添加对应配置。
 *
 * 注意事项：
 * 1. 因代码限制，目前每个卡池必须包含 rules 属性，即使为空对象也可以。
 * 2. 角色名称必须与 cards.json 中的 name 字段完全匹配。
 *
 * 配置项字段说明:
 * - type: 卡池类型 (如 '限定', '常驻', '心愿自选', '一周年自选', '祈愿盲盒')
 * - name: 卡池显示名称
 * - imageUrl: 卡池封面图路径
 * - tag_type: 卡池封面右下角标签背景类型，可选 1-5。1 金色，2 红色（限定），3 蓝色（复刻），4 粉紫色（联动），5 紫色。
 * - tag_name: 卡池封面右下角标签文字。需与 tag_type 一起配置才会显示。
 *
 * - rates: 基础概率配置
 *   - [SP]: SP 基础概率
 *   - [SSR]: SSR 基础概率
 *   - [SR]: SR 基础概率
 *   - 剩余概率自动归为 R
 *
 * - rules: 保底与概率提升规则 (按稀有度配置)
 *   - [SP] / [SSR]:
 *     - pity: 保底抽数 (如 60，表示60抽必出)
 *     - boostAfter: 开始概率提升的抽数 (如 40)
 *     - boost: 每次提升的概率值 (如 0.02，即每次+2%)
 *     - UpTrigger: 是否启用 UP 机制 (true/false)
 *     - SelectUpCards: 是否允许玩家从 UpCards 中自选 UP 角色 (true/false)
 *     - UpCards: UP 角色名称列表 (字符串数组)
 *     - doubleRateCards: 概率翻倍的角色名称列表 (通常用于 SSR)
 *     - WishSelection: (自选池) 是否启用心愿自选机制
 *     - MaximumSelection: (自选池) 最大可选心愿数量
 *     - WishUpGuarantee: (一周年4up心愿池) 是否启用当前UP与歪后下次必中
 *     - pityUP: (常驻池) 触发保底时是否必定为 UP 角色
 *     - SelectUpCardsGroup: (常驻池) 是否为多组 UP 选择模式
 *     - UpGroups: (常驻池) UP 组配置列表，包含 id, name, image_url, cards
 *
 * - cardNames: 卡池包含的角色列表 (按稀有度分类的名称数组)
 * =============================================================================
 */
const rawCardPoolsInOrder = [
  [
    "1004",
    {
      type: "自选",
      name: "夏日自选",
      isAvailable: true,
      imageUrl: "/images/cardpools/1004.webp",
      startTime: "2026-07-01 00:00:00",
      finishTime: "2026-09-13 23:59:59",
      tag_type: 2,
      tag_name: "自选",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          WishSelection: true,
          MaximumSelection: 4,
          WishUpGuarantee: true,
        },
        [SSR]: {
          doubleRateCards: [
            "冰匙娃娃",
            "特别医护"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "草帽娃娃",
          "小熊工程队",
          "贪吃天使",
          "王牌发明家",
          "彩虹射手",
          "粉白梦魔",
          "海军大将",
          "海洋果冻",
          "光之恶魔",
          "雪糕刺客",
          "深海鲨鱼",
          "可可乐",
          "电池霓昂",
          "沁心浓茶",
          "烧烤大师",
          "炽热射线",
          "键盘乐手",
          "血族女王",
          "赛博忍者",
          "酷玩游戏机",
          "乐园实验家",
          "猫猫女巫",
          "超频游戏姬",
          "次元加农炮",
          "美味香油壶",
          "顶级调料罐",
          "音叉投手",
          "应援战士",
          "糖果轰炸机",
          "绯色巧克力",
          "企鹅少女",
          "约定天使",
          "小洋伞",
          "匣中冰锋",
          "甜蜜冰霜",
          "光焰火莲",
          "新年爆竹",
          "布露",
          "桃子",
          "明珠星探",
          "妙笔创作家",
          "云间飞行",
          "超能喵球",
          "茶歇补给站",
          "棉花糖天使",
          "梦魔猎手",
          "睡袋狙击手",
          "手电筒",
          "波能震荡",
          "跃动脉冲",
          "幸福天使",
          "音律全开",
          "最终舞台",
          "果宝",
          "波子汽水",
          "清凉冰箱贴"
        ],
        [SSR]: [
          "冰匙娃娃",
          "特别医护",
          "甜甜圈医师",
          "指路奈奈",
          "嫦娥娃娃",
          "卷卷战士",
          "甜甜圈推车",
          "甜蜜迫击炮",
          "裱花千竹",
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女",
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手",
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手",
          "竹子水车",
          "功夫沙袋",
          "水枪普拉斯",
          "重金属吉他",
          "强力消防栓"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "138",
    {
      type: "限定",
      name: "滋滋煎香",
      isAvailable: true,
      imageUrl: "/images/cardpools/138.webp",
      startTime: "2026-06-25 00:00:00",
      finishTime: "2026-07-19 23:59:59",
      tag_type: 2,
      tag_name: "火焰",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "金牌平底锅",
            "迷糊汉堡包"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "金牌平底锅",
          "迷糊汉堡包"
        ],
        [SSR]: [
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "137",
    {
      type: "限定",
      name: "霜汽补给",
      isAvailable: true,
      imageUrl: "/images/cardpools/137.webp",
      startTime: "2026-06-09 00:00:00",
      finishTime: "2026-07-05 23:59:59",
      tag_type: 2,
      tag_name: "冰雪",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "波子汽水",
            "清凉冰箱贴"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "冰匙娃娃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "波子汽水",
          "清凉冰箱贴"
        ],
        [SSR]: [
          "冰匙娃娃",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "136",
    {
      type: "联动",
      name: "青苹果乐园",
      isAvailable: false,
      imageUrl: "/images/cardpools/136.webp",
      startTime: "2026-05-28 00:00:00",
      finishTime: "2026-06-21 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "果宝"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "电音琉璃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "果宝"
        ],
        [SSR]: [
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "重金属吉他"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "1003",
    {
      type: "一周年自选",
      name: "周年自选",
      isAvailable: false,
      imageUrl: "/images/cardpools/1003.webp",
      startTime: "2026-05-22 00:00:00",
      finishTime: "2026-06-21 23:59:59",
      tag_type: 2,
      tag_name: "自选",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          WishSelection: true,
          MaximumSelection: 4,
          WishUpGuarantee: true,
        },
        [SSR]: {
          doubleRateCards: [
            "冰匙娃娃",
            "特别医护"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "草帽娃娃",
          "小熊工程队",
          "贪吃天使",
          "王牌发明家",
          "彩虹射手",
          "粉白梦魔",
          "海军大将",
          "海洋果冻",
          "光之恶魔",
          "雪糕刺客",
          "深海鲨鱼",
          "可可乐",
          "电池霓昂",
          "沁心浓茶",
          "烧烤大师",
          "炽热射线",
          "键盘乐手",
          "血族女王",
          "赛博忍者",
          "酷玩游戏机",
          "乐园实验家",
          "猫猫女巫",
          "超频游戏姬",
          "次元加农炮",
          "美味香油壶",
          "顶级调料罐",
          "音叉投手",
          "应援战士",
          "糖果轰炸机",
          "绯色巧克力",
          "企鹅少女",
          "约定天使",
          "小洋伞",
          "匣中冰锋",
          "甜蜜冰霜",
          "光焰火莲",
          "新年爆竹",
          "布露",
          "桃子",
          "明珠星探",
          "妙笔创作家",
          "云间飞行",
          "超能喵球",
          "茶歇补给站",
          "棉花糖天使",
          "梦魔猎手",
          "睡袋狙击手",
          "手电筒",
          "波能震荡",
          "跃动脉冲",
          "幸福天使",
          "音律全开",
          "最终舞台"
        ],
        [SSR]: [
          "冰匙娃娃",
          "特别医护",
          "甜甜圈医师",
          "指路奈奈",
          "嫦娥娃娃",
          "卷卷战士",
          "甜甜圈推车",
          "甜蜜迫击炮",
          "裱花千竹",
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女",
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手",
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手",
          "竹子水车",
          "功夫沙袋",
          "水枪普拉斯",
          "重金属吉他",
          "强力消防栓"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "135",
    {
      type: "限定",
      name: "音律共鸣",
      isAvailable: false,
      imageUrl: "/images/cardpools/135.webp",
      startTime: "2026-05-15 00:00:00",
      finishTime: "2026-06-07 23:59:59",
      tag_type: 2,
      tag_name: "电音",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "音律全开",
            "最终舞台"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "音律全开",
          "最终舞台"
        ],
        [SSR]: [
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "重金属吉他"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "117-1",
    {
      type: "联动复刻",
      name: "超频扭蛋机-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/117.webp",
      startTime: "2026-05-11 00:00:00",
      finishTime: "2026-05-17 23:59:59",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "超频游戏姬"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "指路奈奈"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "超频游戏姬"
        ],
        [SSR]: [
          "指路奈奈",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "133",
    {
      type: "联动",
      name: "小小确幸",
      isAvailable: false,
      imageUrl: "/images/cardpools/133.webp",
      startTime: "2026-05-07 00:00:00",
      finishTime: "2026-05-31 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "幸福天使"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "甜甜圈医师"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "幸福天使"
        ],
        [SSR]: [
          "甜甜圈医师",
          "卷卷战士",
          "甜蜜迫击炮",
          "甜甜圈推车",
          "裱花千竹"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "134",
    {
      type: "限定",
      name: "电波盲订",
      isAvailable: false,
      imageUrl: "/images/cardpools/134.webp",
      startTime: "2026-04-30 00:00:00",
      finishTime: "2026-05-24 23:59:59",
      tag_type: 2,
      tag_name: "电玩",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "波能震荡",
            "跃动脉冲"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "波能震荡",
          "跃动脉冲"
        ],
        [SSR]: [
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "114-1",
    {
      type: "限定复刻",
      name: "游园邀请-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/114.webp",
      startTime: "2026-04-23 00:00:00",
      finishTime: "2026-05-06 23:59:59",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "炽热射线",
            "键盘乐手"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "嫦娥娃娃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "炽热射线",
          "键盘乐手"
        ],
        [SSR]: [
          "嫦娥娃娃",
          "琉璃治疗师",
          "重金属吉他",
          "底鼓坦克",
          "歌姬小喵"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "132",
    {
      type: "限定",
      name: "聚光信弹",
      isAvailable: false,
      imageUrl: "/images/cardpools/132.webp",
      startTime: "2026-04-16 00:00:00",
      finishTime: "2026-05-10 23:59:59",
      tag_type: 2,
      tag_name: "梦境",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "睡袋狙击手",
            "手电筒"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "嫦娥娃娃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "睡袋狙击手",
          "手电筒"
        ],
        [SSR]: [
          "嫦娥娃娃",
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "131",
    {
      type: "联动",
      name: "时空追猎者",
      isAvailable: false,
      imageUrl: "/images/cardpools/131.webp",
      startTime: "2026-04-09 00:00:00",
      finishTime: "2026-05-05 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "梦魔猎手"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "指路奈奈"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "梦魔猎手"
        ],
        [SSR]: [
          "指路奈奈",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "130",
    {
      type: "限定",
      name: "坠入绵软甜蜜",
      isAvailable: false,
      imageUrl: "/images/cardpools/130.webp",
      startTime: "2026-04-02 15:59:59",
      finishTime: "2026-04-26 23:59:59",
      tag_type: 2,
      tag_name: "甜品",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "茶歇补给站",
            "棉花糖天使"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "甜甜圈医师"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "茶歇补给站",
          "棉花糖天使"
        ],
        [SSR]: [
          "甜甜圈医师",
          "卷卷战士",
          "甜蜜迫击炮",
          "甜甜圈推车",
          "裱花千竹"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "1002",
    {
      type: "心愿自选",
      name: "春日自选扩招",
      isAvailable: false,
      imageUrl: "/images/cardpools/1002.webp",
      startTime: "2026-03-26 00:00:00",
      finishTime: "2026-04-26 23:59:59",
      tag_type: 2,
      tag_name: "自选",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          WishSelection: true,
          MaximumSelection: 4,
        },
        [SSR]: {
          doubleRateCards: [
            "冰匙娃娃",
            "甜甜圈医师"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "音叉投手",
          "应援战士",
          "彩虹射手",
          "绯色巧克力",
          "约定天使",
          "粉白梦魔",
          "海军大将",
          "海洋果冻"
        ],
        [SSR]: [
          "冰匙娃娃",
          "甜甜圈医师",
          "卷卷战士",
          "甜蜜迫击炮",
          "深睡千竹",
          "琉璃治疗师",
          "底鼓坦克",
          "歌姬小喵",
          "功夫沙袋",
          "竹子水车"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "115-1",
    {
      type: "联动复刻",
      name: "暮色邀请函-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/115.webp",
      startTime: "2026-03-26 00:00:00",
      finishTime: "2026-04-08 23:59:59",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "血族女王"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "血族女王"
        ],
        [SSR]: [
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "128",
    {
      type: "限定",
      name: "空陆菁英",
      isAvailable: false,
      imageUrl: "/images/cardpools/128.webp",
      startTime: "2026-03-24 00:00:00",
      finishTime: "2026-04-12 23:59:59",
      tag_type: 2,
      tag_name: "空陆",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "云间飞行",
            "超能喵球"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "云间飞行",
          "超能喵球"
        ],
        [SSR]: [
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "119-1",
    {
      type: "联动复刻",
      name: "酷玩爆米花-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/119.webp",
      startTime: "2026-03-12 00:00:00",
      finishTime: "2026-04-06 23:59:59",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "次元加农炮"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "次元加农炮"
        ],
        [SSR]: [
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "129",
    {
      type: "联动",
      name: "笔尖与四叶草",
      isAvailable: false,
      imageUrl: "/images/cardpools/129.webp",
      startTime: "2026-03-12 00:00:00",
      finishTime: "2026-04-06 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "明珠星探",
            "妙笔创作家"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "明珠星探",
          "妙笔创作家"
        ],
        [SSR]: [
          "裱花千竹",
          "甜蜜迫击炮",
          "卷卷战士",
          "甜甜圈推车"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "122-1",
    {
      type: "联动复刻",
      name: "鹅崽召唤器-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/122.webp",
      startTime: "2026-03-05 00:00:00",
      finishTime: "2026-03-17 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "企鹅少女"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "企鹅少女"
        ],
        [SSR]: [
          "水枪普拉斯",
          "强力消防栓",
          "功夫沙袋",
          "竹子水车"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "127",
    {
      type: "限定",
      name: "上元灯火",
      isAvailable: false,
      imageUrl: "/images/cardpools/127.webp",
      startTime: "2026-02-27 00:00:00",
      finishTime: "2026-03-22 23:59:59",
      tag_type: 2,
      tag_name: "元宵",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "布露",
            "桃子"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "水枪普拉斯"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "布露",
          "桃子"
        ],
        [SSR]: [
          "水枪普拉斯",
          "强力消防栓",
          "功夫沙袋",
          "竹子水车"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "126",
    {
      type: "限定",
      name: "焰竹火莲",
      isAvailable: false,
      imageUrl: "/images/cardpools/126.webp",
      startTime: "2026-02-10 00:00:00",
      finishTime: "2026-03-15 23:59:59",
      tag_type: 2,
      tag_name: "新春",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "光焰火莲",
            "新年爆竹"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "光焰火莲",
          "新年爆竹"
        ],
        [SSR]: [
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "1001",
    {
      type: "新春自选",
      name: "新春自选",
      isAvailable: false,
      imageUrl: "/images/cardpools/1001.webp",
      startTime: "2026-02-04 00:00:00",
      finishTime: "2026-03-15 23:59:59",
      tag_type: 2,
      tag_name: "自选",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "小熊工程队",
            "贪吃天使",
            "王牌发明家",
            "彩虹射手",
            "粉白梦魔",
            "雪糕刺客",
            "深海鲨鱼",
            "光之恶魔",
            "炽热射线",
            "键盘乐手",
            "血族女王",
            "酷玩游戏机",
            "赛博忍者",
            "超频游戏姬",
            "美味香油壶",
            "顶级调料罐"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "小熊工程队",
          "贪吃天使",
          "王牌发明家",
          "彩虹射手",
          "粉白梦魔",
          "雪糕刺客",
          "深海鲨鱼",
          "光之恶魔",
          "炽热射线",
          "键盘乐手",
          "血族女王",
          "酷玩游戏机",
          "赛博忍者",
          "超频游戏姬",
          "美味香油壶",
          "顶级调料罐"
        ],
        [SSR]: [
          "冰匙娃娃",
          "特别医护",
          "甜甜圈医师",
          "指路奈奈",
          "嫦娥娃娃",
          "卷卷战士",
          "甜甜圈推车",
          "甜蜜迫击炮",
          "裱花千竹",
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女",
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手",
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手",
          "竹子水车",
          "功夫沙袋",
          "水枪普拉斯",
          "重金属吉他",
          "强力消防栓"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "124",
    {
      type: "限定",
      name: "青玉之锋",
      isAvailable: false,
      imageUrl: "/images/cardpools/124.webp",
      startTime: "2026-01-29 00:00:00",
      finishTime: "2026-02-28 23:59:59",
      tag_type: 2,
      tag_name: "簌雪",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "匣中冰锋",
            "甜蜜冰霜"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "织夜"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "匣中冰锋",
          "甜蜜冰霜"
        ],
        [SSR]: [
          "织夜",
          "制冰机",
          "寒冰战士",
          "冰匙娃娃",
          "球球射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "109-1",
    {
      type: "限定复刻",
      name: "扭蛋大作战-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/109.webp",
      startTime: "2026-01-22 00:00:00",
      finishTime: "2026-02-05 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "海军大将",
            "海洋果冻"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "水枪普拉斯"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "海军大将",
          "海洋果冻"
        ],
        [SSR]: [
          "水枪普拉斯",
          "强力消防栓",
          "功夫沙袋",
          "竹子水车"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "123",
    {
      type: "限定",
      name: "织梦旅行团",
      isAvailable: false,
      imageUrl: "/images/cardpools/123.webp",
      startTime: "2026-01-15 00:00:00",
      finishTime: "2026-02-08 23:59:59",
      tag_type: 2,
      tag_name: "梦境",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "约定天使",
            "小洋伞"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "嫦娥娃娃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "约定天使",
          "小洋伞"
        ],
        [SSR]: [
          "嫦娥娃娃",
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "122",
    {
      type: "联动",
      name: "鹅崽召唤器",
      isAvailable: false,
      imageUrl: "/images/cardpools/122.webp",
      startTime: "2026-01-08 00:00:00",
      finishTime: "2026-02-01 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "企鹅少女"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "企鹅少女"
        ],
        [SSR]: [
          "水枪普拉斯",
          "强力消防栓",
          "功夫沙袋",
          "竹子水车"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "121",
    {
      type: "限定",
      name: "相约嘉年华",
      isAvailable: false,
      imageUrl: "/images/cardpools/121.webp",
      startTime: "2025-12-31 00:00:00",
      finishTime: "2026-01-25 23:59:59",
      tag_type: 2,
      tag_name: "元旦",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "糖果轰炸机",
            "绯色巧克力"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "甜甜圈医师"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "糖果轰炸机",
          "绯色巧克力"
        ],
        [SSR]: [
          "甜甜圈医师",
          "卷卷战士",
          "甜蜜迫击炮",
          "甜甜圈推车",
          "裱花千竹"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "120",
    {
      type: "限定",
      name: "圣诞邀约",
      isAvailable: false,
      imageUrl: "/images/cardpools/120.webp",
      startTime: "2025-12-18 00:00:00",
      finishTime: "2026-01-11 23:59:59",
      tag_type: 2,
      tag_name: "圣诞",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "音叉投手",
            "应援战士"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "音叉投手",
          "应援战士"
        ],
        [SSR]: [
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "重金属吉他"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "119",
    {
      type: "联动",
      name: "酷玩爆米花",
      isAvailable: false,
      imageUrl: "/images/cardpools/119.webp",
      startTime: "2025-12-04 00:00:00",
      finishTime: "2025-12-28 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "次元加农炮"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "次元加农炮"
        ],
        [SSR]: [
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "1000",
    {
      type: "心愿自选",
      name: "半周年庆典自选池",
      isAvailable: false,
      imageUrl: "/images/cardpools/1000.webp",
      startTime: "2025-11-27 00:00:00",
      finishTime: "2025-12-28 23:59:59",
      tag_type: 2,
      tag_name: "半周年",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          WishSelection: true,
          MaximumSelection: 4,
        },
        [SSR]: {
          doubleRateCards: [
            "冰匙娃娃",
            "特别医护"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "小熊工程队",
          "贪吃天使",
          "王牌发明家",
          "彩虹射手",
          "粉白梦魔",
          "海军大将",
          "海洋果冻",
          "光之恶魔",
          "雪糕刺客",
          "深海鲨鱼",
          "可可乐",
          "电池霓昂",
          "沁心浓茶",
          "烧烤大师",
          "炽热射线",
          "键盘乐手",
          "血族女王",
          "赛博忍者",
          "酷玩游戏机",
          "乐园实验家",
          "猫猫女巫"
        ],
        [SSR]: [
          "冰匙娃娃",
          "特别医护",
          "甜甜圈医师",
          "指路奈奈",
          "嫦娥娃娃",
          "卷卷战士",
          "甜甜圈推车",
          "甜蜜迫击炮",
          "裱花千竹",
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女",
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手",
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手",
          "竹子水车",
          "功夫沙袋",
          "水枪普拉斯",
          "重金属吉他",
          "强力消防栓"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "118",
    {
      type: "限定",
      name: "厨娘来啦",
      isAvailable: false,
      imageUrl: "/images/cardpools/118.webp",
      startTime: "2025-11-20 00:00:00",
      finishTime: "2025-12-14 23:59:59",
      tag_type: 2,
      tag_name: "厨艺",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "美味香油壶",
            "顶级调料罐"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "美味香油壶",
          "顶级调料罐"
        ],
        [SSR]: [
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "112-1",
    {
      type: "限定复刻",
      name: "仲夏扭蛋-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/112.webp",
      startTime: "2025-11-14 00:00:00",
      finishTime: "2025-12-01 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "雪糕刺客",
            "深海鲨鱼"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "电玩少女"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "雪糕刺客",
          "深海鲨鱼"
        ],
        [SSR]: [
          "电玩少女",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "117",
    {
      type: "限定",
      name: "超频扭蛋机",
      isAvailable: false,
      imageUrl: "/images/cardpools/117.webp",
      startTime: "2025-11-06 00:00:00",
      finishTime: "2025-11-30 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "超频游戏姬"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "指路奈奈"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "超频游戏姬"
        ],
        [SSR]: [
          "指路奈奈",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "111-1",
    {
      type: "联动复刻",
      name: "早稻叽-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/111.webp",
      startTime: "2025-10-31 00:00:00",
      finishTime: "2025-11-17 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "光之恶魔"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "歌姬小喵"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "光之恶魔"
        ],
        [SSR]: [
          "歌姬小喵",
          "重金属吉他",
          "底鼓坦克",
          "电音琉璃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "116",
    {
      type: "限定",
      name: "萌鬼认可证",
      isAvailable: false,
      imageUrl: "/images/cardpools/116.webp",
      startTime: "2025-10-24 00:00:00",
      finishTime: "2025-11-16 23:59:59",
      tag_type: 2,
      tag_name: "万圣",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "乐园实验家",
            "猫猫女巫"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "乐园实验家",
          "猫猫女巫"
        ],
        [SSR]: [
          "星星法师",
          "底鼓坦克",
          "棉花糖战士",
          "歌姬小喵",
          "火焰魔女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "29-2",
    {
      type: "限定复刻",
      name: "车手盲盒机-复刻2",
      isAvailable: false,
      imageUrl: "/images/cardpools/29.webp",
      startTime: "2025-10-16 00:00:00",
      finishTime: "2025-10-31 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "小熊工程队",
            "贪吃天使"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "甜甜圈医师"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "小熊工程队",
          "贪吃天使"
        ],
        [SSR]: [
          "甜甜圈医师",
          "卷卷战士",
          "甜蜜迫击炮",
          "甜甜圈推车",
          "裱花千竹"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "115",
    {
      type: "限定",
      name: "暮色邀请函",
      isAvailable: false,
      imageUrl: "/images/cardpools/115.webp",
      startTime: "2025-10-10 00:00:00",
      finishTime: "2025-11-09 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "血族女王"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "血族女王"
        ],
        [SSR]: [
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "108-1",
    {
      type: "联动复刻",
      name: "永雏塔菲-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/108.webp",
      startTime: "2025-10-01 00:00:00",
      finishTime: "2025-10-16 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "王牌发明家"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "指路奈奈"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "王牌发明家"
        ],
        [SSR]: [
          "指路奈奈",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "114",
    {
      type: "限定",
      name: "游园邀请",
      isAvailable: false,
      imageUrl: "/images/cardpools/114.webp",
      startTime: "2025-09-27 00:00:00",
      finishTime: "2025-10-19 23:59:59",
      tag_type: 2,
      tag_name: "中秋",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "炽热射线",
            "键盘乐手"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "嫦娥娃娃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "炽热射线",
          "键盘乐手"
        ],
        [SSR]: [
          "嫦娥娃娃",
          "琉璃治疗师",
          "重金属吉他",
          "底鼓坦克",
          "歌姬小喵"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "47",
    {
      type: "祈愿盲盒",
      name: "祈愿盲盒",
      isAvailable: false,
      imageUrl: "/images/cardpools/47.webp",
      startTime: "2025-09-23 00:00:00",
      finishTime: "2025-10-07 23:59:59",
      tag_type: 3,
      tag_name: "限时",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "烧烤大师"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "烧烤大师"
        ],
        [SSR]: [
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "110-1",
    {
      type: "限定复刻",
      name: "入梦童话国-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/110.webp",
      startTime: "2025-09-19 00:00:00",
      finishTime: "2025-10-01 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "彩虹射手",
            "粉白梦魔"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "嫦娥娃娃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "彩虹射手",
          "粉白梦魔"
        ],
        [SSR]: [
          "嫦娥娃娃",
          "星星法师",
          "首席护盾",
          "琉璃治疗师",
          "航天娃娃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "107",
    {
      type: "限定",
      name: "地下车手招募",
      isAvailable: false,
      imageUrl: "/images/cardpools/107.webp",
      startTime: "2025-09-11 00:00:00",
      finishTime: "2025-10-07 23:59:59",
      tag_type: 2,
      tag_name: "赛车",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "酷玩游戏机",
            "赛博忍者"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "指路奈奈"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "酷玩游戏机",
          "赛博忍者"
        ],
        [SSR]: [
          "指路奈奈",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "29-1",
    {
      type: "限定复刻",
      name: "车手盲盒机-复刻1",
      isAvailable: false,
      imageUrl: "/images/cardpools/29.webp",
      startTime: "2025-08-21 00:00:00",
      finishTime: "2025-09-08 00:00:00",
      tag_type: 3,
      tag_name: "复刻",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "小熊工程队",
            "贪吃天使"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "甜甜圈医师"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "小熊工程队",
          "贪吃天使"
        ],
        [SSR]: [
          "甜甜圈医师",
          "卷卷战士",
          "甜蜜迫击炮",
          "甜甜圈推车",
          "裱花千竹"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "112",
    {
      type: "限定",
      name: "仲夏扭蛋",
      isAvailable: false,
      imageUrl: "/images/cardpools/112.webp",
      startTime: "2025-08-14 00:00:00",
      finishTime: "2025-09-14 23:59:59",
      tag_type: 2,
      tag_name: "夏日",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "雪糕刺客",
            "深海鲨鱼"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "电玩少女"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "雪糕刺客",
          "深海鲨鱼"
        ],
        [SSR]: [
          "电玩少女",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "111",
    {
      type: "限定",
      name: "早稻叽",
      isAvailable: false,
      imageUrl: "/images/cardpools/111.webp",
      startTime: "2025-07-31 00:00:00",
      finishTime: "2025-09-07 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "光之恶魔"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "歌姬小喵"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "光之恶魔"
        ],
        [SSR]: [
          "歌姬小喵",
          "重金属吉他",
          "底鼓坦克",
          "电音琉璃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "109",
    {
      type: "限定",
      name: "扭蛋大作战",
      isAvailable: false,
      imageUrl: "/images/cardpools/109.webp",
      startTime: "2025-07-11 00:00:00",
      finishTime: "2025-09-14 23:59:59",
      tag_type: 2,
      tag_name: "夏日",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "海军大将",
            "海洋果冻"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "水枪普拉斯"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "海军大将",
          "海洋果冻"
        ],
        [SSR]: [
          "水枪普拉斯",
          "强力消防栓",
          "功夫沙袋",
          "竹子水车"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "110",
    {
      type: "限定",
      name: "入梦童话国",
      isAvailable: false,
      imageUrl: "/images/cardpools/110.webp",
      startTime: "2025-06-26 16:00:00",
      finishTime: "2025-07-17 00:00:00",
      tag_type: 2,
      tag_name: "童话",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "彩虹射手",
            "粉白梦魔"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "嫦娥娃娃"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "彩虹射手",
          "粉白梦魔"
        ],
        [SSR]: [
          "嫦娥娃娃",
          "星星法师",
          "首席护盾",
          "琉璃治疗师",
          "航天娃娃"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "108",
    {
      type: "限定",
      name: "永雏塔菲",
      isAvailable: false,
      imageUrl: "/images/cardpools/108.webp",
      startTime: "2025-06-13 16:00:00",
      finishTime: "2025-07-20 23:59:59",
      tag_type: 4,
      tag_name: "联动",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "王牌发明家"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "指路奈奈"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "王牌发明家"
        ],
        [SSR]: [
          "指路奈奈",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "29",
    {
      type: "限定",
      name: "车手盲盒机",
      isAvailable: false,
      imageUrl: "/images/cardpools/29.webp",
      startTime: "2025-05-07 00:00:00",
      finishTime: "2025-06-26 00:00:00",
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "小熊工程队",
            "贪吃天使"
          ],
        },
        [SSR]: {
          doubleRateCards: [
            "甜甜圈医师"
          ],
        },
      },
      cardNames: {
        [SP]: [
          "小熊工程队",
          "贪吃天使"
        ],
        [SSR]: [
          "甜甜圈医师",
          "卷卷战士",
          "甜蜜迫击炮",
          "甜甜圈推车",
          "裱花千竹"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  [
    "10000",
    {
      type: "高级常驻",
      name: "高级常驻池",
      isAvailable: true,
      imageUrl: "/images/cardpools/10000.webp",
      startTime: "2025-08-08 00:00:00",
      finishTime: null,
      rates: {
        [SP]: SP_BASE_RATE,
        [SSR]: 0.06,
        [SR]: 0.2,
      },
      rules: {
        [SP]: {
          pity: 60,
          boostAfter: 40,
          boost: 0.02,
          UpTrigger: true,
          SelectUpCards: true,
          UpCards: [
            "可可乐",
            "电池霓昂",
            "沁心浓茶",
            "烧烤大师"
          ],
        },
        [SSR]: {},
      },
      cardNames: {
        [SP]: [
          "可可乐",
          "电池霓昂",
          "沁心浓茶",
          "烧烤大师"
        ],
        [SSR]: [
          "卷卷战士",
          "甜甜圈推车",
          "甜蜜迫击炮",
          "裱花千竹",
          "星星法师",
          "深睡千竹",
          "琉璃治疗师",
          "航天娃娃",
          "充电千竹",
          "首席护盾",
          "佩宝宝",
          "电玩少女",
          "电音琉璃",
          "底鼓坦克",
          "歌姬小喵",
          "制冰机",
          "寒冰战士",
          "织夜",
          "球球射手",
          "火焰魔女",
          "油瓶射手",
          "棉花糖战士",
          "椒椒射手",
          "竹子水车",
          "功夫沙袋",
          "水枪普拉斯",
          "重金属吉他",
          "强力消防栓"
        ],
        [SR]: [
          "珍珠射手",
          "饼干骑士",
          "劈咔灯泡",
          "弹幕发射姬",
          "电音射手",
          "家用喷火枪",
          "液氮喷射器",
          "雪球投掷姬",
          "梦游月兔",
          "拳头礼盒",
          "消防栓",
          "浅睡千竹",
          "贝斯战士"
        ],
        [R]: [
          "铁头娃娃",
          "纸杯千竹",
          "转转咖啡杯",
          "迷你风扇",
          "闪耀灯球",
          "火柴女孩"
        ],
      },
    },
  ],

  // 常驻扭蛋
  [
    '9',
    {
      type: '常驻',
      name: '常驻扭蛋',
      isAvailable: true,
      imageUrl: '/images/cardpools/9.webp',
      rates: {
        [SSR]: 0.08,
        [SR]: 0.2,
      },
      rules: {
        [SSR]: {
          pity: 60,
          pityUP: true,
          UpTrigger: true,
          SelectUpCardsGroup: true,
          UpGroups: [
            {
              id: '1',
              name: '甜品派对',
              image_url: '/images/cardpools/1.webp',
              cards: ['卷卷战士', '甜甜圈推车', '甜蜜迫击炮', '裱花千竹'],
            },
            {
              id: '2',
              name: '梦境守护',
              image_url: '/images/cardpools/2.webp',
              cards: ['星星法师', '深睡千竹', '琉璃治疗师', '航天娃娃'],
            },
            {
              id: '3',
              name: '电玩大战',
              image_url: '/images/cardpools/3.webp',
              cards: ['充电千竹', '首席护盾', '佩宝宝', '电玩少女'],
            },
            {
              id: '4',
              name: '电音国度',
              image_url: '/images/cardpools/4.webp',
              cards: ['电音琉璃', '底鼓坦克', '歌姬小喵', '重金属吉他'],
            },
            {
              id: '6',
              name: '冰雪世界',
              image_url: '/images/cardpools/6.webp',
              cards: ['制冰机', '寒冰战士', '织夜', '球球射手'],
            },
            {
              id: '5',
              name: '火焰国度',
              image_url: '/images/cardpools/5.webp',
              cards: ['火焰魔女', '油瓶射手', '棉花糖战士', '椒椒射手'],
            },
            {
              id: '8',
              name: '水流世界',
              image_url: '/images/cardpools/8.webp',
              cards: ['竹子水车', '功夫沙袋', '水枪普拉斯', '强力消防栓'],
            },
          ],
        },
      },
      cardNames: {
        [SSR]: [
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
          '织夜',
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
        [SR]: [
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
        [R]: ['纸杯千竹', '铁头娃娃', '转转咖啡杯', '迷你风扇', '闪耀灯球', '火柴女孩'],
      },
    },
  ]
]

function parsePoolTimeMs(time) {
  if (!time) return null
  if (time instanceof Date) return time.getTime()
  if (typeof time !== 'string') return null

  const match = time.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  if (!match) {
    const parsed = Date.parse(time)
    return Number.isNaN(parsed) ? null : parsed
  }

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime()
}

export function isCardPoolEnded(pool, now = Date.now()) {
  const finishTimeMs = parsePoolTimeMs(pool?.finishTime)
  return finishTimeMs !== null && finishTimeMs < now
}

export function isCardPoolAvailable(pool, now = Date.now()) {
  return !isCardPoolEnded(pool, now)
}

export const cardPoolsInOrder = rawCardPoolsInOrder.slice().sort((a, b) => {
  const aEnded = isCardPoolEnded(a[1])
  const bEnded = isCardPoolEnded(b[1])
  if (aEnded === bEnded) return 0
  return aEnded ? 1 : -1
})

export const cardPools = Object.fromEntries(cardPoolsInOrder)

function getCardsByNames(names, rarity = -1) {
  return names
    .map((name) => {
      const card = cardNameMap.get(name)
      if (!card) {
        logger.warn(`找不到 ${name} 对应的角色数据。请检查角色名称是否正确。`)
        return null
      }
      if (card.rarity !== -1 && card.rarity !== rarity) {
        logger.warn(`名称为 ${name} 的角色的稀有度是 ${card.rarity} 与 ${rarity} 不匹配。请检查角色数据。`)
      }
      return card
    })
    .filter(Boolean)
}

export function getFullCardPoolData(poolId) {
  const poolConfig = cardPools[poolId]
  if (!poolConfig) return null

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

  const rulesWithIds = {}
  if (poolConfig.rules) {
    for (const [rarity, rule] of Object.entries(poolConfig.rules)) {
      const newRule = { ...rule }
      if (newRule.UpCards) newRule.UpCards = convertNamesToIds(newRule.UpCards)
      if (newRule.doubleRateCards) newRule.doubleRateCards = convertNamesToIds(newRule.doubleRateCards)
      if (newRule.UpGroups && Array.isArray(newRule.UpGroups)) {
        newRule.UpGroups = newRule.UpGroups.map((group) => ({ ...group, cards: convertNamesToIds(group.cards) }))
      }
      rulesWithIds[rarity] = newRule
    }
  }

  const cardIds = {}
  if (poolConfig.cardNames) {
    for (const [rarity, names] of Object.entries(poolConfig.cardNames)) {
      cardIds[rarity] = convertNamesToIds(names)
    }
  }

  const fullCardsInPool = []
  for (const rarity of [SP, SSR, SR, R]) {
    if (poolConfig.cardNames[rarity]) {
      fullCardsInPool.push(...getCardsByNames(poolConfig.cardNames[rarity], rarity))
    }
  }

  return { ...poolConfig, rules: rulesWithIds, cardIds, cards: fullCardsInPool }
}

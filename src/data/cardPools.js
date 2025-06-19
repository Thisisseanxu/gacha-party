export const RARITY = {
  UR: "限定",
  SSR: "SSR",
  SR: "SR",
  R: "R",
};

// 定义卡池配置
export const cardPools = {
  // 测试限定卡池
  TestUR: {
    name: "测试限定卡池",
    // 基础概率
    rates: {
      [RARITY.UR]: 0.02,
      [RARITY.SSR]: 0.06,
      [RARITY.SR]: 0.2,
      // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {},
    cards: [
      // 限定角色
      { id: "ur001", name: "限定01", rarity: RARITY.UR },
      { id: "ur002", name: "限定02", rarity: RARITY.UR },
      // SSR 角色
      { id: "ssr001", name: "SSR01", rarity: RARITY.SSR },
      { id: "ssr002", name: "SSR02", rarity: RARITY.SSR },
      { id: "ssr003", name: "SSR03", rarity: RARITY.SSR },
      { id: "ssr004", name: "SSR04", rarity: RARITY.SSR },
      { id: "ssr005", name: "SSR05", rarity: RARITY.SSR },
      // SR 角色
      { id: "sr001", name: "SR01", rarity: RARITY.SR },
      { id: "sr002", name: "SR02", rarity: RARITY.SR },
      { id: "sr003", name: "SR03", rarity: RARITY.SR },
      { id: "sr004", name: "SR04", rarity: RARITY.SR },
      { id: "sr005", name: "SR05", rarity: RARITY.SR },
      { id: "sr006", name: "SR06", rarity: RARITY.SR },
      { id: "sr007", name: "SR07", rarity: RARITY.SR },
      { id: "sr008", name: "SR08", rarity: RARITY.SR },
      { id: "sr009", name: "SR09", rarity: RARITY.SR },
      { id: "sr010", name: "SR10", rarity: RARITY.SR },
      { id: "sr011", name: "SR11", rarity: RARITY.SR },
      { id: "sr012", name: "SR12", rarity: RARITY.SR },
      // R 角色
      { id: "r001", name: "R01", rarity: RARITY.R },
      { id: "r002", name: "R02", rarity: RARITY.R },
      { id: "r003", name: "R03", rarity: RARITY.R },
      { id: "r004", name: "R04", rarity: RARITY.R },
      { id: "r005", name: "R05", rarity: RARITY.R },
      { id: "r006", name: "R06", rarity: RARITY.R },
    ],
  },
  // 测试常驻卡池
  TestSSR: {
    name: "测试常驻卡池",
    // 基础概率
    rates: {
      [RARITY.SSR]: 0.08,
      [RARITY.SR]: 0.2,
      // 其他情况都是 R
    },
    // 保底/概率提升规则
    rules: {},
    cards: [
      // SSR 角色
      { id: "ssr001", name: "SSR01", rarity: RARITY.SSR },
      { id: "ssr002", name: "SSR02", rarity: RARITY.SSR },
      { id: "ssr003", name: "SSR03UP", rarity: RARITY.SSR, isUp: true }, // 假设这是UP角色
      { id: "ssr004", name: "SSR04UP", rarity: RARITY.SSR, isUp: true },
      { id: "ssr005", name: "SSR05", rarity: RARITY.SSR },
      // SR 角色
      { id: "sr001", name: "SR01", rarity: RARITY.SR },
      { id: "sr002", name: "SR02", rarity: RARITY.SR },
      { id: "sr003", name: "SR03", rarity: RARITY.SR },
      { id: "sr004", name: "SR04", rarity: RARITY.SR },
      { id: "sr005", name: "SR05", rarity: RARITY.SR },
      { id: "sr006", name: "SR06", rarity: RARITY.SR },
      { id: "sr007", name: "SR07", rarity: RARITY.SR },
      { id: "sr008", name: "SR08", rarity: RARITY.SR },
      { id: "sr009", name: "SR09", rarity: RARITY.SR },
      { id: "sr010", name: "SR10", rarity: RARITY.SR },
      { id: "sr011", name: "SR11", rarity: RARITY.SR },
      { id: "sr012", name: "SR12", rarity: RARITY.SR },
      // R 角色
      { id: "r001", name: "R01", rarity: RARITY.R },
      { id: "r002", name: "R02", rarity: RARITY.R },
      { id: "r003", name: "R03", rarity: RARITY.R },
      { id: "r004", name: "R04", rarity: RARITY.R },
      { id: "r005", name: "R05", rarity: RARITY.R },
      { id: "r006", name: "R06", rarity: RARITY.R },
    ],
  },
  // // 限定卡池
  // limited_time: {
  //   name: "限定卡池",
  //   // 基础概率
  //   rates: {
  //     [RARITY_UR]: 0.02,
  //     [RARITY_SSR]: 0.06,
  //     [RARITY_SR]: 0.2,
  //     [RARITY_R]: 0.72,
  //   },
  //   cards: [
  //     { id: "lur001", name: "限定A", rarity: RARITY_UR },
  //     // ...
  //   ],
  // },
};

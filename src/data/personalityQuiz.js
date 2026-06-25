export const quizDimensions = ['傲娇', '可爱', '能干', '活力']

export const quizScaleOptions = [
  { id: 'strongly_agree', text: '完全符合', value: 2 },
  { id: 'agree', text: '比较符合', value: 1 },
  { id: 'neutral', text: '中立/不确定', value: 0 },
  { id: 'disagree', text: '比较不符合', value: -1 },
  { id: 'strongly_disagree', text: '完全不符合', value: -2 },
]

export const personalityQuestionSource = [
  {
    prompt: '长活动结束后，奖励和资源会先被你整理清楚，再决定下一步培养谁',
    weight: 1.05,
    traits: [
      { dimension: '能干', coefficient: 1.2 },
      { dimension: '活力', coefficient: 0.25 },
    ],
  },
  {
    prompt: '嘴上说“也就这样”，实际还是会默默把在意的人和事照顾好',
    weight: 1.1,
    traits: [
      { dimension: '傲娇', coefficient: 1.25 },
      { dimension: '可爱', coefficient: 0.25 },
    ],
  },
  {
    prompt: '新活动或新玩法刚出现时，你通常会先冲进去试几轮，再慢慢修正',
    weight: 1,
    traits: [
      { dimension: '活力', coefficient: 1.25 },
      { dimension: '能干', coefficient: -0.2 },
    ],
  },
  {
    prompt: '喜欢的角色、礼物或纪念品被放在显眼位置时，你会因为看见它们而心情变好',
    weight: 1,
    traits: [
      { dimension: '可爱', coefficient: 1.2 },
      { dimension: '傲娇', coefficient: -0.15 },
    ],
  },
  {
    prompt: '为了下一个卡池，你会提前计算水晶来源和预算，不太愿意临到最后再慌',
    weight: 1.1,
    traits: [
      { dimension: '能干', coefficient: 1.3 },
      { dimension: '活力', coefficient: -0.2 },
    ],
  },
  {
    prompt: '真实想法可以直接说出来时，你不太会故意绕弯或装作不在意',
    weight: 1.05,
    traits: [
      { dimension: '傲娇', coefficient: -1.25 },
      { dimension: '活力', coefficient: 0.25 },
    ],
  },
  {
    prompt: '气氛紧起来的时候，撒娇、玩笑或小表情常常是你缓和场面的方式',
    weight: 1,
    traits: [
      { dimension: '可爱', coefficient: 1.25 },
      { dimension: '活力', coefficient: 0.25 },
    ],
  },
  {
    prompt: '安静待着、慢慢处理自己的节奏，对你来说比每天热热闹闹更舒服',
    weight: 1.1,
    traits: [
      { dimension: '活力', coefficient: -1.25 },
      { dimension: '能干', coefficient: 0.25 },
    ],
  },
  {
    prompt: '综合爬塔卡关时，查攻略、看录像、针对性调整阵容会让你更安心',
    weight: 1.05,
    traits: [
      { dimension: '能干', coefficient: 1.25 },
      { dimension: '傲娇', coefficient: 0.15 },
    ],
  },
  {
    prompt: '就算心里很担心，你也容易先摆出镇定或嫌麻烦的样子',
    weight: 1,
    traits: [
      { dimension: '傲娇', coefficient: 1.3 },
      { dimension: '活力', coefficient: -0.15 },
    ],
  },
  {
    prompt: '亲手做的小东西即使不完美，只要心意到了，你也会觉得它很珍贵',
    weight: 1,
    traits: [
      { dimension: '可爱', coefficient: 1.15 },
      { dimension: '能干', coefficient: -0.25 },
    ],
  },
  {
    prompt: '有空时出门走走、尝试新店或新路线，会比整天窝着更吸引你',
    weight: 1,
    traits: [
      { dimension: '活力', coefficient: 1.25 },
      { dimension: '可爱', coefficient: 0.15 },
    ],
  },
  {
    prompt: '朋友遇到麻烦时，你会倾向于先问清情况、找资源、给出可执行的办法',
    weight: 1.15,
    traits: [
      { dimension: '能干', coefficient: 1.25 },
      { dimension: '可爱', coefficient: -0.15 },
    ],
  },
  {
    prompt: '被人需要、被人靠近或收到明确的好意时，你通常能坦率接受',
    weight: 1.05,
    traits: [
      { dimension: '傲娇', coefficient: -1.15 },
      { dimension: '可爱', coefficient: 0.35 },
    ],
  },
  {
    prompt: '房间、文件或背包最好井井有条，东西都有固定位置会让你舒服很多',
    weight: 1,
    traits: [
      { dimension: '能干', coefficient: 1.2 },
      { dimension: '活力', coefficient: -0.15 },
    ],
  },
  {
    prompt: '看到可爱的东西时，你很容易多看几眼，甚至想拍照或收藏起来',
    weight: 1,
    traits: [{ dimension: '可爱', coefficient: 1.3 }],
  },
  {
    prompt: '竞技场或排行榜前夜，差一点就能上去时，你的不服输会被明显激起来',
    weight: 1.05,
    traits: [
      { dimension: '活力', coefficient: 1.1 },
      { dimension: '傲娇', coefficient: 0.45 },
    ],
  },
  {
    prompt: '有人夸你时，你表面可能淡淡带过，心里却会把那句话记很久',
    weight: 1,
    traits: [
      { dimension: '傲娇', coefficient: 1.15 },
      { dimension: '可爱', coefficient: 0.25 },
    ],
  },
  {
    prompt: '复杂任务拆成清单后一项项完成，会让你很安心',
    weight: 1.1,
    traits: [{ dimension: '能干', coefficient: 1.35 }],
  },
  {
    prompt: '轻松、随性、差不多就好的安排，比把生活排得很满更适合你',
    weight: 1.1,
    traits: [
      { dimension: '能干', coefficient: -1.25 },
      { dimension: '活力', coefficient: 0.2 },
    ],
  },
  {
    prompt: '在创意工坊做关卡时，热闹、有惊喜、让人停不下来的机关会很吸引你',
    weight: 1,
    traits: [
      { dimension: '活力', coefficient: 1.2 },
      { dimension: '可爱', coefficient: 0.25 },
    ],
  },
  {
    prompt: '做决定前多观察一会儿，确认安全和后果之后再行动，会让你更踏实',
    weight: 1.05,
    traits: [
      { dimension: '能干', coefficient: 0.85 },
      { dimension: '活力', coefficient: -0.75 },
    ],
  },
  {
    prompt: '推荐游戏或作品前，你会先问清对方口味，再给出更适合她的选择',
    weight: 1,
    traits: [
      { dimension: '能干', coefficient: 0.85 },
      { dimension: '傲娇', coefficient: 0.45 },
    ],
  },
  {
    prompt: '面对难过的人，你会先想办法把她逗笑，让气氛松下来',
    weight: 1,
    traits: [
      { dimension: '可爱', coefficient: 0.95 },
      { dimension: '活力', coefficient: 0.65 },
    ],
  },
  {
    prompt: '即使通关效率低一点，你也愿意坚持带上本命角色一起打',
    weight: 1,
    traits: [
      { dimension: '可爱', coefficient: 1.05 },
      { dimension: '能干', coefficient: -0.45 },
    ],
  },
  {
    prompt: '别人质疑你喜欢的东西时，你表面懒得解释，之后却可能悄悄准备资料',
    weight: 1.05,
    traits: [
      { dimension: '傲娇', coefficient: 1.2 },
      { dimension: '能干', coefficient: 0.35 },
    ],
  },
  {
    prompt: '灵感一来就马上开始做，哪怕计划还没完全成形，你也不太想等',
    weight: 1,
    traits: [
      { dimension: '活力', coefficient: 1.2 },
      { dimension: '能干', coefficient: -0.45 },
    ],
  },
  {
    prompt: '成熟稳重、少依赖别人，遇到情绪也尽量自己消化，这种状态很接近你',
    weight: 1.05,
    traits: [
      { dimension: '可爱', coefficient: -1.15 },
      { dimension: '傲娇', coefficient: 0.25 },
    ],
  },
  {
    prompt: '话说明白、规则摆清楚会让你安心，模糊暧昧反而容易让你不自在',
    weight: 1,
    traits: [
      { dimension: '傲娇', coefficient: -0.65 },
      { dimension: '能干', coefficient: 0.75 },
    ],
  },
  {
    prompt: '把一整天空出来慢慢发呆、看电影或听歌，对你来说不算浪费时间',
    weight: 1,
    traits: [
      { dimension: '活力', coefficient: -1.15 },
      { dimension: '可爱', coefficient: 0.25 },
    ],
  },
]

function createScaleOptions() {
  return quizScaleOptions.map((option) => ({ ...option }))
}

export const personalityQuestions = personalityQuestionSource.map((question) => ({
  ...question,
  options: createScaleOptions(),
}))

// 问卷原始语义权重。页面使用文件末尾的转换逻辑，将这些权重转换为
// 与 character_scores.json 一致的四条双极倾向轴（-50 至 50）。
export const quizDimensions = ['傲娇', '可爱', '能干', '活力']

export const personalityQuestionSource = [
  {
    prompt: '一个长活动终于打完，看着满满的奖励和一身疲惫，你的反应是：',
    options: [
      {
        id: 'A',
        text: '看着熟悉的好友 ID，心里浮起一句“又一起熬过来了”',
        scores: {
          活力: 25,
          可爱: 5,
        },
      },
      {
        id: 'B',
        text: '先把资源清点归整，分门别类塞给该养的学员',
        scores: {
          能干: 25,
          活力: 5,
        },
      },
      {
        id: 'C',
        text: '还有劲，张罗着把奖励一次性开完，图个痛快',
        scores: {
          活力: 25,
          可爱: 5,
        },
      },
      {
        id: 'D',
        text: '嘴上说也就这么回事，登录界面却比平时多停了一会儿',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
    ],
  },
  {
    prompt: '想给主力学员凑一套高属性的套装徽章，刷了很久却一直不出货，你会：',
    options: [
      {
        id: 'A',
        text: '算清楚还要刷多少体力蛋糕，按计划稳稳推',
        scores: {
          能干: 25,
          活力: 5,
        },
      },
      {
        id: 'B',
        text: '盯着差一点点的套装，心疼那个还没毕业的学员',
        scores: {
          可爱: 25,
          感性: 5,
        },
      },
      {
        id: 'C',
        text: '不信邪，备着饮料准备一口气多刷几轮',
        scores: {
          活力: 20,
          可爱: 10,
        },
      },
      {
        id: 'D',
        text: '没事我就是来刷点活动材料的',
        scores: {
          傲娇: 25,
          能干: 5,
        },
      },
    ],
  },
  {
    prompt: '这个月水晶被抽卡花得差不多了，想为下个池子重新攒一波，你的做法是：',
    options: [
      {
        id: 'A',
        text: '舍不得砍掉给学员的养成投入，决定先从别的开销里省',
        scores: {
          感性: 20,
          可爱: 5,
        },
      },
      {
        id: 'B',
        text: '把每天的水晶来源列一遍，定个稳妥的攒卡节奏',
        scores: {
          能干: 20,
          傲娇: 5,
        },
      },
      {
        id: 'C',
        text: '氪不动就多肝，把能领水晶的玩法都安排上',
        scores: {
          活力: 20,
          能干: 5,
        },
      },
      {
        id: 'D',
        text: '嘴上念叨着乱花钱，转头就研究怎么把资源补回来',
        scores: {
          傲娇: 20,
          能干: 5,
        },
      },
    ],
  },
  {
    prompt: '在地铁上看到隔壁小朋友被同龄人抢走玩具，正抽抽搭搭哭着，家长不在身旁，你会：',
    options: [
      {
        id: 'A',
        text: '板脸说了抢玩具的孩子一句，转头把糖塞给被欺负的那个',
        scores: {
          傲娇: 25,
          能干: 5,
        },
      },
      {
        id: 'B',
        text: '拿出点小零食逗逗她，把她的注意力带开',
        scores: {
          活力: 25,
          感性: 5,
        },
      },
      {
        id: 'C',
        text: '先问清前因后果，把玩具要回来，再去找乘务员',
        scores: {
          能干: 25,
          活力: -5,
        },
      },
      {
        id: 'D',
        text: '蹲下来递纸巾，轻声哄她别哭',
        scores: {
          可爱: 20,
          感性: 10,
        },
      },
    ],
  },
  {
    prompt: '限定池只剩三天，你还差一点就能保底，朋友又约你周末一起出去玩，你会：',
    options: [
      {
        id: 'A',
        text: '有点纠结，犹豫着要不要先开口借一点',
        scores: {
          可爱: 20,
          感性: 10,
        },
      },
      {
        id: 'B',
        text: '先回个“再说吧”，转头去翻有没有划算的礼包',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
      {
        id: 'C',
        text: '都想要，上午一起出去，下午回来再补抽',
        scores: {
          活力: 25,
          感性: 5,
        },
      },
      {
        id: 'D',
        text: '估算一下时间和花销，安排好两边都不耽误',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
    ],
  },
  {
    prompt: '朋友突发奇想问你：要是能选一种超能力，你想要什么？你脱口而出的是：',
    options: [
      {
        id: 'A',
        text: '“能让身边的人都过得安心一点的那种。”',
        scores: {
          感性: 25,
          可爱: 5,
        },
      },
      {
        id: 'B',
        text: '“随时查到任何信息的能力，遇事不慌。”',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'C',
        text: '“瞬间移动，这样每天能去不同地方吃早饭。”',
        scores: {
          活力: 25,
          能干: 5,
        },
      },
      {
        id: 'D',
        text: '“现在这样就挺好。”嘴上这么说，其实超想要读心术',
        scores: {
          傲娇: 25,
          活力: 5,
        },
      },
    ],
  },
  {
    prompt: '假如你穿越在一片沙漠中，远处有人坐在沙丘上微弱地挥手求助，你会怎么做？',
    options: [
      {
        id: 'A',
        text: '快步上前，先把水和遮阳的东西递过去再说',
        scores: {
          活力: 20,
          能干: 5,
        },
      },
      {
        id: 'B',
        text: '嘴上念叨着麻烦，最后半瓶水还是递了过去',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
      {
        id: 'C',
        text: '摊开地图，先定好两人位置和补给，再想撤离路线',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'D',
        text: '先观察一圈确认安全，再带着水小心走过去',
        scores: {
          感性: 25,
          可爱: 5,
        },
      },
    ],
  },
  {
    prompt: '综合爬塔卡在某一关怎么都过不去，面对这道坎你会：',
    options: [
      {
        id: 'A',
        text: '翻通关玩家的录像，照着研究学员该怎么叠放升阶',
        scores: {
          能干: 25,
          活力: -5,
        },
      },
      {
        id: 'B',
        text: '有点犯难，发消息问问朋友有没有思路',
        scores: {
          可爱: 25,
          感性: 5,
        },
      },
      {
        id: 'C',
        text: '嘴上嫌这关设计得离谱，还是一遍遍重排硬磨过去',
        scores: {
          傲娇: 25,
          能干: 10,
        },
      },
      {
        id: 'D',
        text: '多试几套阵容，不信凑不出能过的搭配',
        scores: {
          活力: 20,
          可爱: 10,
        },
      },
    ],
  },
  {
    prompt: '创意工坊里想做一张自己的关卡发布出去，你最在意的是：',
    options: [
      {
        id: 'A',
        text: '机关和节奏设计得严丝合缝，让人玩着挑不出毛病',
        scores: {
          能干: 25,
          感性: 5,
        },
      },
      {
        id: 'B',
        text: '塞满花样和惊喜，主打一个热闹好玩、停不下来',
        scores: {
          活力: 25,
          可爱: 5,
        },
      },
      {
        id: 'C',
        text: '偏要做点别人想不到的刁钻设计，被吐槽也无所谓',
        scores: {
          傲娇: 25,
          感性: 5,
        },
      },
      {
        id: 'D',
        text: '想藏一个温柔的小故事，玩到最后能让人心里一暖',
        scores: {
          感性: 20,
          可爱: 15,
        },
      },
    ],
  },
  {
    prompt: '有人问你最近有没有什么手游可以推荐，你会怎么说：',
    options: [
      {
        id: 'A',
        text: '直接发一份自己整理的入坑指南给对方',
        scores: {
          能干: 25,
          活力: 5,
        },
      },
      {
        id: 'B',
        text: '“试试这个吧，它的角色和故事很容易让人上头。”',
        scores: {
          感性: 25,
          可爱: 5,
        },
      },
      {
        id: 'C',
        text: '嘴上说随便，转头把对方的口味问得比客服还细',
        scores: {
          傲娇: 25,
          能干: 5,
        },
      },
      {
        id: 'D',
        text: '“来这款，活动多、节奏快，上手很快就玩开了。”',
        scores: {
          活力: 25,
          可爱: 10,
        },
      },
    ],
  },
  {
    prompt: '竞技场结算前夜，眼看排名要再上一档，却被一支防守阵容连着挡了下来，你会：',
    options: [
      {
        id: 'A',
        text: '觉得名次没那么要紧，能和喜欢的学员一起打就够了',
        scores: {
          感性: 25,
          可爱: 5,
        },
      },
      {
        id: 'B',
        text: '嘴上说懒得理，还是把对面的配队截图存了下来研究',
        scores: {
          傲娇: 25,
          能干: 5,
        },
      },
      {
        id: 'C',
        text: '有点不服气，想多挑战几次看能不能磨过去',
        scores: {
          可爱: 20,
          活力: 5,
        },
      },
      {
        id: 'D',
        text: '调出对方阵容找弱点，针对性换一套再上',
        scores: {
          能干: 15,
          活力: 10,
        },
      },
    ],
  },
  {
    prompt: '难得整整一天没人找你、也没安排，你打算怎么过这一天？',
    options: [
      {
        id: 'A',
        text: '嘴上嫌没人约，其实窝在沙发里也过得挺自在',
        scores: {
          傲娇: 25,
          能干: 10,
        },
      },
      {
        id: 'B',
        text: '煮杯东西看部老电影，留一点时间给自己发呆',
        scores: {
          感性: 20,
          可爱: 10,
        },
      },
      {
        id: 'C',
        text: '出门走走，难得有完整的一天，不太想浪费在屋里',
        scores: {
          活力: 20,
          可爱: 5,
        },
      },
      {
        id: 'D',
        text: '顺手把攒下来的家务和琐事一次清掉',
        scores: {
          能干: 25,
          傲娇: -5,
        },
      },
    ],
  },
  {
    prompt: '闲鱼上看到一张限定签名色纸，价格刚好掏空你这个月剩下的全部预算，你会：',
    options: [
      {
        id: 'A',
        text: '对着手机犹豫半天，想问问家里人能不能搭把手',
        scores: {
          可爱: 20,
          感性: 15,
        },
      },
      {
        id: 'B',
        text: '装作去看别的页面，过会儿还是默默回去下了单',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
      {
        id: 'C',
        text: '想着错过会后悔，干脆拍下，月底紧一紧也认了',
        scores: {
          活力: 20,
          感性: 10,
        },
      },
      {
        id: 'D',
        text: '先比价、辨真伪，价高就挂个降价提醒慢慢等',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
    ],
  },
  {
    prompt: '闺蜜送你一只亲手缝的玩偶，眼睛缝歪了、线也跑出来，她正紧张地看着你，你会：',
    options: [
      {
        id: 'A',
        text: '真诚道谢，提议下次约她一起做个更好的',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'B',
        text: '嘴上嫌缝得歪，转身就把它摆到最显眼的位置',
        scores: {
          傲娇: 25,
          能干: 5,
        },
      },
      {
        id: 'C',
        text: '认真收下，说这是最特别的礼物，要放在床头',
        scores: {
          感性: 25,
          可爱: 5,
        },
      },
      {
        id: 'D',
        text: '举起来拍照：“它好独特，我要发个朋友圈。”',
        scores: {
          可爱: 25,
          活力: 5,
        },
      },
    ],
  },
  {
    prompt: '下班路上看到一只湿漉漉的小奶猫，蜷在屋檐下瑟瑟发抖，你会：',
    options: [
      {
        id: 'A',
        text: '先查查附近的救助站，确认能安置再上前',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'B',
        text: '嘴上嫌添麻烦，手里的吃的已经撕开喂了',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
      {
        id: 'C',
        text: '心一软，先脱下外套把它裹起来',
        scores: {
          感性: 20,
          可爱: 10,
        },
      },
      {
        id: 'D',
        text: '抱起来就往家走，擦干吹暖的事回家再说',
        scores: {
          活力: 15,
          可爱: 15,
        },
      },
    ],
  },
  {
    prompt: '同事路过看到你在追新学员的 PV，扔下一句“这种二游有啥好玩的”，你会：',
    options: [
      {
        id: 'A',
        text: '条理清楚地讲讲它的玩法和养成，把质疑一点点说服',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'B',
        text: '认真说说角色和剧情：“她身上有让我每天想上线的东西。”',
        scores: {
          感性: 25,
          能干: 5,
        },
      },
      {
        id: 'C',
        text: '兴冲冲地塞耳机，让她先听一段、看一眼立绘',
        scores: {
          可爱: 20,
          活力: 10,
        },
      },
      {
        id: 'D',
        text: '懒得多解释，第二天却塞给她一个兑换码让她自己试',
        scores: {
          傲娇: 25,
          活力: 5,
        },
      },
    ],
  },
  {
    prompt: '防守大作战给了一批能拿强力加成的推荐学员，但里面没有你的本命，你会：',
    options: [
      {
        id: 'A',
        text: '推荐谁就用谁，能轻松推关、痛快通关最实在',
        scores: {
          活力: 25,
          可爱: 5,
        },
      },
      {
        id: 'B',
        text: '还是想带上本命，哪怕难一点也愿意陪她打',
        scores: {
          感性: 25,
          可爱: 5,
        },
      },
      {
        id: 'C',
        text: '权衡加成和练度，挑收益最高的一套阵容上',
        scores: {
          能干: 25,
          傲娇: -5,
        },
      },
      {
        id: 'D',
        text: '嘴上嫌推荐名单不合心意，最后还是按收益排了阵容',
        scores: {
          傲娇: 25,
          能干: 5,
        },
      },
    ],
  },
  {
    prompt: '朋友说最近实在没精力上线，拜托你帮她代肝一周日常，你会：',
    options: [
      {
        id: 'A',
        text: '嘴上嫌一周太长，已经默默登她账号清日常了',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
      {
        id: 'B',
        text: '犹豫着说自己也挺累，半开玩笑求顿蛋糕当报酬',
        scores: {
          可爱: 20,
          感性: 15,
        },
      },
      {
        id: 'C',
        text: '干脆一起肝，开着语音边聊边把任务清掉',
        scores: {
          活力: 20,
          感性: 10,
        },
      },
      {
        id: 'D',
        text: '答应可以，先把账号权限和要做的任务都说清楚',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
    ],
  },
  {
    prompt: '盲盒机连开了好几十抽，心仪的限定学员却迟迟没来，这时你通常会：',
    options: [
      {
        id: 'A',
        text: '不太纠结，转头先去把今天的关卡和活动打了',
        scores: {
          活力: 20,
          能干: 5,
        },
      },
      {
        id: 'B',
        text: '有点小失落，盯着出货记录又翻看了好几遍',
        scores: {
          可爱: 15,
          感性: 5,
        },
      },
      {
        id: 'C',
        text: '顺手算了下还差多少到保底，心里大概有了数',
        scores: {
          能干: 15,
          傲娇: 5,
        },
      },
      {
        id: 'D',
        text: '嘴上说着无所谓，手却没停，又默默补了几抽',
        scores: {
          感性: 15,
          傲娇: 10,
        },
      },
    ],
  },
  {
    prompt: '下班路过香水店，店员给你试了四款，你最想随身带走的是：',
    options: [
      {
        id: 'A',
        text: '棉花糖加牛乳的软糯甜香，闻着让人放松',
        scores: {
          可爱: 25,
          感性: 5,
        },
      },
      {
        id: 'B',
        text: '雪松加黑茶的冷冽木质调，干净利落',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'C',
        text: '柑橘加薄荷的清爽气泡水味，闻一下就有精神',
        scores: {
          活力: 20,
          可爱: 10,
        },
      },
      {
        id: 'D',
        text: '玫瑰加黑加仑的微酸贵气味：“又不是为了给谁闻。”',
        scores: {
          傲娇: 25,
          可爱: 5,
        },
      },
    ],
  },
  {
    prompt: '竞技场遇到一个名字叫“打我是猪”的对手，连着几天把你的防守队打穿，你会：',
    options: [
      {
        id: 'A',
        text: '截图发群里吐槽两句，让大家陪着乐一乐',
        scores: {
          可爱: 20,
          活力: 10,
        },
      },
      {
        id: 'B',
        text: '干脆挂着名字蹲他几天，非要打回来不可',
        scores: {
          活力: 20,
          感性: 5,
        },
      },
      {
        id: 'C',
        text: '研究他到底强在哪，下次配队针对一下',
        scores: {
          能干: 20,
          傲娇: 5,
        },
      },
      {
        id: 'D',
        text: '嘴上说不在意，还是把他的阵容偷偷记了下来',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
    ],
  },
  {
    prompt: '如果让你用一句话形容自己最喜欢的那款游戏，你会说它是：',
    options: [
      {
        id: 'A',
        text: '嘴上嫌它又费时间又费钱，却一年都舍不得卸的小东西',
        scores: {
          傲娇: 25,
          可爱: 5,
        },
      },
      {
        id: 'B',
        text: '一场关于阵容、资源和节奏的精打细算',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'C',
        text: '一群可爱的家伙陪着自己，心里多了个小小的归处',
        scores: {
          感性: 25,
          可爱: 5,
        },
      },
      {
        id: 'D',
        text: '一个总能找到新关卡、新伙伴，玩不腻的乐园',
        scores: {
          活力: 25,
          感性: 5,
        },
      },
    ],
  },
  {
    prompt: '现在让你在面前的四束花里随手挑一束送给自己，你最想要哪一束？',
    options: [
      {
        id: 'A',
        text: '修剪整齐的白色马蹄莲，干净挺括，摆哪都得体',
        scores: {
          能干: 25,
          傲娇: 5,
        },
      },
      {
        id: 'B',
        text: '一束艳红玫瑰，价签贵得过分，嘴上说“也就还行”，还是掏了钱',
        scores: {
          傲娇: 25,
          感性: 10,
        },
      },
      {
        id: 'C',
        text: '一大把橙黄向日葵，颜色和香气都很热闹',
        scores: {
          活力: 20,
          可爱: 10,
        },
      },
      {
        id: 'D',
        text: '一捧蓬松的橘色雏菊，风一吹就轻轻晃，看着想笑',
        scores: {
          可爱: 25,
          感性: 5,
        },
      },
    ],
  },
  {
    prompt: '塔防关卡刚开局，面对一波即将到来的微型机，你的开局思路偏向：',
    options: [
      {
        id: 'A',
        text: '先按经验把产能铺稳，算好能量再逐个补位',
        scores: {
          能干: 20,
          感性: -5,
        },
      },
      {
        id: 'B',
        text: '嫌系统推荐的阵容不顺手，索性自己重排一套',
        scores: {
          傲娇: 15,
          能干: 10,
        },
      },
      {
        id: 'C',
        text: '先把自己最喜欢的学员放上去，看着顺眼最重要',
        scores: {
          可爱: 20,
          活力: 5,
        },
      },
      {
        id: 'D',
        text: '想到哪放到哪，边打边调整，乱中自己找节奏',
        scores: {
          活力: 15,
          感性: 10,
        },
      },
    ],
  },
  {
    prompt: '晚上一起联机的好友在频道里说，最近现实压力大到有点撑不住，你会：',
    options: [
      {
        id: 'A',
        text: '拉她开一局轻松的关卡，边打边把情绪散出来',
        scores: {
          活力: 20,
          能干: 5,
        },
      },
      {
        id: 'B',
        text: '只回一句“早点休息”，转头把代肝的奖励默默分了点给她',
        scores: {
          傲娇: 20,
          感性: 10,
        },
      },
      {
        id: 'C',
        text: '发几个搞怪的学员表情，想先把她逗笑一下',
        scores: {
          可爱: 15,
          活力: 10,
        },
      },
      {
        id: 'D',
        text: '打字慢慢陪她聊，听她把心里的话说完',
        scores: {
          感性: 20,
          活力: -5,
        },
      },
    ],
  },
]

const signalWeights = {
  傲娇: { 傲娇: 1, 感性: -0.12 },
  可爱: { 可爱: 1, 感性: 0.18 },
  能干: { 能干: 1 },
  活力: { 活力: 1 },
}

function optionSignal(option, dimension) {
  return Object.entries(signalWeights[dimension]).reduce(
    (sum, [sourceDimension, weight]) => sum + (option.scores[sourceDimension] ?? 0) * weight,
    0,
  )
}

export function convertQuestionScores(question, questionIndex) {
  const signals = Object.fromEntries(
    quizDimensions.map((dimension) => [
      dimension,
      question.options.map((option) => optionSignal(option, dimension)),
    ]),
  )
  const ranges = quizDimensions.map((dimension) => {
    const values = signals[dimension]
    return Math.max(...values) - Math.min(...values)
  })
  const primaryDimensionIndex = ranges.indexOf(Math.max(...ranges))
  const rankScores = [-50, -17, 17, 50]
  const balancedSplits = [
    [1, 1, -1, -1],
    [1, -1, 1, -1],
    [1, -1, -1, 1],
  ]

  return {
    ...question,
    options: question.options.map((option, optionIndex) => ({
      ...option,
      scores: Object.fromEntries(
        quizDimensions.map((dimension, dimensionIndex) => {
          const values = signals[dimension]
          if (dimensionIndex === primaryDimensionIndex) {
            const order = values
              .map((value, index) => ({ index, value }))
              .sort((left, right) => left.value - right.value || left.index - right.index)
            const rank = order.findIndex((entry) => entry.index === optionIndex)
            return [dimension, rankScores[rank]]
          }

          const split = [
            ...balancedSplits[(questionIndex + dimensionIndex) % balancedSplits.length],
          ]
          let state = (questionIndex + 1) * 101 + dimensionIndex * 37
          for (let index = split.length - 1; index > 0; index -= 1) {
            state = (state * 1664525 + 1013904223) >>> 0
            const swapIndex = state % (index + 1)
            ;[split[index], split[swapIndex]] = [split[swapIndex], split[index]]
          }
          return [dimension, split[optionIndex] * 50]
        }),
      ),
    })),
  }
}

export const personalityQuestions = personalityQuestionSource.map(convertQuestionScores)

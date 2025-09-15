<template>
  <div class="background">
    <div class="info-page">
      <header class="page-header">
        <h1>关于 织夜工具箱</h1>
        <p>一个为各位班长量身打造的开源、高效的盲盒派对工具集。</p>
        <p>
          <strong>我们的愿景是:</strong> 构建一个互助、分享、共同进步的盲盒派对玩家社区
        </p>
      </header>

      <section class="content-section runtime-section">
        <h2>运行时长</h2>
        <p class="runtime-display">
          <span class="brand-name">织夜工具箱</span> 已经服务各位班长
          <span class="time">{{ runtime.days }}</span> 天
          <span class="time">{{ runtime.hours }}</span> 小时
          <span class="time">{{ runtime.minutes }}</span> 分
          <span class="time">{{ runtime.seconds }}</span> 秒
        </p>
      </section>

      <section class="content-section" v-if="false"> <!-- 暂时没有内容所以禁用渲染 -->
        <h2>核心贡献者</h2>
        <p>本项目的成长离不开每一位贡献者的努力。以下是部分核心贡献者（排名不分先后）：</p>
        <div class="contributors-list">
          <div v-for="contributor in coreContributors" :key="contributor.name" class="contributor-card">
            <img :src="contributor.avatar" :alt="contributor.name" class="avatar">
            <div class="contributor-info">
              <h3 class="contributor-name">{{ contributor.name }}</h3>
              <p class="contributor-role">{{ contributor.role }}</p>
              <a :href="contributor.github" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section">
        <h2>特别鸣谢</h2>
        <p>感谢以下个人或组织对本项目的大力支持（排名不分先后）：</p>
        <ul class="thanks-list">
          <li v-for="(item, index) in specialThanks" :key="index">
            感谢
            <a :href="item.link" target="_blank" rel="noopener noreferrer" v-if="item.link"><strong>{{ item.supporter
                }}</strong></a>
            <strong v-else>{{ item.supporter }}</strong> {{ item.contribution }}
          </li>
        </ul>
      </section>

      <section class="content-section">
        <h2>联系我们与反馈</h2>
        <p>我们非常期待听到你的声音！<br />如果有任何建议、想法，或者在使用过程中遇到了问题，欢迎通过以下方式联系我们：</p>
        <ul class="contact-list">
          <li><strong>问题反馈与建议: </strong><a href="https://github.com/Thisisseanxu/gacha-party/issues" target="_blank"
              rel="noopener noreferrer">创建Github Issue</a></li>
          <li><strong>交流 QQ 群: </strong><a
              href="https://qm.qq.com/cgi-bin/qm/qr?k=ntxYu3FuRWgafpUguLeKdaFSt06y-TiO&jump_from=webapi&authKey=8LzsxinzBKbO6rvvvtQ4JSzXsBJDmv/1SGhBQhmoDqI8XHekcmVNpqDkE+MbzbBw"
              target="_blank" rel="noopener noreferrer">1049576192</a></li>
          <li><strong>联系邮箱: </strong><a :href="`mailto:${contactEmail}`">{{ contactEmail }}</a></li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { colors } from '@/styles/colors.js';

const startDate = new Date('2025-07-02T16:00:00'); // 项目运行时间计算
const contactEmail = ref('thisisseanxu@qq.com'); // 邮箱地址

const runtime = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 });
let timer;
const updateRuntime = () => {
  const diff = new Date() - startDate;
  runtime.value = {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
};
onMounted(() => {
  updateRuntime();
  timer = setInterval(updateRuntime, 1000);
});
onUnmounted(() => clearInterval(timer));

// 核心开发人员介绍，预留位置
// const coreContributors = ref([
//   {
//     name: '[贡献者姓名]',
//     role: '[主要贡献，如：项目发起人]',
//     avatar: '[贡献者头像URL链接]',
//     github: '[贡献者的GitHub主页链接]'
//   },
//   {
//     name: '[另一位贡献者]',
//     role: '[UI/UX 设计]',
//     avatar: '[头像URL]',
//     github: '[GitHub链接]'
//   },
// ]);

// 特别鸣谢区域
const specialThanks = ref([
  { supporter: 'B站UP熊月', contribution: '对盲盒派对及本项目的宣传推广', link: 'https://space.bilibili.com/481588861' },
  { supporter: '狸子', contribution: '对本项目的慷慨赞助' },
  { supporter: '莹烛', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: '好奇害不死', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: 'code8804', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: 'xie1000', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: '糖瓶', contribution: '提供主页UI思路&管理QQ群' },
  { supporter: '所有参与测试的班长', contribution: '提出宝贵的意见和建议' },
]);

</script>

<style scoped>
.background {
  position: relative;
  min-height: 100vh;
  background-color: #000;
  display: flex;
  overflow: hidden;
  justify-items: center;
}

.info-page {
  background-color: v-bind('colors.background.primary');
  color: v-bind('colors.text.primary');
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 40px;
}

/* 在手机上减小info-page的内边距 */
@media (max-width: 768px) {
  .info-page {
    padding: 20px 20px;
  }
}

.page-header {
  text-align: center;
  border-bottom: 1px solid v-bind('colors.border.secondary');
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5em;
  color: v-bind('colors.text.primary');
  margin-bottom: 10px;
}

.page-header p {
  font-size: 1.1em;
  color: v-bind('colors.text.secondary');
}

.content-section {
  margin-bottom: 40px;
}

.content-section h2 {
  font-size: 1.8em;
  color: v-bind('colors.text.primary');
  border-bottom: 2px solid v-bind('colors.brand.primary');
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.content-section p,
.content-section li {
  line-height: 1.8;
  font-size: 1.1em;
  color: v-bind('colors.text.light');
}

a {
  color: v-bind('colors.brand.primary');
  text-decoration: none;
  font-weight: bold;
}

a:hover {
  color: v-bind('colors.brand.hover');
  text-decoration: underline;
}

.runtime-section .runtime-display {
  background-color: v-bind('colors.background.content');
  border-left: 5px solid v-bind('colors.brand.primary');
  padding: 20px;
  font-size: 1.2em;
  text-align: center;
  border-radius: 5px;
}

.runtime-display .brand-name {
  font-weight: bold;
  color: v-bind('colors.brand.primary');
}

.runtime-display .time {
  font-weight: bold;
  font-size: 1.5em;
  color: v-bind('colors.text.highlight');
  padding: 0 5px;
  min-width: 40px;
  display: inline-block;
}

/* 核心贡献者样式 */
.contributors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.contributor-card {
  display: flex;
  align-items: center;
  background: v-bind('colors.background.light');
  padding: 15px;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
  flex-basis: 280px;
  flex-grow: 1;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  background-color: v-bind('colors.background.avatar');
  border: 2px solid v-bind('colors.border.secondary');
}

.contributor-name {
  margin: 0 0 5px 0;
  color: v-bind('colors.text.primary');
}

.contributor-role {
  margin: 0;
  font-size: 0.9em;
  color: v-bind('colors.text.tertiary');
}

/* 鸣谢与联系方式列表 */
.thanks-list,
.contact-list {
  list-style: none;
  text-align: left;
  padding-left: 0;
}

.thanks-list li,
.contact-list li {
  background-color: v-bind('colors.background.light');
  border: 1px solid v-bind('colors.border.primary');
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.thanks-list li:hover,
.contact-list li:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px v-bind('colors.shadow.primaryHover');
  border-color: v-bind('colors.background.lighter');
}

.thanks-list strong {
  color: v-bind('colors.text.highlight');
}
</style>

<template>
  <div class="background" :class="{ 'smooth-transition': isReady }">
    <router-link to="/" class="back-btn">
      <return theme="outline" size="24" />
      <span>返回首页</span>
    </router-link>

    <div class="about-container" :class="{ 'smooth-transition': isReady }">
      <header class="page-header">
        <h1 class="title">关于 织夜工具箱</h1>
        <p class="subtitle">一个为各位班长量身打造的开源、高效的盲盒派对工具集。</p>
        <p class="vision"><strong>我们的愿景是：</strong> 构建一个互助、分享、共同进步的玩家社区</p>
      </header>

      <div class="content-scroll">
        <section class="card-section">
          <div class="runtime-display">
            <span class="brand-name">织夜工具箱</span> 已经服务各位班长
            <div class="time-group">
              <div class="time-block">
                <span class="num">{{ runtime.days }}</span>
                <span class="unit">天</span>
              </div>
              <div class="time-block">
                <span class="num">{{ runtime.hours }}</span>
                <span class="unit">小时</span>
              </div>
              <div class="time-block">
                <span class="num">{{ runtime.minutes }}</span>
                <span class="unit">分钟</span>
              </div>
              <div class="time-block">
                <span class="num">{{ runtime.seconds }}</span>
                <span class="unit">秒</span>
              </div>
            </div>
          </div>
        </section>

        <section class="card-section">
          <h2 class="section-title">
            <thumbs-up theme="outline" size="22" />
            <span>特别鸣谢</span>
          </h2>
          <div class="thanks-grid">
            <component :is="item.link ? 'a' : 'div'" v-for="(item, index) in specialThanks" :key="index"
              class="thank-card" :class="{ 'has-link': !!item.link }" :href="item.link"
              :target="item.link ? '_blank' : undefined" :rel="item.link ? 'noopener noreferrer' : undefined">
              <div class="thank-content">
                <span class="supporter">{{ item.supporter }}</span>
                <span class="contribution">{{ item.contribution }}</span>
              </div>
            </component>
          </div>
        </section>

        <section class="card-section">
          <h2 class="section-title">
            <comment theme="outline" size="22" />
            <span>联系与反馈</span>
          </h2>
          <div class="contact-group">
            <a href="https://github.com/Thisisseanxu/gacha-party/issues" target="_blank" class="contact-btn github">
              <github-one theme="outline" size="24" />
              <span>Github Issue</span>
            </a>
            <a href="https://qm.qq.com/cgi-bin/qm/qr?k=ntxYu3FuRWgafpUguLeKdaFSt06y-TiO&jump_from=webapi&authKey=8LzsxinzBKbO6rvvvtQ4JSzXsBJDmv/1SGhBQhmoDqI8XHekcmVNpqDkE+MbzbBw"
              target="_blank" class="contact-btn qq">
              <tencent-qq theme="outline" size="24" />
              <span>加入QQ群</span>
            </a>
            <a :href="`mailto:${contactEmail}`" class="contact-btn mail">
              <mail theme="outline" size="24" />
              <span>邮件联系</span>
            </a>
          </div>
        </section>
      </div>
    </div>

    <button @click="toggleTheme" class="theme-toggle-btn" title="切换主题">
      <moon v-if="currentTheme.value === 'dark'" />
      <sun-one v-else />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { colors, toggleTheme, currentTheme } from '@/styles/colors.js'
import { Return, ThumbsUp, Comment, GithubOne, TencentQq, Mail, Moon, SunOne } from '@icon-park/vue-next'

const startDate = new Date('2025-07-02T16:00:00') // 项目运行时间计算
const contactEmail = ref('thisisseanxu@qq.com') // 邮箱地址
const isReady = ref(false)

const runtime = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
let timer

const updateRuntime = () => {
  const diff = new Date() - startDate
  if (diff < 0) return // 防止时间倒流显示负数
  runtime.value = {
    days: Math.floor(diff / 86400000),
    hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
    minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
    seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
  }
}

onMounted(() => {
  updateRuntime()
  timer = setInterval(updateRuntime, 1000)
  setTimeout(() => {
    isReady.value = true
  }, 100)
})

onUnmounted(() => clearInterval(timer))

// 特别鸣谢区域
const specialThanks = ref([
  {
    supporter: 'B站UP熊月',
    contribution: '对盲盒派对及本项目的宣传推广',
    link: 'https://space.bilibili.com/481588861',
  },
  { supporter: '狸子', contribution: '对本项目的慷慨赞助' },
  { supporter: '莹烛', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: '好奇害不死', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: 'code8804', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: 'xie1000', contribution: '管理QQ群并帮助班长解决问题' },
  { supporter: '糖瓶', contribution: '提供主页UI思路&管理QQ群' },
  { supporter: '所有参与测试的班长', contribution: '提出宝贵的意见和建议' },
])
</script>

<style scoped>
.background {
  position: relative;
  min-height: 100dvh;
  background-color: v-bind('colors.background.primary');
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.background.smooth-transition {
  transition: background-color 1s ease;
}

.background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/homepage_bg.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 1;
}

.about-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: min(100vw, 800px);
  max-height: 100vh;
  background-color: v-bind('colors.background.content');
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  box-sizing: border-box;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.about-container.smooth-transition {
  transition: background-color 1s ease;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: v-bind('colors.text.primary');
  text-decoration: none;
  font-weight: bold;
  background: v-bind('colors.background.content');
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 1px solid v-bind('colors.border.primary');
}

.back-btn:hover {
  transform: translateX(-2px);
  background: v-bind('colors.background.light');
}

.page-header {
  text-align: center;
  flex-shrink: 0;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: v-bind('colors.text.tertiary');
  margin: 0 0 0.5rem 0;
}

.vision {
  font-size: 0.9rem;
  color: v-bind('colors.text.highlight');
  opacity: 0.9;
  margin: 0 0 0.5rem 0;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  /* Custom Scrollbar styling could go here */
}

.content-scroll::-webkit-scrollbar {
  width: 6px;
}

.content-scroll::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.border.primary');
  border-radius: 3px;
}

.card-section {
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 0.5rem;
  border: 1px solid v-bind('colors.border.primary');
}

.section-title {
  font-size: 1.2rem;
  color: v-bind('colors.text.primary');
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Runtime Display */
.runtime-display {
  text-align: center;
  color: v-bind('colors.text.tertiary');
}

.brand-name {
  color: v-bind('colors.text.highlight');
  font-weight: bold;
}

.time-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: v-bind('colors.background.primary');
  padding: 0.5rem;
  border-radius: 8px;
  min-width: 60px;
  border: 1px solid v-bind('colors.border.primary');
}

.time-block .num {
  font-size: 1.5rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  font-family: monospace;
}

.time-block .unit {
  font-size: 0.8rem;
  color: v-bind('colors.text.tertiary');
}

/* Thanks Grid */
.thanks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.8rem;
}

.thank-card {
  background: v-bind('colors.background.primary');
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
  transition: transform 0.2s;
  text-decoration: none;
  color: inherit;
  display: block;
}

.thank-card.has-link:hover {
  transform: translateY(-2px);
  border-color: v-bind('colors.text.highlight');
  cursor: pointer;
}

.thank-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.supporter {
  font-weight: bold;
  color: v-bind('colors.text.primary');
}

.thank-card.has-link .supporter {
  color: v-bind('colors.text.highlight');
}

.contribution {
  font-size: 0.85rem;
  color: v-bind('colors.text.tertiary');
}

/* Contact Group */
.contact-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.contact-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  color: white;
  font-weight: bold;
  transition: all 0.3s ease;
}

.contact-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.contact-btn.github {
  background: #333;
}

.contact-btn.qq {
  background: #12b7f5;
}

.contact-btn.mail {
  background: #ea4335;
}

.theme-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
  font-size: 24px;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .about-container {
    height: 100dvh;
    border-radius: 0;
    padding: 1rem;
  }

  .back-btn {
    top: 10px;
    left: 10px;
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  .page-header {
    margin-top: 2rem;
  }

  .time-group {
    gap: 0.5rem;
  }

  .time-block {
    min-width: 50px;
    padding: 0.4rem;
  }

  .time-block .num {
    font-size: 1.2rem;
  }
}
</style>

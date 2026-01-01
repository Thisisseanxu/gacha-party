<template>
  <div class="background-container">
    <video autoplay loop muted playsinline class="background-video">
      <source src="/assets/zako.mp4" type="video/mp4" />
      <source src="/assets/zako.ogg" type="video/ogg" />
      您的浏览器不支持 HTML5 video 标签。
    </video>
    <div class="content-overlay">
      <TransitionGroup name="fly-up" tag="div" class="text-container">
        <div v-for="textItem in floatingTexts" :key="textItem.id" class="floating-text"
          :style="getFloatingTextStyle(textItem)">
          {{ textItem.text }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { logger } from '@/utils/logger';
import { ref, onMounted, onUnmounted } from 'vue';

const customText = ref('雑魚'); // 默认文本
const customFont = ref(''); // 默认字体

// 音频和文字动画的响应式数据
const floatingTexts = ref([]);
let textId = 0;
let audioInterval;
let textInterval;

// 播放音效
const playSound = () => {
  const audio = new Audio(new URL('/assets/zako.ogg', import.meta.url).href);
  audio.play().catch(error => logger.error("音频播放失败:", error));
};

// 创建新的文字
const createFloatingText = () => {
  const newText = {
    id: textId++,
    text: customText.value,
    left: Math.random() * 90,
    duration: Math.random() * 5 + 3,
  };
  floatingTexts.value.push(newText);

  setTimeout(() => {
    floatingTexts.value.shift();
  }, newText.duration * 1000);
};

onMounted(() => {
  // 从URL参数获取自定义文本和字体
  const urlParams = new URLSearchParams(window.location.search);
  const textFromUrl = urlParams.get('text');
  const fontFromUrl = urlParams.get('font');

  if (textFromUrl) {
    customText.value = textFromUrl;
  }
  if (fontFromUrl) {
    customFont.value = fontFromUrl;
  }
  audioInterval = setInterval(playSound, 1200);
  textInterval = setInterval(createFloatingText, 1200);
});
// 组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(audioInterval);
  clearInterval(textInterval);
});

// 计算文字样式，如果没有定义字体则使用系统默认字体
function getFloatingTextStyle(textItem) {
  const style = {
    left: textItem.left + '%',
    animationDuration: textItem.duration + 's',
  };
  if (customFont.value.trim() !== '') {
    style.fontFamily = customFont.value;
  } else {
    style.fontFamily = 'system-ui'; // 默认字体
  }
  return style;
}
</script>

<style scoped>
.background-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: auto;
  height: auto;
  min-width: 100%;
  min-height: 100%;
  transform: translate(-50%, -50%);
  z-index: -1;
}

.content-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.text-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-text {
  position: absolute;
  bottom: -50px;
  color: pink;
  font-size: 4rem;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  animation-name: fly-up-animation;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes fly-up-animation {
  from {
    transform: translateY(0);
    opacity: 1;
  }

  to {
    transform: translateY(-110vh);
    opacity: 0.8;
  }
}
</style>

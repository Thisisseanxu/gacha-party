<template>
  <div class="badge-preview-root">
    <!-- Hidden badge grid for rendering -->
    <div class="badge-capture-wrapper" ref="captureWrapperRef" aria-hidden="true">
      <div class="badges-grid" :class="`grid-${strategy.slots?.length}`" ref="captureRef">
        <div v-for="(slot, index) in strategy.slots" :key="index" class="badge-item">
          <div class="badge-main-visual">
            <img v-if="slot.rarityId !== '0'" :src="getHuizhangBgUrl(slot.rarityId, slot.shape)" class="badge-bg-img"
              alt="bg" />
            <div class="badge-icon-container">
              <svg class="badge-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <defs>
                  <clipPath :id="`bclip-${uid}-${index}`">
                    <circle v-if="slot.shape === HUIZHANG_SHAPES.CIRCLE" cx="50" cy="50" r="45" />
                    <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.DIAMOND" points="50,5 95,50 50,95 5,50" />
                    <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.SHIELD" points="12,6 88,6 88,70 50,95 12,70" />
                  </clipPath>
                </defs>
                <g v-if="slot.rarityId === '0'">
                  <circle v-if="slot.shape === HUIZHANG_SHAPES.CIRCLE" cx="50" cy="50" r="45"
                    fill="rgba(200, 200, 200, 0.3)" />
                  <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.DIAMOND" points="50,5 95,50 50,95 5,50"
                    fill="rgba(200, 200, 200, 0.3)" />
                  <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.SHIELD" points="12,6 88,6 88,70 50,95 12,70"
                    fill="rgba(200, 200, 200, 0.3)" />
                </g>
                <image v-else :xlink:href="iconBase64Map[slot.typeId] || HUIZHANG_TYPES[slot.typeId]?.icon"
                  :href="iconBase64Map[slot.typeId] || HUIZHANG_TYPES[slot.typeId]?.icon" x="-12.5" y="-12.5"
                  width="125" height="125" preserveAspectRatio="xMidYMid slice"
                  :clip-path="`url(#bclip-${uid}-${index})`" />
              </svg>
            </div>
            <div class="badge-sub-icon">
              <img v-if="charConfig?.theme?.icon" :src="charConfig.theme.icon" class="sub-icon-img" alt="theme" />
            </div>
          </div>
          <div class="badge-stars-container" v-if="slot.rarityId !== '0'">
            <div class="badge-stars-row">
              <img v-for="n in 5" :key="n" :src="getStarImage(slot.level, n)" class="level-star-img" alt="★" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Display -->
    <div class="badge-preview-display">
      <div v-if="isRendering" class="badge-loading"></div>
      <img v-else-if="imageSrc" :src="imageSrc" class="badge-preview-img" alt="徽章预览" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { toPng } from 'html-to-image'
import { HUIZHANG_SHAPES, HUIZHANG_TYPES, getHuizhangBgUrl } from '@/data/huizhang.js'
import { logger } from '@/utils/logger'

const props = defineProps({
  strategy: { type: Object, required: true },
  charConfig: { type: Object, default: null },
})

const captureRef = ref(null)
const imageSrc = ref('')
const isRendering = ref(true)
const iconBase64Map = ref({})
const uid = Math.random().toString(36).slice(2, 8)

const getStarImage = (level, starIndex) => {
  let typeIndex = 0
  if (level === 0) typeIndex = 0
  else if (level <= 5) typeIndex = starIndex <= level ? 1 : 0
  else if (level <= 10) typeIndex = starIndex <= level - 5 ? 2 : 1
  else typeIndex = starIndex <= level - 10 ? 3 : 2
  return `/images/huizhang/icon_star_${typeIndex}.webp`
}

const urlToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

onMounted(async () => {
  if (!captureRef.value) return
  try {
    const slots = props.strategy?.slots || []
    for (const slot of slots) {
      const url = HUIZHANG_TYPES[slot.typeId]?.icon
      if (url && !iconBase64Map.value[slot.typeId]) {
        try {
          iconBase64Map.value[slot.typeId] = await urlToBase64(url)
        } catch { /* ignore */ }
      }
    }
    await new Promise((r) => setTimeout(r, 60))
    const dataUrl = await toPng(captureRef.value, {
      pixelRatio: 2,
      backgroundColor: null,
      width: 310,
      height: 220,
      cacheBust: false,
    })
    imageSrc.value = dataUrl
  } catch (err) {
    logger.error('徽章预览生成失败:', err)
  } finally {
    isRendering.value = false
  }
})
</script>

<style scoped>
.badge-capture-wrapper {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 310px;
  height: 220px;
  pointer-events: none;
  overflow: visible;
}

.badges-grid {
  display: grid;
  background-size: cover;
  width: 310px;
  height: 220px;
  align-content: center;
  justify-items: center;
}

.grid-6 {
  grid-template-columns: repeat(3, 1fr);
  background-image: url('/images/huizhang/badge_6.webp');
  gap: 20px;
  padding: 40px 10px 20px 10px;
}

.grid-4 {
  grid-template-columns: repeat(2, 1fr);
  background-image: url('/images/huizhang/badge_4.webp');
  padding: 30px 10px 30px 10px;
  gap: 40px;
}

.grid-4 .badge-item:nth-child(1) {
  grid-column: span 2;
  margin-bottom: -60px;
}

.grid-4 .badge-item:nth-child(4) {
  grid-column: span 2;
  margin-top: -60px;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
  background-image: url('/images/huizhang/badge_2.webp');
  gap: 40px;
  padding: 40px 10px 20px 10px;
}

.badge-item {
  width: 90px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.badge-main-visual {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-bg-img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 1;
}

.badge-icon-container {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.badge-icon-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.badge-sub-icon {
  position: absolute;
  bottom: 0px;
  left: 0px;
  z-index: 3;
  width: 28px;
  height: 28px;
}

.sub-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.badge-stars-container {
  margin-top: 4px;
  background-color: rgba(30, 20, 50, 0.7);
  border-radius: 10px;
  padding: 2px 6px;
  border: 1px solid rgba(150, 130, 170, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.badge-stars-row {
  display: flex;
  align-items: center;
}

.level-star-img {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

/* Display */
.badge-preview-display {
  width: 155px;
  height: 110px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.badge-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.badge-loading {
  width: 100%;
  height: 100%;
  background: rgba(128, 128, 128, 0.15);
  border-radius: 6px;
}

.badge-preview-root {
  display: contents;
}
</style>

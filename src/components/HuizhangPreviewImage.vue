<template>
  <div class="preview-root">
    <!-- Hidden capture area for rendering -->
    <div v-if="!previewSrc" class="capture-wrapper" ref="captureWrapperRef" aria-hidden="true">
      <div class="capture-area" ref="captureRef">
        <div class="bg-decoration">
          <div class="stars-bg"></div>
        </div>

        <div v-if="strategy.stars?.length > 0" class="star-rating-display">
          <div class="star-label">适配星级</div>
          <div class="stars-row">
            <div v-for="star in sortedStars" :key="star" class="star-item-img-wrapper">
              <img :src="`/images/huizhang/contract_star_${star}.webp`" class="star-img-lg" alt="star" />
            </div>
          </div>
        </div>

        <div class="character-display">
          <img :src="charConfig?.image_url || cardInfo?.imageUrl" class="char-img" />
        </div>

        <div class="badges-container">
          <div class="badges-grid" :class="`grid-${strategy.slots?.length}`">
            <div v-for="(slot, index) in strategy.slots" :key="index" class="badge-item">
              <div class="badge-main-visual">
                <img v-if="slot.rarityId !== '0'" :src="getHuizhangBgUrl(slot.rarityId, slot.shape)"
                  class="badge-bg-img" alt="bg" />
                <div class="badge-icon-container">
                  <svg class="badge-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink">
                    <defs>
                      <clipPath :id="`pclip-${uid}-${index}`">
                        <circle v-if="slot.shape === HUIZHANG_SHAPES.CIRCLE" cx="50" cy="50" r="45" />
                        <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.DIAMOND" points="50,5 95,50 50,95 5,50" />
                        <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.SHIELD"
                          points="12,6 88,6 88,70 50,95 12,70" />
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
                      :clip-path="`url(#pclip-${uid}-${index})`" />
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

        <div class="info-panel">
          <div class="active-effects">
            <span class="label">套装效果：</span>
            <span class="effect-text">{{ calculatedEffects }}</span>
          </div>
          <div class="recommendation-text">
            <span class="label">{{ strategy.recTitle }}</span>
            <p>{{ strategy.recText }}</p>
          </div>
        </div>

        <div class="watermark">织夜工具箱 · 盲盒派对</div>
        <div v-if="strategy.authorName" class="author-display">作者：{{ strategy.authorName }}</div>
      </div>
    </div>

    <!-- Display area -->
    <div class="preview-display">
      <div v-if="isRendering" class="render-loading">
        <span class="loading-text">生成预览中…</span>
      </div>
      <img v-else-if="imageSrc" :src="imageSrc" class="rendered-img" alt="攻略预览"
        :style="{ maxWidth: '100%', maxHeight: '100%' }" />
      <div v-else class="render-error">预览生成失败，请刷新页面重试</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { toPng } from 'html-to-image'
import { allCards } from '@/data/cards.js'
import { HUIZHANG_SHAPES, HUIZHANG_TYPES, getHuizhangBgUrl } from '@/data/huizhang.js'
import { colors } from '@/styles/colors.js'
import { logger } from '@/utils/logger'

const props = defineProps({
  strategy: { type: Object, required: true },
  charConfig: { type: Object, default: null },
  previewSrc: { type: String, default: '' },
})

const emit = defineEmits(['generated'])

const captureRef = ref(null)
const captureWrapperRef = ref(null)
const imageSrc = ref('')
const isRendering = ref(true)
const iconBase64Map = ref({})

// Unique ID per instance to avoid clipPath conflicts
const uid = Math.random().toString(36).slice(2, 8)

const cardInfo = computed(() => allCards.find((c) => c.id === props.strategy?.charId) || null)

const sortedStars = computed(() => [...(props.strategy?.stars || [])].sort((a, b) => a - b))

const calculatedEffects = computed(() => {
  const slots = props.strategy?.slots || []
  const counts = {}
  slots.forEach((slot) => {
    counts[slot.typeId] = (counts[slot.typeId] || 0) + 1
  })
  delete counts['none']
  const effects = []
  for (const [typeId, count] of Object.entries(counts)) {
    const t = HUIZHANG_TYPES[typeId]
    if (!t) continue
    if (count >= 4) {
      const total = (t.act2 || 0) + (t.act4 || 0)
      let str = `${total}% ${t.name}`
      if (t.act4extra) str += `&${t.act4extra}`
      effects.push(str)
    } else if (count >= 2) {
      effects.push(`${t.act2 || 0}% ${t.name}`)
    }
  }
  return effects.length > 0 ? effects.join(' + ') : '无套装效果'
})

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

const preloadIcons = async () => {
  const slots = props.strategy?.slots || []
  for (const slot of slots) {
    const typeId = slot.typeId
    const url = HUIZHANG_TYPES[typeId]?.icon
    if (url && !iconBase64Map.value[typeId]) {
      try {
        iconBase64Map.value[typeId] = await urlToBase64(url)
      } catch (e) {
        logger.error('图标转换失败:', url, e)
      }
    }
  }
}

const renderToImage = async () => {
  if (props.previewSrc) {
    imageSrc.value = props.previewSrc
    isRendering.value = false
    return
  }
  if (!captureRef.value) return
  isRendering.value = true
  try {
    await preloadIcons()
    // Wait for DOM updates with icons loaded
    await new Promise((r) => setTimeout(r, 80))
    const dataUrl = await toPng(captureRef.value, {
      pixelRatio: 2,
      backgroundColor: null,
      width: 800,
      height: 550,
      cacheBust: false,
      skipFonts: false,
    })
    imageSrc.value = dataUrl
    emit('generated', dataUrl)
  } catch (err) {
    logger.error('预览生成失败:', err)
    imageSrc.value = ''
  } finally {
    isRendering.value = false
  }
}

onMounted(() => {
  renderToImage()
})

watch(() => props.strategy, () => {
  imageSrc.value = ''
  renderToImage()
}, { deep: true })

watch(() => props.previewSrc, (newVal) => {
  if (newVal) {
    imageSrc.value = newVal
    isRendering.value = false
  }
})
</script>

<style scoped>
/* Off-screen hidden capture wrapper */
.capture-wrapper {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 800px;
  height: 550px;
  pointer-events: none;
  overflow: visible;
}

.capture-area {
  width: 800px;
  height: 550px;
  position: relative;
  background-image: url('/images/huizhang/bg.webp');
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

/* Preview display area */
.preview-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rendered-img {
  display: block;
  width: auto;
  height: auto;
  border-radius: 8px;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.render-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  background: v-bind('colors.background.light');
  border-radius: 8px;
  border: 1px dashed v-bind('colors.border.primary');
}

.loading-text {
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
}

.render-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  background: v-bind('colors.background.light');
  border-radius: 8px;
  color: v-bind('colors.text.secondary');
  font-size: 0.85rem;
}

/* ---- Capture area internal styles (same as editor) ---- */
.star-rating-display {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  background: v-bind('colors.preview.overlay');
  padding: 8px 16px;
  border-radius: 30px;
  align-items: center;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.star-label {
  font-size: 1rem;
  color: v-bind('colors.preview.text');
  margin-right: 8px;
}

.stars-row {
  display: flex;
  gap: 5px;
}

.star-item-img-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-img-lg {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.character-display {
  position: absolute;
  bottom: 80px;
  left: 70px;
  display: flex;
  align-items: flex-end;
}

.char-img {
  width: 256px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
}

.badges-container {
  position: absolute;
  top: 10px;
  right: 20px;
  justify-items: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  background-color: v-bind('colors.preview.panelBg');
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

.info-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  min-width: 370px;
  max-width: 480px;
  min-height: 180px;
  background: v-bind('colors.preview.panelBg');
  border: 1px solid #555;
  border-radius: 10px;
  padding: 12px;
  text-align: left;
  z-index: 0;
}

.active-effects {
  margin-bottom: 8px;
  border-bottom: 1px solid v-bind('colors.preview.divideline');
  padding-bottom: 8px;
  white-space: nowrap;
}

.label {
  color: v-bind('colors.preview.secondary');
  font-size: 0.9rem;
  font-weight: bold;
}

.effect-text {
  color: v-bind('colors.preview.highlight');
  font-size: 1.1rem;
  font-weight: bold;
  margin-left: 5px;
}

.recommendation-text p {
  color: v-bind('colors.preview.text');
  font-size: 0.9rem;
  margin: 5px 0 0 0;
  line-height: 1.4;
  white-space: pre-wrap;
}

.watermark {
  position: absolute;
  bottom: 0px;
  right: 0px;
  font-size: 1rem;
  color: v-bind('colors.preview.watermark');
}

.author-display {
  position: absolute;
  bottom: 5px;
  left: 10px;
  font-size: 0.9rem;
  color: v-bind('colors.preview.author');
  z-index: 15;
}

.preview-root {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>

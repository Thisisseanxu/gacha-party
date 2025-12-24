<template>
  <div class="page-container">
    <div class="strategy-editor">

      <div class="controls-panel card">
        <h2>攻略配置</h2>

        <div class="control-group">
          <label>选择角色</label>
          <select v-model="selectedCharId" class="input-select">
            <option v-for="card in allCards" :key="card.id" :value="card.id" :disabled="!isCharAdapted(card.id)">
              {{ card.name }} {{ isCharAdapted(card.id) ? '' : '(未适配)' }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label>适配星级 (点击切换)</label>
          <div class="star-selector">
            <span v-for="i in 6" :key="i - 1" class="star-btn" :class="{ active: recommendedStars.includes(i - 1) }"
              @click="toggleStar(i - 1)">
              {{ i - 1 }}★
            </span>
          </div>
        </div>

        <div class="badge-editors">
          <h3>徽章配置</h3>
          <div v-for="(slot, index) in currentSlots" :key="index" class="badge-row">
            <span class="badge-index">#{{ index + 1 }}</span>
            <select v-model="slot.rarityId" class="mini-select">
              <option v-for="r in Object.values(HUIZHANG_RARITY)" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <select v-model="slot.typeId" class="mini-select">
              <option v-for="t in Object.values(HUIZHANG_TYPES)" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <input type="number" v-model.number="slot.level" min="0" max="15" class="mini-input" title="等级0-15">
            <span class="shape-hint">({{ getShapeName(slot.shape) }})</span>
          </div>
        </div>

        <div class="control-group">
          <input v-model="recommendTitle" class="input-select" style="margin-bottom: 8px; font-weight: bold;"
            placeholder="小标题">
          <textarea v-model="recommendText" rows="4" placeholder="文本内容"></textarea>
        </div>

        <div class="action-buttons">
          <button @click="generateImage" class="generate-btn">生成并下载攻略图</button>
        </div>
      </div>

      <div class="preview-wrapper">
        <p class="preview-hint">↓ 预览区域 ↓</p>
        <div class="capture-area" ref="captureRef">

          <div class="bg-decoration">
            <div class="stars-bg"></div>
          </div>

          <div v-if="recommendedStars.length > 0" class="star-rating-display">
            <div class="star-label">适配星级</div>
            <div class="stars-row">
              <div v-for="star in sortedStars" :key="star" class="star-item-img-wrapper">
                <img :src="`/images/huizhang/contract_star_${star}.webp`" class="star-img-lg" alt="star">
              </div>
            </div>
          </div>

          <div class="character-display">
            <img :src="currentCharConfig?.image_url || selectedCardInfo.imageUrl" class="char-img"
              crossOrigin="anonymous" />
          </div>

          <div class="badges-container">
            <div class="badges-grid" :class="`grid-${currentSlots.length}`">
              <div v-for="(slot, index) in currentSlots" :key="index" class="badge-item">
                <div class="badge-main-visual">
                  <img :src="getHuizhangBgUrl(slot.rarityId, slot.shape)" class="badge-bg-img" alt="bg">

                  <div class="badge-icon-container">
                    <svg class="badge-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink">
                      <defs>
                        <clipPath :id="`badge-clip-${index}`">
                          <circle v-if="slot.shape === HUIZHANG_SHAPES.CIRCLE" cx="50" cy="50" r="45" />
                          <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.DIAMOND" points="50,5 95,50 50,95 5,50" />
                          <polygon v-else-if="slot.shape === HUIZHANG_SHAPES.SHIELD"
                            points="12,6 88,6 88,70 50,95 12,70" />
                        </clipPath>
                      </defs>
                      <!-- <rect x="-12.5" y="-12.5" width="125" height="125" fill="rgba(34, 34, 34, 0.8)"
                        :clip-path="`url(#badge-clip-${index})`" /> -->
                      <image :xlink:href="iconBase64Map[slot.typeId] || HUIZHANG_TYPES[slot.typeId].icon"
                        :href="iconBase64Map[slot.typeId] || HUIZHANG_TYPES[slot.typeId].icon" x="-12.5" y="-12.5"
                        width="125" height="125" preserveAspectRatio="xMidYMid slice"
                        :clip-path="`url(#badge-clip-${index})`" />
                    </svg>
                  </div>

                  <div class="badge-sub-icon">
                    <img v-if="currentCharConfig?.theme?.icon" :src="currentCharConfig.theme.icon" class="sub-icon-img"
                      alt="theme">
                  </div>
                </div>

                <div class="badge-stars-container">
                  <div class="badge-stars-row">
                    <img v-for="n in 5" :key="n" :src="getStarImage(slot.level, n)" class="level-star-img" alt="★">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-panel">
            <div class="active-effects">
              <span class="label">激活效果：</span>
              <span class="effect-text">{{ calculatedEffects }}</span>
            </div>
            <div class="recommendation-text">
              <span class="label">{{ recommendTitle }}</span>
              <p>{{ recommendText }}</p>
            </div>
          </div>

          <div class="watermark">织夜工具箱 · 盲盒派对</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { allCards } from '@/data/cards.js';
import { colors } from '@/styles/colors.js';
import {
  HUIZHANG_SHAPES,
  HUIZHANG_RARITY,
  HUIZHANG_TYPES,
  getCharHuizhangSlots,
  getHuizhangBgUrl
} from '@/data/huizhang.js';
import html2canvas from 'html2canvas';

// 输出allcards的所有id
console.log('All Cards IDs:', allCards.map(c => c.id));

// 状态
const selectedCharId = ref('');
const recommendedStars = ref([0, 5]);
const recommendTitle = ref('推荐理由：');
const recommendText = ref('');
const captureRef = ref(null);
const currentSlots = ref([]);
const iconBase64Map = ref({});

// 检查角色是否适配
const isCharAdapted = (id) => {
  return !!getCharHuizhangSlots(id);
};

// 初始化
onMounted(() => {
  const firstAdapted = allCards.find(c => isCharAdapted(c.id));
  if (firstAdapted) {
    selectedCharId.value = firstAdapted.id;
  }
});

const selectedCardInfo = computed(() => {
  return allCards.find(c => c.id === selectedCharId.value) || {};
});

const currentCharConfig = computed(() => {
  return getCharHuizhangSlots(selectedCharId.value);
});

watch(selectedCharId, (newId) => {
  if (!newId) return;
  const config = getCharHuizhangSlots(newId);
  if (config && config.shape) {
    currentSlots.value = config.shape.map(shapeStr => ({
      shape: shapeStr,
      rarityId: HUIZHANG_RARITY.GOLD.id,
      typeId: 'atk',
      level: 10
    }));
  } else {
    currentSlots.value = [];
  }
});

// 将图片转换为 Base64 以解决 html2canvas 在 SVG 中无法渲染外部图片的问题
const urlToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

watch(() => currentSlots.value, async (newSlots) => {
  for (const slot of newSlots) {
    const typeId = slot.typeId;
    const url = HUIZHANG_TYPES[typeId]?.icon;
    if (url && !iconBase64Map.value[typeId]) {
      try {
        const base64 = await urlToBase64(url);
        iconBase64Map.value[typeId] = base64;
      } catch (e) {
        console.error('Icon to Base64 failed:', url, e);
      }
    }
  }
}, { deep: true, immediate: true });

const getShapeName = (shape) => {
  if (shape === HUIZHANG_SHAPES.CIRCLE) return '圆';
  if (shape === HUIZHANG_SHAPES.DIAMOND) return '菱';
  if (shape === HUIZHANG_SHAPES.SHIELD) return '盾';
  return shape;
};

const sortedStars = computed(() => {
  return [...recommendedStars.value].sort((a, b) => a - b);
});

const toggleStar = (star) => {
  const index = recommendedStars.value.indexOf(star);
  if (index > -1) recommendedStars.value.splice(index, 1);
  else recommendedStars.value.push(star);
};

const calculatedEffects = computed(() => {
  const counts = {};
  currentSlots.value.forEach(slot => {
    counts[slot.typeId] = (counts[slot.typeId] || 0) + 1;
  });

  const effects = [];
  for (const [typeId, count] of Object.entries(counts)) {
    const typeName = HUIZHANG_TYPES[typeId]?.name || typeId;
    if (count >= 4) {
      effects.push(`2&4${typeName}`);
    } else if (count >= 2) {
      effects.push(`2${typeName}`);
      if (count - 2 >= 2) effects.push(`2${typeName}`);
    }
  }

  if (effects.length === 0) return '无激活效果';
  return effects.join(' + ');
});

// 获取徽章等级对应的星星图片路径
const getStarImage = (level, starIndex) => {
  // 映射逻辑:
  // 0: 灰 (icon_star_0)
  // 1: 金 (icon_star_1)
  // 2: 紫/彩 (icon_star_2)
  // 3: 红 (icon_star_3)

  let typeIndex = 0; // 默认为灰

  if (level === 0) {
    typeIndex = 0;
  } else if (level <= 5) {
    // 1-5级：starIndex <= level 为金，否则灰
    typeIndex = starIndex <= level ? 1 : 0;
  } else if (level <= 10) {
    // 6-10级：starIndex <= (level - 5) 为紫，否则金
    typeIndex = starIndex <= (level - 5) ? 2 : 1;
  } else {
    // 11-15级：starIndex <= (level - 10) 为红，否则紫
    typeIndex = starIndex <= (level - 10) ? 3 : 2;
  }

  return `/images/huizhang/icon_star_${typeIndex}.webp`;
};

// 生成图片
const generateImage = async () => {
  if (!captureRef.value) return;
  try {
    await nextTick();
    const canvas = await html2canvas(captureRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.download = `徽章攻略-${selectedCardInfo.value.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('生成图片失败:', err);
    alert('生成失败');
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: v-bind('colors.background.primary');
  display: flex;
  justify-content: center;
  padding: 8px;
  color: v-bind('colors.text.primary');
}

.strategy-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 1400px;
  width: 100%;
}

.controls-panel {
  flex: 1;
  min-width: 280px;
  background: v-bind('colors.background.content');
  padding: 15px;
  border-radius: 12px;
  height: fit-content;
  box-sizing: border-box;
}

.control-group {
  margin-bottom: 8px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: v-bind('colors.text.highlight');
}

.input-select,
textarea {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: #333;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
}

.star-selector {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.star-btn {
  padding: 5px 10px;
  border: 1px solid #666;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.star-btn.active {
  background: gold;
  color: black;
  border-color: gold;
  font-weight: bold;
}

.badge-editors h3 {
  margin-bottom: 10px;
  border-bottom: 1px solid #444;
  padding-bottom: 5px;
}

.badge-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 4px;
}

.badge-index {
  width: 24px;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.mini-select {
  flex: 1;
  min-width: 60px;
  padding: 4px;
  border-radius: 4px;
}

.mini-input {
  width: 50px;
  padding: 4px;
  border-radius: 4px;
  text-align: center;
}

.shape-hint {
  font-size: 0.8rem;
  color: #888;
  margin-left: auto;
  white-space: nowrap;
}

.generate-btn {
  width: 100%;
  padding: 15px;
  background: v-bind('colors.brand.confirm');
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

/* --- 预览区 --- */
.preview-wrapper {
  overflow: auto;
  border: 2px dashed #555;
  background: #222;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  font-family: 'Inter', sans-serif;
}

/* 推荐星级 (图片版) */
.star-rating-display {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 16px;
  border-radius: 30px;
  align-items: center;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.star-label {
  font-size: 1rem;
  color: #ddd;
  margin-right: 8px;
  text-align: center;
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

/* 调整大小为原来的1.5倍左右 (原字号24px -> 约36-40px) */
.star-img-lg {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* 立绘 */
.character-display {
  position: absolute;
  bottom: 80px;
  left: 70px;
  width: 350px;
  height: 400px;
  display: flex;
  align-items: flex-end;
}

.char-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
}

/* 徽章网格 */
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

/* 徽章主题图标 */
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

/* 徽章底部星星容器 */
.badge-stars-container {
  margin-top: 4px;
  background-color: rgba(60, 50, 70, 0.7);
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

/* 信息面板 */
.info-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 380px;
  min-height: 180px;
  background: rgba(30, 30, 40, 0.9);
  border: 1px solid #555;
  border-radius: 10px;
  padding: 15px;
  text-align: left;
  z-index: 0;
}

.active-effects {
  margin-bottom: 8px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.label {
  color: #aaa;
  font-size: 0.9rem;
  font-weight: bold;
}

.effect-text {
  color: #ffca28;
  font-size: 1.1rem;
  font-weight: bold;
  margin-left: 5px;
}

.recommendation-text p {
  color: #ddd;
  font-size: 0.9rem;
  margin: 5px 0 0 0;
  line-height: 1.4;
  white-space: pre-wrap;
}

.watermark {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.2);
}

.preview-hint {
  color: #888;
  margin-top: 10px;
  font-size: 0.9rem;
}
</style>

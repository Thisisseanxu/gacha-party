<template>
  <div class="page-container">
    <h1 class="page-title">徽章攻略编辑器</h1>
    <p class="agreement">使用则代表您同意<a class="highlight" @click="openAgreementPopUp" href="#">《织夜工具箱创作条款》</a>
    </p>

    <div v-if="isSelectionMode" class="selector-container">
      <div class="import-section">
        <label class="import-btn">
          导入攻略数据
          <input type="file" accept=".json" @change="importData" style="display: none">
        </label>
        <span class="import-hint">选择之前导出的json文件可直接恢复编辑</span>
      </div>
      <CharacterSelector v-model="selectedCharId" mode="single" :showCustom="false"
        :characterList="filteredCharacterList" :disabledCharacterIds="disabledCharacterIds" title="选择角色"
        :subTitle="null" @confirm="isSelectionMode = false" />
    </div>
    <div v-else class="strategy-editor">

      <div class="controls-panel card">
        <h2>攻略配置</h2>

        <div class="control-group">
          <label>当前角色: {{ selectedCardInfo.name }}</label>
          <button @click="isSelectionMode = true" class="reselect-btn">重选角色</button>
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
          <p class="badge-hint-text">顺序为从上到下从左到右，点击等级+1级，长按归零</p>
          <div class="badge-header">
            <span class="header-col index">槽</span>
            <span class="header-col flex">稀有度</span>
            <span class="header-col fixed">等级</span>
            <span class="header-col flex">类型</span>
            <span class="header-col auto">形状</span>
          </div>
          <div v-for="(slot, index) in currentSlots" :key="index" class="badge-row">
            <span class="badge-index">#{{ index + 1 }}</span>
            <select v-model="slot.rarityId" class="mini-select">
              <option v-for="r in Object.values(HUIZHANG_RARITY)" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <div class="mini-input level-btn" @mousedown="handleLevelStart(slot)"
              @touchstart.prevent="handleLevelStart(slot)" @mouseup="handleLevelEnd(slot)"
              @touchend="handleLevelEnd(slot)" @mouseleave="handleLevelCancel" title="点击+1，长按重置">
              {{ slot.level }}
            </div>
            <select v-model="slot.typeId" class="mini-select">
              <option v-for="t in Object.values(HUIZHANG_TYPES)" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <span class="shape-hint">({{ getShapeName(slot.shape) }})</span>
          </div>
        </div>

        <div class="control-group">
          <label>标题配置（留空则不显示）</label>
          <input v-model="customTitle" class="input-select" placeholder="大标题内容">
        </div>
        <div class="control-group">
          <input v-model="recommendTitle" class="input-select" style="margin-bottom: 8px; font-weight: bold;"
            placeholder="小标题">
          <textarea v-model="recommendText" rows="4" placeholder="文本内容"></textarea>
        </div>

        <div class="action-buttons">
          <button @click="exportData" class="export-btn">保存数据</button>
          <button @click="generateImage" class="generate-btn">导出攻略图</button>
        </div>
      </div>

      <div class="preview-wrapper" ref="previewWrapper">
        <p class="preview-hint">↓ 预览区域 ↓</p>
        <div class="capture-area" ref="captureRef" :style="previewStyle">

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

          <div class="custom-title-display">
            {{ customTitle }}
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
              <span class="label">套装效果：</span>
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

  <PopUp :display="showAgreementPopUp" title="《织夜工具箱创作条款》" @close="closeAgreementPopUp">
    <p>欢迎使用织夜工具箱！<br />在使用前，请您仔细阅读以下用户协议：</p>
    <ol class="agreement-list">
      <li>
        <strong>服务描述与接受条款：</strong>
        织夜工具箱是一个为《盲盒派对》玩家提供增强体验的工具。若您点击“我已阅读并同意”按钮并继续使用本服务，即表示您已同意并接受本协议的所有条款。
      </li>
      <li>
        <strong>版权信息：</strong>
        工具箱中所使用的所有角色形象、名称及相关内容均为其各自版权所有者所有。织夜工具箱仅用其提供非营利性服务，我们尊重并支持版权保护，任何未经授权的商用均属侵权行为。您可以在非商业用途下自由使用/分享本工具箱生成的内容。
      </li>
      <li>
        <strong>用户责任：</strong> 您使用织夜工具箱时，需确保遵守相关法律法规及游戏运营商的规定。若您使用本服务进行任何违法或违规行为，您将承担全部责任，织夜工具箱对此不承担任何责任。
      </li>
      <li>
        <strong>数据使用与隐私保护：</strong>
        我们承诺保护您的个人隐私。目前织夜工具箱徽章攻略编辑器不收集任何个人数据，所有数据均存储在您的本地浏览器中。
      </li>
      <li>
        <strong>服务变更、中断或终止：</strong> 本服务免费提供。我们保留随时修改、中断或终止服务的权利，恕不另行通知。
      </li>
      <li>
        <strong>协议修改：</strong> 我们有权根据需要不时地修改本协议。协议修改后，如果您继续使用本服务，即视为您已接受修改后的协议。
      </li>
    </ol>
    <button @click="closeAgreementPopUp" class="action-button">我已阅读并同意</button>
  </PopUp>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { allCards } from '@/data/cards.js';
import { colors } from '@/styles/colors.js';
import {
  HUIZHANG_SHAPES,
  HUIZHANG_RARITY,
  HUIZHANG_TYPES,
  getCharConfig,
  getHuizhangBgUrl
} from '@/data/huizhang.js';
import { exportImage } from '@/utils/imageExportHelper.js';
import PopUp from '@/components/PopUp.vue';
import CharacterSelector from '@/components/CharacterSelector.vue';

// 状态
const selectedCharId = ref('');
const recommendedStars = ref([0, 5]);
const customTitle = ref('');
const recommendTitle = ref('推荐理由：');
const recommendText = ref('');
const captureRef = ref(null);
const currentSlots = ref([]);
const iconBase64Map = ref({});
const previewWrapper = ref(null);
const previewScale = ref(1);
const isSelectionMode = ref(true);
const showAgreementPopUp = ref(false);

const openAgreementPopUp = () => {
  showAgreementPopUp.value = true;
};
const closeAgreementPopUp = () => {
  showAgreementPopUp.value = false;
};

const filteredCharacterList = computed(() => {
  return allCards.filter(c => c.id.match(/^\d+$/)).map(c => ({
    ...c,
    // 通过getCharConfig搜索Q版立绘，如果有则优先使用Q版立绘
    imageUrl: getCharConfig(c.id)?.image_url || c.imageUrl
  }));
});

const disabledCharacterIds = computed(() => {
  return filteredCharacterList.value.filter(c => !isCharAdapted(c.id)).map(c => c.id);
});

// 检查角色是否适配
const isCharAdapted = (id) => {
  return !!getCharConfig(id);
};

watch(isSelectionMode, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      updatePreviewScale();
    });
  }
});

// 初始化
onMounted(() => {
  selectedCharId.value = '1111';
  isSelectionMode.value = true;
  window.addEventListener('resize', updatePreviewScale);
  updatePreviewScale();
});

onUnmounted(() => {
  window.removeEventListener('resize', updatePreviewScale);
});

// 等级输入交互逻辑
const pressTimer = ref(null);
const isLongPress = ref(false);

const handleLevelStart = (slot) => {
  isLongPress.value = false;
  pressTimer.value = setTimeout(() => {
    slot.level = 0;
    isLongPress.value = true;
  }, 500);
};

const handleLevelEnd = (slot) => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  if (!isLongPress.value) {
    slot.level = (slot.level + 1) % 16;
  }
};

const handleLevelCancel = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
};

const selectedCardInfo = computed(() => {
  return allCards.find(c => c.id === selectedCharId.value) || {};
});

const currentCharConfig = computed(() => {
  return getCharConfig(selectedCharId.value);
});

// 监听角色变化，更新槽位配置
watch(selectedCharId, (newId) => {
  if (!newId) return;
  const config = getCharConfig(newId);
  if (config && config.shape) {
    currentSlots.value = config.shape.map(shapeStr => ({
      shape: shapeStr,
      rarityId: HUIZHANG_RARITY.GOLD.id,
      typeId: 'none',
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
  // 忽略无类型
  delete counts['none'];

  const effects = [];
  for (const [typeId, count] of Object.entries(counts)) {
    const typeConfig = HUIZHANG_TYPES[typeId];
    if (!typeConfig) continue;

    const { name, act2, act4, act4extra } = typeConfig;

    if (count >= 4) {
      const totalVal = (act2 || 0) + (act4 || 0);
      let str = `${totalVal}% ${name}`;
      if (act4extra) str += `&${act4extra}`;
      effects.push(str);
    } else if (count >= 2) {
      effects.push(`${act2 || 0}% ${name}`);
    }
  }

  if (effects.length === 0) return '无套装效果';
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

// 导出数据
const exportData = () => {
  const data = {
    charId: selectedCharId.value,
    stars: recommendedStars.value,
    customTitle: customTitle.value,
    recTitle: recommendTitle.value,
    recText: recommendText.value,
    slots: currentSlots.value
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `徽章配置-${selectedCardInfo.value.name || 'data'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 导入数据
const importData = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      if (json.charId) {
        selectedCharId.value = json.charId;
        // 等待 selectedCharId 的 watcher 执行完毕（重置 slots）后再覆盖数据
        nextTick(() => {
          if (json.stars) recommendedStars.value = json.stars;
          if (json.customTitle !== undefined) customTitle.value = json.customTitle;
          if (json.recTitle !== undefined) recommendTitle.value = json.recTitle;
          if (json.recText !== undefined) recommendText.value = json.recText;
          if (json.slots) currentSlots.value = json.slots;

          isSelectionMode.value = false;
        });
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error(err);
      alert('无法解析该文件或文件格式错误，请确保是有效的徽章配置JSON文件');
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // 重置 input，允许重复选择同一文件
};

// 预览区域缩放逻辑
const updatePreviewScale = () => {
  if (!previewWrapper.value) return;
  const wrapperWidth = previewWrapper.value.clientWidth;
  const targetWidth = 820; // 800px + 左右留白

  if (wrapperWidth < targetWidth) {
    previewScale.value = wrapperWidth / targetWidth;
  } else {
    previewScale.value = 1;
  }
};

const previewStyle = computed(() => {
  if (previewScale.value >= 1) return {};
  return {
    transform: `scale(${previewScale.value})`,
    transformOrigin: 'top center',
    // 缩放后，元素原本占据的空间不会变，需要通过负 margin 抵消底部的空白
    marginBottom: `${-(550 * (1 - previewScale.value))}px`
  };
});

// 生成图片
const generateImage = async () => {
  if (!captureRef.value) return;

  // 临时重置缩放以保证生成图片的清晰度和尺寸
  const originalScale = previewScale.value;
  previewScale.value = 1;

  try {
    await nextTick();
    await exportImage(captureRef.value, `徽章攻略-${selectedCardInfo.value.name}.png`, {
      scale: 2,
      width: captureRef.value.clientWidth,
      height: captureRef.value.clientHeight
    });
  } catch (err) {
    console.error('生成图片失败:', err);
    alert('生成失败');
  } finally {
    previewScale.value = originalScale; // 恢复缩放
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: v-bind('colors.background.primary');
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  color: v-bind('colors.text.primary');
}

.strategy-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 1400px;
  width: 100%;
}

.selector-container {
  width: 100%;
  max-width: 800px;
}

.page-title {
  text-align: center;
  font-size: 2em;
  color: v-bind('colors.text.highlight');
  margin-bottom: 0;
  margin-top: 10px;
}

.agreement {
  margin-top: 10px;
  margin-bottom: 20px;
  padding-left: 10px;
  text-align: center;
}

.highlight {
  color: v-bind('colors.text.highlight');
  cursor: pointer;
}

.agreement-list {
  max-height: 20rem;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  padding: 0 0 0 20px;
  border-radius: 8px;
  background-color: v-bind('colors.shadow.primaryHover');
}

.agreement-list li {
  line-height: 1.6;
  margin-bottom: 12px;
  text-align: left;
}

.agreement-list::-webkit-scrollbar {
  width: 6px;
}

.agreement-list::-webkit-scrollbar-track {
  background: transparent;
}

.agreement-list::-webkit-scrollbar-thumb {
  background-color: v-bind('colors.scrollbar');
  border-radius: 3px;
}

.action-button {
  padding: 8px 16px;
  border: 1px solid #344767;
  background-color: #ccc;
  color: #344767;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #344767;
  color: #ccc;
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

.reselect-btn {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  background-color: #555;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
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

.badge-hint-text {
  font-size: 0.8rem;
  color: #888;
  margin: -5px 0 10px 0;
}

.badge-header {
  display: flex;
  gap: 5px;
  padding: 0 8px;
  margin-bottom: 5px;
  font-size: 0.8rem;
  color: #aaa;
  font-weight: bold;
}

.header-col.index {
  width: 24px;
}

.header-col.flex {
  flex: 1;
  text-align: center;
}

.header-col.fixed {
  width: 50px;
  text-align: center;
}

.header-col.auto {
  margin-left: auto;
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
  background: #fff;
  color: #333;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.level-btn {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shape-hint {
  font-size: 0.8rem;
  color: #888;
  margin-left: auto;
  white-space: nowrap;
}

.import-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  gap: 8px;
}

.import-btn {
  display: inline-block;
  padding: 10px 24px;
  background-color: #444;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  border: 1px solid #666;
  transition: all 0.2s;
}

.import-btn:hover {
  background-color: #555;
  border-color: #888;
}

.import-hint {
  font-size: 0.9rem;
  color: #888;
}

.generate-btn {
  flex: 2;
  padding: 15px;
  background: v-bind('colors.brand.confirm');
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

.export-btn {
  flex: 1;
  padding: 15px;
  background: #607d8b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

/* --- 预览区 --- */
.preview-wrapper {
  overflow: hidden;
  border: 2px dashed #555;
  background: #222;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
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

.custom-title-display {
  position: absolute;
  top: 140px;
  left: 30px;
  font-size: 2.5rem;
  color: #ffca28;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  z-index: 10;
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
  min-width: 370px;
  min-height: 180px;
  background: rgba(30, 30, 40, 0.9);
  border: 1px solid #555;
  border-radius: 10px;
  padding: 12px;
  text-align: left;
  z-index: 0;
}

.active-effects {
  margin-bottom: 8px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
  white-space: nowrap;
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

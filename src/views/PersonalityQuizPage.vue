<template>
  <main class="quiz-page">
    <section class="quiz-shell">
      <header class="quiz-header">
        <p class="eyebrow">盲盒派对 · 性格测试</p>
        <h1>你和哪位角色最匹配？</h1>
        <p>完成 30 道情境选择题，看看你和盲盒派对中哪位角色性格相符。</p>
      </header>

      <template v-if="!isFinished">
        <div
          class="progress-track"
          role="progressbar"
          :aria-valuenow="answeredCount"
          aria-valuemin="0"
          :aria-valuemax="personalityQuestions.length"
        >
          <span :style="{ width: `${progressPercent}%` }"></span>
        </div>

        <article class="question-card">
          <div class="question-meta">
            <span>QUESTION {{ String(currentIndex + 1).padStart(2, '0') }}</span>
            <span>{{ currentIndex + 1 }} / {{ personalityQuestions.length }}</span>
          </div>
          <h2>{{ currentQuestion.prompt }}</h2>

          <div
            class="option-list"
            :class="{ 'suppress-hover': suppressOptionHover }"
            @pointermove="restoreOptionHover"
          >
            <button
              v-for="(option, optionIndex) in currentQuestion.options"
              :key="option.id"
              type="button"
              class="option-card"
              :class="{ selected: answers[currentIndex] === option.id }"
              :aria-pressed="answers[currentIndex] === option.id"
              @click="selectOption(option.id, $event)"
            >
              <span class="option-letter">{{ optionLetters[optionIndex] }}</span>
              <span>{{ option.text }}</span>
            </button>
          </div>
        </article>

        <footer class="quiz-actions">
          <button
            type="button"
            class="secondary-button"
            :disabled="currentIndex === 0"
            @click="previousQuestion"
          >
            上一题
          </button>
        </footer>
      </template>

      <section v-else class="result-panel">
        <template v-if="matchedCharacter">
          <div ref="shareCaptureRef" class="share-card">
            <div class="match-hero">
              <div class="match-avatar">
                <img
                  v-if="matchedCard"
                  :src="matchedCard.imageUrl"
                  :alt="`${matchedCharacter['角色']} · ${matchedCard.name}`"
                />
                <span v-else>{{ matchedCharacter['角色'].slice(0, 1) }}</span>
              </div>
              <div class="match-copy">
                <span>与你最匹配的角色是</span>
                <h2>{{ matchedCharacter['角色'] }}</h2>
              </div>
            </div>

            <article class="personality-comment">
              <p>{{ matchedCharacter['性格评语'] }}</p>
            </article>

            <div class="profile-comparison">
              <TendencyProfile
                title="你的四维倾向"
                :scores="quizProfile"
                :axes="axes"
                tone="player"
              />
              <TendencyProfile
                :title="`${matchedCharacter['角色']}的四维倾向`"
                :scores="matchedCharacter"
                :axes="axes"
                tone="character"
              />
            </div>

            <footer class="share-card-footer">
              <div class="share-brand">
                <strong>织夜工具箱</strong>
                <span>性格匹配测试</span>
              </div>
              <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="当前页面二维码" />
              <span v-else class="qr-placeholder">二维码生成中</span>
            </footer>
          </div>

          <div class="result-actions">
            <button
              type="button"
              class="primary-button share-button"
              :disabled="isSharing || isPreparingShareImage"
              @click="shareResult"
            >
              {{ isSharing ? '正在分享…' : isPreparingShareImage ? '准备分享图片…' : '分享结果' }}
            </button>
            <button type="button" class="primary-button" @click="restartQuiz">重新测试</button>
          </div>
          <p v-if="isPreparingShareImage" class="share-preparing-note" role="status">
            结果已生成，正在后台准备分享图片…
          </p>
          <p
            v-if="shareStatus"
            class="share-status"
            :class="`is-${shareStatus.type}`"
            role="status"
            aria-live="polite"
          >
            {{ shareStatus.message }}
          </p>
        </template>
        <p v-else-if="resultError" class="result-error">{{ resultError }}</p>
        <p v-else class="result-loading">正在寻找与你最匹配的角色…</p>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import FileSaver from 'file-saver'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import { allCards } from '@/data/cards.js'
import { personalityQuestions } from '@/data/personalityQuiz.js'
import TendencyProfile from '@/components/TendencyProfile.vue'
import {
  calculateQuizProfile,
  dimensionEntries,
  findClosestCharacter,
} from '@/utils/personalityMatch.js'
import { configureMobileQQShare, isMobileQQ, shareImageToQQ } from '@/utils/qqShare.js'
import { colors } from '@/styles/colors.js'

const optionLetters = ['A', 'B', 'C', 'D']
const currentIndex = ref(0)
const answers = ref(personalityQuestions.map(() => null))
const isFinished = ref(false)
const scoreData = ref(null)
const matchedCard = ref(null)
const resultError = ref('')
const suppressOptionHover = ref(false)
const shareCaptureRef = ref(null)
const qrCodeDataUrl = ref('')
const currentPageUrl = ref('')
const isSharing = ref(false)
const isPreparingShareImage = ref(false)
const preparedShareImageBlob = shallowRef(null)
const shareStatus = ref(null)
const isQqEnvironment = isMobileQQ()
let shareStatusTimer = null
let sharePreparationTimer = null

const axes = computed(() => dimensionEntries(scoreData.value))
const dimensions = computed(() => axes.value.map((axis) => axis.key))
const characters = computed(() => scoreData.value?.characters || [])
const currentQuestion = computed(() => personalityQuestions[currentIndex.value])
const answeredCount = computed(() => answers.value.filter((answer) => answer !== null).length)
const progressPercent = computed(() => (answeredCount.value / personalityQuestions.length) * 100)
const quizProfile = computed(() =>
  calculateQuizProfile(personalityQuestions, answers.value, dimensions.value),
)
const match = computed(() =>
  findClosestCharacter(quizProfile.value, characters.value, dimensions.value),
)
const matchedCharacter = computed(() => match.value?.character || null)

onMounted(() => {
  loadCharacterScores()
  configureQqShareCard()
})

watch([isFinished, matchedCharacter], async ([finished, character]) => {
  if (finished && character) {
    selectRandomMatchedCard(character)
    configureQqShareCard(character)
    await generateShareQrCode()
    await nextTick()
    if (sharePreparationTimer) window.clearTimeout(sharePreparationTimer)
    sharePreparationTimer = window.setTimeout(() => {
      sharePreparationTimer = null
      prepareShareImage()
    }, 0)
  }
})

async function loadCharacterScores() {
  resultError.value = ''
  try {
    const response = await fetch('/data/character_scores.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data.characters) || !data.dimensions) {
      throw new Error('角色四维数据格式错误')
    }
    scoreData.value = data
  } catch (error) {
    resultError.value = `角色匹配数据加载失败：${error.message}`
  }
}

function normalizedName(value) {
  return String(value || '').replace(/\s+/g, '')
}

function selectRandomMatchedCard(character) {
  const name = normalizedName(character['角色'])
  const cards = allCards.filter((card) => normalizedName(card.realname) === name)
  matchedCard.value = cards.length ? cards[Math.floor(Math.random() * cards.length)] : null
}

async function generateShareQrCode() {
  currentPageUrl.value = window.location.href
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(currentPageUrl.value, {
      width: 176,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1a1b20',
        light: '#ffffff',
      },
    })
  } catch (error) {
    console.error('二维码生成失败:', error)
    qrCodeDataUrl.value = ''
  }
}

function showShareStatus(message, type = 'success') {
  if (shareStatusTimer) window.clearTimeout(shareStatusTimer)
  shareStatus.value = { message, type }
  shareStatusTimer = window.setTimeout(() => {
    shareStatus.value = null
    shareStatusTimer = null
  }, 4500)
}

async function waitForCaptureAssets(element) {
  await document.fonts?.ready
  const images = [...element.querySelectorAll('img')]
  await Promise.all(
    images.map((image) => {
      if (image.complete) return image.decode?.().catch(() => undefined)
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true })
        image.addEventListener('error', resolve, { once: true })
      })
    }),
  )
}

function dataUrlToBlob(dataUrl) {
  const [header, encoded] = dataUrl.split(',')
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png'
  const bytes = window.atob(encoded)
  const buffer = new Uint8Array(bytes.length)
  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index)
  }
  return new Blob([buffer], { type: mimeType })
}

async function assertImageHasContent(blob) {
  const imageUrl = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = imageUrl
    await image.decode()
    if (image.naturalWidth !== 1644 || image.naturalHeight < 600) {
      throw new Error('生成的图片尺寸异常')
    }

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let minimum = 255
    let maximum = 0
    for (let index = 0; index < pixels.length; index += 4) {
      const luminance =
        pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722
      minimum = Math.min(minimum, luminance)
      maximum = Math.max(maximum, luminance)
    }

    if (maximum - minimum < 40 || maximum < 140) {
      throw new Error('生成的图片内容为空')
    }
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

function downloadShareImage(blob, filename) {
  FileSaver.saveAs(blob, filename)
  showShareStatus('分享图片已保存，请在相册或浏览器下载内容中查看。')
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片压缩失败'))),
      type,
      quality,
    )
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), { once: true })
    reader.addEventListener('error', () => reject(reader.error || new Error('图片读取失败')), {
      once: true,
    })
    reader.readAsDataURL(blob)
  })
}

async function createQqShareImage(blob) {
  const sourceUrl = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = sourceUrl
    await image.decode()

    const maxWidth = 1280
    const scale = Math.min(1, maxWidth / image.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)

    const context = canvas.getContext('2d')
    context.fillStyle = colors.background.content
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    let quality = 0.88
    let compressedBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
    while (compressedBlob.size > 950 * 1024 && quality > 0.5) {
      quality -= 0.08
      compressedBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }

    if (compressedBlob.size > 1024 * 1024) {
      throw new Error('结果图片超过 QQ 的 1 MB 分享限制')
    }

    return blobToDataUrl(compressedBlob)
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

function configureQqShareCard(character = null) {
  if (!isQqEnvironment) return

  const title = character ? `我和${character['角色']}最匹配` : '盲盒派对角色性格测试'
  const description = character
    ? '来织夜工具箱测测你和哪位角色最匹配'
    : '完成 30 道情境题，看看你和哪位角色最匹配'

  configureMobileQQShare({
    title,
    description,
    url: new URL('/quiz', window.location.origin).href,
    imageUrl: new URL('/images/icons/icon-512x512.png', window.location.origin).href,
  }).catch((error) => {
    console.warn('配置手机 QQ 分享卡片失败:', error)
  })
}

async function prepareShareImage() {
  if (preparedShareImageBlob.value) return preparedShareImageBlob.value
  if (!shareCaptureRef.value || isPreparingShareImage.value) return null

  isPreparingShareImage.value = true
  let captureElement = null
  try {
    if (!qrCodeDataUrl.value) await generateShareQrCode()
    await nextTick()

    captureElement = shareCaptureRef.value.cloneNode(true)
    captureElement.classList.add('share-capture-mode')
    captureElement.setAttribute('aria-hidden', 'true')
    shareCaptureRef.value.parentElement.appendChild(captureElement)
    await waitForCaptureAssets(captureElement)

    const dataUrl = await toPng(captureElement, {
      backgroundColor: colors.background.content,
      width: 822,
      height: captureElement.scrollHeight,
      pixelRatio: 2,
      cacheBust: false,
      // 页面已经使用系统字体完成排版，无需在每次截图时重新扫描、下载和嵌入字体。
      skipFonts: true,
    })
    const blob = dataUrlToBlob(dataUrl)
    await assertImageHasContent(blob)
    preparedShareImageBlob.value = blob
    return blob
  } catch (error) {
    console.error('生成分享图片失败:', error)
    return null
  } finally {
    captureElement?.remove()
    isPreparingShareImage.value = false
  }
}

async function shareResult() {
  if (!shareCaptureRef.value || isSharing.value || isPreparingShareImage.value) return

  isSharing.value = true
  shareStatus.value = null

  try {
    const blob = preparedShareImageBlob.value || (await prepareShareImage())
    if (!blob) throw new Error('图片生成失败，请稍后重试')

    const filename = `盲盒派对性格匹配-${matchedCharacter.value['角色']}.png`

    if (isQqEnvironment) {
      const qqImageDataUrl = await createQqShareImage(blob)
      await shareImageToQQ(qqImageDataUrl, (result) => {
        const retCode = Number(result?.retCode ?? result?.data?.retCode)
        if (retCode === 0) {
          showShareStatus('已分享给 QQ 好友。')
        } else if (retCode === -1 || retCode === -2 || retCode === 1 || retCode === 2) {
          showShareStatus('已取消分享。', 'neutral')
        } else if (Number.isFinite(retCode)) {
          showShareStatus(`QQ 分享失败（${retCode}），请保存图片后分享。`, 'error')
        }
      })
      showShareStatus('QQ 好友选择器已打开。', 'neutral')
      return
    }

    const file = new File([blob], filename, { type: 'image/png' })
    const shareData = {
      files: [file],
      title: '我的盲盒派对性格匹配结果',
      text: `我和${matchedCharacter.value['角色']}最匹配！`,
    }

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData)
        showShareStatus('分享面板已打开。')
        return
      } catch (error) {
        if (error?.name === 'AbortError') {
          showShareStatus('已取消分享。', 'neutral')
          return
        }
        console.warn('浏览器分享失败，已回退为下载:', error)
      }
    }

    downloadShareImage(blob, filename)
  } catch (error) {
    console.error('生成分享图片失败:', error)
    showShareStatus(`生成分享图片失败：${error.message || error}`, 'error')
  } finally {
    isSharing.value = false
  }
}

function selectOption(optionId, event) {
  event.currentTarget.blur()
  suppressOptionHover.value = true
  answers.value[currentIndex.value] = optionId
  nextQuestion()
}

function restoreOptionHover() {
  suppressOptionHover.value = false
}

function previousQuestion() {
  if (currentIndex.value > 0) currentIndex.value -= 1
}

function nextQuestion() {
  if (answers.value[currentIndex.value] === null) return
  if (currentIndex.value < personalityQuestions.length - 1) {
    currentIndex.value += 1
  } else if (answeredCount.value === personalityQuestions.length) {
    isFinished.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function restartQuiz() {
  if (sharePreparationTimer) {
    window.clearTimeout(sharePreparationTimer)
    sharePreparationTimer = null
  }
  if (shareStatusTimer) {
    window.clearTimeout(shareStatusTimer)
    shareStatusTimer = null
  }
  answers.value = personalityQuestions.map(() => null)
  matchedCard.value = null
  qrCodeDataUrl.value = ''
  currentPageUrl.value = ''
  preparedShareImageBlob.value = null
  shareStatus.value = null
  suppressOptionHover.value = false
  currentIndex.value = 0
  isFinished.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onBeforeUnmount(() => {
  if (sharePreparationTimer) window.clearTimeout(sharePreparationTimer)
  if (shareStatusTimer) window.clearTimeout(shareStatusTimer)
})
</script>

<style scoped>
.quiz-page {
  min-height: 100dvh;
  padding: 48px 20px 80px;
  box-sizing: border-box;
  color: v-bind('colors.text.primary');
  background:
    radial-gradient(circle at 12% 8%, v-bind('colors.brand.primaryBackground'), transparent 34%),
    v-bind('colors.background.primary');
}

.quiz-shell {
  width: min(920px, 100%);
  margin: 0 auto;
}

.quiz-header {
  text-align: left;
}

.eyebrow {
  margin: 0 0 8px;
  color: v-bind('colors.brand.primary');
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.quiz-header h1 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.6rem);
  line-height: 1.05;
}

.quiz-header > p:last-child {
  margin: 14px 0 0;
  color: v-bind('colors.text.secondary');
  line-height: 1.7;
}

.progress-track {
  height: 7px;
  margin-top: 28px;
  overflow: hidden;
  border-radius: 999px;
  background: v-bind('colors.background.lighter');
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, v-bind('colors.brand.primary'), v-bind('colors.brand.hover'));
  transition: width 0.3s ease;
}

.question-card,
.result-panel {
  margin-top: 18px;
  padding: clamp(24px, 5vw, 48px);
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 20px;
  background: v-bind('colors.background.content');
  box-shadow: 0 22px 60px v-bind('colors.shadow.primary');
}

.question-meta {
  display: flex;
  justify-content: space-between;
  color: v-bind('colors.text.tertiary');
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.question-card h2 {
  margin: 18px 0 30px;
  text-align: left;
  font-size: clamp(1.35rem, 3vw, 1.8rem);
  line-height: 1.55;
}

.option-list {
  display: grid;
  gap: 12px;
}

.option-card {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 12px;
  color: v-bind('colors.text.primary');
  background: v-bind('colors.background.light');
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.option-card:hover {
  transform: translateY(-2px);
  border-color: v-bind('colors.brand.primary');
}

.option-list.suppress-hover .option-card:hover {
  transform: none;
  border-color: v-bind('colors.border.primary');
}

.option-card.selected {
  border-color: v-bind('colors.brand.primary');
  background: v-bind('colors.brand.primaryBackground');
}

.option-letter {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  color: v-bind('colors.text.secondary');
  background: v-bind('colors.background.content');
  font-weight: 800;
}

.selected .option-letter {
  color: v-bind('colors.text.black');
  background: v-bind('colors.brand.primary');
}

.quiz-actions,
.result-actions {
  display: flex;
  gap: 16px;
  margin-top: 22px;
}

.result-actions {
  justify-content: center;
  margin-top: 28px;
}

.primary-button,
.secondary-button {
  min-width: 120px;
  padding: 12px 20px;
  border-radius: 10px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  border: 1px solid v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  background: v-bind('colors.brand.primary');
}

.secondary-button {
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
  background: v-bind('colors.background.content');
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.result-panel {
  text-align: center;
}

.share-card {
  padding: clamp(20px, 4vw, 36px);
  border-radius: 16px;
  background:
    radial-gradient(circle at 10% 4%, v-bind('colors.brand.primaryBackground'), transparent 30%),
    v-bind('colors.background.content');
}

.match-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 12px auto 32px;
}

.match-avatar {
  display: grid;
  width: 132px;
  height: 132px;
  flex: 0 0 132px;
  overflow: hidden;
  place-items: center;
  border: 3px solid v-bind('colors.brand.primary');
  border-radius: 28px;
  color: v-bind('colors.brand.primary');
  background: v-bind('colors.background.light');
  font-size: 3rem;
  font-weight: 900;
}

.match-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.match-copy {
  text-align: left;
}

.match-copy span {
  color: v-bind('colors.text.secondary');
}

.match-copy h2 {
  margin: 4px 0 8px;
  color: v-bind('colors.brand.primary');
  font-size: clamp(2rem, 6vw, 3.5rem);
}

.personality-comment {
  margin: 0 0 20px;
  padding: 20px 22px;
  border: 1px solid v-bind('colors.border.primary');
  border-left: 4px solid v-bind('colors.brand.primary');
  border-radius: 14px;
  background: v-bind('colors.background.light');
  text-align: left;
}

.personality-comment p {
  margin: 0;
  color: v-bind('colors.text.secondary');
  line-height: 1.8;
}

.profile-comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.share-card-footer {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid v-bind('colors.border.primary');
  text-align: left;
}

.share-card.share-capture-mode {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  display: block;
  width: 822px;
  max-width: none;
  padding: 36px;
  box-sizing: border-box;
  pointer-events: none;
}

.share-card.share-capture-mode .match-hero {
  flex-direction: row;
  gap: 24px;
}

.share-card.share-capture-mode .match-copy {
  text-align: left;
}

.share-card.share-capture-mode .match-copy h2 {
  font-size: 3.5rem;
}

.share-card.share-capture-mode .profile-comparison {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.share-card.share-capture-mode .share-card-footer {
  display: flex;
  align-items: center;
}

.share-card.share-capture-mode .share-card-footer img,
.share-card.share-capture-mode .qr-placeholder {
  width: 92px;
  height: 92px;
  flex-basis: 92px;
}

.share-brand {
  display: grid;
  min-width: 0;
  gap: 7px;
}

.share-brand strong {
  color: v-bind('colors.brand.primary');
  font-size: 1.15rem;
}

.share-brand span {
  color: v-bind('colors.text.tertiary');
  font-size: 0.72rem;
  overflow-wrap: anywhere;
}

.share-card-footer img,
.qr-placeholder {
  width: 92px;
  height: 92px;
  flex: 0 0 92px;
  border-radius: 8px;
  background: #ffffff;
}

.qr-placeholder {
  display: grid;
  box-sizing: border-box;
  place-items: center;
  padding: 10px;
  color: #666666;
  font-size: 0.68rem;
  text-align: center;
}

.share-button {
  color: v-bind('colors.text.white');
  background: v-bind('colors.game.primary');
  border-color: v-bind('colors.game.primary');
}

.share-status {
  margin: 14px auto 0;
  color: v-bind('colors.status.success');
  font-size: 0.88rem;
}

.share-preparing-note {
  margin: 12px auto 0;
  color: v-bind('colors.text.tertiary');
  font-size: 0.82rem;
}

.share-status.is-error {
  color: v-bind('colors.status.error');
}

.share-status.is-neutral {
  color: v-bind('colors.text.secondary');
}

.result-loading,
.result-error {
  margin: 40px 0 20px;
  color: v-bind('colors.text.secondary');
}

.result-error {
  color: v-bind('colors.status.error');
}

@media (max-width: 720px) {
  .quiz-page {
    padding: 28px 14px 60px;
  }

  .match-hero {
    flex-direction: column;
    gap: 14px;
  }

  .match-copy {
    text-align: center;
  }

  .profile-comparison {
    grid-template-columns: 1fr;
  }

  .share-card-footer {
    align-items: flex-end;
  }

  .share-card-footer img,
  .qr-placeholder {
    width: 84px;
    height: 84px;
    flex-basis: 84px;
  }

  .result-actions {
    flex-direction: column;
  }

  .result-actions button {
    width: 100%;
  }
}
</style>

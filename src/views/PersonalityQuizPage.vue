<template>
  <main class="quiz-page">
    <section class="quiz-shell">
      <header class="quiz-header">
        <p class="eyebrow">盲盒派对 · 性格测试</p>
        <h1>你和哪位角色最匹配？</h1>
        <p>完成 30 道情境选择题，看看你和盲盒派对哪位角色性格相符。</p>
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
        <p class="eyebrow">性格匹配完成</p>
        <template v-if="matchedCharacter">
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

          <div class="result-actions">
            <button type="button" class="primary-button" @click="restartQuiz">重新测试</button>
          </div>
        </template>
        <p v-else-if="resultError" class="result-error">{{ resultError }}</p>
        <p v-else class="result-loading">正在寻找与你最匹配的角色…</p>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { allCards } from '@/data/cards.js'
import { personalityQuestions } from '@/data/personalityQuiz.js'
import TendencyProfile from '@/components/TendencyProfile.vue'
import {
  calculateQuizProfile,
  dimensionEntries,
  findClosestCharacter,
} from '@/utils/personalityMatch.js'
import { colors } from '@/styles/colors.js'

const optionLetters = ['A', 'B', 'C', 'D']
const currentIndex = ref(0)
const answers = ref(personalityQuestions.map(() => null))
const isFinished = ref(false)
const shuffledQuestions = ref(createShuffledQuestions())
const scoreData = ref(null)
const matchedCard = ref(null)
const resultError = ref('')
const suppressOptionHover = ref(false)

const axes = computed(() => dimensionEntries(scoreData.value))
const dimensions = computed(() => axes.value.map((axis) => axis.key))
const characters = computed(() => scoreData.value?.characters || [])
const currentQuestion = computed(() => shuffledQuestions.value[currentIndex.value])
const answeredCount = computed(() => answers.value.filter((answer) => answer !== null).length)
const progressPercent = computed(() => (answeredCount.value / personalityQuestions.length) * 100)
const quizProfile = computed(() =>
  calculateQuizProfile(personalityQuestions, answers.value, dimensions.value),
)
const match = computed(() =>
  findClosestCharacter(quizProfile.value, characters.value, dimensions.value),
)
const matchedCharacter = computed(() => match.value?.character || null)

onMounted(loadCharacterScores)

watch([isFinished, matchedCharacter], ([finished, character]) => {
  if (finished && character) selectRandomMatchedCard(character)
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

function shuffleOptions(options) {
  const shuffled = [...options]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }
  return shuffled
}

function createShuffledQuestions() {
  return personalityQuestions.map((question) => ({
    ...question,
    options: shuffleOptions(question.options),
  }))
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
  answers.value = personalityQuestions.map(() => null)
  shuffledQuestions.value = createShuffledQuestions()
  matchedCard.value = null
  suppressOptionHover.value = false
  currentIndex.value = 0
  isFinished.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
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

.profile-comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
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
}
</style>

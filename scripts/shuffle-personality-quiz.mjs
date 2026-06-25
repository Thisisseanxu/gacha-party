// 一次性打乱性格测试的题目顺序，并把结果写回 src/data/personalityQuiz.js。
// 量表题的五档选项固定不变，题目的 traits 与 weight 会跟随题面一起移动。
//
// 脚本会从给定种子开始逐个尝试，只有当某个打乱顺序仍能让全部角色可达时才写入文件，
// 从而既打乱了顺序，又不破坏匹配结果。
//
// 打乱使用固定随机种子，结果是确定的、可复现的，不会“每次打开都不一样”。
// 需要换一种排布时，传入不同的起始种子即可：
//   node scripts/shuffle-personality-quiz.mjs 123456
import fs from 'node:fs'
import process from 'node:process'
import {
  personalityQuestionSource,
  quizDimensions,
  quizScaleOptions,
} from '../src/data/personalityQuiz.js'
import { createSeededRandom, searchForCharacter } from './personality-quiz-tools.mjs'

const seedArg = process.argv[2]
const baseSeed = seedArg === undefined ? 20250529 : Number(seedArg)
if (!Number.isFinite(baseSeed)) {
  console.error('种子必须是一个数字，例如：node scripts/shuffle-personality-quiz.mjs 123456')
  process.exit(1)
}

const MAX_ATTEMPTS = 500
const scoreData = JSON.parse(
  fs.readFileSync(new URL('../public/data/character_scores.json', import.meta.url), 'utf8'),
)
const characters = scoreData.characters

function shuffleInPlace(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
  }
}

function cloneSource() {
  return personalityQuestionSource.map((question) => ({
    prompt: question.prompt,
    weight: question.weight,
    traits: question.traits.map((trait) => ({ ...trait })),
  }))
}

function withScaleOptions(questions) {
  return questions.map((question) => ({
    ...question,
    options: quizScaleOptions,
  }))
}

// 用与 verify-personality-quiz 相同的搜索逻辑确认 88 位角色全部可达。
function isFullyReachable(questions) {
  const random = createSeededRandom()
  for (let targetIndex = 0; targetIndex < characters.length; targetIndex += 1) {
    const result = searchForCharacter({
      questions,
      dimensions: quizDimensions,
      characters,
      targetIndex,
      random,
    })
    if (!result?.reachable) return false
  }
  return true
}

function escapeForSingleQuote(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function serializeQuestion(question) {
  const traits = question.traits
    .map(
      (trait) =>
        `      { dimension: '${escapeForSingleQuote(trait.dimension)}', coefficient: ${trait.coefficient} },`,
    )
    .join('\n')
  return [
    '  {',
    `    prompt: '${escapeForSingleQuote(question.prompt)}',`,
    `    weight: ${question.weight},`,
    '    traits: [',
    traits,
    '    ],',
    '  },',
  ].join('\n')
}

let chosenSeed = null
let chosenQuestions = null
for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
  const seed = (baseSeed + attempt) >>> 0
  const random = createSeededRandom(seed)
  const questions = cloneSource()
  shuffleInPlace(questions, random)

  if (isFullyReachable(withScaleOptions(questions))) {
    chosenSeed = seed
    chosenQuestions = questions
    break
  }
}

if (!chosenQuestions) {
  console.error(
    `在 ${MAX_ATTEMPTS} 次尝试内未找到既打乱顺序又能让全部角色可达的排布，文件未改动。` +
      '请换一个起始种子重试',
  )
  process.exit(1)
}

const serializedSource =
  'export const personalityQuestionSource = [\n' +
  chosenQuestions.map(serializeQuestion).join('\n') +
  '\n]\n'

const filePath = new URL('../src/data/personalityQuiz.js', import.meta.url)
const fileText = fs.readFileSync(filePath, 'utf8')
const startMarker = 'export const personalityQuestionSource = ['
const endMarker = '\nfunction createScaleOptions'
const startIndex = fileText.indexOf(startMarker)
const endIndex = fileText.indexOf(endMarker)
if (startIndex < 0 || endIndex < 0) {
  console.error('未能在 personalityQuiz.js 中定位题目数据区块，已中止。')
  process.exit(1)
}

const head = fileText.slice(0, startIndex)
const tail = fileText.slice(endIndex)
fs.writeFileSync(filePath, `${head}${serializedSource}${tail}`, 'utf8')

const triedCount = chosenSeed - baseSeed + 1
console.log(
  `已用种子 ${chosenSeed}（第 ${triedCount} 次尝试）打乱 ${chosenQuestions.length} 道题，并写回 personalityQuiz.js。`,
)
console.log('题目的 traits 与 weight 已随题面移动，且已确认 88 位角色全部可达。')

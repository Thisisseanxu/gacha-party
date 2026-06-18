import fs from 'node:fs'
import process from 'node:process'
import { personalityQuestions, quizDimensions } from '../src/data/personalityQuiz.js'
import { decodeAnswerSequence, encodeAnswerSequence } from '../src/utils/personalityMatch.js'

const scoreData = JSON.parse(
  fs.readFileSync(new URL('../public/data/character_scores.json', import.meta.url), 'utf8'),
)
const witnessData = JSON.parse(
  fs.readFileSync(new URL('./personality-match-witnesses.json', import.meta.url), 'utf8'),
)

function profileForAnswers(answers) {
  const totals = Object.fromEntries(quizDimensions.map((dimension) => [dimension, 0]))
  personalityQuestions.forEach((question, questionIndex) => {
    const optionId = answers[questionIndex]
    const option = question.options.find((item) => item.id === optionId)
    if (!option) throw new Error(`第 ${questionIndex + 1} 题缺少有效答案`)
    quizDimensions.forEach((dimension) => {
      totals[dimension] += option.scores[dimension]
    })
  })
  return Object.fromEntries(
    quizDimensions.map((dimension) => [
      dimension,
      Math.round(totals[dimension] / personalityQuestions.length),
    ]),
  )
}

function squaredDistance(profile, character) {
  return quizDimensions.reduce((sum, dimension) => {
    const difference = profile[dimension] - character[dimension]
    return sum + difference ** 2
  }, 0)
}

function findMatch(profile) {
  return scoreData.characters.reduce((closest, character) => {
    const distance = squaredDistance(profile, character)
    if (!closest || distance < closest.distance) return { character, distance }
    return closest
  }, null)
}

const failures = []
const answerSequences = []
const usedSequences = new Map()
for (const witness of witnessData.witnesses) {
  const profile = profileForAnswers(witness.answers)
  const match = findMatch(profile)
  const expectedCharacter = scoreData.characters.find(
    (character) => character['角色'] === witness.character,
  )

  if (!expectedCharacter) {
    failures.push(`${witness.character}：角色评分文件中不存在`)
    continue
  }
  if (match.character['角色'] !== witness.character) {
    failures.push(`${witness.character}：实际匹配到 ${match.character['角色']}`)
    continue
  }
  const profileMismatch = quizDimensions.some(
    (dimension) => profile[dimension] !== witness.profile[dimension],
  )
  if (profileMismatch) {
    failures.push(`${witness.character}：保存的答案见证坐标已过期`)
  }
  const sequence = encodeAnswerSequence(personalityQuestions, witness.answers)
  const decodedAnswers = decodeAnswerSequence(personalityQuestions, sequence)
  if (
    decodedAnswers.some((optionId, questionIndex) => optionId !== witness.answers[questionIndex])
  ) {
    failures.push(`${witness.character}：答案序列号无法还原答案`)
  }
  if (usedSequences.has(sequence)) {
    failures.push(`${witness.character}：与 ${usedSequences.get(sequence)} 的答案序列重复`)
  }
  usedSequences.set(sequence, witness.character)
  answerSequences.push(`${witness.character}: ${sequence}`)
}

const coveredNames = new Set(witnessData.witnesses.map((witness) => witness.character))
for (const character of scoreData.characters) {
  if (!coveredNames.has(character['角色'])) failures.push(`${character['角色']}：缺少答案见证`)
}

if (failures.length) {
  console.error(`角色匹配验证失败（${failures.length} 项）：`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  console.log(
    `验证通过：${scoreData.characters.length} 个角色均有一组实际答案，在四维欧几里得距离匹配中胜出。`,
  )
  console.log('\n角色测试答案序列（按题库原始选项顺序 1–4 编码）：')
  answerSequences.forEach((line) => console.log(line))
}

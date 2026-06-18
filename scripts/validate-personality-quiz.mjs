import fs from 'node:fs'
import process from 'node:process'
import { personalityQuestions, quizDimensions } from '../src/data/personalityQuiz.js'

const scoreData = JSON.parse(
  fs.readFileSync(new URL('../public/data/character_scores.json', import.meta.url), 'utf8'),
)
const witnessData = JSON.parse(
  fs.readFileSync(new URL('./personality-match-witnesses.json', import.meta.url), 'utf8'),
)

function profileForAnswers(answerMap) {
  const totals = Object.fromEntries(quizDimensions.map((dimension) => [dimension, 0]))
  for (const question of personalityQuestions) {
    const optionId = answerMap.get(question.id)
    const option = question.options.find((item) => item.id === optionId)
    if (!option) throw new Error(`第 ${question.id} 题缺少有效答案`)
    quizDimensions.forEach((dimension) => {
      totals[dimension] += option.scores[dimension]
    })
  }
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
for (const witness of witnessData.witnesses) {
  const answerMap = new Map(witness.answers.map((answer) => [answer.questionId, answer.optionId]))
  const profile = profileForAnswers(answerMap)
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
}

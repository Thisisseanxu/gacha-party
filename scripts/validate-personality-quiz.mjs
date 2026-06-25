import fs from 'node:fs'
import process from 'node:process'
import { personalityQuestions, quizDimensions } from '../src/data/personalityQuiz.js'
import {
  decodeAnswerSequence,
  findMatch,
  formatProfile,
  profileForOptionIndexes,
} from './personality-quiz-tools.mjs'

const sequence = process.argv[2]
if (!sequence) {
  console.error(`用法：npm run quiz:verify -- <${personalityQuestions.length} 位 1-5 答案序列>`)
  process.exit(1)
}

try {
  const scoreData = JSON.parse(
    fs.readFileSync(new URL('../public/data/character_scores.json', import.meta.url), 'utf8'),
  )
  const answers = decodeAnswerSequence(personalityQuestions, sequence)
  const profile = profileForOptionIndexes(personalityQuestions, quizDimensions, answers)
  const match = findMatch(profile, scoreData.characters, quizDimensions)

  console.log(`匹配角色：${match.character['角色']}`)
  console.log(`问卷坐标：${formatProfile(profile, quizDimensions)}`)
  console.log(`匹配距离：${Math.sqrt(match.distance).toFixed(2)}`)
} catch (error) {
  console.error(`答案序列无效：${error.message}`)
  process.exitCode = 1
}

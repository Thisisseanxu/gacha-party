import fs from 'node:fs'
import process from 'node:process'
import { personalityQuestions, quizDimensions } from '../src/data/personalityQuiz.js'
import {
  createSeededRandom,
  encodeAnswerIndexes,
  formatProfile,
  searchForCharacter,
} from './personality-quiz-tools.mjs'

const scoreData = JSON.parse(
  fs.readFileSync(new URL('../public/data/character_scores.json', import.meta.url), 'utf8'),
)
const characters = scoreData.characters
const requestedName = process.argv.slice(2).join(' ').trim()
const random = createSeededRandom()

function verifyCharacter(targetIndex) {
  return searchForCharacter({
    questions: personalityQuestions,
    dimensions: quizDimensions,
    characters,
    targetIndex,
    random,
  })
}

if (requestedName) {
  const targetIndex = characters.findIndex((character) => character['角色'] === requestedName)
  if (targetIndex < 0) {
    console.error(`未找到角色真名：${requestedName}`)
    process.exit(1)
  }

  const result = verifyCharacter(targetIndex)
  if (!result?.reachable) {
    console.error(`${requestedName} 当前不可达。`)
    if (result) console.error(`最近可答坐标：${formatProfile(result.profile, quizDimensions)}`)
    process.exit(1)
  }

  console.log(`角色：${requestedName}`)
  console.log(`答案序列：${encodeAnswerIndexes(result.answers)}`)
  console.log(`问卷坐标：${formatProfile(result.profile, quizDimensions)}`)
} else {
  const failures = []
  for (let targetIndex = 0; targetIndex < characters.length; targetIndex += 1) {
    const result = verifyCharacter(targetIndex)
    if (!result?.reachable) failures.push(characters[targetIndex]['角色'])
  }

  if (failures.length) {
    console.error(`验证失败：${failures.length}/${characters.length} 个角色未找到可达答案。`)
    console.error(failures.join('、'))
    process.exitCode = 1
  } else {
    console.log(`验证通过：${characters.length} 个角色均能找到可达答案。`)
  }
}

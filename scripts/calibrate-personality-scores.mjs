import fs from 'node:fs'
import process from 'node:process'
import { personalityQuestions, quizDimensions } from '../src/data/personalityQuiz.js'
import { createSeededRandom, formatProfile, searchForCharacter } from './personality-quiz-tools.mjs'

const scoreData = JSON.parse(
  fs.readFileSync(new URL('../public/data/character_scores.json', import.meta.url), 'utf8'),
)
const originalCharacters = scoreData.characters
const simulatedCharacters = originalCharacters.map((character) => ({ ...character }))
const random = createSeededRandom()
const suggestions = new Map()

for (let round = 0; round < 4; round += 1) {
  const missing = []

  for (let targetIndex = 0; targetIndex < simulatedCharacters.length; targetIndex += 1) {
    const result = searchForCharacter({
      questions: personalityQuestions,
      dimensions: quizDimensions,
      characters: simulatedCharacters,
      targetIndex,
      random,
    })
    if (!result?.reachable) missing.push({ targetIndex, nearest: result })
  }

  if (!missing.length) break

  const occupiedProfiles = new Set(
    simulatedCharacters.map((character) =>
      quizDimensions.map((dimension) => character[dimension]).join('|'),
    ),
  )

  for (const { targetIndex, nearest } of missing) {
    const character = simulatedCharacters[targetIndex]
    if (!nearest) throw new Error(`无法为 ${character['角色']} 找到候选答案`)
    const profileKey = quizDimensions.map((dimension) => nearest.profile[dimension]).join('|')
    if (occupiedProfiles.has(profileKey)) {
      throw new Error(`${character['角色']} 的最近可达坐标与现有角色重复`)
    }
    occupiedProfiles.add(profileKey)
    suggestions.set(character['角色'], {
      before: Object.fromEntries(
        quizDimensions.map((dimension) => [dimension, character[dimension]]),
      ),
      after: nearest.profile,
    })
    quizDimensions.forEach((dimension) => {
      character[dimension] = nearest.profile[dimension]
    })
  }
}

const stillMissing = []
for (let targetIndex = 0; targetIndex < simulatedCharacters.length; targetIndex += 1) {
  const result = searchForCharacter({
    questions: personalityQuestions,
    dimensions: quizDimensions,
    characters: simulatedCharacters,
    targetIndex,
    random,
  })
  if (!result?.reachable) stillMissing.push(simulatedCharacters[targetIndex]['角色'])
}

if (stillMissing.length) {
  console.error(`模拟校准后仍不可达：${stillMissing.join('、')}`)
  process.exitCode = 1
} else if (!suggestions.size) {
  console.log(`无需调整：${simulatedCharacters.length} 个角色目前均可由问卷答案匹配。`)
} else {
  console.log(`建议手动调整以下 ${suggestions.size} 个角色的四维评分：`)
  for (const [name, suggestion] of suggestions) {
    console.log(`\n${name}`)
    console.log(`  当前：${formatProfile(suggestion.before, quizDimensions)}`)
    console.log(`  建议：${formatProfile(suggestion.after, quizDimensions)}`)
  }
  console.log('\n以上仅为计算建议，脚本未修改任何文件。请确认后手动编辑 character_scores.json。')
}

import fs from 'node:fs'
import { personalityQuestions, quizDimensions } from '../src/data/personalityQuiz.js'

const scoreFile = new URL('../public/data/character_scores.json', import.meta.url)
const witnessFile = new URL('./personality-match-witnesses.json', import.meta.url)
const scoreData = JSON.parse(fs.readFileSync(scoreFile, 'utf8'))
const characters = scoreData.characters
const questionCount = personalityQuestions.length
const previousWitnessData = fs.existsSync(witnessFile)
  ? JSON.parse(fs.readFileSync(witnessFile, 'utf8'))
  : null

let randomState = 0x5f3759df
function random() {
  randomState ^= randomState << 13
  randomState ^= randomState >>> 17
  randomState ^= randomState << 5
  return (randomState >>> 0) / 4294967296
}

function randomAnswers() {
  return personalityQuestions.map((question) => Math.floor(random() * question.options.length))
}

function profileFor(answers) {
  const totals = Object.fromEntries(quizDimensions.map((dimension) => [dimension, 0]))
  answers.forEach((optionIndex, questionIndex) => {
    const option = personalityQuestions[questionIndex].options[optionIndex]
    quizDimensions.forEach((dimension) => {
      totals[dimension] += option.scores[dimension]
    })
  })
  return Object.fromEntries(
    quizDimensions.map((dimension) => [dimension, Math.round(totals[dimension] / questionCount)]),
  )
}

function squaredDistance(left, right) {
  return quizDimensions.reduce((sum, dimension) => {
    const difference = left[dimension] - right[dimension]
    return sum + difference ** 2
  }, 0)
}

function findMatch(profile, excludedIndex = -1) {
  return characters.reduce((closest, character, index) => {
    if (index === excludedIndex) return closest
    const distance = squaredDistance(profile, character)
    if (!closest || distance < closest.distance) return { character, distance, index }
    return closest
  }, null)
}

function serializeAnswers(answers) {
  return answers.map(
    (optionIndex, questionIndex) => personalityQuestions[questionIndex].options[optionIndex].id,
  )
}

function searchForCharacter(targetIndex, restarts = 80) {
  const target = characters[targetIndex]
  let nearest = null

  for (let restart = 0; restart < restarts; restart += 1) {
    const answers = randomAnswers()

    for (let step = 0; step < 100; step += 1) {
      const profile = profileFor(answers)
      const targetDistance = squaredDistance(profile, target)
      const competitor = findMatch(profile, targetIndex)
      const margin = targetDistance - competitor.distance

      if (!nearest || targetDistance < nearest.targetDistance) {
        nearest = { answers: [...answers], profile, targetDistance }
      }
      if (findMatch(profile).index === targetIndex) {
        return { answers: [...answers], profile, targetDistance }
      }

      let bestMove = null
      let bestMargin = margin
      for (let questionIndex = 0; questionIndex < questionCount; questionIndex += 1) {
        const currentOption = answers[questionIndex]
        for (
          let optionIndex = 0;
          optionIndex < personalityQuestions[questionIndex].options.length;
          optionIndex += 1
        ) {
          if (optionIndex === currentOption) continue
          answers[questionIndex] = optionIndex
          const candidateProfile = profileFor(answers)
          const candidateTargetDistance = squaredDistance(candidateProfile, target)
          const candidateCompetitor = findMatch(candidateProfile, targetIndex)
          const candidateMargin = candidateTargetDistance - candidateCompetitor.distance
          answers[questionIndex] = currentOption

          if (candidateMargin < bestMargin) {
            bestMargin = candidateMargin
            bestMove = { optionIndex, questionIndex }
          }
        }
      }

      if (!bestMove) break
      answers[bestMove.questionIndex] = bestMove.optionIndex
    }
  }

  return nearest
}

let finalWitnesses = new Map()
const adjustedCharacters = new Set()

for (let calibrationRound = 0; calibrationRound < 4; calibrationRound += 1) {
  const roundWitnesses = new Map()
  const missing = []

  for (let index = 0; index < characters.length; index += 1) {
    const result = searchForCharacter(index)
    if (result && findMatch(result.profile).index === index) {
      roundWitnesses.set(characters[index]['角色'], result)
    } else {
      missing.push({ index, nearest: result })
    }
  }

  if (!missing.length) {
    finalWitnesses = roundWitnesses
    break
  }

  const occupiedProfiles = new Set(
    characters.map((character) =>
      quizDimensions.map((dimension) => character[dimension]).join('|'),
    ),
  )

  for (const { index, nearest } of missing) {
    if (!nearest) throw new Error(`无法为 ${characters[index]['角色']} 找到候选答案`)
    const profileKey = quizDimensions.map((dimension) => nearest.profile[dimension]).join('|')
    if (occupiedProfiles.has(profileKey)) {
      throw new Error(`${characters[index]['角色']} 的最近可达坐标与现有角色重复`)
    }
    occupiedProfiles.add(profileKey)
    quizDimensions.forEach((dimension) => {
      characters[index][dimension] = nearest.profile[dimension]
    })
    adjustedCharacters.add(characters[index]['角色'])
  }
}

if (finalWitnesses.size !== characters.length) {
  throw new Error(`校准后仍只有 ${finalWitnesses.size}/${characters.length} 个角色可匹配`)
}

scoreData.methodology = scoreData.methodology.replace(/\s*问卷可达性校准：.*$/u, '')
const recordedAdjustments = adjustedCharacters.size
  ? [...adjustedCharacters]
  : previousWitnessData?.adjusted_characters || []
if (recordedAdjustments.length) {
  scoreData.methodology += ` 问卷可达性校准：保留可直接匹配角色的原评分，仅将无法命中的${recordedAdjustments.length}个角色移动到其最近的实际可答坐标。`
}

const witnesses = characters.map((character) => {
  const result = finalWitnesses.get(character['角色'])
  delete character.answer_sequence
  return {
    character: character['角色'],
    profile: result.profile,
    answers: serializeAnswers(result.answers),
  }
})

fs.writeFileSync(scoreFile, `${JSON.stringify(scoreData, null, 2)}\n`)
fs.writeFileSync(
  witnessFile,
  `${JSON.stringify(
    {
      schema_version: 3,
      question_count: questionCount,
      dimensions: quizDimensions,
      adjusted_characters: recordedAdjustments,
      witnesses,
    },
    null,
    2,
  )}\n`,
)

console.log(`校准完成：${characters.length} 个角色均已找到答案见证。`)
console.log(`因原坐标不可达而调整：${adjustedCharacters.size} 个角色。`)
if (adjustedCharacters.size) console.log([...adjustedCharacters].join('、'))

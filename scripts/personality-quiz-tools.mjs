export function createSeededRandom(seed = 0x5f3759df) {
  let state = seed >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

export function profileForOptionIndexes(questions, dimensions, answers) {
  const totals = Object.fromEntries(dimensions.map((dimension) => [dimension, 0]))
  answers.forEach((optionIndex, questionIndex) => {
    const option = questions[questionIndex]?.options[optionIndex]
    if (!option) throw new Error(`第 ${questionIndex + 1} 题缺少有效答案`)
    dimensions.forEach((dimension) => {
      totals[dimension] += Number(option.scores[dimension] || 0)
    })
  })

  return Object.fromEntries(
    dimensions.map((dimension) => [dimension, Math.round(totals[dimension] / questions.length)]),
  )
}

export function squaredDistance(left, right, dimensions) {
  return dimensions.reduce((sum, dimension) => {
    const difference = Number(left[dimension] || 0) - Number(right[dimension] || 0)
    return sum + difference ** 2
  }, 0)
}

export function findMatch(profile, characters, dimensions, excludedIndex = -1) {
  return characters.reduce((closest, character, index) => {
    if (index === excludedIndex) return closest
    const distance = squaredDistance(profile, character, dimensions)
    if (!closest || distance < closest.distance) return { character, distance, index }
    return closest
  }, null)
}

export function encodeAnswerIndexes(answers) {
  return answers.map((optionIndex) => String(optionIndex + 1)).join('')
}

export function decodeAnswerSequence(questions, sequence) {
  const normalized = String(sequence || '').replace(/[\s-]/g, '')
  if (normalized.length !== questions.length) {
    throw new Error(`答案序列应为 ${questions.length} 位，当前为 ${normalized.length} 位`)
  }

  return [...normalized].map((digit, questionIndex) => {
    const optionIndex = Number(digit) - 1
    if (!questions[questionIndex]?.options[optionIndex]) {
      throw new Error(`答案序列第 ${questionIndex + 1} 位必须是 1 至 4`)
    }
    return optionIndex
  })
}

export function searchForCharacter({
  questions,
  dimensions,
  characters,
  targetIndex,
  random,
  restarts = 80,
  steps = 100,
}) {
  const target = characters[targetIndex]
  let nearest = null

  for (let restart = 0; restart < restarts; restart += 1) {
    const answers = questions.map((question) => Math.floor(random() * question.options.length))

    for (let step = 0; step < steps; step += 1) {
      const profile = profileForOptionIndexes(questions, dimensions, answers)
      const targetDistance = squaredDistance(profile, target, dimensions)
      const competitor = findMatch(profile, characters, dimensions, targetIndex)
      const margin = targetDistance - competitor.distance

      if (!nearest || targetDistance < nearest.targetDistance) {
        nearest = { answers: [...answers], profile, targetDistance }
      }
      if (findMatch(profile, characters, dimensions).index === targetIndex) {
        return { answers: [...answers], profile, targetDistance, reachable: true }
      }

      let bestMove = null
      let bestMargin = margin
      for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
        const currentOption = answers[questionIndex]
        for (
          let optionIndex = 0;
          optionIndex < questions[questionIndex].options.length;
          optionIndex += 1
        ) {
          if (optionIndex === currentOption) continue
          answers[questionIndex] = optionIndex
          const candidateProfile = profileForOptionIndexes(questions, dimensions, answers)
          const candidateTargetDistance = squaredDistance(candidateProfile, target, dimensions)
          const candidateCompetitor = findMatch(
            candidateProfile,
            characters,
            dimensions,
            targetIndex,
          )
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

  return nearest ? { ...nearest, reachable: false } : null
}

export function formatProfile(profile, dimensions) {
  return dimensions.map((dimension) => `${dimension}=${profile[dimension]}`).join('，')
}

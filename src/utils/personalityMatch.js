export function dimensionEntries(scoreData) {
  return Object.entries(scoreData?.dimensions || {}).map(([id, axis]) => ({
    id,
    key: axis.positive,
    positive: axis.positive,
    negative: axis.negative,
  }))
}

export function calculateQuizProfile(questions, answers, dimensions) {
  const totals = Object.fromEntries(dimensions.map((dimension) => [dimension, 0]))
  let answeredCount = 0

  answers.forEach((optionId, questionIndex) => {
    if (optionId == null) return
    const option = questions[questionIndex]?.options.find((item) => item.id === optionId)
    if (!option) return
    answeredCount += 1
    dimensions.forEach((dimension) => {
      totals[dimension] += Number(option.scores[dimension] || 0)
    })
  })

  return Object.fromEntries(
    dimensions.map((dimension) => [
      dimension,
      answeredCount ? Math.round(totals[dimension] / answeredCount) : 0,
    ]),
  )
}

export function encodeAnswerSequence(questions, answers) {
  return answers
    .map((optionId, questionIndex) => {
      const optionIndex = questions[questionIndex]?.options.findIndex(
        (option) => option.id === optionId,
      )
      if (optionIndex < 0) throw new Error(`第 ${questionIndex + 1} 题缺少有效答案`)
      return String(optionIndex + 1)
    })
    .join('')
}

export function decodeAnswerSequence(questions, sequence) {
  const normalized = String(sequence || '').replace(/[\s-]/g, '')
  if (normalized.length !== questions.length) {
    throw new Error(`答案序列应为 ${questions.length} 位，当前为 ${normalized.length} 位`)
  }

  return [...normalized].map((digit, questionIndex) => {
    const optionIndex = Number(digit) - 1
    const option = questions[questionIndex]?.options[optionIndex]
    if (!option) throw new Error(`答案序列第 ${questionIndex + 1} 位必须是 1 至 4`)
    return option.id
  })
}

export function euclideanDistance(left, right, dimensions) {
  return Math.sqrt(
    dimensions.reduce((sum, dimension) => {
      const difference = Number(left[dimension] || 0) - Number(right[dimension] || 0)
      return sum + difference ** 2
    }, 0),
  )
}

export function findClosestCharacter(profile, characters, dimensions) {
  return characters.reduce((closest, character) => {
    const distance = euclideanDistance(profile, character, dimensions)
    if (!closest || distance < closest.distance) return { character, distance }
    return closest
  }, null)
}

export function tendencyPosition(value, minimum = -50, maximum = 50) {
  const clamped = Math.min(maximum, Math.max(minimum, Number(value) || 0))
  return ((clamped - minimum) / (maximum - minimum)) * 100
}

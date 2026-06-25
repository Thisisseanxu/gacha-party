export function dimensionEntries(scoreData) {
  return Object.entries(scoreData?.dimensions || {}).map(([id, axis]) => ({
    id,
    key: axis.positive,
    positive: axis.positive,
    negative: axis.negative,
  }))
}

export function questionScore(question, option, dimensions) {
  const optionValue = Number(option?.value ?? option?.coefficient ?? 0)
  const questionWeight = Number(question?.weight ?? 1)
  const scores = Object.fromEntries(dimensions.map((dimension) => [dimension, 0]))

  ;(question?.traits || []).forEach((trait) => {
    const dimension = trait.dimension
    if (!Object.hasOwn(scores, dimension)) return
    scores[dimension] += optionValue * questionWeight * Number(trait.coefficient ?? 1)
  })

  return scores
}

export function quizDimensionMaximums(questions, dimensions) {
  return Object.fromEntries(
    dimensions.map((dimension) => {
      const maximum = questions.reduce((sum, question) => {
        const questionWeight = Number(question.weight ?? 1)
        const maxOptionValue = Math.max(
          ...question.options.map((option) => Math.abs(Number(option.value ?? 0))),
        )
        const traitWeight = (question.traits || []).reduce(
          (traitSum, trait) =>
            trait.dimension === dimension
              ? traitSum + Math.abs(Number(trait.coefficient ?? 1))
              : traitSum,
          0,
        )
        return sum + maxOptionValue * questionWeight * traitWeight
      }, 0)
      return [dimension, maximum || 1]
    }),
  )
}

export function calculateQuizProfile(questions, answers, dimensions) {
  const totals = Object.fromEntries(dimensions.map((dimension) => [dimension, 0]))
  const maximums = quizDimensionMaximums(questions, dimensions)
  let answeredCount = 0

  answers.forEach((optionId, questionIndex) => {
    if (optionId == null) return
    const option = questions[questionIndex]?.options.find((item) => item.id === optionId)
    if (!option) return
    answeredCount += 1
    const optionScores = questionScore(questions[questionIndex], option, dimensions)
    dimensions.forEach((dimension) => {
      totals[dimension] += optionScores[dimension]
    })
  })

  return Object.fromEntries(
    dimensions.map((dimension) => [
      dimension,
      answeredCount ? Math.round((totals[dimension] / maximums[dimension]) * 50) : 0,
    ]),
  )
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

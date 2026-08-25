const DATA_TYPE = 'gacha-party-luck-ranking-index'
const SCHEMA_VERSION = 2
const MAX_RANKING_SIZE = 30

function assert(condition, message) {
  if (!condition) throw new Error(`欧非排行榜数据格式错误：${message}`)
}

function normalizeString(value, field) {
  assert(typeof value === 'string', `${field} 必须是字符串`)
  const normalized = value.trim()
  assert(normalized.length > 0, `${field} 不能为空`)
  return normalized
}

function normalizeMaskedPlayerId(value, field) {
  const normalized = normalizeString(value, field)
  assert(/^\d{2}\*{3}\d{2}$/.test(normalized), `${field} 必须是 12***67 格式的脱敏 ID`)
  return normalized
}

function normalizeNonNegativeNumber(value, field, { integer = false } = {}) {
  assert(typeof value === 'number' && Number.isFinite(value), `${field} 必须是有限数字`)
  assert(value >= 0, `${field} 不能小于 0`)
  if (integer) assert(Number.isInteger(value), `${field} 必须是整数`)
  return value
}

function normalizeRange(value, field) {
  assert(Array.isArray(value) && value.length === 2, `${field} 必须是 [开始时间, 结束时间]`)
  return {
    start: normalizeString(value[0], `${field}[0]`),
    end: normalizeString(value[1], `${field}[1]`),
  }
}

function normalizeEntries(value, field, spCards = null) {
  assert(Array.isArray(value), `${field} 必须是数组`)
  assert(value.length <= MAX_RANKING_SIZE, `${field} 最多只能有 ${MAX_RANKING_SIZE} 条`)

  return value.map((entry, index) => {
    const itemField = `${field}[${index}]`
    const expectedLength = spCards ? 4 : 3
    assert(
      Array.isArray(entry) && entry.length === expectedLength,
      `${itemField} 必须是长度为 ${expectedLength} 的数组`,
    )

    const normalized = {
      playerId: normalizeMaskedPlayerId(String(entry[0] ?? ''), `${itemField}[0]`),
      pulls: normalizeNonNegativeNumber(entry[1], `${itemField}[1]`, { integer: true }),
      averagePulls: normalizeNonNegativeNumber(entry[2], `${itemField}[2]`),
    }

    if (spCards) {
      const counts = entry[3]
      assert(Array.isArray(counts), `${itemField}[3] 必须是 SP 数量数组`)
      assert(counts.length === spCards.length, `${itemField}[3] 必须与 spCards 等长`)
      normalized.sp = counts
        .map((count, spIndex) => ({
          cardId: spCards[spIndex],
          count: normalizeNonNegativeNumber(count, `${itemField}[3][${spIndex}]`, {
            integer: true,
          }),
        }))
        .filter((drop) => drop.count > 0)
    }

    return normalized
  })
}

function normalizeBoard(value, field, spCards = null) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${field} 必须是对象`)
  return {
    range: normalizeRange(value.range, `${field}.range`),
    sampleSize: normalizeNonNegativeNumber(value.sampleSize, `${field}.sampleSize`, {
      integer: true,
    }),
    lucky: normalizeEntries(value.lucky, `${field}.lucky`, spCards),
    unlucky: normalizeEntries(value.unlucky, `${field}.unlucky`, spCards),
  }
}

export function normalizeLuckRankingIndex(value) {
  assert(value && typeof value === 'object' && !Array.isArray(value), '根节点必须是对象')
  assert(value.dataType === DATA_TYPE, `dataType 必须是 ${DATA_TYPE}`)
  assert(value.schemaVersion === SCHEMA_VERSION, `当前页面仅支持 schemaVersion: ${SCHEMA_VERSION}`)

  const generatedAt = normalizeString(value.generatedAt, 'generatedAt')
  assert(!Number.isNaN(Date.parse(generatedAt)), 'generatedAt 必须是合法的 ISO 8601 时间')

  assert(Array.isArray(value.pools), 'pools 必须是数组')
  const seenPoolIds = new Set()
  const pools = value.pools.map((pool, index) => {
    const field = `pools[${index}]`
    assert(Array.isArray(pool) && pool.length === 3, `${field} 必须是 [卡池ID, 名称, 图片路径]`)
    const poolId = normalizeString(String(pool[0] ?? ''), `${field}[0]`)
    assert(!seenPoolIds.has(poolId), `${field}.poolId 与其他卡池重复`)
    seenPoolIds.add(poolId)
    return {
      poolId,
      poolName: normalizeString(pool[1], `${field}[1]`),
      imageUrl: normalizeString(pool[2], `${field}[2]`),
    }
  })

  assert(value.total && typeof value.total === 'object', 'total 必须是对象')
  return {
    dataType: DATA_TYPE,
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    isSample: value.isSample === true,
    total: {
      label: normalizeString(value.total.label, 'total.label'),
      ...normalizeBoard(value.total, 'total'),
    },
    pools,
  }
}

export function normalizeLuckRankingPoolData(value, expectedPoolId = '') {
  assert(value && typeof value === 'object' && !Array.isArray(value), '卡池详情必须是对象')
  const poolId = normalizeString(String(expectedPoolId), '卡池详情对应的 poolId')
  const targetRarity = value.targetRarity == null ? 'SP' : normalizeString(value.targetRarity, 'targetRarity')
  assert(targetRarity === 'SP' || targetRarity === 'SSR', 'targetRarity 只能是 SP 或 SSR')
  let spCards = []
  if (targetRarity === 'SP') {
    assert(Array.isArray(value.spCards) && value.spCards.length > 0, 'SP 卡池的 spCards 不能为空')
    spCards = value.spCards.map((cardId, index) =>
      normalizeString(String(cardId ?? ''), `spCards[${index}]`),
    )
    assert(new Set(spCards).size === spCards.length, 'spCards 不能包含重复 ID')
  }
  return {
    poolId,
    targetRarity,
    spCards,
    ...normalizeBoard(value, `卡池 ${poolId}`, targetRarity === 'SP' ? spCards : null),
  }
}

export { DATA_TYPE, MAX_RANKING_SIZE, SCHEMA_VERSION }

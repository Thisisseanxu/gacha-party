// Mirrors 4生成欧非排行榜.py. Keep the Python snapshot parity check when changing this code.
const playerPattern = /^\d{7}$/
const poolPattern = /^[A-Za-z0-9_-]+$/
const excludedTotal = new Set(['10000', '9'])

function integer(value) {
  if (typeof value === 'string' && !/^[+-]?\d+$/.test(value.trim())) return 0
  const number = Number(value)
  return Number.isFinite(number) ? Math.trunc(number) : 0
}

function cardId(value) {
  const id = String(value || '').trim()
  return id.startsWith('15') && id.length > 2 ? id.slice(2) : id
}

function orderRecords(a, b) {
  return integer(a.created_at) - integer(b.created_at) || integer(a.id) - integer(b.id)
}

// Python round(float, 2) rounds the exact binary float to nearest decimal, ties to even.
// Math.round and toFixed disagree with Python on values such as 2.675 and 0.125.
export function pythonRoundTwo(value) {
  if (value === 0) return 0
  const bytes = new DataView(new ArrayBuffer(8))
  bytes.setFloat64(0, value)
  const bits = bytes.getBigUint64(0)
  const exponent = Number((bits >> 52n) & 2047n)
  let numerator = (bits & ((1n << 52n) - 1n)) | (exponent ? 1n << 52n : 0n)
  let denominator = 1n
  const power = (exponent || 1) - 1023 - 52
  if (power >= 0) numerator <<= BigInt(power)
  else denominator <<= BigInt(-power)
  numerator *= 100n
  let rounded = numerator / denominator
  const remainder = numerator % denominator
  if (remainder * 2n > denominator || (remainder * 2n === denominator && rounded % 2n)) rounded++
  return (Number(rounded) / 100) * (value < 0 ? -1 : 1)
}

function makeStats() {
  return { players: new Map(), min: null, max: null }
}

function playerStats(stats, id) {
  if (!stats.players.has(id)) stats.players.set(id, { pulls: 0, drops: 0, cost: 0, counts: {} })
  return stats.players.get(id)
}

function updateRange(stats, records) {
  for (const record of records) {
    let value = integer(record.created_at)
    if (value > 10_000_000_000) value = Math.trunc(value / 1000)
    if (value <= 0) continue
    stats.min = stats.min == null ? value : Math.min(stats.min, value)
    stats.max = stats.max == null ? value : Math.max(stats.max, value)
  }
}

function checkedRange(stats) {
  if (stats.min == null || stats.max == null) throw new Error('Ranking has no valid timestamps')
  const iso = (value) => new Date(value * 1000).toISOString().replace('.000Z', 'Z')
  return [iso(stats.min), iso(stats.max)]
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

function rows(stats, config = null) {
  const candidates = []
  for (const [id, values] of stats.players) {
    const normal = config?.rarity === 'SSR'
    if (values.drops < (config ? (normal ? 15 : 5) : 1)) continue
    if (config ? normal && values.pulls < 300 : values.pulls <= 1500) continue
    candidates.push({
      ...values,
      id: `${id.slice(0, 2)}***${id.slice(-2)}`,
      average: pythonRoundTwo(values.cost / values.drops),
    })
  }
  const lucky = candidates
    .filter((item) => !config || item.average < 36)
    .sort(
      (a, b) =>
        a.average - b.average || b.drops - a.drops || b.pulls - a.pulls || compareText(a.id, b.id),
    )
  const unlucky = candidates
    .filter((item) => !config || item.average > (config.rarity === 'SSR' ? 13 : 37))
    .sort((a, b) => b.average - a.average || b.pulls - a.pulls || compareText(a.id, b.id))
  const compact = (item) => {
    const result = [item.id, item.pulls, item.average]
    if (config?.rarity === 'SP') result.push(config.cards.map((id) => item.counts[id] || 0))
    return result
  }
  return { lucky: lucky.slice(0, 30).map(compact), unlucky: unlucky.slice(0, 30).map(compact) }
}

function serializeStats(stats) {
  return { ...stats, players: [...stats.players] }
}

function restoreStats(stats) {
  return { ...stats, players: new Map(stats.players) }
}

export function createRankingEngine(rawConfig, fullConfig, cards, state = null) {
  if (!rawConfig?.names || !Array.isArray(fullConfig?.pools) || !Array.isArray(cards)) {
    throw new Error('Invalid ranking configuration')
  }
  const byName = new Map(
    cards
      .filter((card) => card.name && card.id)
      .map((card) => [String(card.name), String(card.id)]),
  )
  const rarities = Object.fromEntries(
    ['SP', 'SSR'].map((rarity) => [
      rarity,
      new Set(
        cards.filter((card) => card.rarity === rarity && card.id).map((card) => String(card.id)),
      ),
    ]),
  )
  const pairs = fullConfig.pools.filter(
    (pair) => Array.isArray(pair) && pair.length === 2 && pair[1],
  )
  const byPoolName = new Map(
    pairs.filter(([, meta]) => meta.name).map(([id, meta]) => [String(meta.name), String(id)]),
  )
  const frontendIds = new Set(pairs.map(([id]) => String(id)))
  const mapping = new Map()
  for (const [id, name] of Object.entries(rawConfig.names)) {
    const mapped = byPoolName.get(String(name)) ?? (frontendIds.has(id) ? id : null)
    if (mapped != null) mapping.set(id, mapped)
  }
  const groups = new Map()
  for (const [field, group] of [
    ['limited', 'Limited'],
    ['event', 'Event'],
    ['limited_fuke', 'LimitedFuke'],
    ['event_fuke', 'EventFuke'],
  ]) {
    if (rawConfig[field] != null && !Array.isArray(rawConfig[field]))
      throw new Error('Invalid pity groups')
    for (const id of rawConfig[field] || []) groups.set(String(id), group)
  }
  const configs = new Map()
  for (const [rawId, meta] of pairs) {
    const id = String(rawId)
    const rarity = id === '9' ? 'SSR' : 'SP'
    const names = meta.cardNames?.[rarity]
    if (!Array.isArray(names) || !names.length) continue
    if (!poolPattern.test(id) || names.some((name) => !byName.has(String(name)))) {
      throw new Error('Invalid pool cards or pool ID')
    }
    const ids = [...new Set(names.map((name) => byName.get(String(name))))]
    configs.set(id, {
      name: String(meta.name || id),
      image: String(meta.imageUrl || `/images/cardpools/${id}.webp`),
      rarity,
      cards: ids,
      dropSet: new Set(ids),
      targetSet: rarities[rarity],
      total: !excludedTotal.has(id),
    })
  }
  const total = state ? restoreStats(state.total) : makeStats()
  const pools = state
    ? new Map(state.pools.map(([id, stats]) => [id, restoreStats(stats)]))
    : new Map([...configs.keys()].map((id) => [id, makeStats()]))
  // JS enumerates numeric object keys numerically; the Python source preserves JSON insertion order.
  // Record documents normally have one player, but use the parsed source order supplied by the caller.
  function consume(document, order = {}) {
    if (!document || typeof document !== 'object' || Array.isArray(document))
      throw new Error('Invalid record document')
    for (const id of order.players || Object.keys(document)) {
      const playerPools = document[id]
      if (
        !playerPattern.test(id) ||
        !playerPools ||
        typeof playerPools !== 'object' ||
        Array.isArray(playerPools)
      )
        continue
      const grouped = new Map()
      for (const rawId of order.pools?.get(id) || Object.keys(playerPools)) {
        const rawRecords = playerPools[rawId]
        const frontendId = mapping.get(rawId)
        const config = configs.get(frontendId)
        if (!config || !Array.isArray(rawRecords)) continue
        let records = rawRecords.filter(
          (record) => record && typeof record === 'object' && !Array.isArray(record),
        )
        if (rawId === '10000') {
          const kept = []
          let cycle = []
          for (const record of records.sort(orderRecords)) {
            cycle.push(record)
            if (rarities.SP.has(cardId(record.item_id))) {
              if (cycle.length <= 60) kept.push(...cycle)
              cycle = []
            }
          }
          if (cycle.length < 60) kept.push(...cycle)
          records = kept
        }
        if (!records.length) continue
        const stats = pools.get(frontendId)
        const player = playerStats(stats, id)
        player.pulls += records.length
        updateRange(stats, records)
        if (config.total) {
          playerStats(total, id).pulls += records.length
          updateRange(total, records)
        }
        const group = groups.get(rawId) || `singleton:${rawId}`
        if (!grouped.has(group)) grouped.set(group, [])
        for (const record of records) {
          const itemId = cardId(record.item_id)
          if (config.rarity === 'SP' && config.dropSet.has(itemId))
            player.counts[itemId] = (player.counts[itemId] || 0) + 1
          grouped.get(group).push([frontendId, record])
        }
      }
      for (const records of grouped.values()) {
        let cost = 0
        for (const [frontendId, record] of records.sort((a, b) => orderRecords(a[1], b[1]))) {
          cost++
          const config = configs.get(frontendId)
          if (!config.targetSet.has(cardId(record.item_id))) continue
          const player = playerStats(pools.get(frontendId), id)
          player.drops++
          player.cost += cost
          if (config.total) {
            const totalPlayer = playerStats(total, id)
            totalPlayer.drops++
            totalPlayer.cost += cost
          }
          cost = 0
        }
      }
    }
  }

  function finish(generatedAt = new Date().toISOString()) {
    if (!total.players.size) throw new Error('No eligible SP records')
    const index = {
      dataType: 'gacha-party-luck-ranking-index',
      schemaVersion: 2,
      generatedAt,
      isSample: false,
      total: {
        label: '全卡池总榜',
        range: checkedRange(total),
        sampleSize: total.players.size,
        ...rows(total),
      },
      pools: [],
    }
    const details = {}
    for (const [id, config] of configs) {
      const stats = pools.get(id)
      if (!stats.players.size) continue
      const ranking = rows(stats, config)
      if (!ranking.lucky.length && !ranking.unlucky.length) continue
      index.pools.push([id, config.name, config.image])
      details[id] = {
        range: checkedRange(stats),
        sampleSize: stats.players.size,
        ...ranking,
        ...(config.rarity === 'SP' ? { spCards: config.cards } : { targetRarity: 'SSR' }),
      }
    }
    return { index, details }
  }
  return {
    consume,
    finish,
    exportState: () => ({
      total: serializeStats(total),
      pools: [...pools].map(([id, stats]) => [id, serializeStats(stats)]),
    }),
  }
}

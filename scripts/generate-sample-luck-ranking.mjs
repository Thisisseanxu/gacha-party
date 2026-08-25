import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const poolSourcePath = resolve(root, 'public/data/card_pools_full.json')
const cardSourcePath = resolve(root, 'public/data/cards.json')
const outputPath = resolve(root, 'public/data/luck-ranking.json')
const poolOutputDir = resolve(root, 'public/data/luck-ranking-pools')

const POOL_SAMPLE_COUNT = 8
const RANKING_SIZE = 30
const GENERATED_AT = new Date().toISOString()

function mulberry32(seed) {
  return () => {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(value) {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min
}

function createMaskedPlayerId(scope, mode, index) {
  const numericId = 1000000 + ((hashString(`${scope}:${mode}:${index}`) + index) % 9000000)
  const rawId = String(numericId)
  return `${rawId.slice(0, 2)}***${rawId.slice(-2)}`
}

function toIsoInShanghai(value) {
  if (!value) return GENERATED_AT
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return `${value.replace(' ', 'T')}+08:00`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? GENERATED_AT : parsed.toISOString()
}

function rangeEndFor(pool) {
  const finish = toIsoInShanghai(pool.finishTime)
  return Date.parse(finish) > Date.parse(GENERATED_AT) ? GENERATED_AT : finish
}

function distributeSp(random, spCards, total) {
  const counts = new Array(spCards.length).fill(0)
  for (let index = 0; index < total; index += 1) {
    counts[randomInt(random, 0, spCards.length - 1)] += 1
  }
  return counts
}

function makeEntries({ scope, mode, spCards = null }) {
  const random = mulberry32(hashString(`${scope}:${mode}:20260826`))
  const isLucky = mode === 'lucky'

  return Array.from({ length: RANKING_SIZE }, (_, index) => {
    const baseAverage = isLucky ? 5.2 + index * 0.34 : 59.7 - index * 0.2
    const targetAverage = baseAverage + random() * (isLucky ? 0.25 : -0.18)
    const spCount = spCards
      ? randomInt(random, isLucky ? 3 : 1, isLucky ? 14 : 7)
      : randomInt(random, isLucky ? 18 : 5, isLucky ? 80 : 22)
    // 当前卡池抽数与每个 SP 的实际花费并非简单除法关系：同保底组会跨池继承。
    // 演示数据也刻意让两者相互独立，避免暗示 pulls / spCount 的错误算法。
    const pulls = Math.max(
      spCount,
      Math.round(targetAverage * spCount + randomInt(random, -24, 48)),
    )
    const entry = [
      createMaskedPlayerId(scope, mode, index),
      pulls,
      Number(targetAverage.toFixed(2)),
    ]

    if (spCards) entry.push(distributeSp(random, spCards, spCount))
    return entry
  })
}

const poolSource = JSON.parse(await readFile(poolSourcePath, 'utf8'))
const cards = JSON.parse(await readFile(cardSourcePath, 'utf8'))
const cardsByName = new Map(cards.map((card) => [card.name, card]))
const poolEntries = Array.isArray(poolSource) ? poolSource : poolSource.pools

const samplePools = poolEntries
  .map(([poolId, pool]) => {
    const spCards = (pool.cardNames?.SP || []).map((name) => cardsByName.get(name)).filter(Boolean)
    return { poolId: String(poolId), pool, spCards }
  })
  .filter(({ spCards }) => spCards.length > 0 && spCards.length <= 4)
  .slice(0, POOL_SAMPLE_COUNT)

const allStarts = poolEntries
  .map(([, pool]) => pool.startTime)
  .filter(Boolean)
  .map(toIsoInShanghai)
  .sort((a, b) => Date.parse(a) - Date.parse(b))

const data = {
  dataType: 'gacha-party-luck-ranking-index',
  schemaVersion: 2,
  generatedAt: GENERATED_AT,
  isSample: true,
  total: {
    label: '全服总榜',
    range: [allStarts[0] || GENERATED_AT, GENERATED_AT],
    sampleSize: 28641,
    lucky: makeEntries({ scope: 'ALL', mode: 'lucky' }),
    unlucky: makeEntries({ scope: 'ALL', mode: 'unlucky' }),
  },
  pools: samplePools.map(({ poolId, pool }) => [poolId, pool.name, pool.imageUrl]),
}

const poolDetails = samplePools.map(({ poolId, pool, spCards }, poolIndex) => ({
  poolId,
  data: {
    range: [toIsoInShanghai(pool.startTime), rangeEndFor(pool)],
    spCards: spCards.map((card) => String(card.id)),
    sampleSize: 1840 + poolIndex * 367,
    lucky: makeEntries({ scope: poolId.replace(/[^a-zA-Z0-9]/g, ''), mode: 'lucky', spCards }),
    unlucky: makeEntries({
      scope: poolId.replace(/[^a-zA-Z0-9]/g, ''),
      mode: 'unlucky',
      spCards,
    }),
  },
}))

await mkdir(poolOutputDir, { recursive: true })
const expectedFiles = new Set()
for (const { poolId, data: poolData } of poolDetails) {
  const filename = `${poolId}.json`
  expectedFiles.add(filename)
  await writeFile(resolve(poolOutputDir, filename), `${JSON.stringify(poolData)}\n`, 'utf8')
}
await writeFile(outputPath, `${JSON.stringify(data)}\n`, 'utf8')
for (const entry of await readdir(poolOutputDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.json') && !expectedFiles.has(entry.name)) {
    await unlink(resolve(poolOutputDir, entry.name))
  }
}
console.log(`已生成 ${outputPath}`)
console.log(`总榜 1 份，卡池榜 ${samplePools.length} 份，每份欧/非榜各 ${RANKING_SIZE} 条。`)

import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { rankingConfig } from '../cloud-functions/_shared/luck-ranking-config.js'
import { createRankingEngine } from '../cloud-functions/_shared/luck-ranking-engine.js'
import { decodeRecord } from '../cloud-functions/_shared/luck-ranking-codec.js'

const directory = process.argv[2]
if (!directory)
  throw new Error(
    'Usage: npm run ranking:verify -- <records_origin directory> [expected public/data directory]',
  )
const expectedDirectory = resolve(process.argv[3] || 'public/data')
const index = JSON.parse(await readFile(resolve(expectedDirectory, 'luck-ranking.json'), 'utf8'))
const engine = createRankingEngine(...rankingConfig)
const started = performance.now()
const files = (await readdir(directory)).filter((file) => /^record_\d{7}$/.test(file)).sort()
assert.ok(files.length, 'No compressed player records found')
for (const file of files) {
  const { document, order } = decodeRecord(await readFile(resolve(directory, file), 'utf8'))
  engine.consume(document, order)
}
const ranking = engine.finish(index.generatedAt)
assert.deepEqual(ranking.index, index, 'Cloud calculation differs from the Python index')
for (const [id, detail] of Object.entries(ranking.details)) {
  assert.deepEqual(
    detail,
    JSON.parse(
      await readFile(resolve(expectedDirectory, 'luck-ranking-pools', `${id}.json`), 'utf8'),
    ),
    `Pool ${id} differs from the Python output`,
  )
}
const expectedFiles = (await readdir(resolve(expectedDirectory, 'luck-ranking-pools')))
  .filter((file) => file.endsWith('.json'))
  .sort()
assert.deepEqual(
  Object.keys(ranking.details)
    .map((id) => `${id}.json`)
    .sort(),
  expectedFiles,
)
console.log(
  JSON.stringify({
    records: files.length,
    players: index.total.sampleSize,
    pools: index.pools.length,
    computeSeconds: Number(((performance.now() - started) / 1000).toFixed(3)),
    matchesPythonSnapshot: true,
  }),
)

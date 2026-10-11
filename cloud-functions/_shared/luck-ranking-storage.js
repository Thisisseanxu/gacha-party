import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { getStore } from '@edgeone/pages-blob'
import seed from '../../.generated/luck-ranking-seed.json' with { type: 'json' }
import seedGzip from '../../.generated/luck-ranking-seed-gzip.json' with { type: 'json' }
import { encodeRankingBundle, matchesRankingEtag } from '../../lib/luck-ranking/bundle.js'
import {
  BUNDLE_DATA_TYPE,
  BUNDLE_SCHEMA_VERSION,
  normalizeLuckRankingBundle,
  normalizeLuckRankingIndex,
} from '../../src/utils/luckRankingData.js'

export const STORE_NAME = 'luck-ranking'
export const seedRanking = seed
const seedBody = Buffer.from(seedGzip.data, 'base64')

export function getRankingStore(env = {}) {
  return getStore(env.LUCK_RANKING_STORE_NAME || STORE_NAME)
}

export function versionPrefix(generatedAt) {
  if (
    typeof generatedAt !== 'string' ||
    generatedAt.length > 40 ||
    !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(generatedAt) ||
    !Number.isFinite(Date.parse(generatedAt))
  )
    throw new Error('Invalid ranking version')
  const digest = createHash('sha256').update(generatedAt).digest('hex').slice(0, 32)
  return `versions/${generatedAt.slice(0, 10)}/${digest}/`
}

export function validateRanking({ index, details }) {
  normalizeLuckRankingBundle({
    dataType: BUNDLE_DATA_TYPE,
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    index,
    details,
  })
}

export async function publishRanking(store, ranking, checkpointKey = null) {
  const { body, etag } = encodeRankingBundle(ranking)
  const prefix = versionPrefix(ranking.index.generatedAt)
  await store.set(`${prefix}bundle.json.gz`, body, { cacheControl: null })
  // Switch the pointer only after the complete compressed public snapshot is stored.
  await store.setJSON(
    'current.json',
    {
      generatedAt: ranking.index.generatedAt,
      bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
      etag,
      ...(checkpointKey ? { checkpointKey } : {}),
    },
    { cacheControl: null },
  )
}

export function readSeedBundle(ifNoneMatch = null) {
  return {
    status: matchesRankingEtag(ifNoneMatch, seedGzip.etag) ? 304 : 200,
    body: seedBody,
    etag: seedGzip.etag,
    source: 'seed',
  }
}

function isBundlePointer(pointer) {
  return (
    pointer?.bundleSchemaVersion === BUNDLE_SCHEMA_VERSION &&
    /^"luck-[a-f0-9]{64}"$/.test(pointer.etag)
  )
}

async function readLegacyRanking(store, pointer) {
  const prefix = versionPrefix(pointer.generatedAt)
  const index = await store.get(`${prefix}index.json`, { type: 'json', consistency: 'strong' })
  normalizeLuckRankingIndex(index)
  if (index.generatedAt !== pointer.generatedAt) throw new Error('Ranking version mismatch')
  const details = {}
  for (let offset = 0; offset < index.pools.length; offset += 8) {
    const entries = await Promise.all(
      index.pools
        .slice(offset, offset + 8)
        .map(async ([id]) => [
          id,
          await store.get(`${prefix}pools/${id}.json`, { type: 'json', consistency: 'strong' }),
        ]),
    )
    for (const [id, detail] of entries) details[id] = detail
  }
  return { index, details }
}

// Called by update jobs under the publication lock, including on already-completed days.
export async function migrateCurrentRanking(store) {
  const pointer = await store.get('current.json', { type: 'json', consistency: 'strong' })
  if (pointer && !isBundlePointer(pointer)) {
    await publishRanking(store, await readLegacyRanking(store, pointer), pointer.checkpointKey)
  }
}

export async function readRankingBundle(store, ifNoneMatch = null) {
  const pointer = await store.get('current.json', { type: 'json', consistency: 'strong' })
  if (!pointer) return readSeedBundle(ifNoneMatch)
  const prefix = versionPrefix(pointer.generatedAt)
  if (!isBundlePointer(pointer)) {
    // Preserve the deployed live ranking until the first update migrates its storage.
    // This compatibility read exposes only the bundle, never the former per-pool endpoints.
    const { body, etag } = encodeRankingBundle(await readLegacyRanking(store, pointer))
    return {
      status: matchesRankingEtag(ifNoneMatch, etag) ? 304 : 200,
      body,
      etag,
      source: 'blob-legacy',
    }
  }
  if (matchesRankingEtag(ifNoneMatch, pointer.etag)) {
    return { status: 304, etag: pointer.etag, source: 'blob' }
  }
  const body = await store.get(`${prefix}bundle.json.gz`, {
    type: 'arrayBuffer',
    consistency: 'strong',
  })
  if (!body) throw new Error('Published ranking bundle missing')
  return { status: 200, body, etag: pointer.etag, source: 'blob' }
}

export async function cleanupRanking(store, now = Date.now()) {
  const current = await store.get('current.json', { type: 'json', consistency: 'strong' })
  let remaining = 200
  for (const [root, days] of [
    ['jobs/', 7],
    ['ticks/', 7],
    ['locks/', 7],
    ['versions/', 30],
  ]) {
    const cutoff = new Date(now - days * 86400_000).toISOString().slice(0, 10)
    const { directories } = await store.list({
      prefix: root,
      directories: true,
      consistency: 'strong',
    })
    for (const directory of directories || []) {
      const day = directory.slice(root.length).replace(/\/$/, '')
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        day >= cutoff ||
        (root === 'versions/' && day === current?.generatedAt?.slice(0, 10))
      )
        continue
      const { blobs } = await store.list({
        prefix: directory,
        limit: remaining,
        paginate: false,
        consistency: 'strong',
      })
      for (let offset = 0; offset < blobs.length; offset += 8) {
        await Promise.all(blobs.slice(offset, offset + 8).map((blob) => store.delete(blob.key)))
      }
      remaining -= blobs.length
      if (remaining <= 0) return
    }
  }
}

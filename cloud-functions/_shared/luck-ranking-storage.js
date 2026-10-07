import { createHash } from 'node:crypto'
import { getStore } from '@edgeone/pages-blob'
import seed from '../../.generated/luck-ranking-seed.json' with { type: 'json' }
import {
  normalizeLuckRankingIndex,
  normalizeLuckRankingPoolData,
} from '../../src/utils/luckRankingData.js'

export const STORE_NAME = 'luck-ranking'
export const seedRanking = seed

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
  normalizeLuckRankingIndex(index)
  if (Object.keys(details).length !== index.pools.length)
    throw new Error('Incomplete ranking details')
  for (const [id] of index.pools) {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Invalid pool ID')
    normalizeLuckRankingPoolData(details[id], id)
  }
}

export async function publishRanking(store, ranking, checkpointKey = null) {
  validateRanking(ranking)
  const prefix = versionPrefix(ranking.index.generatedAt)
  const entries = Object.entries(ranking.details)
  for (let offset = 0; offset < entries.length; offset += 8) {
    await Promise.all(
      entries
        .slice(offset, offset + 8)
        .map(([id, detail]) =>
          store.setJSON(`${prefix}pools/${id}.json`, detail, { cacheControl: null }),
        ),
    )
  }
  await store.setJSON(`${prefix}index.json`, ranking.index, { cacheControl: null })
  // The pointer is replaced only after every immutable detail and the index have been written.
  await store.setJSON(
    'current.json',
    { generatedAt: ranking.index.generatedAt, ...(checkpointKey ? { checkpointKey } : {}) },
    { cacheControl: null },
  )
}

export async function readRanking(store, poolId = null, generatedAt = null) {
  if (poolId != null && !/^[A-Za-z0-9_-]+$/.test(poolId)) return { status: 400 }
  if (generatedAt != null) {
    try {
      versionPrefix(generatedAt)
    } catch {
      return { status: 400 }
    }
  }
  let pointer = null
  try {
    if (!generatedAt)
      pointer = await store.get('current.json', { type: 'json', consistency: 'strong' })
    generatedAt ||= pointer?.generatedAt
    if (generatedAt && generatedAt !== seed.index.generatedAt) {
      const prefix = versionPrefix(generatedAt)
      const key = poolId == null ? `${prefix}index.json` : `${prefix}pools/${poolId}.json`
      const body = await store.get(key, { type: 'json', consistency: 'strong' })
      return body ? { status: 200, body, source: 'blob' } : { status: 404 }
    }
  } catch {
    // A pinned version must never silently receive a different generation's details.
    if (generatedAt && generatedAt !== seed.index.generatedAt) return { status: 503 }
  }
  const body = poolId == null ? seed.index : seed.details[poolId]
  return body ? { status: 200, body, source: 'seed' } : { status: 404 }
}

export async function cleanupRanking(store, now = Date.now()) {
  const current = await store.get('current.json', { type: 'json', consistency: 'strong' })
  let remaining = 200
  for (const [root, days] of [
    ['jobs/', 7],
    ['ticks/', 7],
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

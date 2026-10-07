import { PreconditionFailedError } from '@edgeone/pages-blob'
import { createRankingEngine } from './luck-ranking-engine.js'
import { decodeRecord, decodeCheckpoint, encodeCheckpoint } from './luck-ranking-codec.js'
import { publishRanking } from './luck-ranking-storage.js'

export function scheduledSlot(now = Date.now()) {
  const date = new Date(now + 8 * 3600_000)
  const minute = date.getUTCMinutes()
  if (date.getUTCHours() !== 3 || ![15, 20, 25].includes(minute)) return null
  return { day: date.toISOString().slice(0, 10), slot: `03-${minute}` }
}

export async function runRankingJob({
  store,
  source,
  config,
  configVersion,
  day,
  slot,
  deadline,
  now = Date.now,
}) {
  // Starts are restricted to one-minute windows spaced five minutes apart.
  // Previous Cloud Function instances must have terminated (120s limit) before the next window.
  try {
    await store.setJSON(
      `ticks/${day}/${slot}`,
      { startedAt: now() },
      { onlyIfNew: true, cacheControl: null },
    )
  } catch (error) {
    if (error instanceof PreconditionFailedError) return { status: 'duplicate' }
    throw error
  }
  const completed = await store.get(`jobs/${day}/completed.json`, {
    type: 'json',
    consistency: 'strong',
  })
  if (completed) return { status: 'already-complete', generatedAt: completed.generatedAt }

  const active = await store.get('active-job.json', { type: 'json', consistency: 'strong' })
  const checkpointKey =
    active?.configVersion === configVersion &&
    /^jobs\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{24}\/checkpoint\.gz$/.test(active.key)
      ? active.key
      : `jobs/${day}/${configVersion}/checkpoint.gz`
  const published = await store.get('current.json', { type: 'json', consistency: 'strong' })
  if (published?.checkpointKey === checkpointKey) {
    await store.setJSON(
      `jobs/${day}/completed.json`,
      { generatedAt: published.generatedAt },
      { cacheControl: null },
    )
    await store.delete('active-job.json')
    await store.delete(checkpointKey)
    return { status: 'already-complete', generatedAt: published.generatedAt }
  }
  const saved = await store.get(checkpointKey, { type: 'arrayBuffer', consistency: 'strong' })
  let checkpoint = saved ? decodeCheckpoint(saved) : null
  if (!checkpoint) {
    checkpoint = {
      schemaVersion: 1,
      configVersion,
      keys: await source.list(),
      next: 0,
      state: null,
      startedAt: now(),
    }
    await store.set(checkpointKey, encodeCheckpoint(checkpoint), { cacheControl: null })
  }
  if (
    checkpoint.schemaVersion !== 1 ||
    checkpoint.configVersion !== configVersion ||
    !Array.isArray(checkpoint.keys) ||
    !Number.isInteger(checkpoint.next) ||
    checkpoint.next < 0 ||
    checkpoint.next > checkpoint.keys.length
  ) {
    throw new Error('Invalid ranking checkpoint')
  }
  await store.setJSON(
    'active-job.json',
    { key: checkpointKey, configVersion },
    { cacheControl: null },
  )
  const engine = createRankingEngine(...config, checkpoint.state)
  while (checkpoint.next < checkpoint.keys.length) {
    // Reserve time for a source request, checkpoint write and the final publish.
    if (deadline - now() < 20_000)
      return { status: 'pending', processed: checkpoint.next, records: checkpoint.keys.length }
    const keys = checkpoint.keys.slice(checkpoint.next, checkpoint.next + 64)
    const batches = []
    for (let offset = 0; offset < keys.length; offset += 16)
      batches.push(keys.slice(offset, offset + 16))
    const entries = (await Promise.all(batches.map((batch) => source.read(batch)))).flat()
    // Consume in sorted source-key order, independent of network completion order.
    for (const [, value] of entries) {
      const { document, order } = decodeRecord(value)
      engine.consume(document, order)
    }
    checkpoint.next += keys.length
    checkpoint.state = engine.exportState()
    await store.set(checkpointKey, encodeCheckpoint(checkpoint), { cacheControl: null })
  }
  // A publish can be retried from the complete checkpoint after an interrupted write.
  if (deadline - now() < 12_000)
    return { status: 'pending', processed: checkpoint.next, records: checkpoint.keys.length }
  const ranking = engine.finish(new Date(now()).toISOString())
  await publishRanking(store, ranking, checkpointKey)
  await store.setJSON(
    `jobs/${day}/completed.json`,
    { generatedAt: ranking.index.generatedAt },
    { cacheControl: null },
  )
  await store.delete('active-job.json')
  await store.delete(checkpointKey)
  return {
    status: 'published',
    records: checkpoint.keys.length,
    players: ranking.index.total.sampleSize,
    pools: ranking.index.pools.length,
    generatedAt: ranking.index.generatedAt,
  }
}

export async function previewRanking({ source, config, deadline, now = Date.now }) {
  const keys = await source.list()
  const engine = createRankingEngine(...config)
  for (let offset = 0; offset < keys.length; offset += 64) {
    if (deadline - now() < 15_000)
      throw new Error('Preview deadline exceeded; use the scheduled resumable job')
    const selected = keys.slice(offset, offset + 64)
    const batches = []
    for (let index = 0; index < selected.length; index += 16)
      batches.push(selected.slice(index, index + 16))
    for (const [, value] of (
      await Promise.all(batches.map((batch) => source.read(batch)))
    ).flat()) {
      const { document, order } = decodeRecord(value)
      engine.consume(document, order)
    }
  }
  const ranking = engine.finish(new Date(now()).toISOString())
  return {
    records: keys.length,
    players: ranking.index.total.sampleSize,
    pools: ranking.index.pools.length,
    ranking,
  }
}

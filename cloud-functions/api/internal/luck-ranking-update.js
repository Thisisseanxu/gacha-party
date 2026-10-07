import { verifyAdminToken } from '../../../edge-functions/_shared/admin-token.js'
import { rankingConfig, configVersion } from '../../_shared/luck-ranking-config.js'
import { createRankingSource } from '../../_shared/luck-ranking-source.js'
import { runRankingJob, previewRanking, scheduledSlot } from '../../_shared/luck-ranking-job.js'
import {
  cleanupRanking,
  getRankingStore,
  validateRanking,
} from '../../_shared/luck-ranking-storage.js'

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function onRequestPost({ request, env = {} }) {
  const startedAt = Date.now()
  const deadline = startedAt + 100_000
  let stage = 'configuration'
  try {
    const preview = new URL(request.url).searchParams.get('preview') === '1'
    if (preview) {
      if (!(await verifyAdminToken(request, env))) return json({ message: 'Unauthorized' }, 401)
      const source = createRankingSource(env, deadline)
      stage = 'preview'
      const result = await previewRanking({
        source,
        config: rankingConfig,
        deadline,
      })
      validateRanking(result.ranking)
      return json({ status: 'preview', durationMs: Date.now() - startedAt, ...result })
    }
    if (env.LUCK_RANKING_ENABLED !== 'true') return json({ status: 'disabled' })
    const slot = scheduledSlot(startedAt)
    if (!slot) return json({ message: 'Outside scheduled window' }, 403)
    const source = createRankingSource(env, deadline)
    const store = getRankingStore(env)
    stage = 'job'
    const result = await runRankingJob({
      store,
      source,
      config: rankingConfig,
      configVersion,
      ...slot,
      deadline,
    })
    // Cleanup failure must never turn a successful publication into a failed task.
    if (result.status === 'published' && deadline - Date.now() > 15_000) {
      await cleanupRanking(store).catch(() => console.warn('Luck ranking cleanup deferred'))
    }
    console.info(
      JSON.stringify({
        event: 'luck-ranking-update',
        ...result,
        durationMs: Date.now() - startedAt,
      }),
    )
    return json(
      { ...result, durationMs: Date.now() - startedAt },
      result.status === 'pending' ? 202 : 200,
    )
  } catch {
    console.error(
      JSON.stringify({
        event: 'luck-ranking-update-failed',
        stage,
        durationMs: Date.now() - startedAt,
      }),
    )
    return json(
      { message: 'Ranking update failed; the current published ranking remains available' },
      503,
    )
  }
}

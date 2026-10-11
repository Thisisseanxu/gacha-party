import { verifyAdminToken } from '../../edge-functions/_shared/admin-token.js'
import { rankingConfig, configVersion } from './luck-ranking-config.js'
import { createRankingSource } from './luck-ranking-source.js'
import { runRankingJob, previewRanking, automaticTick } from './luck-ranking-job.js'
import { cleanupRanking, getRankingStore, validateRanking } from './luck-ranking-storage.js'

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

export function createRankingUpdateHandler({
  manual = false,
  now = Date.now,
  createSource = createRankingSource,
  getStore = getRankingStore,
  config = rankingConfig,
  version = configVersion,
} = {}) {
  return async function handleRankingUpdate({ request, env = {} }) {
    const startedAt = now()
    const deadline = startedAt + 100_000
    let stage = 'configuration'
    try {
      const preview = new URL(request.url).searchParams.get('preview') === '1'
      if ((manual || preview) && !(await verifyAdminToken(request, env)))
        return json({ message: 'Unauthorized' }, 401)
      if (preview) {
        const source = createSource(env, deadline)
        stage = 'preview'
        const result = await previewRanking({ source, config, deadline, now })
        validateRanking(result.ranking)
        return json({ status: 'preview', durationMs: now() - startedAt, ...result })
      }
      // The switch controls automatic updates. Authenticated manual publication
      // remains available at any time, including while automatic updates are off.
      if (!manual && env.LUCK_RANKING_ENABLED !== 'true') return json({ status: 'disabled' })
      const source = createSource(env, deadline)
      stage = 'storage'
      const store = getStore(env)
      stage = 'job'
      const result = await runRankingJob({
        store,
        source,
        config,
        configVersion: version,
        ...automaticTick(startedAt),
        manual,
        deadline,
        now,
      })
      if (result.status === 'published' && deadline - now() > 15_000) {
        await cleanupRanking(store, now()).catch(() =>
          console.warn('Luck ranking cleanup deferred'),
        )
      }
      console.info(
        JSON.stringify({
          event: 'luck-ranking-update',
          mode: manual ? 'manual' : 'automatic',
          ...result,
          durationMs: now() - startedAt,
        }),
      )
      const status = result.status === 'busy' ? 409 : result.status === 'pending' ? 202 : 200
      const headers =
        result.status === 'busy' ? { 'Retry-After': String(result.retryAfterSeconds) } : {}
      return json({ ...result, durationMs: now() - startedAt }, status, headers)
    } catch {
      console.error(
        JSON.stringify({
          event: 'luck-ranking-update-failed',
          mode: manual ? 'manual' : 'automatic',
          stage,
          durationMs: now() - startedAt,
        }),
      )
      return json(
        { message: 'Ranking update failed; the current published ranking remains available' },
        503,
      )
    }
  }
}

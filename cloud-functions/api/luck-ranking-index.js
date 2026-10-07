import { getRankingStore, readRanking, seedRanking } from '../_shared/luck-ranking-storage.js'

export async function onRequestGet({ request, env = {} }) {
  if (
    !['/data/luck-ranking.json', '/api/luck-ranking-index'].includes(new URL(request.url).pathname)
  ) {
    return new Response(null, { status: 404 })
  }
  let result
  try {
    result = await readRanking(getRankingStore(env))
  } catch {
    result = { status: 200, body: seedRanking.index, source: 'seed' }
  }
  return new Response(JSON.stringify(result.body || { message: 'Ranking unavailable' }), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Luck-Ranking-Source': result.source || 'unavailable',
    },
  })
}

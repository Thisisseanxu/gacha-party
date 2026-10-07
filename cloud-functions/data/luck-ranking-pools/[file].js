import { getRankingStore, readRanking, seedRanking } from '../../_shared/luck-ranking-storage.js'

export async function onRequestGet({ request, env = {} }) {
  const url = new URL(request.url)
  const match = /^\/data\/luck-ranking-pools\/([A-Za-z0-9_-]+)\.json$/.exec(url.pathname)
  if (!match) return new Response(null, { status: 404 })
  const version = url.searchParams.get('v')
  let result
  try {
    result = await readRanking(getRankingStore(env), match[1], version)
  } catch {
    const body =
      (!version || version === seedRanking.index.generatedAt) && seedRanking.details[match[1]]
    result = body ? { status: 200, body, source: 'seed' } : { status: 503 }
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

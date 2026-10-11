import {
  getRankingStore,
  readRankingBundle,
  readSeedBundle,
} from '../_shared/luck-ranking-storage.js'

export function createRankingBundleHandler({ getStore = getRankingStore } = {}) {
  return async function ({ request, env = {} }) {
    if (new URL(request.url).pathname !== '/api/luck-ranking-bundle') {
      return new Response(null, { status: 404 })
    }
    const ifNoneMatch = request.headers.get('If-None-Match')
    let result
    let store
    try {
      store = getStore(env)
    } catch {
      // Allows the bundled seed to be viewed in development without a Blob identity.
      result = readSeedBundle(ifNoneMatch)
    }
    try {
      result ||= await readRankingBundle(store, ifNoneMatch)
    } catch {
      return Response.json(
        { message: 'Ranking unavailable' },
        {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        },
      )
    }
    const headers = {
      'Cache-Control': 'private, max-age=0, must-revalidate',
      ETag: result.etag,
      'X-Luck-Ranking-Source': result.source,
    }
    if (result.status === 304) return new Response(null, { status: 304, headers })
    // Fetch decodes this HTTP gzip representation before response.json() runs.
    return new Response(result.body, {
      headers: {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
      },
    })
  }
}

export const onRequestGet = createRankingBundleHandler()

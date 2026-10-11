import { normalizeLuckRankingBundle } from './luckRankingData.js'

export const LUCK_RANKING_BUNDLE_URL = '/api/luck-ranking-bundle'
export const LUCK_RANKING_CACHE_KEY = 'gacha-party-luck-ranking-bundle-cache-v1'
export const LUCK_RANKING_REFRESH_MS = 60 * 60 * 1000

export function createLuckRankingClient({
  fetcher = (...args) => fetch(...args),
  storage = () => window.localStorage,
  now = Date.now,
} = {}) {
  let snapshot = null
  let inFlight = null

  function getCached() {
    try {
      const cached = JSON.parse(storage()?.getItem(LUCK_RANKING_CACHE_KEY) || 'null')
      if (
        cached &&
        Number.isFinite(cached.checkedAt) &&
        cached.checkedAt > 0 &&
        cached.checkedAt <= now() &&
        (!snapshot || cached.checkedAt > snapshot.checkedAt)
      ) {
        snapshot = { ...cached, normalized: normalizeLuckRankingBundle(cached.data) }
      }
    } catch {
      // Unavailable or invalid persistent storage does not replace a valid memory snapshot.
    }
    return snapshot
  }

  function saveSnapshot(next) {
    snapshot = next
    try {
      const { data, etag, checkedAt } = next
      storage()?.setItem(LUCK_RANKING_CACHE_KEY, JSON.stringify({ data, etag, checkedAt }))
    } catch {
      // Keep the complete snapshot in memory when local storage is full or disabled.
    }
    return snapshot
  }

  async function refresh() {
    const cached = getCached()
    const elapsed = now() - (cached?.checkedAt || 0)
    if (cached && elapsed >= 0 && elapsed < LUCK_RANKING_REFRESH_MS) return cached
    const headers = { Accept: 'application/json' }
    if (cached?.etag) headers['If-None-Match'] = cached.etag
    const response = await fetcher(LUCK_RANKING_BUNDLE_URL, { cache: 'no-cache', headers })
    if (response.status === 304) {
      if (!cached?.etag) throw new Error('没有可复用的排行榜缓存')
      return saveSnapshot({ ...cached, checkedAt: now() })
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    // The browser decompresses Content-Encoding: gzip; no JavaScript codec is required.
    const data = await response.json()
    const normalized = normalizeLuckRankingBundle(data)
    return saveSnapshot({ data, normalized, etag: response.headers.get('ETag'), checkedAt: now() })
  }

  function load() {
    if (!inFlight)
      inFlight = refresh().finally(() => {
        inFlight = null
      })
    return inFlight
  }

  return { getCached, load }
}

import { PreconditionFailedError } from '@edgeone/pages-blob'

const MINUTE_MS = 60_000
// Cover the platform's 120-second hard timeout, with a margin for startup/clock skew.
const RESERVATION_MS = 150_000

export async function withRankingLock(store, run, now = Date.now) {
  const startedAt = now()
  const first = Math.floor(startedAt / MINUTE_MS)
  const last = Math.floor((startedAt + RESERVATION_MS) / MINUTE_MS)
  const expiresAt = (last + 1) * MINUTE_MS
  const acquired = []
  try {
    // Every overlapping execution must claim at least one common minute. Immutable
    // reservations avoid racing to delete/replace an expired shared lease.
    for (let minute = first; minute <= last; minute++) {
      const day = new Date(minute * MINUTE_MS).toISOString().slice(0, 10)
      const key = `locks/${day}/${minute}.json`
      try {
        await store.setJSON(key, { expiresAt }, { onlyIfNew: true, cacheControl: null })
        acquired.push(key)
      } catch (error) {
        if (!(error instanceof PreconditionFailedError)) throw error
        const reservation = await store.get(key, { type: 'json', consistency: 'strong' })
        return {
          status: 'busy',
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(((reservation?.expiresAt || expiresAt) - now()) / 1000),
          ),
        }
      }
    }
    return await run()
  } finally {
    // A hard timeout may skip this block. Its reservations stop blocking new runs
    // once their minutes are in the past, without an unsafe stale-lock takeover.
    await Promise.all(
      acquired.map((key) =>
        store.delete(key).catch(() => console.warn('Luck ranking lock cleanup deferred')),
      ),
    )
  }
}

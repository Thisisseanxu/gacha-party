import { signSourceRequest } from '../../lib/luck-ranking/source-auth.js'

async function boundedJson(response) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Empty source response')
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 4 * 1024 * 1024) throw new Error('Source response too large')
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
}

export function createRankingSource(env, deadline, fetcher = fetch) {
  const url = new URL(env.LUCK_RANKING_SOURCE_URL || '')
  if (
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) ||
    url.username ||
    url.password ||
    url.hash ||
    url.search ||
    url.pathname !== '/api/internal/luck-ranking-source'
  ) {
    throw new Error('Invalid LUCK_RANKING_SOURCE_URL')
  }
  if (
    typeof env.LUCK_RANKING_SOURCE_SECRET !== 'string' ||
    env.LUCK_RANKING_SOURCE_SECRET.length < 32
  ) {
    throw new Error('LUCK_RANKING_SOURCE_SECRET must have at least 32 characters')
  }
  async function call(input) {
    const body = JSON.stringify(input)
    for (let attempt = 0; attempt < 3; attempt++) {
      const remaining = deadline - Date.now()
      if (remaining < 1000) throw new Error('Ranking source deadline exceeded')
      try {
        const response = await fetcher(url, {
          method: 'POST',
          body,
          headers: await signSourceRequest(url, body, env.LUCK_RANKING_SOURCE_SECRET),
          signal: AbortSignal.timeout(Math.min(15_000, remaining)),
        })
        if (response.status === 413 && input.operation === 'read' && input.keys.length > 1) {
          await response.body?.cancel()
          const middle = Math.ceil(input.keys.length / 2)
          const first = await call({ ...input, keys: input.keys.slice(0, middle) })
          const second = await call({ ...input, keys: input.keys.slice(middle) })
          return { entries: [...first.entries, ...second.entries] }
        }
        if (!response.ok) {
          await response.body?.cancel()
          const error = new Error(`Ranking source HTTP ${response.status}`)
          error.retryable = [429, 500, 502, 503, 504].includes(response.status)
          throw error
        }
        return await boundedJson(response)
      } catch (error) {
        if (attempt === 2 || error.retryable === false) throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
  return {
    async list() {
      const keys = new Set()
      const cursors = new Set()
      let cursor = null
      while (true) {
        const page = await call({ operation: 'list', ...(cursor ? { cursor } : {}) })
        if (!Array.isArray(page.keys) || page.keys.some((key) => !/^record_\d{7}$/.test(key)))
          throw new Error('Invalid source key list')
        for (const key of page.keys) keys.add(key)
        if (keys.size > 100_000) throw new Error('Ranking source exceeds scan limit')
        if (page.complete) break
        if (typeof page.cursor !== 'string' || !page.cursor || cursors.has(page.cursor))
          throw new Error('Invalid source cursor')
        cursor = page.cursor
        cursors.add(cursor)
      }
      if (!keys.size) throw new Error('No source records')
      return [...keys].sort()
    },
    async read(keys) {
      const result = await call({ operation: 'read', keys })
      if (!Array.isArray(result.entries) || result.entries.length !== keys.length)
        throw new Error('Incomplete source batch')
      const entries = new Map(result.entries)
      if (entries.size !== keys.length || keys.some((key) => typeof entries.get(key) !== 'string'))
        throw new Error('Invalid source batch')
      return keys.map((key) => [key, entries.get(key)])
    },
  }
}

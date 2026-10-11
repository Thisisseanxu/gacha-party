import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { encodeRankingBundle, matchesRankingEtag } from '../lib/luck-ranking/bundle.js'

// Vite alone has no Cloud Functions; provide the same bundle contract using the local snapshot.
export function luckRankingDevPlugin(root) {
  return {
    name: 'luck-ranking-dev-bundle',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url, 'http://localhost').pathname
        if (/^\/data\/luck-ranking(?:\.json$|-pools\/)/.test(pathname)) {
          response.statusCode = 404
          response.end()
          return
        }
        if (pathname !== '/api/luck-ranking-bundle') return next()
        if (!['GET', 'HEAD'].includes(request.method)) {
          response.statusCode = 405
          response.end()
          return
        }
        try {
          const index = JSON.parse(
            await readFile(path.join(root, 'public/data/luck-ranking.json'), 'utf8'),
          )
          const details = Object.fromEntries(
            await Promise.all(
              index.pools.map(async ([id]) => {
                if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Invalid seed pool ID')
                return [
                  id,
                  JSON.parse(
                    await readFile(
                      path.join(root, `public/data/luck-ranking-pools/${id}.json`),
                      'utf8',
                    ),
                  ),
                ]
              }),
            ),
          )
          const { body, etag } = encodeRankingBundle({ index, details })
          response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
          response.setHeader('ETag', etag)
          response.setHeader('X-Luck-Ranking-Source', 'seed')
          if (matchesRankingEtag(request.headers['if-none-match'], etag)) {
            response.statusCode = 304
            response.end()
            return
          }
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Content-Encoding', 'gzip')
          response.end(request.method === 'HEAD' ? undefined : body)
        } catch {
          response.statusCode = 503
          response.end('Ranking unavailable')
        }
      })
    },
  }
}

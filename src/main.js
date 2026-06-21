import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { cardPoolsInOrder } from '@/data/cardPools.js'
import { CHAR_HUIZHANG_CONFIG } from '@/data/huizhang.js'
import { prepareAppData, initializeClientFeatures } from '@/appSetup.js'
import { routes, SPA_ONLY_PATHS } from '@/router.js'
import '@/styles/theme.css'

export const createApp = ViteSSG(
  App,
  { routes },
  async ({ router }) => {
    await prepareAppData()
    initializeClientFeatures(router)
  },
)

export function includedRoutes(paths) {
  const fixedRoutes = paths.filter(
    (path) =>
      !path.includes(':') &&
      !path.includes('*') &&
      !SPA_ONLY_PATHS.includes(path) &&
      path !== '/dev',
  )
  const poolRoutes = cardPoolsInOrder.map(([poolId]) => `/chouka/${poolId}`)
  const characterRoutes = Object.keys(CHAR_HUIZHANG_CONFIG).map(
    (charId) => `/huizhang/char/${charId}`,
  )

  return [...new Set([...fixedRoutes, '/chouka/custom', ...poolRoutes, ...characterRoutes])]
}

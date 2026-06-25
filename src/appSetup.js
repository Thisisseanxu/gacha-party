import { loadCards, setCards } from '@/data/cards.js'
import { initializeTheme } from '@/styles/theme.js'
import { installMobileQQShareSync } from '@/utils/qqShare.js'
import { syncClientShareMeta } from '@/utils/pageMeta.js'

async function loadCardsForBuild() {
  if (typeof process === 'undefined') return

  const { readFile } = await import('node:fs/promises')
  const raw = await readFile('public/data/cards.json', 'utf8')
  setCards(JSON.parse(raw))
}

export async function prepareAppData() {
  if (import.meta.env.SSR) {
    await loadCardsForBuild()
  }
}

export function initializeClientFeatures(router) {
  if (import.meta.env.SSR) return

  router?.beforeEach(async (route) => {
    if (route.matched.some((record) => record.meta.needsCards)) {
      await loadCards()
    }
  })

  router?.afterEach((route) => {
    syncClientShareMeta(route)
  })
  router?.isReady().then(() => {
    syncClientShareMeta(router.currentRoute.value)
  })

  initializeTheme()
  installMobileQQShareSync()
}

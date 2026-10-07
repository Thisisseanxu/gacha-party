import { rm } from 'node:fs/promises'

// EdgeOne prioritizes static resources over Node.js function routes.
await rm(new URL('../dist/data/luck-ranking.json', import.meta.url), { force: true })
await rm(new URL('../dist/data/luck-ranking-pools/', import.meta.url), {
  recursive: true,
  force: true,
})
console.log('排行榜 JSON 已交由 Cloud Functions 提供，静态构建不再覆盖这些路由。')

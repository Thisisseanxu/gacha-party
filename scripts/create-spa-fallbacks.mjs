import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve('dist')
const spaShell = path.join(dist, 'spa.html')
const spaRoutes = [
  '/test-gacha',
  '/fenxi/dev',
  '/quiz/dev',
  '/huizhang/edit',
  '/huizhang/admin',
]

for (const route of spaRoutes) {
  const directory = path.join(dist, route.slice(1))
  await mkdir(directory, { recursive: true })
  await copyFile(spaShell, path.join(directory, 'index.html'))
}

console.log(`已生成 ${spaRoutes.length} 个 SPA 路由空壳。`)

import { readFile, mkdir, writeFile } from 'node:fs/promises'
import {
  normalizeLuckRankingIndex,
  normalizeLuckRankingPoolData,
} from '../src/utils/luckRankingData.js'

const root = new URL('../', import.meta.url)
const index = JSON.parse(await readFile(new URL('public/data/luck-ranking.json', root), 'utf8'))
normalizeLuckRankingIndex(index)
const details = {}
for (const [id] of index.pools) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Invalid seed pool ID')
  details[id] = JSON.parse(
    await readFile(new URL(`public/data/luck-ranking-pools/${id}.json`, root), 'utf8'),
  )
  normalizeLuckRankingPoolData(details[id], id)
}
await mkdir(new URL('.generated/', root), { recursive: true })
await writeFile(
  new URL('.generated/luck-ranking-seed.json', root),
  JSON.stringify({ index, details }),
)
console.log(`已打包排行榜初始回退数据：${index.pools.length} 个卡池。`)

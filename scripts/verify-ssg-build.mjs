import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const dist = path.join(root, 'dist')

const fixedRoutes = [
  '/',
  '/about',
  '/chouka',
  '/chouka/custom',
  '/zidingyichouka',
  '/fenxi',
  '/daoyan',
  '/huizhang',
  '/fuke',
  '/quiz',
  '/zako',
]

const spaOnlyRoutes = [
  '/test-gacha',
  '/fenxi/dev',
  '/quiz/dev',
  '/huizhang/edit',
  '/huizhang/admin',
]

function routeFile(route) {
  return route === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.slice(1), 'index.html')
}

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

function extractIds(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1])
}

function count(html, pattern) {
  return [...html.matchAll(pattern)].length
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message)
}

const [poolSource, huizhangSource] = await Promise.all([
  readFile(path.join(root, 'src/data/cardPools.js'), 'utf8'),
  readFile(path.join(root, 'src/data/huizhang.js'), 'utf8'),
])

const poolIds = extractIds(poolSource, /^\s{4}["']([^"']+)["'],\r?\n\s{4}\{/gm)
const charConfigBlock = huizhangSource.slice(
  huizhangSource.indexOf('export const CHAR_HUIZHANG_CONFIG'),
  huizhangSource.indexOf('export const getCharConfig'),
)
const charIds = extractIds(charConfigBlock, /^\s{2}(\d+):\s*\{/gm)

const expectedRoutes = [
  ...fixedRoutes,
  ...poolIds.map((id) => `/chouka/${id}`),
  ...charIds.map((id) => `/huizhang/char/${id}`),
]

const errors = []

for (const route of expectedRoutes) {
  const file = routeFile(route)
  assert(await exists(file), `缺少预渲染文件：${route}`, errors)
  if (!(await exists(file))) continue

  const html = await readFile(file, 'utf8')
  assert(html.includes('data-server-rendered="true"'), `页面未完成 SSR：${route}`, errors)
  assert(count(html, /<title>[\s\S]*?<\/title>/g) === 1, `title 数量异常：${route}`, errors)
  assert(
    count(html, /<meta[^>]+itemprop="name"[^>]*>/g) === 1,
    `QQ name meta 数量异常：${route}`,
    errors,
  )
  assert(
    count(html, /<meta[^>]+itemprop="image"[^>]*>/g) === 1,
    `QQ image meta 数量异常：${route}`,
    errors,
  )
  assert(
    count(html, /<meta[^>]+property="og:title"[^>]*>/g) === 1,
    `og:title 数量异常：${route}`,
    errors,
  )
  assert(
    count(html, /<link[^>]+rel="canonical"[^>]*>/g) === 1,
    `canonical 数量异常：${route}`,
    errors,
  )
}

for (const route of spaOnlyRoutes) {
  const file = routeFile(route)
  assert(await exists(file), `缺少 SPA 路由空壳：${route}`, errors)
  if (!(await exists(file))) continue

  const html = await readFile(file, 'utf8')
  assert(!html.includes('data-server-rendered="true"'), `SPA 页面不应包含 SSR 内容：${route}`, errors)
  assert(
    /<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/.test(html),
    `SPA 页面缺少 noindex：${route}`,
    errors,
  )
}

const spaHtml = await readFile(path.join(dist, 'spa.html'), 'utf8')
assert(
  /<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/.test(spaHtml),
  'spa.html 缺少 noindex, nofollow',
  errors,
)
assert(!spaHtml.includes('data-server-rendered="true"'), 'spa.html 不应包含 SSR 内容', errors)

const samples = [
  ['quiz/index.html', '<title>角色性格匹配 | 织夜工具箱</title>'],
  ['chouka/137/index.html', '<title>霜汽补给卡池模拟 | 织夜工具箱</title>'],
  ['chouka/custom/index.html', '<title>自定义卡池模拟 | 织夜工具箱</title>'],
  ['huizhang/char/1111/index.html', '<title>小熊工程队徽章攻略 | 织夜工具箱</title>'],
]

for (const [relativeFile, expected] of samples) {
  const html = await readFile(path.join(dist, relativeFile), 'utf8')
  assert(html.includes(expected), `示例页面 meta 不正确：${relativeFile}`, errors)
}

if (errors.length) {
  console.error(`SSG 产物验证失败（${errors.length} 项）：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(
  `SSG 产物验证通过：${expectedRoutes.length} 个预渲染页面，${spaOnlyRoutes.length} 个 SPA 页面。`,
)

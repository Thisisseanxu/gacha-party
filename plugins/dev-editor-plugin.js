import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CARDS_FILE = resolve(ROOT, 'public/data/cards.json')
const CARD_POOLS_FILE = resolve(ROOT, 'public/data/card_pools_full.json')
const HUIZHANG_FILE = resolve(ROOT, 'public/data/huizhang.json')
const GACHA_POOLS_FILE = resolve(ROOT, 'public/data/gacha_pools.json')
const DATABASE_FILE = resolve(ROOT, 'public/data/gacha_info.json')
const ANNOUNCEMENTS_FILE = resolve(ROOT, 'public/data/announcements.json')
const CHARACTER_SCORES_FILE = resolve(ROOT, 'public/data/character_scores.json')

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

// ── cards.json ────────────────────────────────────────────────────────────────
function readCards() {
  const cards = readJson(CARDS_FILE)
  if (!Array.isArray(cards)) throw new Error('cards.json 格式错误')
  return cards
}

function buildCardData(data) {
  const orderedKeys = ['id', 'name', 'rarity', 'imageUrl', 'realname', 'theme', 'qban_url']
  const card = {}
  for (const key of orderedKeys) {
    if (data[key] != null) card[key] = String(data[key])
  }
  if (data.notInGame) card.notInGame = true
  return card
}

function writeCard(cardData) {
  const cards = readCards()
  const idx = cards.findIndex((card) => String(card.id) === String(cardData.id))
  const newCard = buildCardData(cardData)

  if (idx >= 0) cards[idx] = newCard
  else cards.push(newCard)
  writeJson(CARDS_FILE, cards)
}

// ── card_pools_full.json ──────────────────────────────────────────────────────
function readCardPoolsData() {
  const data = readJson(CARD_POOLS_FILE)
  const pools = Array.isArray(data) ? data : data?.pools
  if (!Array.isArray(pools)) {
    throw new Error('card_pools_full.json 格式错误：pools 必须是数组')
  }
  return { data, pools }
}

function readCardPools() {
  return readCardPoolsData().pools
}

function writeCardPool(poolId, poolData) {
  const { data, pools } = readCardPoolsData()
  const normalizedId = String(poolId)
  const idx = pools.findIndex(([id]) => String(id) === normalizedId)
  const entry = [normalizedId, poolData]

  if (idx >= 0) pools[idx] = entry
  else pools.unshift(entry)

  if (Array.isArray(data)) writeJson(CARD_POOLS_FILE, pools)
  else writeJson(CARD_POOLS_FILE, { ...data, pools })
}

// ── huizhang.json ─────────────────────────────────────────────────────────────
function readHuizhangData() {
  const data = readJson(HUIZHANG_FILE)
  if (!data?.charConfig || typeof data.charConfig !== 'object') {
    throw new Error('huizhang.json 格式错误：charConfig 必须是对象')
  }
  return data
}

function readHuizhang() {
  return readHuizhangData().charConfig
}

function writeHuizhang(charId, shapeValues) {
  if (!Array.isArray(shapeValues)) throw new Error('徽章形状必须是数组')

  const data = readHuizhangData()
  data.charConfig[String(charId)] = { shape: shapeValues }
  writeJson(HUIZHANG_FILE, data)
}

// ── character_scores.json ─────────────────────────────────────────────────────
function writeCharacterScores(characterName, scores, comment) {
  const data = readJson(CHARACTER_SCORES_FILE)
  if (!Array.isArray(data.characters)) throw new Error('character_scores.json 格式错误')

  const character = data.characters.find((item) => item['角色'] === characterName)
  if (!character) throw new Error(`未找到角色：${characterName}`)

  const dimensionNames = Object.values(data.dimensions || {}).map((axis) => axis.positive)
  for (const dimension of dimensionNames) {
    const value = Number(scores?.[dimension])
    if (!Number.isFinite(value)) throw new Error(`${dimension} 必须是数字`)
    if (value < data.scoring_scale.min || value > data.scoring_scale.max) {
      throw new Error(
        `${dimension} 必须在 ${data.scoring_scale.min} 至 ${data.scoring_scale.max} 之间`,
      )
    }
    character[dimension] = value
  }

  if (comment !== undefined) character['性格评语'] = String(comment)
  writeJson(CHARACTER_SCORES_FILE, data)
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let buf = ''
    req.on('data', (chunk) => (buf += chunk))
    req.on('end', () => {
      try {
        resolveBody(buf ? JSON.parse(buf) : null)
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function respond(res, data, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(data))
}

export function devEditorPlugin() {
  return {
    name: 'dev-editor',
    configureServer(server) {
      server.middlewares.use('/api/dev-editor', async (req, res) => {
        const url = req.url
        const method = req.method

        if (method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 204
          return res.end()
        }

        try {
          if (method === 'GET' && url === '/cards') return respond(res, readCards())
          if (method === 'PUT' && url === '/cards') {
            writeCard(await readBody(req))
            return respond(res, { ok: true })
          }

          if (method === 'GET' && url === '/cardpools') return respond(res, readCardPools())
          if (method === 'PUT' && url === '/cardpools') {
            const body = await readBody(req)
            writeCardPool(body.poolId, body.data)
            return respond(res, { ok: true })
          }

          if (method === 'GET' && url === '/huizhang') return respond(res, readHuizhang())
          if (method === 'PUT' && url === '/huizhang') {
            const body = await readBody(req)
            writeHuizhang(body.charId, body.shape)
            return respond(res, { ok: true })
          }

          if (method === 'GET' && url === '/gacha-pools') {
            return respond(res, readJson(GACHA_POOLS_FILE))
          }
          if (method === 'PUT' && url === '/gacha-pools') {
            writeJson(GACHA_POOLS_FILE, await readBody(req))
            return respond(res, { ok: true })
          }

          if (method === 'GET' && url === '/database36') {
            return respond(res, readJson(DATABASE_FILE))
          }
          if (method === 'PUT' && url === '/database36') {
            writeJson(DATABASE_FILE, await readBody(req))
            return respond(res, { ok: true })
          }

          if (method === 'GET' && url === '/announcements') {
            return respond(res, readJson(ANNOUNCEMENTS_FILE))
          }
          if (method === 'PUT' && url === '/announcements') {
            writeJson(ANNOUNCEMENTS_FILE, await readBody(req))
            return respond(res, { ok: true })
          }

          if (method === 'GET' && url === '/character-scores') {
            return respond(res, readJson(CHARACTER_SCORES_FILE))
          }
          if (method === 'PUT' && url === '/character-scores') {
            const body = await readBody(req)
            writeCharacterScores(body.character, body.scores, body.comment)
            return respond(res, { ok: true })
          }

          return respond(res, { error: '未知端点' }, 404)
        } catch (error) {
          console.error('[dev-editor]', error)
          return respond(res, { error: error.message }, 500)
        }
      })
    },
  }
}

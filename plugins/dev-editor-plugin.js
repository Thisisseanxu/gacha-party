import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

// recast 是 CJS 包，用 createRequire 在 ESM 中引入
const require = createRequire(import.meta.url)
const recast = require('recast')
const babelParser = require('recast/parsers/babel')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CARDS_FILE = resolve(ROOT, 'src/data/cards.js')
const CARD_POOLS_FILE = resolve(ROOT, 'src/data/cardPools.js')
const HUIZHANG_FILE = resolve(ROOT, 'src/data/huizhang.js')
const GACHA_POOLS_FILE = resolve(ROOT, 'public/data/gacha_pools.json')
const DATABASE_FILE = resolve(ROOT, 'public/data/database_36.json')

// ── 符号映射：AST Identifier/MemberExpression → JSON 值 ────────────────────
const SYMBOL_RESOLVE = {
  SP: 'SP',
  SSR: 'SSR',
  SR: 'SR',
  R: 'R',
  SP_BASE_RATE: 0.0125,
  'HUIZHANG_SHAPES.SHIELD': 'defence',
  'HUIZHANG_SHAPES.DIAMOND': 'attack',
  'HUIZHANG_SHAPES.CIRCLE': 'support',
  'THEMES.cake': 'cake',
  'THEMES.dream': 'dream',
  'THEMES.elec': 'elec',
  'THEMES.music': 'music',
  'THEMES.ice': 'ice',
  'THEMES.fire': 'fire',
  'THEMES.water': 'water',
  'THEMES.eiji': 'eiji',
}

const SHAPE_TO_PROP = { defence: 'SHIELD', attack: 'DIAMOND', support: 'CIRCLE' }
const THEME_KEYS = new Set(['cake', 'dream', 'elec', 'music', 'ice', 'fire', 'water', 'eiji'])
const RARITY_KEYS = new Set(['SP', 'SSR', 'SR', 'R'])

const b = recast.types.builders

// ── JSON 值 → AST 节点 ──────────────────────────────────────────────────────
function valueToAst(value) {
  if (value === null || value === undefined) return b.literal(null)
  if (typeof value === 'boolean') return b.literal(value)
  if (typeof value === 'number') {
    if (value === 0.0125) return b.identifier('SP_BASE_RATE')
    return b.literal(value)
  }
  if (typeof value === 'string') {
    if (RARITY_KEYS.has(value)) return b.identifier(value)
    if (SHAPE_TO_PROP[value]) {
      return b.memberExpression(b.identifier('HUIZHANG_SHAPES'), b.identifier(SHAPE_TO_PROP[value]))
    }
    if (THEME_KEYS.has(value)) {
      return b.memberExpression(b.identifier('THEMES'), b.identifier(value))
    }
    return b.literal(value)
  }
  if (Array.isArray(value)) return b.arrayExpression(value.map(valueToAst))
  if (typeof value === 'object') {
    const props = Object.entries(value).map(([k, v]) => {
      const isSymbolKey = RARITY_KEYS.has(k)
      const prop = b.property('init', b.identifier(k), valueToAst(v))
      if (isSymbolKey) prop.computed = true
      return prop
    })
    return b.objectExpression(props)
  }
  return b.literal(null)
}

// ── AST 节点 → JSON 值 ──────────────────────────────────────────────────────
function astToJson(node) {
  if (!node) return null
  const t = node.type
  if (t === 'StringLiteral' || t === 'Literal') return node.value
  if (t === 'NumericLiteral') return node.value
  if (t === 'BooleanLiteral') return node.value
  if (t === 'NullLiteral') return null
  if (t === 'Identifier') {
    return Object.prototype.hasOwnProperty.call(SYMBOL_RESOLVE, node.name)
      ? SYMBOL_RESOLVE[node.name]
      : node.name
  }
  if (t === 'MemberExpression') {
    const key = `${node.object.name}.${node.property.name}`
    return Object.prototype.hasOwnProperty.call(SYMBOL_RESOLVE, key) ? SYMBOL_RESOLVE[key] : key
  }
  if (t === 'UnaryExpression' && node.operator === '-') return -astToJson(node.argument)
  if (t === 'ArrayExpression') return (node.elements || []).map(astToJson)
  if (t === 'ObjectExpression') {
    const obj = {}
    for (const prop of node.properties) {
      if (prop.type === 'SpreadElement') continue
      let key
      if (prop.computed) {
        const raw = prop.key.name ?? prop.key.value
        key = Object.prototype.hasOwnProperty.call(SYMBOL_RESOLVE, raw) ? SYMBOL_RESOLVE[raw] : raw
      } else {
        key = prop.key.name ?? prop.key.value
      }
      obj[key] = astToJson(prop.value)
    }
    return obj
  }
  return null
}

// ── AST 工具 ─────────────────────────────────────────────────────────────────
function parseFile(filePath) {
  const src = readFileSync(filePath, 'utf8')
  return recast.parse(src, { parser: babelParser })
}

function findExportInit(ast, varName) {
  let target = null
  recast.visit(ast, {
    visitVariableDeclarator(path) {
      if (path.node.id.type === 'Identifier' && path.node.id.name === varName) {
        target = path.node.init
        this.abort()
        return
      }
      this.traverse(path)
    },
  })
  return target
}

// ── cards.js ─────────────────────────────────────────────────────────────────
function readCards() {
  const ast = parseFile(CARDS_FILE)
  const arr = findExportInit(ast, 'allCards')
  if (!arr) throw new Error('allCards 未找到')
  return arr.elements.map(astToJson)
}

function getCardId(elem) {
  const p = elem.properties?.find((p) => (p.key?.name ?? p.key?.value) === 'id')
  return p ? astToJson(p.value) : null
}

function writeCard(cardData) {
  const ast = parseFile(CARDS_FILE)
  const arr = findExportInit(ast, 'allCards')
  if (!arr) throw new Error('allCards 未找到')

  const idx = arr.elements.findIndex((el) => getCardId(el) === cardData.id)
  const newNode = buildCardNode(cardData)

  if (idx >= 0) {
    arr.elements[idx] = newNode
  } else {
    arr.elements.push(newNode)
  }
  writeFileSync(CARDS_FILE, recast.print(ast).code, 'utf8')
}

function buildCardNode(data) {
  const orderedKeys = ['id', 'name', 'rarity', 'imageUrl', 'realname', 'theme', 'qban_url']
  const props = []
  for (const key of orderedKeys) {
    if (data[key] != null) props.push(b.property('init', b.identifier(key), valueToAst(data[key])))
  }
  if (data.notInGame) props.push(b.property('init', b.identifier('notInGame'), b.literal(true)))
  return b.objectExpression(props)
}

// ── cardPools.js ──────────────────────────────────────────────────────────────
function readCardPools() {
  const ast = parseFile(CARD_POOLS_FILE)
  const obj = findExportInit(ast, 'cardPools')
  if (!obj) throw new Error('cardPools 未找到')
  const result = {}
  for (const prop of obj.properties) {
    result[prop.key.name ?? prop.key.value] = astToJson(prop.value)
  }
  return result
}

function writeCardPool(poolId, poolData) {
  const ast = parseFile(CARD_POOLS_FILE)
  const obj = findExportInit(ast, 'cardPools')
  if (!obj) throw new Error('cardPools 未找到')

  const existing = obj.properties.find((p) => (p.key.name ?? p.key.value) === poolId)
  if (existing) {
    existing.value = buildPoolNode(poolData)
  } else {
    const newProp = b.property('init', b.identifier(poolId), buildPoolNode(poolData))
    obj.properties.push(newProp)
  }
  writeFileSync(CARD_POOLS_FILE, recast.print(ast).code, 'utf8')
}

function buildPoolNode(data) {
  const fieldOrder = ['type', 'name', 'isAvailable', 'imageUrl', 'rates', 'rules', 'cardNames']
  const props = []
  for (const key of fieldOrder) {
    if (data[key] != null) {
      const val = key === 'isAvailable' ? b.literal(!!data[key]) : valueToAst(data[key])
      props.push(b.property('init', b.identifier(key), val))
    }
  }
  return b.objectExpression(props)
}

// ── huizhang.js ───────────────────────────────────────────────────────────────
function readHuizhang() {
  const ast = parseFile(HUIZHANG_FILE)
  const obj = findExportInit(ast, 'CHAR_HUIZHANG_CONFIG')
  if (!obj) throw new Error('CHAR_HUIZHANG_CONFIG 未找到')
  const result = {}
  for (const prop of obj.properties) {
    result[prop.key.name ?? prop.key.value] = astToJson(prop.value)
  }
  return result
}

function writeHuizhang(charId, shapeValues) {
  const ast = parseFile(HUIZHANG_FILE)
  const obj = findExportInit(ast, 'CHAR_HUIZHANG_CONFIG')
  if (!obj) throw new Error('CHAR_HUIZHANG_CONFIG 未找到')

  const newElements = shapeValues.map(valueToAst)
  const existing = obj.properties.find((p) => String(p.key.name ?? p.key.value) === String(charId))

  if (existing) {
    const shapeProp = existing.value.properties?.find(
      (p) => (p.key.name ?? p.key.value) === 'shape',
    )
    if (shapeProp) {
      // 保留第一个元素上的 leading 注释
      const firstComments = shapeProp.value.elements?.[0]?.comments
      shapeProp.value.elements = newElements
      if (firstComments?.length && newElements[0]) {
        newElements[0].comments = firstComments
      }
    }
  } else {
    const shapeProp = b.property('init', b.identifier('shape'), b.arrayExpression(newElements))
    const entryVal = b.objectExpression([shapeProp])
    const newProp = b.property('init', b.literal(Number(charId)), entryVal)
    obj.properties.push(newProp)
  }
  writeFileSync(HUIZHANG_FILE, recast.print(ast).code, 'utf8')
}

// ── JSON 文件 ─────────────────────────────────────────────────────────────────
function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

// ── HTTP 工具 ─────────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = ''
    req.on('data', (c) => (buf += c))
    req.on('end', () => {
      try {
        resolve(buf ? JSON.parse(buf) : null)
      } catch (e) {
        reject(e)
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

// ── 插件导出 ──────────────────────────────────────────────────────────────────
export function devEditorPlugin() {
  return {
    name: 'dev-editor',
    configureServer(server) {
      server.middlewares.use('/api/dev-editor', async (req, res) => {
        const url = req.url // Vite 已去掉 /api/dev-editor 前缀
        const method = req.method

        // 处理 CORS preflight
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

          if (method === 'GET' && url === '/gacha-pools')
            return respond(res, readJson(GACHA_POOLS_FILE))
          if (method === 'PUT' && url === '/gacha-pools') {
            writeJson(GACHA_POOLS_FILE, await readBody(req))
            return respond(res, { ok: true })
          }

          if (method === 'GET' && url === '/database36')
            return respond(res, readJson(DATABASE_FILE))
          if (method === 'PUT' && url === '/database36') {
            writeJson(DATABASE_FILE, await readBody(req))
            return respond(res, { ok: true })
          }

          respond(res, { error: '未知端点' }, 404)
        } catch (e) {
          console.error('[dev-editor]', e)
          respond(res, { error: e.message }, 500)
        }
      })
    },
  }
}

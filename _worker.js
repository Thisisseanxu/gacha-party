import { Hono } from 'hono'
import { cors } from 'hono/cors'
import nacl from 'tweetnacl'
import { Buffer } from 'buffer'
import pako from 'pako'

// const ALL_GACHA_IDS = ['9', '28', '29', '40', '41', '42', '43', '10000'] // 卡池列表
// const CARDPOOLS_NAME_MAP = {
//   9: '常驻扭蛋',
//   28: '新手扭蛋',
//   29: '车手盲盒机',
//   40: '塔菲扭蛋',
//   41: '童话国盲盒机',
//   42: '扭蛋大作战',
//   43: '早稻叽',
//   10000: '高级常驻扭蛋',
// }

// 频率限制配置 (单位：毫秒)
// 为了方便管理，将所有频率限制相关的配置统一放在这里。
const RATE_LIMITS = {
  // 手动上传记录 (/upload-record)
  manualUpload: {
    admin: 5 * 60 * 1000, // 管理员: 5分钟
    subscribed: 1 * 60 * 60 * 1000, // 订阅会员: 1小时
    normal: 12 * 60 * 60 * 1000, // 普通会员: 12小时
  },
  // 在线获取记录 (/start-update-task)
  onlineUpdate: {
    admin: 1 * 60 * 60 * 1000, // 管理员: 1小时
    subscribed: 24 * 60 * 60 * 1000, // 订阅会员: 24小时
    normal: 'unavailable', // 普通会员: 不可用
  },
}

// 定义 Durable Object 类
export class TaskRunner {
  constructor(state, env) {
    this.state = state
    this.env = env // 在内存中存储任务状态，避免频繁读写KV
    this.memoryState = {
      status: 'idle',
      progress: '尚未开始',
      error: null,
      result: null,
    }
    this.app = new Hono()
    // 定义 DO 内部的路由
    this.app.post('/start', async (c) => {
      if (this.memoryState.status === 'running' || this.memoryState.status === 'pending') {
        return c.json({ success: true, status: 'already_running' })
      }

      const { playerId } = await c.req.json()
      // 启动后台任务，但不等待它完成
      this.state.waitUntil(this.runUpdateTask(playerId))

      return c.json({ success: true, status: 'started' }, 202)
    })

    this.app.get('/status', (c) => {
      return c.json({ success: true, ...this.memoryState })
    })
  }

  // DO 的入口点
  async fetch(request) {
    return this.app.fetch(request)
  }

  /**
   * 实际执行增量更新的后台函数。
   */
  // async runUpdateTask(playerId) {
  //   this.memoryState = {
  //     status: 'pending',
  //     progress: '任务已创建，正在等待执行...',
  //     progress_percent: 0,
  //   }

  //   try {
  //     // 从 KV 读取现有数据
  //     const recordKvKey = `record_${playerId}`
  //     const compressedData = await this.env.GACHA_PARTY_RECORDS.get(recordKvKey)
  //     let playerGachaData = {}
  //     if (compressedData) {
  //       const gzipped = Buffer.from(compressedData, 'base64')
  //       const jsonString = pako.inflate(gzipped, { to: 'string' })
  //       playerGachaData = JSON.parse(jsonString)
  //     } else {
  //       playerGachaData = { version: 2, [playerId]: {} }
  //     }

  //     // 增量获取所有卡池
  //     const allNewRecords = {}
  //     let totalNewCount = 0

  //     for (const [index, gachaId] of ALL_GACHA_IDS.entries()) {
  //       // 更新内存中的状态
  //       this.memoryState.status = 'running'
  //       this.memoryState.progress = `( ${index + 1} / ${ALL_GACHA_IDS.length} ) 正在更新${CARDPOOLS_NAME_MAP[gachaId]}的数据...`

  //       const poolRecords = playerGachaData[playerId]?.[gachaId] || []
  //       const existingRecordSet = new Set(poolRecords.map((r) => r.id))

  //       const result = await fetchIncrementalRecordsForPool(
  //         playerId,
  //         gachaId,
  //         existingRecordSet,
  //         this.env,
  //       )

  //       if (result.error) {
  //         throw new Error(`获取卡池 ${gachaId} 数据时出错: ${result.error}`)
  //       }

  //       if (result.data.length > 0) {
  //         allNewRecords[gachaId] = result.data
  //         totalNewCount += result.data.length
  //         const combined = [...result.data, ...poolRecords]
  //         if (!playerGachaData[playerId]) playerGachaData[playerId] = {}
  //         playerGachaData[playerId][gachaId] = combined.sort((a, b) => b.created_at - a.created_at)
  //       }
  //     }

  //     // 如果没有错误，则将更新后的数据写回主记录KV
  //     const finalJsonString = JSON.stringify(playerGachaData)
  //     const compressedBytes = pako.gzip(finalJsonString)
  //     const finalBase64Payload = Buffer.from(compressedBytes).toString('base64')

  //     await this.env.GACHA_PARTY_RECORDS.put(recordKvKey, finalBase64Payload, {
  //       metadata: { lastCloudUpdated: Date.now(), lastUpdated: Date.now() },
  //     })

  //     // 更新最终任务状态为 "completed"
  //     this.memoryState.status = 'completed'
  //     this.memoryState.progress = `更新完成！共获取到 ${totalNewCount} 条新记录。`
  //     this.memoryState.result = { newRecords: allNewRecords }
  //   } catch (error) {
  //     // 发生错误时更新任务状态为 "failed"
  //     console.error(`玩家 ${playerId} 更新任务失败:`, error)
  //     this.memoryState.status = 'failed'
  //     this.memoryState.error = error.message
  //   }
  // }
}

const mainApp = new Hono()

// 增强的 CORS 配置，支持动态 localhost 端口
mainApp.use(
  '*',
  cors({
    origin: (origin) => {
      // 检查请求来源 (origin) 是否是允许的
      // 生产域名 (请务必替换为您自己的域名)
      const productionDomain = '.gacha-party.fans'
      const devDomain = '-gacha-party.thisisseanxu.workers.dev'

      // 使用 URL 对象来解析来源，这样更可靠
      try {
        const url = new URL(origin)

        // 允许 *.gacha-party.fans
        if (url.hostname.endsWith(productionDomain)) {
          return origin
        }

        // 允许 *.thisisseanxu.workers.dev
        if (url.hostname.endsWith(devDomain)) {
          return origin
        }

        // 允许任何来自 localhost 的端口
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return origin
        }
      } catch (e) {
        console.error('CORS origin parsing error:', e)
      }

      // 对于所有其他来源，返回 undefined，Hono 将不会发送 Access-Control-Allow-Origin 头
      return undefined
    },
  }),
)

/**
 * POST /start-update-task
 * 验证请求并将其转发给Durable Object以启动任务。
 */
mainApp.post('/start-update-task', async (c) => {
  try {
    const licenseKey = c.req.header('X-License-Key')
    const playerId = c.req.header('X-Player-Id')
    if (!licenseKey || !playerId) {
      return c.json({ success: false, message: '请求头中缺少 X-License-Key 或 X-Player-Id' }, 400)
    }

    // 验证激活码
    const { userId, isExpired } = await verifyLicenseForWorker(licenseKey, c.env.PUBLIC_KEY)
    const userIdStr = String(userId)
    if (!(playerId === userIdStr || (userIdStr.startsWith('33') && userIdStr.length === 9))) {
      return c.json({ success: false, message: '激活码与玩家ID不匹配。' }, 403)
    }

    // 检查查询频率限制
    const isAdmin = userIdStr.startsWith('33') && userIdStr.length === 9
    const recordKvKey = `record_${playerId}`
    const existingRecord = await c.env.GACHA_PARTY_RECORDS.getWithMetadata(recordKvKey)
    const lastUpdated = existingRecord?.metadata?.lastCloudUpdated
    const now = Date.now()

    let timeLimit
    if (isExpired) {
      // 必须是订阅用户才能在线获取
      return c.json({ success: false, message: '在线获取功能剩余时长不足。' }, 403)
    } else if (isAdmin) {
      timeLimit = RATE_LIMITS.onlineUpdate.admin
    } else {
      // 订阅会员
      timeLimit = RATE_LIMITS.onlineUpdate.subscribed
    }

    if (lastUpdated && now - lastUpdated < timeLimit) {
      const timeLeft = timeLimit - (now - lastUpdated)
      return c.json({ success: false, message: `更新过于频繁，请稍后再试。`, timeLeft }, 429)
    }
    // 获取Durable Object实例
    // 使用playerId作为DO的唯一标识符，确保每个玩家只有一个任务实例
    const doId = c.env.GACHA_TASKS.idFromName(playerId)
    const stub = c.env.GACHA_TASKS.get(doId)
    // 将请求转发给DO来启动任务
    const response = await stub.fetch(
      new Request(`https://do.task/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, licenseKey }),
      }),
    )
    const data = await response.json()

    return c.json(data)
  } catch (error) {
    console.error('启动任务失败:', error)
    return c.json({ success: false, message: `启动任务失败：${error.message}` }, 500)
  }
})

/**
 * GET /task-status/:playerId
 * 查询指定玩家任务的当前状态。
 */
mainApp.get('/task-status/:playerId', async (c) => {
  const playerId = c.req.param('playerId')
  if (!playerId) {
    return c.json({ success: false, message: '缺少玩家ID' }, 400)
  }

  // 获取与玩家ID对应的DO实例
  const doId = c.env.GACHA_TASKS.idFromName(playerId)
  const stub = c.env.GACHA_TASKS.get(doId)

  // 从DO获取状态
  const response = await stub.fetch(new Request(`https://do.task/status`))
  const data = await response.json()

  return c.json(data)
})

/**
 * 将 URL-safe Base64 字符串转换为标准的 Base64 字符串。
 * @param {string} base64url - URL-safe Base64 字符串。
 * @returns {string} 标准的 Base64 字符串。
 */
function base64UrlToStandard(base64url) {
  // 替换 URL-safe 字符为标准字符
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  // 根据需要补全 '=' 填充
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return base64 + padding
}

/**
 * 在 Worker 内部验证激活码的有效性。
 * @param {string} licenseKey - 从客户端传来的完整激活码。
 * @param {string} base64PublicKey - 从环境变量中获取的 Base64 编码的公钥。
 * @returns {Promise<{userId: number, isExpired: boolean}>} 返回包含用户ID和过期状态的对象。
 * @throws {Error} 如果验证失败，则抛出错误。
 */ async function verifyLicenseForWorker(licenseKey, base64PublicKey) {
  if (!base64PublicKey) {
    throw new Error('环境变量 PUBLIC_KEY 未设置。')
  }
  const derKey = Buffer.from(base64PublicKey, 'base64')
  const publicKey = derKey.subarray(derKey.length - 32)
  const standardBase64Key = base64UrlToStandard(licenseKey)
  const fullData = Buffer.from(standardBase64Key, 'base64')
  const signatureLength = 64
  if (fullData.length <= signatureLength) {
    throw new Error('激活码格式不正确，请检查客户端逻辑。')
  }
  const payload = fullData.subarray(0, fullData.length - signatureLength)
  const signature = fullData.subarray(fullData.length - signatureLength)
  // 使用公钥验证签名
  const isVerified = nacl.sign.detached.verify(payload, signature, publicKey)
  if (!isVerified) throw new Error('激活码签名验证失败。')
  const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  const userId = dataView.getUint32(0, true) // 小端序读取用户ID
  const expiryTimestamp = Number(dataView.getBigUint64(4, true)) // 小端序读取过期时间戳
  return { userId, isExpired: expiryTimestamp < Math.floor(Date.now() / 1000) }
}
/**
 * 为单个卡池从游戏API增量获取记录。
 * @param {string} playerId - 玩家ID。
 * @param {string} gachaId - 卡池ID。
 * @param {Set<number>} existingRecordSet - 已有记录的ID集合，用于快速查找。
 * @param {object} env - Worker 的环境变量。
 * @returns {Promise<{data: any[], error: string | null}>} 返回新获取的记录数组或错误信息。
 */
// async function fetchIncrementalRecordsForPool(playerId, gachaId, existingRecordSet, env) {
//   const newlyFetched = []
//   let page = 1
//   let keepFetching = true
//   const X_TOKEN_FORMAT = env.TOKEN_FORMAT
//   let reTryCount = 0
//   while (keepFetching) {
//     const url = new URL(env.BACKEND_URL)
//     url.search = new URLSearchParams({
//       player_id: playerId,
//       gacha_id: gachaId,
//       page: page,
//       page_size: 20,
//     }).toString()
//     const headers = {
//       Host: env.BACKEND_HOST,
//       'X-Token': X_TOKEN_FORMAT.replace('{}', playerId),
//       'User-Agent': env.API_USER_AGENT,
//       Accept: env.API_ACCEPT,
//     }
//     try {
//       const response = await fetch(url.toString(), { headers })
//       if (!response.ok) {
//         throw new Error(
//           `获取 ${gachaId} 卡池的第 ${page} 页出错： ${response.status} ${response.statusText}`,
//         )
//       }
//       const data = await response.json()
//       // 请求后稍作等待，避免请求过于频繁
//       await new Promise((res) => setTimeout(res, 1000))
//       const recordsOnPage = data?.data?.records || []
//       if (recordsOnPage.length === 0) {
//         keepFetching = false
//         break
//       }
//       const newRecordsThisPage = []
//       for (const record of recordsOnPage) {
//         if (existingRecordSet.has(record.id)) {
//           keepFetching = false
//           break
//         }
//         newRecordsThisPage.push({
//           id: record.id,
//           item_id: record.item_id,
//           created_at: record.created_at,
//           gacha_id: parseInt(gachaId, 10),
//         })
//       }
//       if (newRecordsThisPage.length > 0) {
//         newlyFetched.push(...newRecordsThisPage)
//       }
//       page++
//     } catch (e) {
//       if (reTryCount >= 3) {
//         return { data: [], error: `获取卡池 ${gachaId} 数据时发生错误： ${e.message}` }
//       }
//       reTryCount++
//       await new Promise((res) => setTimeout(res, reTryCount * 1000))
//       console.error(`${e.message}，开始重试，次数: ${reTryCount}`)
//     }
//   }
//   return { data: newlyFetched, error: null }
// }

mainApp.get('/get-record', async (c) => {
  try {
    const licenseKey = c.req.header('X-License-Key')
    const playerId = c.req.header('X-Player-Id')
    if (!licenseKey || !playerId) {
      return c.text('请求头中缺少 X-License-Key 或 X-Player-Id', 400)
    }
    const { userId } = await verifyLicenseForWorker(licenseKey, c.env.PUBLIC_KEY)
    const userIdStr = String(userId)
    if (!(playerId === userIdStr || (userIdStr.startsWith('33') && userIdStr.length === 9))) {
      return c.text('查询记录的玩家ID和激活码不匹配', 403)
    }
    const kvKey = `record_${playerId}`
    const value = await c.env.GACHA_PARTY_RECORDS.get(kvKey)
    if (value === null) {
      return c.text(`数据库中没有找到玩家ID ${playerId} 对应的记录`, 404)
    }
    return c.text(value)
  } catch (error) {
    return c.text(`验证失败： ${error.message}`, 403)
  }
})

mainApp.post('/upload-record', async (c) => {
  let jsonResponse = { message: '', timeLeft: 0 }
  try {
    const licenseKey = c.req.header('X-License-Key')
    if (!licenseKey) {
      jsonResponse.message = '请求头中缺少 X-License-Key'
      return c.json(jsonResponse, 400)
    }
    const { userId, isExpired } = await verifyLicenseForWorker(licenseKey, c.env.PUBLIC_KEY)
    const playerId = c.req.header('X-Player-Id')
    if (!playerId) {
      jsonResponse.message = '请求头中缺少 X-Player-Id'
      return c.json(jsonResponse, 400)
    }
    const userIdStr = String(userId)
    if (
      playerId &&
      !(playerId === userIdStr || (userIdStr.startsWith('33') && userIdStr.length === 9))
    ) {
      jsonResponse.message = '上传的抽卡记录不属于激活码对应的玩家！'
      return c.json(jsonResponse, 403)
    } // 获取请求体中的数据 (前端已处理好的Base64字符串)
    const payload = await c.req.text()
    if (!payload) {
      jsonResponse.message = '请求体为空，没有需要上传的数据'
      return c.json(jsonResponse, 400)
    } // 将数据存入KV
    const kvKey = `record_${playerId}`
    const existingRecord = await c.env.GACHA_PARTY_RECORDS.getWithMetadata(kvKey)
    if (existingRecord && existingRecord.metadata && existingRecord.metadata.lastUpdated) {
      const lastUpdated = existingRecord.metadata.lastUpdated
      const now = Date.now()
      const isAdmin = userIdStr.startsWith('33') && userIdStr.length === 9
      let writeTimeLimit
      if (isAdmin) {
        writeTimeLimit = RATE_LIMITS.manualUpload.admin
      } else if (isExpired) {
        writeTimeLimit = RATE_LIMITS.manualUpload.normal
      } else {
        writeTimeLimit = RATE_LIMITS.manualUpload.subscribed
      }
      // 如果上次更新时间在限制时间内，则拒绝写入
      if (now - lastUpdated < writeTimeLimit) {
        const timeLeft = writeTimeLimit - (now - lastUpdated)
        jsonResponse.message = `上传过于频繁！`
        jsonResponse.timeLeft = timeLeft
        return c.json(jsonResponse, 429)
      }
    }
    await c.env.GACHA_PARTY_RECORDS.put(kvKey, payload, {
      metadata: {
        lastUpdated: Date.now(),
        lastCloudUpdated: existingRecord?.metadata?.lastCloudUpdated || null,
      },
    })
    jsonResponse.message = '抽卡记录上传成功！'
    return c.json(jsonResponse, 200)
  } catch (error) {
    // 如果验证失败或发生其他错误，返回403 Forbidden
    jsonResponse.message = `验证失败： ${error.message}`
    return c.json(jsonResponse, 403)
  }
})

/**
 * POST /incremental-update
 * 接收本地保存的增量抽卡数据，与云端记录合并后更新。
 */
mainApp.post('/incremental-update', async (c) => {
  let jsonResponse = { message: '', timeLeft: 0 }
  try {
    // 验证和授权
    const licenseKey = c.req.header('X-License-Key')
    const playerId = c.req.header('X-Player-Id')
    if (!licenseKey || !playerId) {
      jsonResponse.message = '请求头中缺少 X-License-Key 或 X-Player-Id'
      return c.json(jsonResponse, 400)
    }

    const { userId, isExpired } = await verifyLicenseForWorker(licenseKey, c.env.PUBLIC_KEY)
    const userIdStr = String(userId)
    const isAdmin = userIdStr.startsWith('33') && userIdStr.length === 9

    if (!isAdmin && playerId !== userIdStr) {
      jsonResponse.message = '增量更新的抽卡记录不属于激活码对应的玩家！'
      return c.json(jsonResponse, 403)
    }

    // 频率限制 (与 /upload-record 共享)
    const kvKey = `record_${playerId}`
    const existingRecordMeta = await c.env.GACHA_PARTY_RECORDS.getWithMetadata(kvKey)
    if (
      existingRecordMeta &&
      existingRecordMeta.metadata &&
      existingRecordMeta.metadata.lastUpdated
    ) {
      const lastUpdated = existingRecordMeta.metadata.lastUpdated
      const now = Date.now()
      let writeTimeLimit
      if (isAdmin) {
        writeTimeLimit = RATE_LIMITS.manualUpload.admin
      } else if (isExpired) {
        writeTimeLimit = RATE_LIMITS.manualUpload.normal
      } else {
        writeTimeLimit = RATE_LIMITS.manualUpload.subscribed
      }

      if (now - lastUpdated < writeTimeLimit) {
        const timeLeft = writeTimeLimit - (now - lastUpdated)
        jsonResponse.message = `上传过于频繁！`
        jsonResponse.timeLeft = timeLeft
        return c.json(jsonResponse, 429)
      }
    }

    // 获取并解析请求体
    const body = await c.req.json()
    const { fixUpload = false, data: compressedNewData } = body
    if (!compressedNewData) {
      jsonResponse.message = '请求体中缺少增量数据 (data)'
      return c.json(jsonResponse, 400)
    }

    // 获取并解压现有数据
    let finalData = { version: 2, [playerId]: {} }
    if (existingRecordMeta.value) {
      const gzipped = Buffer.from(existingRecordMeta.value, 'base64')
      const jsonString = pako.inflate(gzipped, { to: 'string' })
      finalData = JSON.parse(jsonString)
    }

    // 解压新数据
    let newData
    try {
      const gzippedNew = Buffer.from(compressedNewData, 'base64')
      const jsonStringNew = pako.inflate(gzippedNew, { to: 'string' })
      newData = JSON.parse(jsonStringNew)
    } catch (error) {
      jsonResponse.message = '上传的数据格式无效，无法解压或解析。' + error.message
      return c.json(jsonResponse, 400)
    }

    // 合并与去重
    const newRecordsByPool = newData[playerId] || {}
    const existingIdsByPool = {}
    if (finalData[playerId]) {
      for (const gachaId in finalData[playerId]) {
        existingIdsByPool[gachaId] = new Set(finalData[playerId][gachaId].map((r) => r.id))
      }
    }

    let totalAddedCount = 0

    for (const gachaId in newRecordsByPool) {
      const newRecords = newRecordsByPool[gachaId]
      if (!Array.isArray(newRecords)) continue

      const existingIds = existingIdsByPool[gachaId] || new Set()
      const recordsToAdd = []
      let discardPool = false

      for (const newRecord of newRecords) {
        // 校验记录的基本结构
        if (typeof newRecord.id === 'undefined' || typeof newRecord.created_at === 'undefined') {
          continue
        }

        if (existingIds.has(newRecord.id)) {
          if (fixUpload) {
            // fixUpload模式: 跳过此重复条目
            continue
          } else {
            // 普通模式: 发现重复，抛弃整个卡池的更新
            discardPool = true
            break
          }
        }
        recordsToAdd.push(newRecord)
      }

      if (!discardPool && recordsToAdd.length > 0) {
        if (!finalData[playerId]) finalData[playerId] = {}
        if (!finalData[playerId][gachaId]) finalData[playerId][gachaId] = []

        const combined = [...finalData[playerId][gachaId], ...recordsToAdd]
        finalData[playerId][gachaId] = combined.sort((a, b) => b.created_at - a.created_at)
        totalAddedCount += recordsToAdd.length
      }
    }

    // 写回KV
    const finalJsonString = JSON.stringify(finalData)
    const compressedBytes = pako.gzip(finalJsonString)
    const finalBase64Payload = Buffer.from(compressedBytes).toString('base64')

    await c.env.GACHA_PARTY_RECORDS.put(kvKey, finalBase64Payload, {
      metadata: {
        lastUpdated: Date.now(),
        lastCloudUpdated: existingRecordMeta?.metadata?.lastCloudUpdated || null,
      },
    })

    jsonResponse.message = `增量更新成功！新增 ${totalAddedCount} 条记录。`
    return c.json(jsonResponse, 200)
  } catch (error) {
    console.error('增量更新失败:', error)
    jsonResponse.message = `处理失败： ${error.message}`
    return c.json(jsonResponse, error instanceof SyntaxError ? 400 : 500)
  }
})

export default {
  /**
   * Worker 的主入口 fetch 函数
   * @param {Request} request - 收到的请求
   * @param {object} env - 环境变量
   * @param {object} ctx - 执行上下文
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 检查是否是 API 请求。如果是，则由 Hono 应用处理。
    // 这里列出您所有的 API 路径前缀。
    const isApiRequest =
      url.pathname.startsWith('/start-update-task') ||
      url.pathname.startsWith('/task-status/') ||
      url.pathname.startsWith('/get-record') ||
      url.pathname.startsWith('/upload-record') ||
      url.pathname.startsWith('/incremental-update')

    if (isApiRequest) {
      // 将 API 请求交给 Hono 处理
      return mainApp.fetch(request, env, ctx)
    }

    // --- 新增逻辑：处理前端静态资源 ---
    try {
      // 默认处理为静态资源请求，从 Cloudflare Pages 的存储中获取文件
      // `env.ASSETS` 是 Cloudflare Pages 提供的，用于访问部署的静态文件
      const assetResponse = await env.ASSETS.fetch(request)

      // 创建一个可修改的响应副本
      const newResponse = new Response(assetResponse.body, assetResponse)

      const path = url.pathname

      // 关键：为 HTML 和 JS 文件设置严格的无缓存策略
      // 这会告诉浏览器和 Cloudflare 都不要缓存这些文件
      if (path.endsWith('.html') || path === '/' || path.endsWith('.js')) {
        newResponse.headers.set(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        )
        newResponse.headers.set('Pragma', 'no-cache') // 兼容旧版 HTTP/1.0
        newResponse.headers.set('Expires', '0') // 代理服务器缓存策略
      } else {
        // 对于其他资源 (如 CSS, 图片), 我们可以让它们被缓存以提高性能
        // 这里设置为缓存一天
        newResponse.headers.set('Cache-Control', 'public, max-age=86400')
      }

      return newResponse
    } catch (e) {
      // 如果找不到资源，对于单页应用(SPA)，我们应该返回 index.html
      // 这样可以确保客户端路由正常工作
      try {
        console.warn(`资源未找到: ${url.pathname}, 错误: ${e.message}`)
        const indexResponse = await env.ASSETS.fetch(
          new Request(new URL('/', request.url), request),
        )
        const newIndexResponse = new Response(indexResponse.body, indexResponse)

        // 同样，为回退的 index.html 设置无缓存策略
        newIndexResponse.headers.set(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        )
        return newIndexResponse
      } catch (err) {
        return new Response(err.message, { status: 404 })
      }
    }
  },

  // 保留您已有的 Durable Object 导出和 scheduled 导出
  scheduled: (event, env, ctx) => {
    ctx.waitUntil(Promise.resolve())
  },
}

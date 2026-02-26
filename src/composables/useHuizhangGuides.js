import { ref, readonly } from 'vue'
import { decodeStrategy } from '@/utils/huizhangCode.js'

// localStorage 缓存键
const LS_KEY_DATA = 'hz_guide_data'
const LS_KEY_VERSION = 'hz_guide_version'
const LS_KEY_LAST_CHECK = 'hz_guide_last_check'

// 4小时缓存有效期
const CACHE_TTL_MS = 4 * 60 * 60 * 1000

// 模块级单例状态，多组件共享
const _guides = ref([])
const _version = ref('0')
const _loading = ref(false)
const _error = ref(null)
let _initPromise = null

/**
 * 获取 Worker 基础 URL（开发环境用 8787 端口，生产环境同源）
 */
function getWorkerBase() {
  const url = new URL(window.location.href)
  const isDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  return isDev ? `${url.protocol}//${url.hostname}:8787` : url.origin
}

/**
 * 安全解码攻略代码，失败返回 null
 */
function safeDecodeStrategy(code) {
  try {
    return decodeStrategy(code)
  } catch {
    return null
  }
}

/**
 * 将原始 D1 guide 对象格式化为前端使用的统一格式
 */
function formatGuide(g) {
  return {
    id: g.id,
    charId: g.char_id,
    code: g.code,
    title: g.title || '',
    authorName: g.author_name || '',
    userId: g.user_id,
    isFeatured: Boolean(g.is_featured),
    createdAt: g.created_at,
    approvedAt: g.approved_at,
    data: safeDecodeStrategy(g.code),
  }
}

/**
 * 从 localStorage 加载缓存数据
 * @returns {boolean} 是否成功加载
 */
function loadFromCache() {
  try {
    const raw = localStorage.getItem(LS_KEY_DATA)
    const ver = localStorage.getItem(LS_KEY_VERSION)
    if (raw && ver) {
      _guides.value = JSON.parse(raw)
      _version.value = ver
      return true
    }
  } catch {
    // 忽略 JSON 解析错误
  }
  return false
}

/**
 * 将攻略数据保存到 localStorage
 */
function saveToCache(guides, version) {
  try {
    localStorage.setItem(LS_KEY_DATA, JSON.stringify(guides))
    localStorage.setItem(LS_KEY_VERSION, version)
    localStorage.setItem(LS_KEY_LAST_CHECK, String(Date.now()))
  } catch {
    // 忽略存储配额错误
  }
}

/**
 * 仅获取当前版本号（轻量请求）
 */
async function fetchVersion() {
  const base = getWorkerBase()
  const res = await fetch(`${base}/api/hz/version`)
  if (!res.ok) throw new Error(`version 请求失败: ${res.status}`)
  return res.json()
}

/**
 * 获取全量攻略数据
 */
async function fetchAllGuides() {
  const base = getWorkerBase()
  const res = await fetch(`${base}/api/hz/guides`)
  if (!res.ok) throw new Error(`guides 请求失败: ${res.status}`)
  return res.json()
}

/**
 * 内部初始化逻辑
 */
async function _doInit(forceFullRefresh) {
  _loading.value = true
  _error.value = null

  try {
    const lastCheck = parseInt(localStorage.getItem(LS_KEY_LAST_CHECK) || '0')
    const now = Date.now()
    const hasCachedData = loadFromCache()

    if (forceFullRefresh || !hasCachedData) {
      // 无缓存或强制刷新：全量拉取
      const result = await fetchAllGuides()
      _guides.value = result.guides || []
      _version.value = result.version || '0'
      saveToCache(_guides.value, _version.value)
      return
    }

    if (now - lastCheck < CACHE_TTL_MS) {
      // 缓存未过期，直接使用（数据已在 loadFromCache 中加载）
      return
    }

    // 缓存过期：先更新检查时间戳，再轻量检查版本
    localStorage.setItem(LS_KEY_LAST_CHECK, String(now))

    let versionData
    try {
      versionData = await fetchVersion()
    } catch (e) {
      // 网络失败：保留现有缓存，不报错
      console.warn('[useHuizhangGuides] 版本检查失败，使用本地缓存:', e.message)
      return
    }

    if (versionData.version === _version.value) {
      // 版本相同，缓存仍然有效
      return
    }

    // 版本不同：全量刷新
    try {
      const result = await fetchAllGuides()
      _guides.value = result.guides || []
      _version.value = result.version || '0'
      saveToCache(_guides.value, _version.value)
    } catch (e) {
      console.warn('[useHuizhangGuides] 全量拉取失败，使用旧缓存:', e.message)
    }
  } catch (e) {
    _error.value = e.message
    // 降级：保留已加载的缓存数据
  } finally {
    _loading.value = false
  }
}

/**
 * 初始化（幂等，多次调用共享同一 Promise）
 */
async function init(forceFullRefresh = false) {
  if (_initPromise && !forceFullRefresh) return _initPromise
  _initPromise = _doInit(forceFullRefresh)
  return _initPromise
}

/**
 * 强制绕过缓存重新拉取
 */
async function forceRefresh() {
  _initPromise = null
  return init(true)
}

/**
 * 攻略数据 Composable
 */
export function useHuizhangGuides() {
  return {
    /** 原始攻略数组（只读） */
    guides: readonly(_guides),
    /** 当前版本号（只读） */
    version: readonly(_version),
    /** 加载状态（只读） */
    loading: readonly(_loading),
    /** 错误信息（只读） */
    error: readonly(_error),

    /**
     * 初始化攻略数据（在 onMounted 中调用）
     * @param {boolean} [forceFullRefresh=false] 是否强制全量刷新
     */
    init,

    /**
     * 强制重新拉取所有数据（绕过缓存）
     */
    forceRefresh,

    /**
     * 获取指定角色的所有攻略（已解码）
     * @param {string} charId
     * @returns {{ id, charId, code, title, authorName, userId, isFeatured, createdAt, approvedAt, data }[]}
     */
    getGuidesForChar(charId) {
      return _guides.value.filter((g) => g.char_id === String(charId)).map(formatGuide)
    },

    /**
     * 获取所有精选攻略（is_featured = 1）
     * @returns {{ id, charId, code, title, authorName, userId, isFeatured, createdAt, approvedAt, data }[]}
     */
    getFeaturedGuides() {
      return _guides.value.filter((g) => g.is_featured).map(formatGuide)
    },

    /**
     * 获取 Worker 基础 URL（供其他地方直接 fetch 用）
     */
    getWorkerBase,
  }
}

const ANNOUNCEMENTS_URL = import.meta.env.DEV
  ? '/data/announcements.json'
  : 'https://mhpd.fans/data/announcements.json'
const CACHE_KEY = 'mhpd_announcements_cache_v1'
const SHOWN_KEY = 'mhpd_announcements_shown_v1'
const CACHE_TTL = 30 * 60 * 1000
const ALREADY_STARTED = -Infinity
const NEVER_ENDS = Infinity
let latestAnnouncementIds = new Set()

function parseDate(value, fallback) {
  if (!value) return fallback
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? fallback : time
}

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.announcements)) return data.announcements
  if (data?.title || data?.content) return [data]
  return []
}

function getAnnouncementId(announcement) {
  return String(announcement?.id || '').trim()
}

function cleanShownAnnouncements(shown, validIds = latestAnnouncementIds) {
  const next = {}
  let changed = false

  for (const [key, value] of Object.entries(shown || {})) {
    const id = String(key || '').split('|')[0].trim()
    if (!id || (validIds?.size && !validIds.has(id))) {
      changed = true
      continue
    }
    if (next[id] !== value) changed = true
    next[id] = value
  }

  if (Object.keys(next).length !== Object.keys(shown || {}).length) changed = true
  return { shown: next, changed }
}

function normalizeAnnouncement(announcement) {
  return {
    ...announcement,
    title: announcement?.title || '',
    content: announcement?.content || '',
    startDate: announcement?.startDate || '',
    endDate: announcement?.endDate || '',
    enabled: announcement?.enabled !== false,
    showEveryOpen: Boolean(announcement?.showEveryOpen),
    miniProgramOnly: Boolean(announcement?.miniProgramOnly),
    webOnly: Boolean(announcement?.webOnly),
  }
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures; announcements are non-critical UI.
  }
}

async function loadAnnouncements() {
  const now = Date.now()
  const cached = loadJson(CACHE_KEY, null)

  if (!import.meta.env.DEV && cached?.fetchedAt && now - cached.fetchedAt < CACHE_TTL) {
    return normalizeList(cached.data)
  }

  try {
    const res = await fetch(`${ANNOUNCEMENTS_URL}?t=${now}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    saveJson(CACHE_KEY, { fetchedAt: now, data })
    return normalizeList(data)
  } catch {
    return normalizeList(cached?.data)
  }
}

export async function getActiveWebAnnouncements() {
  const announcements = (await loadAnnouncements()).map(normalizeAnnouncement)
  latestAnnouncementIds = new Set(announcements.map(getAnnouncementId).filter(Boolean))
  const cleaned = cleanShownAnnouncements(loadJson(SHOWN_KEY, {}), latestAnnouncementIds)
  if (cleaned.changed) saveJson(SHOWN_KEY, cleaned.shown)
  const now = Date.now()

  return announcements
    .filter((announcement) => {
      if (!announcement.enabled) return false
      if (announcement.miniProgramOnly) return false
      if (parseDate(announcement.startDate, ALREADY_STARTED) > now) return false
      if (parseDate(announcement.endDate, NEVER_ENDS) < now) return false
      if (announcement.showEveryOpen) return true

      const id = getAnnouncementId(announcement)
      return Boolean(id) && !cleaned.shown[id]
    })
    .map((announcement) => ({
      ...announcement,
      key: getAnnouncementId(announcement),
      showEveryOpen: Boolean(announcement.showEveryOpen),
    }))
}

export function markWebAnnouncementShown(announcement) {
  if (!announcement || announcement.showEveryOpen) return
  const id = getAnnouncementId(announcement.key ? { id: announcement.key } : announcement)
  if (!id) return
  const cleaned = cleanShownAnnouncements(loadJson(SHOWN_KEY, {}))
  cleaned.shown[id] = Date.now()
  saveJson(SHOWN_KEY, cleaned.shown)
}

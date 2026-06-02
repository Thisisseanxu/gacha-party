const ANNOUNCEMENTS_URL = import.meta.env.DEV
  ? '/data/announcements.json'
  : 'https://mhpd.fans/data/announcements.json'
const CACHE_KEY = 'mhpd_announcements_cache_v1'
const SHOWN_KEY = 'mhpd_announcements_shown_v1'
const CACHE_TTL = 30 * 60 * 1000
const ALREADY_STARTED = -Infinity
const NEVER_ENDS = Infinity

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

function getAnnouncementKey(announcement) {
  return [
    announcement.id || '',
    announcement.title || '',
    announcement.startDate || '',
    announcement.endDate || '',
    announcement.content || '',
  ].join('|')
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
  const announcements = await loadAnnouncements()
  const shown = loadJson(SHOWN_KEY, {})
  const now = Date.now()

  return announcements
    .map(normalizeAnnouncement)
    .filter((announcement) => {
      if (!announcement.enabled) return false
      if (announcement.miniProgramOnly) return false
      if (parseDate(announcement.startDate, ALREADY_STARTED) > now) return false
      if (parseDate(announcement.endDate, NEVER_ENDS) < now) return false
      if (announcement.showEveryOpen) return true

      return !shown[getAnnouncementKey(announcement)]
    })
    .map((announcement) => ({
      ...announcement,
      key: getAnnouncementKey(announcement),
      showEveryOpen: Boolean(announcement.showEveryOpen),
    }))
}

export function markWebAnnouncementShown(announcement) {
  if (!announcement || announcement.showEveryOpen) return
  const shown = loadJson(SHOWN_KEY, {})
  shown[announcement.key || getAnnouncementKey(announcement)] = Date.now()
  saveJson(SHOWN_KEY, shown)
}

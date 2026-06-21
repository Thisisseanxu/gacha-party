import { ref, watch } from 'vue'

export const THEME_STORAGE_KEY = 'app_theme'
export const currentTheme = ref('dark')

function normalizeTheme(theme) {
  return theme === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme)
  currentTheme.value = normalizedTheme

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = normalizedTheme
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme)
  }
}

export function initializeTheme() {
  if (typeof document === 'undefined') return

  const initialTheme = normalizeTheme(
    document.documentElement.dataset.theme ||
      (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_STORAGE_KEY)),
  )
  applyTheme(initialTheme)
}

export function toggleTheme() {
  applyTheme(currentTheme.value === 'light' ? 'dark' : 'light')
}

watch(currentTheme, (theme) => {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme !== theme) {
    document.documentElement.dataset.theme = theme
  }
})

const CAMEL_CASE_BOUNDARY = /([a-z0-9])([A-Z])/g

export function themeToken(path) {
  const token = path
    .replace(/^colors\./, '')
    .replace(/^colorOfLuck\./, 'luck.')
    .replace(CAMEL_CASE_BOUNDARY, '$1-$2')
    .replaceAll('.', '-')
    .toLowerCase()
  return `--color-${token}`
}

export function themeVar(path, fallback) {
  const variable = themeToken(path)
  return fallback ? `var(${variable}, ${fallback})` : `var(${variable})`
}

export function resolveThemeColor(path, fallback = '') {
  if (typeof document === 'undefined') return fallback

  const value = getComputedStyle(document.documentElement).getPropertyValue(themeToken(path)).trim()
  return value || fallback
}

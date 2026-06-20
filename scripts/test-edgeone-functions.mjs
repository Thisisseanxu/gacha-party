/* global Buffer, process */
import { createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const baseUrl = process.env.EDGEONE_TEST_BASE_URL || 'http://localhost:8788'

function parseEnv(source) {
  const result = {}
  for (const line of source.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
    if (!match) continue
    result[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return result
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function createAdminToken(secret) {
  const now = Date.now()
  const payload = base64Url(
    JSON.stringify({
      userId: '330000001',
      iat: now,
      exp: now + 5 * 60 * 1000,
    }),
  )
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

let requestQueue = Promise.resolve()

function request(path, options = {}) {
  const task = async () => {
    const startedAt = Date.now()
    const expected = options.expected || [200]
    let lastResult

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          ...options,
          signal: AbortSignal.timeout(45_000),
        })
        const text = await response.text()
        lastResult = {
          name: options.name || `${options.method || 'GET'} ${path}`,
          status: response.status,
          expected,
          durationMs: Date.now() - startedAt,
          attempts: attempt,
          body: text.slice(0, 160),
          ok: expected.includes(response.status),
        }
        if (lastResult.ok || ![500, 502, 503].includes(response.status)) return lastResult
      } catch (error) {
        lastResult = {
          name: options.name || `${options.method || 'GET'} ${path}`,
          status: 'ERROR',
          expected,
          durationMs: Date.now() - startedAt,
          attempts: attempt,
          body: error.message,
          ok: false,
        }
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    }

    return lastResult
  }

  const result = requestQueue.then(task)
  requestQueue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

const env = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'))
if (!env.ADMIN_SECRET) throw new Error('.env 缺少 ADMIN_SECRET')
const adminHeaders = {
  Authorization: `Bearer ${createAdminToken(env.ADMIN_SECRET)}`,
}

const tests = [
  request('/', { expected: [200] }),
  request('/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    expected: [400],
  }),
  request('/get-record', { expected: [400] }),
  request('/upload-record', { method: 'POST', expected: [400] }),
  request('/api/hz/version', { expected: [200] }),
  request('/api/hz/guides', { expected: [200] }),
  request('/api/hz/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    expected: [401],
  }),
  request('/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    expected: [400],
  }),
  request('/api/hz/admin/bootstrap', { headers: adminHeaders, expected: [200] }),
  request('/api/hz/admin/pending', { headers: adminHeaders, expected: [200] }),
  request('/api/hz/admin/save-all', { method: 'POST', expected: [401] }),
  request('/api/hz/admin/guide/test', { method: 'PATCH', expected: [401] }),
  request('/api/hz/admin/guide/test', { method: 'DELETE', expected: [401] }),
  request('/api/hz/admin/guide/test/feature', { method: 'PATCH', expected: [401] }),
  request('/api/gacha/admin/keys?prefix=record_&limit=2', {
    headers: adminHeaders,
    expected: [200],
  }),
  request('/api/gacha/admin/download', {
    method: 'POST',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchId: 'smoke-test', keys: ['__edgeone_missing_smoke_test__'] }),
    expected: [200],
  }),
  request('/api/gacha/admin/download?key=__edgeone_missing_smoke_test__', {
    headers: adminHeaders,
    expected: [404],
  }),
  request('/api/gacha/admin/export', { expected: [401] }),
  request('/api/gacha/admin/export?prefix=codex_smoke_nonexistent_', {
    headers: adminHeaders,
    expected: [200],
  }),
]

const results = await Promise.all(tests)
console.table(
  results.map(({ name, status, expected, durationMs, attempts, ok }) => ({
    name,
    status,
    expected: expected.join('|'),
    durationMs,
    attempts,
    ok,
  })),
)

const failures = results.filter((result) => !result.ok)
if (failures.length) {
  for (const failure of failures) {
    console.error(`${failure.name}: ${failure.status} ${failure.body}`)
  }
  process.exitCode = 1
}

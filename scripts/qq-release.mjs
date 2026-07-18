import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const PRIVATE_DIRECTORY = resolve('.qqbot')
const CONFIG_FILE = resolve(PRIVATE_DIRECTORY, 'release-config.json')
const STATE_FILE = resolve(PRIVATE_DIRECTORY, 'release-state.json')
const VERSION_COMMIT_RE = /^docs(?:\([^)]*\))?!?:\s*更新补丁版本号v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\s*$/
const CONVENTIONAL_PREFIX_RE = /^[A-Za-z]+(?:\([^)]*\))?!?:\s*/

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function loadPrivateConfig() {
  if (!existsSync(CONFIG_FILE)) {
    throw new Error(`缺少私有配置文件：${CONFIG_FILE}`)
  }
  let config
  try {
    config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'))
  } catch (error) {
    throw new Error(`无法读取 ${CONFIG_FILE}：${error.message}`)
  }
  const required = ['groupId', 'sshHost', 'sshKey', 'remoteCommand']
  const missing = required.filter((key) => typeof config[key] !== 'string' || !config[key].trim())
  if (missing.length) throw new Error(`私有配置缺少字段：${missing.join(', ')}`)
  return Object.fromEntries(required.map((key) => [key, config[key].trim()]))
}

function loadBaseCommit() {
  if (!existsSync(STATE_FILE)) return null
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
    if (typeof state.lastCommit !== 'string' || !state.lastCommit) {
      throw new Error('lastCommit 缺失')
    }
    return state.lastCommit
  } catch (error) {
    throw new Error(`无法读取 ${STATE_FILE}：${error.message}`)
  }
}

function collectRelease(baseCommit) {
  const headCommit = git('rev-parse', 'main')
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', baseCommit, headCommit])
  if (ancestor.status !== 0) {
    throw new Error(`基线提交 ${baseCommit} 不是 main 的祖先，请检查或删除 ${STATE_FILE}`)
  }

  const raw = git('log', '--reverse', '--format=%H%x1f%s%x1e', `${baseCommit}..${headCommit}`)
  const commits = raw
    ? raw.split('\x1e').map((record) => record.trim()).filter(Boolean).map((record) => {
        const separator = record.indexOf('\x1f')
        return { sha: record.slice(0, separator), subject: record.slice(separator + 1).trim() }
      })
    : []

  if (commits.length === 0) {
    return { baseCommit, headCommit, commits, updates: [], version: null, content: null }
  }

  let version = null
  const updates = []
  for (const commit of commits) {
    const versionMatch = commit.subject.match(VERSION_COMMIT_RE)
    if (versionMatch) {
      version = versionMatch[1]
      continue
    }
    const summary = commit.subject.replace(CONVENTIONAL_PREFIX_RE, '').trim()
    if (summary) updates.push({ ...commit, summary })
  }
  if (!version) {
    throw new Error('新增提交中没有找到“docs: 更新补丁版本号v...”提交，无法确定版本号')
  }
  if (updates.length === 0) {
    throw new Error('除版本号提交外没有可发送的更新内容')
  }

  const content = `织夜工具箱v${version}更新\n${updates.map(({ summary }) => `- ${summary}`).join('\n')}`
  return { baseCommit, headCommit, commits, updates, version, content }
}

function saveState(headCommit, version) {
  mkdirSync(PRIVATE_DIRECTORY, { recursive: true })
  const temporary = `${STATE_FILE}.tmp`
  writeFileSync(
    temporary,
    `${JSON.stringify({ lastCommit: headCommit, lastVersion: version, sentAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  )
  renameSync(temporary, STATE_FILE)
}

function initializeState(headCommit) {
  mkdirSync(PRIVATE_DIRECTORY, { recursive: true })
  const temporary = `${STATE_FILE}.tmp`
  writeFileSync(
    temporary,
    `${JSON.stringify({ lastCommit: headCommit, initializedAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  )
  renameSync(temporary, STATE_FILE)
}

async function confirmSend() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false
  const { createInterface } = await import('node:readline/promises')
  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await prompt.question('\n确认发送到 QQ 群？输入 y 发送：')
  prompt.close()
  return /^y(?:es)?$/i.test(answer.trim())
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const assumeYes = process.argv.includes('--yes')
  const config = loadPrivateConfig()
  const baseCommit = loadBaseCommit()
  if (!baseCommit) {
    const headCommit = git('rev-parse', 'main')
    if (dryRun) {
      console.log(`尚未建立发送基线。首次正常运行将以 main 最新提交 ${headCommit} 为基线。`)
      console.log('待发送 commit：0（--dry-run 未写入状态）')
    } else {
      initializeState(headCommit)
      console.log(`已使用 main 最新提交 ${headCommit} 建立初始基线。`)
      console.log('待发送 commit：0，未发送消息。')
    }
    return
  }
  const release = collectRelease(baseCommit)

  if (!release.content) {
    console.log('main 分支没有尚未发送的新提交。')
    return
  }

  console.log(`检测到 ${release.commits.length} 个 commit，其中 ${release.updates.length} 个更新项。`)
  console.log(`版本：${release.version}`)
  console.log('\n发送预览：\n')
  console.log(release.content)
  if (dryRun) {
    console.log('\n当前为 --dry-run，未发送且未更新发送记录。')
    return
  }

  const confirmed = assumeYes || (await confirmSend())
  if (!confirmed) {
    console.log('\n已取消，未发送。若在非交互环境运行，请显式添加 --yes。')
    return
  }

  const payload = JSON.stringify({ content: release.content, group_ids: [config.groupId], at_all: false })
  const result = spawnSync(
    'ssh',
    ['-i', config.sshKey, '-o', 'BatchMode=yes', config.sshHost, config.remoteCommand],
    { input: payload, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  )
  if (result.status !== 0) {
    throw new Error(`服务器发送失败：${(result.stderr || result.stdout).trim()}`)
  }
  saveState(release.headCommit, release.version)
  console.log(`\n发送成功，服务器响应：${result.stdout.trim()}`)
}

main().catch((error) => {
  console.error(`\nQQ 更新推送失败：${error.message}`)
  process.exitCode = 1
})

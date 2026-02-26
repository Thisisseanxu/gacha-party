<template>
  <div class="page-container">
    <!-- 登录界面 -->
    <div v-if="!isAuthenticated" class="login-wrap">
      <div class="login-card">
        <h2 class="login-title">徽章攻略管理</h2>
        <p class="login-sub">输入管理员密码以继续</p>
        <div class="form-row">
          <label class="form-label">管理员密码</label>
          <input
            type="password"
            v-model="password"
            class="form-input"
            placeholder="••••••••"
            @keyup.enter="handleLogin"
            autocomplete="current-password"
          />
        </div>
        <div v-if="loginError" class="feedback-msg error-msg">{{ loginError }}</div>
        <button class="primary-btn full-btn" @click="handleLogin" :disabled="loginLoading">
          {{ loginLoading ? '验证中…' : '登录' }}
        </button>
      </div>
    </div>

    <!-- 管理面板 -->
    <div v-else class="admin-wrap">
      <div class="admin-header">
        <h1 class="admin-title">徽章攻略管理</h1>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: currentTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'pending' && totalPending > 0" class="tab-badge">
            {{ totalPending }}
          </span>
        </button>
      </div>

      <!-- Tab 内容：待审核 -->
      <div v-if="currentTab === 'pending'" class="tab-content">
        <div v-if="pendingLoading" class="loading-msg">加载中…</div>
        <div v-else-if="pendingItems.length === 0" class="empty-msg">暂无待审核攻略</div>
        <div v-else>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>角色ID</th>
                  <th>标题</th>
                  <th>作者</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in pendingItems" :key="item.id">
                  <td class="td-id">#{{ item.id }}</td>
                  <td>{{ item.char_id }}</td>
                  <td class="td-title">{{ item.title || '（无标题）' }}</td>
                  <td>{{ item.author_name || '—' }}</td>
                  <td class="td-time">{{ formatTime(item.submitted_at) }}</td>
                  <td class="td-actions">
                    <button class="action-btn info-btn" @click="openPreview(item)">预览</button>
                    <button class="action-btn approve-btn" @click="approveItem(item.id)">通过</button>
                    <button class="action-btn danger-btn" @click="rejectItem(item.id)">拒绝</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <button
              class="page-btn"
              :disabled="pendingPage <= 1"
              @click="loadPending(pendingPage - 1)"
            >← 上一页</button>
            <span class="page-info">第 {{ pendingPage }} 页 / 共 {{ Math.ceil(totalPending / 20) }} 页（{{ totalPending }} 条）</span>
            <button
              class="page-btn"
              :disabled="pendingPage * 20 >= totalPending"
              @click="loadPending(pendingPage + 1)"
            >下一页 →</button>
          </div>
        </div>
      </div>

      <!-- Tab 内容：已发布 -->
      <div v-if="currentTab === 'approved'" class="tab-content">
        <div v-if="approvedLoading" class="loading-msg">加载中…</div>
        <div v-else-if="approvedItems.length === 0" class="empty-msg">暂无已发布攻略</div>
        <div v-else>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>角色ID</th>
                  <th>标题</th>
                  <th>作者</th>
                  <th>精选</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in approvedItems" :key="item.id">
                  <td class="td-id">#{{ item.id }}</td>
                  <td>{{ item.char_id }}</td>
                  <td class="td-title">{{ item.title || '（无标题）' }}</td>
                  <td>{{ item.author_name || '—' }}</td>
                  <td>
                    <span class="featured-tag" :class="{ active: item.is_featured }">
                      {{ item.is_featured ? '✦ 精选' : '—' }}
                    </span>
                  </td>
                  <td class="td-actions">
                    <button
                      class="action-btn"
                      :class="item.is_featured ? 'warn-btn' : 'approve-btn'"
                      @click="toggleFeature(item)"
                    >
                      {{ item.is_featured ? '取消精选' : '设为精选' }}
                    </button>
                    <button
                      class="action-btn danger-btn"
                      @click="confirmDeleteGuide(item.id)"
                    >删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <button
              class="page-btn"
              :disabled="approvedPage <= 1"
              @click="loadApproved(approvedPage - 1)"
            >← 上一页</button>
            <span class="page-info">第 {{ approvedPage }} 页 / 共 {{ Math.ceil(totalApproved / 20) }} 页（{{ totalApproved }} 条）</span>
            <button
              class="page-btn"
              :disabled="approvedPage * 20 >= totalApproved"
              @click="loadApproved(approvedPage + 1)"
            >下一页 →</button>
          </div>
        </div>
      </div>

      <!-- Tab 内容：封禁管理 -->
      <div v-if="currentTab === 'bans'" class="tab-content">
        <!-- 封禁新用户 -->
        <div class="ban-form-card">
          <h3 class="ban-form-title">封禁玩家</h3>
          <div class="ban-inputs">
            <input
              v-model="banUserId"
              class="form-input ban-id-input"
              placeholder="玩家ID（数字）"
              inputmode="numeric"
            />
            <input
              v-model="banReason"
              class="form-input ban-reason-input"
              placeholder="封禁原因（可选）"
            />
            <button class="action-btn danger-btn ban-submit-btn" :disabled="!banUserId.trim() || banLoading" @click="banUser">
              {{ banLoading ? '处理中…' : '封禁' }}
            </button>
          </div>
        </div>

        <!-- 封禁列表 -->
        <div v-if="bansLoading" class="loading-msg">加载中…</div>
        <div v-else-if="banItems.length === 0" class="empty-msg">暂无封禁记录</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>玩家ID</th>
                <th>封禁时间</th>
                <th>原因</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in banItems" :key="item.user_id">
                <td class="td-id">{{ item.user_id }}</td>
                <td class="td-time">{{ formatTime(item.banned_at) }}</td>
                <td class="td-title">{{ item.reason || '—' }}</td>
                <td class="td-actions">
                  <button class="action-btn approve-btn" @click="unbanUser(item.user_id)">解封</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 内容：迁移静态数据 -->
      <div v-if="currentTab === 'seed'" class="tab-content">
        <div class="seed-warn">
          <strong>⚠ 注意：</strong>此操作将把静态攻略文件中的所有数据批量导入数据库，
          <strong>仅应执行一次</strong>。重复执行将产生重复数据。
        </div>
        <div v-if="seedDone" class="feedback-msg success-msg seed-result">
          ✓ {{ seedResult }}
        </div>
        <div v-if="seedError" class="feedback-msg error-msg">{{ seedError }}</div>
        <button
          class="primary-btn"
          :disabled="seedLoading || seedDone"
          @click="handleSeed"
        >
          {{ seedDone ? '已完成' : seedLoading ? '迁移中…' : '开始迁移静态数据' }}
        </button>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <div v-if="previewItem" class="overlay" @click.self="previewItem = null">
      <div class="preview-dialog">
        <div class="preview-header">
          <span>攻略预览 — 角色 {{ previewItem.char_id }}</span>
          <button class="close-btn" @click="previewItem = null">✕</button>
        </div>
        <div class="preview-meta">
          <span>标题：{{ previewItem.title || '（无标题）' }}</span>
          <span>作者：{{ previewItem.author_name || '—' }}</span>
        </div>
        <HuizhangPreviewImage
          v-if="previewItem && previewStrategy"
          :strategy="previewStrategy"
          :charConfig="getCharConfig(previewItem.char_id)"
        />
        <p v-else class="preview-error">无法解析攻略代码</p>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="confirmState" class="overlay" @click.self="confirmState = null">
      <div class="confirm-dialog">
        <p class="confirm-msg">{{ confirmState.message }}</p>
        <div class="confirm-actions">
          <button
            class="primary-btn danger-primary"
            @click="() => { confirmState.onConfirm(); confirmState = null }"
          >确认</button>
          <button class="cancel-btn" @click="confirmState = null">取消</button>
        </div>
      </div>
    </div>

    <!-- 操作反馈 Toast -->
    <div v-if="toastMsg" class="toast" :class="toastType">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { colors } from '@/styles/colors.js'
import { getCharConfig } from '@/data/huizhang.js'
import { decodeStrategy } from '@/utils/huizhangCode.js'
import { useHuizhangGuides } from '@/composables/useHuizhangGuides.js'
import HuizhangPreviewImage from '@/components/HuizhangPreviewImage.vue'

const { getWorkerBase } = useHuizhangGuides()

// ── 登录态 ────────────────────────────────────────────────
const isAuthenticated = ref(false)
const password = ref('')
const loginError = ref('')
const loginLoading = ref(false)

function getToken() {
  return sessionStorage.getItem('hz_admin_token') || ''
}

function isTokenValid(token) {
  if (!token) return false
  try {
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx === -1) return false
    const payloadB64 = token.slice(0, dotIdx)
    const padded =
      payloadB64.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const { exp } = JSON.parse(atob(padded))
    return Date.now() < exp
  } catch {
    return false
  }
}

async function handleLogin() {
  loginError.value = ''
  if (!password.value) {
    loginError.value = '请输入密码'
    return
  }
  loginLoading.value = true
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    })
    const data = await res.json()
    if (!res.ok) {
      loginError.value = data.message || '登录失败'
    } else {
      sessionStorage.setItem('hz_admin_token', data.token)
      isAuthenticated.value = true
      password.value = ''
      loadPending()
    }
  } catch {
    loginError.value = '网络错误，请检查连接'
  } finally {
    loginLoading.value = false
  }
}

function handleLogout() {
  sessionStorage.removeItem('hz_admin_token')
  isAuthenticated.value = false
}

// ── Tab 管理 ──────────────────────────────────────────────
const tabs = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已发布' },
  { key: 'bans', label: '封禁管理' },
  { key: 'seed', label: '迁移静态数据' },
]
const currentTab = ref('pending')

function switchTab(key) {
  currentTab.value = key
  if (key === 'pending') loadPending()
  if (key === 'approved') loadApproved()
  if (key === 'bans') loadBans()
}

// ── 待审核 ────────────────────────────────────────────────
const pendingItems = ref([])
const pendingPage = ref(1)
const totalPending = ref(0)
const pendingLoading = ref(false)

async function loadPending(page = 1) {
  pendingLoading.value = true
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/pending?page=${page}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.status === 401) { handleLogout(); return }
    const data = await res.json()
    pendingItems.value = data.items || []
    totalPending.value = data.total || 0
    pendingPage.value = page
  } catch {
    showToast('加载失败，请刷新重试', 'error')
  } finally {
    pendingLoading.value = false
  }
}

async function approveItem(id) {
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/approve/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.status === 401) { handleLogout(); return }
    const data = await res.json()
    if (res.ok) {
      showToast('审核通过！', 'success')
      loadPending(pendingPage.value)
    } else {
      showToast(data.message || '操作失败', 'error')
    }
  } catch {
    showToast('网络错误', 'error')
  }
}

async function rejectItem(id) {
  confirmState.value = {
    message: `确认拒绝并删除待审核攻略 #${id}？`,
    onConfirm: async () => {
      try {
        const base = getWorkerBase()
        const res = await fetch(`${base}/api/hz/admin/pending/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (res.ok) {
          showToast('已拒绝', 'success')
          loadPending(pendingPage.value)
        } else {
          const data = await res.json()
          showToast(data.message || '操作失败', 'error')
        }
      } catch {
        showToast('网络错误', 'error')
      }
    },
  }
}

// ── 已发布 ────────────────────────────────────────────────
const approvedItems = ref([])
const approvedPage = ref(1)
const totalApproved = ref(0)
const approvedLoading = ref(false)

async function loadApproved(page = 1) {
  approvedLoading.value = true
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/guides?page=${page}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.status === 401) { handleLogout(); return }
    const data = await res.json()
    approvedItems.value = data.items || []
    totalApproved.value = data.total || 0
    approvedPage.value = page
  } catch {
    showToast('加载失败', 'error')
  } finally {
    approvedLoading.value = false
  }
}

async function toggleFeature(item) {
  const newVal = !item.is_featured
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/guide/${item.id}/feature`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ featured: newVal }),
    })
    if (res.ok) {
      item.is_featured = newVal ? 1 : 0
      showToast(newVal ? '已设为精选' : '已取消精选', 'success')
    } else {
      const data = await res.json()
      showToast(data.message || '操作失败', 'error')
    }
  } catch {
    showToast('网络错误', 'error')
  }
}

function confirmDeleteGuide(id) {
  confirmState.value = {
    message: `确认永久删除已发布攻略 #${id}？此操作不可撤销。`,
    onConfirm: async () => {
      try {
        const base = getWorkerBase()
        const res = await fetch(`${base}/api/hz/admin/guide/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (res.ok) {
          showToast('已删除', 'success')
          loadApproved(approvedPage.value)
        } else {
          const data = await res.json()
          showToast(data.message || '操作失败', 'error')
        }
      } catch {
        showToast('网络错误', 'error')
      }
    },
  }
}

// ── 封禁管理 ──────────────────────────────────────────────
const banItems = ref([])
const bansLoading = ref(false)
const banUserId = ref('')
const banReason = ref('')
const banLoading = ref(false)

async function loadBans() {
  bansLoading.value = true
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/bans`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.status === 401) { handleLogout(); return }
    const data = await res.json()
    banItems.value = data.items || []
  } catch {
    showToast('加载封禁列表失败', 'error')
  } finally {
    bansLoading.value = false
  }
}

async function banUser() {
  if (!banUserId.value.trim()) return
  banLoading.value = true
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ userId: banUserId.value.trim(), reason: banReason.value.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message, 'success')
      banUserId.value = ''
      banReason.value = ''
      loadBans()
    } else {
      showToast(data.message || '操作失败', 'error')
    }
  } catch {
    showToast('网络错误', 'error')
  } finally {
    banLoading.value = false
  }
}

async function unbanUser(userId) {
  confirmState.value = {
    message: `确认解封玩家 ${userId}？`,
    onConfirm: async () => {
      try {
        const base = getWorkerBase()
        const res = await fetch(`${base}/api/hz/admin/ban/${encodeURIComponent(userId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        const data = await res.json()
        if (res.ok) {
          showToast(data.message, 'success')
          loadBans()
        } else {
          showToast(data.message || '操作失败', 'error')
        }
      } catch {
        showToast('网络错误', 'error')
      }
    },
  }
}

// ── 静态数据迁移 ──────────────────────────────────────────
const seedLoading = ref(false)
const seedDone = ref(false)
const seedResult = ref('')
const seedError = ref('')

async function handleSeed() {
  if (seedDone.value) return
  seedLoading.value = true
  seedError.value = ''

  try {
    // 动态导入所有静态攻略文件
    const modules = import.meta.glob('/src/data/huizhangdata/*.js', { eager: false })
    const entries = []

    for (const [path, loader] of Object.entries(modules)) {
      const match = path.match(/\/(\d+)\.js$/)
      if (!match) continue // 跳过 index.js 等非角色文件
      const charId = match[1]
      const mod = await loader()
      const codes = mod.default || []
      if (codes.length > 0) entries.push({ charId, codes })
    }

    if (entries.length === 0) {
      seedError.value = '未找到可迁移的静态数据'
      return
    }

    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/admin/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ entries }),
    })
    const data = await res.json()
    if (res.ok) {
      seedDone.value = true
      seedResult.value = data.message
    } else {
      seedError.value = data.message || '迁移失败'
    }
  } catch (e) {
    seedError.value = '发生错误: ' + e.message
  } finally {
    seedLoading.value = false
  }
}

// ── 预览弹窗 ──────────────────────────────────────────────
const previewItem = ref(null)
const previewStrategy = computed(() => {
  if (!previewItem.value) return null
  try {
    return decodeStrategy(previewItem.value.code)
  } catch {
    return null
  }
})

function openPreview(item) {
  previewItem.value = item
}

// ── 确认弹窗 ──────────────────────────────────────────────
const confirmState = ref(null)

// ── Toast 提示 ────────────────────────────────────────────
const toastMsg = ref('')
const toastType = ref('success')
let toastTimer = null

function showToast(msg, type = 'success') {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

// ── 工具函数 ──────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

// ── 初始化 ────────────────────────────────────────────────
onMounted(() => {
  const token = getToken()
  if (isTokenValid(token)) {
    isAuthenticated.value = true
    loadPending()
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: v-bind('colors.background.primary');
  color: v-bind('colors.text.primary');
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
}

/* ── 登录界面 ── */
.login-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
}

.login-card {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 14px;
  padding: 2rem 2.4rem;
  width: 90%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 8px 24px v-bind('colors.shadow.primary');
}

.login-title {
  text-align: center;
  margin: 0;
  font-size: 1.2rem;
  color: v-bind('colors.text.primary');
}

.login-sub {
  text-align: center;
  margin: -0.5rem 0 0;
  color: v-bind('colors.text.tertiary');
  font-size: 0.82rem;
}

/* ── 管理面板 ── */
.admin-wrap {
  width: 100%;
  max-width: 1100px;
  padding: 1rem 0.5rem 4rem;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.admin-title {
  font-size: 1.4rem;
  margin: 0;
  color: v-bind('colors.text.primary');
}

.logout-btn {
  background: none;
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 6px;
  color: v-bind('colors.text.secondary');
  padding: 0.3rem 0.8rem;
  font-size: 0.82rem;
  cursor: pointer;
}

.logout-btn:hover {
  border-color: v-bind('colors.brand.cancel');
  color: v-bind('colors.brand.cancel');
}

/* ── Tab 栏 ── */
.tab-bar {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid v-bind('colors.border.primary');
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.5rem 1.2rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: v-bind('colors.brand.primary');
  border-bottom-color: v-bind('colors.brand.primary');
  font-weight: bold;
}

.tab-btn:hover:not(.active) {
  color: v-bind('colors.text.primary');
}

.tab-badge {
  background: v-bind('colors.brand.cancel');
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  padding: 1px 6px;
  font-weight: bold;
}

/* ── 表格 ── */
.table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid v-bind('colors.border.primary');
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.data-table th {
  background: v-bind('colors.background.light');
  color: v-bind('colors.text.secondary');
  font-weight: bold;
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid v-bind('colors.border.primary');
  white-space: nowrap;
}

.data-table td {
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid v-bind('colors.border.secondary');
  color: v-bind('colors.text.primary');
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: v-bind('colors.background.hover');
}

.td-id {
  color: v-bind('colors.text.tertiary');
  font-size: 0.8rem;
  white-space: nowrap;
}

.td-title {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-time {
  color: v-bind('colors.text.tertiary');
  font-size: 0.8rem;
  white-space: nowrap;
}

.td-actions {
  display: flex;
  gap: 5px;
  white-space: nowrap;
}

.action-btn {
  padding: 0.28rem 0.7rem;
  border-radius: 5px;
  border: 1px solid;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.15s;
}

.info-btn {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
  background: transparent;
}

.info-btn:hover {
  background: v-bind('colors.brand.primaryBackground');
}

.approve-btn {
  border-color: v-bind('colors.brand.confirm');
  color: v-bind('colors.brand.confirm');
  background: transparent;
}

.approve-btn:hover {
  background: v-bind('colors.status.successBg');
}

.warn-btn {
  border-color: v-bind('colors.text.highlight');
  color: v-bind('colors.text.highlight');
  background: transparent;
}

.warn-btn:hover {
  opacity: 0.8;
}

.danger-btn {
  border-color: v-bind('colors.brand.cancel');
  color: v-bind('colors.brand.cancel');
  background: transparent;
}

.danger-btn:hover {
  background: v-bind('colors.status.errorBg');
}

.featured-tag {
  font-size: 0.78rem;
  color: v-bind('colors.text.tertiary');
}

.featured-tag.active {
  color: v-bind('colors.text.highlight');
  font-weight: bold;
}

/* ── 分页 ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.page-btn {
  padding: 0.35rem 0.9rem;
  border-radius: 6px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.85rem;
}

.page-btn:hover:not(:disabled) {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: v-bind('colors.text.tertiary');
  font-size: 0.82rem;
}

/* ── 封禁管理 ── */
.ban-form-card {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.ban-form-title {
  margin: 0 0 0.7rem;
  font-size: 0.95rem;
  color: v-bind('colors.text.primary');
}

.ban-inputs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ban-id-input {
  width: 140px;
  flex-shrink: 0;
}

.ban-reason-input {
  flex: 1;
  min-width: 140px;
}

.ban-submit-btn {
  flex-shrink: 0;
}

/* ── 迁移数据 ── */
.seed-warn {
  background: v-bind('colors.status.errorBg');
  border: 1px solid v-bind('colors.brand.cancel');
  border-radius: 8px;
  padding: 0.8rem 1rem;
  color: v-bind('colors.status.error');
  font-size: 0.88rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.seed-result {
  margin-bottom: 1rem;
}

/* ── 通用组件 ── */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-weight: bold;
  font-size: 0.85rem;
  color: v-bind('colors.text.secondary');
}

.form-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid v-bind('colors.input.border');
  background: v-bind('colors.input.background');
  color: v-bind('colors.input.text');
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: v-bind('colors.brand.primary');
}

.full-btn {
  width: 100%;
}

.primary-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: none;
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.primary-btn:hover:not(:disabled) {
  background: v-bind('colors.brand.hover');
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-primary {
  background: v-bind('colors.brand.cancel');
  color: #fff;
}

.danger-primary:hover:not(:disabled) {
  background: v-bind('colors.brand.cancelHover');
}

.cancel-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
  cursor: pointer;
}

.cancel-btn:hover {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}

.feedback-msg {
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 6px;
}

.error-msg {
  background: v-bind('colors.status.errorBg');
  color: v-bind('colors.status.error');
}

.success-msg {
  background: v-bind('colors.status.successBg');
  color: v-bind('colors.status.success');
}

.loading-msg,
.empty-msg {
  text-align: center;
  color: v-bind('colors.text.tertiary');
  padding: 2rem 0;
  font-size: 0.9rem;
}

.tab-content {
  margin-top: 0.5rem;
}

/* ── 预览弹窗 ── */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: v-bind('colors.background.overlay');
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.preview-dialog {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 14px;
  padding: 1.2rem;
  width: 90%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: v-bind('colors.text.primary');
}

.preview-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.82rem;
  color: v-bind('colors.text.tertiary');
}

.preview-error {
  text-align: center;
  color: v-bind('colors.status.error');
  font-size: 0.88rem;
}

.close-btn {
  background: none;
  border: none;
  color: v-bind('colors.text.tertiary');
  cursor: pointer;
  font-size: 1rem;
  padding: 2px 6px;
}

.close-btn:hover {
  color: v-bind('colors.brand.cancel');
}

/* ── 确认弹窗 ── */
.confirm-dialog {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 12px;
  padding: 1.5rem 2rem;
  width: 90%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  box-shadow: 0 8px 24px v-bind('colors.shadow.primary');
}

.confirm-msg {
  text-align: center;
  color: v-bind('colors.text.primary');
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  z-index: 2000;
  box-shadow: 0 4px 12px v-bind('colors.shadow.primary');
  animation: fadeIn 0.2s ease;
}

.toast.success {
  background: v-bind('colors.status.success');
  color: #fff;
}

.toast.error {
  background: v-bind('colors.status.error');
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@media (max-width: 600px) {
  .td-actions {
    flex-direction: column;
    gap: 3px;
  }

  .td-title {
    max-width: 120px;
  }
}
</style>

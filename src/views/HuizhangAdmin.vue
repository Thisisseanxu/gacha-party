<template>
  <div class="page-container">
    <div v-if="!isAuthenticated" class="login-wrap">
      <div class="login-card">
        <h2 class="login-title">徽章攻略管理</h2>
        <p class="login-sub">输入管理员密码与管理员激活码以继续</p>
        <div class="form-row">
          <label class="form-label">管理员密码</label>
          <input
            type="password"
            v-model="password"
            class="form-input"
            placeholder="管理员密码"
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="form-row">
          <label class="form-label">管理员激活码</label>
          <input
            type="password"
            v-model="activationKey"
            class="form-input"
            placeholder="管理员账号的激活码"
            autocomplete="off"
            @keyup.enter="handleLogin"
          />
        </div>
        <div v-if="loginError" class="feedback-msg error-msg">{{ loginError }}</div>
        <button class="primary-btn full-btn" @click="handleLogin" :disabled="loginLoading">
          {{ loginLoading ? '验证中...' : '登录' }}
        </button>
      </div>
    </div>

    <div v-else class="admin-wrap">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">徽章攻略管理</h1>
          <p class="admin-meta">
            版本 {{ baseVersion || '0' }} · 已发布 {{ approvedItems.length }} 篇 · 待审核
            {{ pendingItems.length }} 篇
          </p>
        </div>
        <div class="header-actions">
          <span v-if="isDirty" class="dirty-pill">有未保存更改</span>
          <button class="action-btn" @click="reloadAll" :disabled="loading || saving">
            重新加载
          </button>
          <button
            class="action-btn warn-btn"
            @click="discardChanges"
            :disabled="!isDirty || saving"
          >
            放弃更改
          </button>
          <button class="primary-btn" @click="saveAll" :disabled="!isDirty || saving">
            {{ saving ? '保存中...' : '保存全部' }}
          </button>
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </div>

      <div v-if="loading" class="loading-msg">加载中...</div>
      <template v-else>
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: currentTab === tab.key }"
            @click="currentTab = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.key === 'pending' && pendingItems.length > 0" class="tab-badge">
              {{ pendingItems.length }}
            </span>
          </button>
        </div>

        <div v-if="currentTab === 'pending'" class="tab-content">
          <div v-if="pendingItems.length === 0" class="empty-msg">暂无待审核攻略</div>
          <template v-else>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>角色</th>
                    <th>标题</th>
                    <th>作者</th>
                    <th>投稿者ID</th>
                    <th>提交时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in pendingPageItems" :key="item.key">
                    <td class="td-id">#{{ item.id }}</td>
                    <td>{{ charName(item.char_id) }}</td>
                    <td class="td-title">{{ item.title || '（无标题）' }}</td>
                    <td>{{ item.author_name || '-' }}</td>
                    <td class="td-userid">{{ item.user_id || '未知' }}</td>
                    <td class="td-time">{{ formatTime(item.submitted_at) }}</td>
                    <td class="td-actions">
                      <button class="action-btn info-btn" @click="openPreview(item)">预览</button>
                      <button class="action-btn edit-btn" @click="openEditItem(item, 'pending')">
                        编辑
                      </button>
                      <button class="action-btn approve-btn" @click="approveItem(item)">
                        通过
                      </button>
                      <button class="action-btn danger-btn" @click="rejectItem(item)">拒绝</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <PaginationControls
              :page="pendingPage"
              :total="pendingItems.length"
              @change="pendingPage = $event"
            />
          </template>
        </div>

        <div v-if="currentTab === 'approved'" class="tab-content">
          <div v-if="approvedItems.length === 0" class="empty-msg">暂无已发布攻略</div>
          <template v-else>
            <div class="section-toolbar">
              <span class="section-count">共 {{ approvedItems.length }} 篇已发布攻略</span>
              <button class="action-btn info-btn" @click="downloadApprovedGuides">导出数据</button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>角色</th>
                    <th>标题</th>
                    <th>作者</th>
                    <th>投稿者ID</th>
                    <th>精选</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in approvedPageItems" :key="item.id">
                    <td class="td-id">#{{ item.id }}</td>
                    <td>{{ charName(item.char_id) }}</td>
                    <td class="td-title">{{ item.title || '（无标题）' }}</td>
                    <td>{{ item.author_name || '-' }}</td>
                    <td class="td-userid">{{ item.user_id || '未知' }}</td>
                    <td>
                      <span class="featured-tag" :class="{ active: item.is_featured }">
                        {{ item.is_featured ? '精选' : '-' }}
                      </span>
                    </td>
                    <td class="td-actions">
                      <button class="action-btn info-btn" @click="openPreview(item)">预览</button>
                      <button class="action-btn edit-btn" @click="openEditItem(item, 'guide')">
                        编辑
                      </button>
                      <button
                        class="action-btn"
                        :class="item.is_featured ? 'warn-btn' : 'approve-btn'"
                        @click="toggleFeature(item)"
                      >
                        {{ item.is_featured ? '取消精选' : '设为精选' }}
                      </button>
                      <button class="action-btn danger-btn" @click="confirmDeleteGuide(item)">
                        删除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <PaginationControls
              :page="approvedPage"
              :total="approvedItems.length"
              @change="approvedPage = $event"
            />
          </template>
        </div>

        <div v-if="currentTab === 'bans'" class="tab-content">
          <div class="ban-form-card">
            <h3 class="ban-form-title">封禁玩家</h3>
            <div class="ban-inputs">
              <input
                v-model="banUserId"
                class="form-input ban-id-input"
                placeholder="玩家ID"
                inputmode="numeric"
              />
              <input
                v-model="banReason"
                class="form-input ban-reason-input"
                placeholder="封禁原因（可选）"
              />
              <button class="action-btn danger-btn" :disabled="!banUserId.trim()" @click="banUser">
                封禁
              </button>
            </div>
          </div>
          <div v-if="banItems.length === 0" class="empty-msg">暂无封禁记录</div>
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
                  <td class="td-title">{{ item.reason || '-' }}</td>
                  <td class="td-actions">
                    <button class="action-btn approve-btn" @click="unbanUser(item)">解封</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="currentTab === 'import'" class="tab-content">
          <div class="seed-warn">
            将 D1 或静态数据导出的 JSON 粘贴到这里后，可作为草稿导入；仍需点击“保存全部”才会发布。
          </div>
          <textarea
            v-model="importText"
            class="form-input import-textarea"
            placeholder='支持 {"guides":[...]} 或直接攻略数组'
          />
          <div class="confirm-actions import-actions">
            <button class="primary-btn" @click="importGuides">导入为已发布草稿</button>
            <button class="cancel-btn" @click="importText = ''">清空</button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="previewItem" class="overlay" @click.self="previewItem = null">
      <div class="preview-dialog">
        <div class="preview-header">
          <span>攻略预览 - {{ charName(previewItem.char_id) }}</span>
          <button class="close-btn" @click="previewItem = null">x</button>
        </div>
        <div class="preview-meta">
          <span>标题：{{ previewItem.title || '（无标题）' }}</span>
          <span>作者：{{ previewItem.author_name || '-' }}</span>
        </div>
        <HuizhangLiveCard
          v-if="previewStrategy"
          :strategy="previewStrategy"
          :charConfig="getCharConfig(previewItem.char_id)"
          :scale="previewScale"
        />
        <p v-else class="preview-error">无法解析攻略代码</p>
      </div>
    </div>

    <div v-if="confirmState" class="overlay" @click.self="confirmState = null">
      <div class="confirm-dialog">
        <p class="confirm-msg">{{ confirmState.message }}</p>
        <div class="confirm-actions">
          <button
            class="primary-btn danger-primary"
            @click="
              () => {
                confirmState.onConfirm()
                confirmState = null
              }
            "
          >
            确认
          </button>
          <button class="cancel-btn" @click="confirmState = null">取消</button>
        </div>
      </div>
    </div>

    <div v-if="editItem" class="overlay" @click.self="editItem = null">
      <div class="edit-dialog">
        <div class="preview-header">
          <span
            >编辑攻略 #{{ editItem.id }}（{{
              editSource === 'pending' ? '待审核' : '已发布'
            }}）</span
          >
          <button class="close-btn" @click="editItem = null">x</button>
        </div>
        <div class="edit-form">
          <label class="edit-label">标题</label>
          <input v-model="editForm.title" class="form-input" placeholder="攻略名称" />
          <label class="edit-label">作者署名</label>
          <input v-model="editForm.author_name" class="form-input" placeholder="作者名" />
          <label class="edit-label">攻略码</label>
          <textarea v-model="editForm.code" class="form-input code-textarea" rows="4" />
          <label class="edit-label">注释（推荐理由）</label>
          <textarea
            v-model="editForm.recText"
            class="form-input rec-textarea"
            rows="5"
            placeholder="仅修改攻略卡片上的推荐理由，不需要打开编辑器"
          />
          <div v-if="editError" class="feedback-msg error-msg">{{ editError }}</div>
          <div class="confirm-actions">
            <button class="primary-btn" @click="saveEdit">保存到草稿</button>
            <button class="cancel-btn" @click="editItem = null">取消</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toastMsg" class="toast" :class="toastType">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, onUnmounted, ref } from 'vue'
import { colors } from '@/styles/colors.js'
import { getCharConfig } from '@/data/huizhang.js'
import { decodeStrategy, encodeStrategy } from '@/utils/huizhangCode.js'
import { useHuizhangGuides } from '@/composables/useHuizhangGuides.js'
import HuizhangLiveCard from '@/components/HuizhangLiveCard.vue'
import { cardMap } from '@/data/cards.js'

const PAGE_SIZE = 20
const { getWorkerBase, forceRefresh } = useHuizhangGuides()

const PaginationControls = defineComponent({
  props: {
    page: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () => {
      const totalPages = Math.max(1, Math.ceil(props.total / PAGE_SIZE))
      return h('div', { class: 'pagination' }, [
        h(
          'button',
          {
            class: 'page-btn',
            disabled: props.page <= 1,
            onClick: () => emit('change', props.page - 1),
          },
          '< 上一页',
        ),
        h(
          'span',
          { class: 'page-info' },
          `第 ${props.page} 页 / 共 ${totalPages} 页（${props.total} 条）`,
        ),
        h(
          'button',
          {
            class: 'page-btn',
            disabled: props.page >= totalPages,
            onClick: () => emit('change', props.page + 1),
          },
          '下一页 >',
        ),
      ])
    }
  },
})

const charName = (charId) => cardMap.get(String(charId))?.name || charId

const isAuthenticated = ref(false)
const password = ref('')
const activationKey = ref('')
const loginError = ref('')
const loginLoading = ref(false)
const loading = ref(false)
const saving = ref(false)
const isDirty = ref(false)
const baseVersion = ref('0')
const snapshot = ref(null)

const pendingItems = ref([])
const approvedItems = ref([])
const banItems = ref([])
const deletePendingKeys = ref([])
const deleteBanKeys = ref([])

const pendingPage = ref(1)
const approvedPage = ref(1)
const currentTab = ref('pending')
const tabs = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已发布' },
  { key: 'bans', label: '封禁管理' },
  { key: 'import', label: '导入数据' },
]

const banUserId = ref('')
const banReason = ref('')
const importText = ref('')
const previewItem = ref(null)
const confirmState = ref(null)
const editItem = ref(null)
const editSource = ref('')
const editForm = ref({ title: '', author_name: '', code: '', recText: '' })
const editError = ref('')
const toastMsg = ref('')
const toastType = ref('success')
const previewWindowWidth = ref(window.innerWidth)
const previewWindowHeight = ref(window.innerHeight)
let toastTimer = null

const pendingPageItems = computed(() =>
  pendingItems.value.slice((pendingPage.value - 1) * PAGE_SIZE, pendingPage.value * PAGE_SIZE),
)
const approvedPageItems = computed(() =>
  approvedItems.value.slice((approvedPage.value - 1) * PAGE_SIZE, approvedPage.value * PAGE_SIZE),
)

const previewStrategy = computed(() => {
  if (!previewItem.value) return null
  try {
    return decodeStrategy(previewItem.value.code)
  } catch {
    return null
  }
})

const previewScale = computed(() => {
  const maxW = Math.min(previewWindowWidth.value * 0.9, 860) - 38
  const maxH = previewWindowHeight.value * 0.85 - 120
  return Math.min(maxW / 800, maxH / 550)
})

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

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function markDirty() {
  isDirty.value = true
}

function normalizeGuide(raw) {
  const now = Date.now()
  return {
    id: String(raw.id || `g_${now}_${Math.random().toString(36).slice(2, 8)}`),
    char_id: String(raw.char_id || raw.charId || ''),
    code: String(raw.code || ''),
    title: String(raw.title || '').trim(),
    author_name: String(raw.author_name || raw.authorName || '').trim(),
    user_id: String(raw.user_id || raw.userId || ''),
    is_featured: raw.is_featured || raw.isFeatured ? 1 : 0,
    approved_at: Number(raw.approved_at || raw.approvedAt || now),
  }
}

function applyBootstrap(data) {
  baseVersion.value = data?.meta?.version || '0'
  pendingItems.value = clone(data?.pending || [])
  approvedItems.value = clone(data?.guides || []).map(normalizeGuide)
  banItems.value = clone(data?.bans || [])
  deletePendingKeys.value = []
  deleteBanKeys.value = []
  snapshot.value = clone({
    pending: pendingItems.value,
    approved: approvedItems.value,
    bans: banItems.value,
    version: baseVersion.value,
  })
  isDirty.value = false
  pendingPage.value = 1
  approvedPage.value = 1
}

async function handleLogin() {
  loginError.value = ''
  if (!password.value || !activationKey.value) {
    loginError.value = '请输入管理员密码和管理员激活码'
    return
  }
  loginLoading.value = true
  try {
    const res = await fetch(`${getWorkerBase()}/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value, activationKey: activationKey.value }),
    })
    const data = await res.json()
    if (!res.ok) {
      loginError.value = data.message || '登录失败'
      return
    }
    sessionStorage.setItem('hz_admin_token', data.token)
    isAuthenticated.value = true
    password.value = ''
    activationKey.value = ''
    await reloadAll()
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

async function reloadAll() {
  if (isDirty.value && !window.confirm('当前有未保存更改，确认重新加载并放弃这些更改？')) return
  loading.value = true
  try {
    const res = await fetch(`${getWorkerBase()}/api/hz/admin/bootstrap`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.status === 401) {
      handleLogout()
      return
    }
    const data = await res.json()
    if (!res.ok) {
      showToast(data.message || '加载失败', 'error')
      return
    }
    applyBootstrap(data)
  } catch {
    showToast('加载失败，请刷新重试', 'error')
  } finally {
    loading.value = false
  }
}

function discardChanges() {
  if (!snapshot.value) return
  applyBootstrap({
    meta: { version: snapshot.value.version },
    pending: snapshot.value.pending,
    guides: snapshot.value.approved,
    bans: snapshot.value.bans,
  })
  showToast('已放弃未保存更改', 'success')
}

async function saveAll() {
  saving.value = true
  try {
    const res = await fetch(`${getWorkerBase()}/api/hz/admin/save-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        baseVersion: baseVersion.value,
        guides: approvedItems.value,
        deletePendingKeys: deletePendingKeys.value,
        bans: banItems.value,
        deleteBanKeys: deleteBanKeys.value,
      }),
    })
    const data = await res.json()
    if (res.status === 401) {
      handleLogout()
      return
    }
    if (res.status === 409) {
      showToast(data.message || '版本冲突，请重新加载', 'error')
      return
    }
    if (!res.ok) {
      showToast(data.message || '保存失败', 'error')
      return
    }
    showToast('全部修改已保存', 'success')
    isDirty.value = false
    await forceRefresh()
    await reloadAll()
  } catch {
    showToast('保存失败，请检查网络', 'error')
  } finally {
    saving.value = false
  }
}

function approveItem(item) {
  const now = Date.now()
  approvedItems.value.unshift(
    normalizeGuide({
      ...item,
      id: `g_${now}_${Math.random().toString(36).slice(2, 8)}`,
      approved_at: now,
      is_featured: 0,
    }),
  )
  pendingItems.value = pendingItems.value.filter((pending) => pending.key !== item.key)
  if (item.key) deletePendingKeys.value.push(item.key)
  markDirty()
  showToast('已加入已发布草稿，保存全部后生效', 'success')
}

function rejectItem(item) {
  confirmState.value = {
    message: `确认拒绝并删除待审核攻略 #${item.id}？保存全部后生效。`,
    onConfirm: () => {
      pendingItems.value = pendingItems.value.filter((pending) => pending.key !== item.key)
      if (item.key) deletePendingKeys.value.push(item.key)
      markDirty()
      showToast('已标记拒绝，保存全部后生效', 'success')
    },
  }
}

function toggleFeature(item) {
  item.is_featured = item.is_featured ? 0 : 1
  markDirty()
}

function confirmDeleteGuide(item) {
  confirmState.value = {
    message: `确认从已发布草稿中删除攻略 #${item.id}？保存全部后生效。`,
    onConfirm: () => {
      approvedItems.value = approvedItems.value.filter((guide) => guide.id !== item.id)
      markDirty()
      showToast('已从草稿删除，保存全部后生效', 'success')
    },
  }
}

function banUser() {
  const userId = banUserId.value.trim()
  if (!userId) return
  const existing = banItems.value.find((item) => item.user_id === userId)
  if (existing) {
    existing.reason = banReason.value.trim()
    existing.banned_at = Date.now()
  } else {
    banItems.value.unshift({
      key: `hz_ban_${userId}`,
      user_id: userId,
      banned_at: Date.now(),
      reason: banReason.value.trim(),
    })
  }
  banUserId.value = ''
  banReason.value = ''
  markDirty()
  showToast('已加入封禁草稿，保存全部后生效', 'success')
}

function unbanUser(item) {
  confirmState.value = {
    message: `确认解封玩家 ${item.user_id}？保存全部后生效。`,
    onConfirm: () => {
      banItems.value = banItems.value.filter((ban) => ban.user_id !== item.user_id)
      if (item.key) deleteBanKeys.value.push(item.key)
      else deleteBanKeys.value.push(`hz_ban_${item.user_id}`)
      markDirty()
    },
  }
}

function openEditItem(item, source) {
  let recText
  try {
    recText = decodeStrategy(item.code || '').recText || ''
  } catch {
    recText = ''
  }
  editItem.value = item
  editSource.value = source
  editForm.value = {
    title: item.title || '',
    author_name: item.author_name || '',
    code: item.code || '',
    recText,
  }
  editError.value = ''
}

function saveEdit() {
  if (!editItem.value) return
  if (!editForm.value.code.trim()) {
    editError.value = '攻略码不能为空'
    return
  }
  let nextCode
  try {
    const strategy = decodeStrategy(editForm.value.code.trim())
    nextCode = encodeStrategy({
      ...strategy,
      recText: editForm.value.recText,
    })
  } catch {
    editError.value = '攻略码无法解析，不能修改推荐理由'
    return
  }
  Object.assign(editItem.value, {
    title: editForm.value.title.trim(),
    author_name: editForm.value.author_name.trim(),
    code: nextCode,
  })
  editItem.value = null
  markDirty()
  showToast('修改已保存到草稿', 'success')
}

function openPreview(item) {
  previewItem.value = item
}

function downloadApprovedGuides() {
  const payload = {
    guides: approvedItems.value.map((item) => normalizeGuide(item)),
  }
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `huizhang-guides-import-${date}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  showToast(`已导出 ${payload.guides.length} 篇攻略`, 'success')
}

function importGuides() {
  try {
    const parsed = JSON.parse(importText.value)
    const imported = Array.isArray(parsed) ? parsed : parsed.guides
    if (!Array.isArray(imported)) throw new Error('JSON 中没有攻略数组')
    approvedItems.value = imported.map(normalizeGuide)
    approvedPage.value = 1
    importText.value = ''
    markDirty()
    showToast(`已导入 ${approvedItems.value.length} 篇攻略草稿`, 'success')
  } catch (error) {
    showToast(error.message || '导入失败', 'error')
  }
}

function formatTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

function showToast(msg, type = 'success') {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2500)
}

function onPreviewResize() {
  previewWindowWidth.value = window.innerWidth
  previewWindowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', onPreviewResize)
  const token = getToken()
  if (isTokenValid(token)) {
    isAuthenticated.value = true
    reloadAll()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onPreviewResize)
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
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 8px 24px v-bind('colors.shadow.primary');
}

.login-title {
  text-align: center;
  margin: 0;
  font-size: 1.2rem;
}

.login-sub,
.admin-meta {
  margin: 0.25rem 0 0;
  color: v-bind('colors.text.tertiary');
  font-size: 0.82rem;
}

.admin-wrap {
  width: 100%;
  max-width: 1180px;
  padding: 1rem 0.5rem 4rem;
}

.admin-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.admin-title {
  font-size: 1.4rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dirty-pill {
  border: 1px solid v-bind('colors.text.highlight');
  color: v-bind('colors.text.highlight');
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  font-size: 0.78rem;
  font-weight: bold;
}

.logout-btn,
.action-btn,
.cancel-btn,
.primary-btn {
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bold;
  transition: all 0.15s;
}

.logout-btn,
.action-btn,
.cancel-btn {
  background: transparent;
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
  padding: 0.42rem 0.8rem;
}

.primary-btn {
  padding: 0.5rem 1.1rem;
  border: none;
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
}

.full-btn {
  width: 100%;
}

.primary-btn:hover:not(:disabled) {
  background: v-bind('colors.brand.hover');
}

.primary-btn:disabled,
.action-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tab-bar {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid v-bind('colors.border.primary');
  margin-bottom: 1rem;
  overflow-x: auto;
}

.tab-btn {
  padding: 0.5rem 1.1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: -1px;
  white-space: nowrap;
}

.tab-btn.active {
  color: v-bind('colors.brand.primary');
  border-bottom-color: v-bind('colors.brand.primary');
  font-weight: bold;
}

.tab-badge {
  background: v-bind('colors.brand.cancel');
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  padding: 1px 6px;
}

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
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid v-bind('colors.border.primary');
  white-space: nowrap;
}

.data-table td {
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid v-bind('colors.border.secondary');
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.td-id,
.td-time,
.td-userid {
  color: v-bind('colors.text.tertiary');
  font-size: 0.8rem;
  white-space: nowrap;
}

.td-title {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-actions {
  display: flex;
  gap: 5px;
  white-space: nowrap;
}

.info-btn {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}

.approve-btn {
  border-color: v-bind('colors.brand.confirm');
  color: v-bind('colors.brand.confirm');
}

.warn-btn {
  border-color: v-bind('colors.text.highlight');
  color: v-bind('colors.text.highlight');
}

.danger-btn {
  border-color: v-bind('colors.brand.cancel');
  color: v-bind('colors.brand.cancel');
}

.edit-btn {
  border-color: v-bind('colors.text.secondary');
  color: v-bind('colors.text.secondary');
}

.featured-tag {
  font-size: 0.78rem;
  color: v-bind('colors.text.tertiary');
}

.featured-tag.active {
  color: v-bind('colors.text.highlight');
  font-weight: bold;
}

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

.page-info,
.section-count {
  color: v-bind('colors.text.tertiary');
  font-size: 0.82rem;
}

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

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
  min-width: 160px;
}

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

.import-textarea {
  min-height: 220px;
  font-family: monospace;
  resize: vertical;
}

.import-actions {
  margin-top: 1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label,
.edit-label {
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

.feedback-msg {
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 6px;
}

.error-msg {
  background: v-bind('colors.status.errorBg');
  color: v-bind('colors.status.error');
}

.loading-msg,
.empty-msg {
  text-align: center;
  color: v-bind('colors.text.tertiary');
  padding: 2rem 0;
  font-size: 0.9rem;
}

.overlay {
  position: fixed;
  inset: 0;
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
  max-width: 860px;
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
}

.close-btn {
  background: none;
  border: none;
  color: v-bind('colors.text.tertiary');
  cursor: pointer;
  font-size: 1rem;
  padding: 2px 6px;
}

.confirm-dialog,
.edit-dialog {
  background: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 12px;
  width: min(520px, 92vw);
  box-shadow: 0 8px 24px v-bind('colors.shadow.primary');
}

.confirm-dialog {
  padding: 1.5rem 2rem;
}

.confirm-msg {
  text-align: center;
  margin: 0 0 1.2rem;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.danger-primary {
  background: v-bind('colors.brand.cancel');
  color: #fff;
}

.edit-form {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.code-textarea {
  font-family: monospace;
  font-size: 0.78rem;
  resize: vertical;
  min-height: 72px;
}

.rec-textarea {
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
}

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
}

.toast.success {
  background: v-bind('colors.status.success');
  color: #fff;
}

.toast.error {
  background: v-bind('colors.status.error');
  color: #fff;
}

@media (max-width: 760px) {
  .admin-header {
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .td-actions {
    flex-direction: column;
  }
}
</style>

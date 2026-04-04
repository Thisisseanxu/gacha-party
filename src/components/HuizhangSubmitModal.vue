<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="submit-modal">
      <h3 class="modal-title">投稿攻略</h3>
      <p class="modal-sub">投稿后需要管理员审核，审核通过后将显示在攻略列表中。</p>

      <!-- 激活码输入 -->
      <div class="form-row">
        <label class="form-label">激活码 <span class="required">*</span></label>
        <div class="input-with-eye">
          <input
            :type="showKey ? 'text' : 'password'"
            v-model="licenseKey"
            class="form-input"
            placeholder="粘贴你的激活码"
            autocomplete="off"
          />
          <button class="eye-btn" @click="showKey = !showKey" type="button">
            {{ showKey ? '隐藏' : '显示' }}
          </button>
        </div>
        <label class="checkbox-row">
          <input type="checkbox" v-model="saveKey" />
          <span>保存激活码到本地（下次自动填充）</span>
        </label>
      </div>

      <!-- 攻略代码 -->
      <div class="form-row">
        <label class="form-label">攻略代码 <span class="required">*</span></label>
        <textarea
          v-model="code"
          class="code-textarea"
          rows="4"
          placeholder="在编辑器中创建攻略后，点击「导出代码」获取代码，粘贴到此处..."
        ></textarea>
        <a :href="`/huizhang/edit?charId=${charId}`" target="_blank" class="hint-link">
          前往编辑器创建攻略 →
        </a>
      </div>

      <!-- 标题和署名 -->
      <div class="compact-row">
        <div class="form-row compact-col">
          <label class="form-label">攻略标题（可选）</label>
          <input
            v-model="title"
            class="form-input"
            maxlength="100"
            placeholder="如：高伤输出配置"
          />
        </div>
        <div class="form-row compact-col">
          <label class="form-label">署名（可选）</label>
          <input v-model="authorName" class="form-input" maxlength="100" placeholder="你的昵称" />
        </div>
      </div>

      <!-- 状态反馈 -->
      <div v-if="errorMsg" class="feedback-msg error-msg">{{ errorMsg }}</div>
      <div v-if="successMsg" class="feedback-msg success-msg">{{ successMsg }}</div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button class="form-btn primary" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中…' : '提交审核' }}
        </button>
        <button class="form-btn cancel" @click="emit('close')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { colors } from '@/styles/colors.js'
import { decodeStrategy } from '@/utils/huizhangCode.js'
import { useHuizhangGuides } from '@/composables/useHuizhangGuides.js'

const props = defineProps({
  charId: { type: String, required: true },
})
const emit = defineEmits(['close', 'submitted'])

const { getWorkerBase } = useHuizhangGuides()

const licenseKey = ref('')
const saveKey = ref(false)
const showKey = ref(false)
const code = ref('')
const title = ref('')
const authorName = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(() => {
  const saved = localStorage.getItem('hz_license_key')
  if (saved) {
    licenseKey.value = saved
    saveKey.value = true
  }
})

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  // 本地校验
  if (!licenseKey.value.trim()) {
    errorMsg.value = '请输入激活码'
    return
  }
  if (!code.value.trim()) {
    errorMsg.value = '请粘贴攻略代码'
    return
  }

  // 本地预校验代码是否可解析
  try {
    decodeStrategy(code.value.trim())
  } catch {
    errorMsg.value = '攻略代码格式无效，请确认代码完整且未损坏'
    return
  }

  // 保存激活码
  if (saveKey.value) {
    localStorage.setItem('hz_license_key', licenseKey.value.trim())
  }

  submitting.value = true
  try {
    const base = getWorkerBase()
    const res = await fetch(`${base}/api/hz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': licenseKey.value.trim(),
      },
      body: JSON.stringify({
        charId: props.charId,
        code: code.value.trim(),
        title: title.value.trim(),
        authorName: authorName.value.trim(),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 429 && data.timeLeft) {
        const secs = Math.ceil(data.timeLeft / 1000)
        errorMsg.value = `提交过于频繁，请 ${secs} 秒后再试`
      } else {
        errorMsg.value = data.message || '提交失败，请稍后重试'
      }
    } else {
      successMsg.value = data.message || '提交成功！攻略将在审核通过后显示。'
      setTimeout(() => emit('submitted'), 1500)
    }
  } catch {
    errorMsg.value = '网络错误，请检查网络连接后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
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

.submit-modal {
  background-color: v-bind('colors.background.content');
  padding: 1.4rem 1.6rem;
  border-radius: 14px;
  box-shadow: 0 8px 24px v-bind('colors.shadow.primary');
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 90%;
  max-width: 480px;
  border: 1px solid v-bind('colors.border.primary');
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  text-align: center;
  margin: 0;
  color: v-bind('colors.text.primary');
  font-size: 1.1rem;
}

.modal-sub {
  text-align: center;
  margin: -0.5rem 0 0;
  color: v-bind('colors.text.tertiary');
  font-size: 0.8rem;
  line-height: 1.4;
}

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

.required {
  color: v-bind('colors.brand.cancel');
}

.input-with-eye {
  display: flex;
  gap: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 7px;
  border: 1px solid v-bind('colors.input.border');
  background: v-bind('colors.input.background');
  color: v-bind('colors.input.text');
  box-sizing: border-box;
  font-size: 0.9rem;
  flex: 1;
}

.form-input:focus {
  outline: none;
  border-color: v-bind('colors.brand.primary');
}

.eye-btn {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 7px;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.82rem;
  white-space: nowrap;
}

.eye-btn:hover {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-weight: normal;
}

.checkbox-row input[type='checkbox'] {
  accent-color: v-bind('colors.brand.primary');
  cursor: pointer;
}

.code-textarea {
  width: 100%;
  padding: 8px 10px;
  border-radius: 7px;
  border: 1px solid v-bind('colors.input.border');
  background: v-bind('colors.input.background');
  color: v-bind('colors.input.text');
  box-sizing: border-box;
  font-size: 0.82rem;
  font-family: monospace;
  resize: vertical;
  min-height: 90px;
}

.code-textarea:focus {
  outline: none;
  border-color: v-bind('colors.brand.primary');
}

.hint-link {
  color: v-bind('colors.brand.primary');
  font-size: 0.78rem;
  text-decoration: none;
  align-self: flex-end;
}

.hint-link:hover {
  text-decoration: underline;
}

.compact-row {
  display: flex;
  gap: 10px;
}

.compact-col {
  flex: 1;
  min-width: 0;
}

.feedback-msg {
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
}

.error-msg {
  background: v-bind('colors.status.errorBg');
  color: v-bind('colors.status.error');
}

.success-msg {
  background: v-bind('colors.status.successBg');
  color: v-bind('colors.status.success');
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.form-btn {
  flex: 1;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.15s;
  border: 1px solid v-bind('colors.border.primary');
  background: v-bind('colors.background.lighter');
  color: v-bind('colors.text.primary');
}

.form-btn.primary {
  background: v-bind('colors.brand.primary');
  color: v-bind('colors.text.black');
  border-color: v-bind('colors.brand.primary');
}

.form-btn.primary:hover:not(:disabled) {
  background: v-bind('colors.brand.hover');
}

.form-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-btn.cancel {
  color: v-bind('colors.text.secondary');
}

.form-btn.cancel:hover {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}
</style>

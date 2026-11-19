<template>
  <section class="assistant-download" aria-label="下载抽卡记录获取助手">
    <a
      class="assistant-download-link"
      :href="RECORD_ASSISTANT_APK_PATH"
      download="盲盒派对助手.apk"
    >
      下载抽卡记录获取助手（安卓 APK）
    </a>
    <a :href="RECORD_ASSISTANT_APK_PATH" download="盲盒派对助手.apk" aria-label="下载安卓助手 APK">
      <img
        :src="RECORD_ASSISTANT_QR_PATH"
        class="assistant-download-qr"
        width="176"
        height="176"
        alt="抽卡记录获取助手 APK 下载二维码"
      />
    </a>
    <p class="assistant-download-caption">扫码直接下载 · Android 8.0 及以上</p>
  </section>
</template>

<script setup>
import {
  RECORD_ASSISTANT_APK_PATH,
  RECORD_ASSISTANT_QR_PATH,
} from '@/utils/recordAssistantDownload.js'
</script>

<style scoped>
.assistant-download {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 12px;
  border-bottom: 1px solid var(--color-border-primary);
}

.assistant-download-link {
  color: var(--color-text-highlight);
  font-size: 1rem;
  font-weight: bold;
  line-height: 1.6;
  text-underline-offset: 4px;
}

.assistant-download-qr {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  background: white;
}

.assistant-download-caption {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>

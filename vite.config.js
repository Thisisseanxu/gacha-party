import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 2. 添加 PWA 插件并进行配置
    VitePWA({
      registerType: 'autoUpdate', // 自动更新 Service Worker
      devOptions: {
        enabled: true, // 在开发环境中也启用 PWA
      },
      manifest: {
        name: '织夜工具箱', // 应用全名
        short_name: '织夜工具箱', // 应用短名
        description: '一个“盲盒派对”游戏工具网站，包含抽卡模拟器和数据分析等功能。', // 应用描述
        theme_color: '#1a1b20', // 主题颜色，与您的网站背景色匹配
        background_color: '#1a1b20',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          // 应用图标
          {
            src: 'images/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'images/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'images/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Service Worker 的缓存策略
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'], // 缓存所有静态资源
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
})

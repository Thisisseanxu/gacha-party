import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // PWA插件和相关配置
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false, // 在开发环境中禁用PWA
      },
      manifest: {
        name: '织夜工具箱', // 应用全名
        short_name: '织夜工具箱', // 应用短名
        description: '一个“盲盒派对”游戏工具网站，包含抽卡模拟器和数据分析等功能。',
        theme_color: '#1a1b20', // 主题颜色
        background_color: '#1a1b20',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        // 应用图标
        icons: [
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
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,json}'],
        runtimeCaching: [
          {
            // 匹配常见的图片格式
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 缓存有效期 30 天
              },
              // 允许跨域图片缓存
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 匹配常见的图片格式
            urlPattern: /\.(?:ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // 缓存有效期 365 天
              },
              // 允许跨域缓存
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 原有的代码缓存策略
          {
            urlPattern: /\.(?:js|css|html)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
})

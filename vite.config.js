import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import pkg from './package.json'
import { devEditorPlugin } from './plugins/dev-editor-plugin.js'
import { publicJsonDataPlugin } from './plugins/public-json-data-plugin.js'

const root = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    publicJsonDataPlugin(root),
    devEditorPlugin(), // 可视化配置编辑器
    vueDevTools({
      componentInspector: true,
      launchEditor: 'code',
    }),
    vue(),
    // PWA插件和相关配置
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true, // 在开发环境中也启用PWA
      },
      manifest: {
        name: '织夜工具箱', // 应用全名
        short_name: '织夜工具箱', // 应用短名
        description: '一个“盲盒派对”游戏工具网站，包含抽卡记录分析、徽章攻略等功能',
        theme_color: '#1a1b20', // 主题颜色
        background_color: '#1a1b20',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        // 应用图标
        icons: [
          {
            src: 'images/icons/icon-192px.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'images/icons/icon-512px.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        skipWaiting: false, // 等待用户确认后再激活新 SW
        clientsClaim: true, // 让已经打开的页面使用新的 SW
        // vite-plugin-pwa 默认会回退到 index.html；SSG 下必须显式关闭，
        // 否则它会先于下面的 NetworkFirst 导航规则接管所有页面。
        navigateFallback: null,
        // 不要把 SSG 生成的数百个 HTML 放进 precache。
        // 它们会在每次发布时拖慢新 SW 的安装；图片也交给下面的 runtime cache。
        globPatterns: ['**/*.{json,js,css}'],
        runtimeCaching: [
          {
            // SSG 页面按访问时缓存：在线优先拿最新 HTML，断网时回退到最近访问版本。
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 匹配 *.onmicrosoft.cn 的 CDN 资源
          {
            // 优先匹配 CSS和 js，单独存储，防止被大量字体文件挤出缓存
            urlPattern: /^https:\/\/(?:[A-Za-z0-9-]+\.)+onmicrosoft\.cn\/.*\.(?:css|js)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'onmicrosoft-package-cache',
              expiration: {
                maxEntries: 50, // CSS 文件数量较少，50足够
                maxAgeSeconds: 60 * 60 * 24 * 365, // 缓存 365 天
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 匹配字体切片等其他资源
            urlPattern: /^https:\/\/(?:[A-Za-z0-9-]+\.)+onmicrosoft\.cn\/.*/i,
            handler: 'CacheFirst', // 强缓存：因为 URL 里带有版本号，内容不会变
            options: {
              cacheName: 'onmicrosoft-source-cache',
              expiration: {
                maxEntries: 2000, // 扩容到 2000 条，足以容纳所有中文字体切片
                maxAgeSeconds: 60 * 60 * 24 * 365, // 缓存 365 天
              },
              cacheableResponse: {
                // 允许缓存跨域响应
                statuses: [0, 200],
              },
            },
          },
          {
            // 匹配常见的图片格式
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 缓存有效期 90 天
              },
              // 允许跨域图片缓存
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 本地字体体积较大，首次使用时缓存，避免阻塞 SW 更新。
            urlPattern: /\.(?:woff2?|ttf|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
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
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        spa: fileURLToPath(new URL('./spa.html', import.meta.url)),
      },
    },
  },
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'prettify',
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

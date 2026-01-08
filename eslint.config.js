import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import pluginVueScopedCss from 'eslint-plugin-vue-scoped-css'

import { includeIgnoreFile } from '@eslint/compat'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, '.gitignore')

export default defineConfig([
  includeIgnoreFile(gitignorePath),

  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        __VERSION__: 'readonly',
        CLOUD_PUBLIC_KEY: 'readonly', // 添加 CLOUD_PUBLIC_KEY 全局变量
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...pluginVueScopedCss.configs['flat/all'],
  skipFormatting,
])

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    // 过滤掉 Element Plus 组件在测试环境未注册的已知 Vue 警告
    onConsoleLog(log) {
      if (log.includes('Failed to resolve component: el-')) return false
      if (log.includes('If this is a native custom element')) return false
    },
    onConsoleWarn(log) {
      if (log.includes('Failed to resolve component: el-')) return false
      if (log.includes('If this is a native custom element')) return false
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

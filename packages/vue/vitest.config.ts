import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * L2：Vue 3 组件功能测试（jsdom + @vue/test-utils）。
 *
 * 覆盖率门禁：行/语句/函数 ≥ 80%，分支 ≥ 80%（计划规定的组件层阈值，
 * 区别于 core L1 的 90/85；根目录聚合门禁只统计 core）。
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // v-model 等集成测试需要运行时模板编译器
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  test: {
    name: 'vue',
    environment: 'jsdom',
    include: ['test/**/*.spec.ts'],
    // v2 契约：测试环境下弹层 transition 钩子同步触发（跳过 CSS 动画等待）
    env: {
      MAND_ENV: 'test',
    },
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      exclude: ['src/**/index.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
})

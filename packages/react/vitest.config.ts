import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * L2：React 组件功能测试（jsdom + @testing-library/react）。
 * 覆盖率门禁与 Vue 包一致：行/语句/函数 ≥ 80%，分支 ≥ 80%。
 */
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'react',
    environment: 'jsdom',
    include: ['test/**/*.spec.ts{,x}'],
    setupFiles: ['test/setup/index.ts'],
    // v2 契约：测试环境下弹层 transition 钩子同步触发（跳过 CSS 动画等待）
    env: {
      MAND_ENV: 'test',
    },
    globals: true,
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

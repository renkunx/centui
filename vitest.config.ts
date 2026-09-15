import { defineConfig } from 'vitest/config'

/**
 * 根测试编排：projects 模式聚合各包/工程的独立 vitest 配置
 * - packages/core    node 环境，纯逻辑单测（L1，TDD 主战场）
 * - packages/vue     jsdom + @vue/test-utils（L2 + L3 golden 对比，M3）
 * - packages/react   jsdom + @testing-library/react（L2，M4）
 * - test/golden      vue2.7 + mand-mobile@2.7.0 渲染基线（L3，不计覆盖率）
 *
 * 覆盖率门禁在各包自己的 vitest.config.ts 中声明并按包执行（`pnpm coverage`
 * 编排 per-package test:coverage）：core 90/85，vue 组件层 80/80。
 * 根级仅保留聚合报表能力，不设全局阈值（避免跨层指标互相稀释）。
 */
export default defineConfig({
  test: {
    projects: ['packages/*', 'test/golden'],
    passWithNoTests: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['packages/core/src/**', 'packages/vue/src/**'],
      exclude: ['packages/*/src/**/*.{spec,test}.*', 'test/**'],
    },
  },
})

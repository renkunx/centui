import { defineConfig } from 'vitest/config'

/**
 * 根测试编排：projects 模式聚合各包/工程的独立 vitest 配置
 * - packages/core    node 环境，纯逻辑单测（L1，TDD 主战场）
 * - packages/vue     jsdom + @vue/test-utils（L2，M3）
 * - packages/react   jsdom + @testing-library/react（L2，M4）
 * - test/golden      vue2.7 + mand-mobile@2.7.0 渲染基线（L3，不计覆盖率）
 *
 * 覆盖率门禁（行/分支阈值）在各包自己的 vitest.config.ts 中声明，
 * CI 对 packages/* 的 coverage 结果做硬门禁。
 */
export default defineConfig({
  test: {
    projects: ['packages/*', 'test/golden'],
    // 骨架阶段尚无测试文件，core 首批用例落地后移除
    passWithNoTests: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**'],
      exclude: ['packages/*/src/**/*.{spec,test}.*', 'test/**'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
})

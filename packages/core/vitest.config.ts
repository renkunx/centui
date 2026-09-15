import { defineConfig } from 'vitest/config'

/**
 * L1：core 纯逻辑单测（TDD 主战场）
 * - core      node 环境，DOM-free 主入口
 * - core-web  jsdom 环境，/web 子入口（dom/render/scroller）
 *
 * 覆盖率门禁：行/语句/函数 ≥ 90%，分支 ≥ 85%
 */
export default defineConfig({
  test: {
    name: 'core',
    projects: [
      {
        test: {
          name: 'core',
          environment: 'node',
          include: ['test/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'core-web',
          environment: 'jsdom',
          include: ['test/web/**/*.spec.ts'],
        },
      },
    ],
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
})

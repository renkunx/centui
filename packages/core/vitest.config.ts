import { defineConfig } from 'vitest/config'

/**
 * L1：core 纯逻辑单测（node 环境，TDD 主战场）
 * 覆盖率门禁：行/语句/函数 ≥ 90%，分支 ≥ 85%（首批用例落地时启用）
 */
export default defineConfig({
  test: {
    name: 'core',
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    // 骨架占位，首批用例（lang）落地时移除
    passWithNoTests: true,
  },
})

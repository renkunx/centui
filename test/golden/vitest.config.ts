import { defineConfig } from 'vitest/config'

/**
 * L3：golden 基线工程。
 * 依赖已发布的 mand-mobile@2.7.0（esm 产物）+ vue@2.7 在现代工具链渲染场景，
 * 产出规范化 HTML 基线供 v3 Vue/React 两端对比（迁移契约）。
 *
 * GOLDEN_UPDATE=1 vitest run  → 重新采集基线
 * vitest run                   → 渲染并与已提交基线对比
 */
export default defineConfig({
  test: {
    name: 'golden',
    environment: 'jsdom',
    include: ['test/**/*.spec.ts'],
  },
})

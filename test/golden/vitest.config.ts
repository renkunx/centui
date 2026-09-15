import { defineConfig } from 'vitest/config'

/**
 * L3：golden 基线工程。
 * 依赖已发布的 mand-mobile@2.7.0（编译产物）+ vue@2.7 渲染场景，
 * 产出规范化 HTML 基线供 v3 Vue/React 两端对比。不计入覆盖率。
 */
export default defineConfig({
  test: {
    name: 'golden',
    environment: 'jsdom',
    include: ['test/**/*.spec.ts'],
    // 基线工程落地前占位
    passWithNoTests: true,
  },
})

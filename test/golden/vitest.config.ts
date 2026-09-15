import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * L3：golden 基线工程。
 * 依赖已发布的 mand-mobile@2.7.0（esm 产物）+ vue@2.7 在现代工具链渲染场景，
 * 产出规范化 HTML 基线供 v3 Vue/React 两端对比（迁移契约）。
 *
 * GOLDEN_UPDATE=1 vitest run  → 重新采集基线
 * vitest run                   → 渲染并与已提交基线对比
 *
 * workspace 出现 vue@3（packages/vue）后，mand-mobile@2.7.0 的幽灵依赖
 * `require('vue')` 会命中 pnpm 隐藏 hoist 的 3.x（或因 hoist 排除而缺失），
 * 故此处将 vue / mand-mobile 显式 alias 到本工程锁定的 2.7.16 产物，
 * 并内联 mand-mobile 使其经 vite 解析（hoist 层已在 pnpm-workspace.yaml 排除 vue）。
 */
export default defineConfig({
  resolve: {
    alias: {
      vue: fileURLToPath(new URL('./node_modules/vue/dist/vue.runtime.esm.js', import.meta.url)),
      'mand-mobile': fileURLToPath(
        new URL('./node_modules/mand-mobile/lib/mand-mobile.esm.js', import.meta.url),
      ),
    },
  },
  test: {
    name: 'golden',
    environment: 'jsdom',
    include: ['test/**/*.spec.ts'],
    server: {
      deps: {
        inline: ['mand-mobile'],
      },
    },
  },
})

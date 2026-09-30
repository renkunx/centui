import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const pkgRoot = dirname(fileURLToPath(import.meta.url))

/**
 * lib 构建：主入口 + per-component 按需入口，esm + cjs 双格式。
 * 与 Vue 包同构：样式不打入组件，统一由 @centui/styles 提供。
 */
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      entryRoot: 'src',
    }),
  ],
  build: {
    lib: {
      entry: collectEntries(),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      output: { exports: 'named' },
      // 函数式 external：react 家族全子路径（react-dom/client、jsx-runtime 等）
      // 必须保持 external——此前漏掉 react-dom/client 导致 react-dom + scheduler
      // 以 CJS interop 打进 ESM 产物，在纯 ESM 环境（vite dev 直引 dist）运行时
      // require("react") 崩溃
      external: id =>
        id === 'react' ||
        id.startsWith('react/') ||
        id === 'react-dom' ||
        id.startsWith('react-dom/') ||
        id === '@centui/core' ||
        id.startsWith('@centui/core/'),
    },
  },
})

/** 入口：src/index.ts + 每个 src/<component>.ts 按需入口 */
function collectEntries(): Record<string, string> {
  const entries: Record<string, string> = { index: join(pkgRoot, 'src/index.ts') }
  for (const file of readdirSync(join(pkgRoot, 'src'))) {
    const match = /^(.+)\.tsx?$/.exec(file)
    if (match && match[1] !== 'index') {
      entries[match[1]] = join(pkgRoot, 'src', file)
    }
  }
  return entries
}

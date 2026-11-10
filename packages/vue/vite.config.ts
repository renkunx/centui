import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

const pkgRoot = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'))

/**
 * lib 构建：主入口 + per-component 按需入口（centui/es/<name>），esm + cjs 双格式。
 * 样式不打入组件，统一由 @centui/styles 提供（Vue/React 共享同一份 CSS）。
 */
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      entryRoot: 'src',
    }),
  ],
  define: {
    // 包版本注入（src/index.ts 的 VERSION），消除与 package.json 的手工同步漂移
    'globalThis.__CENTUI_VERSION__': JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      entry: collectEntries(),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // 与 react 包对齐：混合导出（default + CuXxx named）下保证 CJS 消费者拿到命名导出
      output: { exports: 'named' },
      external: ['vue', '@centui/core', '@centui/core/web'],
    },
  },
})

/** 入口：src/index.ts + 每个 src/<component>.ts 按需入口 */
function collectEntries(): Record<string, string> {
  const entries: Record<string, string> = { index: join(pkgRoot, 'src/index.ts') }
  for (const file of readdirSync(join(pkgRoot, 'src'))) {
    const match = /^(.+)\.ts$/.exec(file)
    if (match && match[1] !== 'index') {
      entries[match[1]] = join(pkgRoot, 'src', file)
    }
  }
  return entries
}

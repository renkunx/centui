import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const pkgRoot = dirname(fileURLToPath(import.meta.url))

/**
 * lib 构建：主入口 + per-component 按需入口，esm + cjs 双格式。
 * 与 Vue 包同构：样式不打入组件，统一由 @mand-mobile/styles 提供。
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
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@mand-mobile/core',
        '@mand-mobile/core/web',
      ],
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

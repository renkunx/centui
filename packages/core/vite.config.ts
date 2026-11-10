import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

/**
 * lib 构建：主入口（DOM-free）+ /web 子入口，esm + cjs 双格式。
 * React/Vue Web 端按需引 @centui/core/web；RN/小程序只引主入口。
 */
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

export default defineConfig({
  // 构建时注入包版本，src/index.ts 的 CORE_VERSION 不再手写字面量（避免与 package.json 脱节）
  define: {
    __CORE_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      entryRoot: 'src',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        web: 'src/web/index.ts',
      },
      formats: ['es', 'cjs'],
    },
  },
})

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

/**
 * lib 构建：主入口（DOM-free）+ /web 子入口，esm + cjs 双格式。
 * React/Vue Web 端按需引 @centui/core/web；RN/小程序只引主入口。
 */
export default defineConfig({
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

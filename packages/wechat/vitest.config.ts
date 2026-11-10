import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * @centui/wechat 逻辑层测试（node 环境）：
 * 用 tests/helpers/weapp.ts 的 Component() 捕获桩 + mountDef 直接实例化组件源码，
 * 覆盖 data/observers/methods/lifetimes 与纯逻辑；渲染层行为依赖开发者工具模拟器，
 * 不在 vitest 覆盖范围（见 PORTING_SPEC.md §10）。
 *
 * icon-map 是构建期虚拟模块（esbuild iconMapPlugin 求值 default-svg-list 生成
 * name → data-URI 表）；node 测试环境以 resolveId 插件解析到测试替身
 * （tests/helpers/icon-map-stub.ts）。注意 alias 不匹配相对路径导入，必须用 resolveId。
 *
 * 覆盖率门禁：行/语句/函数 ≥ 90%，分支 ≥ 80%（对齐仓库最严档 core 的标准，
 * wechat 逻辑层不含 DOM 分支，90/80 是可达成且有效的"全覆盖"工程门禁）。
 */
const iconMapStub = fileURLToPath(new URL('./tests/helpers/icon-map-stub.ts', import.meta.url))

const iconMapStubPlugin = {
  name: 'centui-icon-map-stub',
  resolveId(source: string) {
    if (source.endsWith('shared/icon-map')) return iconMapStub
    return null
  },
}

export default defineConfig({
  plugins: [iconMapStubPlugin],
  test: {
    name: 'wechat',
    environment: 'node',
    include: ['tests/logic/**/*.spec.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/shared/icon-map.d.ts'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
})

import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * @centui/wechat 逻辑层测试（node 环境）：
 * 只测纯逻辑（shared 内核与各组件可测逻辑），组件渲染行为依赖开发者工具真机/模拟器，
 * 不在 vitest 覆盖范围（见 PORTING_SPEC.md §10）。
 *
 * icon-map 是构建期虚拟模块（esbuild iconMapPlugin 求值 default-svg-list 生成
 * name → data-URI 表）；node 测试环境以 resolveId 插件解析到测试替身
 * （tests/helpers/icon-map-stub.ts，仅需「已知名有值、未知名缺失」的形状）。
 * 注意 alias 不匹配相对路径导入，必须用 resolveId 钩子。
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
  },
})

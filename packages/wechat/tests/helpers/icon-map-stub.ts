/**
 * icon-map 虚拟模块的测试替身：构建期由 scripts/build-js.mjs 的 iconMapPlugin
 * 把 packages/vue/src/components/icon/default-svg-list.ts 求值为 name → data-URI 表。
 * node 测试环境无法走 esbuild 虚拟模块，vitest 以别名解析到本文件；
 * 仅需「已知名有值、未知名缺失」的形状，URI 内容不影响逻辑断言。
 */
export const ICON_MAP: Record<string, string> = {
  success: 'data:image/svg+xml;charset=utf-8,%3Csvg%3Esuccess%3C/svg%3E',
  warn: 'data:image/svg+xml;charset=utf-8,%3Csvg%3Ewarn%3C/svg%3E',
  spinner: 'data:image/svg+xml;charset=utf-8,%3Csvg%3Espinner%3C/svg%3E',
  'arrow-right': 'data:image/svg+xml;charset=utf-8,%3Csvg%3Earrow%3C/svg%3E',
  'arrow-left': 'data:image/svg+xml;charset=utf-8,%3Csvg%3Earrow-left%3C/svg%3E',
}

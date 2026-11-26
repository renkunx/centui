# @centui/wechat

## 0.1.1

### Patch Changes

- 8c5f732: 补齐三端公共 API 面并统一跨框架逻辑：

  - Vue 包补齐 20 个、React 包补齐 2 个此前只存在于主入口的按需子路径（`*/es/<component>`），移动端可按组件引入
  - Chart 几何/极值/点位换算收敛到 `@centui/core`，Vue/React 修复空数据、单点、非有限值与退化区间产生 `NaN/Infinity` 的问题
  - 微信包 date-picker 列生成、input-item 格式化直接复用 `@centui/core`，删除两份手工同步副本
  - 新增 `pnpm verify:api`：校验按需入口、package exports、三端组件覆盖、文档与样式源，CI 前置执行
  - 微信包补上 `test:coverage` 门禁（90/80），覆盖率执行改为包间/文件串行，消除 jsdom 并发抖动

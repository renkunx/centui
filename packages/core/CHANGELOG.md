# @centui/core

## 0.3.0

### Minor Changes

- 8c5f732: 补齐三端公共 API 面并统一跨框架逻辑：

  - Vue 包补齐 20 个、React 包补齐 2 个此前只存在于主入口的按需子路径（`*/es/<component>`），移动端可按组件引入
  - Chart 几何/极值/点位换算收敛到 `@centui/core`，Vue/React 修复空数据、单点、非有限值与退化区间产生 `NaN/Infinity` 的问题
  - 微信包 date-picker 列生成、input-item 格式化直接复用 `@centui/core`，删除两份手工同步副本
  - 新增 `pnpm verify:api`：校验按需入口、package exports、三端组件覆盖、文档与样式源，CI 前置执行
  - 微信包补上 `test:coverage` 门禁（90/80），覆盖率执行改为包间/文件串行，消除 jsdom 并发抖动

## 0.2.0

### Minor Changes

- 72d131c: M2 里程碑：core（scroller/i18n/utils，90/85 覆盖率门禁达标）与 styles（50 组件样式抽取 + 编译流水线，与 v2.7.0 产物 0 缺失选择器）首次进入 changesets 版本管理。

### Patch Changes

- a45eab9: Scroller 补回 v2 契约字段 \_isGesturing：修复迁移遗漏导致双框架 Picker 确认回调被滚动状态守卫永久吞掉的问题（真实浏览器 e2e 捕获）。

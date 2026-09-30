# @centui/core

## 0.2.0

### Minor Changes

- 72d131c: M2 里程碑：core（scroller/i18n/utils，90/85 覆盖率门禁达标）与 styles（50 组件样式抽取 + 编译流水线，与 v2.7.0 产物 0 缺失选择器）首次进入 changesets 版本管理。

### Patch Changes

- a45eab9: Scroller 补回 v2 契约字段 \_isGesturing：修复迁移遗漏导致双框架 Picker 确认回调被滚动状态守卫永久吞掉的问题（真实浏览器 e2e 捕获）。

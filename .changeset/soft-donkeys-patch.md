---
'@centui/core': patch
---

Scroller 补回 v2 契约字段 \_isGesturing：修复迁移遗漏导致双框架 Picker 确认回调被滚动状态守卫永久吞掉的问题（真实浏览器 e2e 捕获）。

# centui

## 3.1.0

### Minor Changes

- 3781101: Vue Swiper 事件 `after-change` 更名为 `afterChange`，与 legacy v2（`@afterChange(from, to)`）、React（`onAfterChange`）及微信小程序端统一为 camelCase；`beforeChange` 本就是 camelCase，不受影响。Vue 模板中 kebab 监听（`@after-change`）编译后同样命中 `onAfterChange`，多数存量代码不受影响，但请按文档改用 `@afterChange`。

  同步顺带：微信小程序端 swiper/image-viewer 头注释中"Vue 事件命名不一致"的差异记录一并移除（差异已消除）。

- 8c5f732: 补齐三端公共 API 面并统一跨框架逻辑：

  - Vue 包补齐 20 个、React 包补齐 2 个此前只存在于主入口的按需子路径（`*/es/<component>`），移动端可按组件引入
  - Chart 几何/极值/点位换算收敛到 `@centui/core`，Vue/React 修复空数据、单点、非有限值与退化区间产生 `NaN/Infinity` 的问题
  - 微信包 date-picker 列生成、input-item 格式化直接复用 `@centui/core`，删除两份手工同步副本
  - 新增 `pnpm verify:api`：校验按需入口、package exports、三端组件覆盖、文档与样式源，CI 前置执行
  - 微信包补上 `test:coverage` 门禁（90/80），覆盖率执行改为包间/文件串行，消除 jsdom 并发抖动

### Patch Changes

- Updated dependencies [8c5f732]
  - @centui/core@0.3.0

## 3.0.0

### Patch Changes

- a45eab9: v2 兼容：Ruler/TabBar/TextareaItem 支持 modelValue（未传时回退 v2 的 value）；skeleton 根节点撑满宽度。
- Updated dependencies [72d131c]
- Updated dependencies [a45eab9]
  - @centui/core@0.2.0

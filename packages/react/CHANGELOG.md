# @centui/react

## 0.2.0

### Minor Changes

- 3781101: React `CuInputItem` 的 `onChange` 参数序从 `(value, name)` 对齐为 **`(name, value)`**，与 legacy v2 的 `@change(name, value)`、Vue 端 `change` 事件及三端事件语义一致。此前 React 端参数序与其他两端相反，双端共用代码或 v2 迁移时取值会错位。

  同步顺带：`@centui/wechat` 的 `@centui/core` 从 dependencies 移到 devDependencies——小程序构建已将 core 内联进各组件 bundle，运行时不产生该依赖，避免发布产物误导用户往 miniprogram_npm 装 core。

- 8c5f732: 补齐三端公共 API 面并统一跨框架逻辑：

  - Vue 包补齐 20 个、React 包补齐 2 个此前只存在于主入口的按需子路径（`*/es/<component>`），移动端可按组件引入
  - Chart 几何/极值/点位换算收敛到 `@centui/core`，Vue/React 修复空数据、单点、非有限值与退化区间产生 `NaN/Infinity` 的问题
  - 微信包 date-picker 列生成、input-item 格式化直接复用 `@centui/core`，删除两份手工同步副本
  - 新增 `pnpm verify:api`：校验按需入口、package exports、三端组件覆盖、文档与样式源，CI 前置执行
  - 微信包补上 `test:coverage` 门禁（90/80），覆盖率执行改为包间/文件串行，消除 jsdom 并发抖动

### Patch Changes

- Updated dependencies [8c5f732]
  - @centui/core@0.3.0

## 0.1.1

### Patch Changes

- a45eab9: 修复四项缺陷：ESM 产物泄漏 CJS require("react")（纯 ESM 环境崩溃，发行阻塞）、Stepper 受控初始值被 min/max 收敛 effect 错误钳位、Picker 无 defaultValue 时 confirm 返回空列值、TextareaItem maxlength 属性名告警。
- Updated dependencies [72d131c]
- Updated dependencies [a45eab9]
  - @centui/core@0.2.0

---
'@centui/react': minor
---

React `CuInputItem` 的 `onChange` 参数序从 `(value, name)` 对齐为 **`(name, value)`**，与 legacy v2 的 `@change(name, value)`、Vue 端 `change` 事件及三端事件语义一致。此前 React 端参数序与其他两端相反，双端共用代码或 v2 迁移时取值会错位。

同步顺带：`@centui/wechat` 的 `@centui/core` 从 dependencies 移到 devDependencies——小程序构建已将 core 内联进各组件 bundle，运行时不产生该依赖，避免发布产物误导用户往 miniprogram_npm 装 core。

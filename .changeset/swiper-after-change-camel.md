---
'centui': minor
---

Vue Swiper 事件 `after-change` 更名为 `afterChange`，与 legacy v2（`@afterChange(from, to)`）、React（`onAfterChange`）及微信小程序端统一为 camelCase；`beforeChange` 本就是 camelCase，不受影响。Vue 模板中 kebab 监听（`@after-change`）编译后同样命中 `onAfterChange`，多数存量代码不受影响，但请按文档改用 `@afterChange`。

同步顺带：微信小程序端 swiper/image-viewer 头注释中"Vue 事件命名不一致"的差异记录一并移除（差异已消除）。

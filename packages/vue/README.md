# mand-mobile（Vue 3 版）

mand-mobile v3 的 Vue 3 实现。组件逻辑与 `@mand-mobile/core` 共享，样式来自
`@mand-mobile/styles`（与 v2 同源 CSS，Vue / React / 小程序多端复用同一份产物）。

## 安装

```bash
pnpm add mand-mobile@3 @mand-mobile/styles
```

`mand-mobile` 的 peer 依赖为 `vue >= 3.4`。

## 使用

全量引入（样式按需引入组件 CSS 或全量）：

```ts
import { createApp } from 'vue'
import { MdButton } from 'mand-mobile'
import '@mand-mobile/styles/es/button.css'

createApp(App).use(/* 组件按需注册 */)
```

按需引入（`sideEffects: false`，tree-shaking 友好）：

```ts
import { MdButton } from 'mand-mobile/es/button'
import '@mand-mobile/styles/es/button.css'
```

表单类组件的 `v-model` 对应 `modelValue` / `update:modelValue`（Switch、Agree、Stepper）。

## 首批组件（12）

基础：Button、Icon、Tag、Amount、CellItem、Skeleton、NoticeBar、ActivityIndicator、Progress
表单：Switch、Agree、Stepper

## 约定

- 组件标记结构与 v2.7.0 逐场景对齐（L3 golden 契约，见 `test/golden-v3.spec.ts`，
  基线由 `test/golden` 工程以 vue2.7 + mand-mobile@2.7.0 渲染产出）
- 组件不内嵌样式，CSS 统一由 `@mand-mobile/styles` 提供
- 纯逻辑（金额格式化、中文大写等）下沉 `@mand-mobile/core`，供 React 版复用

## 开发

```bash
pnpm test              # L2 组件测试 + L3 golden 对比
pnpm test:coverage     # 覆盖率门禁（行/分支 ≥ 80%）
pnpm typecheck         # vue-tsc
pnpm build             # vite lib（esm/cjs + d.ts，per-component 入口）
pnpm playground        # 组件展示页（vite dev）
```

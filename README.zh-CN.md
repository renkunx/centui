<h2 align="center">CentUI</h2>
<p align="center">面向金融场景的移动端 UI 组件库，基于 Vue 3 与 React——<a href="https://github.com/didi/mand-mobile">mand-mobile</a> 的延续之作。</p>
<p align="center">
  <a href="https://github.com/renkunx/centui/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/renkunx/centui/ci.yml?branch=master&style=flat-square" alt="Build Status"></a>
  <a href="https://www.npmjs.org/package/centui"><img src="https://img.shields.io/npm/v/centui.svg?style=flat-square" alt="npm package"></a>
  <a href="https://www.npmjs.org/package/centui"><img src="https://img.shields.io/npm/l/centui.svg?style=flat-square" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3"></a>
  <a href="#"><img src="https://img.shields.io/badge/React-18+-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 18"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://github.com/renkunx/centui/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs welcome"></a>
</p>

[English](./README.md) | **中文**

**CentUI** 是一套面向金融场景的移动端 UI 组件库，源自滴滴开源的 [mand-mobile](https://github.com/didi/mand-mobile)：在其基础上完成 Vue 3 重写与 React 移植，并更名为 centui——同时忠实保留 mand-mobile v2 的视觉与渲染契约。

> **当前状态**：v3 alpha（`3.0.0-alpha.0`），API 趋于稳定，GA 前仍可能有调整。

## 特性

- **Vue 3 + React 双框架**——两套一等公民组件，共享同一份样式（`@centui/styles`）与跨框架逻辑（`@centui/core`）
- **55+ 金融场景组件**——表单、键盘、弹层、图表、收银台、车牌、图片读取等
- **渲染契约保障**——每个组件的渲染 HTML 均通过 L3 golden 测试与 `mand-mobile@2.7.0` 契约比对，从 mand-mobile v2 迁移视觉不回归
- **按需加载**——组件按需入口（`centui/es/<component>`）+ 按需样式（`@centui/styles/es/<name>.css`）
- **主题定制**——设计令牌以 Stylus 维护，并通过 CSS 自定义属性（`--color-primary` 等）暴露
- **全量 TypeScript**
- **命令式 API**——`Toast`、`Dialog`、`ActionSheet` 既可组件化使用，也可命令式调用

## 包一览

| 包 | 说明 |
| --- | --- |
| [`centui`](https://www.npmjs.org/package/centui) | Vue 3 组件库 |
| [`@centui/react`](https://www.npmjs.org/package/@centui/react) | React 18 组件库（与 Vue 版同名组件、同份样式） |
| [`@centui/styles`](https://www.npmjs.org/package/@centui/styles) | 设计令牌与组件样式（Stylus 源码 + 编译产物），双框架共享 |
| [`@centui/core`](https://www.npmjs.org/package/@centui/core) | 跨框架核心：滚动引擎、i18n、工具库 |

## 安装

要求 Vue ≥ 3.4 或 React ≥ 18。

```bash
# Vue 3
npm install centui @centui/styles

# React
npm install @centui/react @centui/styles
```

## 使用

### Vue 3

组件样式不内嵌在 JS 中：可全量引入一份全局样式，也可按组件按需加载。

```ts
// main.ts —— 全量引入
import { createApp } from 'vue'
import App from './App.vue'
import 'centui'
import '@centui/styles/global.css'

createApp(App).mount('#app')
```

```vue
<!-- 按需引入 -->
<script setup lang="ts">
import { CuButton } from 'centui'
import '@centui/styles/es/button.css'
</script>

<template>
  <CuButton type="primary" round>主要按钮</CuButton>
</template>
```

### React

```tsx
import { CuButton } from '@centui/react'
import '@centui/styles/es/button.css'

export default function App() {
  return <CuButton type="primary" round>主要按钮</CuButton>
}
```

### 命令式 API

```ts
import { Toast, Dialog, ActionSheet } from 'centui'

Toast.info('操作成功')
Dialog.confirm({ content: '确认删除该条记录？' })
ActionSheet.create({ title: '请选择', options: [{ text: '拍照' }, { text: '相册' }] })
```

### 主题定制

覆盖 CSS 自定义属性即可整体换肤：

```css
:root {
  --color-primary: #198cff;
  --radius-normal: 16px;
}
```

## 组件总览

- **通用** —— Icon、ActivityIndicator（Roller / Spinner / RollerSuccess）、Button、Tag、Amount、CellItem、Skeleton、NoticeBar、Progress、Switch、Agree、WaterMark、Transition、ActionBar、DetailItem
- **弹层与反馈** —— Popup、PopupTitleBar、Toast、Dialog、ActionSheet、Tip、ResultPage、Landscape、Captcha
- **表单** —— Field、FieldItem、InputItem、TextareaItem、Check、CheckBox、CheckGroup、CheckList、Radio、RadioBox、RadioGroup、RadioList、Stepper、Codebox、NumberKeyboard、Picker、DatePicker、Slider、LicensePlate
- **滚动与导航** —— ScrollView、ScrollViewRefresh、ScrollViewMore、Swiper、Tabs、TabBar、TabPane、Steps、Ruler、Selector、DropMenu、TabPicker、Bill
- **画布与金融** —— Chart、ImageReader、ImageViewer、Cashier

各组件的可交互预览与完整 props / events / slots 表见文档站（见下方链接）。组件名使用 `Cu` 前缀（`CuButton`、`CuPopup`…），样式类名使用 `cu-` 前缀（`.cu-button`）。

## 链接

- [GitHub](https://github.com/renkunx/centui)
- [文档站](https://renkunx.github.io/centui/)

## 本地开发

本仓库为 pnpm monorepo（要求 Node.js ≥ 20）。

```bash
git clone git@github.com:renkunx/centui.git
cd centui
pnpm install

pnpm docs:dev     # 文档站 http://localhost:4321（组件实时预览）
pnpm playground   # Vue 组件 playground
pnpm test         # 单测 + L3 golden 对比
pnpm build        # 构建全部包
```

### 仓库结构

| 目录 | 内容 |
| --- | --- |
| `packages/vue` | `centui` —— Vue 3 组件 |
| `packages/react` | `@centui/react` —— React 18 组件 |
| `packages/core` | `@centui/core` —— 跨框架逻辑 |
| `packages/styles` | `@centui/styles` —— Stylus 源码、设计令牌、编译产物 |
| `docs` | 文档站（Astro + Starlight，Vue/React 实时预览） |
| `test/golden` | L3 golden 基线（采集自 `mand-mobile@2.7.0`） |
| `legacy` | mand-mobile v2（Vue 2）源码冻结存档，仅供参考 |

## 致谢 —— 基于 mand-mobile

centui 衍生自滴滴开源的 [mand-mobile](https://github.com/didi/mand-mobile)，原项目版权归 **Beijing Didi Infinity Technology and Development Co.,Ltd.** 所有，遵循 [Apache License 2.0](LICENSE) 开源。

centui 在其基础上做了大量修改：Vue 3 重写、全新 React 实现、品牌更名（包名 `centui` / `@centui/*`、组件前缀 `Cu`、样式前缀 `cu-`）、工具链现代化。原 v2 源码保留在 [`legacy/`](legacy) 目录，并继续作为 golden 渲染契约的参考基准。

没有 mand-mobile 与滴滴的开源，就不会有这个项目，特此致谢。

## 许可证

[Apache License 2.0](LICENSE)。原 mand-mobile 代码的版权仍归 Beijing Didi Infinity Technology and Development Co.,Ltd. 所有；centui 中的修改与新增内容以同一许可证发布。

<p align="center">
  <img src="docs/public/favicon.png" width="120" alt="CentUI logo">
</p>
<h2 align="center">CentUI</h2>
<p align="center">A mobile UI toolkit for financial scenarios, built on Vue 3 & React — the successor of <a href="https://github.com/didi/mand-mobile">mand-mobile</a>.</p>
<p align="center">
  <a href="https://github.com/renkunx/centui/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/renkunx/centui/ci.yml?branch=master&style=flat-square" alt="Build Status"></a>
  <a href="https://www.npmjs.org/package/centui"><img src="https://img.shields.io/npm/v/centui.svg?style=flat-square" alt="npm package"></a>
  <a href="https://www.npmjs.org/package/centui"><img src="https://img.shields.io/npm/l/centui.svg?style=flat-square" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3"></a>
  <a href="#"><img src="https://img.shields.io/badge/React-18+-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 18"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://github.com/renkunx/centui/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs welcome"></a>
</p>

**English** | [中文](./README.zh-CN.md)

**CentUI** is a mobile UI component library for financial scenarios. It is the continuation of [mand-mobile](https://github.com/didi/mand-mobile) (by Didi): the component library has been rewritten on Vue 3, ported to React, and rebranded — while staying faithful to the look, feel, and rendering contract of mand-mobile v2.

> **Status**: v3 alpha (`3.0.0-alpha.0`). The API is stabilizing but may still change before GA.

## Features

- **Vue 3 + React, one design** — first-class components for both frameworks, sharing the same styles (`@centui/styles`) and the same framework-agnostic logic (`@centui/core`)
- **55+ components** for financial scenarios — forms, keyboards, popups, charts, cashier, license plate, image reader, and more
- **Rendering contract guaranteed** — every component's rendered HTML is verified by L3 golden tests against the `mand-mobile@2.7.0` contract, so migration from mand-mobile v2 keeps visuals intact
- **On-demand loading** — per-component JS entries (`centui/es/<component>`) and per-component CSS (`@centui/styles/es/<name>.css`)
- **Theme customization** — design tokens in Stylus, exposed as CSS custom properties (`--color-primary`, …)
- **TypeScript** throughout
- **Imperative APIs** — `Toast`, `Dialog`, `ActionSheet` work as components and as imperative calls

## Packages

| Package | Description |
| --- | --- |
| [`centui`](https://www.npmjs.org/package/centui) | Vue 3 component library |
| [`@centui/react`](https://www.npmjs.org/package/@centui/react) | React 18 component library (same components & styles) |
| [`@centui/styles`](https://www.npmjs.org/package/@centui/styles) | Design tokens & component styles (Stylus sources + compiled CSS), shared by both frameworks |
| [`@centui/core`](https://www.npmjs.org/package/@centui/core) | Framework-agnostic core: scroller engine, i18n, utils |

## Install

Requires Vue ≥ 3.4 or React ≥ 18.

```bash
# Vue 3
npm install centui @centui/styles

# React
npm install @centui/react @centui/styles
```

## Usage

### Vue 3

Component styles are not bundled inside the JS. Import the global stylesheet once, or load styles per component.

```ts
// main.ts — full import
import { createApp } from 'vue'
import App from './App.vue'
import 'centui'
import '@centui/styles/global.css'

createApp(App).mount('#app')
```

```vue
<!-- on-demand import -->
<script setup lang="ts">
import { CuButton } from 'centui'
import '@centui/styles/es/button.css'
</script>

<template>
  <CuButton type="primary" round>Primary</CuButton>
</template>
```

### React

```tsx
import { CuButton } from '@centui/react'
import '@centui/styles/es/button.css'

export default function App() {
  return <CuButton type="primary" round>Primary</CuButton>
}
```

### Imperative APIs

```ts
import { Toast, Dialog, ActionSheet } from 'centui'

Toast.info('Saved')
Dialog.confirm({ content: 'Delete this record?' })
ActionSheet.create({ title: 'Choose', options: [{ text: 'Camera' }, { text: 'Album' }] })
```

### Theming

Override the CSS custom properties to re-theme the whole library:

```css
:root {
  --color-primary: #198cff;
  --radius-normal: 16px;
}
```

## Components

- **General** — Icon, ActivityIndicator (Roller / Spinner / RollerSuccess), Button, Tag, Amount, CellItem, Skeleton, NoticeBar, Progress, Switch, Agree, WaterMark, Transition, ActionBar, DetailItem
- **Popups & Feedback** — Popup, PopupTitleBar, Toast, Dialog, ActionSheet, Tip, ResultPage, Landscape, Captcha
- **Form** — Field, FieldItem, InputItem, TextareaItem, Check, CheckBox, CheckGroup, CheckList, Radio, RadioBox, RadioGroup, RadioList, Stepper, Codebox, NumberKeyboard, Picker, DatePicker, Slider, LicensePlate
- **Scroll & Navigation** — ScrollView, ScrollViewRefresh, ScrollViewMore, Swiper, Tabs, TabBar, TabPane, Steps, Ruler, Selector, DropMenu, TabPicker, Bill
- **Canvas & Finance** — Chart, ImageReader, ImageViewer, Cashier

Component pages with live previews and full props / events / slots tables live in the docs site (see below). Component names use the `Cu` prefix (`CuButton`, `CuPopup`, …) and CSS classes use the `cu-` prefix (`.cu-button`).

## Links

- [GitHub](https://github.com/renkunx/centui)
- [Docs (Chinese)](https://renkunx.github.io/centui/)

## Development

This repository is a pnpm monorepo (Node.js ≥ 20).

```bash
git clone git@github.com:renkunx/centui.git
cd centui
pnpm install

pnpm docs:dev     # docs site at http://localhost:4321 (live component previews)
pnpm playground   # Vue component playground
pnpm test         # unit tests + L3 golden comparison
pnpm build        # build all packages
```

### Repository layout

| Directory | Content |
| --- | --- |
| `packages/vue` | `centui` — Vue 3 components |
| `packages/react` | `@centui/react` — React 18 components |
| `packages/core` | `@centui/core` — framework-agnostic logic |
| `packages/styles` | `@centui/styles` — Stylus sources, design tokens, compiled CSS |
| `docs` | Docs site (Astro + Starlight, live Vue/React previews) |
| `test/golden` | L3 golden baselines captured from `mand-mobile@2.7.0` |
| `legacy` | Frozen source archive of mand-mobile v2 (Vue 2), reference only |

## Credits — based on mand-mobile

centui is derived from [mand-mobile](https://github.com/didi/mand-mobile), originally developed by **Beijing Didi Infinity Technology and Development Co.,Ltd.** and licensed under the [Apache License 2.0](LICENSE).

centui continues that work with significant changes, including a Vue 3 rewrite, a new React implementation, a rebrand (packages `centui` / `@centui/*`, component prefix `Cu`, CSS prefix `cu-`), and a modernized toolchain. The original v2 source is preserved under [`legacy/`](legacy) and still serves as the reference for the golden rendering contract.

Without mand-mobile and Didi's open-sourcing of it, this project would not exist. Thank you.

## License

[Apache License 2.0](LICENSE). Copyright of the original mand-mobile code remains with Beijing Didi Infinity Technology and Development Co.,Ltd.; changes and additions in centui are licensed under the same license.

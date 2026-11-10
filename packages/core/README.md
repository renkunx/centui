# @centui/core

Framework-agnostic core of CentUI — a mobile UI toolkit for financial scenarios, the successor of mand-mobile v2. Contains the shared logic used by both the Vue package (`centui`) and `@centui/react`: scroller engine, i18n, and utils.

- **DOM-free main entry** — pure logic (`@centui/core`), usable in RN / mini-program targets
- **`/web` subentry** — DOM-backed implementations (`@centui/core/web`) consumed by the web framework packages

## Install

This package is a runtime dependency of `centui` and `@centui/react` and rarely needs direct installation:

```bash
npm install @centui/core
```

## Usage

```ts
import { ... } from '@centui/core'      // DOM-free logic
import { ... } from '@centui/core/web'  // DOM-backed implementations (web)
```

## Links

- [Main README](../../README.md) — full component list, theming, imperative APIs
- [Docs (Chinese)](https://renkunx.github.io/centui/)
- [`centui` (Vue 3)](https://www.npmjs.org/package/centui) · [`@centui/react`](https://www.npmjs.org/package/@centui/react) · [`@centui/styles`](https://www.npmjs.org/package/@centui/styles)

# @centui/react

React implementation of CentUI — a mobile UI toolkit for financial scenarios, the successor of mand-mobile v2. Shares `@centui/core` logic and `@centui/styles` CSS with the Vue package (`centui`), so both frameworks render pixel-identical components.

## Install

```bash
npm install @centui/react @centui/styles
```

Requires React ≥ 18. `@centui/styles` is a peer dependency — keep it installed in the same version pairing as `@centui/react`.

## Usage

Component styles are not bundled inside the JS. Import the global stylesheet once, or load styles per component.

```tsx
import { CuButton } from '@centui/react'
import '@centui/styles/es/button.css'

export default function App() {
  return <CuButton type="primary" round>Primary</CuButton>
}
```

On-demand imports follow the `@centui/react/es/<component>` pattern (e.g. `@centui/react/es/dialog`), mirroring the exports map.

## Links

- [Main README](../../README.md) — full component list, theming (CSS custom properties), imperative APIs
- [Docs (Chinese)](https://renkunx.github.io/centui/)
- [`centui` (Vue 3)](https://www.npmjs.org/package/centui) · [`@centui/styles`](https://www.npmjs.org/package/@centui/styles) · [`@centui/core`](https://www.npmjs.org/package/@centui/core)

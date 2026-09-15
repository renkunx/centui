/**
 * mand-mobile v3（Vue 3 版）主入口。
 *
 * 样式不内嵌：请配合 @mand-mobile/styles 使用，按需引入
 * `@mand-mobile/styles/es/<component>.css` 或全量 `@mand-mobile/styles`。
 */
export const VERSION = '3.0.0-alpha.0'

export * from './components/icon'
export * from './components/activity-indicator'
export * from './components/button'
export * from './components/tag'
export * from './components/amount'
export * from './components/cell-item'
export * from './components/skeleton'
export * from './components/notice-bar'
export * from './components/progress'
export * from './components/switch'
export * from './components/agree'
export * from './components/stepper'

export type { ComponentName } from './components'

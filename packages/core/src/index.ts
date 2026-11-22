/**
 * @centui/core 主入口 —— 严格 DOM-free。
 * 浏览器专属模块（dom/render/scroller）在 ./web 子入口，
 * 供 Vue/React Web 端引用；RN 与小程序端只依赖本入口。
 */

// 构建时由 vite define 注入真实包版本（见 vite.config.ts）；vitest / 直接引源码时走 fallback。
declare const __CORE_VERSION__: string | undefined

export const CORE_VERSION: string =
  typeof __CORE_VERSION__ === 'undefined' ? '0.2.0' : __CORE_VERSION__

export * from './lang'
export * from './format'
export * from './animate'
export * from './chart'
export * from './store'
export * from './env'
export * from './debug'
export * from './locale'
export { cascade } from './picker/cascade'
export type { CascadeNode, CascadeOptions, CascadePickerLike } from './picker/cascade'
export { buildDateColumns, formatDate, getDateColumnGenerators } from './picker/date'
export type {
  DateColumnGenerator,
  DateColumnItem,
  DateColumnType,
  DateColumnTypeFormat,
  DatePickerColumnOptions,
  DatePickerColumns,
  PrevColumnRef,
} from './picker/date'

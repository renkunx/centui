/**
 * @mand-mobile/core 主入口 —— 严格 DOM-free。
 * 浏览器专属模块（dom/render/scroller）在 ./web 子入口，
 * 供 Vue/React Web 端引用；RN 与小程序端只依赖本入口。
 */
export const CORE_VERSION = '0.1.0'

export * from './lang'
export * from './format'
export * from './animate'
export * from './store'
export * from './env'
export * from './debug'

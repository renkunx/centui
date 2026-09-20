/**
 * @centui/core/web 子入口 —— 浏览器专属模块。
 */
export { mdDocument, mdBody, dom } from './dom'
export type { CuDocument, CuBody } from './dom'
export { render, marginRender, translateRender, translate3dRender, detectTransformRender } from './render'
export type { RenderFn } from './render'
export { getDpr, requireRemoteScript, functionToUrl } from './lang'
export { Animate } from './animate'
export type { AnimateRunner, EasingMethod } from './animate'
export { Scroller } from './scroller'
export type {
  ScrollerOptions,
  ScrollCallback,
  ScrollMax,
  ScrollValues,
  TouchPoint,
} from './scroller'

/**
 * @mand-mobile/core/web 子入口 —— 浏览器专属模块。
 */
export { mdDocument, mdBody, dom } from './dom'
export type { MdDocument, MdBody } from './dom'
export { render, marginRender } from './render'
export type { RenderFn } from './render'
export { getDpr, requireRemoteScript, functionToUrl } from './lang'

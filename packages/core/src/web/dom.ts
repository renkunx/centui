/**
 * SSR 安全的 document/body 别名（自 v2 _util/dom.js 迁移）
 */
import { inBrowser } from '../env'

class DomStub {
  appendChild(): void {}
  removeChild(): void {}
  querySelector(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
}

const dom = new DomStub()
let mdDocument: Document | DomStub = dom

;(mdDocument as { body?: unknown }).body = dom

if (inBrowser) {
  mdDocument = window.document
}

/**
 * mdBody 惰性求值：模块加载可能早于 <body> 存在（经典脚本场景），
 * 一次性捕获会永久持有 null。浏览器侧返回按需解析「当前」document.body 的代理
 * （首次属性访问即取实时 body，body 尚未挂载时回落到 DomStub，不会陈旧）；
 * 非浏览器侧保持 DomStub 原值不变，SSR 行为与 v2 一致。
 */
const lazyBody = new Proxy(dom, {
  get(_target, prop) {
    const body = (inBrowser ? document.body : null) ?? dom
    const value = Reflect.get(body, prop)
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(body) : value
  },
  has(_target, prop) {
    const body = (inBrowser ? document.body : null) ?? dom
    return Reflect.has(body, prop)
  },
  set(_target, prop, newValue) {
    const body = (inBrowser ? document.body : null) ?? dom
    return Reflect.set(body, prop, newValue)
  },
})

export const mdBody: HTMLElement | DomStub = inBrowser ? (lazyBody as unknown as HTMLElement) : dom

export type CuDocument = Document | DomStub
export type CuBody = HTMLElement | DomStub
export { mdDocument, dom }

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
let mdBody: HTMLElement | DomStub = dom

;(mdDocument as { body?: unknown }).body = mdBody

if (inBrowser) {
  mdDocument = window.document
  mdBody = document.body
}

export type MdDocument = Document | DomStub
export type MdBody = HTMLElement | DomStub
export { mdDocument, mdBody, dom }

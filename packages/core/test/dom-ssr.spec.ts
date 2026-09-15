import { describe, expect, it } from 'vitest'
import { dom, mdBody, mdDocument } from '../src/web/dom'

/** node 环境（无 window）下应回落到 DomStub，SSR 安全 */
describe('web/dom SSR 降级', () => {
  it('falls back to inert stubs outside browser', () => {
    expect(typeof window).toBe('undefined')
    expect(mdDocument).toBe(dom)
    expect(mdBody).toBe(dom)
    expect((mdDocument as unknown as { body: unknown }).body).toBe(dom)
  })

  it('stub methods are callable no-ops', () => {
    expect(() => {
      dom.appendChild()
      dom.removeChild()
      dom.querySelector()
      dom.addEventListener()
      dom.removeEventListener()
    }).not.toThrow()
  })
})

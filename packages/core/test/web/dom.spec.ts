import { describe, expect, it } from 'vitest'
import { mdBody, mdDocument } from '../../src/web/dom'

describe('web/dom', () => {
  it('exposes real document in browser', () => {
    expect(mdDocument).toBe(document)
    expect((mdDocument as Document).body).toBe(document.body)
  })

  it('resolves document.body lazily on access and forwards calls', () => {
    const el = document.createElement('div')
    mdBody.appendChild(el)
    expect(document.body.contains(el)).toBe(true)
    mdBody.removeChild(el)
    expect(document.body.contains(el)).toBe(false)
    // 属性读取同样转发到实时 body
    expect((mdBody as HTMLElement).tagName).toBe('BODY')
    expect('appendChild' in mdBody).toBe(true)
  })
})

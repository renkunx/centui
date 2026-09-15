import { describe, expect, it } from 'vitest'
import { mdBody, mdDocument } from '../../src/web/dom'

describe('web/dom', () => {
  it('exposes real document/body in browser', () => {
    expect(mdDocument).toBe(document)
    expect(mdBody).toBe(document.body)
  })

  it('appends children through the aliased document', () => {
    const el = document.createElement('div')
    ;(mdDocument as Document).body.appendChild(el)
    expect(document.body.contains(el)).toBe(true)
    ;(mdDocument as Document).body.removeChild(el)
  })
})

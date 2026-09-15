import { describe, expect, it } from 'vitest'
import { marginRender, render, translate3dRender, translateRender } from '../../src/web/render'

/**
 * jsdom 支持 transform（perspective 支持与否由探测决定），
 * render 命中 transform 系策略；具体 3d 与否以能力探测为准，
 * 断言兼容 translate/translate3d 两种命中。
 */
describe('web/render (detected transform engine)', () => {
  it('applies negative transform for scroll offset', () => {
    const el = document.createElement('div')
    render(el, 10, 20)
    expect(el.style.transform).toMatch(/translate3?d?\(-10px/)
    expect(el.style.transform).toContain('-20px')
  })

  it('applies zoom scale', () => {
    const el = document.createElement('div')
    render(el, 10, 20, 2)
    expect(el.style.transform).toContain('scale(2)')
  })
})

describe('translate3dRender (strategy)', () => {
  it('uses translate3d with native driver', () => {
    const el = document.createElement('div')
    translate3dRender(el, 10, 20)
    expect(el.style.transform).toBe('translate3d(-10px,-20px,0) scale(1)')
  })

  it('falls back to translate without native driver', () => {
    const el = document.createElement('div')
    translate3dRender(el, 10, 20, 1, false)
    expect(el.style.transform).toBe('translate(-10px,-20px) scale(1)')
  })
})

describe('translateRender (strategy)', () => {
  it('uses 2d translate', () => {
    const el = document.createElement('div')
    translateRender(el, 10, 20, 2)
    expect(el.style.transform).toBe('translate(-10px,-20px) scale(2)')
  })
})

describe('marginRender (degraded strategy)', () => {
  it('offsets margins and zoom without transform', () => {
    const el = document.createElement('div')
    marginRender(el, 5, 6, 3)
    expect(el.style.marginLeft).toBe('-5px')
    expect(el.style.marginTop).toBe('-6px')
    expect(el.style.zoom).toBe('3')
    expect(el.style.transform).toBe('')
  })

  it('clears margins for zero offsets', () => {
    const el = document.createElement('div')
    marginRender(el, 10, 20)
    marginRender(el, 0, 0)
    expect(el.style.marginLeft).toBe('')
    expect(el.style.marginTop).toBe('')
  })
})

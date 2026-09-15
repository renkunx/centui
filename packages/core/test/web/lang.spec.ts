import { afterEach, describe, expect, it, vi } from 'vitest'
import { functionToUrl, getDpr, requireRemoteScript } from '../../src/web/lang'

const setViewport = (content: string) => {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', content)
  document.head.appendChild(meta)
  return meta
}

afterEach(() => {
  document.head.innerHTML = ''
})

describe('web getDpr', () => {
  it('returns 1 without viewport meta', () => {
    expect(getDpr()).toBe(1)
  })

  it('derives dpr from initial-scale', () => {
    // v2 契约：content 内逗号后不能有空格，正则才可匹配
    setViewport('width=device-width,initial-scale=0.5')
    expect(getDpr()).toBe(2)
  })

  it('takes the minimum of scale constraints', () => {
    setViewport('width=device-width,initial-scale=1,maximum-scale=2,minimum-scale=0.5')
    expect(getDpr()).toBe(2)
  })

  it('keeps v2 quirk: spaced content is not parsed and falls back to 1', () => {
    setViewport('width=device-width, initial-scale=0.5')
    expect(getDpr()).toBe(1)
  })
})

describe('web requireRemoteScript', () => {
  it('appends an async utf-8 script with the given src', () => {
    requireRemoteScript('https://example.com/a.js')
    const node = document.head.querySelector('script') as HTMLScriptElement
    expect(node).not.toBeNull()
    expect(node.src).toBe('https://example.com/a.js')
    expect(node.async).toBe(true)
    expect(node.charset).toBe('utf-8')
  })
})

describe('web functionToUrl', () => {
  it('creates a blob url for the function', () => {
    const url = functionToUrl(() => 1)
    expect(url).toMatch(/^blob:/)
  })
})

describe('web requireRemoteScript onload', () => {
  it('invokes callback after script loads', () => {
    const cb = vi.fn()
    requireRemoteScript('https://example.com/b.js', cb)
    const node = document.head.querySelector('script') as HTMLScriptElement
    node.dispatchEvent(new Event('load'))
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

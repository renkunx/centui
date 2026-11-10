import {describe, it, expect} from 'vitest'
import {resolveTransition, hasMask, closeIcon, closeColor} from '../../src/components/landscape/logic'

describe('landscape/logic', () => {
  it('默认过渡：全屏 cu-fade，非全屏 cu-punch（v2 契约）', () => {
    expect(resolveTransition('', false)).toBe('punch')
    expect(resolveTransition('', true)).toBe('fade')
  })

  it('显式 transition 优先；兼容剥除 Vue 风格 cu- 前缀', () => {
    expect(resolveTransition('zoom', true)).toBe('zoom')
    expect(resolveTransition('cu-fade', false)).toBe('fade')
  })

  it('hasMask = !fullScreen && hasMask', () => {
    expect(hasMask(false, true)).toBe(true)
    expect(hasMask(false, false)).toBe(false)
    expect(hasMask(true, true)).toBe(false)
  })

  it('关闭图标：全屏 clear，否则 close', () => {
    expect(closeIcon(true)).toBe('clear')
    expect(closeIcon(false)).toBe('close')
  })

  it('关闭图标着色：无遮罩或全屏为深色（.dark 语义），否则白色（token 承载）', () => {
    expect(closeColor(true, true)).toBe('var(--color-text-base)')
    expect(closeColor(false, false)).toBe('var(--color-text-base)')
    expect(closeColor(false, true)).toBe('var(--color-text-base-inverse)')
  })
})

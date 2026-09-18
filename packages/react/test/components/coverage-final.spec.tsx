/**
 * 收尾分支用例（独立文件避免同文件全局状态串扰）。
 */
import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MdActivityIndicator, MdInputItem, MdPopup, MdStepper, MdTag } from '../../src'

describe('收尾分支 (react)', () => {
  it('spinning custom size', () => {
    const { container } = render(<MdActivityIndicator type="spinner" size={40} />)
    expect(container.querySelector('.md-activity-indicator-svg')!.getAttribute('style')).toContain(
      'width: 40px',
    )
  })

  it('input-item readonly and disabled fake-input classes', () => {
    const readonly = render(<MdInputItem isVirtualKeyboard readonly />)
    expect(readonly.container.querySelector('.md-input-item-fake')!.className).toContain('readonly')

    const disabled = render(<MdInputItem isVirtualKeyboard disabled />)
    expect(disabled.container.querySelector('.md-input-item-fake')!.className).toContain('disabled')
  })

  it('input-item negative maxlength keeps raw attr (v2 substring quirk)', () => {
    const { container } = render(<MdInputItem maxlength={-1} value="123456" />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.getAttribute('maxlength')).toBe('-1')
    // v2 subValue 契约：substring(0, -1) 为空串
    expect(input.value).toBe('')
  })

  it('stepper defaultValue fallback when value falsy', async () => {
    const { container } = render(<MdStepper value={0} defaultValue={7} min={0} />)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect((container.querySelector('input') as HTMLInputElement).value).toBe('7')
  })
})

describe('补充分支 (react)', () => {
  it('popup derives default transitions for left/right/top', () => {
    const left = render(<MdPopup value position="left" />)
    expect(left.container.querySelector('.md-popup-box')!.className).toContain('md-slide-right')

    const right = render(<MdPopup value position="right" />)
    expect(right.container.querySelector('.md-popup-box')!.className).toContain('md-slide-left')

    const top = render(<MdPopup value position="top" />)
    expect(top.container.querySelector('.md-popup-box')!.className).toContain('md-slide-down')
  })

  it('tag quarter renders fill color style', () => {
    const { container } = render(<MdTag shape="quarter" type="fill" fillColor="#0f0" />)
    expect(container.querySelector('.quarter-bg')!.getAttribute('style')).toContain('background')
  })

  it('toast preset square param forwards', async () => {
    document.body.innerHTML = ''
    const { Toast } = await import('../../src')
    await act(async () => {
      Toast.info('内容', 3000, false, document.body, true)
    })
    expect(document.body.querySelector('.md-toast-content')!.className).toContain('square')
    await act(async () => {
      Toast.hide()
    })
  })
})

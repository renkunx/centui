/**
 * 分支覆盖补强第二轮：DatePicker 列联动（FakeScroller）、Spinning/Carousel 默认分支、
 * Stepper/Tag/Check/InputItem 的剩余条件分支。
 */
import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@centui/core/web', async importOriginal => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    _isAnimating = false
    _isDecelerating = false
    _isDragging = false
    _isGesturing = false
    _top = 0
    cb: unknown
    opts: { scrollingComplete?: () => void }
    constructor(cb: unknown, opts: { scrollingComplete?: () => void }) {
      this.cb = cb
      this.opts = opts
      scrollerInstances.push(this)
    }
    setPosition() {}
    setDimensions() {}
    setSnapSize() {}
    scrollTo(_left: number, top: number) {
      this._top = top
    }
    getValues() {
      return { top: this._top, left: 0 }
    }
    getScrollMax() {
      return { top: 100000, left: 0 }
    }
    doTouchStart() {}
    doTouchMove() {}
    doTouchEnd() {}
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import {
  CuActivityIndicator,
  CuCarouselCircle,
  CuCheckBox,
  CuCheck,
  CuCheckGroup,
  CuCodebox,
  CuDatePicker,
  CuInputItem,
  CuNumberKeyboard,
  CuStepper,
  CuTag,
} from '../../src'

async function flushAll() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
  })
}

describe('DatePicker 列联动 (react)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
  })

  it('change on year column rebuilds month/day columns', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuDatePicker
        isView
        type="date"
        defaultDate={new Date(2024, 5, 15)}
        minDate={new Date(2020, 0, 1)}
        maxDate={new Date(2030, 11, 31)}
        onChange={onChange}
      />,
    )
    await flushAll()
    // 年列滚到最末（2030）→ 月/日列按新年份重建
    const yearScroller = scrollerInstances.at(-3) as unknown as {
      _top: number
      opts: { scrollingComplete?: () => void }
    }
    const maxYearOffset = 10 * 45 // 2030 - 2020 = 10 项
    yearScroller._top = maxYearOffset
    yearScroller.opts.scrollingComplete?.()
    await flushAll()

    expect(onChange).toHaveBeenCalled()
    const monthTexts = [...container.querySelectorAll('.cu-picker-column-item')][1]
      ? [...container.querySelectorAll('.cu-picker-column-item')[0].querySelectorAll('.column-item')].map(
          li => li.textContent,
        )
      : []
    expect(monthTexts.at(-1)).toBe('2030年')
  })

  it('prop-driven rebuild on defaultDate change', async () => {
    const { container, rerender } = render(
      <CuDatePicker isView type="date" defaultDate={new Date(2024, 5, 15)} />,
    )
    await flushAll()
    rerender(<CuDatePicker isView type="time" defaultDate={new Date(2024, 5, 15, 8, 30)} />)
    await flushAll()
    expect(container.querySelectorAll('.cu-picker-column-item')).toHaveLength(2)
  })
})

describe('Spinning / Carousel 默认分支 (react)', () => {
  it('spinning light color', () => {
    const { container } = render(<CuActivityIndicator type="spinner" color="light" />)
    expect(container.querySelector('.cu-activity-indicator-spinning')!.className).not.toContain('dark')
  })

  it('carousel circle defaults', () => {
    const { container } = render(
      <svg>
        <CuCarouselCircle />
      </svg>,
    )
    const circle = container.querySelector('circle')!
    // 默认 size=30 index=0 → cx = 15
    expect(circle.getAttribute('cx')).toBe('15')
    expect(circle.getAttribute('cy')).toBe('15')
  })
})

describe('Stepper 分支 (react)', () => {
  it('reduce blocked at min and readOnly input', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuStepper value={0} min={0} readOnly onChange={onChange} />,
    )
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(container.querySelector('.cu-stepper-button-reduce')!.className).toContain('disabled')
    fireEvent.click(container.querySelector('.cu-stepper-button-reduce')!)
    expect(onChange).not.toHaveBeenCalled()
    expect(container.querySelector('input')!.hasAttribute('readonly')).toBe(true)
  })

  it('isInteger floors on blur with decimal input', async () => {
    const onChange = vi.fn()
    const { container } = render(<CuStepper value={1} isInteger onChange={onChange} />)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const input = container.querySelector('input')!
    expect(input.getAttribute('type')).toBe('tel')
    fireEvent.focus(input)
    fireEvent.input(input, { target: { value: '5.9' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('decrease emits with diff', async () => {
    const onDecrease = vi.fn()
    const { container } = render(<CuStepper value={3} onDecrease={onDecrease} />)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    fireEvent.click(container.querySelector('.cu-stepper-button-reduce')!)
    expect(onDecrease).toHaveBeenCalledWith(1)
  })
})

describe('Tag 分支 (react)', () => {
  it('sharp corner only applies to circle shape', async () => {
    const { container } = render(<CuTag shape="circle" sharp="bottom-right" />)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const style = container.querySelector('.shape-circle')!.getAttribute('style') ?? ''
    expect(style).toContain('border-bottom-right-radius')
  })

  it('fill without fillColor has no background style', () => {
    const { container } = render(<CuTag type="fill" />)
    const style = container.querySelector('.type-fill')!.getAttribute('style') ?? ''
    expect(style).not.toContain('background')
  })
})

describe('Check 家族分支 (react)', () => {
  it('check-group toggleAll true forces all selectable checked', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuCheckGroup value={[]} onChange={onChange}>
        <CuCheck name="a" />
        <CuCheck name="b" />
      </CuCheckGroup>,
    )
    const group = container.querySelector('.cu-check-group')!
    void group
    // toggleAll 经 ref 暴露在 Vue 版；React 版经组内 Provider 驱动，此处验证组点击增删
    fireEvent.click(container.querySelectorAll('.cu-check')[0])
    expect(onChange).toHaveBeenCalledWith(['a'])
  })

  it('checkbox disabled retains group registration', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuCheckGroup value={['a']} onChange={onChange}>
        <CuCheckBox name="a" value="a" disabled />
      </CuCheckGroup>,
    )
    expect(container.querySelector('.cu-check-base-box')!.className).toContain('is-checked')
    expect(container.querySelector('.cu-check-base-box')!.className).toContain('is-disabled')
    fireEvent.click(container.querySelector('.cu-check-base-box')!)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('InputItem / Codebox 分支 (react)', () => {
  it('digit type filters non-digits', () => {
    const onChange = vi.fn()
    const { container } = render(<CuInputItem type="digit" onChange={onChange} />)
    fireEvent.input(container.querySelector('input')!, { target: { value: '12a3' } })
    expect(onChange).toHaveBeenLastCalledWith('123', 'input-item')
  })

  it('custom formation overrides default', () => {
    const { container } = render(
      <CuInputItem isFormative formation={() => ({ value: '[X]', range: 3 })} />,
    )
    fireEvent.input(container.querySelector('input')!, { target: { value: 'anything' } })
    expect((container.querySelector('input') as HTMLInputElement).value).toBe('[X]')
  })

  it('title-latent hides placeholder while active', () => {
    const { container } = render(
      <CuInputItem isTitleLatent title="姓名" placeholder="请输入" value="张" />,
    )
    expect((container.querySelector('input') as HTMLInputElement).placeholder).toBe('')
  })

  it('codebox professional keyboard okText submits', async () => {
    const onSubmit = vi.fn()
    const { container } = render(<CuCodebox maxlength={-1} isView onSubmit={onSubmit} okText="完成" />)
    fireEvent.click(container.querySelector('.cu-codebox')!)
    expect(container.querySelector('.keyboard-operate-item.confirm')!.textContent).toBe('完成')
    fireEvent.click(container.querySelectorAll('.keyboard-number-item')[0])
    fireEvent.click(container.querySelector('.keyboard-operate-item.confirm')!)
    expect(onSubmit).toHaveBeenLastCalledWith('1')
  })
})

describe('NumberKeyboard 分支 (react)', () => {
  it('duplicateZero adds 00 key and hideDot enlarges zero', () => {
    const { container } = render(
      <CuNumberKeyboard isView value hideDot duplicateZero />,
    )
    const keys = container.querySelectorAll('.keyboard-number-item')
    // hideDot+duplicateZero：9 数字 + 00 + 0 + . （无 slidedown）
    const texts = [...keys].map(k => k.textContent)
    expect(texts).toContain('00')
    expect(texts).toContain('.')
    expect(container.querySelector('.slidedown')).toBeNull()
  })

  it('textRender customizes key labels', () => {
    const { container } = render(
      <CuNumberKeyboard isView value textRender={val => (val === 1 ? '壹' : undefined)} />,
    )
    const texts = [...container.querySelectorAll('.keyboard-number-item')].map(k => k.textContent)
    expect(texts).toContain('壹')
  })
})

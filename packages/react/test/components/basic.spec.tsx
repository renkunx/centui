/**
 * React 基础组件行为清单（与 Vue 版 L2 对应；交互语义一致，事件经 props 回调）。
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CuActivityIndicator,
  CuAmount,
  CuButton,
  CuCellItem,
  CuIcon,
  CuNoticeBar,
  CuProgress,
  CuSkeleton,
  CuTag,
} from '../../src'
import { SPRITE_NODE_ID } from '../../src/components/icon/load-sprite'
import { Toast } from '../../src'

describe('CuIcon (react)', () => {
  it('renders svg sprite and injects sprite once', () => {
    const onClick = vi.fn()
    const { container } = render(<CuIcon name="home" onClick={onClick} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('class')).toContain('cu-icon-home')
    expect(svg.querySelector('use')?.getAttribute('xlink:href')).toBe('#home')
    expect(document.querySelectorAll(`#${SPRITE_NODE_ID}`)).toHaveLength(1)

    render(<CuIcon name="arrow" />)
    expect(document.querySelectorAll(`#${SPRITE_NODE_ID}`)).toHaveLength(1)
  })

  it('renders icon font and hides empty names', () => {
    const { container } = render(<CuIcon name="arrow" svg={false} />)
    const i = container.querySelector('i')!
    expect(i.className).toContain('icon-font')

    const empty = render(<CuIcon name="" svg={false} />)
    expect(empty.container.querySelector('i')).toBeNull()
  })
})

describe('CuButton (react)', () => {
  it('renders type classes and native disabled', async () => {
    const onClick = vi.fn()
    const { container, rerender } = render(<CuButton type="primary" onClick={onClick}>按钮</CuButton>)
    const button = container.querySelector('button')!
    expect(button.className).toContain('primary')
    expect(button.hasAttribute('disabled')).toBe(false)

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<CuButton type="disabled" onClick={onClick}>按钮</CuButton>)
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('renders roller when loading', () => {
    const { container } = render(<CuButton loading icon="home">按钮</CuButton>)
    expect(container.querySelector('.cu-button-loading')).not.toBeNull()
    expect(container.querySelector('.cu-button-content .cu-icon')).toBeNull()
  })
})

describe('CuTag (react)', () => {
  it('renders quarter/coupon shapes and color styles', () => {
    const quarter = render(<CuTag shape="quarter" fillColor="#fc0">Q</CuTag>)
    expect(quarter.container.querySelector('.quarter-bg')).not.toBeNull()

    const coupon = render(
      <CuTag shape="coupon" type="fill" fillColor="#fc0">券</CuTag>,
    )
    expect(coupon.container.querySelector('.left-coupon')?.getAttribute('style')).toContain(
      'radial-gradient(circle at left',
    )

    const ghost = render(<CuTag type="ghost" fontColor="#f00">标签</CuTag>)
    const style = ghost.container.querySelector('.type-ghost')!.getAttribute('style') ?? ''
    expect(style).toContain('border-color')
    expect(style).toContain('color')
  })
})

describe('CuAmount (react)', () => {
  it('formats precision/separator/capital', () => {
    const { container } = render(<CuAmount value={1234.56} />)
    expect(container.querySelector('.cu-amount')!.textContent).toBe('1234.56')

    const sep = render(<CuAmount value={1234567.89} hasSeparator />)
    expect(sep.container.querySelector('.cu-amount')!.textContent).toBe('1,234,567.89')

    const cap = render(<CuAmount value={1234.56} isCapital />)
    expect(cap.container.querySelector('.cu-amount')!.textContent).toBe(
      ' 壹仟贰佰叁拾肆元伍角陆分 ',
    )
  })

  it('updates when value changes', () => {
    const { container, rerender } = render(<CuAmount value={1} />)
    rerender(<CuAmount value={2} />)
    expect(container.querySelector('.cu-amount')!.textContent).toBe('2.00')
  })
})

describe('CuCellItem (react)', () => {
  it('renders slots and blocks click when disabled', () => {
    const onClick = vi.fn()
    const { container } = render(
      <CuCellItem title="标题" brief="描述" arrow addon="附加" onClick={onClick} />,
    )
    expect(container.querySelector('.cu-cell-item-title')!.textContent).toBe('标题')
    expect(container.querySelector('.cu-cell-item-item-right, .cu-cell-item-right')).not.toBeNull()
    expect(container.querySelector('.cu-cell-item-right')!.textContent).toContain('附加')

    fireEvent.click(container.querySelector('.cu-cell-item')!)
    expect(onClick).toHaveBeenCalledTimes(1)

    const disabled = render(<CuCellItem onClick={onClick} disabled />)
    fireEvent.click(disabled.container.querySelector('.cu-cell-item')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(disabled.container.querySelector('.cu-cell-item')!.className).toContain('is-disabled')
  })
})

describe('CuSkeleton (react)', () => {
  it('switches loading and slot', () => {
    const { container } = render(
      <CuSkeleton loading avatar>
        <p>内容</p>
      </CuSkeleton>,
    )
    expect(container.querySelectorAll('.cu-skeleton-row')).toHaveLength(3)

    const done = render(
      <CuSkeleton loading={false}>
        <p>内容</p>
      </CuSkeleton>,
    )
    expect(done.container.querySelector('p')!.textContent).toBe('内容')
  })
})

describe('CuNoticeBar (react)', () => {
  it('closes via icon and emits close', () => {
    const onClose = vi.fn()
    const { container } = render(
      <CuNoticeBar mode="closable" onClose={onClose}>
        文案
      </CuNoticeBar>,
    )
    const icon = container.querySelector('.cu-notice-icon-right')!
    expect(icon).not.toBeNull()
    fireEvent.click(icon)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.cu-notice-bar')).toBeNull()
  })

  it('auto hides after time', () => {
    vi.useFakeTimers()
    const { container } = render(<CuNoticeBar time={500}>文案</CuNoticeBar>)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(container.querySelector('.cu-notice-bar')).toBeNull()
    vi.useRealTimers()
  })

  it('renders left/right custom slots', () => {
    const { container } = render(
      <CuNoticeBar left="左" right="右">文案</CuNoticeBar>,
    )
    expect(container.querySelector('.cu-notice-bar-left')!.textContent).toBe('左')
    expect(container.querySelector('.cu-notice-bar-right')!.textContent).toBe('右')
  })
})

describe('CuActivityIndicator / CuProgress (react)', () => {
  it('renders roller geometry from size', () => {
    const { container } = render(<CuActivityIndicator type="roller" size={70} />)
    const svg = container.querySelector('svg.rolling')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 81.66666666666667 81.66666666666667')
    expect(container.querySelector('animate')).not.toBeNull()
  })

  it('renders progress state without SMIL when process provided', () => {
    const { container } = render(<CuProgress value={0.5} />)
    expect(container.querySelector('animate')).toBeNull()
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '109.9525 109.9525',
    )
    expect(container.querySelector('.cu-activity-indicator-rolling')!.className).toContain(
      'cu-progress',
    )
  })

  it('spinner defaults to dark color', () => {
    const { container } = render(<CuActivityIndicator type="spinner" />)
    expect(container.querySelector('.cu-activity-indicator-spinning')!.className).toContain('dark')
  })
})

describe('Toast 工厂 (react)', () => {
  it('creates singleton and hides', async () => {
    document.body.innerHTML = ''
    let exposed: { visible: boolean } | null = null
    await act(async () => {
      exposed = Toast.info('提示') as unknown as { visible: boolean }
    })
    expect(document.body.querySelector('.cu-toast-text')!.textContent).toBe('提示')
    expect(exposed!.visible).toBe(true)

    await act(async () => {
      Toast.hide()
    })
    expect(exposed!.visible).toBe(false)
  })

  it('preset variants inject icons', async () => {
    document.body.innerHTML = ''
    await act(async () => {
      Toast.succeed('成功')
    })
    expect(document.body.querySelector('.cu-icon-success')).not.toBeNull()

    await act(async () => {
      Toast.loading('加载')
    })
    expect(document.body.querySelector('svg.cu-icon-spinner')).not.toBeNull()
    await act(async () => {
      Toast.hide()
    })
  })
})

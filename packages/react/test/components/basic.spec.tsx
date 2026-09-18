/**
 * React 基础组件行为清单（与 Vue 版 L2 对应；交互语义一致，事件经 props 回调）。
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MdActivityIndicator,
  MdAmount,
  MdButton,
  MdCellItem,
  MdIcon,
  MdNoticeBar,
  MdProgress,
  MdSkeleton,
  MdTag,
} from '../../src'
import { SPRITE_NODE_ID } from '../../src/components/icon/load-sprite'
import { Toast } from '../../src'

describe('MdIcon (react)', () => {
  it('renders svg sprite and injects sprite once', () => {
    const onClick = vi.fn()
    const { container } = render(<MdIcon name="home" onClick={onClick} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('class')).toContain('md-icon-home')
    expect(svg.querySelector('use')?.getAttribute('xlink:href')).toBe('#home')
    expect(document.querySelectorAll(`#${SPRITE_NODE_ID}`)).toHaveLength(1)

    render(<MdIcon name="arrow" />)
    expect(document.querySelectorAll(`#${SPRITE_NODE_ID}`)).toHaveLength(1)
  })

  it('renders icon font and hides empty names', () => {
    const { container } = render(<MdIcon name="arrow" svg={false} />)
    const i = container.querySelector('i')!
    expect(i.className).toContain('icon-font')

    const empty = render(<MdIcon name="" svg={false} />)
    expect(empty.container.querySelector('i')).toBeNull()
  })
})

describe('MdButton (react)', () => {
  it('renders type classes and native disabled', async () => {
    const onClick = vi.fn()
    const { container, rerender } = render(<MdButton type="primary" onClick={onClick}>按钮</MdButton>)
    const button = container.querySelector('button')!
    expect(button.className).toContain('primary')
    expect(button.hasAttribute('disabled')).toBe(false)

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<MdButton type="disabled" onClick={onClick}>按钮</MdButton>)
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('renders roller when loading', () => {
    const { container } = render(<MdButton loading icon="home">按钮</MdButton>)
    expect(container.querySelector('.md-button-loading')).not.toBeNull()
    expect(container.querySelector('.md-button-content .md-icon')).toBeNull()
  })
})

describe('MdTag (react)', () => {
  it('renders quarter/coupon shapes and color styles', () => {
    const quarter = render(<MdTag shape="quarter" fillColor="#fc0">Q</MdTag>)
    expect(quarter.container.querySelector('.quarter-bg')).not.toBeNull()

    const coupon = render(
      <MdTag shape="coupon" type="fill" fillColor="#fc0">券</MdTag>,
    )
    expect(coupon.container.querySelector('.left-coupon')?.getAttribute('style')).toContain(
      'radial-gradient(circle at left',
    )

    const ghost = render(<MdTag type="ghost" fontColor="#f00">标签</MdTag>)
    const style = ghost.container.querySelector('.type-ghost')!.getAttribute('style') ?? ''
    expect(style).toContain('border-color')
    expect(style).toContain('color')
  })
})

describe('MdAmount (react)', () => {
  it('formats precision/separator/capital', () => {
    const { container } = render(<MdAmount value={1234.56} />)
    expect(container.querySelector('.md-amount')!.textContent).toBe('1234.56')

    const sep = render(<MdAmount value={1234567.89} hasSeparator />)
    expect(sep.container.querySelector('.md-amount')!.textContent).toBe('1,234,567.89')

    const cap = render(<MdAmount value={1234.56} isCapital />)
    expect(cap.container.querySelector('.md-amount')!.textContent).toBe(
      ' 壹仟贰佰叁拾肆元伍角陆分 ',
    )
  })

  it('updates when value changes', () => {
    const { container, rerender } = render(<MdAmount value={1} />)
    rerender(<MdAmount value={2} />)
    expect(container.querySelector('.md-amount')!.textContent).toBe('2.00')
  })
})

describe('MdCellItem (react)', () => {
  it('renders slots and blocks click when disabled', () => {
    const onClick = vi.fn()
    const { container } = render(
      <MdCellItem title="标题" brief="描述" arrow addon="附加" onClick={onClick} />,
    )
    expect(container.querySelector('.md-cell-item-title')!.textContent).toBe('标题')
    expect(container.querySelector('.md-cell-item-item-right, .md-cell-item-right')).not.toBeNull()
    expect(container.querySelector('.md-cell-item-right')!.textContent).toContain('附加')

    fireEvent.click(container.querySelector('.md-cell-item')!)
    expect(onClick).toHaveBeenCalledTimes(1)

    const disabled = render(<MdCellItem onClick={onClick} disabled />)
    fireEvent.click(disabled.container.querySelector('.md-cell-item')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(disabled.container.querySelector('.md-cell-item')!.className).toContain('is-disabled')
  })
})

describe('MdSkeleton (react)', () => {
  it('switches loading and slot', () => {
    const { container } = render(
      <MdSkeleton loading avatar>
        <p>内容</p>
      </MdSkeleton>,
    )
    expect(container.querySelectorAll('.md-skeleton-row')).toHaveLength(3)

    const done = render(
      <MdSkeleton loading={false}>
        <p>内容</p>
      </MdSkeleton>,
    )
    expect(done.container.querySelector('p')!.textContent).toBe('内容')
  })
})

describe('MdNoticeBar (react)', () => {
  it('closes via icon and emits close', () => {
    const onClose = vi.fn()
    const { container } = render(
      <MdNoticeBar mode="closable" onClose={onClose}>
        文案
      </MdNoticeBar>,
    )
    const icon = container.querySelector('.md-notice-icon-right')!
    expect(icon).not.toBeNull()
    fireEvent.click(icon)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.md-notice-bar')).toBeNull()
  })

  it('auto hides after time', () => {
    vi.useFakeTimers()
    const { container } = render(<MdNoticeBar time={500}>文案</MdNoticeBar>)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(container.querySelector('.md-notice-bar')).toBeNull()
    vi.useRealTimers()
  })

  it('renders left/right custom slots', () => {
    const { container } = render(
      <MdNoticeBar left="左" right="右">文案</MdNoticeBar>,
    )
    expect(container.querySelector('.md-notice-bar-left')!.textContent).toBe('左')
    expect(container.querySelector('.md-notice-bar-right')!.textContent).toBe('右')
  })
})

describe('MdActivityIndicator / MdProgress (react)', () => {
  it('renders roller geometry from size', () => {
    const { container } = render(<MdActivityIndicator type="roller" size={70} />)
    const svg = container.querySelector('svg.rolling')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 81.66666666666667 81.66666666666667')
    expect(container.querySelector('animate')).not.toBeNull()
  })

  it('renders progress state without SMIL when process provided', () => {
    const { container } = render(<MdProgress value={0.5} />)
    expect(container.querySelector('animate')).toBeNull()
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '109.9525 109.9525',
    )
    expect(container.querySelector('.md-activity-indicator-rolling')!.className).toContain(
      'md-progress',
    )
  })

  it('spinner defaults to dark color', () => {
    const { container } = render(<MdActivityIndicator type="spinner" />)
    expect(container.querySelector('.md-activity-indicator-spinning')!.className).toContain('dark')
  })
})

describe('Toast 工厂 (react)', () => {
  it('creates singleton and hides', async () => {
    document.body.innerHTML = ''
    let exposed: { visible: boolean } | null = null
    await act(async () => {
      exposed = Toast.info('提示') as unknown as { visible: boolean }
    })
    expect(document.body.querySelector('.md-toast-text')!.textContent).toBe('提示')
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
    expect(document.body.querySelector('.md-icon-success')).not.toBeNull()

    await act(async () => {
      Toast.loading('加载')
    })
    expect(document.body.querySelector('svg.md-icon-spinner')).not.toBeNull()
    await act(async () => {
      Toast.hide()
    })
  })
})

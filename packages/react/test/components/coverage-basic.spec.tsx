/**
 * React 基础组件覆盖率补强（分支/函数可达性）：
 * Carousel 全家族、Amount 动画、Check 家族分支、Codebox 系统/无限长、
 * Progress 过渡、Skeleton 宽度分支、NoticeBar 滚动溢出、PopupTitleBar 插槽、RadioList 变体。
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MdActivityIndicator,
  MdAmount,
  MdCarouselCircle,
  MdCheckBox,
  MdCheck,
  MdCheckGroup,
  MdCheckList,
  MdCodebox,
  MdPopupTitleBar,
  MdProgress,
  MdRadioList,
  MdSkeleton,
  MdNoticeBar,
  MdTip,
} from '../../src'

describe('MdCarousel (react)', () => {
  it('renders carousel circles with animated values', () => {
    const { container } = render(<MdActivityIndicator type="carousel" size={30} color="#0ff" />)
    const svg = container.querySelector('svg.carouseling')!
    expect(svg).not.toBeNull()
    expect(svg.getAttribute('viewBox')).toBe('0 0 120 30')
    expect(svg.getAttribute('fill')).toBe('#0ff')
    expect(container.querySelectorAll('circle')).toHaveLength(3)
  })

  it('carousel circle computes cx and animation values', () => {
    const { container } = render(
      <svg>
        <MdCarouselCircle size={30} index={2} animateValues={[1, 0.5]} />
      </svg>,
    )
    const circle = container.querySelector('circle')!
    // cx = index * size * 1.5 + size / 2
    expect(circle.getAttribute('cx')).toBe('105')
    expect(circle.getAttribute('cy')).toBe('15')
    const animates = container.querySelectorAll('animate')
    expect(animates[0].getAttribute('values')).toBe('1;0.5')
    expect(animates[1].getAttribute('values')).toBe('15;7.5')
  })
})

describe('MdAmount 覆盖补强 (react)', () => {
  it('treats negative precision as 0 and floors', () => {
    const { container } = render(<MdAmount value={12.34} precision={-1} />)
    expect(container.querySelector('.md-amount')!.textContent).toBe('12')

    const floored = render(<MdAmount value={1.239} precision={2} isRoundUp={false} />)
    expect(floored.container.querySelector('.md-amount')!.textContent).toBe('1.23')
  })

  it('supports custom separator and negative sign', () => {
    const space = render(<MdAmount value={1234567.89} hasSeparator separator=" " />)
    expect(space.container.querySelector('.md-amount')!.textContent).toBe('1 234 567.89')

    const neg = render(<MdAmount value={-1234567.89} hasSeparator />)
    expect(neg.container.querySelector('.md-amount')!.textContent).toBe('-1,234,567.89')
  })

  it('capital renders zero and negative', () => {
    expect(render(<MdAmount value={0} isCapital />).container.querySelector('.md-amount')!.textContent).toBe(
      ' 零元整 ',
    )
    expect(
      render(<MdAmount value={-12.34} isCapital />).container.querySelector('.md-amount')!.textContent,
    ).toBe(' 负壹拾贰元叁角肆分 ')
  })

  it('animates value change and lands on target', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<MdAmount value={100} isAnimated duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(50)
    })
    rerender(<MdAmount value={200} isAnimated duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(container.querySelector('.md-amount')!.textContent).toBe('200.00')
    vi.useRealTimers()
  })

  it('transition legacy alias triggers animation too', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<MdAmount value={5} transition duration={50} />)
    rerender(<MdAmount value={10} transition duration={50} />)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(container.querySelector('.md-amount')!.textContent).toBe('10.00')
    vi.useRealTimers()
  })
})

describe('Check 家族分支 (react)', () => {
  it('check registers into group and honors max', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MdCheckGroup value={['a', 'b']} max={2} onChange={onChange}>
        <MdCheck name="a" />
        <MdCheck name="b" />
        <MdCheck name="c" />
      </MdCheckGroup>,
    )
    fireEvent.click(container.querySelectorAll('.md-check')[2])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('check-group uncheck via click on checked item', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MdCheckGroup value={['a']} onChange={onChange}>
        <MdCheck name="a" />
      </MdCheckGroup>,
    )
    fireEvent.click(container.querySelector('.md-check')!)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('check-list forwards scoped slot with selected state', () => {
    const { container } = render(
      <MdCheckList
        value={['a']}
        options={[{ value: 'a', label: 'A' }]}
        onChange={() => {}}
      >
        {({ option, selected }) => <i className="row">{`${option.value}-${selected}`}</i>}
      </MdCheckList>,
    )
    expect(container.querySelector('.row')!.textContent).toBe('a-true')
  })

  it('check-list icon position left', () => {
    const { container } = render(
      <MdCheckList
        value={[]}
        options={[{ value: 'a' }]}
        iconPosition="left"
        onChange={() => {}}
      />,
    )
    expect(container.querySelector('.md-cell-item-left .md-check')).not.toBeNull()
  })

  it('check-box toggles off emitting empty string', () => {
    const onChange = vi.fn()
    const { container } = render(<MdCheckBox name="a" value="a" label="X" onChange={onChange} />)
    fireEvent.click(container.querySelector('.md-check-base-box')!)
    expect(onChange).toHaveBeenCalledWith('')
  })
})

describe('MdCodebox 分支 (react)', () => {
  it('unbounded maxlength renders holder input (masked/plain)', () => {
    const masked = render(<MdCodebox maxlength={-1} mask value="12" />)
    expect(masked.container.querySelector('input[type="password"]')).not.toBeNull()

    const plain = render(<MdCodebox maxlength={-1} value="12" />)
    expect(plain.container.querySelector('input[type="tel"].md-codebox-holder')).not.toBeNull()
  })

  it('justify and error styles', () => {
    const { container } = render(<MdCodebox justify isErrorStyle maxlength={4} />)
    expect(container.querySelector('.md-codebox')!.className).toContain('is-justify')
    expect(container.querySelector('.md-codebox-box')!.className).toContain('is-error')
  })

  it('ignores outside click when closable=false keeps focus', async () => {
    const { container } = render(<MdCodebox closable={false} isView />)
    fireEvent.click(container.querySelector('.md-codebox')!)
    await act(async () => {
      document.body.click()
    })
    expect(container.querySelectorAll('.md-codebox-box.is-active').length).toBeGreaterThan(0)
  })

  it('dot key does not enter code at maxlength boundary', async () => {
    const onChange = vi.fn()
    const { container } = render(<MdCodebox maxlength={1} isView onChange={onChange} />)
    fireEvent.click(container.querySelector('.md-codebox')!)
    const keys = container.querySelectorAll('.keyboard-number-item')
    await act(async () => {
      fireEvent.click(keys[0])
    })
    // professional 键盘含 . 键；maxlength=1 已满
    fireEvent.click(keys[0])
    expect(onChange).toHaveBeenLastCalledWith('1')
  })
})

describe('MdProgress 过渡 (react)', () => {
  it('value syncs immediately without transition', () => {
    const { container, rerender } = render(<MdProgress value={0.2} />)
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '43.981 175.924',
    )
    rerender(<MdProgress value={0.8} />)
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '175.924 43.98099999999999',
    )
  })

  it('transition animates to target', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<MdProgress value={0.2} transition duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(30)
    })
    rerender(<MdProgress value={0.8} transition duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '175.924 43.98099999999999',
    )
    vi.useRealTimers()
  })
})

describe('MdSkeleton 分支 (react)', () => {
  it('title/row width variants', () => {
    const numeric = render(<MdSkeleton title titleWidth={60} />)
    expect(numeric.container.querySelector('.md-skeleton-title')!.getAttribute('style')).toContain(
      'width: 60%',
    )

    const arr = render(<MdSkeleton row={3} rowWidth={['50%', 80]} />)
    const rows = arr.container.querySelectorAll('.md-skeleton-row')
    expect(rows[0].getAttribute('style')).toContain('width: 50%')
    expect(rows[1].getAttribute('style')).toContain('width: 80%')
    expect(rows[2].getAttribute('style')).toContain('width: 60%')
  })

  it('avatar size sm', () => {
    const { container } = render(<MdSkeleton avatar avatarSize="sm" />)
    expect(container.querySelector('.md-skeleton-avatar-small')).not.toBeNull()
  })
})

describe('MdNoticeBar 分支 (react)', () => {
  it('renders left icon and link mode keeps visible on close', () => {
    const iconed = render(<MdNoticeBar icon="warn" iconSvg>文案</MdNoticeBar>)
    expect(iconed.container.querySelector('.md-notice-icon')).not.toBeNull()
    expect(iconed.container.querySelector('.md-notice-bar-left')!.className).not.toContain(
      'md-notice-bar-empty',
    )

    const onClose = vi.fn()
    const link = render(
      <MdNoticeBar mode="link" onClose={onClose}>文案</MdNoticeBar>,
    )
    expect(link.container.querySelector('.md-icon-arrow')).not.toBeNull()
    fireEvent.click(link.container.querySelector('.md-notice-icon-right')!)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(link.container.querySelector('.md-notice-bar')).not.toBeNull()
  })

  it('round/type/multiRows modifiers', () => {
    const { container } = render(
      <MdNoticeBar round multiRows type="warning">文案</MdNoticeBar>,
    )
    expect(container.querySelector('.md-notice-bar')!.className).toContain('md-notice-bar-round')
    expect(container.querySelector('.md-notice-bar')!.className).toContain('warning')
    expect(container.querySelector('.md-notice-bar-multi-content')).not.toBeNull()
  })
})

describe('MdPopupTitleBar 插槽 (react)', () => {
  it('cancel/confirm/title slots render', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { container } = render(
      <MdPopupTitleBar
        cancelSlot={<b>取消槽</b>}
        confirmSlot={<b>确定槽</b>}
        titleSlot={<i>标题槽</i>}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    expect(container.querySelector('.md-popup-cancel')!.textContent).toBe('取消槽')
    expect(container.querySelector('.md-popup-confirm')!.textContent).toBe('确定槽')
    expect(container.querySelector('.title-bar-title')!.textContent).toBe('标题槽')

    fireEvent.click(container.querySelector('.md-popup-cancel')!)
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.md-popup-confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('titleAlign left/right modifiers', () => {
    const { container } = render(<MdPopupTitleBar title="T" titleAlign="left" />)
    expect(container.querySelector('.md-popup-title-bar')!.className).toContain('title-align-left')
  })
})

describe('MdRadioList 变体 (react)', () => {
  it('icon right position and alignCenter hides icon', () => {
    const right = render(
      <MdRadioList value="a" options={[{ value: 'a', text: 'A' }]} iconPosition="right" />,
    )
    expect(right.container.querySelector('.md-cell-item-right .md-radio')).not.toBeNull()

    const center = render(
      <MdRadioList value="a" options={[{ value: 'a', text: 'A' }]} alignCenter />,
    )
    expect(center.container.querySelector('.md-radio')).toBeNull()
  })

  it('scoped slot without icon', () => {
    const { container } = render(
      <MdRadioList
        isSlotScope
        icon=""
        options={[{ value: 'a', text: 'A' }]}
      >
        {({ option }) => <i>{option.text}</i>}
      </MdRadioList>,
    )
    expect(container.querySelector('.md-radio')).toBeNull()
    expect(container.querySelector('i')!.textContent).toBe('A')
  })
})

describe('MdTip 分支 (react)', () => {
  it('fill left/right sets sizing and unclosable skips close icon', async () => {
    const left = render(
      <MdTip content="C" fill placement="left" closable={false}>
        <button>触发</button>
      </MdTip>,
      { container: document.body },
    )
    await act(async () => {
      fireEvent.click(left.container.querySelector('button')!)
    })
    const tip = document.body.querySelector('.md-tip') as HTMLElement
    expect(tip.style.cssText).toContain('height: 0px')
    expect(tip.querySelector('.md-icon-close')).toBeNull()
  })

  it('renders nothing without element children', () => {
    const { container } = render(<MdTip content="C">文本</MdTip>)
    expect(container.querySelector('.md-tip')).toBeNull()
  })
})

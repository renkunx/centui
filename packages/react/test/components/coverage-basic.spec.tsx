/**
 * React 基础组件覆盖率补强（分支/函数可达性）：
 * Carousel 全家族、Amount 动画、Check 家族分支、Codebox 系统/无限长、
 * Progress 过渡、Skeleton 宽度分支、NoticeBar 滚动溢出、PopupTitleBar 插槽、RadioList 变体。
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CuActivityIndicator,
  CuAmount,
  CuCarouselCircle,
  CuCheckBox,
  CuCheck,
  CuCheckGroup,
  CuCheckList,
  CuCodebox,
  CuPopupTitleBar,
  CuProgress,
  CuRadioList,
  CuSkeleton,
  CuNoticeBar,
  CuTip,
} from '../../src'

describe('CuCarousel (react)', () => {
  it('renders carousel circles with animated values', () => {
    const { container } = render(<CuActivityIndicator type="carousel" size={30} color="#0ff" />)
    const svg = container.querySelector('svg.carouseling')!
    expect(svg).not.toBeNull()
    expect(svg.getAttribute('viewBox')).toBe('0 0 120 30')
    expect(svg.getAttribute('fill')).toBe('#0ff')
    expect(container.querySelectorAll('circle')).toHaveLength(3)
  })

  it('carousel circle computes cx and animation values', () => {
    const { container } = render(
      <svg>
        <CuCarouselCircle size={30} index={2} animateValues={[1, 0.5]} />
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

describe('CuAmount 覆盖补强 (react)', () => {
  it('treats negative precision as 0 and floors', () => {
    const { container } = render(<CuAmount value={12.34} precision={-1} />)
    expect(container.querySelector('.cu-amount')!.textContent).toBe('12')

    const floored = render(<CuAmount value={1.239} precision={2} isRoundUp={false} />)
    expect(floored.container.querySelector('.cu-amount')!.textContent).toBe('1.23')
  })

  it('supports custom separator and negative sign', () => {
    const space = render(<CuAmount value={1234567.89} hasSeparator separator=" " />)
    expect(space.container.querySelector('.cu-amount')!.textContent).toBe('1 234 567.89')

    const neg = render(<CuAmount value={-1234567.89} hasSeparator />)
    expect(neg.container.querySelector('.cu-amount')!.textContent).toBe('-1,234,567.89')
  })

  it('capital renders zero and negative', () => {
    expect(render(<CuAmount value={0} isCapital />).container.querySelector('.cu-amount')!.textContent).toBe(
      ' 零元整 ',
    )
    expect(
      render(<CuAmount value={-12.34} isCapital />).container.querySelector('.cu-amount')!.textContent,
    ).toBe(' 负壹拾贰元叁角肆分 ')
  })

  it('animates value change and lands on target', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<CuAmount value={100} isAnimated duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(50)
    })
    rerender(<CuAmount value={200} isAnimated duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(container.querySelector('.cu-amount')!.textContent).toBe('200.00')
    vi.useRealTimers()
  })

  it('transition legacy alias triggers animation too', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<CuAmount value={5} transition duration={50} />)
    rerender(<CuAmount value={10} transition duration={50} />)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(container.querySelector('.cu-amount')!.textContent).toBe('10.00')
    vi.useRealTimers()
  })
})

describe('Check 家族分支 (react)', () => {
  it('check registers into group and honors max', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuCheckGroup value={['a', 'b']} max={2} onChange={onChange}>
        <CuCheck name="a" />
        <CuCheck name="b" />
        <CuCheck name="c" />
      </CuCheckGroup>,
    )
    fireEvent.click(container.querySelectorAll('.cu-check')[2])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('check-group uncheck via click on checked item', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuCheckGroup value={['a']} onChange={onChange}>
        <CuCheck name="a" />
      </CuCheckGroup>,
    )
    fireEvent.click(container.querySelector('.cu-check')!)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('check-list forwards scoped slot with selected state', () => {
    const { container } = render(
      <CuCheckList
        value={['a']}
        options={[{ value: 'a', label: 'A' }]}
        onChange={() => {}}
      >
        {({ option, selected }) => <i className="row">{`${option.value}-${selected}`}</i>}
      </CuCheckList>,
    )
    expect(container.querySelector('.row')!.textContent).toBe('a-true')
  })

  it('check-list icon position left', () => {
    const { container } = render(
      <CuCheckList
        value={[]}
        options={[{ value: 'a' }]}
        iconPosition="left"
        onChange={() => {}}
      />,
    )
    expect(container.querySelector('.cu-cell-item-left .cu-check')).not.toBeNull()
  })

  it('check-box toggles off emitting empty string', () => {
    const onChange = vi.fn()
    const { container } = render(<CuCheckBox name="a" value="a" label="X" onChange={onChange} />)
    fireEvent.click(container.querySelector('.cu-check-base-box')!)
    expect(onChange).toHaveBeenCalledWith('')
  })
})

describe('CuCodebox 分支 (react)', () => {
  it('unbounded maxlength renders holder input (masked/plain)', () => {
    const masked = render(<CuCodebox maxlength={-1} mask value="12" />)
    expect(masked.container.querySelector('input[type="password"]')).not.toBeNull()

    const plain = render(<CuCodebox maxlength={-1} value="12" />)
    expect(plain.container.querySelector('input[type="tel"].cu-codebox-holder')).not.toBeNull()
  })

  it('justify and error styles', () => {
    const { container } = render(<CuCodebox justify isErrorStyle maxlength={4} />)
    expect(container.querySelector('.cu-codebox')!.className).toContain('is-justify')
    expect(container.querySelector('.cu-codebox-box')!.className).toContain('is-error')
  })

  it('ignores outside click when closable=false keeps focus', async () => {
    const { container } = render(<CuCodebox closable={false} isView />)
    fireEvent.click(container.querySelector('.cu-codebox')!)
    await act(async () => {
      document.body.click()
    })
    expect(container.querySelectorAll('.cu-codebox-box.is-active').length).toBeGreaterThan(0)
  })

  it('dot key does not enter code at maxlength boundary', async () => {
    const onChange = vi.fn()
    const { container } = render(<CuCodebox maxlength={1} isView onChange={onChange} />)
    fireEvent.click(container.querySelector('.cu-codebox')!)
    const keys = container.querySelectorAll('.keyboard-number-item')
    await act(async () => {
      fireEvent.click(keys[0])
    })
    // professional 键盘含 . 键；maxlength=1 已满
    fireEvent.click(keys[0])
    expect(onChange).toHaveBeenLastCalledWith('1')
  })
})

describe('CuProgress 过渡 (react)', () => {
  it('value syncs immediately without transition', () => {
    const { container, rerender } = render(<CuProgress value={0.2} />)
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '43.981 175.924',
    )
    rerender(<CuProgress value={0.8} />)
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '175.924 43.98099999999999',
    )
  })

  it('transition animates to target', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<CuProgress value={0.2} transition duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(30)
    })
    rerender(<CuProgress value={0.8} transition duration={100} />)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(container.querySelector('circle.stroke')!.getAttribute('stroke-dasharray')).toBe(
      '175.924 43.98099999999999',
    )
    vi.useRealTimers()
  })
})

describe('CuSkeleton 分支 (react)', () => {
  it('title/row width variants', () => {
    const numeric = render(<CuSkeleton title titleWidth={60} />)
    expect(numeric.container.querySelector('.cu-skeleton-title')!.getAttribute('style')).toContain(
      'width: 60%',
    )

    const arr = render(<CuSkeleton row={3} rowWidth={['50%', 80]} />)
    const rows = arr.container.querySelectorAll('.cu-skeleton-row')
    expect(rows[0].getAttribute('style')).toContain('width: 50%')
    expect(rows[1].getAttribute('style')).toContain('width: 80%')
    expect(rows[2].getAttribute('style')).toContain('width: 60%')
  })

  it('avatar size sm', () => {
    const { container } = render(<CuSkeleton avatar avatarSize="sm" />)
    expect(container.querySelector('.cu-skeleton-avatar-small')).not.toBeNull()
  })
})

describe('CuNoticeBar 分支 (react)', () => {
  it('renders left icon and link mode keeps visible on close', () => {
    const iconed = render(<CuNoticeBar icon="warn" iconSvg>文案</CuNoticeBar>)
    expect(iconed.container.querySelector('.cu-notice-icon')).not.toBeNull()
    expect(iconed.container.querySelector('.cu-notice-bar-left')!.className).not.toContain(
      'cu-notice-bar-empty',
    )

    const onClose = vi.fn()
    const link = render(
      <CuNoticeBar mode="link" onClose={onClose}>文案</CuNoticeBar>,
    )
    expect(link.container.querySelector('.cu-icon-arrow')).not.toBeNull()
    fireEvent.click(link.container.querySelector('.cu-notice-icon-right')!)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(link.container.querySelector('.cu-notice-bar')).not.toBeNull()
  })

  it('round/type/multiRows modifiers', () => {
    const { container } = render(
      <CuNoticeBar round multiRows type="warning">文案</CuNoticeBar>,
    )
    expect(container.querySelector('.cu-notice-bar')!.className).toContain('cu-notice-bar-round')
    expect(container.querySelector('.cu-notice-bar')!.className).toContain('warning')
    expect(container.querySelector('.cu-notice-bar-multi-content')).not.toBeNull()
  })
})

describe('CuPopupTitleBar 插槽 (react)', () => {
  it('cancel/confirm/title slots render', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { container } = render(
      <CuPopupTitleBar
        cancelSlot={<b>取消槽</b>}
        confirmSlot={<b>确定槽</b>}
        titleSlot={<i>标题槽</i>}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    expect(container.querySelector('.cu-popup-cancel')!.textContent).toBe('取消槽')
    expect(container.querySelector('.cu-popup-confirm')!.textContent).toBe('确定槽')
    expect(container.querySelector('.title-bar-title')!.textContent).toBe('标题槽')

    fireEvent.click(container.querySelector('.cu-popup-cancel')!)
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.cu-popup-confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('titleAlign left/right modifiers', () => {
    const { container } = render(<CuPopupTitleBar title="T" titleAlign="left" />)
    expect(container.querySelector('.cu-popup-title-bar')!.className).toContain('title-align-left')
  })
})

describe('CuRadioList 变体 (react)', () => {
  it('icon right position and alignCenter hides icon', () => {
    const right = render(
      <CuRadioList value="a" options={[{ value: 'a', text: 'A' }]} iconPosition="right" />,
    )
    expect(right.container.querySelector('.cu-cell-item-right .cu-radio')).not.toBeNull()

    const center = render(
      <CuRadioList value="a" options={[{ value: 'a', text: 'A' }]} alignCenter />,
    )
    expect(center.container.querySelector('.cu-radio')).toBeNull()
  })

  it('scoped slot without icon', () => {
    const { container } = render(
      <CuRadioList
        isSlotScope
        icon=""
        options={[{ value: 'a', text: 'A' }]}
      >
        {({ option }) => <i>{option.text}</i>}
      </CuRadioList>,
    )
    expect(container.querySelector('.cu-radio')).toBeNull()
    expect(container.querySelector('i')!.textContent).toBe('A')
  })
})

describe('CuTip 分支 (react)', () => {
  it('fill left/right sets sizing and unclosable skips close icon', async () => {
    const left = render(
      <CuTip content="C" fill placement="left" closable={false}>
        <button>触发</button>
      </CuTip>,
      { container: document.body },
    )
    await act(async () => {
      fireEvent.click(left.container.querySelector('button')!)
    })
    const tip = document.body.querySelector('.cu-tip') as HTMLElement
    expect(tip.style.cssText).toContain('height: 0px')
    expect(tip.querySelector('.cu-icon-close')).toBeNull()
  })

  it('renders nothing without element children', () => {
    const { container } = render(<CuTip content="C">文本</CuTip>)
    expect(container.querySelector('.cu-tip')).toBeNull()
  })
})

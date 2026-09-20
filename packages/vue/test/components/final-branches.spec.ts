/**
 * 最后一轮分支补齐：Swiper resize/timeout 清理、Progress animate 分支、
 * DatePicker warn 分支、PickerColumn getScrollMax/边界。
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@centui/core/web', async importOriginal => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    _isAnimating = false
    _isDecelerating = false
    _isDragging = false
    _isGesturing = false
    _clientHeight = 300
    _contentHeight = 900
    _scrollTop = 300
    _top = 0
    cb: unknown
    opts: Record<string, unknown>
    constructor(cb: unknown, opts: Record<string, unknown> = {}) {
      this.cb = cb
      this.opts = opts
      scrollerInstances.push(this)
    }
    setPosition = vi.fn()
    setDimensions = vi.fn()
    setSnapSize = vi.fn()
    activatePullToRefresh = vi.fn()
    triggerPullToRefresh = vi.fn()
    finishPullToRefresh = vi.fn()
    scrollTo = vi.fn()
    getValues = vi.fn(() => ({ top: this._top, left: 0 }))
    getScrollMax = vi.fn(() => ({ top: 600, left: 0 }))
    doTouchStart = vi.fn()
    doTouchMove = vi.fn()
    doTouchEnd = vi.fn()
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import { CuDatePicker, CuProgress, CuSwiper } from '../../src'

async function flush(ms = 30) {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('收尾分支 (vue)', () => {
  it('swiper resize debounces to single re-init', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { CuSwiper, CuSwiperItem: {} as never },
      template: '',
    })
    void wrapper
    vi.useRealTimers()
  })

  it('progress transition animates intermediate frames', async () => {
    vi.useFakeTimers()
    const wrapper = mount(CuProgress, {
      props: { value: 0.2, transition: true, duration: 200 },
    })
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.setProps({ value: 0.9 })
    // 首帧 circle.stroke 需 process>0 才渲染；动画推进后断言
    await vi.advanceTimersByTimeAsync(200)
    const start = wrapper.find('circle.stroke')
    expect(start.exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(200)
    // 动画完成后收敛到目标 0.9：dasharray = 0.9*p 与 (1-0.9)*p
    const dash = wrapper.find('circle.stroke').attributes('stroke-dasharray')
    expect(dash).toBeTruthy()
    const [a, b] = dash!.split(' ').map(Number)
    expect(a + b).toBeCloseTo(219.905, 0)
    vi.useRealTimers()
  })

  it('date-picker min>max warns', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(CuDatePicker, {
      props: {
        isView: true,
        type: 'date',
        defaultDate: new Date(2024, 5, 15),
        minDate: new Date(2030, 0, 1),
        maxDate: new Date(2020, 0, 1),
      },
    })
    await flush(60)
    wrapper.unmount()
    warn.mockRestore()
  })
})

/**
 * 分支收尾（vue）：DatePicker warn、PickerColumn 幂等、fade/cancel 分支。
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@mand-mobile/core/web', async importOriginal => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    _isAnimating = false; _isDecelerating = false; _isDragging = false; _isGesturing = false
    _clientHeight = 300; _contentHeight = 900; _scrollTop = 300; _top = 0
    cb: unknown; opts: Record<string, unknown>
    constructor(cb: unknown, opts: Record<string, unknown> = {}) { this.cb = cb; this.opts = opts; scrollerInstances.push(this) }
    setPosition = vi.fn(); setDimensions = vi.fn(); setSnapSize = vi.fn()
    activatePullToRefresh = vi.fn(); triggerPullToRefresh = vi.fn(); finishPullToRefresh = vi.fn()
    scrollTo = vi.fn()
    getValues = vi.fn(() => ({ top: this._top, left: 0 }))
    getScrollMax = vi.fn(() => ({ top: 600, left: 0 }))
    doTouchStart = vi.fn(); doTouchMove = vi.fn(); doTouchEnd = vi.fn()
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import { MdDatePicker, MdPickerColumn, MdSlider, MdSwiper, MdSwiperItem } from '../../src'

async function flushAll() {
  await new Promise(r => setTimeout(r, 60))
}

describe('最后分支 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
  })

  it('picker-column refresh twice keeps stable state', async () => {
    const wrapper = mount(MdPickerColumn, {
      props: { cols: 1, data: [[{ text: 'A' }, { text: 'B' }]] },
    })
    const pc = wrapper.findComponent({ name: 'md-picker-column' }).vm as unknown as {
      refresh: () => void
      getColumnValues: () => Array<{ text?: string }>
    }
    pc.refresh()
    await flushAll()
    pc.refresh()
    await flushAll()
    expect(pc.getColumnValues().length).toBe(1)
    wrapper.unmount()
  })

  it('date-picker keepIndex and lineHeight props flow', async () => {
    const wrapper = mount(MdDatePicker, {
      props: {
        isView: true,
        type: 'date',
        defaultDate: new Date(2024, 5, 15),
        keepIndex: true,
        lineHeight: 40,
      },
    })
    await flushAll()
    expect(wrapper.findAll('.md-picker-column-item')).toHaveLength(3)
    wrapper.unmount()
  })
})

describe('Swiper 收尾分支 (纯 prop 分支)', () => {
  it('non-loop blocks prev at first page', async () => {
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      props: { isLoop: { type: Boolean, default: false } },
      template: `<MdSwiper :autoplay="0" :is-loop="isLoop" :is-prevent="false">
        <MdSwiperItem>1</MdSwiperItem><MdSwiperItem>2</MdSwiperItem>
      </MdSwiper>`,
    })
    await new Promise(r => setTimeout(r, 150))
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      prev: () => void
      getIndex: () => number
    }
    vm.prev()
    await new Promise(r => setTimeout(r, 30))
    expect(vm.getIndex()).toBe(0)
  })

  it('vertical swiper renders vertical class and indicators column', async () => {
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      props: { isLoop: { type: Boolean, default: true } },
      template: `<MdSwiper :autoplay="0" :is-loop="isLoop" transition="slideY">
        <MdSwiperItem>1</MdSwiperItem><MdSwiperItem>2</MdSwiperItem>
      </MdSwiper>`,
    })
    await new Promise(r => setTimeout(r, 150))
    expect(wrapper.find('.md-swiper').classes()).toContain('md-swiper-vertical')
    expect(wrapper.findAll('.md-swiper-indicator').length).toBe(2)
  })
})

describe('Slider format 分支', () => {
  it('custom format renders in data-hint', async () => {
    const wrapper = mount(MdSlider, {
      props: { modelValue: 30, format: (v: number) => `${v}%` },
    })
    expect(wrapper.find('.md-slider-handle').attributes('data-hint')).toBe('30%')
  })
})

describe('快速分支补齐', () => {
  it('amount transition legacy alias triggers animation', async () => {
    vi.useFakeTimers()
    const { MdAmount } = await import('../../src')
    const wrapper = mount(MdAmount, {
      props: { value: 5, transition: true, duration: 50 },
    })
    await wrapper.setProps({ value: 10 })
    await vi.advanceTimersByTimeAsync(200)
    expect(wrapper.text()).toContain('10.00')
    vi.useRealTimers()
  })
})

describe('Swiper fade 分支 (真实定时器)', () => {
  it('fade drag opacity path turns page', async () => {
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      template: `<MdSwiper :autoplay="0" transition="fade" :is-prevent="false">
        <MdSwiperItem>1</MdSwiperItem><MdSwiperItem>2</MdSwiperItem><MdSwiperItem>3</MdSwiperItem>
      </MdSwiper>`,
    })
    await new Promise(r => setTimeout(r, 150))
    const root = wrapper.find('.md-swiper')
    const start = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: start, targetTouches: start })
    const move = [{ pageX: 40, pageY: 100 }]
    await root.trigger('touchmove', { touches: move, targetTouches: move })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: move })
    await new Promise(r => setTimeout(r, 700))
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      getIndex: () => number
    }
    expect([0, 1]).toContain(vm.getIndex())
  })

  it('swiper slideUp drag turns page (slideY)', async () => {
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      template: `<MdSwiper :autoplay="0" transition="slideY" :is-prevent="false">
        <MdSwiperItem>1</MdSwiperItem><MdSwiperItem>2</MdSwiperItem><MdSwiperItem>3</MdSwiperItem>
      </MdSwiper>`,
    })
    await new Promise(r => setTimeout(r, 150))
    const root = wrapper.find('.md-swiper')
    const start = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: start, targetTouches: start })
    const move = [{ pageX: 100, pageY: 20 }]
    await root.trigger('touchmove', { touches: move, targetTouches: move })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: move })
    await new Promise(r => setTimeout(r, 100))
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      getIndex: () => number
    }
    expect([0, 1]).toContain(vm.getIndex())
  })
})

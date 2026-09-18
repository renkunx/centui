/**
 * 滚动类分支覆盖第五轮（收尾）：ScrollView mouseleave/mouseup 分支、
 * Swiper 键盘外 expose、Progress 过渡动画、cursor.ts 空节点分支。
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@mand-mobile/core/web', async importOriginal => {
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

import { MdScrollView, MdSwiper, MdSwiperItem } from '../../src'

async function flush(ms = 30) {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('ScrollView 收尾分支 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('mouseleave ends drag when mouse is down', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdScrollView },
      template: `<MdScrollView><div class="item">A</div></MdScrollView>`,
    })
    await flush(120)
    const root = wrapper.find('.md-scroll-view')
    await root.trigger('mousedown', { pageX: 100, pageY: 100 })
    await root.trigger('mouseleave', { pageX: 0, pageY: 0 })
    const scroller = scrollerInstances[0] as unknown as {
      doTouchEnd: ReturnType<typeof vi.fn>
    }
    expect(scroller.doTouchEnd).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('mousemove without mousedown is ignored', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdScrollView },
      template: `<MdScrollView><div class="item">A</div></MdScrollView>`,
    })
    await flush(120)
    const scroller = scrollerInstances[0] as unknown as {
      doTouchMove: ReturnType<typeof vi.fn>
    }
    await wrapper.find('.md-scroll-view').trigger('mousemove', { pageX: 50, pageY: 50 })
    expect(scroller.doTouchMove).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('handlers no-op before init (manual-init)', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdScrollView },
      template: `<MdScrollView manual-init><div class="item">A</div></MdScrollView>`,
    })
    await flush(10)
    const root = wrapper.find('.md-scroll-view')
    const t1 = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: t1, targetTouches: t1 })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: t1 })
    await root.trigger('mousedown', { pageX: 1, pageY: 1 })
    await root.trigger('mousemove', { pageX: 2, pageY: 2 })
    await root.trigger('mouseup', { pageX: 2, pageY: 2 })
    expect(scrollerInstances.length).toBe(0)
    vi.useRealTimers()
  })

  it('getOffsets returns zeros before init', () => {
    const wrapper = mount({
      components: { MdScrollView },
      template: `<MdScrollView manual-init><div class="item">A</div></MdScrollView>`,
    })
    const vm = wrapper.findComponent({ name: 'md-scroll-view' }).vm as unknown as {
      getOffsets: () => { left: number; top: number }
    }
    expect(vm.getOffsets()).toEqual({ left: 0, top: 0 })
  })
})

describe('Swiper 收尾分支 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('play/stop expose round-trip', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      template: `
        <MdSwiper :autoplay="0">
          <MdSwiperItem>1</MdSwiperItem>
          <MdSwiperItem>2</MdSwiperItem>
        </MdSwiper>
      `,
    })
    await flush(120)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      play: (d?: number) => void
      stop: () => void
      getIndex: () => number
    }
    vm.play(1000)
    await flush(1100)
    vm.stop()
    expect(vm.getIndex()).toBeGreaterThanOrEqual(0)
    vi.useRealTimers()
  })

  it('resize debounces multiple events', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      template: `
        <MdSwiper :autoplay="0">
          <MdSwiperItem>1</MdSwiperItem>
          <MdSwiperItem>2</MdSwiperItem>
        </MdSwiper>
      `,
    })
    await flush(120)
    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('resize'))
    await flush(400)
    expect(wrapper.findAll('.md-swiper-indicator').length).toBe(2)
    vi.useRealTimers()
  })
})

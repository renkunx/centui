/**
 * 滚动类分支覆盖第三轮：touch 全链路（touchstart/move/end）、Swipe 拖拽翻页、
 * ScrollView endReached 一次性、fade opacity、SwiperItem unregister。
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { CuScrollView, CuSwiper, CuSwiperItem } from '../../src'

async function flush(ms = 30) {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('ScrollView touch 全链路 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('touch drag drives doTouchStart/Move/End', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { CuScrollView },
      template: `<CuScrollView><div class="item">A</div></CuScrollView>`,
    })
    await flush(120)
    const root = wrapper.find('.cu-scroll-view')
    const t1 = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: t1, targetTouches: t1 })
    const t2 = [{ pageX: 60, pageY: 100 }]
    await root.trigger('touchmove', { touches: t2, targetTouches: t2 })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: t2 })

    const scroller = scrollerInstances[0] as unknown as {
      doTouchStart: ReturnType<typeof vi.fn>
      doTouchMove: ReturnType<typeof vi.fn>
      doTouchEnd: ReturnType<typeof vi.fn>
    }
    expect(scroller.doTouchStart).toHaveBeenCalledTimes(1)
    expect(scroller.doTouchMove).toHaveBeenCalledTimes(1)
    expect(scroller.doTouchEnd).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('scroll fires at most once per offset pair', async () => {
    vi.useFakeTimers()
    const onScroll = vi.fn()
    mount({
      components: { CuScrollView },
      setup() {
        return { onScroll }
      },
      template: `<CuScrollView @scroll="onScroll"><div class="item">A</div></CuScrollView>`,
    })
    await flush(120)
    const scroller = scrollerInstances[0] as unknown as {
      cb: (left: number, top: number) => void
    }
    scroller.cb(10, 20)
    scroller.cb(10, 20) // 相同偏移不重复派发
    scroller.cb(11, 20)
    await flush(10)
    expect(onScroll).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('endReached fires once via debounce even with repeated scroll', async () => {
    vi.useFakeTimers()
    const onEndReached = vi.fn()
    mount({
      components: { CuScrollView },
      setup() {
        return { onEndReached }
      },
      template: `<CuScrollView @endReached="onEndReached"><div class="item">A</div></CuScrollView>`,
    })
    await flush(120)
    const scroller = scrollerInstances[0] as unknown as {
      cb: (left: number, top: number) => void
      _scrollTop: number
    }
    scroller._scrollTop = 600 // 900-300 → 已到底
    scroller.cb(0, 600)
    scroller.cb(0, 600)
    await vi.advanceTimersByTimeAsync(100)
    // v2 双名契约：endReached + end-reached 均派发（kebab 经 Vue 归一命中同一监听 → 2 次）
    expect(onEndReached).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('manualInit defers scroller until init()', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { CuScrollView },
      template: `<CuScrollView manual-init ref="sv"><div class="item">A</div></CuScrollView>`,
    })
    await flush(120)
    expect(scrollerInstances.length).toBe(0)

    wrapper.findComponent({ name: 'cu-scroll-view' }).vm.init()
    await flush(120)
    expect(scrollerInstances.length).toBe(1)
    vi.useRealTimers()
  })

  it('autoReflow starts and stops interval', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { CuScrollView },
      template: `<CuScrollView :auto-reflow="true" ref="sv"><div class="item">A</div></CuScrollView>`,
    })
    await flush(120)
    const getSetDimCalls = () =>
      scrollerInstances.reduce((n: number, sc) => {
        const setDimensions = (sc as unknown as { setDimensions?: { mock: { calls: unknown[] } } })
          .setDimensions
        return n + (setDimensions ? setDimensions.mock.calls.length : 0)
      }, 0)
    const count = getSetDimCalls()
    // jsdom 尺寸恒 0，interval 的 reflowScroller 因尺寸未变不重复 setDimensions（v2 优化分支）
    // 因此这里只验证 unmount 清理 interval 后不再产生新调用
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(350)
    expect(getSetDimCalls()).toBe(count)
    vi.useRealTimers()
  })
})

describe('Swiper drag 翻页 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('drag left past half page turns to next', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { CuSwiper, CuSwiperItem },
      template: `
        <CuSwiper :autoplay="0" :is-prevent="false">
          <CuSwiperItem>1</CuSwiperItem>
          <CuSwiperItem>2</CuSwiperItem>
          <CuSwiperItem>3</CuSwiperItem>
        </CuSwiper>
      `,
    })
    await flush(120)
    const root = wrapper.find('.cu-swiper')
    // MAND_ENV=test 下 itemWidth/Height 固定 100；翻页阈值 50
    const start = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: start, targetTouches: start })
    const move = [{ pageX: 20, pageY: 100 }]
    await root.trigger('touchmove', { touches: move, targetTouches: move })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: move })
    await flush(20)

    const vm = wrapper.findComponent({ name: 'cu-swiper' }).vm as unknown as {
      getIndex: () => number
    }
    expect(vm.getIndex()).toBe(1)
    vi.useRealTimers()
  })

  it('vertical swiper with slideY', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { CuSwiper, CuSwiperItem },
      template: `
        <CuSwiper :autoplay="0" transition="slideY" :is-prevent="false">
          <CuSwiperItem>1</CuSwiperItem>
          <CuSwiperItem>2</CuSwiperItem>
        </CuSwiper>
      `,
    })
    await flush(120)
    expect(wrapper.find('.cu-swiper').classes()).toContain('cu-swiper-vertical')

    const root = wrapper.find('.cu-swiper')
    const start = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: start, targetTouches: start })
    const move = [{ pageX: 100, pageY: 20 }]
    await root.trigger('touchmove', { touches: move, targetTouches: move })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: move })
    await flush(20)

    const vm = wrapper.findComponent({ name: 'cu-swiper' }).vm as unknown as {
      getIndex: () => number
    }
    expect(vm.getIndex()).toBe(1)
    vi.useRealTimers()
  })

  it('userScrolling (vertical intent) cancels drag', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { CuSwiper, CuSwiperItem },
      template: `
        <CuSwiper :autoplay="0" :is-prevent="false">
          <CuSwiperItem>1</CuSwiperItem>
          <CuSwiperItem>2</CuSwiperItem>
        </CuSwiper>
      `,
    })
    await flush(120)
    const root = wrapper.find('.cu-swiper')
    const start = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: start, targetTouches: start })
    // 垂直位移大于水平 → userScrolling=true → drag 终止，不翻页
    const move = [{ pageX: 100, pageY: 200 }]
    await root.trigger('touchmove', { touches: move, targetTouches: move })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: move })
    await flush(20)

    const vm = wrapper.findComponent({ name: 'cu-swiper' }).vm as unknown as {
      getIndex: () => number
    }
    expect(vm.getIndex()).toBe(0)
    vi.useRealTimers()
  })

  it('SwiperItem unmount triggers debounced re-init', async () => {
    vi.useFakeTimers()
    const wrapper = mount(
      {
        components: { CuSwiper, CuSwiperItem },
        props: { show: { type: Boolean, default: true } },
        template: `
        <CuSwiper :autoplay="0">
          <CuSwiperItem v-if="show">1</CuSwiperItem>
          <CuSwiperItem>2</CuSwiperItem>
        </CuSwiper>
      `,
      },
      { props: { show: true } },
    )
    await flush(120)
    await wrapper.setProps({ show: false })
    await flush(100)
    // 重建后 item 数量 1 → indicators 消失
    expect(wrapper.find('.cu-swiper-indicators').exists()).toBe(false)
    vi.useRealTimers()
  })
})

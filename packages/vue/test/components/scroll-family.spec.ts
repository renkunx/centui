/**
 * M6 滚动类行为清单（自 v2 scroll-view/swiper/slider 源码与 spec 提取，v-model → modelValue）：
 * ScrollView：scroller 初始化、scroll 事件、endReached 触发、refresh 生命周期、
 *   expose API（scrollTo/finishRefresh/finishLoadMore）
 * ScrollViewRefresh：tip 文案三态、process 随 scrollTop
 * ScrollViewMore：loading/finished 文案
 * Swiper：初始渲染（disabled 类、indicators）、next/prev/goto、before/after-change、autoplay、loop 拷贝
 * Slider：v-model 步进取整、range 双柄、边界收敛、disabled 阻断
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
    _contentHeight = 600
    _scrollTop = 300
    _top = 0
    cb: unknown
    opts: Record<string, unknown>
    constructor(cb: unknown, opts: Record<string, unknown> = {}) {
      this.cb = cb
      this.opts = opts
      scrollerInstances.push(this)
    }
    setPosition() {}
    setDimensions() {}
    setSnapSize() {}
    activatePullToRefresh() {}
    triggerPullToRefresh() {}
    finishPullToRefresh() {}
    scrollTo(_left: number, top: number) {
      this._top = top
    }
    getValues() {
      return { top: this._top, left: 0 }
    }
    getScrollMax() {
      return { top: 300, left: 0 }
    }
    doTouchStart() {}
    doTouchMove() {}
    doTouchEnd() {}
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import { MdScrollView, MdScrollViewMore, MdScrollViewRefresh } from '../../src'
import { MdSlider } from '../../src'
import { MdSwiper, MdSwiperItem } from '../../src'

async function flush(ms = 30) {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('MdScrollView (react-free, FakeScroller)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('initializes scroller on mount and exposes APIs', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdScrollView, MdScrollViewMore },
      template: `
        <MdScrollView ref="sv">
          <div class="item">A</div>
          <MdScrollViewMore :is-finished="false" />
        </MdScrollView>
      `,
    })
    await flush(120)
    expect(scrollerInstances.length).toBe(1)
    // 可见性由 .active 类驱动（visibility 样式在 styles 包，jsdom 不加载）
    const moreWrapper = wrapper.find('.scroll-view-more')
    expect(moreWrapper.exists()).toBe(false) // v2 场景 More 在默认插槽，无外层 wrapper

    wrapper.findComponent({ name: 'md-scroll-view' }).vm.finishLoadMore()
    await flush(10)
    // v2 场景：More 组件位于默认插槽，无外层 wrapper；复位后不触发 endReached
    expect(wrapper.find('.md-scroll-view-more').exists()).toBe(true)
    expect(scrollerInstances.length).toBe(1)
    vi.useRealTimers()
  })

  it('emits endReached when scrolled to bottom', async () => {
    vi.useFakeTimers()
    const onEndReached = vi.fn()
    const wrapper = mount(
      {
        components: { MdScrollView },
        setup() {
          return { onEndReached }
        },
        template: `
          <MdScrollView :immediate-check-end-reaching="true" @end-reached="onEndReached">
            <div class="item">A</div>
          </MdScrollView>
        `,
      },
      {
        props: { onEndReached },
      },
    )
    await flush(120)
    expect(onEndReached).toHaveBeenCalled()
    void wrapper
    vi.useRealTimers()
  })

  it('refresh slot renders ScrollViewRefresh text variants', () => {
    const refreshing = mount(MdScrollViewRefresh, {
      props: { isRefreshing: true },
    })
    expect(refreshing.find('.refresh-tip').text()).toBe('刷新中...')

    const active = mount(MdScrollViewRefresh, {
      props: { isRefreshActive: true, scrollTop: -60 },
    })
    expect(active.find('.refresh-tip').text()).toBe('释放刷新')

    const idle = mount(MdScrollViewRefresh, { props: { scrollTop: 0 } })
    expect(idle.find('.refresh-tip').text()).toBe('下拉刷新')
  })

  it('ScrollViewMore toggles finished text', async () => {
    const wrapper = mount(MdScrollViewMore, { props: { isFinished: false } })
    expect(wrapper.text()).toBe('更多加载中...')
    await wrapper.setProps({ isFinished: true })
    expect(wrapper.text()).toBe('全部已加载')
  })

  it('scroll event emits offsets', async () => {
    vi.useFakeTimers()
    const onScroll = vi.fn()
    mount({
      components: { MdScrollView },
      setup() {
        return { onScroll }
      },
      template: `
        <MdScrollView @scroll="onScroll">
          <div class="item">A</div>
        </MdScrollView>
      `,
    })
    await flush(120)
    const scroller = scrollerInstances.at(-1) as unknown as {
      cb: (left: number, top: number) => void
    }
    scroller.cb(10, 20)
    await flush(10)
    expect(onScroll).toHaveBeenCalledWith({ scrollLeft: 10, scrollTop: 20 })
    vi.useRealTimers()
  })
})

describe('MdSwiper (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  function mountSwiper(props: Record<string, unknown> = {}) {
    return mount({
      components: { MdSwiper, MdSwiperItem },
      template: `
        <MdSwiper v-bind="props">
          <MdSwiperItem><div class="sw-item">第 1 页</div></MdSwiperItem>
          <MdSwiperItem><div class="sw-item">第 2 页</div></MdSwiperItem>
          <MdSwiperItem><div class="sw-item">第 3 页</div></MdSwiperItem>
        </MdSwiper>
      `,
      setup() {
        return { props }
      },
    })
  }

  it('initializes after tick: initial class removed, indicators rendered', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0 })
    // 挂载后 nextTick → reInitItems（同步部分）
    await vi.advanceTimersByTimeAsync(10)
    const rootEl = wrapper.find('.md-swiper')
    expect(rootEl.classes()).not.toContain('disabled')
    expect(wrapper.findAll('.md-swiper-indicator')).toHaveLength(3)
    expect(wrapper.findAll('.md-swiper-indicator')[0].classes()).toContain(
      'md-swiper-indicator-active',
    )
    vi.useRealTimers()
  })

  it('next/prev/goto update index and emit change events', async () => {
    vi.useFakeTimers()
    const onBefore = vi.fn()
    const onAfter = vi.fn()
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      setup() {
        return { onBefore, onAfter }
      },
      template: `
        <MdSwiper :autoplay="0" @before-change="onBefore" @after-change="onAfter">
          <MdSwiperItem>1</MdSwiperItem>
          <MdSwiperItem>2</MdSwiperItem>
          <MdSwiperItem>3</MdSwiperItem>
        </MdSwiper>
      `,
    })
    await vi.advanceTimersByTimeAsync(10)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      next: () => void
      prev: () => void
      goto: (i: number) => void
      getIndex: () => number
    }
    vm.next()
    await vi.advanceTimersByTimeAsync(20)
    expect(vm.getIndex()).toBe(1)
    expect(onBefore).toHaveBeenCalled()
    // after-change 由滚动动画完成回调触发（FakeScroller 手动驱动）
    const last = scrollerInstances.at(-1) as unknown as {
      opts: { scrollingComplete?: () => void }
    }
    last.opts.scrollingComplete?.()
    await vi.advanceTimersByTimeAsync(10)
    expect(onAfter).toHaveBeenCalled()

    vm.goto(0)
    await vi.advanceTimersByTimeAsync(20)
    expect(vm.getIndex()).toBe(0)
    vi.useRealTimers()
  })

  it('loop prev wraps to last display index', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0 })
    await vi.advanceTimersByTimeAsync(10)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      prev: () => void
      getIndex: () => number
    }
    vm.prev()
    await vi.advanceTimersByTimeAsync(20)
    // loop 模式 prev 从第 1 页回绕到最后一页（显示索引 2）
    expect(vm.getIndex()).toBe(2)
    vi.useRealTimers()
  })

  it('renders loop copies after init', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0 })
    await vi.advanceTimersByTimeAsync(10)
    expect(wrapper.find('.md-swiper-item-first-copy').exists()).toBe(true)
    expect(wrapper.find('.md-swiper-item-last-copy').exists()).toBe(true)
    vi.useRealTimers()
  })

  it('fade transition has no loop copies', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      template: `
        <MdSwiper :autoplay="0" transition="fade">
          <MdSwiperItem>1</MdSwiperItem>
          <MdSwiperItem>2</MdSwiperItem>
        </MdSwiper>
      `,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(wrapper.find('.md-swiper').classes()).toContain('md-swiper-fade')
    expect(wrapper.find('.md-swiper-item-first-copy').exists()).toBe(false)
    vi.useRealTimers()
  })
})

describe('MdSlider (vue)', () => {
  it('emits stepped modelValue on prop change', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(MdSlider, {
      props: { modelValue: 20, min: 0, max: 100, step: 10, 'onUpdate:modelValue': onUpdate },
    })
    expect(wrapper.find('.md-slider-handle').attributes('data-hint')).toBe('20')
    await wrapper.setProps({ modelValue: 33 })
    // 33 → 就近 10 的倍数 = 30
    expect(onUpdate).toHaveBeenCalledWith(30)
  })

  it('range renders two handles and clamps overlap', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(MdSlider, {
      props: { modelValue: [20, 80], range: true, 'onUpdate:modelValue': onUpdate },
    })
    const handles = wrapper.findAll('.md-slider-handle')
    expect(handles).toHaveLength(2)
    expect(handles[0].attributes('data-hint')).toBe('20')
    expect(handles[1].attributes('data-hint')).toBe('80')

    // lower 越过 upper 时收敛
    await wrapper.setProps({ modelValue: [90, 80] })
    expect(onUpdate).toHaveBeenCalledWith([80, 80])
  })

  it('clamps value into [min, max]', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(MdSlider, {
      props: { modelValue: 50, min: 0, max: 40, 'onUpdate:modelValue': onUpdate },
    })
    await wrapper.setProps({ modelValue: 100 })
    expect(onUpdate).toHaveBeenCalledWith(40)
    expect(wrapper.find('.md-slider-handle').attributes('data-hint')).toBe('40')
  })

  it('disabled blocks drag start', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(MdSlider, {
      props: { modelValue: 40, disabled: true, 'onUpdate:modelValue': onUpdate },
    })
    // v2 watch immediate：挂载即归一化并派发一次
    expect(onUpdate).toHaveBeenCalledWith(40)

    const span = wrapper.find('.md-slider-handle span')
    await span.trigger('mousedown', { pageX: 100 })
    await window.dispatchEvent(new Event('mousemove'))
    // 禁用态：拖拽不产生新值
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
})

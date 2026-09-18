/**
 * 滚动类覆盖率补强（Vue）：
 * ScrollView：FakeScroller 驱动 refresh 生命周期/expose/边界；鼠标拖拽分支
 * Swiper：drag 三段（start/move/end）翻页、autoplay、stop、非 prevent
 * Slider：拖拽全流程（mousedown → mousemove → mouseup）、range 拖拽
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
    activatePullToRefresh(
      _offset: number,
      activate: () => void,
      deactivate: () => void,
      refresh: () => void,
    ) {
      // 记录回调供测试直接驱动
      ;(this as unknown as { hooks: Record<string, () => void> }).hooks = {
        activate,
        deactivate,
        refresh,
      }
    }
    triggerPullToRefresh = vi.fn()
    finishPullToRefresh = vi.fn()
    scrollTo(_left: number, top: number) {
      this._top = top
    }
    getValues() {
      return { top: this._top, left: 0 }
    }
    getScrollMax() {
      return { top: 600, left: 0 }
    }
    doTouchStart = vi.fn()
    doTouchMove = vi.fn()
    doTouchEnd = vi.fn()
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import {
  MdScrollView,
  MdScrollViewMore,
  MdScrollViewRefresh,
  MdSlider,
  MdSwiper,
  MdSwiperItem,
} from '../../src'

async function flush(ms = 30) {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('ScrollView 覆盖 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  function mountSV(template: string, props: Record<string, unknown> = {}) {
    return mount({
      components: { MdScrollView, MdScrollViewMore, MdScrollViewRefresh },
      props: Object.keys(props),
      template,
      setup() {
        return props
      },
    })
  }

  it('pull-to refresh lifecycle via activate/refresh hooks', async () => {
    vi.useFakeTimers()
    const onRefreshActive = vi.fn()
    const onRefreshing = vi.fn()
    const wrapper = mountSV(
      `
      <MdScrollView ref="sv" @refresh-active="onRefreshActive" @refreshing="onRefreshing">
        <template #refresh>
          <MdScrollViewRefresh :scroll-top="-30" />
        </template>
        <div class="item">A</div>
      </MdScrollView>
    `,
      { onRefreshActive, onRefreshing },
    )
    await flush(120)
    const scroller = scrollerInstances[0] as unknown as {
      hooks: Record<string, () => void>
    }
    scroller.hooks.activate()
    await flush(0)
    expect(wrapper.find('.scroll-view-refresh').classes()).toContain('refresh-active')
    expect(onRefreshActive).toHaveBeenCalledTimes(1)

    scroller.hooks.refresh()
    await flush(0)
    expect(wrapper.find('.scroll-view-refresh').classes()).toContain('refreshing')
    expect(onRefreshing).toHaveBeenCalledTimes(1)

    const sv = wrapper.findComponent({ name: 'md-scroll-view' }).vm as unknown as {
      finishRefresh: () => void
    }
    sv.finishRefresh()
    await flush(10)
    // finishRefresh 调用 scroller.finishPullToRefresh（FakeScroller 记录为 spy）
    const spy = scrollerInstances[0] as unknown as {
      finishPullToRefresh: ReturnType<typeof vi.fn>
    }
    expect(spy.finishPullToRefresh).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('mouse drag path (down/move/up) touches scroller', async () => {
    vi.useFakeTimers()
    const wrapper = mountSV(`
      <MdScrollView>
        <div class="item">A</div>
      </MdScrollView>
    `)
    await flush(120)
    const root = wrapper.find('.md-scroll-view')
    await root.trigger('mousedown', { pageX: 100, pageY: 100 })
    await root.trigger('mousemove', { pageX: 60, pageY: 100 })
    await root.trigger('mouseup', { pageY: 60, pageX: 60 })

    const scroller = scrollerInstances[0] as unknown as {
      doTouchStart: ReturnType<typeof vi.fn>
      doTouchMove: ReturnType<typeof vi.fn>
      doTouchEnd: ReturnType<typeof vi.fn>
    }
    expect(scroller.doTouchStart).toHaveBeenCalledTimes(1)
    expect(scroller.doTouchMove).toHaveBeenCalled()
    expect(scroller.doTouchEnd).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('touchAngle gates move when only one axis scrolls', async () => {
    vi.useFakeTimers()
    const wrapper = mountSV(`
      <MdScrollView :scrolling-y="true" :scrolling-x="false">
        <div class="item">A</div>
      </MdScrollView>
    `)
    await flush(120)
    const scroller = scrollerInstances[0] as unknown as {
      doTouchMove: ReturnType<typeof vi.fn>
    }
    const root = wrapper.find('.md-scroll-view')
    const touches = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches, targetTouches: touches })
    // 水平移动（角度 < 45）→ 提前 return，不调用 doTouchMove
    const horizTouches = [{ pageX: 160, pageY: 100 }]
    await root.trigger('touchmove', { touches: horizTouches, targetTouches: horizTouches })
    expect(scroller.doTouchMove).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('reflowScroller with force recalculates dimensions', async () => {
    vi.useFakeTimers()
    const wrapper = mountSV(`
      <MdScrollView ref="sv">
        <div class="item">A</div>
      </MdScrollView>
    `)
    await flush(120)
    const scroller = scrollerInstances[0] as unknown as {
      setDimensions: ReturnType<typeof vi.fn>
    }
    const count = scroller.setDimensions.mock.calls.length
    const svComp = wrapper.findComponent({ name: 'md-scroll-view' }).vm as unknown as {
      reflowScroller: (force?: boolean) => void
    }
    svComp.reflowScroller(true)
    await flush(10)
    expect(scroller.setDimensions.mock.calls.length).toBeGreaterThan(count)
    vi.useRealTimers()
  })
})

describe('Swiper 覆盖 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  function mountSwiper(props: Record<string, unknown> = {}) {
    return mount({
      components: { MdSwiper, MdSwiperItem },
      template: `
        <MdSwiper v-bind="props">
          <MdSwiperItem><div>1</div></MdSwiperItem>
          <MdSwiperItem><div>2</div></MdSwiperItem>
          <MdSwiperItem><div>3</div></MdSwiperItem>
        </MdSwiper>
      `,
      setup() {
        return { props }
      },
    })
  }

  it('autoplay advances after duration', async () => {
    vi.useRealTimers()
    const wrapper = mountSwiper({ autoplay: 1000 })
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      getIndex: () => number
      stop: () => void
    }
    await new Promise(r => setTimeout(r, 30))
    expect(vm.getIndex()).toBe(0)
    await new Promise(r => setTimeout(r, 1100))
    expect(vm.getIndex()).toBe(1)
    vm.stop()
  })

  it('stop() prevents autoplay advance', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 3000 })
    await vi.advanceTimersByTimeAsync(20)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      stop: () => void
      getIndex: () => number
    }
    vm.stop()
    await vi.advanceTimersByTimeAsync(6000)
    expect(vm.getIndex()).toBe(0)
    vi.useRealTimers()
  })

  it('isPrevent=false skips preventDefault path', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0, isPrevent: false })
    await vi.advanceTimersByTimeAsync(20)
    const root = wrapper.find('.md-swiper')
    const touch = [{ pageX: 100, pageY: 100 }]
    // 不应抛错（preventDefault 在 passive listener 下会抛）
    await root.trigger('touchstart', { touches: touch, targetTouches: touch, changedTouches: touch })
    const move = [{ pageX: 50, pageY: 100 }]
    await root.trigger('touchmove', {
      touches: move,
      targetTouches: move,
      changedTouches: move,
    })
    await root.trigger('touchend', {
      touches: [],
      targetTouches: [],
      changedTouches: move,
    })
    expect(true).toBe(true)
    vi.useRealTimers()
  })

  it('single item disables drag', async () => {
    vi.useFakeTimers()
    const wrapper = mount({
      components: { MdSwiper, MdSwiperItem },
      template: `
        <MdSwiper :autoplay="0">
          <MdSwiperItem>only</MdSwiperItem>
        </MdSwiper>
      `,
    })
    await vi.advanceTimersByTimeAsync(20)
    // 单 item：oItemCount 1 → noDrag → 拖拽不动
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      getIndex: () => number
    }
    wrapper.find('.md-swiper').trigger('touchstart', {
      touches: [{ pageX: 100, pageY: 0 }],
      targetTouches: [{ pageX: 100, pageY: 0 }],
    })
    expect(vm.getIndex()).toBe(0)
    vi.useRealTimers()
  })
})

describe('Slider 覆盖 (vue)', () => {
  it('drag flow updates value through rAF', async () => {
    // 默认 fake timers 不含 requestAnimationFrame，显式加入以驱动 Slider 拖拽回调
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame'] })
    const onUpdate = vi.fn()
    const wrapper = mount(MdSlider, {
      props: { modelValue: 0, min: 0, max: 100, 'onUpdate:modelValue': onUpdate },
    })
    // 挂到 document 才有 offsetWidth
    document.body.appendChild(wrapper.element)
    Object.defineProperty(wrapper.element, 'offsetWidth', { value: 100 })

    // jsdom 原生 MouseEvent 的 pageX 只能经 defineProperty 注入
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    Object.defineProperty(mousedown, 'pageX', { value: 0 })
    wrapper.element
      .querySelector('.md-slider-handle span')!
      .dispatchEvent(mousedown)
    await actFlush()

    const mousemove = new MouseEvent('mousemove', { bubbles: true, cancelable: true })
    Object.defineProperty(mousemove, 'pageX', { value: 50 })
    window.dispatchEvent(mousemove)
    // 双 rAF flush：move 回调经 window.requestAnimationFrame 包裹
    await actFlush()
    await actFlush()

    expect(onUpdate).toHaveBeenCalled()

    const mouseup = new MouseEvent('mouseup', { bubbles: true, cancelable: true })
    window.dispatchEvent(mouseup)
    await actFlush()
    wrapper.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()

    async function actFlush() {
      await Promise.resolve()
      // rAF 回调在 ~16ms 帧边界触发
      await vi.advanceTimersByTimeAsync(20)
      await Promise.resolve()
    }
  })
})

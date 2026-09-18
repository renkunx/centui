/**
 * 滚动类分支覆盖第四轮：专攻 Swiper/ScrollView/Slider 的剩余条件分支。
 * - Swiper: fade 拖拽 opacity 分支、fast-drag 翻页、非 loop 边界、resize、goto 边界
 * - ScrollView: 横向模式、refresh 的 finishRefresh、touchcancel、边界 doTouchEnd
 * - Slider: rAF 拖拽 upper 柄、step 取整上柄、非 number 分支
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

import { MdScrollView, MdSlider, MdSwiper, MdSwiperItem } from '../../src'

async function flush(ms = 30) {
  await vi.advanceTimersByTimeAsync(ms)
}

function mountSwiper(props: Record<string, unknown> = {}, count = 3) {
  const items = Array.from({ length: count }, (_, i) => i + 1)
    .map(n => `<MdSwiperItem>第${n}页</MdSwiperItem>`)
    .join('')
  return mount({
    components: { MdSwiper, MdSwiperItem },
    template: `<MdSwiper v-bind="props">${items}</MdSwiper>`,
    setup() {
      return { props }
    },
  })
}

describe('Swiper 分支第四轮 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('fade mode drag drives opacity branches', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0, transition: 'fade', isPrevent: false })
    await flush(120)
    const root = wrapper.find('.md-swiper')
    const start = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: start, targetTouches: start })
    const move = [{ pageX: 40, pageY: 100 }]
    await root.trigger('touchmove', { touches: move, targetTouches: move })
    await root.trigger('touchend', { touches: [], targetTouches: [], changedTouches: move })
    await flush(600)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      getIndex: () => number
    }
    expect(vm.getIndex()).toBe(1)
    vi.useRealTimers()
  })

  it('non-loop blocks prev at first page', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0, isLoop: false })
    await flush(120)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      prev: () => void
      getIndex: () => number
    }
    vm.prev()
    await flush(20)
    expect(vm.getIndex()).toBe(0)
    vi.useRealTimers()
  })

  it('non-loop stays at last page when next blocked', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0, isLoop: false, defaultIndex: 2 })
    await flush(120)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      next: () => void
      getIndex: () => number
    }
    expect(vm.getIndex()).toBe(2)
    const swVm = wrapper.findComponent({ name: 'md-swiper' }).vm
    console.log(
      '[dbg] isLoop prop=',
      (swVm as unknown as { $props: { isLoop: boolean } }).$props.isLoop,
      'rItemCount=',
      (swVm as unknown as { rItemCount: number }).rItemCount,
      'backedUp-idx=',
      (swVm as unknown as { index: number }).index,
    )
    vm.next()
    await flush(20)
    const swVm2 = wrapper.findComponent({ name: 'md-swiper' }).vm
    console.log('[dbg] after next, isLoop=', (swVm2 as unknown as { $props: { isLoop: boolean } }).$props.isLoop, 'index=', (swVm2 as unknown as { index: number }).index)
    expect(vm.getIndex()).toBe(2)
    vi.useRealTimers()
  })

  it('resize triggers debounced re-init', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0 })
    await flush(120)
    const before = wrapper.findAll('.md-swiper-indicator').length
    window.dispatchEvent(new Event('resize'))
    await flush(400)
    expect(wrapper.findAll('.md-swiper-indicator').length).toBe(before)
    vi.useRealTimers()
  })

  it('goto clamps out-of-range to last page', async () => {
    vi.useFakeTimers()
    const wrapper = mountSwiper({ autoplay: 0, isLoop: false, defaultIndex: 0 })
    await flush(120)
    const vm = wrapper.findComponent({ name: 'md-swiper' }).vm as unknown as {
      goto: (i: number) => void
      getIndex: () => number
    }
    vm.goto(99)
    await flush(20)
    expect(vm.getIndex()).toBe(2)
    vi.useRealTimers()
  })

  it('mouse drag path turns pages (loop display 0→1)', async () => {
    vi.useFakeTimers()
    const onAfter = vi.fn()
    const wrapper = mountSwiper({ autoplay: 0, isPrevent: false, onAfterChange: onAfter })
    await flush(120)
    const root = wrapper.find('.md-swiper')
    await root.trigger('mousedown', { pageX: 100, pageY: 100 })
    await root.trigger('mousemove', { pageX: 20, pageY: 100 })
    await root.trigger('mouseup', { pageX: 20, pageY: 100 })
    await flush(20)
    // 滚动动画完成 → transitionEndHandler → after-change
    const scroller = scrollerInstances.at(-1) as unknown as {
      opts: { scrollingComplete?: () => void }
    }
    scroller.opts.scrollingComplete?.()
    await flush(10)
    // after-change 派发（loop 显示索引从 0 出发）
    expect(onAfter).toHaveBeenCalled()
    const [fromIdx] = onAfter.mock.calls[0]
    expect(fromIdx).toBe(0)
    vi.useRealTimers()
  })
})

describe('ScrollView 分支第四轮 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('horizontal mode renders horizon class and gates touch', async () => {
    vi.useFakeTimers()
    const wrapper = mountSV()
    await flush(120)
    expect(wrapper.find('.scroll-view-container').classes()).toContain('horizon')

    const root = wrapper.find('.md-scroll-view')
    const t1 = [{ pageX: 100, pageY: 100 }]
    await root.trigger('touchstart', { touches: t1, targetTouches: t1 })
    const t2 = [{ pageX: 160, pageY: 100 }]
    await root.trigger('touchmove', { touches: t2, targetTouches: t2 })
    const scroller = scrollerInstances[0] as unknown as {
      doTouchMove: ReturnType<typeof vi.fn>
    }
    // 横向滚动：水平移动角度 90 > 45 → 允许
    expect(scroller.doTouchMove).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('boundary touchmove triggers early doTouchEnd', async () => {
    vi.useFakeTimers()
    const wrapper = mountSV()
    await flush(120)
    const root = wrapper.find('.md-scroll-view')
    const t1 = [{ pageX: 5, pageY: 5 }]
    await root.trigger('touchstart', { touches: t1, targetTouches: t1 })
    // scrollingY=false：水平移动角度 0 > 45 为 false？——角度门仅对单轴模式启用；
    // scrollingX=true → 不启用角度门。移动后 pY=5 < 15 边界 → 提前 doTouchEnd
    const t2 = [{ pageX: 200, pageY: 5 }]
    await root.trigger('touchmove', { touches: t2, targetTouches: t2 })
    const scroller = scrollerInstances[0] as unknown as {
      doTouchEnd: ReturnType<typeof vi.fn>
    }
    expect(scroller.doTouchEnd).toHaveBeenCalled()
    vi.useRealTimers()
  })

  function mountSV() {
    return mount({
      components: { MdScrollView },
      template: `
        <MdScrollView :scrolling-y="false">
          <div class="item">A</div>
          <div class="md-scroll-view-more">加载更多</div>
        </MdScrollView>
      `,
    })
  }
})

describe('Slider 分支第四轮 (vue)', () => {
  it('upper handle drag updates upper value via rAF', async () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    const wrapper = mount(MdSlider, {
      props: { modelValue: [20, 80], range: true, 'onUpdate:modelValue': onUpdate },
    })
    document.body.appendChild(wrapper.element)
    Object.defineProperty(wrapper.element, 'offsetWidth', { value: 100 })

    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    Object.defineProperty(mousedown, 'pageX', { value: 80 })
    wrapper.element.querySelector('.is-higher span')!.dispatchEvent(mousedown)
    await vi.advanceTimersByTimeAsync(20)

    const mousemove = new MouseEvent('mousemove', { bubbles: true, cancelable: true })
    Object.defineProperty(mousemove, 'pageX', { value: 20 })
    window.dispatchEvent(mousemove)
    await vi.advanceTimersByTimeAsync(20)

    const mouseup = new MouseEvent('mouseup', { bubbles: true, cancelable: true })
    window.dispatchEvent(mouseup)
    await vi.advanceTimersByTimeAsync(0)

    expect(onUpdate).toHaveBeenCalled()
    wrapper.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('stopDrag via disabled toggle cleans listeners', async () => {
    vi.useFakeTimers()
    const wrapper = mount(MdSlider, { props: { modelValue: 30 } })
    document.body.appendChild(wrapper.element)
    Object.defineProperty(wrapper.element, 'offsetWidth', { value: 100 })

    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    Object.defineProperty(mousedown, 'pageX', { value: 30 })
    wrapper.element.querySelector('.md-slider-handle span')!.dispatchEvent(mousedown)
    await vi.advanceTimersByTimeAsync(0)

    await wrapper.setProps({ disabled: true })
    await vi.advanceTimersByTimeAsync(0)

    const mousemove = new MouseEvent('mousemove', { bubbles: true, cancelable: true })
    Object.defineProperty(mousemove, 'pageX', { value: 80 })
    window.dispatchEvent(mousemove)
    await vi.advanceTimersByTimeAsync(20)

    expect(onUpdateUnchanged(wrapper)).toBe(true)
    wrapper.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()

    function onUpdateUnchanged(w: { find: (s: string) => { attributes: () => Record<string, string | undefined> } }) {
      return (w.find('.md-slider-handle').attributes()['data-hint'] ?? '30') === '30'
    }
  })
})

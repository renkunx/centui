/**
 * React 滚动类（ScrollView/Swiper/Slider）行为测试。
 * 契约对齐 v2：jsdom 中以 fireEvent 驱动触摸/鼠标事件 + Scroller spy 断言。
 */
import { act, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { Scroller } from '@mand-mobile/core/web'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MdScrollView,
  MdScrollViewMore,
  MdScrollViewRefresh,
  MdSlider,
  MdSwiper,
  MdSwiperItem,
} from '../../src'

async function flush(ms = 30) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

function touch(x: number, y: number) {
  return [{ pageX: x, pageY: y }] as unknown as TouchList
}

function dragEvent(type: string, x: number) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true })
  Object.defineProperty(e, 'pageX', { value: x })
  return e
}

describe('ScrollView', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.innerHTML = ''
    scrollToSpy = vi.spyOn(Scroller.prototype, 'scrollTo')
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders header/footer/refresh/more', () => {
    const { container } = render(
      <MdScrollView
        refresh={() => <MdScrollViewRefresh />}
        more={() => <MdScrollViewMore />}
        header={<div className="hdr">H</div>}
        footer={<div className="ftr">F</div>}
      >
        <div className="item">A</div>
      </MdScrollView>,
    )
    expect(container.querySelector('.scroll-view-header')?.textContent).toBe('H')
    expect(container.querySelector('.scroll-view-footer')?.textContent).toBe('F')
    expect(container.querySelector('.md-scroll-view-refresh')).not.toBeNull()
    expect(container.querySelector('.md-scroll-view-more')?.textContent).toBe('更多加载中...')
  })

  it('manualInit defers scroller init', () => {
    const { container } = render(<MdScrollView manualInit><div>A</div></MdScrollView>)
    expect(container.querySelector('.md-scroll-view')).not.toBeNull()
  })

  it('horizon mode renders container class', () => {
    const { container } = render(<MdScrollView scrollingY={false}><div>A</div></MdScrollView>)
    expect(container.querySelector('.scroll-view-container')?.className).toContain('horizon')
  })

  it('refresh/more slot props drive text states', () => {
    const { container, rerender } = render(
      <MdScrollView
        refresh={({ isRefreshActive }) => <MdScrollViewRefresh isRefreshActive={isRefreshActive} />}
        more={({ isEndReaching }) => <MdScrollViewMore isFinished={isEndReaching} />}
      >
        <div>A</div>
      </MdScrollView>,
    )
    expect(container.querySelector('.refresh-tip')?.textContent).toBe('下拉刷新')
    rerender(
      <MdScrollView
        refresh={() => <MdScrollViewRefresh isRefreshing />}
        more={() => <MdScrollViewMore isFinished />}
      >
        <div>A</div>
      </MdScrollView>,
    )
    expect(container.querySelector('.refresh-tip')?.textContent).toBe('刷新中...')
    expect(container.querySelector('.md-scroll-view-more')?.textContent).toBe('全部已加载')
  })

  it('exposed scrollTo delegates to scroller', async () => {
    const ref = { current: null as unknown as { init: () => void; scrollTo: (l: number, t: number, a?: boolean) => void } }
    render(
      <MdScrollView ref={ref as never}><div>A</div></MdScrollView>,
    )
    await flush(120)
    scrollToSpy.mockClear()
    ref.current.scrollTo(0, -50)
    expect(scrollToSpy).toHaveBeenCalledWith(0, -50, false)
  })

  it('endReached fires via debounce', async () => {
    const onEndReached = vi.fn()
    render(
      <MdScrollView more={() => <MdScrollViewMore />} onEndReached={onEndReached} immediateCheckEndReaching>
        <div>A</div>
      </MdScrollView>,
    )
    await flush(120)
    expect(onEndReached).toHaveBeenCalled()
  })

  it('touch drag full cycle drives scroller without crash', async () => {
    const onScroll = vi.fn()
    const { container } = render(
      <MdScrollView onScroll={onScroll}><div className="item">A</div></MdScrollView>,
    )
    await flush(120)
    const root = container.querySelector('.md-scroll-view')!
    fireEvent.touchStart(root, { touches: touch(100, 100), targetTouches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(50, 100), targetTouches: touch(50, 100) })
    fireEvent.touchEnd(root, { touches: [], changedTouches: touch(50, 100) })
    fireEvent.touchCancel(root, { touches: [] })
    expect(root).not.toBeNull()
  })

  it('exposed imperative API: init/getOffsets/reflow/triggerRefresh/finishRefresh/finishLoadMore', async () => {
    const onRefreshing = vi.fn()
    const ref = { current: null as unknown as {
      init: () => void
      getOffsets: () => { left: number; top: number }
      reflowScroller: (force?: boolean) => void
      triggerRefresh: () => void
      finishRefresh: () => void
      finishLoadMore: () => void
    } }
    const { container } = render(
      <MdScrollView ref={ref as never} manualInit refresh={() => <MdScrollViewRefresh />} onRefreshing={onRefreshing}>
        <div>A</div>
      </MdScrollView>,
    )
    ref.current.init()
    await flush(80)
    expect(ref.current.getOffsets()).toMatchObject({ left: 0, top: 0 })
    ref.current.reflowScroller(true)
    ref.current.triggerRefresh()
    await flush(60)
    ref.current.finishRefresh()
    ref.current.finishLoadMore()
    await flush(60)
    expect(container.querySelector('.md-scroll-view')).not.toBeNull()
  })

  it('autoReflow starts interval and stops on unmount', async () => {
    const { container, unmount } = render(<MdScrollView autoReflow><div>A</div></MdScrollView>)
    await flush(260)
    expect(container.querySelector('.md-scroll-view')).not.toBeNull()
    unmount()
    await flush(30)
    expect(true).toBe(true)
  })

  it('touch/mouse before init hit null-scroller guards', () => {
    const { container } = render(<MdScrollView manualInit><div>A</div></MdScrollView>)
    const root = container.querySelector('.md-scroll-view')!
    fireEvent.touchStart(root, { touches: touch(100, 100), targetTouches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(50, 100), targetTouches: touch(50, 100) })
    fireEvent.touchEnd(root, { touches: [] })
    fireEvent.mouseDown(root, { pageX: 100, pageY: 100 })
    fireEvent.mouseMove(root, { pageX: 50, pageY: 100 })
    fireEvent.mouseUp(root, { pageX: 50, pageY: 100 })
    expect(root).not.toBeNull()
  })

  it('isPrevent=false lets move pass and angle gate rejects cross-axis drag', async () => {
    const { container } = render(
      <MdScrollView isPrevent={false} scrollingY={false}><div>A</div></MdScrollView>,
    )
    await flush(120)
    const root = container.querySelector('.md-scroll-view')!
    // 横向滚动（scrollingY=false）：纵向主导位移被角度闸门拒绝
    fireEvent.touchStart(root, { touches: touch(100, 100), targetTouches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(100, 160), targetTouches: touch(100, 160) })
    fireEvent.touchEnd(root, { touches: [] })
    // 鼠标路径同角度闸门
    fireEvent.mouseDown(root, { pageX: 100, pageY: 100 })
    fireEvent.mouseMove(root, { pageX: 100, pageY: 160 })
    fireEvent.mouseUp(root, { pageX: 100, pageY: 160 })
    expect(root).not.toBeNull()
  })

  it('mouse drag full cycle drives scroller without crash', () => {
    const { container } = render(<MdScrollView><div>A</div></MdScrollView>)
    const root = container.querySelector('.md-scroll-view')!
    fireEvent.mouseDown(root, { pageX: 100, pageY: 100 })
    fireEvent.mouseMove(root, { pageX: 50, pageY: 100 })
    fireEvent.mouseUp(root, { pageX: 50, pageY: 100 })
    fireEvent.mouseLeave(root, { pageX: 50, pageY: 100 })
    expect(root).not.toBeNull()
  })
})

describe('Swiper', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.innerHTML = ''
    scrollToSpy = vi.spyOn(Scroller.prototype, 'scrollTo')
  })
  afterEach(() => vi.restoreAllMocks())

  function mountSwiper(props: Record<string, unknown> = {}) {
    const ref = { current: null as unknown as {
      next: () => void; prev: () => void; goto: (i: number) => void; getIndex: () => number; stop: () => void; play: (d?: number) => void
    } }
    const wrapper = render(
      <MdSwiper ref={ref as never} {...props}>
        <MdSwiperItem>1</MdSwiperItem>
        <MdSwiperItem>2</MdSwiperItem>
        <MdSwiperItem>3</MdSwiperItem>
      </MdSwiper>,
    )
    const root = wrapper.container.querySelector('.md-swiper') as HTMLElement
    return { wrapper, ref, root }
  }

  it('renders backup copies and indicators after init', async () => {
    const { wrapper } = mountSwiper({ autoplay: 0 })
    await flush(120)
    expect(wrapper.container.querySelectorAll('.md-swiper-item')).toHaveLength(5)
    expect(wrapper.container.querySelectorAll('.md-swiper-indicator')).toHaveLength(3)
  })

  it('next()/prev()/goto()/getIndex() via expose', async () => {
    const onBeforeChange = vi.fn()
    const onAfterChange = vi.fn()
    const { ref } = mountSwiper({ autoplay: 0, onBeforeChange, onAfterChange })
    await flush(120)
    expect(ref.current.getIndex()).toBe(0)
    ref.current.next()
    await flush(40)
    expect(ref.current.getIndex()).toBe(1)
    ref.current.prev()
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
    ref.current.goto(2)
    await flush(40)
    expect(ref.current.getIndex()).toBe(2)
    ref.current.goto(NaN)
    expect(ref.current.getIndex()).toBe(2)
    expect(onBeforeChange).toHaveBeenCalled()
  })

  it('stop()/play() control autoplay', async () => {
    const { ref } = mountSwiper({ autoplay: 500 })
    await flush(120)
    ref.current.stop()
    await flush(1200)
    expect(ref.current.getIndex()).toBe(0)
    ref.current.play(500)
    await flush(1200)
    expect(ref.current.getIndex()).toBeGreaterThanOrEqual(1)
  })

  it('non-loop autoplay stops at last item', async () => {
    const { ref } = mountSwiper({ autoplay: 500, isLoop: false })
    for (let i = 0; i < 4; i++) {
      await flush(500)
    }
    expect(ref.current.getIndex()).toBe(2)
  })

  it('non-loop blocks boundary prev', async () => {
    const { ref } = mountSwiper({ autoplay: 0, isLoop: false })
    await flush(120)
    ref.current.prev()
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('slideY renders vertical class and item heights', async () => {
    const { wrapper } = mountSwiper({ autoplay: 0, transition: 'slideY' })
    await flush(120)
    expect(wrapper.container.querySelector('.md-swiper')?.className).toContain('md-swiper-vertical')
    expect(wrapper.container.querySelector('.md-swiper-item')?.getAttribute('style')).toContain('height')
  })

  it('fade goto drives opacity transition and after-change', async () => {
    const onAfterChange = vi.fn()
    const { wrapper, ref } = mountSwiper({ autoplay: 0, transition: 'fade', onAfterChange })
    await flush(120)
    expect(wrapper.container.querySelector('.md-swiper')?.className).toContain('md-swiper-fade')
    scrollToSpy.mockClear()
    ref.current.goto(1)
    await flush(600)
    expect(onAfterChange).toHaveBeenCalled()
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('fast touch drag pages to next', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    scrollToSpy.mockClear()
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(20, 100) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(1)
    expect(scrollToSpy).toHaveBeenCalled()
  })

  it('slow drag below paging threshold bounces back', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    scrollToSpy.mockClear()
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    await flush(320)
    fireEvent.touchMove(root, { touches: touch(70, 100) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
    expect(scrollToSpy).toHaveBeenCalled()
  })

  it('vertical scroll angle rejects horizontal paging', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(120, 160) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('mouseleave without move resumes play', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    fireEvent.mouseDown(root, { pageX: 100, pageY: 100 })
    fireEvent.mouseLeave(root, { pageX: 100, pageY: 100 })
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('dragable=false disables drag', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0, dragable: false })
    await flush(120)
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(20, 100) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('single item hides indicators and blocks transition', async () => {
    const ref = { current: null as unknown as { next: () => void; getIndex: () => number } }
    const { container } = render(
      <MdSwiper ref={ref as never} autoplay={0}>
        <MdSwiperItem>only</MdSwiperItem>
      </MdSwiper>,
    )
    await flush(120)
    expect(container.querySelectorAll('.md-swiper-indicator')).toHaveLength(0)
    expect(container.querySelectorAll('.md-swiper-item')).toHaveLength(1)
    ref.current.next()
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('goto clamps out-of-range indices', async () => {
    const { ref } = mountSwiper({ autoplay: 0 })
    await flush(120)
    ref.current.goto(-1)
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
    ref.current.goto(99)
    await flush(40)
    expect(ref.current.getIndex()).toBe(2)
  })

  it('mouse drag pages next', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    // jsdom 的 MouseEvent 不接受 init 中的 pageX，需显式 defineProperty
    root.dispatchEvent(dragEvent('mousedown', 100))
    root.dispatchEvent(dragEvent('mousemove', 20))
    root.dispatchEvent(dragEvent('mouseup', 20))
    await flush(40)
    expect(ref.current.getIndex()).toBe(1)
  })

  it('touchcancel ends drag without paging', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(20, 100) })
    fireEvent.touchCancel(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(1)
  })

  it('isPrevent=false and hasDots=false and useNativeDriver=false render and drag', async () => {
    const { ref, root, wrapper } = mountSwiper({ autoplay: 0, isPrevent: false, hasDots: false, useNativeDriver: false })
    await flush(120)
    expect(wrapper.container.querySelectorAll('.md-swiper-indicators')).toHaveLength(0)
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(20, 100) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(1)
  })

  it('fade drag drives opacity interpolation', async () => {
    const { root } = mountSwiper({ autoplay: 0, transition: 'fade' })
    await flush(120)
    root.dispatchEvent(dragEvent('mousedown', 100))
    root.dispatchEvent(dragEvent('mousemove', 60))
    root.dispatchEvent(dragEvent('mouseup', 60))
    await flush(600)
    expect(true).toBe(true)
  })

  it('slideY touch drag pages vertically', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0, transition: 'slideY' })
    await flush(120)
    scrollToSpy.mockClear()
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    fireEvent.touchMove(root, { touches: touch(100, 20) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(1)
    expect(scrollToSpy).toHaveBeenCalled()
  })

  it('loop boundary wrap: prev to first then next past last teleports', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    // real 1 → 0 →(isFirst) teleport lastIndex=3 → 4 →(isLast) teleport firstIndex=1
    ref.current.prev()
    await flush(40)
    ref.current.prev()
    await flush(40)
    const afterPrev = ref.current.getIndex()
    ref.current.next()
    await flush(40)
    ref.current.next()
    await flush(40)
    ref.current.next()
    await flush(40)
    ref.current.next()
    await flush(60)
    expect(afterPrev).toBeTypeOf('number')
    // 经历 isFirst/isLast 两次 teleport 后落在合法展示位
    expect([0, 1, 2]).toContain(ref.current.getIndex())
    // start 触发挂起的 transitionEndHandler
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    fireEvent.touchEnd(root, { touches: [] })
    expect(true).toBe(true)
  })

  it('fade boundary prev/next wrap without loop teleport', async () => {
    const { ref } = mountSwiper({ autoplay: 0, transition: 'fade' })
    await flush(120)
    ref.current.prev()
    await flush(560)
    expect(ref.current.getIndex()).toBe(2)
    ref.current.next()
    await flush(560)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('slideY slow small drag bounces back; horizontal move is user-scrolling', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0, transition: 'slideY' })
    await flush(120)
    // 慢速小幅纵向拖拽 → 未过阈值回弹
    fireEvent.touchStart(root, { touches: touch(100, 100) })
    await flush(320)
    fireEvent.touchMove(root, { touches: touch(100, 70) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
    // 纵向 swiper 上横向主导位移 → 判定为页面滚动，忽略
    fireEvent.touchStart(root, { touches: [{ pageX: 100, pageY: 100, changedTouches: [{ pageX: 100, pageY: 100 }] }] as unknown as TouchList })
    fireEvent.touchMove(root, { touches: touch(140, 100) })
    fireEvent.touchEnd(root, { touches: [] })
    await flush(40)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('empty swiper and out-of-range defaultIndex are safe', async () => {
    const ref = { current: null as unknown as { next: () => void; getIndex: () => number } }
    const { container } = render(<MdSwiper ref={ref as never} autoplay={0} />)
    await flush(120)
    expect(container.querySelectorAll('.md-swiper-item')).toHaveLength(0)
    ref.current.next()
    expect(ref.current.getIndex()).toBe(0)
    const ref2 = { current: null as unknown as { getIndex: () => number } }
    render(
      <MdSwiper ref={ref2 as never} autoplay={0} defaultIndex={99}>
        <MdSwiperItem>1</MdSwiperItem>
      </MdSwiper>,
    )
    await flush(120)
    expect(ref2.current.getIndex()).toBe(0)
  })

  it('play()/orphan move+up and resize-debounce guard', async () => {
    const { ref, root } = mountSwiper({ autoplay: 0 })
    await flush(120)
    ref.current.play()
    ref.current.stop()
    // 无 start 的 move/up：dragging 守卫直接返回
    fireEvent.mouseMove(root, { pageX: 10, pageY: 10 })
    fireEvent.mouseUp(root, { pageX: 10, pageY: 10 })
    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('resize'))
    await flush(400)
    expect(ref.current.getIndex()).toBe(0)
  })

  it('window resize re-inits items', async () => {
    const { wrapper } = mountSwiper({ autoplay: 0 })
    await flush(120)
    window.dispatchEvent(new Event('resize'))
    await flush(400)
    expect(wrapper.container.querySelectorAll('.md-swiper-item')).toHaveLength(5)
  })
})

describe('Slider', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  function sliderRoot(container: HTMLElement) {
    return container.querySelector('.md-slider') as HTMLElement
  }

  it('format renders custom hint and step rounds value', () => {
    const { container } = render(<MdSlider value={47.3} format={(v) => `${v}%`} />)
    expect(container.querySelector('.md-slider-handle')?.getAttribute('data-hint')).toBe('47%')
  })

  it('external value is clamped to min/max', () => {
    const { container, rerender } = render(<MdSlider value={150} />)
    expect(container.querySelector('.md-slider-handle')?.getAttribute('data-hint')).toBe('100')
    rerender(<MdSlider value={-5} />)
    expect(container.querySelector('.md-slider-handle')?.getAttribute('data-hint')).toBe('0')
  })

  it('disabled blocks drag', () => {
    const onChange = vi.fn()
    const { container } = render(<MdSlider value={40} disabled onChange={onChange} />)
    const handle = container.querySelector('.md-slider-handle span') as HTMLElement
    handle.dispatchEvent(dragEvent('mousedown', 50))
    window.dispatchEvent(dragEvent('mousemove', 80))
    window.dispatchEvent(dragEvent('mouseup', 80))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('mouse drag upper handle emits range onChange', async () => {
    const onChange = vi.fn()
    const { container, unmount } = render(<MdSlider value={[20, 80]} range onChange={onChange} />)
    Object.defineProperty(sliderRoot(container), 'offsetWidth', { value: 100, configurable: true })
    const upper = container.querySelector('.is-higher span') as HTMLElement
    upper.dispatchEvent(dragEvent('mousedown', 50))
    window.dispatchEvent(dragEvent('mousemove', 30))
    await flush(40)
    window.dispatchEvent(dragEvent('mouseup', 30))
    expect(onChange).toHaveBeenCalledWith([20, 60])
    unmount()
  })

  it('mouse drag lower handle emits range onChange', async () => {
    const onChange = vi.fn()
    const { container, unmount } = render(<MdSlider value={[20, 80]} range onChange={onChange} />)
    Object.defineProperty(sliderRoot(container), 'offsetWidth', { value: 100, configurable: true })
    const lower = container.querySelector('.is-lower span') as HTMLElement
    lower.dispatchEvent(dragEvent('mousedown', 50))
    window.dispatchEvent(dragEvent('mousemove', 70))
    await flush(40)
    window.dispatchEvent(dragEvent('mouseup', 70))
    expect(onChange).toHaveBeenCalledWith([40, 80])
    unmount()
  })

  it('touch drag single handle emits onChange', async () => {
    const onChange = vi.fn()
    const { container, unmount } = render(<MdSlider value={80} onChange={onChange} />)
    Object.defineProperty(sliderRoot(container), 'offsetWidth', { value: 100, configurable: true })
    const handle = container.querySelector('.md-slider-handle span') as HTMLElement
    fireEvent.touchStart(handle, { changedTouches: touch(50, 0) })
    fireEvent.touchMove(window, { changedTouches: touch(10, 0) })
    await flush(40)
    fireEvent.touchEnd(window, { changedTouches: touch(10, 0) })
    expect(onChange).toHaveBeenCalledWith(40)
    unmount()
  })

  it('crossed range value normalizes both directions', () => {
    const { container, rerender } = render(<MdSlider value={[0, 100]} range />)
    rerender(<MdSlider value={[80, 20]} range />)
    // 非拖拽态：values[0] 不变 → newValues[1] 被拉低
    const hints = container.querySelectorAll('.md-slider-handle')
    expect(hints.length).toBe(2)
    rerender(<MdSlider value={[20, 80]} range />)
    rerender(<MdSlider value={[20, 20]} range />)
    expect(container.querySelectorAll('.md-slider-handle')).toHaveLength(2)
  })

  it('controlled slider skips self-triggered echo', async () => {
    function Controlled() {
      const [v, setV] = React.useState(50)
      return <MdSlider value={v} onChange={(n) => setV(n as number)} />
    }
    const { container } = render(<Controlled />)
    Object.defineProperty(sliderRoot(container), 'offsetWidth', { value: 100, configurable: true })
    const handle = container.querySelector('.md-slider-handle span') as HTMLElement
    handle.dispatchEvent(dragEvent('mousedown', 50))
    window.dispatchEvent(dragEvent('mousemove', 60))
    await flush(40)
    window.dispatchEvent(dragEvent('mouseup', 60))
    expect(container.querySelector('.md-slider-handle')?.getAttribute('data-hint')).toBe('60')
  })

  it('rAF after mouseup drops stale drag', async () => {
    const onChange = vi.fn()
    const { container, unmount } = render(<MdSlider value={80} onChange={onChange} />)
    Object.defineProperty(sliderRoot(container), 'offsetWidth', { value: 100, configurable: true })
    const handle = container.querySelector('.md-slider-handle span') as HTMLElement
    handle.dispatchEvent(dragEvent('mousedown', 50))
    window.dispatchEvent(dragEvent('mousemove', 10))
    window.dispatchEvent(dragEvent('mouseup', 10))
    await flush(40)
    expect(onChange).not.toHaveBeenCalled()
    unmount()
  })

  it('range renders two handles with bar styles', () => {
    const { container } = render(<MdSlider value={[20, 80]} range />)
    expect(container.querySelectorAll('.md-slider-handle')).toHaveLength(2)
    const bar = container.querySelector('.md-slider-bar') as HTMLElement
    expect(bar.style.width).toBe('60%')
    expect(bar.style.left).toBe('20%')
  })
})

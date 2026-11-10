/**
 * scroll-view 纯逻辑测试：触底阈值状态机、下拉距离阻尼、刷新进度/文案、
 * endReached 50ms 防抖。对照 Vue 版 ScrollView.vue checkScrollerEnd 与
 * ScrollViewRefresh.vue 的 process/refreshTip。
 */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {
  createEndReachedTrigger,
  endOffsetOf,
  pullDistanceOf,
  refreshProcessOf,
  refreshTipOf,
} from '../../src/components/scroll-view/logic'

describe('scroll-view/logic 触底阈值', () => {
  it('endOffset = contentH - containerH - (scrollTop + moreOffsetY + threshold)', () => {
    expect(endOffsetOf(1000, 600, 350, 50, 0)).toBe(0)
    expect(endOffsetOf(1000, 600, 360, 50, 0)).toBe(-10)
    expect(endOffsetOf(1000, 600, 300, 50, 20)).toBe(30)
  })

  it('threshold 提前触发（scrollOffsetVerExcess 语义）', () => {
    expect(endOffsetOf(1000, 600, 330, 50, 20)).toBe(0)
  })
})

describe('scroll-view/logic 下拉距离阻尼', () => {
  it('阈值内线性、超出部分 0.3 阻尼、非正值为 0', () => {
    expect(pullDistanceOf(0, 60)).toBe(0)
    expect(pullDistanceOf(-10, 60)).toBe(0)
    expect(pullDistanceOf(60, 60)).toBe(60)
    expect(pullDistanceOf(100, 60)).toBe(60 + 40 * 0.3)
  })
})

describe('scroll-view/logic 刷新进度与文案', () => {
  it('前 1/2 为 0，后 1/2 线性到 1；高度 0 防除零', () => {
    expect(refreshProcessOf(0, 60)).toBe(0)
    expect(refreshProcessOf(30, 60)).toBe(0)
    expect(refreshProcessOf(45, 60)).toBe(0.5)
    expect(refreshProcessOf(60, 60)).toBe(1)
    expect(refreshProcessOf(120, 60)).toBe(1)
    expect(refreshProcessOf(50, 0)).toBe(0)
  })

  it('文案按状态回退 zh-CN 词条', () => {
    expect(refreshTipOf('idle', {})).toBe('下拉刷新')
    expect(refreshTipOf('active', {})).toBe('释放刷新')
    expect(refreshTipOf('refreshing', {})).toBe('刷新中...')
    expect(refreshTipOf('idle', {refreshText: '拉我'})).toBe('拉我')
  })
})

describe('scroll-view/logic endReached 防抖', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('50ms 内多次触发只派发一次；reset 取消挂起', () => {
    const emit = vi.fn()
    const trigger = createEndReachedTrigger(emit, 50)
    trigger.trigger()
    trigger.trigger()
    trigger.trigger()
    expect(emit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(emit).toHaveBeenCalledTimes(1)

    const emit2 = vi.fn()
    const trigger2 = createEndReachedTrigger(emit2, 50)
    trigger2.trigger()
    trigger2.reset()
    vi.advanceTimersByTime(100)
    expect(emit2).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// scroll-view 组件实例（index.ts）：attached/ready 度量、原生滚动、触底两段状态、
// 下拉刷新状态机、公开 API、detached 清理
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/scroll-view/index'))

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

interface ScrollViewState {
  containerH: number
  contentH: number
  moreOffsetY: number
  refreshH: number
  lastLeft: number
  lastTop: number
  startY: number
  pulling: boolean
  scrollLeftCache: number
  scrollTopCache: number
}

function stateOf(inst: Mounted): ScrollViewState {
  return (inst as unknown as {__scrollView: ScrollViewState}).__scrollView
}

const RECTS = {
  '.scroll-view-container': {height: 600},
  '.scroll-view-refresh': {height: 60},
  '.scroll-view-more': {height: 40},
}

function scrollEvt(detail: {scrollLeft?: number; scrollTop?: number; scrollHeight?: number}) {
  return {detail: {scrollLeft: 0, scrollTop: 0, scrollHeight: 0, ...detail}} as never
}

function touchEvt(pageY: number) {
  return {touches: [{pageY}]} as never
}

d2('scroll-view attached/ready', () => {
  i2('attached：horizon = scrollingX && !scrollingY', () => {
    const a = mountDef(comp.def)
    a.attached()
    e2(a.data.horizon).toBe(false) // 默认 X+Y → 纵向
    const b = mountDef(comp.def, {props: {scrollingY: false}})
    b.attached()
    e2(b.data.horizon).toBe(true)
    const c = mountDef(comp.def, {props: {scrollingX: false, scrollingY: false}})
    c.attached()
    e2(c.data.horizon).toBe(false)
  })

  i2('ready：度量容器/刷新头/更多高度，refreshStyle 按 -refreshH 基准', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    e2(stateOf(inst).containerH).toBe(600)
    e2(stateOf(inst).refreshH).toBe(60)
    e2(stateOf(inst).moreOffsetY).toBe(40)
    e2(inst.data.refreshStyle).toBe('transform: translate3d(0, -60px, 0)')
  })

  i2('ready：量取失败（null rect）→ 高度保持 0，refreshStyle 空串', () => {
    const inst = mountDef(comp.def, {
      rects: {'.scroll-view-container': null, '.scroll-view-refresh': null, '.scroll-view-more': null},
    })
    inst.attached()
    inst.ready()
    e2(stateOf(inst).containerH).toBe(0)
    e2(stateOf(inst).refreshH).toBe(0)
    e2(inst.data.refreshStyle).toBe('')
  })

  i2('immediateCheckEndReaching：ready 后 50ms 触底检查（两段状态 + endReached）', () => {
    const inst = mountDef(comp.def, {props: {immediateCheckEndReaching: true}, rects: RECTS})
    inst.attached()
    inst.ready()
    e2(inst.data.isEndReachingStart).toBe(false)
    vi.advanceTimersByTime(50)
    e2(inst.data.isEndReachingStart).toBe(true)
    e2(inst.eventsOf('endReached')).toHaveLength(0)
    vi.advanceTimersByTime(50)
    e2(inst.data.isEndReaching).toBe(true)
    e2(inst.eventsOf('endReached')).toEqual([{name: 'endReached', detail: undefined}])
  })

  i2('immediateCheckEndReaching + detached：定时器清理后不触发', () => {
    const inst = mountDef(comp.def, {props: {immediateCheckEndReaching: true}, rects: RECTS})
    inst.attached()
    inst.ready()
    inst.detached()
    vi.advanceTimersByTime(200)
    e2(inst.data.isEndReachingStart).toBe(false)
    e2(inst.eventsOf('endReached')).toHaveLength(0)
  })
})

d2('scroll-view 原生滚动与触底', () => {
  i2('onNativeScroll：缓存/scroll 事件/非触底不触发', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.onNativeScroll.call(inst, scrollEvt({scrollLeft: 10.456, scrollTop: 100.001, scrollHeight: 2000}))
    e2(inst.data.scrollLeft).toBe(10.46) // toFixed(2)
    e2(inst.data.scrollTop).toBe(100)
    e2(stateOf(inst).contentH).toBe(2000)
    e2(inst.eventsOf('scroll')).toEqual([
      {name: 'scroll', detail: {scrollLeft: 10.46, scrollTop: 100}},
    ])
    e2(inst.methods.getOffsets.call(inst)).toEqual({left: 10.46, top: 100})
    e2(inst.data.isEndReachingStart).toBe(false) // endOffset 1300 > 0
  })

  i2('滚动到底：两段触底状态；防抖窗口内重复滚动只触发一次', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.onNativeScroll.call(inst, scrollEvt({scrollTop: 1400, scrollHeight: 2000}))
    e2(inst.data.isEndReachingStart).toBe(true)
    vi.advanceTimersByTime(50)
    e2(inst.data.isEndReaching).toBe(true)
    e2(inst.eventsOf('endReached')).toHaveLength(1)

    // 触底后再次滚动（已 isEndReaching）→ 不重复
    inst.methods.onNativeScroll.call(inst, scrollEvt({scrollTop: 1420, scrollHeight: 2000}))
    vi.advanceTimersByTime(100)
    e2(inst.eventsOf('endReached')).toHaveLength(1)

    // finishLoadMore 复位后可再次触发
    inst.methods.finishLoadMore.call(inst)
    e2(inst.data.isEndReachingStart).toBe(false)
    e2(inst.data.isEndReaching).toBe(false)
    inst.methods.onNativeScroll.call(inst, scrollEvt({scrollTop: 1450, scrollHeight: 2000}))
    vi.advanceTimersByTime(60)
    e2(inst.eventsOf('endReached')).toHaveLength(2)
  })

  i2('负 scrollTop：不触底', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.__checkEndReaching.call(inst, -1)
    e2(inst.data.isEndReachingStart).toBe(false)
  })

  i2('scrollTo / init / reflowScroller / getRefreshState', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    e2(() => inst.methods.init.call(inst)).not.toThrow()
    inst.methods.scrollTo.call(inst, 50, 200, true)
    e2(inst.data.scrollTop).toBe(200)
    e2(stateOf(inst).scrollTopCache).toBe(200)
    e2(() => inst.methods.reflowScroller.call(inst)).not.toThrow()
    e2(inst.methods.getRefreshState.call(inst)).toEqual({
      scrollTop: 200,
      isRefreshing: false,
      isRefreshActive: false,
    })
  })
})

d2('scroll-view 下拉刷新状态机', () => {
  i2('全链路：下拉 → 过阈值 refreshActive → 松手 refreshing → finishRefresh 回弹复位', async () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()

    inst.methods.onTouchStart.call(inst, touchEvt(0))
    e2(stateOf(inst).pulling).toBe(true)

    inst.methods.onTouchMove.call(inst, touchEvt(45)) // 未过阈值
    e2(inst.data.pullDistance).toBe(45)
    e2(inst.data.refreshProcess).toBe(0.5)
    e2(inst.data.isRefreshActive).toBe(false)
    e2(inst.data.refreshTip).toBe('下拉刷新')
    e2(inst.data.refreshStyle).toBe('transform: translate3d(0, -15px, 0)')

    inst.methods.onTouchMove.call(inst, touchEvt(90)) // 距离 60+30*0.3=69 ≥ 60
    e2(inst.data.isRefreshActive).toBe(true)
    e2(inst.eventsOf('refreshActive')).toHaveLength(1)
    // 过阈值即切 active 文案（setData 后刷新，无滞后）
    e2(inst.data.refreshTip).toBe('释放刷新')
    e2(inst.data.refreshProcess).toBe(1)

    inst.methods.onTouchEnd.call(inst)
    e2(stateOf(inst).pulling).toBe(false)
    e2(inst.data.isRefreshing).toBe(true)
    e2(inst.data.isRefreshActive).toBe(false)
    e2(inst.data.pullDistance).toBe(60)
    e2(inst.data.refreshTip).toBe('刷新中...')
    e2(inst.eventsOf('refreshing')).toEqual([{name: 'refreshing', detail: undefined}])

    inst.methods.finishRefresh.call(inst)
    await vi.advanceTimersByTimeAsync(220) // 200ms 回弹
    e2(inst.data.pullDistance).toBe(0)
    e2(inst.data.isRefreshing).toBe(false)
    e2(inst.data.refreshStyle).toBe('transform: translate3d(0, -60px, 0)')
  })

  i2('自定义刷新文案', () => {
    const inst = mountDef(comp.def, {
      props: {refreshText: '拉', refreshActiveText: '放', refreshingText: '刷'},
      rects: RECTS,
    })
    inst.attached()
    inst.ready()
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    inst.methods.onTouchMove.call(inst, touchEvt(80))
    // active 段切换为自定义 active 文案（setData 后刷新，无滞后）
    e2(inst.data.refreshTip).toBe('放')
    inst.methods.onTouchEnd.call(inst)
    e2(inst.data.refreshTip).toBe('刷')
  })

  i2('未过阈值松手：200ms 弹回原位（无 refreshing）', async () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    inst.methods.onTouchMove.call(inst, touchEvt(30))
    inst.methods.onTouchEnd.call(inst)
    e2(inst.eventsOf('refreshing')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(220)
    e2(inst.data.pullDistance).toBe(0)
  })

  i2('回拉到顶以下：复位 pull/active/process 与文案', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    inst.methods.onTouchMove.call(inst, touchEvt(45))
    inst.methods.onTouchMove.call(inst, touchEvt(-10)) // dy < 0
    e2(inst.data.pullDistance).toBe(0)
    e2(inst.data.isRefreshActive).toBe(false)
    e2(inst.data.refreshProcess).toBe(0)
    e2(inst.data.refreshTip).toBe('下拉刷新')
    e2(inst.data.refreshStyle).toBe('transform: translate3d(0, -60px, 0)')
  })

  i2('无刷新头（refreshH 0）：move/end 直接返回；未拉取时 dy<=0 复位分支跳过', () => {
    const inst = mountDef(comp.def, {rects: {'.scroll-view-container': {height: 600}}})
    inst.attached()
    inst.ready()
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    inst.methods.onTouchMove.call(inst, touchEvt(50))
    e2(inst.data.pullDistance).toBe(0)
    inst.methods.onTouchEnd.call(inst)
    e2(inst.eventsOf('refreshing')).toHaveLength(0)
    // dy<=0 且 pullDistance===0 → 复位分支跳过
    inst.methods.onTouchMove.call(inst, touchEvt(-5))
    e2(inst.data.pullDistance).toBe(0)
  })

  i2('滚动中（scrollTopCache > 0）不劫持下拉；无 touches 早退', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.onNativeScroll.call(inst, scrollEvt({scrollTop: 100, scrollHeight: 2000}))
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    e2(stateOf(inst).pulling).toBe(false)
    e2(() => inst.methods.onTouchMove.call(inst, touchEvt(50))).not.toThrow()
    e2(inst.data.pullDistance).toBe(0)
    e2(() => inst.methods.onTouchEnd.call(inst)).not.toThrow()
    // 无 touches
    e2(() => inst.methods.onTouchStart.call(inst, {touches: []} as never)).not.toThrow()
    inst.methods.onTouchStart.call(inst, touchEvt(0)) // 顶部可拉
    e2(() => inst.methods.onTouchMove.call(inst, {touches: []} as never)).not.toThrow()
  })

  i2('刷新中触摸不劫持（isRefreshing 守卫）', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.triggerRefresh.call(inst)
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    e2(stateOf(inst).pulling).toBe(false)
  })
})

d2('scroll-view triggerRefresh / finishRefresh 防御分支', () => {
  i2('triggerRefresh：无刷新头 / 刷新中 → 早退', () => {
    const none = mountDef(comp.def, {rects: {'.scroll-view-container': {height: 600}}})
    none.attached()
    none.ready()
    none.methods.triggerRefresh.call(none)
    e2(none.data.isRefreshing).toBe(false)

    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.triggerRefresh.call(inst)
    e2(inst.data.isRefreshing).toBe(true)
    e2(inst.data.pullDistance).toBe(60)
    inst.methods.triggerRefresh.call(inst) // 刷新中 → 早退
    e2(inst.eventsOf('refreshing')).toHaveLength(1)
  })

  i2('finishRefresh：未刷新 → 早退', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    e2(() => inst.methods.finishRefresh.call(inst)).not.toThrow()
    e2(inst.data.isRefreshing).toBe(false)
  })

  i2('detached：动画与定时器清理（回弹不再推进）', async () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    inst.methods.onTouchMove.call(inst, touchEvt(30))
    inst.methods.onTouchEnd.call(inst) // 回弹动画挂起
    inst.detached()
    await vi.advanceTimersByTimeAsync(400)
    e2(inst.data.pullDistance).toBe(30) // 动画已停，未回弹
  })
})

d2('scroll-view 分支补漏', () => {
  i2('refreshTip：active 相位（isRefreshActive 直调）与自定义 refreshing 文案', () => {
    const inst = mountDef(comp.def, {props: {refreshActiveText: '放'}, rects: RECTS})
    inst.attached()
    inst.setData({isRefreshActive: true})
    inst.methods.__refreshTip.call(inst)
    e2(inst.data.refreshTip).toBe('放')
  })

  i2('onTouchMove：无 touches 字段早退；active 回落（过阈值后再回落）', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    e2(() => inst.methods.onTouchMove.call(inst, {} as never)).not.toThrow()

    inst.methods.onTouchStart.call(inst, touchEvt(0))
    inst.methods.onTouchMove.call(inst, touchEvt(90)) // active
    e2(inst.data.isRefreshActive).toBe(true)
    inst.methods.onTouchMove.call(inst, touchEvt(45)) // 回落 < 阈值
    e2(inst.data.isRefreshActive).toBe(false)
    e2(inst.eventsOf('refreshActive')).toHaveLength(1) // 回落不再派发
    inst.methods.onTouchEnd.call(inst) // 非active但 pullDistance>0 → 弹回
    return vi.waitFor(() => e2(inst.data.pullDistance).toBe(0))
  })

  i2('dy<=0 且 isRefreshActive=true：不复位直接返回', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.setData({isRefreshActive: true})
    inst.setData({pullDistance: 30})
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    inst.methods.onTouchMove.call(inst, touchEvt(-10))
    e2(inst.data.pullDistance).toBe(30) // 复位分支跳过
  })

  i2('onTouchEnd：拉动但未过阈值且 pullDistance===0（无刷新头时）→ 两分支均跳过', () => {
    const inst = mountDef(comp.def, {rects: {'.scroll-view-container': {height: 600}}})
    inst.attached()
    inst.ready()
    inst.methods.onTouchStart.call(inst, touchEvt(0))
    e2(() => inst.methods.onTouchEnd.call(inst)).not.toThrow()
    e2(inst.eventsOf('refreshing')).toHaveLength(0)
  })

  i2('scrollTo：缺省 animate 参数', () => {
    const inst = mountDef(comp.def, {rects: RECTS})
    inst.attached()
    inst.ready()
    inst.methods.scrollTo.call(inst, 0, 88)
    e2(inst.data.scrollTop).toBe(88)
  })
})

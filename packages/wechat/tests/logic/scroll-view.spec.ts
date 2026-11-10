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

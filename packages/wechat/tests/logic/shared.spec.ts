/**
 * shared 内核逻辑测试（批量移植代理的测试范本）：
 * 纯逻辑层可测的部分（状态机、物理内核、定时器表）必须有小程序侧测试。
 */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {
  TRANSITION_DURATIONS,
  defaultTransition,
  enterStartClasses,
  enterActiveClasses,
  leaveClasses,
  transitionDuration,
} from '../../src/shared/transition'
import {createTimerRegistry} from '../../src/shared/timer'
import {createDragTicker} from '../../src/shared/drag-ticker'
import {animateValue} from '../../src/shared/ticker'
import {optimisticUpdate} from '../../src/shared/controlled'

describe('shared/transition', () => {
  it('position → 默认过渡名对齐 Vue 版 Popup.defaultTransition', () => {
    expect(defaultTransition('bottom')).toBe('slide-up')
    expect(defaultTransition('top')).toBe('slide-down')
    expect(defaultTransition('left')).toBe('slide-right')
    expect(defaultTransition('right')).toBe('slide-left')
    expect(defaultTransition('center')).toBe('fade')
  })

  it('四段类名与 Vue transition 约定一致', () => {
    expect(enterStartClasses('slide-up')).toBe('cu-slide-up-enter cu-slide-up-enter-active')
    expect(enterActiveClasses('slide-up')).toBe('cu-slide-up-enter-active')
    expect(leaveClasses('fade')).toBe('cu-fade-leave-to cu-fade-leave-active')
  })

  it('时长表覆盖全部已登记过渡', () => {
    for (const t of Object.values(TRANSITION_DURATIONS)) {
      expect(t.enter).toBeGreaterThan(0)
      expect(t.leave).toBeGreaterThan(0)
    }
    expect(transitionDuration('slide-up', 'enter')).toBe(300)
    expect(transitionDuration('slide-up', 'leave')).toBe(250)
    expect(transitionDuration('unknown', 'enter')).toBe(0)
  })
})

describe('shared/timer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('cancel 后回调不执行，clearAll 清空全部', () => {
    const reg = createTimerRegistry({})
    const fn = vi.fn()
    const id = reg.setTimeout(fn, 100)
    reg.clearTimeout(id)
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()

    const fn2 = vi.fn()
    reg.setInterval(fn2, 50)
    reg.clearAll()
    vi.advanceTimersByTime(200)
    expect(fn2).not.toHaveBeenCalled()
  })
})

describe('shared/drag-ticker', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('拖拽跟手，松手后动量衰减并停在界内', () => {
    const seen: number[] = []
    const ticker = createDragTicker({
      min: 0,
      max: 500,
      onTranslate: (o) => seen.push(o),
      frame: 16,
    })
    ticker.onTouchStart(0, 0)
    // 连续上滑 3 帧，每帧 -30（纵向 picker 语义）
    for (let i = 1; i <= 3; i++) ticker.onTouchMove(0, i * -30)
    const dragOffset = ticker.getOffset()
    expect(dragOffset).toBeGreaterThan(0) // 反向为正（picker 惯例）
    ticker.onTouchEnd()
    vi.advanceTimersByTime(6000) // 足够长，动量必然耗尽
    const final = ticker.getOffset()
    expect(final).toBeGreaterThanOrEqual(0)
    expect(final).toBeLessThanOrEqual(500)
    ticker.destroy()
  })

  it('越界回弹：scrollTo 越界值钳到边界', () => {
    const ticker = createDragTicker({min: 0, max: 100, onTranslate: () => {}, frame: 16})
    ticker.scrollTo(999, false)
    expect(ticker.getOffset()).toBe(100)
    ticker.scrollTo(-1, false)
    expect(ticker.getOffset()).toBe(0)
    ticker.destroy()
  })
})

describe('shared/ticker', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('duration=0 立即到达终值', () => {
    const seen: number[] = []
    animateValue({from: 0, to: 5, duration: 0, onUpdate: (v) => seen.push(v)})
    expect(seen).toEqual([5])
  })

  it('线性推进并在 duration 后到达终值；stop 可中断', () => {
    const seen: number[] = []
    const handle = animateValue({from: 0, to: 100, duration: 320, onUpdate: (v) => seen.push(v)})
    vi.advanceTimersByTime(400)
    expect(seen[seen.length - 1]).toBe(100)
    handle.stop()
  })
})

describe('shared/controlled', () => {
  it('乐观更新：先 setData 再 emit', () => {
    const calls: string[] = []
    const ctx = {
      setData(patch: Record<string, unknown>) {
        calls.push(`setData:${JSON.stringify(patch)}`)
      },
      triggerEvent(name: string, payload?: unknown) {
        calls.push(`emit:${name}:${JSON.stringify(payload)}`)
      },
    }
    optimisticUpdate(ctx, {current: 3}, 'change', {value: 3})
    expect(calls).toEqual(['setData:{"current":3}', 'emit:change:{"value":3}'])
  })
})

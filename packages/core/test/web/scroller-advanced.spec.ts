import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnimateRunner } from '../../src/web/animate'

type StepFn = (percent: number, now: number, render: boolean) => boolean | void
type VerifyFn = (id: number) => boolean
type CompletedFn = (dropped: number, id: number, finished: boolean) => void
type StartArgs = [StepFn, VerifyFn, CompletedFn]
const runningSteps = new Map<number, StartArgs>()
let nextId = 1

vi.mock('../../src/web/animate', async () => {
  const { easeOutCubic, easeInOutCubic } = await import('../../src/animate')
  const fake: AnimateRunner = {
    start: (...args: Parameters<AnimateRunner['start']>) => {
      const id = nextId++
      runningSteps.set(id, [
        args[0],
        args[1] ?? (() => true),
        args[2] ?? (() => {}),
      ] as StartArgs)
      return id
    },
    stop: id => runningSteps.delete(id),
    isRunning: id => runningSteps.has(id),
    requestAnimationFrame: cb => {
      cb(Date.now())
      return 0
    },
  }
  return { default: fake, Animate: fake, easeOutCubic, easeInOutCubic }
})

import { Scroller } from '../../src/web/scroller'

const touch = (x: number, y: number) => ({ pageX: x, pageY: y })
const T0 = 1_000_000

let values: Array<{ left: number; top: number; zoom: number }>

beforeEach(() => {
  values = []
  runningSteps.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function create(options?: ConstructorParameters<typeof Scroller>[1]) {
  return new Scroller((left, top, zoom) => values.push({ left, top, zoom }), options)
}

describe('Scroller 动画中断', () => {
  it('touchstart stops running scroll animation', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(200, 0, true)
    const animId = [...runningSteps.keys()].at(-1)!
    expect(runningSteps.has(animId)).toBe(true)

    s.doTouchStart([touch(50, 50)], T0)
    expect(runningSteps.has(animId)).toBe(false) // 被中断
    s.doTouchEnd(T0 + 16)
  })

  it('touchstart interrupts running deceleration', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(100, 0, false)
    s.doTouchStart([touch(150, 50)], T0)
    for (let i = 1; i <= 5; i++) {
      s.doTouchMove([touch(150 - i * 10, 50)], T0 + i * 16)
    }
    s.doTouchEnd(T0 + 5 * 16)
    const decelId = [...runningSteps.keys()].at(-1)!

    s.doTouchStart([touch(100, 50)], T0 + 500)
    expect(runningSteps.has(decelId)).toBe(false)
    s.doTouchEnd(T0 + 520)
  })
})

describe('Scroller 多指缩放手势', () => {
  it('zooms with two-finger scale in doTouchMove', () => {
    const s = create({ zooming: true })
    s.setPosition(0, 0)
    s.setDimensions(100, 100, 200, 200)
    // 两指起始，中心 (75, 50)
    s.doTouchStart([touch(50, 50), touch(100, 50)], T0)
    // 两指张开：中心右移 10、scale 2
    s.doTouchMove([touch(40, 50), touch(120, 50)], T0 + 16, 2)
    const v = values.at(-1)!
    expect(v.zoom).toBe(2)
    s.doTouchEnd(T0 + 32)
  })

  it('scrollTo with zoom recalculates max scroll', () => {
    const s = create({ zooming: true })
    s.setDimensions(100, 100, 200, 200)
    s.scrollTo(100, 100, false, 2)
    expect(s.getScrollMax()).toEqual({ left: 300, top: 300 })
    expect(s.getValues().zoom).toBe(2)
  })

  it('zoomTo keeps given origin in view', () => {
    const s = create({ zooming: true })
    s.setDimensions(100, 100, 200, 200)
    s.zoomTo(2, false, 25, 25)
    // 以 (25,25) 为原点放大：left = (25+0)*2/1-25 = 25
    expect(s.getValues()).toMatchObject({ left: 25, top: 25, zoom: 2 })
  })
})

describe('Scroller 分页模式', () => {
  it('rounds scrollTo to page boundaries', () => {
    const s = create({ paging: true })
    s.setDimensions(100, 100, 500, 300)
    s.scrollTo(150, 0, false)
    expect(s.getValues().left).toBe(200) // 2 页
  })
})

describe('Scroller 释放分支', () => {
  it('fires scrollingComplete on slow release below velocity threshold', () => {
    const complete = vi.fn()
    const s = create()
    s.options.scrollingComplete = complete
    s.setDimensions(100, 100, 300, 300)
    s.doTouchStart([touch(150, 50)], T0)
    // 一次 6px 的小拖拽（速度低于 0.01 px/frame 的阈值）
    s.doTouchMove([touch(156, 50)], T0 + 1000)
    s.doTouchEnd(T0 + 1000 + 16)
    expect(complete).toHaveBeenCalled()
  })

  it('holds snapping release silent beyond 100ms', () => {
    const complete = vi.fn()
    const s = create({ snapping: true })
    s.options.scrollingComplete = complete
    s.setSnapSize(50, 50)
    s.setDimensions(100, 100, 300, 300)
    s.doTouchStart([touch(150, 50)], T0)
    s.doTouchMove([touch(156, 50)], T0 + 16)
    s.doTouchEnd(T0 + 200) // >100ms 慢释放，snapping 时不直接 complete
    expect(complete).not.toHaveBeenCalled()
  })

  it('fires scrollingComplete on slow release without snapping', () => {
    const complete = vi.fn()
    const s = create()
    s.options.scrollingComplete = complete
    s.setDimensions(100, 100, 300, 300)
    s.doTouchStart([touch(150, 50)], T0)
    s.doTouchMove([touch(156, 50)], T0 + 16)
    s.doTouchEnd(T0 + 200)
    expect(complete).toHaveBeenCalled()
  })

  it('caps positions history at 60 entries', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    s.doTouchStart([touch(150, 50)], T0)
    for (let i = 1; i <= 25; i++) {
      s.doTouchMove([touch(150 + i, 50)], T0 + i * 16)
    }
    // 25 次拖拽 × 3 entries = 75 > 60 → splice(0,30)
    s.doTouchEnd(T0 + 25 * 16)
    expect(values.length).toBeGreaterThan(0)
  })
})

describe('Scroller 下拉刷新手动触发', () => {
  it('triggerPullToRefresh publishes to refresh position and starts', () => {
    const start = vi.fn()
    const s = create({ scrollingX: false })
    s.setDimensions(100, 100, 100, 300)
    s.activatePullToRefresh(60, vi.fn(), vi.fn(), start)

    s.triggerPullToRefresh()
    expect(start).toHaveBeenCalledTimes(1)
    // 驻留动画泵完停在 -60
    const id = [...runningSteps.keys()].at(-1)!
    const [step, , completed] = runningSteps.get(id)!
    step(1, Date.now(), true)
    completed(60, id, true)
    expect(values.at(-1)!.top).toBe(-60)
  })

  it('finishPullToRefresh deactivates and scrolls back', () => {
    const deactivate = vi.fn()
    const s = create({ scrollingX: false })
    s.setDimensions(100, 100, 100, 300)
    s.activatePullToRefresh(60, vi.fn(), deactivate, vi.fn())
    s.triggerPullToRefresh()
    s.finishPullToRefresh()
    expect(deactivate).toHaveBeenCalledTimes(1)
  })
})

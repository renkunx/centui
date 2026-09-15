import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnimateRunner } from '../../src/web/animate'

type StepFn = (percent: number, now: number, render: boolean) => boolean | void
type VerifyFn = (id: number) => boolean
type CompletedFn = (dropped: number, id: number, finished: boolean) => void
type StartArgs = [StepFn, VerifyFn, CompletedFn]
const runningSteps = new Map<number, StartArgs>()
let nextId = 1
let rafDeferred: (() => void) | null = null

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
      // 模拟 rAF 延迟：记录回调由测试手动触发
      rafDeferred = () => cb(Date.now())
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
  rafDeferred = null
})

afterEach(() => {
  vi.restoreAllMocks()
})

function create(options?: ConstructorParameters<typeof Scroller>[1]) {
  return new Scroller((left, top, zoom) => values.push({ left, top, zoom }), options)
}

function fling(s: Scroller, from = 150) {
  s.doTouchStart([touch(from, 50)], T0)
  for (let i = 1; i <= 5; i++) {
    s.doTouchMove([touch(from - i * 10, 50)], T0 + i * 16)
  }
  s.doTouchEnd(T0 + 5 * 16)
}

describe('Scroller 非弹回模式', () => {
  it('hard clamps drag at bounds without bouncing', () => {
    const s = create({ bouncing: false })
    s.setDimensions(100, 100, 300, 300)
    s.doTouchStart([touch(50, 50)], T0)
    s.doTouchMove([touch(60, 50)], T0 + 16)
    s.doTouchMove([touch(70, 50)], T0 + 32) // 向右拖出左边界
    expect(values.at(-1)!.left).toBe(0) // 无橡皮筋，硬钳制
    s.doTouchEnd(T0 + 40)
  })

  it('zeroes velocity when hitting deceleration bounds', () => {
    const s = create({ bouncing: false })
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(100, 0, false)
    fling(s)
    const decelId = [...runningSteps.keys()].at(-1)!
    let frames = 0
    while (runningSteps.has(decelId) && frames++ < 500) {
      const [step, verify, completed] = runningSteps.get(decelId)!
      if (!verify(decelId)) {
        runningSteps.delete(decelId)
        completed(60, decelId, false)
        break
      }
      step(0, Date.now(), true)
    }
    expect(s.getValues().left).toBeLessThanOrEqual(200)
  })
})

describe('Scroller 分页减速', () => {
  it('bounds deceleration to page grid', () => {
    const s = create({ paging: true })
    s.setDimensions(100, 100, 500, 300)
    s.scrollTo(100, 0, false)
    fling(s)
    const decelId = [...runningSteps.keys()].at(-1)!
    let frames = 0
    while (runningSteps.has(decelId) && frames++ < 500) {
      const [step, verify, completed] = runningSteps.get(decelId)!
      if (!verify(decelId)) {
        runningSteps.delete(decelId)
        completed(60, decelId, false)
        break
      }
      step(0, Date.now(), true)
    }
    // 分页边界为页尺寸的整数倍
    expect(s.getValues().left % 100).toBe(0)
  })
})

describe('Scroller rAF 延迟发布', () => {
  it('defers animation start when inRequestAnimationFrame is on', () => {
    const s = create({ inRequestAnimationFrame: true })
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(200, 0, true)
    expect(runningSteps.size).toBe(0) // doAnimation 尚未执行
    rafDeferred!() // 手动触发 rAF
    expect(runningSteps.size).toBe(1)
  })
})

describe('Scroller 缩放分支', () => {
  it('skips zoom recompute when scale does not change level', () => {
    const s = create({ zooming: true })
    s.setPosition(0, 0)
    s.setDimensions(100, 100, 200, 200)
    s.doTouchStart([touch(50, 50), touch(100, 50)], T0)
    // scale 使 level 触及 maxZoom 后保持不变
    s.doTouchMove([touch(40, 50), touch(120, 50)], T0 + 16, 4)
    const zoomAfterFirst = values.at(-1)!.zoom
    s.doTouchMove([touch(30, 50), touch(140, 50)], T0 + 32, 6)
    expect(values.at(-1)!.zoom).toBe(zoomAfterFirst) // 已达 maxZoom=3
    s.doTouchEnd(T0 + 48)
  })

  it('animates zoomTo and fires zoom complete', () => {
    const zoomComplete = vi.fn()
    const s = create({ zooming: true })
    s.setDimensions(100, 100, 200, 200)
    s.zoomTo(2, true, 0, 0, zoomComplete)
    const id = [...runningSteps.keys()].at(-1)!
    const [step, , completed] = runningSteps.get(id)!
    step(1, Date.now(), true)
    completed(60, id, true)
    expect(s.getValues().zoom).toBe(2)
    expect(zoomComplete).toHaveBeenCalledTimes(1)
  })
})

describe('Scroller 中断释放', () => {
  it('fires scrollingComplete on release after interrupted animation', () => {
    const complete = vi.fn()
    const s = create()
    s.options.scrollingComplete = complete
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(200, 0, true) // 启动动画
    s.doTouchStart([touch(50, 50)], T0) // 中断
    s.doTouchEnd(T0 + 300) // 慢释放（无惯性）
    expect(complete).toHaveBeenCalled()
  })

  it('skips deceleration while pull-to-refresh is active', () => {
    const s = create({ scrollingX: false })
    s.setDimensions(100, 100, 100, 300)
    s.activatePullToRefresh(60, vi.fn(), vi.fn(), vi.fn())
    s.doTouchStart([touch(50, 50)], T0)
    for (let i = 1; i <= 14; i++) {
      s.doTouchMove([touch(50, 50 + i * 10)], T0 + i * 16)
    }
    s.doTouchEnd(T0 + 14 * 16)
    // refreshActive 时不进入减速
    expect(runningSteps.size).toBe(1) // 仅刷新驻留动画
  })
})

describe('Scroller 边界穿透回弹（X 轴）', () => {
  it('overshoots into boundary and bounces back with penetration', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(150, 0, false)
    // 向左快速滑 → 内容向右冲出右边界后回弹
    fling(s, 150)
    const decelId = [...runningSteps.keys()].at(-1)!
    expect(decelId).toBeDefined()
    let frames = 0
    let overshot = false
    while (runningSteps.has(decelId) && frames++ < 800) {
      if (s.getValues().left > 200) overshot = true
      const [step, verify, completed] = runningSteps.get(decelId)!
      if (!verify(decelId)) {
        runningSteps.delete(decelId)
        completed(60, decelId, false)
        break
      }
      step(0, Date.now(), true)
    }
    // 吸附/回弹动画收尾
    const snapId = [...runningSteps.keys()].at(-1)
    if (snapId !== undefined) {
      const [step, , completed] = runningSteps.get(snapId)!
      step(1, Date.now(), true)
      completed(60, snapId, true)
    }
    expect(overshot).toBe(true)
    expect(s.getValues().left).toBe(200)
  })
})

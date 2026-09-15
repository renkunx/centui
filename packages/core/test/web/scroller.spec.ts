import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnimateRunner } from '../../src/web/animate'

/**
 * 用可手动泵帧的假 Animate 替换动画调度器，
 * 使减速/回弹物理完全确定性地可测。
 */
type StartArgs = Parameters<AnimateRunner['start']>
const runningSteps = new Map<number, StartArgs>()
let nextId = 1

vi.mock('../../src/web/animate', async () => {
  const { easeOutCubic, easeInOutCubic } = await import('../../src/animate')
  const fake: AnimateRunner = {
    start: (...args: StartArgs) => {
      const id = nextId++
      runningSteps.set(id, args)
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

/** 泵一帧（percent 仅用于动画型 step，减速型忽略） */
function pumpFrame(id: number, percent: number) {
  const args = runningSteps.get(id)
  if (!args) throw new Error(`animation ${id} not running`)
  const [step, verify, completed] = args
  const verifyResult = verify ? verify(id) : true
  if (!verifyResult) {
    runningSteps.delete(id)
    completed?.(60, id, false)
    return
  }
  step(percent, Date.now(), true)
  const finished = percent >= 1
  if (finished) {
    runningSteps.delete(id)
    completed?.(60, id, true)
  }
}

/** 泵减速直到速度阈值以下（最多 500 帧） */
function pumpDeceleration(id: number): number {
  let frames = 0
  while (runningSteps.has(id) && frames < 500) {
    pumpFrame(id, 0)
    frames++
  }
  return frames
}

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

describe('Scroller 基础', () => {
  it('merges options with defaults', () => {
    const s = create({ animationDuration: 500 })
    expect(s.options.animationDuration).toBe(500)
    expect(s.options.scrollingX).toBe(true)
    expect(s.options.bouncing).toBe(true)
    expect(s.options.snappingVelocity).toBe(4)
  })

  it('starts at zero position and zoom 1', () => {
    expect(create().getValues()).toEqual({ left: 0, top: 0, zoom: 1 })
  })

  it('computes scroll max from dimensions', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 200)
    expect(s.getScrollMax()).toEqual({ left: 200, top: 100 })
  })

  it('keeps zero max when content fits client', () => {
    const s = create()
    s.setDimensions(200, 200, 100, 100)
    expect(s.getScrollMax()).toEqual({ left: 0, top: 0 })
  })
})

describe('Scroller scrollTo', () => {
  it('clamps to max scroll without animation and publishes', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 200)
    s.scrollTo(500, 500, false)
    expect(s.getValues()).toEqual({ left: 200, top: 100, zoom: 1 })
    expect(values.at(-1)).toEqual({ left: 200, top: 100, zoom: 1 })
  })

  it('snaps to snap size when snapping enabled', () => {
    const s = create({ snapping: true })
    s.setSnapSize(50, 50)
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(60, 74, false)
    expect(s.getValues()).toEqual({ left: 50, top: 50, zoom: 1 })
  })

  it('respects scrollingX=false by keeping current left', () => {
    const s = create({ scrollingX: false })
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(150, 150, false)
    expect(s.getValues().left).toBe(0)
    expect(s.getValues().top).toBe(150)
  })

  it('animates via Animate and completes at target', () => {
    const complete = vi.fn()
    const s = create()
    s.options.scrollingComplete = complete
    s.setDimensions(100, 100, 300, 300)
    const baseline = values.length
    s.scrollTo(200, 200, true)
    // 动画驱动，位置尚未变化
    expect(s.getValues()).toEqual({ left: 0, top: 0, zoom: 1 })
    expect(values.length).toBe(baseline)
    const id = [...runningSteps.keys()].at(-1)!
    pumpFrame(id, 0.5)
    expect(s.getValues().left).toBeCloseTo(100, 5)
    pumpFrame(id, 1)
    expect(s.getValues()).toEqual({ left: 200, top: 200, zoom: 1 })
    expect(complete).toHaveBeenCalledTimes(1)
  })
})

describe('Scroller 手势', () => {
  it('warns and throws on invalid touch list (v2 contract)', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    const s = create()
    expect(() => s.doTouchStart(null as never, T0)).toThrow()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid touch list'))
  })

  it('does not drag below locking threshold', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    const baseline = values.length // setDimensions 的基线 publish
    s.doTouchStart([touch(50, 50)], T0)
    s.doTouchMove([touch(51, 52)], T0 + 16) // 1px/2px 低于锁定阈值
    expect(values.length).toBe(baseline)
    s.doTouchEnd(T0 + 32)
  })

  it('scrolls opposite to finger movement', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(100, 0, false)
    s.doTouchStart([touch(150, 50)], T0)
    s.doTouchMove([touch(160, 50)], T0 + 16) // 越过锁定阈值进入拖拽（此帧只做拖拽判定）
    s.doTouchMove([touch(170, 50)], T0 + 32) // 再 +10px X → 内容反向滚动 10px
    expect(values.at(-1)!.left).toBe(90)
    s.doTouchEnd(T0 + 40)
  })

  it('halves movement at edges when bouncing (rubber band)', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    s.doTouchStart([touch(50, 50)], T0)
    s.doTouchMove([touch(60, 50)], T0 + 16)
    s.doTouchMove([touch(70, 50)], T0 + 32) // 从 0 向右拖出边界
    expect(values.at(-1)!.left).toBe(-5) // 边缘阻尼：-10 + 10/2
    s.doTouchEnd(T0 + 40)
  })

  it('ignores touchmove when tracking is off', () => {
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    const baseline = values.length
    s.doTouchMove([touch(60, 50)], T0) // 未 touchstart
    expect(values.length).toBe(baseline)
  })
})

describe('Scroller 减速（惯性 + 吸附）', () => {
  it('decelerates after fast fling and settles within bounds', () => {
    const s = create({ snapping: true })
    s.setSnapSize(50, 50)
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(100, 0, false)
    s.doTouchStart([touch(150, 50)], T0)
    for (let i = 1; i <= 5; i++) {
      s.doTouchMove([touch(150 - i * 10, 50)], T0 + i * 16) // 向左快速滑 → 内容向右滚
    }
    s.doTouchEnd(T0 + 5 * 16)
    const decelId = [...runningSteps.keys()].at(-1)!
    expect(decelId).toBeDefined()
    pumpDeceleration(decelId)
    // 减速可在边界外耗尽速度（v2 行为），随后的吸附动画负责拉回
    const snapId = [...runningSteps.keys()].at(-1)
    if (snapId !== undefined) {
      pumpFrame(snapId, 1)
    }
    const final = s.getValues()
    expect(final.left).toBe(200)
  })

  it('fires scrollingComplete after snap animation finishes', () => {
    const complete = vi.fn()
    const s = create({ snapping: true })
    s.options.scrollingComplete = complete
    s.setSnapSize(50, 50)
    s.setDimensions(100, 100, 300, 300)
    s.scrollTo(100, 0, false)
    s.doTouchStart([touch(150, 50)], T0)
    for (let i = 1; i <= 5; i++) {
      s.doTouchMove([touch(150 - i * 10, 50)], T0 + i * 16)
    }
    s.doTouchEnd(T0 + 5 * 16)
    const decelId = [...runningSteps.keys()].at(-1)!
    pumpDeceleration(decelId)
    const snapId = [...runningSteps.keys()].at(-1)
    if (snapId !== undefined) {
      pumpFrame(snapId, 1) // 吸附动画完成时触发 scrollingComplete
    }
    expect(complete).toHaveBeenCalled()
  })
})

describe('Scroller 下拉刷新', () => {
  it('activates when pulled beyond refresh height and starts on release', () => {
    const activate = vi.fn()
    const deactivate = vi.fn()
    const start = vi.fn()
    const s = create({ scrollingX: false })
    s.setDimensions(100, 100, 100, 300)
    s.activatePullToRefresh(60, activate, deactivate, start)

    s.doTouchStart([touch(50, 50)], T0)
    for (let i = 1; i <= 14; i++) {
      s.doTouchMove([touch(50, 50 + i * 10)], T0 + i * 16) // 持续下拉
    }
    expect(activate).toHaveBeenCalledTimes(1)
    s.doTouchEnd(T0 + 14 * 16 + 50) // 慢释放：不触发惯性，直接进入刷新
    expect(start).toHaveBeenCalledTimes(1)
    // 刷新驻留动画（animate=true）泵完后停在 -60
    const holdId = [...runningSteps.keys()].at(-1)!
    pumpFrame(holdId, 1)
    expect(values.at(-1)!.top).toBe(-60)
  })

  it('deactivates when pulled back below refresh height', () => {
    const activate = vi.fn()
    const deactivate = vi.fn()
    const s = create({ scrollingX: false })
    s.setDimensions(100, 100, 100, 300)
    s.activatePullToRefresh(60, activate, deactivate, vi.fn())

    s.doTouchStart([touch(50, 50)], T0)
    for (let i = 1; i <= 14; i++) {
      s.doTouchMove([touch(50, 50 + i * 10)], T0 + i * 16)
    }
    expect(activate).toHaveBeenCalledTimes(1)
    // 回拉到刷新线以内
    for (let i = 13; i >= 2; i--) {
      s.doTouchMove([touch(50, 50 + i * 10)], T0 + 300 + (13 - i) * 16)
    }
    expect(deactivate).toHaveBeenCalledTimes(1)
    s.doTouchEnd(T0 + 600)
  })
})

describe('Scroller 缩放', () => {
  it('zooms to limited level and keeps scroll in range', () => {
    const s = create({ zooming: true })
    s.setDimensions(100, 100, 300, 300)
    const zoomComplete = vi.fn()
    s.zoomTo(4, false, undefined, undefined, zoomComplete) // maxZoom 3
    const v = s.getValues()
    expect(v.zoom).toBe(3)
    expect(zoomComplete).toHaveBeenCalledTimes(1)
    expect(s.getScrollMax().left).toBe(300 * 3 - 100)
  })

  it('warns when zooming is not enabled', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    const s = create()
    s.setDimensions(100, 100, 300, 300)
    s.zoomTo(2, false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Zooming is not enabled'))
  })
})

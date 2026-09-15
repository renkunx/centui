import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 真实 Animate 调度器测试：stub rAF 捕获回调 + fake timers 控制 Date.now，
 * 手动泵帧驱动 start/stop/isRunning 生命周期。
 */
const rafQueue: Array<(t: number) => void> = []

vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
  rafQueue.push(cb)
  return rafQueue.length
})

const { Animate } = await import('../../src/web/animate')

/** 推进系统时间并触发一帧 */
function tick(elapsed: number) {
  vi.setSystemTime(vi.getMockedSystemTime()!.valueOf() + elapsed)
  const frames = [...rafQueue]
  rafQueue.length = 0
  frames.forEach(cb => cb(Date.now()))
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z').getTime() })
  rafQueue.length = 0
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Animate runner', () => {
  it('starts, tracks running state and stops', () => {
    const id = Animate.start(vi.fn(), undefined, vi.fn(), 1000)
    expect(Animate.isRunning(id)).toBe(true)
    expect(Animate.stop(id)).toBe(true)
    expect(Animate.isRunning(id)).toBe(false)
    expect(Animate.stop(id)).toBe(false)
  })

  it('drives step callback with percent derived from elapsed time', () => {
    const step = vi.fn()
    const completed = vi.fn()
    Animate.start(step, undefined, completed, 1000)

    tick(250)
    // 丢帧补偿：250ms ≈ 15 帧，补最多 4 个虚拟帧 + 1 个真实帧
    expect(step).toHaveBeenCalledTimes(5)
    const lastCall = step.mock.calls.at(-1) as [number, number, boolean] | undefined
    expect(lastCall?.[0]).toBeCloseTo(0.25, 5)
    expect(lastCall?.[2]).toBe(true)
  })

  it('completes with wasFinished=true when duration elapses', () => {
    const step = vi.fn(() => true)
    const completed = vi.fn()
    const id = Animate.start(step, undefined, completed, 1000)

    tick(1000)
    expect(completed).toHaveBeenCalledWith(expect.any(Number), id, true)
    expect(Animate.isRunning(id)).toBe(false)
  })

  it('stops early when verify returns false', () => {
    const step = vi.fn()
    const verify = vi.fn(() => false)
    const completed = vi.fn()
    const id = Animate.start(step, verify, completed, 1000)

    tick(100)
    expect(step).not.toHaveBeenCalled()
    expect(completed).toHaveBeenCalledWith(expect.any(Number), id, false)
    expect(Animate.isRunning(id)).toBe(false)
  })

  it('stops when step callback returns false', () => {
    const step = vi.fn(() => false)
    const completed = vi.fn()
    const id = Animate.start(step, undefined, completed, 1000)

    tick(100)
    expect(completed).toHaveBeenCalledWith(expect.any(Number), id, false)
    expect(Animate.isRunning(id)).toBe(false)
  })

  it('requests next frame while animation continues', () => {
    const step = vi.fn(() => true)
    Animate.start(step, undefined, vi.fn(), 1000)

    tick(100)
    const calls = step.mock.calls as unknown as Array<[number, number, boolean]>
    expect(calls.filter(([, , render]) => render).length).toBeGreaterThanOrEqual(1)
    tick(100)
    expect(calls.length).toBeGreaterThan(5) // 补偿帧 + 后续帧
    expect(rafQueue.length).toBeGreaterThan(0) // 已排队下一帧
  })
})

describe('Animate 兜底分支', () => {
  it('treats NaN easing output as 0', () => {
    const step = vi.fn()
    Animate.start(step, undefined, vi.fn(), 1000, () => NaN)
    tick(100)
    const lastCall = step.mock.calls.at(-1) as [number] | undefined
    expect(lastCall?.[0]).toBe(0)
  })

  it('reports wasFinished=true when duration is omitted', () => {
    const completed = vi.fn()
    const id = Animate.start(vi.fn(() => false), undefined, completed)
    tick(50)
    expect(completed).toHaveBeenCalledWith(expect.any(Number), id, true)
  })

  it('falls back to setTimeout(16ms) without rAF', async () => {
    vi.resetModules()
    const saved = globalThis.requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', undefined)
    const { Animate: fresh } = await import('../../src/web/animate')
    const step = vi.fn()
    fresh.start(step, undefined, vi.fn(), 1000)
    vi.advanceTimersByTime(20)
    expect(step).toHaveBeenCalled()
    vi.stubGlobal('requestAnimationFrame', saved)
  })
})

describe('Animate 运行表压缩', () => {
  it('compacts running map every 20 animations', () => {
    for (let i = 0; i < 25; i++) {
      Animate.start(vi.fn(), undefined, vi.fn(), 10000)
    }
    // 第 20 个动画触发压缩，全部仍可停止
    expect(() => Animate.stop(25)).not.toThrow()
  })
})

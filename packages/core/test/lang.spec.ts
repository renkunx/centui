import { afterEach, describe, expect, it, vi } from 'vitest'
import { debounce, noop, randomId, throttle, transformCamelCase } from '../src/lang'

describe('transformCamelCase', () => {
  it('converts kebab-case to camelCase', () => {
    expect(transformCamelCase('cu-button')).toBe('cuButton')
    expect(transformCamelCase('a-b-c')).toBe('aBC')
  })

  it('keeps plain strings unchanged', () => {
    expect(transformCamelCase('abc')).toBe('abc')
  })
})

describe('noop', () => {
  it('returns undefined', () => {
    expect(noop()).toBeUndefined()
  })
})

describe('randomId', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns empty string in test environment (v2 snapshot-friendly contract)', () => {
    expect(randomId()).toBe('')
    expect(randomId('cu', 8)).toBe('')
  })

  it('returns prefixed numeric id outside test environment', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(randomId('cu')).toMatch(/^cu-\d+$/)
  })
})

describe('debounce', () => {
  it('invokes only once with the last arguments after delay', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced(1)
    debounced(2)
    debounced(3)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3)
    vi.useRealTimers()
  })
})

describe('throttle', () => {
  it('invokes immediately then suppresses calls within interval', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 300)

    throttled('a')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')

    throttled('b')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(301)
    throttled('c')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('c')
    vi.useRealTimers()
  })
})

describe('默认参数分支', () => {
  it('debounce/throttle 默认 fn 与 delay 生效', () => {
    vi.useFakeTimers()
    const debounced = debounce()
    expect(() => debounced()).not.toThrow()
    vi.advanceTimersByTime(300)
    const throttled = throttle()
    expect(() => throttled()).not.toThrow()
    vi.useRealTimers()
  })
})

describe('debounce cancel/flush', () => {
  it('cancel drops the pending call and allows later use', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced(1)
    debounced.cancel()
    vi.advanceTimersByTime(500)
    expect(fn).not.toHaveBeenCalled()

    debounced(2)
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(2)
    vi.useRealTimers()
  })

  it('flush invokes the pending call immediately without double firing', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('x')
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('x')
    vi.advanceTimersByTime(500)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('flush keeps only the latest pending args (same as debounce)', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced('b')
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
    vi.useRealTimers()
  })

  it('flush is a no-op without a pending call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    expect(() => debounced.flush()).not.toThrow()
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('throttle cancel', () => {
  it('cancel restores immediate firing', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 300)
    throttled('a')
    throttled('b') // 间隔内被抑制
    expect(fn).toHaveBeenCalledTimes(1)
    throttled.cancel()
    throttled('c') // 重置后立即触发
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('c')
    vi.useRealTimers()
  })
})

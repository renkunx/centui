import { afterEach, describe, expect, it, vi } from 'vitest'
import { debounce, noop, randomId, throttle, transformCamelCase } from '../src/lang'

describe('transformCamelCase', () => {
  it('converts kebab-case to camelCase', () => {
    expect(transformCamelCase('md-button')).toBe('mdButton')
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
    expect(randomId('md', 8)).toBe('')
  })

  it('returns prefixed numeric id outside test environment', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(randomId('md')).toMatch(/^md-\d+$/)
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

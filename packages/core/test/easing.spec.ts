import { describe, expect, it } from 'vitest'
import { easeInOutCubic, easeOutCubic } from '../src/animate'

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('is front-loaded (fast start, slow end)', () => {
    expect(easeOutCubic(0.5)).toBe(0.875)
    expect(easeOutCubic(0.25)).toBeCloseTo(0.578125, 6)
  })
})

describe('easeInOutCubic', () => {
  it('passes through 0, midpoint and 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(0.5)).toBe(0.5)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('is symmetric around midpoint', () => {
    expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625, 6)
  })
})

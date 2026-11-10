import {describe, it, expect} from 'vitest'
import {rowWidthStyle, rowStyleAt, titleWidthStyle, DEFAULT_WIDTH, DEFAULT_TITLE_WIDTH} from '../../src/components/skeleton/logic'

describe('skeleton/logic', () => {
  it('rowWidth 为数值时补 %，字符串原样', () => {
    expect(rowWidthStyle(30, 0)).toBe('30%')
    expect(rowWidthStyle('30px', 0)).toBe('30px')
  })

  it('rowWidth 为数组时按位取值，缺位回退 100%', () => {
    expect(rowWidthStyle([100, '40%'], 0)).toBe('100%')
    expect(rowWidthStyle([100, '40%'], 1)).toBe('40%')
    expect(rowWidthStyle([100], 3)).toBe(DEFAULT_WIDTH)
  })

  it('rowWidth 缺省时回退 100%', () => {
    expect(rowWidthStyle(undefined, 0)).toBe(DEFAULT_WIDTH)
    expect(rowWidthStyle('', 0)).toBe(DEFAULT_WIDTH)
  })

  it('最后一行（index === row-1）固定 60%', () => {
    expect(rowStyleAt('100%', 2, 3)).toBe('60%')
    expect(rowStyleAt('100%', 0, 3)).toBe('100%')
    expect(rowStyleAt(['80%', '70%'], 2, 3)).toBe('60%')
  })

  it('titleWidth：数值补 %，字符串原样，缺省 40%', () => {
    expect(titleWidthStyle(50)).toBe('50%')
    expect(titleWidthStyle('80px')).toBe('80px')
    expect(titleWidthStyle(undefined)).toBe(DEFAULT_TITLE_WIDTH)
  })
})

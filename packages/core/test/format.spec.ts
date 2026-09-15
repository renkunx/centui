/**
 * 期望值全部来自 v2 (legacy/components/_util/formate-value.js) 的实测输出，
 * 是 input-item / amount 等组件输入格式化的行为契约。
 */
import { describe, expect, it } from 'vitest'
import { formatValueByGapRule, formatValueByGapStep, trimValue } from '../src/format'

describe('formatValueByGapRule', () => {
  it('formats bank card style 4|4|4|4', () => {
    expect(formatValueByGapRule('4|4|4|4', '1234567890123456')).toEqual({
      value: '1234 5678 9012 3456',
      range: 19,
    })
  })

  it('formats id card style 6|4|4|4', () => {
    expect(formatValueByGapRule('6|4|4|4', '123456789012345678', ' ')).toEqual({
      value: '123456 7890 1234 5678',
      range: 21,
    })
  })

  it('trims the excess part beyond the rule', () => {
    const { value } = formatValueByGapRule('4|4', '1234567890')
    expect(value).toBe('1234 5678')
  })

  it('adjusts range by gap when adding', () => {
    expect(formatValueByGapRule('3|3', '1234567', ' ', 4, 1)).toEqual({
      value: '123 456',
      range: 5,
    })
  })

  it('adjusts range by gap when deleting', () => {
    expect(formatValueByGapRule('3|3', '12345', ' ', 4, -1)).toEqual({
      value: '123 45',
      range: 3,
    })
  })

  it('keeps range 0 when cursor at start', () => {
    expect(formatValueByGapRule('3|3', '12345', ' ', 0)).toEqual({
      value: '123 45',
      range: 0,
    })
  })
})

describe('formatValueByGapStep', () => {
  it('formats from right with step', () => {
    expect(formatValueByGapStep(4, '123456789')).toEqual({
      value: '1 2345 6789',
      range: undefined,
    })
  })

  it('adjusts range when a gap is added', () => {
    expect(formatValueByGapStep(3, '12345678', ' ', 'right', 3, 1, '123 456')).toEqual({
      value: '12 345 678',
      range: 3,
    })
  })

  it('adjusts range when a gap is removed', () => {
    expect(formatValueByGapStep(3, '12345', ' ', 'right', 6, -1, '123 456')).toEqual({
      value: '12 345',
      range: 6,
    })
  })

  it('formats from left with step', () => {
    expect(formatValueByGapStep(3, '1234567', ' ', 'left', 3)).toEqual({
      value: '123 456 7',
      range: 3,
    })
  })

  it('returns empty value untouched', () => {
    expect(formatValueByGapStep(4, '')).toEqual({ value: '', range: undefined })
  })
})

describe('trimValue', () => {
  it('strips all gap characters', () => {
    expect(trimValue('1 2345 6789')).toBe('123456789')
    expect(trimValue('123-456', '-')).toBe('123456')
    expect(trimValue(undefined)).toBe('')
  })
})

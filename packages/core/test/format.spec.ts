/**
 * 期望值全部来自 v2 (legacy/components/_util/formate-value.js) 的实测输出，
 * 是 input-item / amount 等组件输入格式化的行为契约。
 */
import { describe, expect, it } from 'vitest'
import {
  formatNumberWithSeparator,
  formatValueByGapRule,
  formatValueByGapStep,
  numberToChineseCapital,
  toFixedPrecision,
  trimValue,
} from '../src/format'

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

describe('无 range 的增删分支', () => {
  it('keeps range undefined when deleting without gap change', () => {
    expect(formatValueByGapStep(3, '12345', ' ', 'right', undefined, -1, '123456')).toEqual({
      value: '12 345',
      range: undefined,
    })
  })

  it('keeps range undefined when adding without gap change', () => {
    expect(formatValueByGapStep(4, '12345678', ' ', 'right', undefined, 1, '123456789')).toEqual({
      value: '1234 5678',
      range: undefined,
    })
  })
})

describe('toFixedPrecision', () => {
  it('rounds up by default and floors when roundUp is false', () => {
    expect(toFixedPrecision(1.005, 2)).toBe('1.01')
    expect(toFixedPrecision(1.005, 2, false)).toBe('1.00')
    expect(toFixedPrecision(1234.56, 2)).toBe('1234.56')
  })

  it('treats negative precision as 0', () => {
    expect(toFixedPrecision(12.34, -1)).toBe('12')
    expect(toFixedPrecision(12.34, 0)).toBe('12')
  })

  it('pads decimals to requested precision', () => {
    expect(toFixedPrecision(1, 4)).toBe('1.0000')
  })
})

describe('formatNumberWithSeparator', () => {
  it('groups integer part from right by 3 and keeps decimals', () => {
    expect(formatNumberWithSeparator('1234567.89')).toBe('1,234,567.89')
    expect(formatNumberWithSeparator('1234567')).toBe('1,234,567')
  })

  it('supports custom separator', () => {
    expect(formatNumberWithSeparator('1234567.89', ' ')).toBe('1 234 567.89')
  })

  it('keeps negative sign in front', () => {
    expect(formatNumberWithSeparator('-1234567.89')).toBe('-1,234,567.89')
  })
})

describe('numberToChineseCapital', () => {
  it('converts regular amounts with decimals', () => {
    expect(numberToChineseCapital(1234.56)).toBe('壹仟贰佰叁拾肆元伍角陆分')
    expect(numberToChineseCapital('1234.56')).toBe('壹仟贰佰叁拾肆元伍角陆分')
  })

  it('appends 整 for integer amounts', () => {
    expect(numberToChineseCapital(100)).toBe('壹佰元整')
    expect(numberToChineseCapital(0)).toBe('零元整')
  })

  it('handles zeros inside the integer part', () => {
    expect(numberToChineseCapital(1001)).toBe('壹仟零壹元整')
    expect(numberToChineseCapital(100000001)).toBe('壹亿零壹元整')
  })

  it('prefixes 负 for negative amounts', () => {
    expect(numberToChineseCapital(-12.34)).toBe('负壹拾贰元叁角肆分')
  })

  it('truncates decimals to 毫 (4 digits)', () => {
    expect(numberToChineseCapital(0.1234)).toBe('壹角贰分叁厘肆毫')
    expect(numberToChineseCapital(0.12345)).toBe('壹角贰分叁厘肆毫')
  })

  it('returns empty for empty, NaN or out-of-range input', () => {
    expect(numberToChineseCapital('')).toBe('')
    expect(numberToChineseCapital('abc')).toBe('')
    expect(numberToChineseCapital(1e16)).toBe('')
  })

  it('falls back to 零元整 when integer part is all zero', () => {
    expect(numberToChineseCapital(0.5)).toBe('伍角')
    expect(numberToChineseCapital(0.05)).toBe('伍分')
  })
})

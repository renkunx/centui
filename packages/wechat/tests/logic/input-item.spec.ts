/**
 * input-item 格式化管线测试：phone/bankCard/money/digit/text 全类型 +
 * stripSeparators / subValue / maxlength，逐一对照 Vue 版 InputItem.vue
 * formateValue/subValue 与 @centui/core format.ts。
 */
import {describe, it, expect} from 'vitest'
import {
  emittedValue,
  formatInputValue,
  formatValueByGapRule,
  formatValueByGapStep,
  inputMaxlength,
  isAddOf,
  isFormativeType,
  randomId,
  stripSeparators,
  subValue,
  trimValue,
} from '../../src/components/input-item/logic'

const fmt = (
  curValue: string,
  opts: Partial<Parameters<typeof formatInputValue>[1]> = {},
) =>
  formatInputValue(curValue, {
    type: 'text',
    isFormative: false,
    maxlength: '',
    name: 'test',
    oldValue: '',
    ...opts,
  })

describe('core 同步实现：formatValueByGapRule / GapStep / trimValue', () => {
  it('phone 分组规则 3|4|4', () => {
    expect(formatValueByGapRule('3|4|4', '13800138000').value).toBe('138 0013 8000')
  })

  it('超长部分剔除（规则末位截断）', () => {
    expect(formatValueByGapRule('3|4|4', '1380013800012345').value).toBe('138 0013 8000')
  })

  it('bankCard 步长 4 左分组', () => {
    expect(formatValueByGapStep(4, '6222020200112233', ' ', 'left').value).toBe(
      '6222 0202 0011 2233',
    )
  })

  it('money 步长 3 右分组（千分位）', () => {
    expect(formatValueByGapStep(3, '1234567', ',', 'right').value).toBe('1,234,567')
  })

  it('trimValue 按字面量剔除间隔符（含正则特殊字符）', () => {
    expect(trimValue('1,234,567', ',')).toBe('1234567')
    expect(trimValue('1.2.3', '.')).toBe('123')
    expect(trimValue('a*b', '*')).toBe('ab')
  })
})

describe('input-item/logic stripSeparators（修复后语义）', () => {
  it('剥离空白与千分位逗号', () => {
    expect(stripSeparators('1 23,456')).toBe('123456')
    expect(stripSeparators('  a  ')).toBe('a')
    expect(stripSeparators('')).toBe('')
  })
})

describe('input-item/logic 类型判定与 maxlength', () => {
  it('isFormativeType：isFormative 显式开启或类型自带格式化', () => {
    expect(isFormativeType('bankCard', false)).toBe(true)
    expect(isFormativeType('phone', false)).toBe(true)
    expect(isFormativeType('money', false)).toBe(true)
    expect(isFormativeType('digit', false)).toBe(true)
    expect(isFormativeType('text', false)).toBe(false)
    expect(isFormativeType('text', true)).toBe(true)
  })

  it('inputMaxlength：phone 恒 11', () => {
    expect(inputMaxlength('phone', '')).toBe(11)
    expect(inputMaxlength('phone', 20)).toBe(11)
    expect(inputMaxlength('text', '')).toBe('')
    expect(inputMaxlength('text', 5)).toBe(5)
  })

  it("subValue：'' / undefined 不截断", () => {
    expect(subValue('123456', 11)).toBe('123456')
    expect(subValue('12345678901', 11)).toBe('12345678901')
    expect(subValue('123456789012', 11)).toBe('12345678901')
    expect(subValue('123456', '')).toBe('123456')
    expect(subValue('123456', undefined)).toBe('123456')
  })

  it('isAddOf：长度变短为删除', () => {
    expect(isAddOf('1234', '123')).toBe(-1)
    expect(isAddOf('123', '1234')).toBe(1)
  })
})

describe('input-item/logic 各类型格式化管线', () => {
  it('bankCard：去非数字 → 截断 → 4 位左分组', () => {
    expect(fmt('6222020200112233', {type: 'bankCard'}).value).toBe('6222 0202 0011 2233')
    expect(fmt('6222-0202-0011-2233', {type: 'bankCard'}).value).toBe('6222 0202 0011 2233')
    expect(fmt('62220202001122330000', {type: 'bankCard', maxlength: 16}).value).toBe(
      '6222 0202 0011 2233',
    )
  })

  it('phone：去非数字 → maxlength 11 → 3|4|4', () => {
    expect(fmt('13800138000', {type: 'phone'}).value).toBe('138 0013 8000')
    expect(fmt('1380013800012345', {type: 'phone'}).value).toBe('138 0013 8000')
  })

  it('money：千分位 + 小数位保留', () => {
    expect(fmt('1234567.89', {type: 'money'}).value).toBe('1,234,567.89')
    expect(fmt('1000', {type: 'money'}).value).toBe('1,000')
  })

  it("money：非数字剔除；多余小数点截断至首个小数段（与 Vue split('.')[1] 一致）", () => {
    expect(fmt('abc123', {type: 'money'}).value).toBe('123')
    expect(fmt('1.2.3', {type: 'money'}).value).toBe('1.2')
  })

  it('digit：去非数字并截断', () => {
    expect(fmt('12a34', {type: 'digit'}).value).toBe('1234')
    expect(fmt('123456', {type: 'digit', maxlength: 4}).value).toBe('1234')
  })

  it('text（非 formative）直通不格式化', () => {
    expect(fmt('1a2 b', {type: 'text'}).value).toBe('1a2 b')
  })

  it('formative 开启但类型为 text：无默认格式化分支，值保持（对齐 Vue switch 无 case）', () => {
    expect(fmt('1a2', {type: 'text', isFormative: true}).value).toBe('1a2')
  })

  it("空值直通（curValue === '' 短路）", () => {
    expect(fmt('', {type: 'bankCard'}).value).toBe('')
  })

  it('自定义 formation 优先于默认格式化', () => {
    const formation = (name: string | number, curValue: string, curPos: number) =>
      curValue === 'X' ? {value: 'Y', range: curPos + 1} : undefined
    expect(fmt('X', {type: 'bankCard', formation}).value).toBe('Y')
    expect(fmt('12345678', {type: 'bankCard', formation}).value).toBe('1234 5678')
  })

  it('删除方向（isAdd -1）时 bankCard 光标修正不改变值', () => {
    const r = fmt('1234 567', {type: 'bankCard', oldValue: '1234 5678'})
    expect(r.value).toBe('1234 567')
  })
})

describe('input-item/logic 发射值与 randomId', () => {
  it('emittedValue：格式化类型剥离分隔符', () => {
    expect(emittedValue('138 0013 8000', true)).toBe('13800138000')
    expect(emittedValue('1,234,567.89', true)).toBe('1234567.89')
    expect(emittedValue('1a2', false)).toBe('1a2')
  })

  it('randomId：测试环境空串（对齐 core 契约），运行时带 prefix', () => {
    expect(randomId('input-item')).toBe('')
  })
})

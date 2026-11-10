/**
 * radio-list 纯逻辑测试：currentValue（输入态优先）、选项标题回退、
 * 单元格视图构建（selected/is-selected、icon 态、noBorder、withoutIcon），
 * 对照 Vue 版 RadioList.vue。
 */
import {describe, it, expect} from 'vitest'
import {
  buildRadioCells,
  currentValueOf,
  optionTitle,
  type RadioListOption,
} from '../../src/components/radio-list/logic'

const options: RadioListOption[] = [
  {value: 'a', text: 'Apple'},
  {value: 'b', label: 'Banana', brief: '黄'},
  {value: 'c', text: 'Cherry', disabled: true},
]

describe('radio-list/logic currentValue 与标题', () => {
  it('输入态优先（inputSelected → inputValue）', () => {
    expect(currentValueOf(false, 'typed', 'sel')).toBe('sel')
    expect(currentValueOf(true, 'typed', 'sel')).toBe('typed')
  })

  it('optionTitle：text 优先、label 兜底', () => {
    expect(optionTitle(options[0])).toBe('Apple')
    expect(optionTitle(options[1])).toBe('Banana')
    expect(optionTitle({value: 'z'})).toBe('')
  })
})

describe('radio-list/logic 单元格视图', () => {
  const base = {
    selectedValue: 'b' as RadioListOption['value'],
    inputSelected: false,
    alignCenter: false,
    withoutIcon: false,
    iconPosition: 'left',
    icon: 'checked',
    iconInverse: 'check',
    iconDisabled: 'check-disabled',
  }

  it('selected 态与 is-selected：selectedValue 命中且非输入态', () => {
    const cells = buildRadioCells(options, base)
    expect(cells[1].selected).toBe(true)
    expect(cells[0].selected).toBe(false)
    expect(cells[1].icon).toBe('checked')
    expect(cells[0].icon).toBe('check')
  })

  it('inputSelected：is-selected 全部退位、图标隐藏（对齐 Vue 模板 v-if）', () => {
    const cells = buildRadioCells(options, {...base, inputSelected: true})
    expect(cells.every((c) => !c.selected)).toBe(true)
    expect(cells.every((c) => !c.showIcon)).toBe(true)
  })

  it('noBorder：仅末项', () => {
    const cells = buildRadioCells(options, base)
    expect(cells.map((c) => c.noBorder)).toEqual([false, false, true])
  })

  it('disabled 项 iconDisabled', () => {
    const cells = buildRadioCells(options, base)
    expect(cells[2].disabled).toBe(true)
    expect(cells[2].icon).toBe('check-disabled')
  })

  it('iconPosition right / withoutIcon / alignCenter 分支', () => {
    const right = buildRadioCells(options, {...base, iconPosition: 'right'})
    expect(right.every((c) => c.side === 'right')).toBe(true)
    const without = buildRadioCells(options, {...base, withoutIcon: true})
    expect(without.every((c) => !c.showIcon)).toBe(true)
    const centered = buildRadioCells(options, {...base, alignCenter: true})
    expect(centered.every((c) => !c.showIcon)).toBe(true)
  })

  it('标题回退与 brief/no 序号', () => {
    const cells = buildRadioCells(options, base)
    expect(cells[1].title).toBe('Banana')
    expect(cells[1].brief).toBe('黄')
    expect(cells.map((c) => c.no)).toEqual([0, 1, 2])
  })
})

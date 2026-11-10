/**
 * selector 纯逻辑测试：defaultValue 归一、cancelText 回退、onlyClose 判定、
 * 单选/多选单元格视图与选择载荷结构，对照 Vue 版 Selector.vue。
 */
import {describe, it, expect} from 'vitest'
import {
  buildSelectorCells,
  isNeedConfirmOf,
  isOnlyClose,
  normalizeMultiValue,
  resolveCancelText,
  type SelectorItem,
} from '../../src/components/selector/logic'

const items: SelectorItem[] = [
  {value: 'a', text: 'Apple'},
  {value: 'b', label: 'Banana', brief: '黄'},
  {value: 'c', text: 'Cherry', disabled: true},
]

describe('selector/logic 值归一与文案', () => {
  it('normalizeMultiValue：数组取副本、标量包一元数组', () => {
    const arr = ['a', 1]
    const out = normalizeMultiValue(arr)
    expect(out).toEqual(['a', 1])
    expect(out).not.toBe(arr)
    expect(normalizeMultiValue('a')).toEqual(['a'])
    expect(normalizeMultiValue(3)).toEqual([3])
  })

  it('resolveCancelText：cancelText 未传（null）时按 okText 回退「取消」', () => {
    expect(resolveCancelText(null, '')).toBe('')
    expect(resolveCancelText(null, '确定')).toBe('取消')
    expect(resolveCancelText('关闭', '确定')).toBe('关闭')
    // 显式空串按 ?? 语义保留为空（不回退）
    expect(resolveCancelText('', '确定')).toBe('')
  })

  it('isOnlyClose：非多选、无确认文案且未传 cancelText', () => {
    expect(isOnlyClose(false, false, null)).toBe(true)
    expect(isOnlyClose(false, true, null)).toBe(false)
    expect(isOnlyClose(false, false, '')).toBe(true)
    expect(isOnlyClose(true, false, null)).toBe(false)
  })

  it('isNeedConfirmOf：okText 非空', () => {
    expect(isNeedConfirmOf('')).toBe(false)
    expect(isNeedConfirmOf('确定')).toBe(true)
  })
})

describe('selector/logic 单元格视图（单选）', () => {
  const cells = buildSelectorCells(items, {
    multi: false,
    selectedValue: 'b',
    multiValue: [],
    alignCenter: false,
    iconPosition: 'right',
    icon: 'checked',
    iconInverse: 'check',
    iconDisabled: 'check-disabled',
  })

  it('标题 text 优先、label 兜底；brief 透传', () => {
    expect(cells[0].title).toBe('Apple')
    expect(cells[1].title).toBe('Banana')
    expect(cells[1].brief).toBe('黄')
  })

  it('选中项 icon 为 checked，其余为 inverse；disabled 用 iconDisabled', () => {
    expect(cells[0].icon).toBe('check')
    expect(cells[1].icon).toBe('checked')
    expect(cells[2].icon).toBe('check-disabled')
  })

  it('单选 selected 态与图标位置', () => {
    expect(cells[1].selected).toBe(true)
    expect(cells[0].selected).toBe(false)
    expect(cells.every((c) => c.side === 'right')).toBe(true)
  })
})

describe('selector/logic 单元格视图（多选）', () => {
  const cells = buildSelectorCells(items, {
    multi: true,
    selectedValue: '',
    multiValue: ['a', 'c'],
    alignCenter: false,
    iconPosition: 'left',
    icon: 'checked',
    iconInverse: 'check',
    iconDisabled: 'check-disabled',
  })

  it('checked 态按 multiValue 数组判定；disabled 项图标态正确', () => {
    expect(cells[0].checked).toBe(true)
    expect(cells[0].icon).toBe('checked')
    expect(cells[1].checked).toBe(false)
    expect(cells[2].checked).toBe(true)
    expect(cells[2].icon).toBe('check-disabled')
  })

  it('多选下 selected 恒为 false（选择态由 checked 承载）', () => {
    expect(cells.every((c) => !c.selected)).toBe(true)
    expect(cells.every((c) => c.side === 'left')).toBe(true)
  })
})

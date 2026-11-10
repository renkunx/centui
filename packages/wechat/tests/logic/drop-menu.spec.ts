/**
 * drop-menu 纯逻辑测试：initSelectedBar（value/text/label 匹配）、bar 文本与
 * 选中态、bar 点击状态机（二次点击收起、disabled），对照 Vue 版 DropMenu.vue。
 */
import {describe, it, expect} from 'vitest'
import {
  barItemTapState,
  barItemText,
  initSelectedBar,
  isBarItemSelected,
  type DropMenuItem,
} from '../../src/components/drop-menu/logic'

const data: DropMenuItem[] = [
  {text: 'A', options: [{value: 1, text: 'a1'}, {value: 2, text: 'a2'}]},
  {text: 'B', options: [{value: 'x', text: 'b1', label: 'bx'}]},
  {text: 'C', disabled: true},
]

describe('drop-menu/logic initSelectedBar', () => {
  it('按 value 匹配定位选中记录', () => {
    const r = initSelectedBar(data, [2, 'x'])
    expect(r.selectedItems[0]).toEqual({value: 2, text: 'a2'})
    expect(r.selectedItems[1]).toEqual({value: 'x', text: 'b1', label: 'bx'})
    expect(r.selectedValues).toEqual([2, 'x'])
  })

  it('按 text / label 匹配（对齐 Vue record.value/text/label 三连判定）', () => {
    // defaultValue 按 bar 下标对位：[1, 'bx'] 分别匹配 bar0 的 value 与 bar1 的 label
    const r = initSelectedBar(data, [1, 'bx'])
    expect(r.selectedItems[0]).toEqual({value: 1, text: 'a1'})
    expect(r.selectedItems[1]).toEqual({
      value: 'x',
      text: 'b1',
      label: 'bx',
    })
  })

  it('无匹配留空；selectedValues 为副本', () => {
    const dv = [2]
    const r = initSelectedBar(data, dv)
    expect(r.selectedItems[0]).toEqual({value: 2, text: 'a2'})
    expect(r.selectedItems[1]).toBeUndefined()
    expect(r.selectedValues).not.toBe(dv)
  })

  it('与 Vue 一致：仅匹配一层 options（level 恒 0，不递归）', () => {
    const nested: DropMenuItem[] = [
      {text: 'N', options: [{value: 9, text: 'n9'}]},
    ]
    // defaultValue 命中顶层 option 才有效
    expect(initSelectedBar(nested, [9]).selectedItems[0]).toEqual({value: 9, text: 'n9'})
  })
})

describe('drop-menu/logic bar 文本与选中态', () => {
  it('有选中记录取其 text（缺省空串），无记录取 bar 项 text', () => {
    expect(barItemText(data[0], {value: 2, text: 'a2'})).toBe('a2')
    expect(barItemText(data[0], undefined)).toBe('A')
    expect(barItemText(data[0], {value: 9})).toBe('')
  })

  it('isBarItemSelected：选中记录或 defaultValue 命中即为已选', () => {
    expect(isBarItemSelected(undefined, [2], 0)).toBe(true)
    expect(isBarItemSelected({value: 1}, [], 0)).toBe(true)
    expect(isBarItemSelected(undefined, [2], 1)).toBe(false)
  })
})

describe('drop-menu/logic bar 点击状态机', () => {
  it('关闭态点击：打开并记 activeIndex', () => {
    expect(barItemTapState(false, data[0])).toEqual({show: true, activeIndexSet: true})
  })

  it('打开态点击（任意 bar）：收起（对齐 Vue else 分支，二次点击收起）', () => {
    expect(barItemTapState(true, data[1])).toEqual({show: false, activeIndexSet: false})
  })

  it('disabled 项不动', () => {
    expect(barItemTapState(false, data[2])).toEqual({show: false, activeIndexSet: false})
    expect(barItemTapState(true, undefined)).toEqual({show: true, activeIndexSet: false})
  })
})

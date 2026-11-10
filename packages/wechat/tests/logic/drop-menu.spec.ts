/**
 * drop-menu 纯逻辑测试：initSelectedBar（value/text/label 匹配）、bar 文本与
 * 选中态、bar 点击状态机（二次点击收起、disabled），对照 Vue 版 DropMenu.vue。
 */
import {describe, it, expect} from 'vitest'
import {loadComponent, mountDef, tapEvent, type Mounted} from '../helpers/weapp'
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

// ---------------------------------------------------------------------------
// drop-menu 组件实例（index.ts）：observers / bar 状态机 / 列表选择 / popup 桥接
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/drop-menu/index'))

const MENU: DropMenuItem[] = [
  {text: 'A', options: [{value: 1, text: 'a1'}, {value: 2, text: 'a2'}]},
  {text: 'B', options: [{value: 'x', text: 'b1', label: 'bx'}, {value: 'y'}]},
  {text: 'C', disabled: true},
]

interface BarView {
  no: number
  text: string
  active: boolean
  selected: boolean
  disabled: boolean
}

function bars(inst: Mounted): BarView[] {
  return inst.data.bars as BarView[]
}

function cells(inst: Mounted): Array<{no: number; title: string; selected: boolean}> {
  return inst.data.cells as Array<{no: number; title: string; selected: boolean}>
}

describe('drop-menu 组件 attached 初始化', () => {
  it('menuData 快照 + defaultValue 扫描选中记录；bar 视图生成', () => {
    const inst = mountDef(comp.def, {props: {data: MENU, defaultValue: [2]}})
    inst.attached()
    expect(inst.data.menuData).toEqual(MENU)
    expect(inst.data.selectedValues).toEqual([2])
    expect(inst.data.selectedItems[0]).toEqual({value: 2, text: 'a2'})
    expect(bars(inst)).toEqual([
      {no: 0, text: 'a2', active: false, selected: true, disabled: false},
      {no: 1, text: 'B', active: false, selected: false, disabled: false},
      {no: 2, text: 'C', active: false, selected: false, disabled: true},
    ])
    // activeMenuBarIndex=-1：cells 空（barItem undefined 分支）
    expect(cells(inst)).toEqual([])
  })

  it('无 props（默认空 data）→ 空 bar 列表', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.menuData).toEqual([])
    expect(bars(inst)).toEqual([])
  })
})

describe('drop-menu bar 点击状态机', () => {
  it('关闭态点击：打开并记 activeMenuBarIndex；cells 按当前列构建', () => {
    const inst = mountDef(comp.def, {props: {data: MENU, defaultValue: [2]}})
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 0}))
    expect(inst.data.isPopupShow).toBe(true)
    expect(inst.data.activeMenuBarIndex).toBe(0)
    expect(bars(inst)[0]).toMatchObject({active: true, text: 'a2'})
    expect(cells(inst)).toEqual([
      {no: 0, title: 'a1', selected: false},
      {no: 1, title: 'a2', selected: true},
    ])
  })

  it('打开态点击任意 bar：收起（二次点击收起语义）', () => {
    const inst = mountDef(comp.def, {props: {data: MENU}})
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 1}))
    expect(inst.data.isPopupShow).toBe(true)
    inst.methods.onBarItemClick(tapEvent({index: 0}))
    expect(inst.data.isPopupShow).toBe(false)
    // 收起只改 isPopupShow，activeMenuBarIndex 保留首开列（Vue 语义）
    expect(inst.data.activeMenuBarIndex).toBe(1)
  })

  it('disabled bar / 越界 index：状态不动（return 分支）', () => {
    const inst = mountDef(comp.def, {props: {data: MENU}})
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 2}))
    expect(inst.data.isPopupShow).toBe(false)
    expect(inst.data.activeMenuBarIndex).toBe(-1)
    inst.methods.onBarItemClick(tapEvent({index: 9}))
    expect(inst.data.isPopupShow).toBe(false)
    expect(inst.data.activeMenuBarIndex).toBe(-1)
  })
})

describe('drop-menu 列表项选择', () => {
  it('onListItemClick：收起 + 记录选中 + change {barItem, listItem}', () => {
    const inst = mountDef(comp.def, {props: {data: MENU, defaultValue: [2]}})
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 0}))
    inst.methods.onListItemClick(tapEvent({index: 0}))
    expect(inst.data.isPopupShow).toBe(false)
    expect(inst.data.selectedValues).toEqual([1])
    expect(inst.data.selectedItems[0]).toEqual({value: 1, text: 'a1'})
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {barItem: MENU[0], listItem: {value: 1, text: 'a1'}}},
    ])
    // 收起后 active 列保留（点击列 0），bar 文本切到新选中项
    expect(bars(inst)[0]).toMatchObject({text: 'a1', selected: true, active: true})
  })

  it('option text 优先于 label；无 text/label 选项 title 为空串', () => {
    const inst = mountDef(comp.def, {props: {data: MENU}})
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 1}))
    expect(cells(inst).map((c) => c.title)).toEqual(['b1', ''])
    inst.methods.onListItemClick(tapEvent({index: 0}))
    expect(cells(inst)[0].selected).toBe(true)
    inst.methods.onListItemClick(tapEvent({index: 1}))
    // 两次点击均作用于 active 列（1）：选中值落 selectedValues[1]
    expect(inst.data.selectedValues[1]).toBe('y')
    expect(inst.methods.getSelectedValue(1)).toEqual({value: 'y'})
    expect(cells(inst)[0].selected).toBe(false)
    expect(cells(inst)[1].selected).toBe(true)
  })

  it('无效 index / 越界：静默', () => {
    const inst = mountDef(comp.def, {props: {data: MENU}})
    inst.attached()
    expect(() => inst.methods.onListItemClick(tapEvent({index: 9}))).not.toThrow()
    expect(inst.events).toEqual([])
  })

  it('getSelectedValues / getSelectedValue（defineExpose 对齐）', () => {
    const inst = mountDef(comp.def, {props: {data: MENU, defaultValue: [2]}})
    inst.attached()
    expect(inst.methods.getSelectedValues()).toEqual([{value: 2, text: 'a2'}])
    expect(inst.methods.getSelectedValue(0)).toEqual({value: 2, text: 'a2'})
    expect(inst.methods.getSelectedValue(5)).toBeUndefined()
  })
})

describe('drop-menu popup 桥接', () => {
  it('onPopupChange(false)：同步收起；true / detail null 不动', () => {
    const inst = mountDef(comp.def, {props: {data: MENU}})
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 0}))
    expect(inst.data.isPopupShow).toBe(true)
    inst.methods.onPopupChange({detail: {value: true}})
    expect(inst.data.isPopupShow).toBe(true)
    inst.methods.onPopupChange({detail: null})
    expect(inst.data.isPopupShow).toBe(true)
    inst.methods.onPopupChange({detail: {value: false}})
    expect(inst.data.isPopupShow).toBe(false)
  })

  it('onPopupShow / onPopupHide：show / hide 事件转发', () => {
    const inst = mountDef(comp.def)
    inst.methods.onPopupShow()
    inst.methods.onPopupHide()
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)
  })

  it('onPopupBeforeHide：activeMenuBarIndex = -1（cells 清空、bars 失活）', () => {
    const inst = mountDef(comp.def, {props: {data: MENU}})
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 1}))
    expect(inst.data.activeMenuBarIndex).toBe(1)
    inst.methods.onPopupBeforeHide()
    expect(inst.data.activeMenuBarIndex).toBe(-1)
    expect(cells(inst)).toEqual([])
    expect(bars(inst).every((b) => !b.active)).toBe(true)
  })
})

describe('drop-menu data / defaultValue observers（JSON 对比）', () => {
  it('data 相同内容（新引用）跳过重建；不同内容重扫选中', () => {
    const inst = mountDef(comp.def, {props: {data: MENU, defaultValue: [2]}})
    inst.attached()
    // JSON 相同 → 跳过（selectedItems 不重置）
    inst.setData({data: JSON.parse(JSON.stringify(MENU))})
    expect(inst.data.selectedItems[0]).toEqual({value: 2, text: 'a2'})
    // JSON 不同 → 重扫
    const next: DropMenuItem[] = [{text: 'D', options: [{value: 7, text: 'd7'}]}]
    inst.setData({data: next})
    expect(inst.data.menuData).toEqual(next)
    expect(inst.data.selectedItems[0]).toBeUndefined()
  })

  it('defaultValue 相同跳过；不同重扫（selectedValues 同步）', () => {
    const inst = mountDef(comp.def, {props: {data: MENU, defaultValue: [2]}})
    inst.attached()
    inst.setData({defaultValue: [2]})
    expect(inst.data.selectedValues).toEqual([2])
    inst.setData({defaultValue: [1]})
    expect(inst.data.selectedValues).toEqual([1])
    expect(inst.data.selectedItems[0]).toEqual({value: 1, text: 'a1'})
  })

  it('data observer：null 视为空数组重建（val || [] 分支）', () => {
    const inst = mountDef(comp.def, {props: {data: MENU}})
    inst.attached()
    inst.setData({data: null})
    expect(inst.data.menuData).toEqual([])
  })
})

describe('drop-menu 防御分支（data 字段异常态兜底）', () => {
  it('attached 时 data/defaultValue 为 null：按空处理', () => {
    const inst = mountDef(comp.def, {props: {data: null, defaultValue: null}})
    expect(() => inst.attached()).not.toThrow()
    expect(inst.data.menuData).toEqual([])
    expect(inst.data.selectedValues).toEqual([])
  })

  it('refreshBar / refreshCells：menuData/selectedItems/selectedValues 为 null 按空处理', () => {
    const inst = mountDef(comp.def)
    inst.setData({menuData: null, selectedItems: null, selectedValues: null, activeMenuBarIndex: 0})
    expect(inst.data.bars).toEqual([])
    expect(inst.data.cells).toEqual([])
  })

  it('onBarItemClick / onListItemClick：menuData 为 null 时静默', () => {
    const inst = mountDef(comp.def)
    inst.setData({menuData: null, activeMenuBarIndex: 0})
    expect(() => inst.methods.onBarItemClick(tapEvent({index: 0}))).not.toThrow()
    expect(() => inst.methods.onListItemClick(tapEvent({index: 0}))).not.toThrow()
    expect(inst.events).toEqual([])
  })

  it('active bar 无 options 键：cells 空（?? [] / || [] 分支），列表点击静默', () => {
    const inst = mountDef(comp.def, {
      props: {data: [{text: '无选项'}, {text: 'B', options: [{value: 1, text: 'b1'}]}]},
    })
    inst.attached()
    inst.methods.onBarItemClick(tapEvent({index: 0}))
    expect(inst.data.cells).toEqual([])
    expect(() => inst.methods.onListItemClick(tapEvent({index: 0}))).not.toThrow()
    expect(inst.events).toEqual([])
  })
})

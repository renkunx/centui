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

// ---------------------------------------------------------------------------
// selector 组件实例（index.ts）：observers/attached/选项交互/确认取消/popup 桥接
// ---------------------------------------------------------------------------
import {describe as d2, expect as e2, it as i2} from 'vitest'
import {loadComponent, mountDef, tapEvent, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/selector/index'))

const ITEMS = [
  {value: 'a', text: 'Apple'},
  {value: 'b', label: 'Banana'},
  {value: 'c', text: 'Cherry', disabled: true},
]

function stateOf(inst: Mounted) {
  return inst as unknown as {__popup: unknown}
}

function tap(index: number) {
  return tapEvent({index}) as never
}

d2('selector attached 派生', () => {
  i2('默认：selectorShow false、cancelText 空、onlyClose true、空 cells', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    e2(inst.data.selectorShow).toBe(false)
    e2(inst.data.isNeedConfirm).toBe(false)
    e2(inst.data.actualCancelText).toBe('')
    e2(inst.data.onlyClose).toBe(true)
    e2(inst.data.cells).toEqual([])
    e2(inst.data.selectedValue).toBe('')
  })

  i2('单选 defaultValue：selectedValue 同步 + cells 选中态', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS, defaultValue: 'b'}})
    inst.attached()
    e2(inst.data.selectedValue).toBe('b')
    e2(inst.data.cells[1]).toMatchObject({title: 'Banana', selected: true, icon: 'checked'})
    e2(inst.data.cells[0].icon).toBe('check')
    e2(inst.data.cells[2].icon).toBe('check-disabled')
  })

  i2('多选 defaultValue：归一 + checked 态', () => {
    const inst = mountDef(comp.def, {props: {multi: true, data: ITEMS, defaultValue: ['a', 2]}})
    inst.attached()
    e2(inst.data.multiDefaultValue).toEqual(['a', 2])
    e2(inst.data.cells[0].checked).toBe(true)
    e2(inst.data.cells[1].checked).toBe(false)
  })

  i2('多选 defaultValue 空串：跳过归一', () => {
    const inst = mountDef(comp.def, {props: {multi: true, defaultValue: ''}})
    inst.attached()
    e2(inst.data.multiDefaultValue).toEqual([])
  })

  i2('okText：确认模式元数据（isNeedConfirm/actualCancelText/onlyClose）', () => {
    const inst = mountDef(comp.def, {props: {okText: '确定'}})
    inst.attached()
    e2(inst.data.isNeedConfirm).toBe(true)
    e2(inst.data.actualCancelText).toBe('取消') // cancelText null → 回退
    e2(inst.data.onlyClose).toBe(false)
  })
})

d2('selector observers', () => {
  i2('show observer → selectorShow', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    e2(inst.data.selectorShow).toBe(true)
    inst.setData({show: false})
    e2(inst.data.selectorShow).toBe(false)
  })

  i2('defaultValue observer：单选回写 / 多选归一与空值守卫', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS}})
    inst.attached()
    inst.setData({defaultValue: 'c'})
    e2(inst.data.selectedValue).toBe('c')

    const multi = mountDef(comp.def, {props: {multi: true}})
    multi.attached()
    multi.setData({defaultValue: ['a']})
    e2(multi.data.multiDefaultValue).toEqual(['a'])
    multi.setData({defaultValue: 5}) // 标量包一元数组
    e2(multi.data.multiDefaultValue).toEqual([5])
    multi.setData({defaultValue: ''}) // 空串守卫
    e2(multi.data.multiDefaultValue).toEqual([5])
    multi.setData({defaultValue: undefined})
    e2(multi.data.multiDefaultValue).toEqual([5])
    multi.setData({defaultValue: null})
    e2(multi.data.multiDefaultValue).toEqual([5])
  })

  i2('data/selectedValue/multi/icon 系列 observer → refreshCells', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS}})
    inst.attached()
    inst.setData({selectedValue: 'a'})
    e2(inst.data.cells[0].selected).toBe(true)
    inst.setData({icon: 'checked-circle', iconInverse: 'circle', iconPosition: 'left'})
    e2(inst.data.cells[0].icon).toBe('checked-circle')
    e2(inst.data.cells[1].icon).toBe('circle')
    e2(inst.data.cells.every((c: {side: string}) => c.side === 'left')).toBe(true)
    inst.setData({data: [{value: 'x', text: 'X'}]})
    e2(inst.data.cells).toHaveLength(1)
    inst.setData({multi: true, multiDefaultValue: ['x']})
    e2(inst.data.cells[0].checked).toBe(true)
  })

  i2('okText/cancelText/isCheck observer → refreshMeta', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({okText: 'OK'})
    e2(inst.data.isNeedConfirm).toBe(true)
    e2(inst.data.actualCancelText).toBe('取消')
    e2(inst.data.onlyClose).toBe(false)
    inst.setData({cancelText: '关闭'})
    e2(inst.data.actualCancelText).toBe('关闭')
    inst.setData({isCheck: true})
    e2(inst.data.onlyClose).toBe(false) // isCheck → 非 onlyClose
    inst.setData({okText: '', cancelText: null, isCheck: false})
    e2(inst.data.onlyClose).toBe(true)
  })

  i2('largeRadius observer：popup 通道回写（含无 popup / 无方法防御）', () => {
    const radii: boolean[] = []
    const popup = {setLargeRadius: (v: boolean) => radii.push(v)}
    const inst = mountDef(comp.def, {props: {largeRadius: true}})
    inst.linkRelation('../popup/index', popup)
    e2(radii).toEqual([true]) // linked 推送
    inst.setData({largeRadius: false})
    e2(radii).toEqual([true, false])

    const bare = mountDef(comp.def) // 无 popup
    bare.attached()
    e2(() => bare.setData({largeRadius: true})).not.toThrow()

    const noFn = mountDef(comp.def) // popup 无 setLargeRadius 方法（白盒直设 __popup）
    noFn.attached()
    ;(noFn as unknown as {__popup: unknown}).__popup = {}
  })
})

d2('selector relations（popup 反向通道）', () => {
  i2('linked：登记 + 按 largeRadius 推送；unlinked 置空', () => {
    const radii: boolean[] = []
    const popup = {setLargeRadius: (v: boolean) => radii.push(v)}
    const inst = mountDef(comp.def)
    inst.linkRelation('../popup/index', popup)
    e2(stateOf(inst).__popup).toBe(popup)
    e2(radii).toEqual([false]) // 默认无 largeRadius

    const rel = comp.def.relations!['../popup/index']
    rel.unlinked!.call(inst, popup as never)
    e2(stateOf(inst).__popup).toBe(null)
    e2(radii).toEqual([false])
  })
})

d2('selector popup 桥接', () => {
  i2('onPopupChange：false 关闭 + change(false)；true/无 detail 忽略', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    inst.methods.onPopupChange.call(inst, {detail: {value: true}} as never)
    e2(inst.data.selectorShow).toBe(true)
    e2(inst.events).toEqual([])
    inst.methods.onPopupChange.call(inst, {} as never)
    e2(inst.events).toEqual([])
    inst.methods.onPopupChange.call(inst, {detail: {value: false}} as never)
    e2(inst.data.selectorShow).toBe(false)
    e2(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])
  })

  i2('onPopupShow / onPopupHide 事件透传', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onPopupShow.call(inst)
    inst.methods.onPopupHide.call(inst)
    e2(inst.eventsOf('show')).toHaveLength(1)
    e2(inst.eventsOf('hide')).toHaveLength(1)
  })

  i2('onPopupMaskClick → 取消路径', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    inst.methods.onPopupMaskClick.call(inst)
    e2(inst.eventsOf('cancel')).toHaveLength(1)
    e2(inst.data.selectorShow).toBe(false)
  })

  i2('__close：仅收起', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({selectorShow: true})
    inst.methods.__close.call(inst)
    e2(inst.data.selectorShow).toBe(false)
  })
})

d2('selector 选项交互（单选）', () => {
  i2('onOptionTap：立即生效（无确认）→ activeIndex + 关闭 + choose', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS}})
    inst.attached()
    inst.setData({show: true})
    inst.methods.onOptionTap.call(inst, tap(1))
    e2(inst.data.tmpActiveIndex).toBe(1)
    e2(inst.data.activeIndex).toBe(1)
    e2(inst.data.selectedValue).toBe('b')
    e2(inst.data.selectorShow).toBe(false)
    e2(inst.eventsOf('choose')).toEqual([{name: 'choose', detail: {item: ITEMS[1]}}])
  })

  i2('onOptionTap：越界/禁用早退', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS}})
    inst.attached()
    inst.methods.onOptionTap.call(inst, tap(9))
    inst.methods.onOptionTap.call(inst, tap(2)) // disabled
    e2(inst.events).toEqual([])
    e2(inst.data.tmpActiveIndex).toBe(-1)
  })

  i2('确认模式：暂存 tmpActiveIndex 不关闭；confirm 落定 + 回退', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS, okText: '确定'}})
    inst.attached()
    inst.setData({show: true})
    inst.methods.onOptionTap.call(inst, tap(0))
    e2(inst.data.tmpActiveIndex).toBe(0)
    e2(inst.data.activeIndex).toBe(-1) // 未落定
    e2(inst.data.selectorShow).toBe(true)
    e2(inst.eventsOf('choose')).toHaveLength(1)

    inst.methods.onSelectorConfirm.call(inst)
    e2(inst.data.activeIndex).toBe(0)
    e2(inst.data.selectorShow).toBe(false)
    e2(inst.eventsOf('confirm')).toEqual([{name: 'confirm', detail: {item: ITEMS[0]}}])

    // 再次 confirm（tmp 已落定清场后 activeIndex 0 > -1 分支仍走，但 item 存在）
    inst.methods.onSelectorConfirm.call(inst)
    e2(inst.eventsOf('confirm')).toHaveLength(2)
  })

  i2('确认模式：未暂存 confirm → 无事件', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS, okText: '确定'}})
    inst.attached()
    inst.methods.onSelectorConfirm.call(inst)
    e2(inst.events).toEqual([])
  })

  i2('onSelectorCancel：未确认回退 defaultValue；已确认回退选中项', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS, defaultValue: 'a', okText: '确定'}})
    inst.attached()
    inst.setData({show: true})
    inst.methods.onSelectorCancel.call(inst) // activeIndex -1 → defaultValue
    e2(inst.data.tmpActiveIndex).toBe(-1)
    e2(inst.data.selectedValue).toBe('a')
    e2(inst.data.selectorShow).toBe(false)
    e2(inst.eventsOf('cancel')).toHaveLength(1)

    inst.methods.onOptionTap.call(inst, tap(1)) // 暂存 b
    inst.methods.onSelectorCancel.call(inst) // 回退 activeIndex -1 → defaultValue... activeIndex 未落定
    e2(inst.data.selectedValue).toBe('a')

    inst.methods.onOptionTap.call(inst, tap(1))
    inst.methods.onSelectorConfirm.call(inst) // activeIndex = 1
    inst.setData({show: true})
    inst.methods.onOptionTap.call(inst, tap(0)) // 暂存 a（反悔）
    inst.methods.onSelectorCancel.call(inst) // 回退 activeIndex 1 → b
    e2(inst.data.selectedValue).toBe('b')
    e2(inst.eventsOf('cancel')).toHaveLength(3)
  })

  i2('onSelectorCancel：隐藏态不重复关闭', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS}})
    inst.attached()
    inst.methods.onSelectorCancel.call(inst)
    e2(inst.eventsOf('cancel')).toHaveLength(1)
    e2(inst.data.selectorShow).toBe(false)
  })
})

d2('selector 选项交互（多选）', () => {
  i2('onOptionMultiTap：勾选/取消 toggle', () => {
    const inst = mountDef(comp.def, {props: {multi: true, data: ITEMS}})
    inst.attached()
    inst.methods.onOptionMultiTap.call(inst, tap(0))
    e2(inst.data.multiDefaultValue).toEqual(['a'])
    inst.methods.onOptionMultiTap.call(inst, tap(1))
    e2(inst.data.multiDefaultValue).toEqual(['a', 'b'])
    inst.methods.onOptionMultiTap.call(inst, tap(1)) // 取消
    e2(inst.data.multiDefaultValue).toEqual(['a'])
  })

  i2('onOptionMultiTap：越界/禁用早退', () => {
    const inst = mountDef(comp.def, {props: {multi: true, data: ITEMS}})
    inst.attached()
    inst.methods.onOptionMultiTap.call(inst, tap(9))
    inst.methods.onOptionMultiTap.call(inst, tap(2))
    e2(inst.data.multiDefaultValue).toEqual([])
  })

  i2('onSelectorConfirm（多选）：confirm {value: 副本} + 关闭', () => {
    const inst = mountDef(comp.def, {props: {multi: true, data: ITEMS, defaultValue: ['a']}})
    inst.attached()
    inst.setData({show: true})
    inst.methods.onSelectorConfirm.call(inst)
    e2(inst.eventsOf('confirm')).toEqual([{name: 'confirm', detail: {value: ['a']}}])
    e2(inst.data.selectorShow).toBe(false)
  })
})

d2('selector 边界分支', () => {
  i2('confirm：暂存索引指向已消失的数据项 → 落定但不派发 confirm', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS, okText: '确定'}})
    inst.attached()
    inst.methods.onOptionTap.call(inst, tap(1)) // 暂存 index 1
    inst.setData({data: []}) // 数据清空后 confirm
    inst.methods.onSelectorConfirm.call(inst)
    e2(inst.data.activeIndex).toBe(1)
    e2(inst.eventsOf('confirm')).toEqual([])
  })

  i2('cancel：已确认索引指向已消失的数据项 → 回退 defaultValue 之外不崩', () => {
    const inst = mountDef(comp.def, {props: {data: ITEMS, okText: '确定'}})
    inst.attached()
    inst.methods.onOptionTap.call(inst, tap(1))
    inst.methods.onSelectorConfirm.call(inst) // activeIndex = 1
    inst.setData({data: []})
    inst.methods.onSelectorCancel.call(inst)
    e2(inst.eventsOf('cancel')).toHaveLength(1)
    e2(inst.data.selectedValue).toBe('b') // item 缺失 → 不回写，保留最近选择
  })
})

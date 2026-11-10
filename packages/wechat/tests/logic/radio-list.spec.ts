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

// ---------------------------------------------------------------------------
// radio-list 组件实例（index.ts）：attached 同步、observers、点选/输入/select API
// ---------------------------------------------------------------------------
import {describe as describeInst} from 'vitest'
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'

const compList = await loadComponent(() => import('../../src/components/radio-list/index'))

const OPTS = [
  {value: 'a', text: 'Apple'},
  {value: 'b', text: 'Banana'},
  {value: 'c', text: 'Cherry', disabled: true},
]

describeInst('radio-list 组件实例', () => {
  it('attached：selectedValue 对齐初始 value，cells 构建选中态', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS, value: 'b'}})
    inst.attached()
    expect(inst.data.selectedValue).toBe('b')
    const cells = inst.data.cells as Array<{selected: boolean; title: string; checked: boolean; disabled: boolean}>
    expect(cells[1].selected).toBe(true)
    expect(cells[1].checked).toBe(true)
    expect(cells[0].selected).toBe(false)
    expect(cells[2].disabled).toBe(true)
  })

  it('observer value：外部回写同步 selectedValue 并 emit change {value}', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.setData({value: 'a'})
    expect(inst.data.selectedValue).toBe('a')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'a'}}])
  })

  it('observer value：与内部选中一致时不同步（防重复 emit）', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS, value: 'a'}})
    inst.attached()
    inst.setData({value: 'a'})
    expect(inst.events).toEqual([])
  })

  it('onCellTap：落地选中、退出输入态、清空输入值、change 携带 option/index', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.methods.onInputFocus.call(inst)
    inst.methods.onInputChange.call(inst, {detail: {value: '手输'}})
    expect(inst.data.inputSelected).toBe(true)
    expect(inst.data.inputValue).toBe('手输')

    inst.methods.onCellTap.call(inst, tapEvent({index: 1}))
    expect(inst.data.selectedValue).toBe('b')
    expect(inst.data.inputSelected).toBe(false)
    expect(inst.data.inputValue).toBe('')
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {value: '手输'}}, // 输入态变化先 emit
      {name: 'change', detail: {value: 'b', option: OPTS[1], index: 1}},
    ])
  })

  it('onCellTap：disabled 项与越界 index 静默', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.methods.onCellTap.call(inst, tapEvent({index: 2}))
    inst.methods.onCellTap.call(inst, tapEvent({index: 9}))
    expect(inst.events).toEqual([])
    expect(inst.data.selectedValue).toBe('')
  })

  it('onInputFocus/onInputChange：currentValue 变化统一 emit（输入态优先）', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS, value: 'a'}})
    inst.attached()
    inst.methods.onInputFocus.call(inst)
    inst.methods.onInputChange.call(inst, {detail: {value: 'typed'}})
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'typed'}}])
    // 输入值不变：currentValue 未变不重复 emit
    inst.methods.onInputChange.call(inst, {detail: {value: 'typed'}})
    expect(inst.eventsOf('change')).toHaveLength(1)
  })

  it('select：选中落地 + inputSelected 退出 + change；同值不重复 emit', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS, value: 'a'}})
    inst.attached()
    inst.methods.onInputFocus.call(inst)
    inst.methods.select.call(inst, 'a')
    expect(inst.data.selectedValue).toBe('a')
    expect(inst.data.inputSelected).toBe(false)
    expect(inst.events).toEqual([]) // 与 __lastCurrent 一致 → 不 emit

    inst.methods.select.call(inst, 'b')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'b'}}])
    const cells = inst.data.cells as Array<{selected: boolean}>
    expect(cells[1].selected).toBe(true)
  })

  it('selectByIndex：命中选项与越界静默', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.methods.selectByIndex.call(inst, 0)
    expect(inst.data.selectedValue).toBe('a')
    inst.methods.selectByIndex.call(inst, 9)
    expect(inst.data.selectedValue).toBe('a')
  })

  it('refreshCells：isSlotScope + 无 icon → withoutIcon 分支；options 非数组防御', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.setData({isSlotScope: true, icon: ''})
    let cells = inst.data.cells as Array<{showIcon: boolean}>
    expect(cells.every((c) => !c.showIcon)).toBe(true)

    inst.setData({options: null})
    expect(inst.data.cells).toEqual([])
  })

  it('alignCenter/iconPosition observer 透传视图分支', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.setData({alignCenter: true})
    expect((inst.data.cells as Array<{showIcon: boolean}>).every((c) => !c.showIcon)).toBe(true)
    inst.setData({alignCenter: false, iconPosition: 'right'})
    expect((inst.data.cells as Array<{side: string}>).every((c) => c.side === 'right')).toBe(true)
  })
})

describeInst('radio-list 防御分支', () => {
  it('options 非数组：onCellTap / selectByIndex 静默（|| [] 兜底）', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.setData({options: null})
    expect(() => {
      inst.methods.onCellTap.call(inst, tapEvent({index: 0}))
      inst.methods.selectByIndex.call(inst, 0)
    }).not.toThrow()
    expect(inst.events).toEqual([])
  })

  it('外部回写与内部选中一致：observer 命中相等分支，不重复 emit', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS, value: 'a'}})
    inst.attached()
    inst.methods.select.call(inst, 'b') // selectedValue → 'b'
    inst.events.length = 0
    inst.setData({value: 'b'}) // observer 触发但 val === selectedValue → 不同步不 emit
    expect(inst.events).toEqual([])
    expect(inst.data.selectedValue).toBe('b')
  })

  it('onCellTap：无输入值时不清 inputValue（if false 分支）', () => {
    const inst = mountDef(compList.def, {props: {options: OPTS}})
    inst.attached()
    inst.methods.onCellTap.call(inst, tapEvent({index: 0}))
    expect(inst.data.inputValue).toBe('')
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {value: 'a', option: OPTS[0], index: 0}},
    ])
  })
})

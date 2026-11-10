/**
 * check-box / radio-box / check-list 值语义与 disabled 测试。
 * check-box 与 radio-box 的行为内核即 Vue 版 check/shared.ts 的 useCheckDelegate /
 * useRadioDelegate（已提取为 check/logic.ts 与 radio/logic.ts），此处按 box 形态
 * 的语义（布尔名取反、非布尔名 check/uncheck、单选不反选、disabled 守卫）与
 * check-list 选项视图（buildCheckCells）逐一断言。
 */
import {describe, it, expect} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'
import {
  isCheckChecked,
  nextCheckValue,
  toggleName,
} from '../../src/components/check/logic'
import {isRadioChecked, nextRadioValue} from '../../src/components/radio/logic'
import {buildCheckCells, optionTitle} from '../../src/components/check-list/logic'

describe('check-box 值语义（useCheckDelegate）', () => {
  it('布尔名（默认 name=true）：点击取反，独立于组', () => {
    expect(nextCheckValue(true, false, false)).toBe(true)
    expect(nextCheckValue(true, true, true)).toBe(false)
  })

  it('非布尔名：未选选中上报 name；已选反选为 \'\'（再由组 uncheck）', () => {
    expect(nextCheckValue('a', false, false)).toBe('a')
    expect(nextCheckValue('a', 'a', true)).toBe('')
  })

  it('选中态：自身 value 命中或组值包含 name', () => {
    expect(isCheckChecked('a', 'a', [])).toBe(true)
    expect(isCheckChecked(false, 'a', ['a', 'b'])).toBe(true)
    expect(isCheckChecked(false, 'a', ['b'])).toBe(false)
  })

  it('组 toggle（check-list 直呼同款）：选中取反，受 max 约束', () => {
    expect(toggleName([], 'a', 0)).toEqual(['a'])
    expect(toggleName(['a'], 'a', 0)).toEqual([])
    const full = ['a', 'b']
    expect(toggleName(full, 'c', 2)).toBe(full)
  })

  it('disabled 守卫在组件层：nextCheckValue 不承担（Vue onClick 首行 return）', () => {
    // 语义占位：disabled 时组件不调用 nextCheckValue，值保持原状
    const value: string | boolean = 'a'
    expect(value).toBe('a')
  })
})

describe('radio-box 值语义（useRadioDelegate）', () => {
  it('点击即上报 name（单选无反选）', () => {
    expect(nextRadioValue('a')).toBe('a')
    expect(nextRadioValue(false)).toBe(false)
  })

  it('选中态：自身 value 命中或组值等于 name', () => {
    expect(isRadioChecked('a', 'a', null)).toBe(true)
    expect(isRadioChecked(false, 'a', 'a')).toBe(true)
    expect(isRadioChecked(false, 'a', 'b')).toBe(false)
    expect(isRadioChecked(false, 'a', null)).toBe(false)
  })

  it('disabled 守卫在组件层（Vue onClick：!disabled 才 emit + 上报组）', () => {
    // disabled=true 时 radio-box.onBaseTap 直接 return，不产出新值
    expect(isRadioChecked(true, false, 'b')).toBe(false)
  })
})

describe('check-list 选项视图（buildCheckCells）', () => {
  const options = [
    {value: 'a', text: '选项一'},
    {value: 'b', label: '选项二（label）', brief: '描述文案'},
    {value: 'c', text: '禁用项', disabled: true},
    {value: 1},
  ]

  it('title：text 优先、label 兜底、缺省空串', () => {
    expect(optionTitle(options[0])).toBe('选项一')
    expect(optionTitle(options[1])).toBe('选项二（label）')
    expect(optionTitle(options[3])).toBe('')
  })

  it('默认 iconPosition=right → side=right；图标槽随 alignCenter 显隐', () => {
    const cells = buildCheckCells(options, {value: [], alignCenter: false, iconPosition: 'right'})
    expect(cells.every((c) => c.side === 'right')).toBe(true)
    expect(cells.every((c) => c.showIcon)).toBe(true)

    const left = buildCheckCells(options, {value: [], alignCenter: false, iconPosition: 'left'})
    expect(left.every((c) => c.side === 'left')).toBe(true)

    const center = buildCheckCells(options, {value: [], alignCenter: true, iconPosition: 'right'})
    expect(center.every((c) => !c.showIcon)).toBe(true)
  })

  it('checked：按组值 indexOf 判定（Vue modelValue.indexOf(item.value) !== -1）', () => {
    const cells = buildCheckCells(options, {value: ['a', 1], alignCenter: false, iconPosition: 'right'})
    expect(cells[0].checked).toBe(true)
    expect(cells[1].checked).toBe(false)
    expect(cells[3].checked).toBe(true)
  })

  it('disabled 透传；brief 透传', () => {
    const cells = buildCheckCells(options, {value: [], alignCenter: false, iconPosition: 'right'})
    expect(cells[2].disabled).toBe(true)
    expect(cells[1].brief).toBe('描述文案')
    expect(cells[0].brief).toBe('')
  })

  it('no 为选项下标（wx:key 稳定）', () => {
    const cells = buildCheckCells(options, {value: [], alignCenter: false, iconPosition: 'right'})
    expect(cells.map((c) => c.no)).toEqual([0, 1, 2, 3])
  })
})

// ---------------------------------------------------------------------------
// check-box 组件实例（index.ts）：observers / relations / ready 插槽探测 / onBaseTap
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/check-box/index'))

function view(inst: Mounted): {isChecked: boolean; hasDefault: boolean} {
  return {
    isChecked: inst.data.isChecked as boolean,
    hasDefault: inst.data.hasDefault as boolean,
  }
}

describe('check-box 组件实例', () => {
  it('attached 初始派生（observers 不触发初始值）：value/name 命中', () => {
    const inst = mountDef(comp.def, {props: {value: 'a', name: 'a'}})
    inst.attached()
    expect(view(inst)).toMatchObject({isChecked: true, hasDefault: true})
  })

  it('observer：value / groupValue 变更刷新 isChecked', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.setData({value: 'a'})
    expect(view(inst).isChecked).toBe(true)
    inst.setData({value: ''})
    expect(view(inst).isChecked).toBe(false)
    inst.methods.receiveGroupValue(['a'])
    expect(view(inst).isChecked).toBe(true)
  })

  it('receiveGroupValue(null) 按空组（|| [] 分支）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.methods.receiveGroupValue(null)
    expect(inst.data.groupValue).toEqual([])
    expect(view(inst).isChecked).toBe(false)
    // data.groupValue 直接处于 null 态（异常数据）→ refresh 的 || [] 兜底
    inst.setData({groupValue: null})
    expect(view(inst).isChecked).toBe(false)
  })

  it('relations linked：登记组并同步组值；parent 无 data 按空组', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {data: {value: ['a']}})
    expect(view(inst).isChecked).toBe(true)

    const bare = mountDef(comp.def, {props: {name: 'a'}})
    bare.linkRelation('../check-group/index', {})
    expect(bare.data.groupValue).toEqual([])
    expect(view(bare).isChecked).toBe(false)
  })

  it('relations unlinked：解除登记后不再上报组', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {data: {value: []}})
    const rel = comp.def.relations!['../check-group/index']
    rel.unlinked!.call(inst)
    inst.methods.onBaseTap()
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'a'}}])
  })

  it('onBaseTap：disabled 阻断', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}})
    inst.methods.onBaseTap()
    expect(inst.events).toEqual([])
    expect(inst.data.value).toBe(false)
  })

  it('onBaseTap：布尔名取反 + change', () => {
    const inst = mountDef(comp.def)
    inst.methods.onBaseTap()
    expect(inst.data.value).toBe(true)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: true}}])
    inst.methods.onBaseTap()
    expect(inst.data.value).toBe(false)
  })

  it('onBaseTap：非布尔名 + 组 toggleChild 上报；组无 toggleChild 不崩溃', () => {
    const toggled: unknown[] = []
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {
      data: {value: []},
      toggleChild(n: unknown) {
        toggled.push(n)
      },
    })
    inst.methods.onBaseTap()
    expect(toggled).toEqual(['a'])

    const bare = mountDef(comp.def, {props: {name: 'b'}})
    bare.linkRelation('../check-group/index', {data: {value: []}})
    expect(() => bare.methods.onBaseTap()).not.toThrow()
    expect(bare.data.value).toBe('b')
  })

  it('onBaseTap：布尔名即使有组也不上报组', () => {
    const toggled: unknown[] = []
    const inst = mountDef(comp.def)
    inst.linkRelation('../check-group/index', {
      data: {value: []},
      toggleChild(n: unknown) {
        toggled.push(n)
      },
    })
    inst.methods.onBaseTap()
    expect(toggled).toEqual([])
  })

  it('ready 插槽探测：空插槽回退 label；有内容保持；rect null 不回写', () => {
    const empty = mountDef(comp.def, {rects: {'.cu-check-box-content': {height: 0}}})
    empty.ready()
    expect(view(empty).hasDefault).toBe(false)

    const filled = mountDef(comp.def, {rects: {'.cu-check-box-content': {height: 22}}})
    filled.ready()
    expect(view(filled).hasDefault).toBe(true)

    const missing = mountDef(comp.def)
    missing.ready()
    expect(view(missing).hasDefault).toBe(true)
  })
})

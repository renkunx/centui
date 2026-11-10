/**
 * license-plate-input 逻辑层测试（对照 Vue 版 LicensePlateInput.vue）：
 * 1. items 视图构建：active/animation（空位项）/isNewEnergy（末位）
 * 2. keyMapping 事件携带 index（Vue 载荷为 index 裸值，小程序 detail 对象）
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/license-plate-input/index'))

describe('license-plate-input items 视图', () => {
  it('attached：按 keyArray 构建激活位与末位新能源标记', () => {
    const inst = mountDef(comp.def, {props: {keyArray: ['京', 'A'], selectedIndex: 1}})
    inst.attached()
    const items = inst.data.items as Array<Record<string, unknown>>
    expect(items).toEqual([
      {value: '京', active: false, animation: false, isNewEnergy: false},
      {value: 'A', active: true, animation: false, isNewEnergy: true},
    ])
  })

  it('observer：keyArray/selectedIndex 变更重建', () => {
    const inst = mountDef(comp.def, {props: {keyArray: ['京'], selectedIndex: 0}})
    inst.attached()
    inst.setData({keyArray: ['京', 'A', '1', '2', '3', '4', '5', '6'], selectedIndex: 2})
    const items = inst.data.items as Array<Record<string, unknown>>
    expect(items.length).toBe(8)
    expect(items[1].active).toBe(false)
    expect(items[2].active).toBe(true)
    expect(items[7].isNewEnergy).toBe(true)
  })

  it('空位（空串）激活项 animation=true', () => {
    const inst = mountDef(comp.def, {props: {keyArray: ['京', ''], selectedIndex: 1}})
    inst.attached()
    const items = inst.data.items as Array<Record<string, unknown>>
    expect(items[1].animation).toBe(true)
  })

  it('非数组 keyArray 容错为空列表', () => {
    const inst = mountDef(comp.def, {props: {keyArray: null}})
    inst.attached()
    expect(inst.data.items).toEqual([])
  })
})

describe('license-plate-input 事件', () => {
  it('onItemTap：keyMapping {index}（dataset 取值）', () => {
    const inst = mountDef(comp.def)
    inst.methods.onItemTap.call(inst, tapEvent({index: 3}))
    expect(inst.eventsOf('keyMapping')).toEqual([{name: 'keyMapping', detail: {index: 3}}])
  })
})

/**
 * 分支兜底：observer 侧非数组容错（Array.isArray false）与 null 项（?? 兜底），
 * attached / observer 两侧各踩一遍。
 */
describe('license-plate-input 分支兜底', () => {
  it('observer：非数组 keyArray 容错为空列表', () => {
    const inst = mountDef(comp.def, {props: {keyArray: ['京'], selectedIndex: 0}})
    inst.setData({keyArray: 'nope' as unknown as string[]})
    expect(inst.data.items).toEqual([])
  })

  it('observer：null 项 → value 兜底空串（animation 仅激活空位为 true）', () => {
    const inst = mountDef(comp.def)
    inst.setData({keyArray: [null, ''], selectedIndex: 1})
    const items = inst.data.items as Array<Record<string, unknown>>
    expect(items[0].value).toBe('')
    expect(items[0].animation).toBe(false)
    expect(items[1]).toMatchObject({value: '', active: true, animation: true})
  })

  it('attached：null 项 → value 兜底空串', () => {
    const inst = mountDef(comp.def, {props: {keyArray: ['京', null], selectedIndex: 1}})
    inst.attached()
    const items = inst.data.items as Array<Record<string, unknown>>
    expect(items[1].value).toBe('')
    expect(items[1].animation).toBe(true)
  })
})

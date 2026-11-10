/**
 * radio 逻辑层测试（对照 Vue 版 test/components/radio.spec.ts 行为清单）：
 * 1. isChecked：自身 value 命中或组值命中（useRadioDelegate）
 * 2. 图标三态：disabled → iconDisabled、checked → icon、未选 → iconInverse
 * 3. 点击：disabled 守卫；乐观 setData value=name + change；上报组 checkChild
 * 4. 组值广播 receiveGroupValue 刷新选中态
 */
import {describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/radio/index'))

describe('radio 选中态与图标', () => {
  it('attached 初始：未选 → iconInverse', () => {
    const inst = mountDef(comp.def, {props: {name: 'a', value: ''}})
    inst.attached()
    expect(inst.data.isChecked).toBe(false)
    expect(inst.data.currentIcon).toBe('check')
  })

  it('自身 value 命中 name → checked + icon', () => {
    const inst = mountDef(comp.def, {props: {name: 'a', value: 'a'}})
    inst.attached()
    expect(inst.data.isChecked).toBe(true)
    expect(inst.data.currentIcon).toBe('checked')
  })

  it('组值命中 name → checked（自身 value 未命中）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a', value: ''}})
    inst.attached()
    inst.setData({groupValue: 'a'})
    expect(inst.data.isChecked).toBe(true)
    expect(inst.data.currentIcon).toBe('checked')
  })

  it('disabled 优先：图标为 iconDisabled', () => {
    const inst = mountDef(comp.def, {props: {name: 'a', value: 'a', disabled: true}})
    inst.attached()
    expect(inst.data.isChecked).toBe(true)
    expect(inst.data.currentIcon).toBe('check-disabled')
  })

  it('自定义图标名透传', () => {
    const inst = mountDef(comp.def, {
      props: {
        name: 'a',
        value: 'a',
        icon: 'right',
        iconInverse: 'round',
        iconDisabled: 'round-fill',
      },
    })
    inst.attached()
    expect(inst.data.currentIcon).toBe('right')
    inst.setData({value: '', disabled: true})
    expect(inst.data.currentIcon).toBe('round-fill')
    inst.setData({disabled: false})
    expect(inst.data.currentIcon).toBe('round')
  })
})

describe('radio 点击', () => {
  it('点击：乐观 setData value=name、change {value}、上报组', () => {
    const checkChild = vi.fn()
    const inst = mountDef(comp.def, {props: {name: 'a', value: 'b'}})
    inst.attached()
    ;(inst as unknown as {__radioGroup: unknown}).__radioGroup = {checkChild}
    inst.methods.onTap.call(inst)
    expect(inst.data.value).toBe('a')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'a'}}])
    expect(checkChild).toHaveBeenCalledWith('a')
    expect(inst.data.isChecked).toBe(true)
  })

  it('disabled 点击：不派发不上报、值不变', () => {
    const checkChild = vi.fn()
    const inst = mountDef(comp.def, {props: {name: 'a', disabled: true}})
    inst.attached()
    ;(inst as unknown as {__radioGroup: unknown}).__radioGroup = {checkChild}
    inst.methods.onTap.call(inst)
    expect(inst.events).toEqual([])
    expect(checkChild).not.toHaveBeenCalled()
  })

  it('未入组点击：仅自身 emit（无组上报）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.eventsOf('change')).toHaveLength(1)
  })
})

describe('radio 组值广播', () => {
  it('receiveGroupValue 刷新 isChecked/currentIcon', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.methods.receiveGroupValue.call(inst, 'a')
    expect(inst.data.groupValue).toBe('a')
    expect(inst.data.isChecked).toBe(true)
    expect(inst.data.currentIcon).toBe('checked')

    inst.methods.receiveGroupValue.call(inst, 'b')
    expect(inst.data.isChecked).toBe(false)
    expect(inst.data.currentIcon).toBe('check')
  })

  it('relations linked：登记组实例并取初始组值', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.linkRelation('../radio-group/index', {data: {value: 'a'}})
    expect((inst as unknown as {__radioGroup: unknown}).__radioGroup).toBeTruthy()
    expect(inst.data.groupValue).toBe('a')
    expect(inst.data.isChecked).toBe(true)
  })
})

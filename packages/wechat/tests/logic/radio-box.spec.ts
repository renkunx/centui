/**
 * radio-box 逻辑层测试（单选开关形态，底座 cu-check-base + useRadioDelegate）：
 * 1. isChecked：value===name || 组值===name；name 缺省 true（布尔开关形态）
 * 2. 点击：单选无反选，乐观 setData + change + 上报组
 * 3. disabled 点击：完全静默
 * 4. 组值广播刷新选中态
 */
import {describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/radio-box/index'))

describe('radio-box 选中态', () => {
  it('name 缺省 true：value=false 未选、value=true 选中', () => {
    const off = mountDef(comp.def, {props: {value: false}})
    off.attached()
    expect(off.data.isChecked).toBe(false)

    const on = mountDef(comp.def, {props: {value: true}})
    on.attached()
    expect(on.data.isChecked).toBe(true)
  })

  it('字符串 name：组值命中即选中', () => {
    const inst = mountDef(comp.def, {props: {name: 'male', value: false}})
    inst.attached()
    inst.setData({groupValue: 'male'})
    expect(inst.data.isChecked).toBe(true)
  })

  it('组值不匹配：未选', () => {
    const inst = mountDef(comp.def, {props: {name: 'a', value: false}})
    inst.attached()
    inst.setData({groupValue: 'b'})
    expect(inst.data.isChecked).toBe(false)
  })
})

describe('radio-box 点击', () => {
  it('点击：value=name、change {value}、上报组 checkChild（单选无反选）', () => {
    const checkChild = vi.fn()
    const inst = mountDef(comp.def, {props: {name: 'a', value: false}})
    inst.attached()
    ;(inst as unknown as {__radioGroup: unknown}).__radioGroup = {checkChild}
    inst.methods.onBaseTap.call(inst)
    expect(inst.data.value).toBe('a')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'a'}}])
    expect(checkChild).toHaveBeenCalledWith('a')
    expect(inst.data.isChecked).toBe(true)
  })

  it('已选中再点击：仍是上报 name（不反选）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a', value: 'a'}})
    inst.attached()
    inst.methods.onBaseTap.call(inst)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'a'}}])
  })

  it('disabled 点击：完全静默', () => {
    const checkChild = vi.fn()
    const inst = mountDef(comp.def, {props: {name: 'a', disabled: true}})
    inst.attached()
    ;(inst as unknown as {__radioGroup: unknown}).__radioGroup = {checkChild}
    inst.methods.onBaseTap.call(inst)
    expect(inst.events).toEqual([])
    expect(checkChild).not.toHaveBeenCalled()
  })
})

describe('radio-box 组协同', () => {
  it('receiveGroupValue 广播刷新选中态', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.methods.receiveGroupValue.call(inst, 'a')
    expect(inst.data.isChecked).toBe(true)
  })

  it('relations linked：取组初始值', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.linkRelation('../radio-group/index', {data: {value: 'a'}})
    expect(inst.data.isChecked).toBe(true)
  })
})

describe('radio-box 分支补齐', () => {
  it('ready 插槽探测：rect null / 有高度 / 零高度 三路', () => {
    const bare = mountDef(comp.def, {props: {name: 'a', label: 'L'}})
    bare.ready()
    expect(bare.data.hasDefault).toBe(true)

    const tall = mountDef(comp.def, {props: {name: 'a'}, rects: {'.cu-radio-box-content': {height: 12}}})
    tall.ready()
    expect(tall.data.hasDefault).toBe(true)

    const empty = mountDef(comp.def, {props: {name: 'a', label: 'L'}, rects: {'.cu-radio-box-content': {height: 0}}})
    empty.ready()
    expect(empty.data.hasDefault).toBe(false)
  })

  it('relations linked：parent 无 data / 组值 undefined（?? 防御两路）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    const rel = comp.def.relations!['../radio-group/index']
    rel.linked.call(inst, {} as never)
    expect(inst.data.groupValue).toBe(null)

    inst.linkRelation('../radio-group/index', {data: {}})
    expect(inst.data.groupValue).toBe(null)
  })

  it('relations unlinked：解除后点击不上报组', () => {
    const checkChild = vi.fn()
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.linkRelation('../radio-group/index', {data: {value: ''}, checkChild})
    const rel = comp.def.relations!['../radio-group/index']
    rel.unlinked!.call(inst, {} as never)
    inst.methods.onBaseTap.call(inst)
    expect(checkChild).not.toHaveBeenCalled()
  })

  it('receiveGroupValue：undefined 归一 null', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.methods.receiveGroupValue.call(inst, undefined)
    expect(inst.data.groupValue).toBe(null)
  })
})

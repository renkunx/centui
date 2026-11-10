/**
 * button 逻辑层测试（对照 Vue 版 test/components/button.spec.ts 行为清单）：
 * 1. type/inactive → disabled 派生（observer + attached 初始）
 * 2. 点击派发 click
 * 3. disabled 时点击不派发
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/button/index'))

describe('button disabled 派生', () => {
  it('attached：初始 type=disabled 派生 disabled=true（observer 不触发初始值）', () => {
    const inst = mountDef(comp.def, {props: {type: 'disabled'}})
    inst.attached()
    expect(inst.data.disabled).toBe(true)
  })

  it('attached：初始 inactive=true 派生 disabled=true', () => {
    const inst = mountDef(comp.def, {props: {inactive: true}})
    inst.attached()
    expect(inst.data.disabled).toBe(true)
  })

  it('attached：常规 type 不禁用', () => {
    const inst = mountDef(comp.def, {props: {type: 'primary'}})
    inst.attached()
    expect(inst.data.disabled).toBe(false)
  })

  it('observer：运行中切换 inactive/type 重新派生', () => {
    const inst = mountDef(comp.def, {props: {type: 'primary'}})
    inst.attached()
    inst.setData({inactive: true})
    expect(inst.data.disabled).toBe(true)
    inst.setData({inactive: false, type: 'disabled'})
    expect(inst.data.disabled).toBe(true)
    inst.setData({type: 'default'})
    expect(inst.data.disabled).toBe(false)
  })
})

describe('button 点击', () => {
  it('点击派发 click（与 Vue emit("click") 同名）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.eventsOf('click')).toHaveLength(1)
  })

  it('disabled 时点击不派发', () => {
    const inst = mountDef(comp.def, {props: {type: 'disabled'}})
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.events).toEqual([])
  })

  it('运行中置 disabled 后点击不派发', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({inactive: true})
    inst.methods.onTap.call(inst)
    expect(inst.events).toEqual([])
  })
})

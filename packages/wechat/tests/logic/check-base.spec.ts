/**
 * check-base 逻辑层测试（check-box/radio-box 的视觉底座）：
 * 1. 根节点 tap → triggerEvent('tap')（对齐 Vue attrs fallthrough click）
 * 2. 属性缺省：label ''、disabled false、isChecked false、iconPosition rt、role checkbox
 * （勾选值语义在 check-box/radio-box spec 覆盖；本组件无状态逻辑）
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/check-base/index'))

describe('check-base 属性缺省', () => {
  it('与 Vue CheckBoxBase props 缺省一致', () => {
    const inst = mountDef(comp.def)
    expect(inst.data.label).toBe('')
    expect(inst.data.disabled).toBe(false)
    expect(inst.data.isChecked).toBe(false)
    expect(inst.data.iconPosition).toBe('rt')
    expect(inst.data.role).toBe('checkbox')
  })
})

describe('check-base 事件', () => {
  it('onRootTap：triggerEvent("tap")（checkbox 形态）', () => {
    const inst = mountDef(comp.def)
    inst.methods.onRootTap.call(inst)
    expect(inst.eventsOf('tap')).toHaveLength(1)
  })

  it('radio 形态同样上抛 tap（由 radio-box 监听）', () => {
    const inst = mountDef(comp.def, {props: {role: 'radio'}})
    inst.methods.onRootTap.call(inst)
    expect(inst.eventsOf('tap')).toHaveLength(1)
  })
})

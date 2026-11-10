/**
 * switch 逻辑层测试（对照 Vue 版 test/components/switch.spec.ts 行为清单）：
 * 1. modelValue→current 映射（attached 初始 + observer 回写）
 * 2. 点击派发 change {value: 取反}，视觉态同步
 * 3. disabled 时点击不派发任何事件、视觉不变
 * 4. 受控回写（外部改 value）覆盖 current
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/switch/index'))

describe('switch 初始映射', () => {
  it('attached：value 初始值写入 current', () => {
    const inst = mountDef(comp.def, {props: {value: true}})
    inst.attached()
    expect(inst.data.current).toBe(true)
  })

  it('properties 初始值不触发 observer（真机语义）——attached 承担初始派生', () => {
    const inst = mountDef(comp.def, {props: {value: true}})
    // attached 前 current 尚未派生
    expect(inst.data.current).toBe(false)
  })
})

describe('switch 点击', () => {
  it('点击派发 change {value: next} 并乐观翻转 current', () => {
    const inst = mountDef(comp.def, {props: {value: false}})
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.data.current).toBe(true)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: true}}])
  })

  it('连续点击在 true/false 间取反', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({current: true})
    inst.methods.onTap.call(inst)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: false})
  })

  it('disabled 时点击：不派发、不翻转', () => {
    const inst = mountDef(comp.def, {props: {value: true, disabled: true}})
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.events).toEqual([])
    expect(inst.data.current).toBe(true)
  })
})

describe('switch 受控回写', () => {
  it('外部更新 value 属性经 observer 覆盖 current', () => {
    const inst = mountDef(comp.def, {props: {value: false}})
    inst.attached()
    // 乐观翻转后受控方未回写（非受控兜底：current 即视觉真源）
    inst.methods.onTap.call(inst)
    expect(inst.data.current).toBe(true)
    // 受控方接受：回写 true（属性 false→true，observer 触发）
    inst.setData({value: true})
    expect(inst.data.current).toBe(true)
    // 受控方改判：回写 false → current 被覆盖
    inst.setData({value: false})
    expect(inst.data.current).toBe(false)
  })
})

import {describe, it, expect} from 'vitest'
import {nextChecked, iconNames, iconColors} from '../../src/components/agree/logic'

describe('agree/logic', () => {
  it('disabled 时返回 null（不切换、不 emit），否则取反', () => {
    expect(nextChecked({value: false, disabled: true})).toBeNull()
    expect(nextChecked({value: true, disabled: true})).toBeNull()
    expect(nextChecked({value: false, disabled: false})).toBe(true)
    expect(nextChecked({value: true, disabled: false})).toBe(false)
  })

  it('iconType 分发图标名：circle → checked/check，square → square-checked/square-check', () => {
    expect(iconNames('circle')).toEqual({checked: 'checked', unchecked: 'check'})
    expect(iconNames('square')).toEqual({checked: 'square-checked', unchecked: 'square-check'})
    // 未知值回退 circle（Vue v-else 分支）
    expect(iconNames('')).toEqual({checked: 'checked', unchecked: 'check'})
  })

  it('着色：勾选态 checked 图标为 agree-fill，未勾选透明；check 图标恒为 agree-fill', () => {
    expect(iconColors(true, 'var(--agree-fill)')).toEqual({
      checked: 'var(--agree-fill)',
      unchecked: 'var(--agree-fill)',
    })
    expect(iconColors(false, 'var(--agree-fill)')).toEqual({
      checked: 'transparent',
      unchecked: 'var(--agree-fill)',
    })
  })
})

/**
 * 组件层（index.ts）：value/iconType/innerValue observers、attached 首帧派生、
 * onChange 受控协议（乐观更新 + change 事件）。
 */
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/agree/index'))

describe('agree 组件', () => {
  it('attached：初始 value 派生 innerValue 与着色（innerValue observer 级联）', () => {
    const inst = mountDef(comp.def, {props: {value: true, iconType: 'square'}})
    inst.attached()
    expect(inst.data.innerValue).toBe(true)
    // 图标名/着色均写入 wxml 绑定的键（checkedName/uncheckedName/checkedColor/uncheckedColor）
    expect(inst.data.checkedName).toBe('square-checked')
    expect(inst.data.uncheckedName).toBe('square-check')
    expect(inst.data.checkedColor).toBe('var(--agree-fill)')
    expect(inst.data.uncheckedColor).toBe('var(--agree-fill)')

    // 未勾选：checked 图标透明
    const off = mountDef(comp.def)
    off.attached()
    expect(off.data.innerValue).toBe(false)
    expect(off.data.checkedName).toBe('checked')
    expect(off.data.checkedColor).toBe('transparent')
  })

  it('value observer：外部回写同步 innerValue', () => {
    const inst = mountDef(comp.def)
    inst.setData({value: true})
    expect(inst.data.innerValue).toBe(true)
    inst.setData({value: false})
    expect(inst.data.innerValue).toBe(false)
  })

  it('iconType observer：写入 checkedName/uncheckedName（wxml 绑定键）', () => {
    const inst = mountDef(comp.def)
    inst.setData({iconType: 'square'})
    expect(inst.data.checkedName).toBe('square-checked')
    expect(inst.data.uncheckedName).toBe('square-check')
    inst.setData({iconType: 'circle'})
    expect(inst.data.checkedName).toBe('checked')
    expect(inst.data.uncheckedName).toBe('check')
  })

  it("'innerValue, disabled' observer：着色随勾选态变化", () => {
    const inst = mountDef(comp.def)
    inst.setData({innerValue: true})
    expect(inst.data.checkedColor).toBe('var(--agree-fill)')
    inst.setData({innerValue: false})
    expect(inst.data.checkedColor).toBe('transparent')
    // disabled 变更同样驱动着色重算
    inst.setData({disabled: true})
    expect(inst.data.uncheckedColor).toBe('var(--agree-fill)')
  })

  it('onChange：非受控乐观翻转 + change 事件 {value}；受控回写后以最终值为准', () => {
    const inst = mountDef(comp.def)
    inst.methods.onChange.call(inst)
    expect(inst.data.innerValue).toBe(true)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: true})

    // 受控方回写 value=true → value observer 同步 innerValue；再点击翻回 false
    inst.setData({value: true})
    expect(inst.data.innerValue).toBe(true)
    inst.methods.onChange.call(inst)
    expect(inst.data.innerValue).toBe(false)
    expect(inst.eventsOf('change')[1].detail).toEqual({value: false})
  })

  it('onChange：disabled 直接返回（不翻转、不 emit）', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}})
    inst.attached()
    inst.methods.onChange.call(inst)
    expect(inst.data.innerValue).toBe(false)
    expect(inst.events).toEqual([])
  })
})

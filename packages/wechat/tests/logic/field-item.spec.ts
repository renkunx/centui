/**
 * field-item 逻辑层测试（对照 Vue 版 FieldItem.vue）：
 * 1. arrow 联合类型映射：true → arrow 图标、字符串 → 图标名、falsy → 空
 * 2. rootField disabled 注入：relations linked + receiveFieldDisabled 广播
 * 3. 点击守卫：fieldDisabled || disabled 不触发 click
 * 4. 平台环境类：wx.getDeviceInfo().platform → is-ios/is-android/is-browser
 * 5. ready 插槽探测：空 left/right/children 包裹隐藏；addon/arrow 保持 right
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/field-item/index'))

describe('field-item arrow 映射', () => {
  it('attached：arrow=true → arrow 图标（初始派生）', () => {
    const inst = mountDef(comp.def, {props: {arrow: true}})
    inst.attached()
    expect(inst.data.arrowName).toBe('arrow')
    expect(inst.data.showRight).toBe(true)
  })

  it('attached：字符串 arrow 透传为图标名', () => {
    const inst = mountDef(comp.def, {props: {arrow: 'arrow-right'}})
    inst.attached()
    expect(inst.data.arrowName).toBe('arrow-right')
  })

  it('attached：falsy arrow → 空图标名', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.arrowName).toBe('')
  })

  it('observer：运行中变更重新映射', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({arrow: 'warn'})
    expect(inst.data.arrowName).toBe('warn')
    expect(inst.data.showRight).toBe(true)
  })

  it('addon 变更保持 right 槽显示', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({addon: '详情'})
    expect(inst.data.showRight).toBe(true)
  })
})

describe('field-item rootField 注入', () => {
  it('linked：从父 field 数据取初始 disabled', () => {
    const inst = mountDef(comp.def)
    inst.linkRelation('../field/index', {data: {disabled: true}})
    expect(inst.data.fieldDisabled).toBe(true)
  })

  it('receiveFieldDisabled 广播覆盖', () => {
    const inst = mountDef(comp.def)
    inst.methods.receiveFieldDisabled.call(inst, true)
    expect(inst.data.fieldDisabled).toBe(true)
    inst.methods.receiveFieldDisabled.call(inst, false)
    expect(inst.data.fieldDisabled).toBe(false)
  })
})

describe('field-item 点击守卫', () => {
  it('正常点击触发 click', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.eventsOf('click')).toHaveLength(1)
  })

  it('自身 disabled：不触发', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}})
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.events).toEqual([])
  })

  it('rootField disabled：不触发（Vue currentDisabled 守卫）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({fieldDisabled: true})
    inst.methods.onTap.call(inst)
    expect(inst.events).toEqual([])
  })
})

describe('field-item 平台环境类', () => {
  it('platform=ios → is-ios', () => {
    const inst = mountDef(comp.def, {platform: 'ios'})
    inst.attached()
    expect(inst.data.inputEnv).toBe('is-ios')
  })

  it('platform=android → is-android', () => {
    const inst = mountDef(comp.def, {platform: 'android'})
    inst.attached()
    expect(inst.data.inputEnv).toBe('is-android')
  })

  it('platform=devtools/windows 归入 is-browser', () => {
    const devtools = mountDef(comp.def, {platform: 'devtools'})
    devtools.attached()
    expect(devtools.data.inputEnv).toBe('is-browser')

    const windows = mountDef(comp.def, {platform: 'windows'})
    windows.attached()
    expect(windows.data.inputEnv).toBe('is-browser')
  })
})

describe('field-item ready 插槽探测', () => {
  it('空 left/children 隐藏；right 未填充且无 addon/arrow 时隐藏', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-field-item-left': {height: 0},
        '.cu-field-item-control': {height: 0},
        '.cu-field-item-right': {height: 0},
        '.cu-field-item-children': {height: 0},
      },
    })
    inst.attached()
    inst.ready()
    expect(inst.data.showLeft).toBe(false)
    expect(inst.data.showChildren).toBe(false)
    expect(inst.data.rightFilled).toBe(false)
    expect(inst.data.showRight).toBe(false)
  })

  it('right 已填充或 addon/arrow 存在时保持显示', () => {
    const filled = mountDef(comp.def, {
      rects: {'.cu-field-item-right': {height: 40}},
    })
    filled.ready()
    expect(filled.data.rightFilled).toBe(true)
    expect(filled.data.showRight).toBe(true)

    const withAddon = mountDef(comp.def, {
      props: {addon: 'x'},
      rects: {'.cu-field-item-right': {height: 0}},
    })
    withAddon.ready()
    expect(withAddon.data.showRight).toBe(true)
  })

  it('hasDefault 按 control 高度判定（默认插槽回退 content/placeholder）', () => {
    const empty = mountDef(comp.def, {
      rects: {'.cu-field-item-control': {height: 0}},
    })
    empty.ready()
    expect(empty.data.hasDefault).toBe(false)

    const filled = mountDef(comp.def, {
      rects: {'.cu-field-item-control': {height: 40}},
    })
    filled.ready()
    expect(filled.data.hasDefault).toBe(true)
  })
})

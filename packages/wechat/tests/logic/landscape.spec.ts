import {describe, it, expect} from 'vitest'
import {resolveTransition, hasMask, closeIcon, closeColor} from '../../src/components/landscape/logic'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/landscape/index'))

describe('landscape/logic', () => {
  it('默认过渡：全屏 cu-fade，非全屏 cu-punch（v2 契约）', () => {
    expect(resolveTransition('', false)).toBe('punch')
    expect(resolveTransition('', true)).toBe('fade')
  })

  it('显式 transition 优先；兼容剥除 Vue 风格 cu- 前缀', () => {
    expect(resolveTransition('zoom', true)).toBe('zoom')
    expect(resolveTransition('cu-fade', false)).toBe('fade')
  })

  it('hasMask = !fullScreen && hasMask', () => {
    expect(hasMask(false, true)).toBe(true)
    expect(hasMask(false, false)).toBe(false)
    expect(hasMask(true, true)).toBe(false)
  })

  it('关闭图标：全屏 clear，否则 close', () => {
    expect(closeIcon(true)).toBe('clear')
    expect(closeIcon(false)).toBe('close')
  })

  it('关闭图标着色：无遮罩或全屏为深色（.dark 语义），否则白色（token 承载）', () => {
    expect(closeColor(true, true)).toBe('var(--color-text-base)')
    expect(closeColor(false, false)).toBe('var(--color-text-base)')
    expect(closeColor(false, true)).toBe('var(--color-text-base-inverse)')
  })
})

/**
 * 组件层（index.ts）：observers 派生（show / transition+fullScreen / fullScreen+hasMask）、
 * attached 初始派生、popup 关闭回流（optimisticUpdate → change+input）、show/hide 转发。
 */
describe('landscape 组件', () => {
  it('attached：全屏 → fade 过渡 + clear 深色图标', () => {
    const inst = mountDef(comp.def, {props: {show: true, fullScreen: true, transition: 'cu-fade'}})
    inst.attached()
    expect(inst.data.innerShow).toBe(true)
    expect(inst.data.actualTransition).toBe('fade')
    expect(inst.data.closeIconName).toBe('clear')
    expect(inst.data.closeColorStyle).toBe('var(--color-text-base)')
  })

  it('attached：非全屏默认 → punch 过渡 + close 反白图标', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.innerShow).toBe(false)
    expect(inst.data.actualTransition).toBe('punch')
    expect(inst.data.closeIconName).toBe('close')
    expect(inst.data.closeColorStyle).toBe('var(--color-text-base-inverse)')
  })

  it('observers：show → innerShow；fullScreen/hasMask → 图标与着色联动', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    expect(inst.data.innerShow).toBe(true)
    inst.setData({show: false})
    expect(inst.data.innerShow).toBe(false)
    inst.setData({fullScreen: true})
    expect(inst.data.closeIconName).toBe('clear')
    inst.setData({fullScreen: false, hasMask: false})
    expect(inst.data.closeIconName).toBe('close')
    expect(inst.data.closeColorStyle).toBe('var(--color-text-base)')
  })

  it('observers：transition 显式值覆盖默认（含 cu- 前缀剥除 + 全屏回退）', () => {
    const inst = mountDef(comp.def)
    inst.setData({transition: 'zoom'})
    expect(inst.data.actualTransition).toBe('zoom')
    inst.setData({transition: 'cu-slide', fullScreen: true})
    expect(inst.data.actualTransition).toBe('slide')
    inst.setData({transition: ''})
    expect(inst.data.actualTransition).toBe('fade')
  })

  it('onPopupChange：value=true 早退；value=false 乐观收起并回传 change+input', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    expect(inst.data.innerShow).toBe(true)
    inst.methods.onPopupChange.call(inst, {detail: {value: true}})
    expect(inst.events).toEqual([])
    inst.methods.onPopupChange.call(inst, {detail: {value: false}})
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: false})
    expect(inst.eventsOf('input')[0].detail).toEqual({value: false})
  })

  it('onPopupShow/onPopupHide：转发 popup 状态机事件', () => {
    const inst = mountDef(comp.def)
    inst.methods.onPopupShow.call(inst)
    inst.methods.onPopupHide.call(inst)
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)
  })

  it('onClose：仅收起 innerShow（change 由 popup 关闭回调统一外发，避免双发）', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    inst.methods.onClose.call(inst)
    expect(inst.data.innerShow).toBe(false)
    expect(inst.events).toEqual([])
  })
})

import {describe, it, expect} from 'vitest'
import {coerceActions, toButtonVMs} from '../../src/components/action-bar/logic'
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/action-bar/index'))

describe('action-bar/logic', () => {
  it('v2 契约：actions 最多展示两个', () => {
    expect(coerceActions([{text: 'a'}, {text: 'b'}, {text: 'c'}])).toHaveLength(2)
    expect(toButtonVMs([{text: 'a'}, {text: 'b'}, {text: 'c'}])).toHaveLength(2)
  })

  it('type：显式 type 优先，disabled → disabled，其余 → primary', () => {
    const vms = toButtonVMs([{text: 'a', type: 'warning'}, {text: 'b', disabled: true}])
    expect(vms[0].type).toBe('warning')
    expect(vms[1].type).toBe('disabled')
    expect(toButtonVMs([{text: 'c'}])[0].type).toBe('primary')
  })

  it('plain：显式 plain 仅对末项生效；非末项恒为 plain（对齐 index !== last）', () => {
    const vms = toButtonVMs([{text: 'a'}, {text: 'b'}])
    expect(vms[0].plain).toBe(true)
    expect(vms[1].plain).toBe(false)
    // 末项显式 plain=true 保持；非末项显式 plain=false 仍为 true（Vue 表达式原语义）
    const forced = toButtonVMs([{text: 'a', plain: false}, {text: 'b', plain: true}])
    expect(forced[0].plain).toBe(true)
    expect(forced[1].plain).toBe(true)
  })

  it('布尔/图标字段收敛为纯数据视图模型（空值兜底）', () => {
    const vms = toButtonVMs([
      {text: 'a', round: true, inactive: true, loading: true, icon: 'right', iconSvg: true},
      {text: 'b'},
    ])
    expect(vms[0]).toEqual({
      text: 'a',
      type: 'primary',
      plain: true,
      round: true,
      inactive: true,
      loading: true,
      icon: 'right',
      iconSvg: true,
    })
    expect(vms[1].icon).toBe('')
    expect(vms[1].loading).toBe(false)
  })

  it('空 actions 产出空按钮组', () => {
    expect(toButtonVMs([])).toEqual([])
  })
})

/**
 * 组件层（index.ts）：actions observer → buttons 派生、ready 插槽探针、
 * onBtnClick 载荷 {action, index}。
 */
describe('action-bar 组件', () => {
  it('actions observer 派生按钮视图模型（v2 契约最多两个）', () => {
    const inst = mountDef(comp.def)
    inst.setData({
      actions: [{text: '确认', type: 'warning'}, {text: '取消', disabled: true}, {text: 'c'}],
    })
    expect(inst.data.buttons).toHaveLength(2)
    expect(inst.data.buttons[0]).toMatchObject({text: '确认', type: 'warning'})
    expect(inst.data.buttons[1]).toMatchObject({text: '取消', type: 'disabled', plain: false})
  })

  it('actions 非数组回退空数组（Array.isArray 守卫）', () => {
    const inst = mountDef(comp.def)
    inst.setData({actions: null})
    expect(inst.data.buttons).toEqual([])
  })

  it('ready 插槽探针：兜底节点存在（默认插槽为空）→ hasText=false', () => {
    const inst = mountDef(comp.def, {rects: {'#cu-ab-text-probe': {height: 0}}})
    inst.ready()
    expect(inst.data.hasText).toBe(false)
  })

  it('ready 插槽探针：兜底节点不存在（插槽有内容）→ hasText 保持 true', () => {
    const inst = mountDef(comp.def)
    inst.ready()
    expect(inst.data.hasText).toBe(true)
  })

  it('onBtnClick：click 载荷 {action, index}，dataset.index 字符串归一化', () => {
    const inst = mountDef(comp.def, {props: {actions: [{text: '确认'}, {text: '取消'}]}})
    inst.methods.onBtnClick.call(inst, tapEvent({index: '1'}))
    expect(inst.eventsOf('click')).toHaveLength(1)
    expect(inst.eventsOf('click')[0].detail).toEqual({action: {text: '取消'}, index: 1})
  })

  it('onBtnClick：越界 index → action undefined；actions 非数组 → 空表兜底', () => {
    const inst = mountDef(comp.def)
    inst.methods.onBtnClick.call(inst, tapEvent({index: 5}))
    expect(inst.eventsOf('click')[0].detail).toEqual({action: undefined, index: 5})

    inst.setData({actions: 'x'})
    inst.methods.onBtnClick.call(inst, tapEvent({index: 0}))
    expect(inst.eventsOf('click')[1].detail).toEqual({action: undefined, index: 0})
  })
})

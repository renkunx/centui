import {describe, it, expect} from 'vitest'
import {coerceActions, toButtonVMs} from '../../src/components/action-bar/logic'

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

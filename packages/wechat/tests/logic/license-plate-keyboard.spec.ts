/**
 * license-plate-keyboard 逻辑层测试（对照 Vue 版 LicensePlateKeyboard.vue）：
 * 1. 省份简写键 → enter {value}
 * 2. 功能键：delete / confirm
 * 3. 字母数字键：disabled 阻断（Vue !item.disabled && emit）
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/license-plate-keyboard/index'))

describe('license-plate-keyboard 事件', () => {
  it('onShortcutTap：enter {value}', () => {
    const inst = mountDef(comp.def)
    inst.methods.onShortcutTap.call(inst, tapEvent({value: '京'}))
    expect(inst.eventsOf('enter')).toEqual([{name: 'enter', detail: {value: '京'}}])
  })

  it('onFnTap：delete / confirm 分流', () => {
    const inst = mountDef(comp.def)
    inst.methods.onFnTap.call(inst, tapEvent({type: 'delete'}))
    expect(inst.eventsOf('delete')).toHaveLength(1)

    inst.methods.onFnTap.call(inst, tapEvent({type: 'confirm'}))
    expect(inst.eventsOf('confirm')).toHaveLength(1)
  })

  it('onValueTap：普通键 enter {value}', () => {
    const inst = mountDef(comp.def, {
      props: {keyboard: {mixedKeyboard: [{value: 'A'}, {value: 'B'}]}},
    })
    inst.methods.onValueTap.call(inst, tapEvent({index: 1}))
    expect(inst.eventsOf('enter')).toEqual([{name: 'enter', detail: {value: 'B'}}])
  })

  it('onValueTap：disabled 键阻断', () => {
    const inst = mountDef(comp.def, {
      props: {keyboard: {mixedKeyboard: [{value: 'A', disabled: true}]}},
    })
    inst.methods.onValueTap.call(inst, tapEvent({index: 0}))
    expect(inst.events).toEqual([])
  })

  it('onValueTap：越界/缺键盘数据静默', () => {
    const inst = mountDef(comp.def)
    expect(() => inst.methods.onValueTap.call(inst, tapEvent({index: 9}))).not.toThrow()
    expect(inst.events).toEqual([])
  })
})

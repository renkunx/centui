/**
 * check-list 逻辑层测试（对照 Vue 版 CheckList.vue）：
 * 1. cells 视图构建（buildCheckCells：text/label/brief/disabled/iconPosition/alignCenter）
 * 2. observer：options/value/alignCenter/iconPosition 变更重建视图
 * 3. onOptionTap：disabled 阻断；有组实例走 group.toggle；无组乐观回退
 * 4. onGroupChange：内嵌组 change 原样上抛；receiveCheckGroup 登记
 */
import {describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/check-list/index'))

const OPTIONS = [
  {value: 'a', text: '选项一'},
  {value: 'b', label: '选项二', brief: '描述'},
  {value: 'c', text: '禁用项', disabled: true},
]

function mountList(props: Record<string, unknown> = {}) {
  const inst = mountDef(comp.def, {props})
  inst.attached()
  return inst
}

describe('check-list cells 视图', () => {
  it('attached 初始构建', () => {
    const inst = mountList({options: OPTIONS, value: ['a']})
    const cells = inst.data.cells as Array<{no: number; title: string; checked: boolean}>
    expect(cells.map((c) => c.title)).toEqual(['选项一', '选项二', '禁用项'])
    expect(cells.map((c) => c.checked)).toEqual([true, false, false])
  })

  it('observer：value 变更重建', () => {
    const inst = mountList({options: OPTIONS, value: []})
    inst.setData({value: ['b']})
    const cells = inst.data.cells as Array<{checked: boolean}>
    expect(cells.map((c) => c.checked)).toEqual([false, true, false])
  })

  it('iconPosition=left → 图标在左；alignCenter → 不渲染图标', () => {
    const left = mountList({options: OPTIONS, iconPosition: 'left'})
    expect((left.data.cells as Array<{side: string}>).every((c) => c.side === 'left')).toBe(true)

    const center = mountList({options: OPTIONS, alignCenter: true})
    expect((center.data.cells as Array<{showIcon: boolean}>).every((c) => !c.showIcon)).toBe(true)
  })
})

describe('check-list 点击', () => {
  it('有组实例：走 group.toggle（Vue ref="group" 直呼等价）', () => {
    const toggle = vi.fn()
    const inst = mountList({options: OPTIONS})
    ;(inst as unknown as {__checkListGroup: unknown}).__checkListGroup = {toggle}
    inst.methods.onOptionTap.call(inst, tapEvent({index: 1}))
    expect(toggle).toHaveBeenCalledWith('b')
  })

  it('disabled 选项：阻断（不上报组、不 emit）', () => {
    const toggle = vi.fn()
    const inst = mountList({options: OPTIONS})
    ;(inst as unknown as {__checkListGroup: unknown}).__checkListGroup = {toggle}
    inst.methods.onOptionTap.call(inst, tapEvent({index: 2}))
    expect(toggle).not.toHaveBeenCalled()
    expect(inst.events).toEqual([])
  })

  it('无组实例：乐观回退 + change（受控方回写后 observer 重建 cells）', () => {
    const inst = mountList({options: OPTIONS, value: []})
    inst.methods.onOptionTap.call(inst, tapEvent({index: 0}))
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: ['a']}}])
    expect((inst.data.cells as Array<{checked: boolean}>)[0].checked).toBe(true)
  })

  it('越界 index：静默', () => {
    const inst = mountList({options: OPTIONS})
    expect(() => inst.methods.onOptionTap.call(inst, tapEvent({index: 9}))).not.toThrow()
    expect(inst.events).toEqual([])
  })
})

describe('check-list 组协同', () => {
  it('receiveCheckGroup 登记组实例', () => {
    const inst = mountList()
    const group = {toggle: vi.fn()}
    inst.methods.receiveCheckGroup.call(inst, group)
    expect((inst as unknown as {__checkListGroup: unknown}).__checkListGroup).toBe(group)
  })

  it('onGroupChange：内嵌组 change 原样上抛', () => {
    const inst = mountList()
    inst.methods.onGroupChange.call(inst, {detail: {value: ['a', 1]}})
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: ['a', 1]}}])
  })
})

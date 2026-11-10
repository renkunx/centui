/**
 * check-group 逻辑层测试（对照 Vue 版 CheckGroup.vue rootGroup 语义）：
 * 1. check/uncheck/toggle：check/logic 纯函数裁决 + 乐观 commit + change
 * 2. max 约束与「无变化不 emit」（返回原数组引用语义）
 * 3. toggleAll：实时读取子项 name/disabled（登记表持有实例）
 * 4. relations：linked 登记并推送组值；observer 变更广播；unlinked 解除
 * 5. check-list 回交通道（ancestor → receiveCheckGroup）
 */
import {describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/check-group/index'))

function fakeChild(name: unknown, disabled = false) {
  const received: unknown[] = []
  return {
    data: {name, disabled},
    received,
    receiveGroupValue(val: unknown) {
      received.push(val)
    },
  }
}

function mountGroup(props: Record<string, unknown> = {}) {
  const inst = mountDef(comp.def, {props})
  inst.attached()
  return inst
}

describe('check-group check / uncheck / toggle', () => {
  it('check：追加并 change；已达 max 不追加且不 emit', () => {
    const inst = mountGroup({value: ['a']})
    inst.methods.check.call(inst, 'b')
    expect(inst.data.value).toEqual(['a', 'b'])
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: ['a', 'b']}}])

    const full = mountGroup({value: ['a', 'b'], max: 2})
    full.methods.check.call(full, 'c')
    expect(full.events).toEqual([])
  })

  it('uncheck：移除并 change；未选中不 emit', () => {
    const inst = mountGroup({value: ['a', 'b']})
    inst.methods.uncheck.call(inst, 'a')
    expect(inst.data.value).toEqual(['b'])
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: ['b']}}])

    inst.methods.uncheck.call(inst, 'zz')
    expect(inst.eventsOf('change')).toHaveLength(1)
  })

  it('toggle：按当前态取反', () => {
    const inst = mountGroup({value: ['a']})
    inst.methods.toggle.call(inst, 'a')
    expect(inst.data.value).toEqual([])
    inst.methods.toggle.call(inst, 'a')
    expect(inst.data.value).toEqual(['a'])
  })

  it('toggleChild：子组件点击上报入口（等价 toggle）', () => {
    const inst = mountGroup({value: []})
    inst.methods.toggleChild.call(inst, 'x')
    expect(inst.data.value).toEqual(['x'])
  })

  it('受控回写：observer 变更后以最终值为准并广播', () => {
    const inst = mountGroup({value: []})
    const child = fakeChild('a')
    inst.linkRelation('../check/index', child)
    inst.methods.check.call(inst, 'a')
    // 受控方回写不同的最终值
    inst.setData({value: ['b']})
    expect(child.received).toEqual([[], ['a'], ['b']])
  })
})

describe('check-group toggleAll', () => {
  it('全选：disabled 项不参与，实时读取子项 name', () => {
    const inst = mountGroup({value: []})
    inst.linkRelation('../check/index', fakeChild('a'))
    inst.linkRelation('../check/index', fakeChild('b', true))
    inst.linkRelation('../check/index', fakeChild(1))
    inst.methods.toggleAll.call(inst, true)
    expect(inst.data.value).toEqual(['a', '1'])
    expect(inst.eventsOf('change')).toHaveLength(1)
  })

  it('缺省取反：disabled 已选项保持', () => {
    const inst = mountGroup({value: ['b']})
    inst.linkRelation('../check/index', fakeChild('a'))
    inst.linkRelation('../check/index', fakeChild('b', true))
    inst.methods.toggleAll.call(inst)
    expect(inst.data.value).toEqual(['a', 'b'])
  })

  it('全清', () => {
    const inst = mountGroup({value: ['a', 'b']})
    inst.linkRelation('../check/index', fakeChild('a'))
    inst.linkRelation('../check/index', fakeChild('b'))
    inst.methods.toggleAll.call(inst, false)
    expect(inst.data.value).toEqual([])
  })
})

describe('check-group 登记与解除', () => {
  it('unlinked：解除登记后 toggleAll 不再包含该子项', () => {
    const inst = mountGroup({value: []})
    const child = fakeChild('a')
    inst.linkRelation('../check/index', child)
    const rel = comp.def.relations!['../check/index']
    rel.unlinked!.call(inst, child)
    inst.methods.toggleAll.call(inst, true)
    expect(inst.data.value).toEqual([])
  })

  it('check-box 同协议登记', () => {
    const inst = mountGroup({value: ['a']})
    const child = fakeChild('a')
    inst.linkRelation('../check-box/index', child)
    expect(child.received).toEqual([['a']])
  })

  it('check-list 回交通道：linked 调 parent.receiveCheckGroup(self)', () => {
    const inst = mountGroup({value: []})
    const receiveCheckGroup = vi.fn()
    inst.linkRelation('../check-list/index', {receiveCheckGroup})
    expect(receiveCheckGroup).toHaveBeenCalledWith(inst)
  })

  it('子项无 receiveGroupValue 不崩溃', () => {
    const inst = mountGroup({value: []})
    expect(() => inst.linkRelation('../check/index', {data: {name: 'a'}})).not.toThrow()
  })
})

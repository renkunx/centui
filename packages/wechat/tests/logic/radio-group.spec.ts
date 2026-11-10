/**
 * radio-group 逻辑层测试（对照 Vue 版 RadioGroup.vue 的 rootGroup 语义）：
 * 1. check(name)：提交组值 + change；同值不重复 emit
 * 2. checkChild：子组件上报入口（等价 rootGroup.check）
 * 3. relations：linked 登记子项并推送初始组值；observer 变更广播
 * 4. unlinked 解除登记
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/radio-group/index'))

function fakeChild(name: string, checkedRef?: {value: unknown}) {
  const received: unknown[] = []
  return {
    data: {name},
    received,
    receiveGroupValue(val: unknown) {
      received.push(val)
      if (checkedRef) checkedRef.value = val
    },
  }
}

function mountGroup(props: Record<string, unknown> = {}) {
  const inst = mountDef(comp.def, {props})
  inst.attached()
  return inst
}

describe('radio-group check', () => {
  it('check(name)：setData value + change {value}', () => {
    const inst = mountGroup({value: ''})
    inst.methods.check.call(inst, 'a')
    expect(inst.data.value).toBe('a')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'a'}}])
  })

  it('同值 check 不重复 emit', () => {
    const inst = mountGroup({value: 'a'})
    inst.methods.check.call(inst, 'a')
    expect(inst.events).toEqual([])
  })

  it('checkChild 委托 check（子组件上报入口）', () => {
    const inst = mountGroup({value: ''})
    inst.methods.checkChild.call(inst, 'b')
    expect(inst.data.value).toBe('b')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'b'}}])
  })

  it('值类型：Boolean/Number 与 String 等价（strict 比较语义）', () => {
    const inst = mountGroup({value: false})
    inst.methods.check.call(inst, false)
    expect(inst.events).toEqual([])
    inst.methods.check.call(inst, 1)
    expect(inst.data.value).toBe(1)
  })
})

describe('radio-group 登记与广播', () => {
  it('linked：子项登记并推送当前组值', () => {
    const inst = mountGroup({value: 'a'})
    const child = fakeChild('a')
    inst.linkRelation('../radio/index', child)
    expect(child.received).toEqual(['a'])
  })

  it('observer：value 变更向已登记子项广播', () => {
    const inst = mountGroup({value: 'a'})
    const child = fakeChild('a')
    inst.linkRelation('../radio/index', child)
    inst.methods.check.call(inst, 'b')
    expect(child.received).toEqual(['a', 'b'])
  })

  it('unlinked：解除登记后不再广播', () => {
    const inst: Mounted = mountGroup({value: 'a'})
    const child = fakeChild('a')
    inst.linkRelation('../radio/index', child)
    const rel = comp.def.relations!['../radio/index']
    rel.unlinked!.call(inst, child)
    inst.methods.check.call(inst, 'c')
    expect(child.received).toEqual(['a'])
  })

  it('radio-box 与 radio 同协议登记', () => {
    const inst = mountGroup({value: 'x'})
    const child = fakeChild('x')
    inst.linkRelation('../radio-box/index', child)
    expect(child.received).toEqual(['x'])
  })

  it('linked 子项若无 receiveGroupValue 不崩溃', () => {
    const inst = mountGroup({value: 'a'})
    expect(() => inst.linkRelation('../radio/index', {data: {name: 'a'}})).not.toThrow()
  })
})

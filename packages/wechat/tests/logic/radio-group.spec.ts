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

describe('radio-group 分支补齐', () => {
  it('radio-box unlinked：解除登记后不再广播', () => {
    const inst = mountGroup({value: 'a'})
    const child = fakeChild('a')
    inst.linkRelation('../radio-box/index', child)
    const rel = comp.def.relations!['../radio-box/index']
    rel.unlinked!.call(inst, child)
    inst.methods.check.call(inst, 'c')
    expect(child.received).toEqual(['a'])
  })

  it('unlinked：移除未登记子项（indexOf -1）不崩溃（radio / radio-box 两路）', () => {
    const inst = mountGroup({value: 'a'})
    const relRadio = comp.def.relations!['../radio/index']
    const relBox = comp.def.relations!['../radio-box/index']
    expect(() => relRadio.unlinked!.call(inst, {} as never)).not.toThrow()
    expect(() => relBox.unlinked!.call(inst, {} as never)).not.toThrow()
  })

  it('linked：运行时上下文无 data 时按空串推送（防御分支）', () => {
    const inst = mountGroup({value: 'a'})
    const relRadio = comp.def.relations!['../radio/index']
    const relBox = comp.def.relations!['../radio-box/index']
    const a = fakeChild('a')
    const b = fakeChild('b')
    relRadio.linked.call({} as never, a as never)
    relBox.linked.call({} as never, b as never)
    expect(a.received).toEqual([''])
    expect(b.received).toEqual([''])
  })

  it('linked：组值 undefined → 推送空串', () => {
    const inst = mountGroup({})
    const child = fakeChild('a')
    inst.linkRelation('../radio/index', child)
    expect(child.received).toEqual([''])
  })

  it('observer：无 receiveGroupValue 的子项跳过广播（typeof 守卫 false 路）', () => {
    const inst = mountGroup({value: 'a'})
    inst.linkRelation('../radio/index', {data: {name: 'a'}})
    inst.linkRelation('../radio-box/index', {data: {name: 'a'}})
    inst.methods.check.call(inst, 'b')
    expect(inst.data.value).toBe('b')
  })

  it('children 懒初始化：未登记子项时 observer 直变更不崩溃', () => {
    const inst = mountGroup({value: ''})
    expect(() => inst.setData({value: 'x'})).not.toThrow()
    expect(inst.data.value).toBe('x')
  })
})

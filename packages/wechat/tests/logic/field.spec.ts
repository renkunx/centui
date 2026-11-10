/**
 * field 逻辑层测试（对照 Vue 版 test/components/field.spec.ts 行为清单）：
 * 1. disabled 向后代 field-item/input-item/textarea-item 广播（provide rootField 等价）
 * 2. linked 登记时推送当前 disabled
 * 3. title/brief 驱动 header 显隐；ready 探测空 header/footer 回写
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/field/index'))

function fakeChild() {
  const received: boolean[] = []
  return {received, receiveFieldDisabled(val: boolean) { received.push(val) }}
}

describe('field disabled 广播', () => {
  it('linked：登记子项并推送当前 disabled', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}})
    const child = fakeChild()
    inst.linkRelation('../field-item/index', child)
    expect(child.received).toEqual([true])
  })

  it('observer：disabled 变更向全部已登记子项广播', () => {
    const inst = mountDef(comp.def)
    const a = fakeChild()
    const b = fakeChild()
    inst.linkRelation('../field-item/index', a)
    inst.linkRelation('../input-item/index', b)
    inst.setData({disabled: true})
    expect(a.received).toEqual([false, true])
    expect(b.received).toEqual([false, true])
  })

  it('unlinked：解除登记后不再广播', () => {
    const inst = mountDef(comp.def)
    const child = fakeChild()
    inst.linkRelation('../textarea-item/index', child)
    const rel = comp.def.relations!['../textarea-item/index']
    rel.unlinked!.call(inst, child)
    inst.setData({disabled: true})
    expect(child.received).toEqual([false])
  })

  it('子项无 receiveFieldDisabled 不崩溃', () => {
    const inst = mountDef(comp.def)
    expect(() => inst.linkRelation('../field-item/index', {})).not.toThrow()
  })
})

describe('field header/footer 显隐', () => {
  it('title/brief 变更强制显示 header', () => {
    const inst = mountDef(comp.def)
    inst.setData({title: '转账信息'})
    expect(inst.data.showHeader).toBe(true)
    inst.setData({brief: '说明'})
    expect(inst.data.showHeader).toBe(true)
  })

  it('ready 探测：空 header/footer 包裹节点隐藏', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-field-header': {height: 0},
        '.cu-field-footer': {height: 0},
      },
    })
    inst.attached()
    inst.ready()
    expect(inst.data.showHeader).toBe(false)
    expect(inst.data.showFooter).toBe(false)
  })

  it('ready 探测：有 title 时 header 保持显示', () => {
    const inst = mountDef(comp.def, {
      props: {title: '标题'},
      rects: {
        '.cu-field-header': {height: 40},
        '.cu-field-footer': {height: 0},
      },
    })
    inst.attached()
    inst.ready()
    expect(inst.data.showHeader).toBe(true)
    expect(inst.data.showFooter).toBe(false)
  })

  it('ready 探测：非空 header/footer 保持显示', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-field-header': {height: 40},
        '.cu-field-footer': {height: 40},
      },
    })
    inst.attached()
    inst.ready()
    expect(inst.data.showHeader).toBe(true)
    expect(inst.data.showFooter).toBe(true)
  })
})

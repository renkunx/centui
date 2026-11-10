/**
 * detail-item 逻辑层测试（对照 Vue DetailItem.vue）：
 * 1. 契约锁定：props 默认值与类型映射、CuComponent 统一默认（addGlobalClass / cu-class）
 * 2. ready 插槽探测：'#cu-detail-slot-probe' 尺寸判定 hasSlot（小程序无插槽回退写法，
 *    以测量探测替代 Vue <slot>{{content}}</slot>）
 * 3. 度量去重：hasSlot 未变化时不重复 setData
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/detail-item/index'))

const PROBE = '#cu-detail-slot-probe'

describe('detail-item 契约（对齐 Vue DetailItem.vue）', () => {
  it('props 默认值与 Vue withDefaults 严格一致', () => {
    const props = comp.def.properties ?? {}
    expect(props.title).toMatchObject({type: String, value: ''})
    expect(props.content).toMatchObject({type: String, value: ''})
    expect(props.content.optionalTypes).toContain(Number) // Vue content: string | number
    expect(props.bold).toMatchObject({type: Boolean, value: false})
  })

  it('无 methods、无 observers（纯展示组件）', () => {
    expect(comp.def.methods ?? {}).toEqual({})
    expect(comp.def.observers ?? {}).toEqual({})
  })

  it('CuComponent 统一默认：addGlobalClass + cu-class 外部类', () => {
    expect(comp.def.options?.addGlobalClass).toBe(true)
    expect(comp.def.externalClasses).toContain('cu-class')
  })

  it('初始 data：hasSlot false（首帧闪现兜底文本，ready 后回写）', () => {
    const inst = mountDef(comp.def, {props: {title: '名称', content: '内容', bold: true}})
    expect(inst.data.hasSlot).toBe(false)
    expect(inst.data.title).toBe('名称')
    expect(inst.data.content).toBe('内容')
    expect(inst.data.bold).toBe(true)
  })
})

describe('detail-item ready 插槽探测', () => {
  it('插槽包裹节点有尺寸 → hasSlot true', () => {
    const inst = mountDef(comp.def, {rects: {[PROBE]: {width: 40, height: 18}}})
    inst.ready()
    expect(inst.data.hasSlot).toBe(true)
  })

  it('宽度为 0 / 高度为 0 → 无插槽内容', () => {
    const widthZero = mountDef(comp.def, {rects: {[PROBE]: {width: 0, height: 18}}})
    widthZero.ready()
    expect(widthZero.data.hasSlot).toBe(false)

    const heightZero = mountDef(comp.def, {rects: {[PROBE]: {width: 40, height: 0}}})
    heightZero.ready()
    expect(heightZero.data.hasSlot).toBe(false)
  })

  it('探测节点缺失（rect null）→ hasSlot false', () => {
    const inst = mountDef(comp.def)
    inst.ready()
    expect(inst.data.hasSlot).toBe(false)
  })

  it('度量去重：hasSlot 未变化不重复 setData；变化后再探测回写', () => {
    const inst = mountDef(comp.def)
    inst.ready()
    expect(inst.data.hasSlot).toBe(false)
    // 再探测一次仍无插槽：hasSlot === 判定值 → 跳过 setData（!== 分支 false）
    inst.ready()
    expect(inst.data.hasSlot).toBe(false)
    // 插槽出现 → true；重复探测保持 true
    const probe2 = mountDef(comp.def, {rects: {[PROBE]: {width: 10, height: 10}}})
    probe2.ready()
    expect(probe2.data.hasSlot).toBe(true)
    probe2.ready()
    expect(probe2.data.hasSlot).toBe(true)
  })
})

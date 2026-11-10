/**
 * swiper-item 逻辑层测试（对照 Vue 版 SwiperItem.vue 尺寸/拷贝/fade 通道）：
 * 1. setDimensions：slide 横向 → width、slideY 纵向 → height
 * 2. setCopy：loop 拷贝定位（boxStyle 前缀 + 绝对定位 left）；null 关闭拷贝
 * 3. setFade：透明度 + 可选过渡（空串关闭）
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/swiper-item/index'))

describe('swiper-item 尺寸', () => {
  it('slide 横向：width 内联样式', () => {
    const inst = mountDef(comp.def)
    inst.methods.setDimensions.call(inst, 300, false)
    expect(inst.data.boxStyle).toBe('width: 300px;')
  })

  it('slideY 纵向：height 内联样式', () => {
    const inst = mountDef(comp.def)
    inst.methods.setDimensions.call(inst, 200, true)
    expect(inst.data.boxStyle).toBe('height: 200px;')
  })
})

describe('swiper-item loop 拷贝', () => {
  it('setCopy(left)：基于 boxStyle 的绝对定位样式', () => {
    const inst = mountDef(comp.def)
    inst.methods.setDimensions.call(inst, 300, false)
    inst.methods.setCopy.call(inst, 900)
    expect(inst.data.copyStyle).toBe(
      'width: 300px;position: absolute; left: 900px; top: 0;',
    )
  })

  it('未量尺寸时 setCopy 不带 boxStyle 前缀', () => {
    const inst = mountDef(comp.def)
    inst.methods.setCopy.call(inst, -300)
    expect(inst.data.copyStyle).toBe('position: absolute; left: -300px; top: 0;')
  })

  it('setCopy(null)：关闭拷贝', () => {
    const inst = mountDef(comp.def)
    inst.methods.setCopy.call(inst, 100)
    expect(inst.data.copyStyle).not.toBe('')
    inst.methods.setCopy.call(inst, null)
    expect(inst.data.copyStyle).toBe('')
  })

  it('setCopy(null) 幂等：已关闭不再 setData', () => {
    const inst = mountDef(comp.def)
    inst.methods.setCopy.call(inst, null)
    expect(inst.data.copyStyle).toBe('')
  })
})

describe('swiper-item fade', () => {
  it('setFade：opacity + transition', () => {
    const inst = mountDef(comp.def)
    inst.methods.setFade.call(inst, 0.5, 'opacity 200ms linear')
    expect(inst.data.fadeStyle).toBe('opacity: 0.5; transition: opacity 200ms linear;')
  })

  it('transition 空串：关闭过渡', () => {
    const inst = mountDef(comp.def)
    inst.methods.setFade.call(inst, 1, '')
    expect(inst.data.fadeStyle).toBe('opacity: 1;')
  })
})

describe('swiper-item relations（父 swiper 通道）', () => {
  it('linked：登记父实例；unlinked 置空', () => {
    const inst = mountDef(comp.def)
    const parent = {}
    inst.linkRelation('../swiper/index', parent)
    expect((inst as unknown as {__swiper: unknown}).__swiper).toBe(parent)

    const rel = comp.def.relations!['../swiper/index']
    rel.unlinked!.call(inst)
    expect((inst as unknown as {__swiper: unknown}).__swiper).toBe(null)
  })

  it('setDimensions 后 linked 依旧仅登记（尺寸由父主动下发）', () => {
    const inst = mountDef(comp.def)
    inst.methods.setDimensions.call(inst, 100, false)
    inst.linkRelation('../swiper/index', {id: 1})
    expect(inst.data.boxStyle).toBe('width: 100px;')
    expect((inst as unknown as {__swiper: unknown}).__swiper).toEqual({id: 1})
  })
})

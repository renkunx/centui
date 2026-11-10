import {describe, it, expect} from 'vitest'
import {
  buildComputedClass,
  buildColorStyle,
  buildCouponStyle,
  buildCircleStyle,
} from '../../src/components/tag/logic'

describe('tag/logic', () => {
  it('computedClass 对齐 Vue 版五段类名（default 前缀恒在）', () => {
    expect(buildComputedClass({size: 'large', shape: 'square', type: 'ghost', fontWeight: 'normal'})).toBe(
      'default size-large shape-square type-ghost font-weight-normal',
    )
    expect(buildComputedClass({size: 'tiny', shape: 'coupon', type: 'fill', fontWeight: 'bolder'})).toBe(
      'default size-tiny shape-coupon type-fill font-weight-bolder',
    )
  })

  it('colorStyle：fill + fillColor 才有背景；ghost 追加 border-color；color 恒随 fontColor', () => {
    expect(buildColorStyle({type: 'fill', fillColor: 'red', fontColor: ''})).toBe('background:red;')
    expect(buildColorStyle({type: 'fill', fillColor: '', fontColor: ''})).toBe('')
    expect(buildColorStyle({type: 'ghost', fillColor: 'red', fontColor: 'blue'})).toBe(
      'border-color:blue;color:blue;',
    )
    // 非 ghost 时 fontColor 只上 color，不上 border-color
    expect(buildColorStyle({type: 'fill', fillColor: '', fontColor: 'blue'})).toBe('color:blue;')
  })

  it('coupon 缺口渐变：左右两侧 radial-gradient，fillColor 为空时 style 为空但节点仍在', () => {
    expect(buildCouponStyle('yellow', 'left')).toBe(
      'background:radial-gradient(circle at left, transparent 33%, yellow 33%);',
    )
    expect(buildCouponStyle('yellow', 'right')).toBe(
      'background:radial-gradient(circle at right, transparent 33%, yellow 33%);',
    )
    expect(buildCouponStyle('', 'left')).toBe('')
  })

  it('circle 形状：radius = height/2，sharp 切角置 0，高度未变时返回 null（去重）', () => {
    expect(buildCircleStyle(40, '', -1)).toEqual({
      style: 'padding-left:20px;padding-right:20px;border-radius:20px;',
      height: 40,
    })
    expect(buildCircleStyle(40, 'top-left', -1)?.style).toBe(
      'padding-left:20px;padding-right:20px;border-radius:20px;border-top-left-radius:0;',
    )
    // 与上次同高 → 无需更新
    expect(buildCircleStyle(40, '', 40)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// tag 组件实例（index.ts）：attached/observers/circle 度量收敛/refresh/detached
// ---------------------------------------------------------------------------
import {beforeEach, afterEach, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/tag/index'))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

d2('tag 静态派生（attached + observers）', () => {
  i2('attached：computedClass/colorStyle/coupon 全量派生', () => {
    const inst = mountDef(comp.def, {
      props: {size: 'small', shape: 'coupon', type: 'fill', fillColor: 'red', fontWeight: 'bold'},
    })
    inst.attached()
    e2(inst.data.computedClass).toBe('default size-small shape-coupon type-fill font-weight-bold')
    e2(inst.data.colorStyle).toBe('background:red;')
    e2(inst.data.leftCouponStyle).toContain('radial-gradient(circle at left, transparent 33%, red 33%)')
    e2(inst.data.rightCouponStyle).toContain('circle at right')
  })

  i2('observer size/shape/type/fontWeight → __refreshStatics', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({type: 'fill', fillColor: 'blue'})
    e2(inst.data.computedClass).toContain('type-fill')
    e2(inst.data.colorStyle).toBe('background:blue;')
  })

  i2('observer fillColor/fontColor：ghost 加 border-color', () => {
    const inst = mountDef(comp.def, {props: {type: 'ghost'}})
    inst.attached()
    inst.setData({fontColor: 'green'})
    e2(inst.data.colorStyle).toBe('border-color:green;color:green;')
  })

  i2('observer shape/sharp/size：circle 触发重测、非 circle 早退', () => {
    const plain = mountDef(comp.def)
    plain.attached()
    e2(() => plain.setData({shape: 'fillet', size: 'tiny'})).not.toThrow()
    e2(plain.data.sizeStyle).toBe('')
  })
})

d2('tag circle 度量收敛', () => {
  i2('ready：circle 度量高度 → sizeStyle；重复度量同高收敛（不再排程）', () => {
    const inst = mountDef(comp.def, {props: {shape: 'circle'}, rects: {'#cu-tag-el': {height: 40}}})
    inst.attached()
    inst.ready()
    e2(inst.data.sizeStyle).toBe('padding-left:20px;padding-right:20px;border-radius:20px;')
    expect(vi.getTimerCount()).toBe(1) // 收敛重测已排程
    vi.advanceTimersByTime(60) // 同高 → buildCircleStyle null → 停止
    e2(vi.getTimerCount()).toBe(0)
    e2(inst.data.sizeStyle).toBe('padding-left:20px;padding-right:20px;border-radius:20px;')
  })

  i2('sharp 切角进样式', () => {
    const inst = mountDef(comp.def, {
      props: {shape: 'circle', sharp: 'top-left'},
      rects: {'#cu-tag-el': {height: 30}},
    })
    inst.attached()
    inst.ready()
    e2(inst.data.sizeStyle).toBe(
      'padding-left:15px;padding-right:15px;border-radius:15px;border-top-left-radius:0;',
    )
  })

  i2('量取失败（null / height 非数值）：不更新、不排程', () => {
    const inst = mountDef(comp.def, {props: {shape: 'circle'}, rects: {'#cu-tag-el': null}})
    inst.attached()
    inst.ready()
    e2(inst.data.sizeStyle).toBe('')
    e2(vi.getTimerCount()).toBe(0)

    const inst2 = mountDef(comp.def, {
      props: {shape: 'circle'},
      rects: {'#cu-tag-el': {height: undefined} as {height?: number}},
    })
    inst2.attached()
    inst2.ready()
    e2(inst2.data.sizeStyle).toBe('')
    e2(vi.getTimerCount()).toBe(0)
  })

  i2('refresh()：重置去重高度再测（同高仍下发）；非 circle 早退', () => {
    const inst = mountDef(comp.def, {props: {shape: 'circle'}, rects: {'#cu-tag-el': {height: 40}}})
    inst.attached()
    inst.ready()
    vi.advanceTimersByTime(60)
    inst.methods.refresh.call(inst)
    vi.advanceTimersByTime(60)
    e2(inst.data.sizeStyle).toContain('border-radius:20px;')

    const plain = mountDef(comp.def)
    plain.attached()
    e2(() => plain.methods.refresh.call(plain)).not.toThrow()
  })

  i2('高度变化：收敛重测按新高度再下一轮，直至同高收敛', () => {
    let h = 40
    const inst = mountDef(comp.def, {
      props: {shape: 'circle'},
      // 每轮度量高度 +10（内容高度随内边距变化），100 封顶后同高收敛
      rects: {'#cu-tag-el': {get height() { return h }}},
    })
    inst.attached()
    inst.ready() // 首测 40
    // 每轮恰好推进 50ms = 重测定时器间隔，确保一轮恰好一次度量
    for (let round = 0; round < 10 && vi.getTimerCount() > 0; round++) {
      if (h < 100) h += 10
      vi.advanceTimersByTime(50)
    }
    e2(vi.getTimerCount()).toBe(0) // 同高 → 不再排程
    e2(inst.data.sizeStyle).toContain('border-radius:50px;')
  })

  i2('detached：清理收敛定时器', () => {
    const inst = mountDef(comp.def, {props: {shape: 'circle'}, rects: {'#cu-tag-el': {height: 40}}})
    inst.attached()
    inst.ready()
    e2(vi.getTimerCount()).toBe(1)
    inst.detached()
    e2(vi.getTimerCount()).toBe(0)
  })
})

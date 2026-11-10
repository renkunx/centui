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

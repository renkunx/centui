/**
 * slider 纯逻辑测试：step 对齐、边界钳位、交叉修复、位置换算、选区样式、
 * 拖拽增量与值属性归一。对照 Vue 版 Slider.vue（修复后实现）。
 */
import {describe, it, expect} from 'vitest'
import {
  alignToStep,
  barStyleOf,
  dragDeltaOf,
  hintOf,
  normalizeValues,
  parseValueProp,
  positionOf,
} from '../../src/components/slider/logic'

describe('slider/logic step 对齐', () => {
  it('round 到最近步进（主动画被动跟随语义）', () => {
    expect(alignToStep(53, 0, 10)).toBe(50)
    expect(alignToStep(55, 0, 10)).toBe(60) // .5 进位
    expect(alignToStep(7, 5, 10)).toBe(5) // (7-5)/10 → 0.2 → 0 → 5
    expect(alignToStep(13, 5, 10)).toBe(15)
  })
})

describe('slider/logic updateValue 归一（normalizeValues）', () => {
  it('null 位保留旧值、step 对齐、max 钳位', () => {
    const prev = {lower: 20, upper: 100}
    expect(normalizeValues(53, null, prev, 0, 100, 10)).toEqual({lower: 50, upper: 100})
    expect(normalizeValues(null, 200, prev, 0, 100, 10)).toEqual({lower: 20, upper: 100})
    expect(normalizeValues(null, 84, prev, 0, 100, 10)).toEqual({lower: 20, upper: 80})
  })

  it('min 钳位；交叉修复：拖动端跟随另一端', () => {
    const prev = {lower: 20, upper: 50}
    // lower 拖到 upper 之外 → lower = upper（changed 端跟随）
    expect(normalizeValues(80, null, prev, 0, 100, 1)).toEqual({lower: 50, upper: 50})
    // upper 拖到 lower 之外 → upper = lower（lower 未变）
    expect(normalizeValues(null, 5, prev, 0, 100, 1)).toEqual({lower: 20, upper: 20})
    expect(normalizeValues(-10, null, prev, 0, 100, 1)).toEqual({lower: 0, upper: 50})
  })

  it('交叉判定以拖动端是否变化为准（Vue: newValues[0] === values[0]）', () => {
    const prev = {lower: 50, upper: 50}
    // lower 已在 50（未变），upper 拖到 40 → 交叉 → upper = lower
    expect(normalizeValues(null, 40, prev, 0, 100, 1)).toEqual({lower: 50, upper: 50})
  })
})

describe('slider/logic 位置与选区', () => {
  it('positionOf 百分比；max<=min 防除零', () => {
    expect(positionOf(50, 0, 100)).toBe(50)
    expect(positionOf(25, 0, 100)).toBe(25)
    expect(positionOf(10, 0, 0)).toBe(0)
  })

  it('barStyle：单值左起；range 双端区间', () => {
    expect(barStyleOf(false, {lower: 30, upper: 100}, 0, 100)).toBe('width: 30%;')
    expect(barStyleOf(true, {lower: 20, upper: 60}, 0, 100)).toBe('width: 40%; left: 20%;')
  })
})

describe('slider/logic 拖拽换算', () => {
  it('dragDeltaOf：pixel / trackWidth × (max - min)', () => {
    expect(dragDeltaOf(50, 100, 0, 100)).toBe(50)
    expect(dragDeltaOf(-25, 100, 0, 200)).toBe(-50)
    expect(dragDeltaOf(50, 0, 0, 100)).toBe(0) // 未量取宽度按 0（等价 Vue elWidth===0 return）
  })

  it('hintOf 恒为原始数值（format no-op）', () => {
    expect(hintOf(42)).toBe('42')
  })
})

describe('slider/logic 值属性归一', () => {
  it('parseValueProp：number / [lower, upper] / 非法位 null', () => {
    expect(parseValueProp(50)).toEqual({lower: 50, upper: null})
    expect(parseValueProp([10, 90])).toEqual({lower: 10, upper: 90})
    expect(parseValueProp(['x', 90])).toEqual({lower: null, upper: 90})
    expect(parseValueProp(undefined)).toEqual({lower: null, upper: null})
  })
})

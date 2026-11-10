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

// ---------------------------------------------------------------------------
// slider 组件实例（index.ts）：attached 初始归一/observers/拖拽/stopDrag/度量
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/slider/index'))

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

interface SliderState {
  trackWidth: number
  startDragPos: number
  startVal: number
}

function stateOf(inst: Mounted): SliderState {
  return (inst as unknown as {__slider: SliderState}).__slider
}

function touch(pageX: number, dataset: Record<string, unknown> = {}) {
  return {changedTouches: [{pageX}], currentTarget: {dataset}} as never
}

function touchesEvt(pageX: number) {
  return {touches: [{pageX}], currentTarget: {dataset: {}}} as never
}

/** 事件流最后一个事件（等价 at(-1)，目标 lib 无 es2022） */
function lastEvent(events: Array<{name: string; detail: unknown}>) {
  return events[events.length - 1]
}

d2('slider attached 初始归一', () => {
  i2('默认 value 0：与初始 [min,max] 一致 → 不 emit', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    e2(inst.data.lower).toBe(0)
    e2(inst.data.upper).toBe(100)
    e2(inst.data.lowerPos).toBe(0)
    e2(inst.data.upperPos).toBe(100)
    e2(inst.data.barStyle).toBe('width: 0%;')
    e2(inst.data.hint).toBe('0')
    e2(inst.events).toEqual([])
  })

  i2('value 50：归一 emit change {value: 50}', () => {
    const inst = mountDef(comp.def, {props: {value: 50}})
    inst.attached()
    e2(inst.data.lower).toBe(50)
    e2(inst.data.lowerPos).toBe(50)
    e2(inst.data.barStyle).toBe('width: 50%;')
    e2(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 50}}])
  })

  i2('range [20, 80]：双端归一 + 区间样式', () => {
    const inst = mountDef(comp.def, {props: {range: true, value: [20, 80]}})
    inst.attached()
    e2(inst.data.lower).toBe(20)
    e2(inst.data.upper).toBe(80)
    e2(inst.data.barStyle).toBe('width: 60%; left: 20%;')
    e2(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: [20, 80]}}])
  })

  i2('step 对齐与边界钳位（value 53, step 10 → 50；value 999 → max）', () => {
    const a = mountDef(comp.def, {props: {value: 53, step: 10}})
    a.attached()
    e2(a.data.lower).toBe(50)
    e2(a.eventsOf('change')[0].detail).toEqual({value: 50})

    const b = mountDef(comp.def, {props: {value: 999}})
    b.attached()
    e2(b.data.lower).toBe(100)

    const c = mountDef(comp.def, {props: {value: -5}})
    c.attached()
    e2(c.data.lower).toBe(0)
  })

  i2('非数值 value：保持初始 [min, max]', () => {
    const inst = mountDef(comp.def, {props: {value: 'x' as never}})
    inst.attached()
    e2(inst.data.lower).toBe(0)
    e2(inst.events).toEqual([])
  })
})

d2('slider ready 度量', () => {
  i2('量取 track 宽度缓存', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    e2(stateOf(inst).trackWidth).toBe(200)
  })

  i2('量取失败（null / width 0）→ trackWidth 保持 0', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': null}})
    inst.attached()
    inst.ready()
    e2(stateOf(inst).trackWidth).toBe(0)

    const inst2 = mountDef(comp.def, {rects: {'.cu-slider': {width: 0}}})
    inst2.attached()
    inst2.ready()
    e2(stateOf(inst2).trackWidth).toBe(0)
  })

  i2('已量过（trackWidth > 0）不再重复查询', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    const spy = vi.spyOn(inst, 'createSelectorQuery')
    inst.methods.__measureTrack.call(inst)
    e2(spy).not.toHaveBeenCalled()
  })
})

d2('slider observers', () => {
  i2('value observer：变更 → updateValue + emit；range 同值收敛', () => {
    const inst = mountDef(comp.def, {props: {value: 30}})
    inst.attached()
    e2(inst.eventsOf('change')).toHaveLength(1)
    inst.setData({value: 80})
    e2(inst.data.lower).toBe(80)
    e2(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {value: 30}},
      {name: 'change', detail: {value: 80}},
    ])

    const range = mountDef(comp.def, {props: {range: true, value: [20, 80]}})
    range.attached()
    range.setData({value: [20, 80]}) // 受控回写同值 → 不重算不 emit
    e2(range.eventsOf('change')).toHaveLength(1)
    range.setData({value: [30, 70]})
    e2(range.data.lower).toBe(30)
    e2(range.data.upper).toBe(70)
  })

  i2('disabled observer：恢复可用时终止拖拽态；置 true 不终止', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    inst.methods.onHandleTouchStart.call(inst, touch(0))
    e2(inst.data.isDragging).toBe(true)
    inst.setData({disabled: true}) // !newVal false → 不终止
    e2(inst.data.isDragging).toBe(true)
    inst.setData({disabled: false}) // 恢复 → stopDrag
    e2(inst.data.isDragging).toBe(false)
  })

  i2('range/min/max/step observer：按新边界重归一', () => {
    // value 30 + max 40：upper 钳到 40（lower 不变）
    const inst = mountDef(comp.def, {props: {value: 30}})
    inst.attached()
    inst.setData({max: 40})
    e2(inst.data.lower).toBe(30)
    e2(inst.data.upper).toBe(40)
    e2(inst.eventsOf('change')[1].detail).toEqual({value: 30})

    // value 30 + min 35：lower 钳到 35（upper 不变）
    const inst2 = mountDef(comp.def, {props: {value: 30}})
    inst2.attached()
    inst2.setData({min: 35})
    e2(inst2.data.lower).toBe(35)

    // step 变更：value 53 在 step 1 下对齐到 53
    const inst3 = mountDef(comp.def, {props: {value: 53, step: 10}})
    inst3.attached()
    e2(inst3.data.lower).toBe(50)
    inst3.setData({step: 1})
    e2(inst3.data.lower).toBe(53)
  })
})

d2('slider 拖拽', () => {
  i2('下把手拖拽：delta 换算 + 每次 move emit + end 复位拖拽态', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    inst.methods.onHandleTouchStart.call(inst, touch(0))
    e2(inst.data.isDragging).toBe(true)
    e2(inst.data.isDragingUpper).toBe(false)
    e2(stateOf(inst).startVal).toBe(0)

    inst.methods.onHandleTouchMove.call(inst, touch(100)) // 100/200*(100-0) = 50
    e2(inst.data.lower).toBe(50)
    e2(inst.data.hint).toBe('50')
    e2(lastEvent(inst.eventsOf('change'))?.detail).toEqual({value: 50})

    inst.methods.onHandleTouchEnd.call(inst)
    e2(inst.data.isDragging).toBe(false)
  })

  i2('上把手（upper）拖拽：range 模式下主动画跟随', () => {
    const inst = mountDef(comp.def, {props: {range: true, value: [20, 80]}, rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    inst.methods.onHandleTouchStart.call(inst, touch(0, {upper: true}))
    e2(inst.data.isDragingUpper).toBe(true)
    e2(stateOf(inst).startVal).toBe(80)

    inst.methods.onHandleTouchMove.call(inst, touch(-60)) // -60/200*100 = -30 → nextVal 50
    e2(inst.data.upper).toBe(50)
    e2(lastEvent(inst.eventsOf('change'))?.detail).toEqual({value: [20, 50]})
    inst.methods.onHandleTouchEnd.call(inst)
  })

  i2('touches 回退（无 changedTouches）：touches[0] 生效', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    inst.methods.onHandleTouchStart.call(inst, touchesEvt(0))
    inst.methods.onHandleTouchMove.call(inst, touchesEvt(50)) // 25
    e2(inst.data.lower).toBe(25)
  })

  i2('交叉修复：range 下把手拖过 upper → 跟随钳位', () => {
    const inst = mountDef(comp.def, {props: {range: true, value: [20, 50]}, rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    inst.methods.onHandleTouchStart.call(inst, touch(0))
    inst.methods.onHandleTouchMove.call(inst, touch(200)) // nextVal 100 > upper 50 → lower = 50
    e2(lastEvent(inst.eventsOf('change'))?.detail).toEqual({value: [50, 50]})
  })

  i2('disabled：start/move 早退', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}, rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    inst.methods.onHandleTouchStart.call(inst, touch(0))
    e2(inst.data.isDragging).toBe(false)
    e2(() => inst.methods.onHandleTouchMove.call(inst, touch(50))).not.toThrow()
    e2(inst.events).toEqual([])
  })

  i2('未开始拖拽 move 早退；无 touch start/move 早退', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    e2(() => inst.methods.onHandleTouchMove.call(inst, touch(50))).not.toThrow()
    e2(() => inst.methods.onHandleTouchStart.call(inst, {currentTarget: {dataset: {}}} as never)).not.toThrow()
    e2(() => inst.methods.onHandleTouchMove.call(inst, {currentTarget: {dataset: {}}} as never)).not.toThrow()
    e2(inst.events).toEqual([])
  })

  i2('trackWidth 未量到：move 按 0 增量（start 触发补量仍失败）', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': null}})
    inst.attached()
    inst.methods.onHandleTouchStart.call(inst, touch(0)) // 内部补量 → 仍 0
    e2(stateOf(inst).trackWidth).toBe(0)
    inst.methods.onHandleTouchMove.call(inst, touch(100))
    e2(inst.data.lower).toBe(0) // delta 0 → 值不变
    e2(inst.events).toEqual([])
  })

  i2('stopDrag：仅 isDragingUpper 时也复位；detached 复位', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    inst.methods.onHandleTouchStart.call(inst, touch(0, {upper: true}))
    e2(inst.data.isDragingUpper).toBe(true)
    inst.methods.stopDrag.call(inst)
    e2(inst.data.isDragingUpper).toBe(false)

    const inst2 = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst2.attached()
    inst2.ready()
    inst2.methods.onHandleTouchStart.call(inst2, touch(0))
    inst2.detached()
    e2(inst2.data.isDragging).toBe(false)
  })

  i2('stopDrag：非拖拽态不 setData（无变化）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    e2(() => inst.methods.stopDrag.call(inst)).not.toThrow()
    e2(inst.data.isDragging).toBe(false)
  })
})

d2('slider touch 回退分支补漏', () => {
  i2('changedTouches 空数组：回退 touches[0]', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-slider': {width: 200}}})
    inst.attached()
    inst.ready()
    const e1 = {changedTouches: [], touches: [{pageX: 0}], currentTarget: {dataset: {}}} as never
    const e2 = {changedTouches: [], touches: [{pageX: 50}], currentTarget: {dataset: {}}} as never
    inst.methods.onHandleTouchStart.call(inst, e1)
    inst.methods.onHandleTouchMove.call(inst, e2) // 50/200*100 = 25
    expect(inst.data.lower).toBe(25)
  })
})

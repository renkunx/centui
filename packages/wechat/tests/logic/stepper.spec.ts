/**
 * stepper 纯逻辑测试：clamp 边界（min/max 变更、负值、小数精度、退化区间）。
 * 对照 Vue 版 Stepper.vue 的 accAdd/subtr/formatNum/getCurrentNum 与
 * watch(currentNum) 收敛语义。
 */
import {describe, it, expect} from 'vitest'
import {
  accAdd,
  formatNum,
  getCurrentNum,
  subtr,
  transitionStepper,
  clampStepper,
} from '../../src/components/stepper/logic'

describe('stepper/logic formatNum', () => {
  it('剔除非法字符，保留数字/./-（多小数点为两端一致的历史怪癖 → NaN）', () => {
    expect(formatNum('12a3', false)).toBe(123)
    expect(formatNum('1.2.3', false)).toBeNaN()
  })

  it('首个前导 - 与 . 被剥离（对齐 Vue 正则 |^-|^\\.;两端一致的历史怪癖：负号不保留）', () => {
    expect(formatNum('--5', false)).toBe(-5)
    expect(formatNum('.5', false)).toBe(5)
    // '-.5'：前导 - 被剥离后为 '.5' → 0.5（对齐 Vue，负号不保留）
    expect(formatNum('-.5', false)).toBe(0.5)
  })

  it('空串/纯非法输入归 0', () => {
    expect(formatNum('', false)).toBe(0)
    expect(formatNum('abc', false)).toBe(0)
  })

  it('键入的负号不保留（formatNum 只清洗字符串；负值仅经 reduce/currentNum 数字通路产生）', () => {
    expect(formatNum('-3', false)).toBe(3)
    expect(formatNum('2.75', false)).toBe(2.75)
  })

  it('isInteger 向下取整', () => {
    expect(formatNum('3.7', true)).toBe(3)
    expect(formatNum('-3.7', true)).toBe(3)
  })
})

describe('stepper/logic 精度补偿（accAdd/subtr）', () => {
  it('accAdd 规避 0.1+0.2 浮点误差', () => {
    expect(accAdd(0.1, 0.2)).toBe(0.3)
    expect(accAdd('5', '0.5')).toBe(5.5)
    expect(accAdd(-1.5, 0.25)).toBe(-1.25)
  })

  it('subtr 规避 0.3-0.1 浮点误差', () => {
    expect(subtr(0.3, 0.1)).toBe(0.2)
    expect(subtr('5', '0.5')).toBe(4.5)
  })
})

describe('stepper/logic getCurrentNum / clampStepper', () => {
  it('format 后收敛到 [min, max]（负号被 formatNum 剥离 → -5 变 5，对齐 Vue）', () => {
    expect(getCurrentNum('12abc', 0, 10, false)).toBe(10)
    expect(getCurrentNum(99, 0, 10, false)).toBe(10)
    expect(getCurrentNum(-5, 0, 10, false)).toBe(5)
    expect(getCurrentNum('7', 0, 10, false)).toBe(7)
  })

  it('clampStepper 退化区间（min > max）时 max 收敛优先（Math.min 外层）', () => {
    expect(clampStepper(5, 10, 0)).toBe(0)
    expect(clampStepper(-1, 10, 0)).toBe(0)
  })
})

describe('stepper/logic transitionStepper（watch(currentNum) 收敛语义）', () => {
  it('常规递增：emit change + increase', () => {
    const t = transitionStepper(5, 6, {min: 0, max: 10, modelValue: 5})
    expect(t).toEqual({value: 6, changed: true, diff: 1})
  })

  it('与 modelValue 相同则不补发 change', () => {
    const t = transitionStepper(5, 6, {min: 0, max: 10, modelValue: 6})
    expect(t.changed).toBe(false)
    expect(t.diff).toBe(1) // increase 仍派发（对齐 Vue watch 不受 changed 门控）
  })

  it('emit 前 clamp：越界值（键入中间态）不得外流', () => {
    const t = transitionStepper(0, 99, {min: 0, max: 10, modelValue: 0})
    expect(t.value).toBe(10)
    expect(t.changed).toBe(true)
    expect(t.diff).toBe(10)
  })

  it('负值 clamp 到 min', () => {
    const t = transitionStepper(0, -3, {min: 0, max: 10, modelValue: 0})
    expect(t.value).toBe(0)
    expect(t.diff).toBe(0) // 无增减事件
  })

  it('min/max 动态收紧：clamp 后补发 change（对齐 watch(min)/watch(max)）', () => {
    // currentNum=5，新 max=3：applyTransition(3, 5) → decrease 2
    const t = transitionStepper(5, 3, {min: 0, max: 3, modelValue: 5})
    expect(t.value).toBe(3)
    expect(t.changed).toBe(true)
    expect(t.diff).toBe(-2)
  })

  it('modelValue 为 string 时按严格比较保留 Vue 的 !== 语义', () => {
    const t = transitionStepper(5, 5, {min: 0, max: 10, modelValue: '5'})
    expect(t.changed).toBe(true) // 5 !== '5'
    expect(t.value).toBe(5)
  })
})

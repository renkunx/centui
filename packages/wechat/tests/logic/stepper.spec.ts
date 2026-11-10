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

/**
 * 组件层（index.ts）：attached 初始化、四类 observer 收敛、加减/输入/失焦链路。
 * 用 weapp 挂载器直接实例化（properties 初始值不触发 observers 的真机语义已内建）。
 */
import {loadComponent, mountDef} from '../helpers/weapp'

const compStepper = await loadComponent(() => import('../../src/components/stepper/index'))

/** 事件流最后一个事件（等价 at(-1)，目标 lib 无 es2022） */
function lastEvent(events: Array<{name: string; detail: unknown}>) {
  return events[events.length - 1]
}

describe('stepper 组件（mountDef）', () => {
  it('attached：value||defaultValue 初始化 + isMin/isMax 状态', () => {
    const inst = mountDef(compStepper.def, {props: {value: 5, min: 0, max: 10}})
    inst.attached()
    expect(inst.data.currentNum).toBe(5)
    expect(inst.data.inputText).toBe('5')
    expect(inst.data.isMin).toBe(false)
    expect(inst.data.isMax).toBe(false)

    const atMin = mountDef(compStepper.def, {props: {value: 0, min: 0, max: 10}})
    atMin.attached()
    expect(atMin.data.isMin).toBe(true)
  })

  it('onAdd/onReduce：步进、越界守卫与事件载荷', () => {
    const inst = mountDef(compStepper.def, {props: {value: 5, min: 0, max: 6, step: 2}})
    inst.attached()
    inst.methods.onAdd.call(inst)
    expect(inst.data.currentNum).toBe(6)
    // diff 为实际位移（5→7 被 max 钳到 6，diff=1 而非 step 2）
    expect(lastEvent(inst.eventsOf('change'))?.detail).toEqual({value: 6})
    expect(lastEvent(inst.eventsOf('increase'))?.detail).toEqual({value: 1})
    inst.methods.onAdd.call(inst) // isMax 守卫
    expect(inst.data.currentNum).toBe(6)
    inst.methods.onReduce.call(inst)
    expect(inst.data.currentNum).toBe(4)
    // decrease 载荷为位移绝对值（transitionStepper 约定）
    expect(lastEvent(inst.eventsOf('decrease'))?.detail).toEqual({value: 2})
  })

  it('disabled 时加减不动', () => {
    const inst = mountDef(compStepper.def, {props: {value: 5, disabled: true}})
    inst.attached()
    inst.methods.onAdd.call(inst)
    inst.methods.onReduce.call(inst)
    expect(inst.data.currentNum).toBe(5)
  })

  it('value observer：非编辑期外部回写收敛；编辑期忽略', () => {
    const inst = mountDef(compStepper.def, {props: {value: 5, min: 0, max: 10}})
    inst.attached()
    inst.setData({value: 8})
    expect(inst.data.currentNum).toBe(8)
    // 编辑期忽略
    inst.setData({isEditing: true})
    inst.setData({value: 3})
    expect(inst.data.currentNum).toBe(8)
    inst.setData({isEditing: false})
    // min/max observer：仅 clamp 越界侧（低于新 min / 高于新 max），正常区间只刷状态
    inst.setData({min: 9})
    expect(inst.data.currentNum).toBe(9)
    inst.setData({max: 4})
    expect(inst.data.currentNum).toBe(4)
  })

  it('onInput/onFocus/onBlur：只读抵消、格式化收敛、blur 钳位', () => {
    const ro = mountDef(compStepper.def, {props: {value: 5, readOnly: true}})
    ro.attached()
    ro.methods.onInput.call(ro, {detail: {value: '9'}})
    expect(ro.data.inputText).toBe('5')

    const inst = mountDef(compStepper.def, {props: {value: 5, min: 0, max: 10}})
    inst.attached()
    inst.methods.onInput.call(inst, {detail: {value: '7'}})
    expect(inst.data.currentNum).toBe(7)
    expect(inst.data.isEditing).toBe(true)
    // 编辑期外部 value 回写被忽略
    inst.setData({value: 1})
    expect(inst.data.currentNum).toBe(7)
    inst.methods.onBlur.call(inst)
    expect(inst.data.isEditing).toBe(false)

    const clamp = mountDef(compStepper.def, {props: {value: 5, min: 0, max: 6}})
    clamp.attached()
    clamp.methods.onInput.call(clamp, {detail: {value: '9'}})
    expect(clamp.data.currentNum).toBe(6)
    clamp.methods.onBlur.call(clamp)
    expect(clamp.data.inputText).toBe('6')
  })

  it('defaultValue observer：重置当前值', () => {
    const inst = mountDef(compStepper.def, {props: {value: 5, defaultValue: 2, min: 0, max: 10}})
    inst.attached()
    inst.setData({defaultValue: 8})
    expect(inst.data.currentNum).toBe(8)
  })
})

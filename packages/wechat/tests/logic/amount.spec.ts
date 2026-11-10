/**
 * amount 格式化模式矩阵测试：number / thousand(hasSeparator) / capital(isCapital)
 * × precision 边界，全部用 @centui/core 主入口真函数断言
 * （logic.ts 与组件 index.ts 即以同一份 core 源实现，见 logic.ts 头注释）。
 * 对照 Vue 版 Amount.vue 的 nonCapital/capital computed。
 */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {toFixedPrecision, formatNumberWithSeparator, numberToChineseCapital} from '../../../core/src/format'
import {formatAmountText, legalPrecision} from '../../src/components/amount/logic'

const fmt = (v: number, overrides: Partial<Parameters<typeof formatAmountText>[1]> = {}) =>
  formatAmountText(v, {
    precision: 2,
    isRoundUp: true,
    hasSeparator: false,
    separator: ',',
    isCapital: false,
    ...overrides,
  })

describe('amount/legalPrecision', () => {
  it('precision > 0 原样；<= 0 归 0（Vue legalPrecision computed）', () => {
    expect(legalPrecision(2)).toBe(2)
    expect(legalPrecision(0)).toBe(0)
    expect(legalPrecision(-3)).toBe(0)
  })
})

describe('amount/number 模式（hasSeparator=false）× precision 边界', () => {
  it('默认 precision=2', () => {
    expect(fmt(1234.5678)).toBe('1234.57')
    expect(fmt(0)).toBe('0.00')
  })

  it('precision=0：整数输出（小数四舍五入进位）', () => {
    expect(fmt(1234.5678, {precision: 0})).toBe('1235')
    expect(fmt(1234.4, {precision: 0})).toBe('1234')
  })

  it('precision 负值按 0 处理（legalPrecision 链）', () => {
    expect(fmt(12.6, {precision: -2})).toBe('13')
  })

  it('precision=4：半位 5 进一（half-away-from-zero）', () => {
    expect(fmt(1.00005, {precision: 4})).toBe('1.0001')
    expect(fmt(-1.00005, {precision: 4})).toBe('-1.0001')
  })

  it('isRoundUp=false：向零截断', () => {
    expect(fmt(1234.5678, {precision: 2, isRoundUp: false})).toBe('1234.56')
    expect(fmt(-1234.5678, {precision: 2, isRoundUp: false})).toBe('-1234.56')
  })

  it('负数与 -0：全零不输出负号', () => {
    expect(fmt(-1.5, {precision: 0})).toBe('-2')
    expect(fmt(-0.001, {precision: 2})).toBe('0.00')
  })

  it('非有限输入原样输出（NaN/Infinity）', () => {
    expect(fmt(NaN)).toBe('NaN')
    expect(fmt(Infinity)).toBe('Infinity')
  })

  it('与 core toFixedPrecision 真函数逐点一致', () => {
    const samples: Array<[number, number]> = [
      [0, 0], [0.125, 3], [99.999, 2], [-99.999, 2], [1e21, 2], [123.456, 1],
    ]
    for (const [v, p] of samples) {
      expect(toFixedPrecision(v, p, true)).toBe(fmt(v, {precision: p}))
    }
  })
})

describe('amount/thousand 模式（hasSeparator=true）', () => {
  it('整数部分按 separator 分组，小数原样', () => {
    expect(fmt(1234567.891, {hasSeparator: true})).toBe('1,234,567.89')
    expect(fmt(1234567.891, {hasSeparator: true, separator: '-'})).toBe('1-234-567.89')
  })

  it('负数千分位：负号前置', () => {
    expect(fmt(-9876543.21, {hasSeparator: true})).toBe('-9,876,543.21')
  })

  it('万进位边界：恰为整万/整亿', () => {
    expect(fmt(10000, {hasSeparator: true, precision: 0})).toBe('10,000')
    expect(fmt(100000000, {hasSeparator: true, precision: 0})).toBe('100,000,000')
  })

  it('与 core formatNumberWithSeparator 真函数一致', () => {
    expect(fmt(987654321.123, {hasSeparator: true})).toBe(
      formatNumberWithSeparator(toFixedPrecision(987654321.123, 2, true), ','),
    )
  })
})

describe('amount/capital 模式（isCapital=true）', () => {
  it('capital 固定以 precision=4 换算（Vue capital computed），忽略 precision prop', () => {
    expect(fmt(1234.56, {isCapital: true, precision: 2})).toBe('壹仟贰佰叁拾肆元伍角陆分')
    expect(fmt(1234.56789, {isCapital: true, precision: 0})).toBe('壹仟贰佰叁拾肆元伍角陆分柒厘玖毫')
  })

  it('整数金额补「整」，零元「零元整」', () => {
    expect(fmt(100, {isCapital: true})).toBe('壹佰元整')
    expect(fmt(0, {isCapital: true})).toBe('零元整')
  })

  it('「元后补零」修复：10.05 → 壹拾元零伍分', () => {
    expect(fmt(10.05, {isCapital: true})).toBe('壹拾元零伍分')
  })

  it('负数带「负」前缀；超上限返回空串', () => {
    expect(fmt(-10.5, {isCapital: true})).toBe('负壹拾元伍角')
    expect(fmt(1e15, {isCapital: true})).toBe('')
  })

  it('与 core numberToChineseCapital 真函数一致', () => {
    const v = 98765.4321
    expect(fmt(v, {isCapital: true})).toBe(
      numberToChineseCapital(toFixedPrecision(v, 4, true)),
    )
  })
})

/**
 * 组件层（index.ts）：首轮同步/动画分派（isMounted 状态机）、formatting observers、
 * ticker 动画推进/重入停止/detached 清理（fake timers + Date.now 同步推进）。
 */
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/amount/index'))

describe('amount 组件：显隐与首轮语义', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('attached：首轮直接同步终值不播动画（对齐修复后 Vue 版 onMounted）', () => {
    const inst = mountDef(comp.def, {props: {value: 1234.567}})
    inst.attached()
    expect(inst.data.isMounted).toBe(true)
    expect(inst.data.displayValue).toBe(1234.567)
    expect(inst.data.text).toBe('1234.57')
  })

  it('attached 前 value 变更：isMounted=false 分支直接同步', () => {
    const inst = mountDef(comp.def)
    inst.setData({value: 99.999})
    expect(inst.data.isMounted).toBe(false)
    expect(inst.data.displayValue).toBe(99.999)
    expect(inst.data.text).toBe('100.00')
  })

  it('attached 后 value 变更（非动画）：直接同步 + 重格式化', () => {
    const inst = mountDef(comp.def, {props: {value: 1}})
    inst.attached()
    inst.setData({value: 2.5})
    expect(inst.data.displayValue).toBe(2.5)
    expect(inst.data.text).toBe('2.50')
  })
})

describe('amount 组件：动画', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('isAnimated=true：value 变更走动画并收敛终值（oldVal 不可得 → displayValue 起点）', () => {
    const inst = mountDef(comp.def, {props: {value: 0, isAnimated: true, duration: 1000}})
    inst.attached()
    inst.setData({value: 100})
    expect(inst.data.displayValue).toBe(0) // 首帧起点
    // 16ms 步进：1000ms 窗口内最后一拍在 992ms（progress 0.992），终点拍在 1008ms
    vi.advanceTimersByTime(1000)
    expect(inst.data.displayValue).toBe(99.2)
    vi.advanceTimersByTime(100)
    expect(inst.data.displayValue).toBe(100)
    expect(inst.data.text).toBe('100.00')
  })

  it('transition 别名（v2 遗留）同样启用动画', () => {
    const inst = mountDef(comp.def, {props: {value: 0, transition: true, duration: 320}})
    inst.attached()
    inst.setData({value: 64})
    vi.advanceTimersByTime(320)
    expect(inst.data.displayValue).toBe(64)
  })

  it('duration=0：立即落地终值，onComplete 清句柄', () => {
    const inst = mountDef(comp.def, {props: {value: 0, isAnimated: true, duration: 0}})
    inst.attached()
    inst.setData({value: 50})
    expect(inst.data.displayValue).toBe(50)
    expect(inst.data.text).toBe('50.00')
    // 同步完成路径 onComplete 先于 handle 赋值执行（无害：句柄已 stopped）
    expect((inst as any).__amountState.handle).not.toBeNull()
    expect(() => inst.detached()).not.toThrow()
  })

  it('动画重入：旧句柄先停止，新动画以当前展示值为起点收敛', () => {
    const inst = mountDef(comp.def, {props: {value: 0, isAnimated: true, duration: 1000}})
    inst.attached()
    inst.setData({value: 100})
    vi.advanceTimersByTime(320) // 前一动画推进到 ≈32
    inst.setData({value: 200}) // 重入
    vi.advanceTimersByTime(2000)
    expect(inst.data.displayValue).toBe(200)
    expect((inst as any).__amountState.handle).toBeNull()
  })

  it('detached：动画句柄停止，推进不再更新 displayValue/text', () => {
    const inst = mountDef(comp.def, {props: {value: 0, isAnimated: true, duration: 1000}})
    inst.attached()
    inst.setData({value: 100})
    inst.detached()
    const frozen = inst.data.displayValue
    vi.advanceTimersByTime(2000)
    expect(inst.data.displayValue).toBe(frozen)
    expect((inst as any).__amountState.handle).toBeNull()
  })

  it('detached（无动画）：handle 为 null 分支安全', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(() => inst.detached()).not.toThrow()
  })
})

describe('amount 组件：格式化 observers', () => {
  it('hasSeparator/separator/isCapital/isRoundUp/precision 变更重算 text', () => {
    const inst = mountDef(comp.def, {props: {value: 1234567.891}})
    inst.attached()
    expect(inst.data.text).toBe('1234567.89')
    inst.setData({hasSeparator: true})
    expect(inst.data.text).toBe('1,234,567.89')
    inst.setData({separator: '-'})
    expect(inst.data.text).toBe('1-234-567.89')
    inst.setData({isCapital: true})
    expect(inst.data.text).toBe(
      formatAmountText(1234567.891, {
        precision: 2,
        isRoundUp: true,
        hasSeparator: true,
        separator: '-',
        isCapital: true,
      }),
    )
    inst.setData({isRoundUp: false})
    expect(inst.data.text).toBe(
      formatAmountText(1234567.891, {
        precision: 2,
        isRoundUp: false,
        hasSeparator: true,
        separator: '-',
        isCapital: true,
      }),
    )
    inst.setData({precision: 0, isCapital: false})
    expect(inst.data.text).toBe('1-234-567') // isRoundUp=false → 向零截断
  })
})

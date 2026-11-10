import {describe, it, expect} from 'vitest'
import {
  formatValue,
  sliceProgress,
  stepStatusClass,
  isNoCurrent,
  barInnerStyle,
  barOuterStyle,
  computeStepSizes,
  STEP_DURATION,
} from '../../src/components/steps/logic'

const STEPS = [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'd'}]

describe('steps/logic', () => {
  it('formatValue 钳位：负值归 0，超出末步归末步，界内原样', () => {
    expect(formatValue(-1, 4)).toBe(0)
    expect(formatValue(2, 4)).toBe(2)
    expect(formatValue(9, 4)).toBe(3)
    // Vue 源语义：steps 为空时 length-1 = -1，任何非负 current 归 -1（原样保留）
    expect(formatValue(0, 0)).toBe(-1)
  })

  it('sliceProgress 段数 = steps.length - 1，len 截到 [0,1]', () => {
    const progress = sliceProgress(2, STEPS, [])
    expect(progress).toHaveLength(3)
    // current=2：段0 已走满（offset 2→1），段1 走满（offset 1），段2 未走（offset 0）
    expect(progress[0]).toEqual({len: 1, time: 1 * STEP_DURATION})
    expect(progress[1]).toEqual({len: 1, time: 1 * STEP_DURATION})
    expect(progress[2]).toEqual({len: 0, time: 0})
  })

  it('小数 current：len = offset（0-1 区间），time 首算按 len', () => {
    const progress = sliceProgress(1.5, STEPS, [])
    expect(progress[1]).toEqual({len: 0.5, time: 0.5 * STEP_DURATION})
  })

  it('重算时 time = |old.len - len| * duration（Δ 驱动过渡时长）', () => {
    const old = sliceProgress(2, STEPS, [])
    const next = sliceProgress(3, STEPS, old)
    expect(next[2]).toEqual({len: 1, time: Math.abs(0 - 1) * STEP_DURATION})
    expect(next[0]).toEqual({len: 1, time: Math.abs(1 - 1) * STEP_DURATION})
  })

  it('steps 运行时变长守卫：新 steps 下重算，段数与新长度一致', () => {
    const old = sliceProgress(2, STEPS, [])
    const longer = [...STEPS, {name: 'e'}]
    const next = sliceProgress(2, longer, old)
    expect(next).toHaveLength(4)
    expect(next[3]).toEqual({len: 0, time: 0})
  })

  it('stepStatusClass：index < current → reached；index === floor(current) → current', () => {
    expect(stepStatusClass(2, 0)).toBe('reached')
    expect(stepStatusClass(2, 1)).toBe('reached')
    expect(stepStatusClass(2, 2)).toBe('current')
    expect(stepStatusClass(2, 3)).toBe('')
    // 小数 current：reached 按 < 1.5，current 按 floor
    expect(stepStatusClass(1.5, 1)).toBe('reached current')
    expect(stepStatusClass(1.5, 2)).toBe('')
  })

  it('noCurrent：小数进度为 true（no-current 类隐藏末段 reached）', () => {
    expect(isNoCurrent(2)).toBe(false)
    expect(isNoCurrent(1.5)).toBe(true)
  })

  it('barInnerStyle：水平 (len-1)*100% / 0 / 0，垂直 0 / (len-1)*100% / 0，附时长', () => {
    expect(barInnerStyle({len: 1, time: 0.3}, 'horizontal')).toBe(
      'transform:translate3d(0%, 0, 0);transition:all 0.3s linear;',
    )
    expect(barInnerStyle({len: 0.5, time: 0.15}, 'vertical')).toBe(
      'transform:translate3d(0, -50%, 0);transition:all 0.15s linear;',
    )
    // 运行时 steps 变长守卫：缺段兜底空串
    expect(barInnerStyle(undefined, 'horizontal')).toBe('')
  })

  it('barOuterStyle：仅垂直非 adaptive 生效，高度为度量值', () => {
    expect(barOuterStyle(0, 'vertical', false, [100, 120])).toBe('height:100px;')
    expect(barOuterStyle(0, 'vertical', true, [100])).toBe('')
    expect(barOuterStyle(0, 'horizontal', false, [100])).toBe('')
  })

  it('computeStepSizes：末步扣图标浮动高度，其余 +40 间距，负值归 0（Vue initStepSize）', () => {
    // text 高 100，icon 高 20：段0 = 100+40，段1（末）= 100-20
    expect(computeStepSizes([100, 100], [20, 20])).toEqual([140, 80])
    // 负值归 0
    expect(computeStepSizes([10], [20])).toEqual([0])
    // 图标缺失按 0
    expect(computeStepSizes([100, 100], [])).toEqual([140, 100])
  })
})

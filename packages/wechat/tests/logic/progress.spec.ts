import {describe, it, expect} from 'vitest'
import {resolveFormatValue} from '../../src/components/progress/logic'
import {resolveStrokeWidth} from '../../src/shared/indicator-ring'

describe('progress/logic', () => {
  it('未挂载时直接同步终值（对齐 Vue isMounted 首帧语义）', () => {
    expect(
      resolveFormatValue({value: 0.5, oldValue: undefined, isMounted: false, transition: true}),
    ).toEqual({type: 'sync', value: 0.5})
  })

  it('transition=false 直接同步，不动画', () => {
    expect(
      resolveFormatValue({value: 0.8, oldValue: 0.2, isMounted: true, transition: false}),
    ).toEqual({type: 'sync', value: 0.8})
  })

  it('挂载后且 transition=true：从 oldVal 动画到新值（oldVal 缺省按 0）', () => {
    expect(
      resolveFormatValue({value: 0.8, oldValue: 0.2, isMounted: true, transition: true}),
    ).toEqual({type: 'animate', from: 0.2, to: 0.8})
    expect(
      resolveFormatValue({value: 0.8, oldValue: undefined, isMounted: true, transition: true}),
    ).toEqual({type: 'animate', from: 0, to: 0.8})
  })

  it('描边宽缺省换算与 Roller/Progress 链路一致（size/12）', () => {
    expect(resolveStrokeWidth(70, 0)).toBeCloseTo(5.8333, 3)
  })
})

// ---------------------------------------------------------------------------
// progress 组件实例（index.ts）：value 状态机（sync/animate）、动画停止、生命周期
// ---------------------------------------------------------------------------
import {vi, beforeEach, afterEach} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/progress/index'))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('progress 组件实例', () => {
  it('attached：isMounted 置位；首轮 value observer（未挂载）已按 sync 落终值', () => {
    const inst = mountDef(comp.def, {props: {value: 0.42}})
    expect(inst.data.formatValue).toBe(0)
    expect(inst.data.isMounted).toBe(false)
    inst.attached()
    expect(inst.data.isMounted).toBe(true)
    expect(inst.data.formatValue).toBe(0) // 初始 properties 不触发 observer
  })

  it('transition=false：observer 直接同步 formatValue', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({value: 0.7})
    expect(inst.data.formatValue).toBe(0.7)
    expect(vi.getTimerCount()).toBe(0) // 无动画定时器
  })

  it('transition=true 且已挂载：从旧值线性动画到新值', () => {
    const inst = mountDef(comp.def, {props: {transition: true, duration: 320}})
    inst.attached()
    inst.setData({value: 0.2})
    inst.setData({value: 0.8})
    expect(inst.data.formatValue).not.toBe(0.8) // 动画进行中
    vi.advanceTimersByTime(400)
    expect(inst.data.formatValue).toBe(0.8) // onComplete 终值
  })

  it('duration=0：动画退化为同步终值（onUpdate(to) + onComplete 立即）', () => {
    const inst = mountDef(comp.def, {props: {transition: true, duration: 0}})
    inst.attached()
    inst.setData({value: 0.5})
    expect(inst.data.formatValue).toBe(0.5)
  })

  it('动画中途再次变更：旧动画停止、新动画从 0 起点推进（oldVal 缺省按 0，首帧同步 from）', () => {
    const inst = mountDef(comp.def, {props: {transition: true, duration: 1000}})
    inst.attached()
    inst.setData({value: 0.1})
    vi.advanceTimersByTime(16)
    expect(inst.data.formatValue).toBeGreaterThan(0) // 旧动画已推进
    inst.setData({value: 0.9})
    expect(inst.data.formatValue).toBe(0) // 新动画首帧同步 from=0（oldVal 缺省），旧句柄已 stop
    vi.advanceTimersByTime(1200)
    expect(inst.data.formatValue).toBe(0.9)
  })

  it('detached：动画定时器被 stop（advance 后不再推进）', () => {
    const inst = mountDef(comp.def, {props: {transition: true, duration: 1000}})
    inst.attached()
    inst.setData({value: 0.1})
    inst.detached()
    const frozen = inst.data.formatValue
    vi.advanceTimersByTime(1200)
    expect(inst.data.formatValue).toBe(frozen)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('__stopAnimate 无活动句柄时幂等', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(() => inst.methods.__stopAnimate.call(inst)).not.toThrow()
    inst.setData({value: 1})
    inst.methods.__stopAnimate.call(inst)
    expect(inst.data.formatValue).toBe(1)
  })
})

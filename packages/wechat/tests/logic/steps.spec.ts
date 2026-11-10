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

// ---------------------------------------------------------------------------
// steps 组件实例（index.ts）：attached/observers/transition 状态机/垂直度量
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/steps/index'))

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

const STEPS4 = [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'd'}]

interface StepsState {
  inited: boolean
  lastStepsLength: number
  currentLength: number
  progress: Array<{len: number; time: number}>
  stepsSize: number[]
  mainTimer: number | null
  walkTimers: number[]
}

function stateOf(inst: Mounted): StepsState {
  return (inst as unknown as {__stepsState: StepsState}).__stepsState
}

/** 覆盖实例的 createSelectorQuery：selectAll 按序回放（texts / icons） */
function installSelectAllQuery(inst: Mounted, provide: () => unknown[]) {
  ;(inst as unknown as Record<string, unknown>).createSelectorQuery = () => {
    const ordered = provide()
    const collected: unknown[] = []
    let i = 0
    const grab = () => (i < ordered.length ? ordered[i++] : null)
    const top = {
      selectAll(_sel: string) {
        return {
          boundingClientRect(cb?: (r: unknown) => void) {
            const r = grab()
            collected.push(r)
            cb?.(r)
            return top
          },
        }
      },
      exec(done?: (res: unknown[]) => void) {
        done?.(collected)
        return top
      },
    }
    return top
  }
}

d2('steps attached 初始化', () => {
  i2('默认 current 0：四步三段全 0 进度，首步 current', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    inst.attached()
    e2(stateOf(inst).inited).toBe(true)
    e2(inst.data.currentLength).toBe(0)
    e2(inst.data.noCurrent).toBe(false)
    e2(inst.data.stepStatus).toEqual(['current', '', '', ''])
    e2(inst.data.barStyles).toEqual(['', '', '', '']) // 水平无外层样式
    e2(inst.data.barInnerStyles).toEqual([
      'transform:translate3d(-100%, 0, 0);transition:all 0s linear;',
      'transform:translate3d(-100%, 0, 0);transition:all 0s linear;',
      'transform:translate3d(-100%, 0, 0);transition:all 0s linear;',
      '', // count = max(steps.length, progress.length + 1)：末项为缺段兜底
    ])
    e2(inst.data.progress).toEqual([
      {len: 0, time: 0},
      {len: 0, time: 0},
      {len: 0, time: 0},
    ])
  })

  i2('current 2 初始：前两段满、末步 reached 集齐', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4, current: 2}})
    inst.attached()
    e2(inst.data.currentLength).toBe(2)
    e2(inst.data.stepStatus).toEqual(['reached', 'reached', 'current', ''])
  })

  i2('current 越界钳位（9 → 3）', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4, current: 9}})
    inst.attached()
    e2(inst.data.currentLength).toBe(3)
  })

  i2('空步骤：currentLength -1（Vue 源语义），单空段视图不崩', () => {
    const inst = mountDef(comp.def, {props: {steps: []}})
    inst.attached()
    e2(inst.data.currentLength).toBe(-1)
    e2(inst.data.progress).toEqual([])
    e2(inst.data.stepStatus).toEqual([''])
  })

  i2('非数组 steps 容错', () => {
    const inst = mountDef(comp.def, {props: {steps: 'x' as never}})
    inst.attached()
    e2(inst.data.currentLength).toBe(-1)
  })
})

d2('steps current observer', () => {
  i2('未 inited（attached 前）→ 初始化赋值不处理', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    inst.setData({current: 2}) // inited false → return
    e2(inst.data.currentLength).toBe(0)
    inst.attached() // attached 按 current=2 初始化
    e2(inst.data.currentLength).toBe(2)
  })

  i2('非 transition：直接落地新进度', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    inst.attached()
    inst.setData({current: 3})
    e2(inst.data.currentLength).toBe(3)
    e2(inst.data.stepStatus).toEqual(['reached', 'reached', 'reached', 'current'])
  })

  i2('transition=true（observer 触发）：mountDef 单参语义 oldVal undefined → isAdd false 分支，收敛到目标', async () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    inst.attached()
    inst.setData({transition: true})
    inst.setData({current: 2})
    e2(inst.data.currentLength).toBe(0) // 100ms 内未启动
    await vi.advanceTimersByTimeAsync(100)
    e2(inst.data.currentLength).toBe(0) // walk 启动，但首个段定时器未到
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.currentLength).toBe(1)
    e2(inst.data.progress[1]).toEqual({len: 1, time: 0.3})
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.currentLength).toBe(2) // 收敛到目标
    e2(inst.data.progress[0]).toEqual({len: 1, time: 0.3})
  })

  i2('isAdd=true 正向 walk（直调 __onCurrentChange 显式 oldVal）', async () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    inst.attached()
    inst.setData({transition: true})
    inst.methods.__onCurrentChange.call(inst, 2, 0)
    await vi.advanceTimersByTimeAsync(100)
    // walk(0) 同步执行：current 累加段0、progress[0] 立即更新
    e2(inst.data.progress[0]).toEqual({len: 1, time: 0.3})
    e2(inst.data.currentLength).toBe(0)
    await vi.advanceTimersByTimeAsync(300) // 段0 定时器：walk(1) → currentLength 直接落 2
    e2(inst.data.currentLength).toBe(2)
    e2(inst.data.progress[1]).toEqual({len: 1, time: 0.3})
    await vi.advanceTimersByTimeAsync(300) // 段1 定时器：walk(2) 收尾
    e2(inst.data.currentLength).toBe(2)
    e2(inst.data.progress[2]).toEqual({len: 0, time: 0})
    e2(inst.data.stepStatus).toEqual(['reached', 'reached', 'current', ''])
  })

  i2('isAdd=false 反向 walk（3 → 1）：逐段回退', async () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4, current: 3}})
    inst.attached()
    inst.setData({transition: true})
    inst.methods.__onCurrentChange.call(inst, 1, 3)
    await vi.advanceTimersByTimeAsync(100)
    e2(inst.data.currentLength).toBe(3) // walk(len-1) 同步：仅末段 progress 更新
    e2(inst.data.progress[2]).toEqual({len: 0, time: 0.3})
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.currentLength).toBe(1) // 段定时器回调：current 累减后赋值
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.currentLength).toBe(1)
    e2(inst.data.progress).toEqual([
      {len: 1, time: 0},
      {len: 0, time: 0.3},
      {len: 0, time: 0.3},
    ])
  })

  i2('transition 中断：再次变更清空 main/walk 定时器后按新目标重启', async () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4, current: 3}})
    inst.attached()
    inst.setData({transition: true})
    inst.methods.__onCurrentChange.call(inst, 1, 3)
    await vi.advanceTimersByTimeAsync(250) // walk 进行中（段定时器挂起）
    inst.methods.__onCurrentChange.call(inst, 3, 1) // 打断（isAdd=true）
    await vi.advanceTimersByTimeAsync(2000)
    e2(inst.data.currentLength).toBe(3) // 新目标落地，旧链不再干扰
    e2(inst.data.progress[0]).toEqual({len: 1, time: 0}) // 与旧态无差 → time 0
  })

  i2('transition 主定时器挂起时 detached：不再推进', async () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    inst.attached()
    inst.setData({transition: true})
    inst.setData({current: 2})
    inst.detached()
    await vi.advanceTimersByTimeAsync(2000)
    e2(inst.data.currentLength).toBe(0)
  })

  i2('ready：垂直度量入口（水平早退不崩）', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    e2(() => inst.ready()).not.toThrow()
  })

  i2('steps observer：非数组 steps 容错重建', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4, current: 2}})
    inst.attached()
    inst.setData({steps: 'x' as never})
    e2(inst.data.stepStatus).toEqual(['reached']) // currentLength 2 > 0
    e2(inst.data.progress).toEqual([])
  })
})

d2('steps observer（steps/方向）', () => {
  i2('steps 变长：按当前 currentLength 重算 progress 并扩视图', async () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4, current: 2}})
    inst.attached()
    inst.setData({steps: [...STEPS4, {name: 'e'}]})
    e2(inst.data.stepStatus).toHaveLength(5)
    e2(inst.data.stepStatus).toEqual(['reached', 'reached', 'current', '', ''])
    await vi.advanceTimersByTimeAsync(1) // wx.nextTick → __initStepSize（水平早退）
  })

  i2('steps 同长度：跳过重建', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    inst.attached()
    const before = JSON.stringify(inst.data.progress)
    inst.setData({steps: [{name: 'x'}, {name: 'y'}, {name: 'z'}, {name: 'w'}]})
    e2(JSON.stringify(inst.data.progress)).toBe(before)
  })

  i2('steps observer：未 inited 时只登记长度', () => {
    const inst = mountDef(comp.def, {props: {steps: []}})
    inst.setData({steps: STEPS4}) // inited false
    e2(stateOf(inst).lastStepsLength).toBe(4)
    e2(inst.data.stepStatus).toEqual([])
  })

  i2('direction/verticalAdaptive observer → 度量（垂直非 adaptive）', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    installSelectAllQuery(inst, () => [
      [{height: 100}, {height: 120}, {height: 100}, {height: 100}],
      [{height: 20}, {height: 20}, {height: 20}, {height: 20}],
    ])
    inst.attached()
    inst.setData({direction: 'vertical'}) // observer → __initStepSize
    e2(inst.data.barStyles[0]).toBe('height:140px;')
    e2(inst.data.barStyles[1]).toBe('height:160px;') // 非末段 +40
    e2(inst.data.barStyles[2]).toBe('height:140px;')
    e2(inst.data.barStyles[3]).toBe('height:80px;') // 末段 100 - 20
  })

  i2('垂直度量空文本 → 早退；尺寸不变 → 不重复视图同步', () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    let texts: unknown[] = [{height: 100}, {height: 100}, {height: 100}, {height: 100}]
    installSelectAllQuery(inst, () => [texts, [{height: 20}, {height: 20}, {height: 20}, {height: 20}]])
    inst.attached()
    inst.setData({direction: 'vertical'})
    const first = inst.data.barStyles[0]
    e2(first).toBe('height:140px;')
    // 二次度量同尺寸 → 不再 setData（防御分支直调不崩）
    inst.methods.__initStepSize.call(inst)
    e2(inst.data.barStyles[0]).toBe(first)
    // 空文本 → return
    texts = []
    inst.methods.__initStepSize.call(inst)
    e2(inst.data.barStyles[0]).toBe(first)
  })

  i2('verticalAdaptive true / 水平：度量早退', () => {
    const adaptive = mountDef(comp.def, {props: {steps: STEPS4, direction: 'vertical', verticalAdaptive: true}})
    adaptive.attached()
    e2(() => adaptive.methods.__initStepSize.call(adaptive)).not.toThrow()
    const horizontal = mountDef(comp.def, {props: {steps: STEPS4}})
    horizontal.attached()
    e2(() => horizontal.methods.__initStepSize.call(horizontal)).not.toThrow()
  })

  i2('steps 变长后 wx.nextTick 触发垂直度量', async () => {
    const inst = mountDef(comp.def, {props: {steps: STEPS4}})
    installSelectAllQuery(inst, () => [
      [{height: 100}, {height: 100}, {height: 100}, {height: 100}, {height: 100}],
      [{height: 20}, {height: 20}, {height: 20}, {height: 20}, {height: 20}],
    ])
    inst.attached()
    inst.setData({direction: 'vertical'})
    inst.setData({steps: [...STEPS4, {name: 'e'}]})
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.barStyles[4]).toBe('height:80px;') // 末段 100 - 20
  })
})

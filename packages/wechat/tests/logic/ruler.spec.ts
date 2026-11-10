/**
 * ruler 纯逻辑测试：值域几何（scope/min/max 交叉钳制、空白带）、offset↔value 换算、
 * initX 定位与刻度布局。对照 Vue 版 Ruler.vue 的 computed/initX/updateValue/drawLine。
 */
import {describe, it, expect} from 'vitest'
import {
  BLANK,
  blankLeftOf,
  blankRightOf,
  initXOf,
  innerWidthOf,
  realMaxOf,
  realMinOf,
  tickLayoutOf,
  unitCountOf,
  valueAtOffset,
} from '../../src/components/ruler/logic'

describe('ruler/logic 值域几何', () => {
  it('unitCount = ceil((scope[1]-scope[0])/unit)', () => {
    expect(unitCountOf([0, 100], 1)).toBe(100)
    expect(unitCountOf([0, 100], 10)).toBe(10)
    expect(unitCountOf([0, 105], 10)).toBe(11)
  })

  it('realMin/realMax 与 scope 交叉钳制（avoid 越界回落）', () => {
    expect(realMinOf([0, 100], 20)).toBe(20)
    expect(realMinOf([0, 100], -5)).toBe(0)
    expect(realMinOf([0, 100], 150)).toBe(0) // min 超出右界 → 回落左界
    expect(realMaxOf([0, 100], 80)).toBe(80)
    expect(realMaxOf([0, 100], 120)).toBe(100)
    expect(realMaxOf([0, 100], -5)).toBe(100) // max 低于左界 → 回落右界
  })

  it('空白带：越界刻度淡显区域宽度', () => {
    expect(blankLeftOf(20, 0, 1)).toBe(20 * BLANK)
    expect(blankRightOf(100, 80, 1)).toBe(20 * BLANK)
    expect(blankLeftOf(0, 0, 1)).toBe(0)
  })

  it('innerWidth 与最大滚动（Vue scroller.setDimensions 语义）', () => {
    // unitCount=100, canvasWidth=300, blank 0 → innerWidth = 3000+300
    expect(innerWidthOf(100, 300, 0, 0)).toBe(3300)
    // maxScroll = innerWidth - canvasWidth = unitCount*BLANK - blankLeft - blankRight
    expect(innerWidthOf(100, 300, 60, 60) - 300).toBe(100 * BLANK - 120)
  })
})

describe('ruler/logic initX 定位', () => {
  it('value<=realMin → 0；>=realMax → unitCount*BLANK；否则按值偏移', () => {
    expect(initXOf(0, 0, 100, 1, 100)).toBe(0)
    expect(initXOf(0, 20, 100, 1, 100)).toBe(0)
    expect(initXOf(100, 0, 100, 1, 100)).toBe(100 * BLANK)
    expect(initXOf(120, 0, 100, 1, 100)).toBe(100 * BLANK)
    expect(initXOf(50, 0, 100, 1, 100)).toBe(50 * BLANK)
    expect(initXOf(47, 0, 100, 1, 100)).toBe(47 * BLANK) // ceil 语义
  })
})

describe('ruler/logic offset ↔ value 换算（updateValue）', () => {
  const canvasWidth = 300
  const baseX = canvasWidth - 0 // blankLeft 0

  it('scrollLeft=0 → realMin；滚到最大 → realMax', () => {
    expect(valueAtOffset(baseX, 0, canvasWidth, 0, 1, 0, 100)).toBe(0)
    expect(valueAtOffset(baseX, 100 * BLANK, canvasWidth, 0, 1, 0, 100)).toBe(100)
  })

  it('半格取整（round）；越界钳制', () => {
    // absX = scrollLeft；value = round(scrollLeft / BLANK)
    expect(valueAtOffset(baseX, 45, canvasWidth, 0, 1, 0, 100)).toBe(Math.round(45 / BLANK))
    expect(valueAtOffset(baseX, 45 + BLANK / 2, canvasWidth, 0, 1, 0, 100)).toBe(2)
    expect(valueAtOffset(baseX, 5000, canvasWidth, 0, 1, 0, 100)).toBe(100)
    expect(valueAtOffset(baseX, 0, canvasWidth, 0, 1, 20, 100)).toBe(20) // realMin 钳制
  })

  it('有左空白带时基线左移（baseX = canvasWidth - blankLeft）', () => {
    const blankLeft = 20 * BLANK
    const bx = canvasWidth - blankLeft
    // scrollLeft 0 → x = canvasWidth - blankLeft → absX = blankLeft → value ≈ 20
    expect(valueAtOffset(bx, 0, canvasWidth, 0, 1, 20, 100)).toBe(20)
    expect(valueAtOffset(bx, 50 * BLANK, canvasWidth, 0, 1, 20, 100)).toBe(70)
  })
})

describe('ruler/logic 刻度布局（drawLine 可测部分）', () => {
  const canvasWidth = 300

  it('step 整数倍为长刻度（major），其余短刻度', () => {
    const ticks = tickLayoutOf(0, 10, 10, 1, 0, 0, 0, canvasWidth)
    expect(ticks[0].major).toBe(true)
    expect(ticks[1].major).toBe(false)
    expect(ticks[10].major).toBe(true)
    expect(ticks[10].text).toBe('10')
  })

  it('越界刻度标记 outRange（淡色带）', () => {
    const blankLeft = 2 * BLANK
    const ticks = tickLayoutOf(0, 10, 10, 1, 0, blankLeft, 0, canvasWidth)
    expect(ticks[0].outRange).toBe(true)
    expect(ticks[1].outRange).toBe(true)
    expect(ticks[2].outRange).toBe(false)
  })

  it('画布外的刻度被裁剪（cx < 0 或 > canvasWidth*2）', () => {
    const ticks = tickLayoutOf(-100, 100, 10, 1, 0, 0, 0, canvasWidth)
    expect(ticks.every((t) => t.cx >= 0 && t.cx <= canvasWidth * 2)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ruler 组件实例（index.ts）：canvas 初始化、值域 observer、拖拽滚动、吸附、防御分支
// ---------------------------------------------------------------------------
import {vi, beforeEach, afterEach} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const compRuler = await loadComponent(() => import('../../src/components/ruler/index'))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

interface RulerState {
  isInitialed: boolean
  isScrolling: boolean
  canvasWidth: number
  ticker: {scrollTo(target: number, animated?: boolean): void} | null
}

interface CtxStub {
  ctx: Record<string, unknown>
  log: Array<{op: string; args: unknown[]}>
  styles: string[]
}

function makeCtx(): CtxStub {
  const log: Array<{op: string; args: unknown[]}> = []
  const styles: string[] = []
  const ctx: Record<string, unknown> = {}
  for (const op of ['clearRect', 'beginPath', 'moveTo', 'lineTo', 'fillText', 'stroke', 'scale']) {
    ctx[op] = (...args: unknown[]) => log.push({op, args})
  }
  for (const prop of ['fillStyle', 'strokeStyle', 'lineWidth', 'font']) {
    Object.defineProperty(ctx, prop, {
      set(v: unknown) {
        styles.push(`${prop}=${String(v)}`)
      },
      get() {
        return ''
      },
    })
  }
  return {ctx, log, styles}
}

function canvasRect(ctx: unknown) {
  return {node: {width: 0, height: 0, getContext: () => ctx}, width: 300, height: 60}
}

function mountRuler(props: Record<string, unknown> = {}, opts: {rect?: unknown} = {}) {
  const stub = makeCtx()
  const inst = mountDef(compRuler.def, {
    props,
    rects: {'.cu-ruler-canvas': opts.rect === undefined ? canvasRect(stub.ctx) : opts.rect},
  })
  return {inst, ...stub}
}

function stateOf(inst: Mounted): RulerState {
  return (inst as unknown as {__ruler: RulerState}).__ruler
}

function touch(pageX: number, pageY: number) {
  return {touches: [{pageX, pageY}]} as never
}

describe('ruler canvas 初始化', () => {
  it('ready：canvas 2x 缓冲、ctx.scale(dpr/RATIO)、绘制主刻度文本、无 change（未 initialed）', () => {
    const {inst, ctx, log} = mountRuler()
    inst.ready()
    expect(stateOf(inst).isInitialed).toBe(true)
    expect(stateOf(inst).canvasWidth).toBe(600) // 300 * RATIO
    expect(log.filter((l) => l.op === 'scale')).toEqual([{op: 'scale', args: [1, 1]}]) // 2/2
    // draw 在 initialed 前会因 scrollTo 的 emit 多次执行，取去重后的文本集
    const texts = Array.from(new Set(log.filter((l) => l.op === 'fillText').map((l) => l.args[0])))
    expect(texts).toEqual(['0', '10', '20']) // 可视区 0..20（cx ≤ canvasWidth*2）
    expect(inst.eventsOf('change')).toEqual([]) // initialed 前的 draw 不派发
    void ctx
  })

  it('canvas 防御：rect null / 缺 node / 缺 width / getContext null → 不初始化不崩溃', () => {
    for (const rect of [null, {width: 300}, {node: {getContext: () => ({})}}, {node: {getContext: () => null}}]) {
      const {inst} = mountRuler({}, {rect: rect as never})
      expect(() => inst.ready()).not.toThrow()
      expect(stateOf(inst).isInitialed).toBe(false)
    }
  })

  it('__draw 守卫：无 ctx / canvasWidth 0 直接返回', () => {
    const {inst} = mountRuler()
    expect(() => inst.methods.__draw.call(inst, 0)).not.toThrow() // ready 前无 ctx
    inst.ready()
    stateOf(inst).canvasWidth = 0
    expect(() => inst.methods.__draw.call(inst, 0)).not.toThrow()
  })

  it('value 越出画布左界（x > canvasWidth）→ realMin 直读分支', () => {
    const {inst} = mountRuler()
    inst.ready()
    inst.events.length = 0
    inst.methods.__draw.call(inst, -50) // x = 650 > 600
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 0}}])
  })
})

describe('ruler value observer 与动画回位', () => {
  it('未 initialed 时 value 变更不回位不派发', () => {
    const {inst} = mountRuler()
    inst.setData({value: 5})
    expect(inst.events).toEqual([])
  })

  it('isScrolling 中 value 变更被忽略（对齐 watch(rulerValue)）', () => {
    const {inst} = mountRuler()
    inst.ready()
    stateOf(inst).isScrolling = true
    const count = inst.eventsOf('change').length
    inst.setData({value: 10})
    expect(inst.eventsOf('change').length).toBe(count)
  })

  it('value=50：动画滚动到 1500，change 终值 50；吸附后再 draw', () => {
    const {inst} = mountRuler()
    inst.ready()
    inst.events.length = 0
    inst.setData({value: 50})
    expect(inst.eventsOf('change').length).toBeGreaterThan(0)
    vi.advanceTimersByTime(600)
    const changes = inst.eventsOf('change').map((e) => (e.detail as {value: number}).value)
    expect(changes[changes.length - 1]).toBe(50)
    expect(stateOf(inst).isScrolling).toBe(false)
  })

  it('value observer 触发的 draw 走节流尾帧（10ms 内合并）', () => {
    const {inst} = mountRuler()
    inst.ready()
    inst.events.length = 0
    inst.setData({value: 10}) // 动画首帧同步 emit → 节流窗口内挂起 drawTimer
    expect(vi.getTimerCount()).toBeGreaterThan(1) // drawTimer + 动画帧
    vi.advanceTimersByTime(10) // 尾帧补发（drawTimer 回调）
    expect(inst.eventsOf('change').length).toBeGreaterThan(1)
    vi.advanceTimersByTime(600)
  })
})

describe('ruler 拖拽滚动与吸附', () => {
  it('拖到右端：动量 + 越界回弹到 maxScroll → change {value: 100}', () => {
    const {inst} = mountRuler()
    inst.ready()
    inst.events.length = 0
    inst.methods.onTouchStart.call(inst, touch(0, 0))
    inst.methods.onTouchMove.call(inst, touch(-120, 0)) // 2x 空间 -240 → offset 240，速度极大
    inst.methods.onTouchEnd.call(inst)
    vi.advanceTimersByTime(4000)
    const changes = inst.eventsOf('change').map((e) => (e.detail as {value: number}).value)
    expect(changes[changes.length - 1]).toBe(100)
    expect(stateOf(inst).isScrolling).toBe(false)
  })

  it('从右端拖回：回弹到 0 → change {value: 0}', () => {
    const {inst} = mountRuler({value: 100})
    inst.ready()
    vi.advanceTimersByTime(4000) // 初始定位动画落定
    inst.events.length = 0
    inst.methods.onTouchStart.call(inst, touch(0, 0))
    inst.methods.onTouchMove.call(inst, touch(120, 0)) // offset 3000→2760，负速度
    inst.methods.onTouchEnd.call(inst)
    vi.advanceTimersByTime(4000)
    const changes = inst.eventsOf('change').map((e) => (e.detail as {value: number}).value)
    expect(changes[changes.length - 1]).toBe(0)
  })

  it('触摸守卫：无 ticker / 无 touches / 空 touches 静默', () => {
    const {inst} = mountRuler()
    expect(() => {
      inst.methods.onTouchStart.call(inst, touch(0, 0)) // ticker null
      inst.methods.onTouchMove.call(inst, touch(0, 0))
      inst.methods.onTouchEnd.call(inst)
    }).not.toThrow()
    inst.ready()
    expect(() => {
      inst.methods.onTouchStart.call(inst, {touches: undefined} as never)
      inst.methods.onTouchMove.call(inst, {touches: []} as never)
      inst.methods.onTouchEnd.call(inst)
      inst.methods.onTouchStart.call(inst, touch(0, 0))
      inst.methods.onTouchMove.call(inst, touch(1, 1)) // 位移不足不成轴
      inst.methods.onTouchEnd.call(inst)
    }).not.toThrow()
    vi.advanceTimersByTime(100)
  })
})

describe('ruler 值域 observer', () => {
  it('未 initialed 时 scope/unit/min/max 变更跳过', () => {
    const {inst} = mountRuler()
    inst.setData({scope: [0, 50]})
    expect(inst.events).toEqual([])
  })

  it('initialed 后 scope 变更：ticker 重建 + realMax 钳制 change {value: 50}', () => {
    const {inst} = mountRuler({value: 50})
    inst.ready()
    vi.advanceTimersByTime(600)
    inst.events.length = 0
    inst.setData({scope: [0, 50]})
    const changes = inst.eventsOf('change').map((e) => (e.detail as {value: number}).value)
    expect(changes[changes.length - 1]).toBe(50)
    expect(stateOf(inst).isScrolling).toBe(false)
  })

  it('scope 形态非法（长度 1）回退 [0,100]；unit 非正回退 1', () => {
    const {inst} = mountRuler({value: 100})
    inst.ready()
    vi.advanceTimersByTime(600)
    inst.events.length = 0
    inst.setData({scope: [1]})
    expect(inst.eventsOf('change').length).toBeGreaterThan(0)
    inst.setData({unit: 0})
    expect(inst.eventsOf('change').length).toBeGreaterThan(0)
    vi.advanceTimersByTime(600)
  })

  it('stepTextPosition observer：bottom 置位并影响绘制布局', () => {
    const {inst, log} = mountRuler()
    inst.ready()
    expect(inst.data.isStepTextBottom).toBe(false)
    inst.setData({stepTextPosition: 'bottom'})
    expect(inst.data.isStepTextBottom).toBe(true)
    log.length = 0 // 清掉初始绘制的记录，只看 bottom 布局
    inst.methods.__draw.call(inst, 0) // isBottom 分支：y = 120 - 62、文本下移 70
    const yCalls = log.filter((l) => l.op === 'fillText').map((l) => l.args[2] as number)
    expect(yCalls.every((y) => y > 60)).toBe(true)
  })

  it('越界空白带：min=20 超出左界 → 左侧 20 格 outRange 淡色，主刻度文本 0..40', () => {
    const {inst, log, styles} = mountRuler({min: 20})
    inst.ready()
    const texts = Array.from(new Set(log.filter((l) => l.op === 'fillText').map((l) => l.args[0])))
    // 可视区 cx ≤ canvasWidth*2=1200 → i ≤ 40；major=step 整数倍
    expect(texts).toEqual(['0', '10', '20', '30', '40'])
    expect(styles).toContain('fillStyle=#E2E4EA') // MINOR（越界淡色）
    expect(styles).toContain('fillStyle=#C5CAD5') // MAJOR（范围内）
    expect(styles).toContain('strokeStyle=#858B9C') // MAJOR_STROKE
    expect(inst.eventsOf('change')).toEqual([]) // initialed 前
  })
})

describe('ruler detached 清理', () => {
  it('detached：drawTimer 清理、ticker 销毁、定时器清空', () => {
    const {inst} = mountRuler()
    inst.ready()
    inst.setData({value: 10}) // 节流窗口内挂起 drawTimer
    inst.detached()
    const count = inst.eventsOf('change').length
    vi.advanceTimersByTime(1000)
    expect(inst.eventsOf('change').length).toBe(count) // 无后续 draw/change
    expect(vi.getTimerCount()).toBe(0)
  })
})

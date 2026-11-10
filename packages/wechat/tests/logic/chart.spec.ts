/**
 * chart 坐标换算测试：极值推导（computedMax/Min 的 10^k 取整）、xaxis/yaxis、
 * lower、单点坐标（含单点/空数据/退化区间的 Infinity 防护）、series 组装、
 * hex→rgba 渐变色解析。逐一对照 Vue 版 Chart.vue 的 computed 链。
 */
import {describe, it, expect, afterEach} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'
import {
  AREA_GRADIENT_ALPHAS,
  CHART_GRID_COLOR_FALLBACK,
  CHART_PATH_DEFAULT_COLOR,
  CHART_TEXT_COLOR_FALLBACK,
  computeLower,
  computeMax,
  computeMin,
  computeOffsets,
  computePoint,
  computeSeries,
  computeStep,
  computeXAxis,
  computeYAxis,
  hexToRgba,
  resolveSize,
} from '../../src/components/chart/logic'

describe('chart/computedMax & computedMin', () => {
  const ds = (values: number[]) => [{values}]

  it('显式 max/min 优先（Vue props.max !== undefined 短路）', () => {
    expect(computeMax(ds([1, 500]), 100)).toBe(100)
    expect(computeMin(ds([-500, 1]), -10)).toBe(-10)
  })

  it('推导极值并做 10^k 取整：max 向上、min 向下', () => {
    // max 500 → 5*10^2 → ceil(5)*100 = 500；min 123 → 1.23 → floor 1 * 100 = 100
    expect(computeMax(ds([500]), undefined)).toBe(500)
    expect(computeMin(ds([123]), undefined)).toBe(100)
    expect(computeMax(ds([12]), undefined)).toBe(20)
    expect(computeMax(ds([10]), undefined)).toBe(10)
  })

  it('空数据防护：无有限值返回 0（Vue 版为 ±Infinity，修复项）', () => {
    expect(computeMax([], undefined)).toBe(0)
    expect(computeMax(ds([]), undefined)).toBe(0)
    expect(computeMin([], undefined)).toBe(0)
    expect(computeMin([{values: []}], undefined)).toBe(0)
  })

  it('非有限值被过滤', () => {
    expect(computeMax([{values: [NaN, Infinity, 8]}], undefined)).toBe(8)
    expect(computeMin([{values: [NaN, -Infinity, 8]}], undefined)).toBe(8)
  })

  it('多 datasets 取全局极值', () => {
    expect(computeMax([{values: [1, 2]}, {values: [300, 4]}], undefined)).toBe(300)
    expect(computeMin([{values: [5, 2]}, {values: [3, -40]}], undefined)).toBe(-40)
  })
})

describe('chart/computedStep & lower', () => {
  it('显式 step 优先，否则 (max-min)/lines', () => {
    expect(computeStep(100, 0, 10, 5)).toBe(10)
    expect(computeStep(100, 0, undefined, 5)).toBe(20)
  })

  it('lower = max - (lines-1)*step', () => {
    expect(computeLower(100, 5, 20)).toBe(20)
    expect(computeLower(0, 5, 0)).toBe(0)
  })
})

describe('chart/offset & size（unit 固定 16）', () => {
  it('offset：top 0.2 / bottom 0.5 / left shift / right 0.2 × unit', () => {
    expect(computeOffsets(0.6, 16)).toEqual({top: 3.2, bottom: 8, left: 9.6, right: 3.2})
  })

  it('size：数字原样 parseFloat，rem 按 unit 换算', () => {
    expect(resolveSize([480, 320], 16)).toEqual([480, 320])
    expect(resolveSize(['30rem', '20rem'], 16)).toEqual([480, 320])
    expect(resolveSize(['12.5rem', 100], 16)).toEqual([200, 100])
  })
})

describe('chart/xaxis & yaxis', () => {
  it('xaxis：deltaX = innerWidth/(n-1)，单点防护 offset 恒 0', () => {
    expect(computeXAxis(['a', 'b', 'c'], 200)).toEqual([
      {offset: 0, label: 'a'},
      {offset: 100, label: 'b'},
      {offset: 200, label: 'c'},
    ])
    // Vue 版单点为 1/0=Infinity → 0*Infinity=NaN，修复后为 0
    expect(computeXAxis(['only'], 200)).toEqual([{offset: 0, label: 'only'}])
    expect(computeXAxis([], 200)).toEqual([])
  })

  it('yaxis：lines 条刻度 + 底线 min（offset=innerHeight），label 经 format', () => {
    const items = computeYAxis(5, 100, 100, 0, 20, (v) => String(v))
    expect(items).toHaveLength(6)
    expect(items.map((i) => i.offset)).toEqual([0, 20, 40, 60, 80, 100])
    expect(items.map((i) => i.label)).toEqual(['100', '80', '60', '40', '20', '0'])
  })
})

describe('chart/单点坐标（Vue paths computed + 防护）', () => {
  // 几何：lines=5、innerHeight=100 → deltaY=20；max=100、min=0、step=20 → lower=20
  const geo = {deltaY: 20, innerHeight: 100, max: 100, min: 0, lower: 20}
  const point = (value: number, index = 0, deltaX = 0) =>
    computePoint(value, index, deltaX, geo.deltaY, geo.innerHeight, geo.max, geo.min, geo.lower)

  it('value=max → y=0（顶部）；value=lower → y=innerHeight-deltaY', () => {
    expect(point(100).y).toBe(0)
    expect(point(20).y).toBe(80)
  })

  it('区间内线性：value=60 → y=(1-40/80)*80=40', () => {
    expect(point(60).y).toBe(40)
  })

  it('value<lower：落入底部过渡带，value=min → y=innerHeight', () => {
    expect(point(10).y).toBe(100 - (1 - 10 / 20) * 20)
    expect(point(0).y).toBe(100)
  })

  it('x 按 index*deltaX 推进', () => {
    expect(point(60, 0, 50).x).toBe(0)
    expect(point(60, 3, 50).x).toBe(150)
  })

  it('退化区间防护：max===lower（分母 0）按 0 处理，不产生 NaN', () => {
    // max=20、min=0、step=0 → lower=20，value=20：Vue 版 (20-20)/(20-20)=NaN
    expect(computePoint(20, 0, 0, 20, 100, 20, 0, 20).y).toBe(80)
  })

  it('退化区间防护：lower===min 时分母 0 → ratio 按 0（y=innerHeight-deltaY），不产生 NaN', () => {
    expect(computePoint(-1, 0, 0, 20, 100, 20, 20, 20).y).toBe(80)
  })
})

describe('chart/computeSeries', () => {
  it('默认色/线宽（#fa8919 / 1），多值 deltaX=innerWidth/(n-1)', () => {
    const series = computeSeries([{values: [0, 100]}], {
      innerWidth: 200,
      innerHeight: 100,
      lines: 5,
      max: 100,
      min: 0,
      step: 20,
    })
    expect(series[0].color).toBe(CHART_PATH_DEFAULT_COLOR)
    expect(series[0].lineWidth).toBe(1)
    expect(series[0].points).toEqual([
      {x: 0, y: 100},
      {x: 200, y: 0},
    ])
  })

  it('显式 color/width/theme 透传', () => {
    const series = computeSeries([{color: '#198cff', width: 3, theme: 'region', values: [1]}], {
      innerWidth: 200,
      innerHeight: 100,
      lines: 5,
      max: 100,
      min: 0,
      step: 20,
    })
    expect(series[0].color).toBe('#198cff')
    expect(series[0].lineWidth).toBe(3)
    expect(series[0].theme).toBe('region')
  })

  it('单点/空数据防护：单点 x 恒 0，空 values 无点位（不产生 Infinity）', () => {
    const series = computeSeries([{values: [50]}, {values: []}], {
      innerWidth: 200,
      innerHeight: 100,
      lines: 5,
      max: 100,
      min: 0,
      step: 20,
    })
    expect(series[0].points).toEqual([{x: 0, y: expect.any(Number)}])
    expect(Number.isFinite(series[0].points[0].y)).toBe(true)
    expect(series[1].points).toEqual([])
  })

  it('非有限值被过滤后再计算 deltaX（Vue Math.apply 语义的防护扩展）', () => {
    const series = computeSeries([{values: [0, NaN, 100]}], {
      innerWidth: 200,
      innerHeight: 100,
      lines: 5,
      max: 100,
      min: 0,
      step: 20,
    })
    expect(series[0].points).toEqual([
      {x: 0, y: 100},
      {x: 200, y: 0},
    ])
  })
})

describe('chart/hexToRgba（渐变 stops 解析）', () => {
  it('#rgb/#rrggbb → rgba 串；非法输入返回 null', () => {
    expect(hexToRgba('#fa8919', 0.4)).toBe('rgba(250,137,25,0.4)')
    expect(hexToRgba('#F89', 0.3)).toBe('rgba(255,136,153,0.3)')
    expect(hexToRgba('rgb(1,2,3)', 0.4)).toBe(null)
    expect(hexToRgba('', 0.4)).toBe(null)
  })

  it('面积渐变三档透明度对齐 SVG linearGradient（0.4/0.3/0.1）', () => {
    expect(AREA_GRADIENT_ALPHAS).toEqual([0.4, 0.3, 0.1])
  })
})

// ---------------------------------------------------------------------------
// chart 组件实例（index.ts）：canvas 2d 初始化链 / observers 重绘 / 绘制调用
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/chart/index'))

interface RecordedCall {
  method: string
  args: unknown[]
}

interface GradientRec {
  stops: Array<[number, string]>
  addColorStop(offset: number, color: string): void
}

/** 假 2d context：记录全部调用；createLinearGradient 返回记录 stops 的 stub */
function makeCtx() {
  const calls: RecordedCall[] = []
  const gradients: GradientRec[] = []
  const ctx: Record<string, unknown> = {}
  for (const m of [
    'clearRect',
    'save',
    'restore',
    'translate',
    'scale',
    'beginPath',
    'moveTo',
    'lineTo',
    'stroke',
    'fill',
    'closePath',
    'fillText',
  ]) {
    ctx[m] = (...args: unknown[]) => {
      calls.push({method: m, args})
    }
  }
  ctx.createLinearGradient = (...args: unknown[]) => {
    calls.push({method: 'createLinearGradient', args})
    const g: GradientRec = {stops: [], addColorStop(offset, color) { this.stops.push([offset, color]) }}
    gradients.push(g)
    return g
  }
  return {ctx: ctx as never, calls, gradients}
}

/** 假 canvas node：getContext('2d') 可配置返回 ctx 或 null */
function makeNode(ctx: unknown) {
  return {
    width: 0,
    height: 0,
    getContext(type: string) {
      return type === '2d' ? ctx : null
    },
  }
}

interface ChartState {
  initialized: boolean
  width: number
  height: number
  dpr: number
  gridColor: string
  textColor: string
  labelSize: number
  valueSize: number
}

function chartState(inst: Mounted): ChartState {
  return (inst as unknown as {__chartState: ChartState}).__chartState
}

const DEFAULT_RECTS = () => {
  const {ctx, calls, gradients} = makeCtx()
  return {
    rects: {
      '#cv': {node: makeNode(ctx), width: 480, height: 320},
    } as Record<string, unknown>,
    calls,
    gradients,
  }
}

function callsOf(calls: RecordedCall[], method: string): RecordedCall[] {
  return calls.filter((c) => c.method === method)
}

afterEach(() => {
  // dpr/windowWidth 特殊取值的测试恢复 wx 桩
  ;(globalThis as unknown as {wx: {getWindowInfo: () => unknown}}).wx.getWindowInfo = () => ({
    pixelRatio: 2,
    windowWidth: 375,
  })
})

describe('chart 组件 ready 初始化链', () => {
  it('token 查询 + canvas node + 首绘：backing store ×dpr、ctx.scale、网格/文本绘制', () => {
    const {rects, calls} = DEFAULT_RECTS()
    ;(rects['.cu-chart'] as Record<string, unknown>) = {
      '--chart-line-color': '#abcdef',
      '--chart-text-color': '#123456',
      '--chart-label-size': '11px',
      '--chart-value-size': '10px',
    }
    const inst = mountDef(comp.def, {
      props: {
        labels: ['a', 'b', 'c'],
        datasets: [{color: '#198cff', values: [0, 100]}],
      },
      rects: rects as never,
    })
    inst.ready()

    expect(inst.data.canvasStyle).toBe('width:480px;height:320px;')
    const st = chartState(inst)
    expect(st.initialized).toBe(true)
    expect(st.width).toBe(480)
    expect(st.height).toBe(320)
    expect(st.dpr).toBe(2)
    expect(st.gridColor).toBe('#abcdef')
    expect(st.textColor).toBe('#123456')
    expect(st.labelSize).toBe(11)
    expect(st.valueSize).toBe(10)

    // backing store：480×320 × dpr2
    const node = (rects['#cv'] as {node: {width: number; height: number}}).node
    expect(node.width).toBe(960)
    expect(node.height).toBe(640)
    expect(calls[0].method).toBe('scale') // __applyBackingStore 先于 __draw
    expect(callsOf(calls, 'scale')[0].args).toEqual([2, 2])
    // 绘制链：clear → save → translate(shift*16, 0.2*16)
    expect(callsOf(calls, 'clearRect')).toHaveLength(1)
    expect(callsOf(calls, 'translate')[0].args).toEqual([9.6, 3.2])
    // 网格线（yaxis 5+1 条 + xaxis 3 条短刻度）+ 折线起点
    expect(callsOf(calls, 'moveTo').length).toBe(10)
    expect(callsOf(calls, 'stroke')).toHaveLength(2) // 网格 1 次 + 折线 1 次
    // y 轴文本 right 对齐（6 条），x 轴 center（3 条）
    expect(callsOf(calls, 'fillText')).toHaveLength(9)
    // 折线：beginPath → moveTo + (n-1)×lineTo → stroke（两点 → 1 次 lineTo）
    expect(callsOf(calls, 'lineTo')).toHaveLength(10) // 网格 6 + x 轴刻度 3 + 折线 1
  })

  it('无 token 时回退兜底色 + rpx 字号折算（windowWidth 375 → 0.5）', () => {
    const {rects, calls} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {rects: rects as never})
    inst.ready()
    const st = chartState(inst)
    expect(st.gridColor).toBe(CHART_GRID_COLOR_FALLBACK)
    expect(st.textColor).toBe(CHART_TEXT_COLOR_FALLBACK)
    expect(st.labelSize).toBe(11) // 22rpx × 0.5
    expect(st.valueSize).toBe(10) // 20rpx × 0.5
    expect(inst.data.canvasStyle).toBe('width:480px;height:320px;')
    // 空数据：网格仍绘制（yaxis 6 条横线），无折线
    expect(callsOf(calls, 'stroke')).toHaveLength(1)
    expect(callsOf(calls, 'lineTo')).toHaveLength(6)
    expect(callsOf(calls, 'fillText')).toHaveLength(6)
  })

  it('dpr 缺省回退 2（|| 分支）；窗宽缺失字号 NaN 兜底不崩溃', () => {
    ;(globalThis as unknown as {wx: {getWindowInfo: () => unknown}}).wx.getWindowInfo = () => ({})
    const {rects} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {rects: rects as never})
    expect(() => inst.ready()).not.toThrow()
    expect(chartState(inst).dpr).toBe(2)
  })

  it('无 canvas node：初始化中止（initialized false）；__applySize 先于查询已写样式', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-chart': {}} as never})
    inst.ready()
    expect(chartState(inst).initialized).toBe(false)
    expect(inst.data.canvasStyle).toBe('width:480px;height:320px;')
  })

  it('node.getContext 返回 null：中止', () => {
    const inst = mountDef(comp.def, {
      rects: {'#cv': {node: makeNode(null), width: 480, height: 320}} as never,
    })
    inst.ready()
    expect(chartState(inst).initialized).toBe(false)
  })
})

describe('chart observers 重绘', () => {
  it('ready 前 observers 短路（initialized false）', () => {
    const inst = mountDef(comp.def)
    inst.setData({labels: ['a']})
    expect(inst.data.canvasStyle).toBe('') // __applySize 未执行
  })

  it('ready 后 props 变更重绘；同尺寸不重复写 canvasStyle', () => {
    const {rects, calls} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {rects: rects as never})
    inst.ready()
    const style = inst.data.canvasStyle
    const strokeCount = callsOf(calls, 'clearRect').length

    inst.setData({lines: 3}) // 非尺寸变更 → __applySize 早退分支 → 重绘
    expect(inst.data.canvasStyle).toBe(style)
    expect(callsOf(calls, 'clearRect').length).toBe(strokeCount + 1)
  })

  it('size 变更：canvasStyle 更新 + backing store 重设（initialized 分支）', () => {
    const {rects, calls} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {size: [480, 320]},
      rects: rects as never,
    })
    inst.ready()
    inst.setData({size: [200, 160]})
    expect(inst.data.canvasStyle).toBe('width:200px;height:160px;')
    const node = (rects['#cv'] as {node: {width: number; height: number}}).node
    expect(node.width).toBe(400) // 重设 backing store
    expect(node.height).toBe(320)
    expect(callsOf(calls, 'scale').length).toBe(2)
  })
})

describe('chart 绘制分支（__draw / __drawSeries / __makeGradient）', () => {
  it('ctx 未就绪：__draw 直接返回（!ctx 分支）', () => {
    const inst = mountDef(comp.def)
    expect(() => inst.methods.__draw()).not.toThrow()
  })

  it('format 函数属性注入：y 轴 label 经用户 format（format 非 observer 键，重绘触发）', () => {
    const {rects, calls} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {datasets: [{values: [0, 100]}], lines: 2},
      rects: rects as never,
    })
    inst.ready()
    inst.setData({format: (v: number) => `<${v}>`})
    inst.methods.__draw() // format 不在 observer 键内：手动触发重绘
    const texts = callsOf(calls, 'fillText').map((c) => c.args[0] as string)
    expect(texts).toContain('<100>')
    expect(texts).toContain('<0>')
  })

  it('theme=region：面积 fill + 渐变 stops（0.4/0.3/0.1）', () => {
    const {rects, calls, gradients} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {datasets: [{color: '#fa8919', theme: 'region', values: [0, 100]}], lines: 5},
      rects: rects as never,
    })
    inst.ready()
    expect(callsOf(calls, 'fill')).toHaveLength(1)
    expect(callsOf(calls, 'closePath')).toHaveLength(1)
    expect(gradients).toHaveLength(1)
    expect(gradients[0].stops).toEqual([
      [0, 'rgba(250,137,25,0.4)'],
      [0.5, 'rgba(250,137,25,0.3)'],
      [1, 'rgba(250,137,25,0.1)'],
    ])
    // 描边走渐变（非 heat：strokeStyle = s.color）
  })

  it("theme=heat：描边用渐变；非 heat 用 dataset color（|| 分支）", () => {
    const {rects, calls, gradients} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {datasets: [{color: '#198cff', theme: 'heat', values: [0, 50, 100]}]},
      rects: rects as never,
    })
    inst.ready()
    expect(callsOf(calls, 'fill')).toHaveLength(0) // heat 无面积
    expect(gradients).toHaveLength(1)

    const plain = DEFAULT_RECTS()
    const inst2 = mountDef(comp.def, {
      props: {datasets: [{values: [1, 2]}]},
      rects: plain.rects as never,
    })
    inst2.ready()
    // 渐变对象对每个 series 总是创建（仅 region/heat 才用作 stroke/fill 样式）
    expect(plain.gradients).toHaveLength(1)
  })

  it('单点 dataset：minY===maxY → 渐变 null，描边回退 color（|| 分支）', () => {
    const {rects, calls, gradients} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {datasets: [{color: '#ff0000', theme: 'heat', values: [50]}]},
      rects: rects as never,
    })
    inst.ready()
    expect(gradients).toHaveLength(0)
    // 网格 stroke 1 次 + 折线 stroke 1 次
    expect(callsOf(calls, 'stroke')).toHaveLength(2)
    expect(callsOf(calls, 'moveTo').some((c) => c.args.length === 2)).toBe(true)
  })

  it('空 values dataset：__drawSeries 早退（!points.length）', () => {
    const {rects, calls} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {datasets: [{values: []}, {values: [NaN, Infinity]}]},
      rects: rects as never,
    })
    inst.ready()
    // 仅网格线（yaxis 6 条），无折线 stroke
    expect(callsOf(calls, 'lineTo')).toHaveLength(6)
    expect(callsOf(calls, 'stroke')).toHaveLength(1)
  })

  it('非法 color：hexToRgba null → addColorStop 回退原 color（|| 分支）', () => {
    const {rects, gradients} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {datasets: [{color: 'not-a-hex', theme: 'region', values: [0, 100]}]},
      rects: rects as never,
    })
    inst.ready()
    expect(gradients).toHaveLength(1)
    expect(gradients[0].stops).toEqual([
      [0, 'not-a-hex'],
      [0.5, 'not-a-hex'],
      [1, 'not-a-hex'],
    ])
  })

  it('显式 max/min/step props 参与坐标推导（?? undefined 分支）', () => {
    const {rects, calls} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {
      props: {datasets: [{values: [0, 100]}], max: 200, min: -100, step: 50},
      rects: rects as never,
    })
    inst.ready()
    const labels = callsOf(calls, 'fillText').map((c) => c.args[0] as string)
    expect(labels).toContain('200')
    expect(labels).toContain('-100')
  })
})

describe('chart detached', () => {
  it('detached：清理定时器登记表', () => {
    const {rects} = DEFAULT_RECTS()
    const inst = mountDef(comp.def, {rects: rects as never})
    inst.ready()
    expect(() => inst.detached()).not.toThrow()
    expect((inst as unknown as {__chartState: {timers: {size(): number}}}).__chartState.timers.size()).toBe(0)
  })
})

/**
 * chart 坐标换算测试：极值推导（computedMax/Min 的 10^k 取整）、xaxis/yaxis、
 * lower、单点坐标（含单点/空数据/退化区间的 Infinity 防护）、series 组装、
 * hex→rgba 渐变色解析。逐一对照 Vue 版 Chart.vue 的 computed 链。
 */
import {describe, it, expect} from 'vitest'
import {
  AREA_GRADIENT_ALPHAS,
  CHART_PATH_DEFAULT_COLOR,
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

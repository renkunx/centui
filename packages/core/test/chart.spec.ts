/**
 * Chart 几何契约（三端共用）：空数据/单点/非有限值/退化区间不得产生
 * Infinity 或 NaN。期望值同时锁住 Vue、React 与微信小程序的绘制坐标。
 */
import { describe, expect, it } from 'vitest'
import {
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
  type ChartDataset,
} from '../src/chart'

const ds = (values: number[]): ChartDataset[] => [{ values }]

describe('computeMax / computeMin', () => {
  it('explicit max/min wins', () => {
    expect(computeMax(ds([1, 500]), 100)).toBe(100)
    expect(computeMin(ds([-500, 1]), -10)).toBe(-10)
  })

  it('derives 10^k rounded bounds', () => {
    expect(computeMax(ds([500]))).toBe(500)
    expect(computeMin(ds([123]))).toBe(100)
    expect(computeMax(ds([12]))).toBe(20)
    expect(computeMax(ds([10]))).toBe(10)
  })

  it('empty data → 0 instead of ±Infinity', () => {
    expect(computeMax([])).toBe(0)
    expect(computeMax(ds([]))).toBe(0)
    expect(computeMin([])).toBe(0)
    expect(computeMin([{ values: [] }])).toBe(0)
  })

  it('ignores non-finite values', () => {
    expect(computeMax([{ values: [NaN, Infinity, 8] }])).toBe(8)
    expect(computeMin([{ values: [NaN, -Infinity, 8] }])).toBe(8)
  })

  it('uses global bounds across datasets', () => {
    expect(computeMax([{ values: [1, 2] }, { values: [300, 4] }])).toBe(300)
    expect(computeMin([{ values: [5, 2] }, { values: [3, -40] }])).toBe(-40)
  })
})

describe('step / lower / offsets / size', () => {
  it('honours explicit step, otherwise (max-min)/lines', () => {
    expect(computeStep(100, 0, 10, 5)).toBe(10)
    expect(computeStep(100, 0, undefined, 5)).toBe(20)
  })

  it('lower = max - (lines-1)*step', () => {
    expect(computeLower(100, 5, 20)).toBe(20)
    expect(computeLower(0, 5, 0)).toBe(0)
  })

  it('offsets are derived from unit', () => {
    expect(computeOffsets(0.6, 16)).toEqual({ top: 3.2, bottom: 8, left: 9.6, right: 3.2 })
  })

  it('resolves numeric and rem sizes', () => {
    expect(resolveSize([480, 320], 16)).toEqual([480, 320])
    expect(resolveSize(['30rem', '20rem'], 16)).toEqual([480, 320])
    expect(resolveSize(['12.5rem', 100], 16)).toEqual([200, 100])
  })
})

describe('axes', () => {
  it('x axis divides by n-1 and guards single/empty labels', () => {
    expect(computeXAxis(['a', 'b', 'c'], 200)).toEqual([
      { offset: 0, label: 'a' },
      { offset: 100, label: 'b' },
      { offset: 200, label: 'c' },
    ])
    expect(computeXAxis(['only'], 200)).toEqual([{ offset: 0, label: 'only' }])
    expect(computeXAxis([], 200)).toEqual([])
  })

  it('y axis emits lines ticks plus the min baseline', () => {
    const items = computeYAxis(5, 100, 100, 0, 20, v => String(v))
    expect(items).toHaveLength(6)
    expect(items.map(i => i.offset)).toEqual([0, 20, 40, 60, 80, 100])
    expect(items.map(i => i.label)).toEqual(['100', '80', '60', '40', '20', '0'])
  })
})

describe('computePoint', () => {
  // lines=5, innerHeight=100 → deltaY=20; max=100, min=0, step=20 → lower=20
  const geo = { deltaY: 20, innerHeight: 100, max: 100, min: 0, lower: 20 }
  const point = (value: number, index = 0, deltaX = 0) =>
    computePoint(value, index, deltaX, geo.deltaY, geo.innerHeight, geo.max, geo.min, geo.lower)

  it('maps max to the top and lower to the last tick', () => {
    expect(point(100).y).toBe(0)
    expect(point(20).y).toBe(80)
  })

  it('interpolates linearly', () => {
    expect(point(60).y).toBe(40)
  })

  it('drops below-lower values into the bottom band', () => {
    expect(point(10).y).toBe(100 - (1 - 10 / 20) * 20)
  })

  it('degenerate ranges fall back to 0 instead of Infinity/NaN', () => {
    const flat = computePoint(0, 0, 0, 20, 100, 0, 0, 0)
    expect(flat).toEqual({ x: 0, y: 80 })
    expect(Number.isFinite(flat.y)).toBe(true)
  })
})

describe('computeSeries', () => {
  const opts = { innerWidth: 200, innerHeight: 100, lines: 5, max: 100, min: 0, step: 20 }

  it('returns one point per finite value', () => {
    const [series] = computeSeries(ds([100, 50, 0]), opts)
    expect(series.color).toBe(CHART_PATH_DEFAULT_COLOR)
    expect(series.lineWidth).toBe(1)
    expect(series.points.map(p => p.x)).toEqual([0, 100, 200])
    expect(series.points.every(p => Number.isFinite(p.y))).toBe(true)
  })

  it('single value has zero x offset and remains finite', () => {
    const [series] = computeSeries(ds([42]), opts)
    expect(series.points).toHaveLength(1)
    expect(Number.isFinite(series.points[0].x)).toBe(true)
    expect(Number.isFinite(series.points[0].y)).toBe(true)
  })

  it('empty values produce no points (no Infinity)', () => {
    const [series] = computeSeries(ds([]), opts)
    expect(series.points).toEqual([])
  })

  it('honours per-dataset colour, width and theme', () => {
    const [series] = computeSeries([{ values: [1, 2], color: '#123456', width: 2, theme: 'region' }], opts)
    expect(series.color).toBe('#123456')
    expect(series.lineWidth).toBe(2)
    expect(series.theme).toBe('region')
  })
})

describe('hexToRgba', () => {
  it('parses short and long hex', () => {
    expect(hexToRgba('#abc', 0.4)).toBe('rgba(170,187,204,0.4)')
    expect(hexToRgba('#fa8919', 0.3)).toBe('rgba(250,137,25,0.3)')
  })

  it('returns null for invalid input', () => {
    expect(hexToRgba('red', 0.4)).toBeNull()
    expect(hexToRgba('#12', 0.4)).toBeNull()
  })
})

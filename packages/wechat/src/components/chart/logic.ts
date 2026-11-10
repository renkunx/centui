/**
 * chart 纯逻辑（对照 Vue 版 Chart.vue 的全部 computed：computedMax/computedMin/
 * computedStep/offset/width/height/innerWidth/innerHeight/xaxis/yaxis/lower/paths）。
 * 坐标换算与 SVG 语义逐一对应；单点/空数据的 Infinity 防护为修复项（Vue 版
 * labels.length-1 与 values.length-1 在单点时产生 1/0=Infinity，0*Infinity=NaN）。
 */

export interface ChartDataset {
  color?: string
  width?: number
  /** 'heat'（描边渐变）| 'region'（面积渐变），其余为普通折线 */
  theme?: string
  values: number[]
}

/** Vue path 内联默认色（stroke: data.color || '#fa8919'） */
export const CHART_PATH_DEFAULT_COLOR = '#fa8919'

/** SVG linearGradient 三档透明度（0%/50%/100% → 0.4/0.3/0.1） */
export const AREA_GRADIENT_ALPHAS = [0.4, 0.3, 0.1] as const

/** 小程序侧 token 兜底值（--chart-line-color / --chart-text-color 的默认值） */
export const CHART_GRID_COLOR_FALLBACK = '#ccc'
export const CHART_TEXT_COLOR_FALLBACK = '#666f83'

/** Vue computedMax：显式 max 优先；否则由 datasets 推导并做 10^k 取整（ceil）。
 *  空数据防护：无任何有限值时返回 0（Vue 版返回 -Infinity，下游全部 NaN）。 */
export function computeMax(datasets: ChartDataset[], max?: number): number {
  if (max !== undefined) {
    return max
  }
  const values = flatValues(datasets).filter((v) => Number.isFinite(v))
  if (!values.length) {
    return 0
  }
  let m = Math.max(...values)
  let multiple = 1
  while (m > 10) {
    multiple *= 10
    m /= 10
  }
  return Math.ceil(m) * multiple
}

/** Vue computedMin：显式 min 优先；否则推导并做 10^k 取整（floor）；空数据防护 → 0 */
export function computeMin(datasets: ChartDataset[], min?: number): number {
  if (min !== undefined) {
    return min
  }
  const values = flatValues(datasets).filter((v) => Number.isFinite(v))
  if (!values.length) {
    return 0
  }
  let m = Math.min(...values)
  let multiple = 1
  while (m > 10) {
    multiple *= 10
    m = m / 10
  }
  return Math.floor(m) * multiple
}

/** Vue computedStep：显式 step 优先；否则 (max-min)/lines */
export function computeStep(max: number, min: number, step: number | undefined, lines: number): number {
  return step !== undefined ? step : (max - min) / lines
}

/** Vue offset computed（unit 为根字号语义，小程序固定 16，见组件头注释） */
export function computeOffsets(
  shift: number,
  unit: number,
): {top: number; bottom: number; left: number; right: number} {
  return {
    top: 0.2 * unit,
    bottom: 0.5 * unit,
    left: shift * unit,
    right: 0.2 * unit,
  }
}

/** Vue width/height computed：'30rem' → 30*unit，其余 parseFloat */
export function resolveSize(size: Array<string | number>, unit: number): [number, number] {
  const resolve = (v: string | number): number => {
    if (typeof v === 'string' && v.indexOf('rem') !== -1) {
      return parseFloat(v) * unit
    }
    return parseFloat(String(v))
  }
  return [resolve(size[0]), resolve(size[1])]
}

/** Vue xaxis computed：deltaX = innerWidth/(labels.length-1)；单点防护 → 0 */
export function computeXAxis(
  labels: string[],
  innerWidth: number,
): Array<{offset: number; label: string}> {
  const deltaX = labels.length > 1 ? innerWidth / (labels.length - 1) : 0
  return labels.map((label, index) => ({
    offset: index * deltaX,
    label,
  }))
}

/** Vue yaxis computed：lines 条横线（max 递减 step）+ 底线（min） */
export function computeYAxis(
  lines: number,
  innerHeight: number,
  max: number,
  min: number,
  step: number,
  format: (val: number) => string,
): Array<{offset: number; label: string}> {
  const items: Array<{offset: number; label: string}> = []
  const deltaY = innerHeight / lines
  for (let i = 0; i < lines; i++) {
    items.push({
      offset: i * deltaY,
      label: format(max - i * step),
    })
  }
  items.push({
    offset: innerHeight,
    label: format(min),
  })
  return items
}

/** Vue lower computed：max - (lines-1)*step */
export function computeLower(max: number, lines: number, step: number): number {
  return max - (lines - 1) * step
}

export interface ChartPoint {
  x: number
  y: number
}

/**
 * Vue paths computed 的单点坐标换算（含 Infinity/NaN 防护）：
 *   value < lower：y = innerHeight - (1 - (lower-value)/(lower-min)) * deltaY
 *   否则：        y = (1 - (value-lower)/(max-lower)) * (innerHeight - deltaY)
 * 分母为 0（max===lower 或 lower===min 的退化区间）时按 0 处理。
 */
export function computePoint(
  value: number,
  index: number,
  deltaX: number,
  deltaY: number,
  innerHeight: number,
  max: number,
  min: number,
  lower: number,
): ChartPoint {
  const x = index * deltaX
  let y: number
  if (value < lower) {
    const denom = lower - min
    const ratio = denom === 0 ? 0 : (lower - value) / denom
    y = innerHeight - (1 - ratio) * deltaY
  } else {
    const denom = max - lower
    const ratio = denom === 0 ? 0 : (value - lower) / denom
    y = (1 - ratio) * (innerHeight - deltaY)
  }
  return {x, y}
}

export interface ChartSeries {
  color: string
  lineWidth: number
  /** 'heat' → 描边渐变；'region' → 面积渐变 + 描边 */
  theme?: string
  points: ChartPoint[]
}

/** Vue paths computed：逐 dataset 产出点位（单点/空数据防护内联） */
export function computeSeries(
  datasets: ChartDataset[],
  opts: {
    innerWidth: number
    innerHeight: number
    lines: number
    max: number
    min: number
    step: number
  },
): ChartSeries[] {
  const {innerWidth, innerHeight, lines, max, min, step} = opts
  const lower = computeLower(max, lines, step)
  const deltaY = innerHeight / lines
  return datasets.map((data) => {
    const values = (data.values || []).filter((v) => Number.isFinite(v))
    const deltaX = values.length > 1 ? innerWidth / (values.length - 1) : 0
    const points = values.map((value, index) =>
      computePoint(value, index, deltaX, deltaY, innerHeight, max, min, lower),
    )
    return {
      color: data.color || CHART_PATH_DEFAULT_COLOR,
      lineWidth: data.width || 1,
      theme: data.theme,
      points,
    }
  })
}

/** hex（#rgb/#rrggbb）→ rgba(r,g,b,a)；不可解析时原样返回并交由调用方兜底 */
export function hexToRgba(hex: string, alpha: number): string | null {
  let h = (hex || '').trim()
  if (h.charAt(0) !== '#') {
    return null
  }
  h = h.slice(1)
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return null
  }
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function flatValues(datasets: ChartDataset[]): number[] {
  const out: number[] = []
  for (const d of datasets || []) {
    for (const v of (d && d.values) || []) {
      out.push(v)
    }
  }
  return out
}

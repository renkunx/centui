/**
 * chart 纯逻辑：极值推导、坐标换算、series 组装已统一到 @centui/core（三端共用
 * 同一份实现，见 core/src/chart.ts）。本文件只保留小程序 Canvas 渲染侧的
 * token 兜底常量，其余名称原样 re-export，保证既有调用与测试不变。
 */
export {
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
} from '@centui/core'
export type { ChartDataset, ChartPoint, ChartSeries } from '@centui/core'

/** 小程序侧 token 兜底值（--chart-line-color / --chart-text-color 的默认值） */
export const CHART_GRID_COLOR_FALLBACK = '#ccc'
export const CHART_TEXT_COLOR_FALLBACK = '#666f83'

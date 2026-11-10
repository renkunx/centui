/**
 * Source: packages/vue/src/components/chart/Chart.vue
 *
 * 映射：
 *  props    labels([]), datasets([]), size([480, 320]), max(undefined), min(undefined),
 *           lines(5), step(undefined), shift(0.6), format(v=>v)
 *  events   无（Vue 版无 emits）
 *  slots    无（SVG defs 无对应）
 *
 * 平台差异：
 *  1. SVG → Canvas 2D 新接口（type="2d"）：createSelectorQuery().in(this)
 *     .select('#cv').fields({node, size})，backing store = 绘制尺寸×dpr，
 *     ctx.scale(dpr) 后按 Vue 的 viewBox 坐标系绘制；坐标换算（极值推导、xaxis/yaxis、
 *     折线/面积点位）全部在 logic.ts 纯函数内（含单点/空数据的 Infinity 防护——
 *     Vue 版 labels/values 长度为 1 时 1/0=Infinity、0*Infinity=NaN，为修复项）。
 *  2. 视觉 token：网格线/文本颜色与字号来自 --chart-line-color/--chart-text-color/
 *     --chart-label-size/--chart-value-size（ready 时经 computedStyle 查询，不可得时
 *     以 tokens 默认值兜底，rpx 按窗宽折算 px）；折线色沿用 Vue 内联默认
 *     data.color || '#fa8919'（.cu-chart path 的 chart-path-color 规则被 Vue 版
 *     内联 style 覆盖，行为一致）。
 *  3. theme='heat'/'region' 的 SVG linearGradient 以 canvas 线性渐变复刻
 *     （0%/50%/100% → alpha 0.4/0.3/0.1，hexToRgba 解析 dataset.color）。
 *  4. size 的 'rem' 语义：Vue 以根元素 font-size（resize() 监听）为 unit，小程序
 *     无 DOM，unit 固定 16（size 为纯数字时不受影响）。
 *  5. format 函数属性无法经 wxml/data 传入（属性系统不支持函数）——保留 format
 *     属性位（type:null），y 轴文本默认按 v => v 的 String 语义渲染；如需自定义
 *     格式，可经 this.selectComponent 实例赋值注入，或格式化后直接传 labels。
 *  6. 窗口 resize 重绘：无 window resize 事件，尺寸变化场景由外部重设 size prop
 *     触发 observer 重绘。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  AREA_GRADIENT_ALPHAS,
  CHART_GRID_COLOR_FALLBACK,
  CHART_TEXT_COLOR_FALLBACK,
  computeMax,
  computeMin,
  computeOffsets,
  computeSeries,
  computeStep,
  computeXAxis,
  computeYAxis,
  hexToRgba,
  resolveSize,
  type ChartDataset,
  type ChartSeries,
} from './logic'

const UNIT = 16

interface CanvasState {
  timers: TimerRegistry
  /** canvas type="2d" 上下文（getContext('2d') 返回类型） */
  ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D | null
  node: WechatMiniprogram.Canvas | null
  width: number
  height: number
  dpr: number
  initialized: boolean
  /** computedStyle 查询到的 token（缺省用兜底值） */
  gridColor: string
  textColor: string
  labelSize: number
  valueSize: number
}

function state(ctx: unknown): CanvasState {
  const self = ctx as {__chartState?: CanvasState}
  if (!self.__chartState) {
    self.__chartState = {
      timers: createTimerRegistry(ctx),
      ctx: null,
      node: null,
      width: 0,
      height: 0,
      dpr: 2,
      initialized: false,
      gridColor: CHART_GRID_COLOR_FALLBACK,
      textColor: CHART_TEXT_COLOR_FALLBACK,
      labelSize: 0,
      valueSize: 0,
    }
  }
  return self.__chartState
}

function timers(ctx: unknown): TimerRegistry {
  return state(ctx).timers
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    labels: {type: Object, value: []},
    datasets: {type: Object, value: []},
    /** [宽, 高]，支持 '30rem'（按 unit=16 换算，见头注释差异 4） */
    size: {type: Object, value: [480, 320]},
    max: {type: null, value: null},
    min: {type: null, value: null},
    lines: {type: Number, value: 5},
    step: {type: null, value: null},
    shift: {type: Number, value: 0.6},
    /** 函数属性：wxml/data 不可传，经实例赋值注入（头注释差异 5） */
    format: {type: null, value: null},
  },

  data: {
    canvasStyle: '',
  },

  observers: {
    'labels, datasets, size, max, min, lines, step, shift'() {
      if (!state(this).initialized) {
        return
      }
      this.__applySize()
      this.__draw()
    },
  },

  lifetimes: {
    ready() {
      this.__init()
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    /** ready 链：应用尺寸 → 查询视觉 token → 初始化 canvas → 首绘 */
    __init() {
      const st = state(this)
      this.__applySize()
      const query = this.createSelectorQuery()
      query
        .select('.cu-chart')
        .fields({computedStyle: ['--chart-line-color', '--chart-text-color', '--chart-label-size', '--chart-value-size']})
      query.select('#cv').fields({node: true, size: true})
      query.exec((res: Array<Record<string, unknown> | null> | null) => {
        const style = (res && res[0]) || {}
        const cvField = (res && res[1]) || {}
        const node = cvField.node as WechatMiniprogram.Canvas | null
        if (!node) {
          return
        }
        const info = wx.getWindowInfo()
        st.dpr = info.pixelRatio || 2
        st.gridColor = (style['--chart-line-color'] as string) || CHART_GRID_COLOR_FALLBACK
        st.textColor = (style['--chart-text-color'] as string) || CHART_TEXT_COLOR_FALLBACK
        // rpx 字号 → px（token 默认 22rpx/20rpx，按窗宽折算；computedStyle 可解析时直接取 px）
        const labelPx = parseFloat(style['--chart-label-size'] as string)
        const valuePx = parseFloat(style['--chart-value-size'] as string)
        const rpxToPx = info.windowWidth / 750
        st.labelSize = Number.isFinite(labelPx)
          ? labelPx
          : 22 * rpxToPx
        st.valueSize = Number.isFinite(valuePx) ? valuePx : 20 * rpxToPx
        const ctx = node.getContext('2d')
        if (!ctx) {
          return
        }
        st.node = node
        st.ctx = ctx
        st.initialized = true
        this.__applyBackingStore()
        this.__draw()
      })
    },

    /** size prop → CSS 尺寸与 canvas 内联样式 */
    __applySize() {
      const st = state(this)
      const [width, height] = resolveSize(this.data.size as Array<string | number>, UNIT)
      if (width === st.width && height === st.height && this.data.canvasStyle) {
        return
      }
      st.width = width
      st.height = height
      this.setData({canvasStyle: `width:${width}px;height:${height}px;`})
      if (st.initialized) {
        this.__applyBackingStore()
      }
    },

    /** backing store = 绘制尺寸×dpr，ctx.scale(dpr) 后按 CSS px 绘制 */
    __applyBackingStore() {
      const st = state(this)
      if (!st.node || !st.ctx) {
        return
      }
      st.node.width = Math.round(st.width * st.dpr)
      st.node.height = Math.round(st.height * st.dpr)
      st.ctx.scale(st.dpr, st.dpr)
    },

    __draw() {
      const st = state(this)
      const ctx = st.ctx
      if (!ctx) {
        return
      }
      const props = this.data as Record<string, unknown>
      const labels = (props.labels as string[]) || []
      const datasets = (props.datasets as ChartDataset[]) || []
      const lines = props.lines as number
      const max = computeMax(datasets, (props.max as number | null | undefined) ?? undefined)
      const min = computeMin(datasets, (props.min as number | null | undefined) ?? undefined)
      const step = computeStep(max, min, (props.step as number | null | undefined) ?? undefined, lines)
      const offsets = computeOffsets(props.shift as number, UNIT)
      const innerWidth = st.width - offsets.left - offsets.right
      const innerHeight = st.height - offsets.top - offsets.bottom
      const userFormat = props.format
      const format =
        typeof userFormat === 'function'
          ? (v: number) => String(userFormat(v))
          : (v: number) => String(v)

      ctx.clearRect(0, 0, st.width, st.height)
      ctx.save()
      // SVG g.cu-chart-graph transform
      ctx.translate(offsets.left, offsets.top)

      // ── 网格（.cu-chart line：chart-line-color / 0.5 / square）──
      const yaxis = computeYAxis(lines, innerHeight, max, min, step, format)
      ctx.strokeStyle = st.gridColor
      ctx.lineWidth = 0.5
      ctx.lineCap = 'square'
      ctx.beginPath()
      for (const item of yaxis) {
        ctx.moveTo(0, item.offset)
        ctx.lineTo(innerWidth, item.offset)
      }
      // x 轴刻度短线（y2=6）
      const xaxis = computeXAxis(labels, innerWidth)
      for (const item of xaxis) {
        ctx.moveTo(item.offset, innerHeight)
        ctx.lineTo(item.offset, innerHeight + 6)
      }
      ctx.stroke()

      // ── 文本（axis-y：value-size/text-anchor:end + dx -0.5em dy 0.32em；
      //    axis-x：label-size/text-anchor:middle + dy 2em）──
      ctx.fillStyle = st.textColor
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      for (const item of yaxis) {
        ctx.fillText(item.label, -0.5 * st.valueSize, item.offset + 0.32 * st.valueSize)
      }
      ctx.textAlign = 'center'
      for (const item of xaxis) {
        ctx.fillText(item.label, item.offset, innerHeight + 2 * st.labelSize)
      }

      // ── 折线与面积（.cu-chart path：stroke-width 1 / butt，内联色覆盖）──
      const series = computeSeries(datasets, {
        innerWidth,
        innerHeight,
        lines,
        max,
        min,
        step,
      })
      for (const s of series) {
        this.__drawSeries(ctx, s, innerHeight)
      }

      ctx.restore()
    },

    __drawSeries(ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D, s: ChartSeries, innerHeight: number) {
      const points = s.points
      if (!points.length) {
        return
      }
      let minY = Infinity
      let maxY = -Infinity
      for (const p of points) {
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
      }
      const gradient = this.__makeGradient(ctx, s.color, minY, maxY)

      if (s.theme === 'region') {
        // Vue area path：M0,innerHeight → 各点 → 末点垂直落底
        ctx.beginPath()
        ctx.moveTo(0, innerHeight)
        for (const p of points) {
          ctx.lineTo(p.x, p.y)
        }
        ctx.lineTo(points[points.length - 1].x, innerHeight)
        ctx.closePath()
        ctx.fillStyle = gradient || s.color
        ctx.fill()
      }

      // 折线（theme='heat' 描边走渐变）
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.strokeStyle = s.theme === 'heat' ? gradient || s.color : s.color
      ctx.lineWidth = s.lineWidth
      ctx.lineCap = 'butt'
      ctx.stroke()
    },

    /** SVG linearGradient（y 向 0→1，alpha 0.4/0.3/0.1）的 canvas 复刻 */
    __makeGradient(
      ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D,
      color: string,
      minY: number,
      maxY: number,
    ): WechatMiniprogram.CanvasRenderingContext.CanvasGradient | null {
      const top = Number.isFinite(minY) ? minY : 0
      const bottom = Number.isFinite(maxY) ? maxY : 0
      if (!(bottom > top)) {
        return null
      }
      const gradient = ctx.createLinearGradient(0, top, 0, bottom)
      AREA_GRADIENT_ALPHAS.forEach((alpha, i) => {
        const stops = [0, 0.5, 1]
        const rgba = hexToRgba(color, alpha)
        gradient.addColorStop(stops[i], rgba || color)
      })
      return gradient
    },
  },
})

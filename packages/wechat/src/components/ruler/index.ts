/**
 * Source: packages/vue/src/components/ruler/Ruler.vue
 *
 * 刻度尺：Canvas 2D 绘制（对齐 Vue 的 canvas 绘制常量与滚动换算）+ drag-ticker
 * 横向惯性滚动 + BLANK 网格吸附。
 *
 * 映射：
 *  props    modelValue→value(Number, v2 兼容 String), scope([0,100]), step(10),
 *           unit(1), min(0), max(100), stepTextPosition(top|bottom),
 *           stepTextRender（no-op，差异 2）
 *  events   update:modelValue + input + change 合并为 'change' {value}（差异 3）
 *  slots    无
 *
 * 平台差异（有意为之）：
 *  1. @centui/core/web Scroller → shared/drag-ticker（动量 ×0.95/帧、越界 0.5 阻尼；
 *     吸附在 onStop 处按 BLANK 网格 scrollTo 回落）；绘制走 canvas 2D 新接口
 *     （createSelectorQuery node + dpr 缓冲），绘制空间与 Vue 完全一致
 *     （RATIO=2 超采样：canvas.width = cssW × 2，ctx.scale(1/2)），
 *     BLANK=30/CLIENT_HEIGHT=60/y=120 等常量逐值保留；
 *     Vue 版 canvas CSS 高度 60px（真实 CSS 语义）与 styl 的 60px 经 1px=1rpx 管线
 *     会缩为 30px——本组件对 canvas 节点内联 height:60px 维持 Vue 实际渲染尺寸，
 *     否则绘制空间与缓冲高度不一致（差异声明）。
 *  2. stepTextRender 为函数属性，小程序 properties 不支持函数 → no-op，
 *     刻度文本恒为数值（Vue 版缺省行为一致）。
 *  3. Vue emits update:modelValue/input/change 三事件，小程序按 §3.2 合并为
 *     'change' {value}；value 观察对齐 watch(rulerValue)：非滚动状态才回位。
 *  4. 值域生成/换算纯函数在 ./logic.ts（可测），任务提及的 avoid-begin/avoid-end/
 *     band 非本 Vue 版 props——越界淡色带已由 blankLeft/blankRight 覆盖。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {createDragTicker, type DragTicker} from '../../shared/drag-ticker'
import {
  baseXOf,
  BLANK,
  blankLeftOf,
  blankRightOf,
  CLIENT_HEIGHT,
  initXOf,
  innerWidthOf,
  RATIO,
  realMaxOf,
  realMinOf,
  tickLayoutOf,
  unitCountOf,
  valueAtOffset,
} from './logic'

const MINOR_FILL = '#E2E4EA'
const MAJOR_FILL = '#C5CAD5'
const MAJOR_STROKE = '#858B9C'
const FONT_FAMILY =
  'DIDIFD-Medium, "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif'

/** 结构化上下文（helper 以宽松形态访问 data，方法内 this 已具名类型化） */
interface RulerCtx {
  data: Record<string, unknown>
  triggerEvent(name: string, payload?: unknown): void
}

interface RulerState {
  timers: TimerRegistry
  ticker: DragTicker | null
  canvas: WechatMiniprogram.Canvas | null
  ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D | null
  canvasWidth: number
  isInitialed: boolean
  isScrolling: boolean
  /** 最近一次 draw 的滚动偏移（2x 空间） */
  lastLeft: number
  /** draw 节流时间戳（对齐 Vue throttle 10ms） */
  lastDrawAt: number
  drawTimer: ReturnType<typeof setTimeout> | null
}

function state(ctx: unknown): RulerState {
  const self = ctx as {__ruler?: RulerState}
  if (!self.__ruler) {
    self.__ruler = {
      timers: createTimerRegistry(ctx),
      ticker: null,
      canvas: null,
      ctx: null,
      canvasWidth: 0,
      isInitialed: false,
      isScrolling: false,
      lastLeft: 0,
      lastDrawAt: 0,
      drawTimer: null,
    }
  }
  return self.__ruler
}

interface RulerGeom {
  unitCount: number
  realMin: number
  realMax: number
  blankLeft: number
  blankRight: number
  innerWidth: number
  maxScroll: number
  baseX: number
}

function geometryOf(self: RulerCtx): RulerGeom {
  const d = self.data
  const scope = (Array.isArray(d.scope) && d.scope.length === 2 ? d.scope : [0, 100]) as number[]
  const unitValue = d.unit as number
  const unit = unitValue > 0 ? unitValue : 1
  const realMin = realMinOf(scope, d.min as number)
  const realMax = realMaxOf(scope, d.max as number)
  const blankLeft = blankLeftOf(realMin, scope[0], unit)
  const blankRight = blankRightOf(scope[1], realMax, unit)
  const unitCount = unitCountOf(scope, unit)
  const canvasWidth = state(self).canvasWidth
  const innerWidth = innerWidthOf(unitCount, canvasWidth, blankLeft, blankRight)
  return {
    unitCount,
    realMin,
    realMax,
    blankLeft,
    blankRight,
    innerWidth,
    maxScroll: Math.max(0, innerWidth - canvasWidth),
    baseX: baseXOf(canvasWidth, blankLeft),
  }
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** Vue modelValue（|| value 兼容合并） */
    value: {type: Number, optionalTypes: [String], value: 0},
    scope: {type: Object, value: [0, 100]},
    step: {type: Number, value: 10},
    unit: {type: Number, value: 1},
    min: {type: Number, value: 0},
    max: {type: Number, value: 100},
    /** top | bottom */
    stepTextPosition: {type: String, value: 'top'},
    /** 函数属性不可用：no-op（差异 2） */
    stepTextRender: {type: null, value: null},
  },

  data: {
    isStepTextBottom: false,
  },

  observers: {
    value() {
      const s = state(this)
      if (!s.isInitialed || s.isScrolling) return
      // 对齐 watch(rulerValue)：回位 + 动画滚动
      s.isScrolling = true
      const nextX = this.__initX()
      this.__draw(nextX)
      s.ticker?.scrollTo(nextX, true)
    },
    stepTextPosition(val: string) {
      this.setData({isStepTextBottom: val === 'bottom'})
    },
    'scope, step, unit, min, max'() {
      // 值域变化：重建几何并重定位（对齐 Vue computed 依赖的隐式重算）
      const s = state(this)
      if (!s.isInitialed) return
      const geom = geometryOf(this)
      if (s.ticker) {
        s.ticker.destroy()
      }
      s.ticker = this.__createTicker(geom)
      const nextX = this.__initX()
      this.__draw(nextX)
      s.ticker.scrollTo(nextX, false)
    },
  },

  lifetimes: {
    attached() {
      this.setData({isStepTextBottom: this.data.stepTextPosition === 'bottom'})
    },
    ready() {
      this.__initCanvas()
    },
    detached() {
      const s = state(this)
      if (s.drawTimer != null) clearTimeout(s.drawTimer)
      s.ticker?.destroy()
      s.ticker = null
      s.timers.clearAll()
    },
  },

  methods: {
    __initCanvas() {
      const s = state(this)
      this.createSelectorQuery()
        .select('.cu-ruler-canvas')
        .fields({node: true, size: true})
        .exec((res) => {
          const r = res && (res[0] as {node?: WechatMiniprogram.Canvas; width?: number; height?: number} | null)
          if (!r || !r.node || !r.width) return
          const dpr = (typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync())
            .pixelRatio as number
          const canvas = r.node
          canvas.width = r.width * dpr
          canvas.height = CLIENT_HEIGHT * dpr
          const ctx = canvas.getContext('2d') as WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D | null
          if (!ctx) return
          // 绘制空间 = Vue 2x CSS 空间：ctx 缩放 dpr/RATIO
          ctx.scale(dpr / RATIO, dpr / RATIO)
          s.canvas = canvas
          s.ctx = ctx
          s.canvasWidth = r.width * RATIO
          this.__initScroller()
        })
    },

    __initScroller() {
      const s = state(this)
      const geom = geometryOf(this)
      s.ticker = this.__createTicker(geom)
      const nextX = this.__initX()
      this.__draw(nextX)
      s.ticker.scrollTo(nextX, false)
      s.isInitialed = true
    },

    __createTicker(geom: RulerGeom): DragTicker {
      const s = state(this)
      return createDragTicker({
        min: 0,
        max: geom.maxScroll,
        onTranslate: (left) => {
          s.isScrolling = true
          this.__drawThrottled(left)
        },
        onStop: (left) => {
          // BLANK 网格吸附（对齐 setSnapSize(BLANK, 0)）
          const g = geometryOf(this)
          const snapped = Math.min(g.maxScroll, Math.max(0, Math.round(left / BLANK) * BLANK))
          if (Math.abs(snapped - left) > 0.01) {
            s.ticker?.scrollTo(snapped, true)
            return
          }
          s.isScrolling = false
          this.__draw(left)
        },
      })
    },

    __initX(): number {
      const d = this.data
      const geom = geometryOf(this)
      return initXOf(Number(d.value) || 0, geom.realMin, geom.realMax, d.unit > 0 ? d.unit : 1, geom.unitCount)
    },

    /** draw 节流（10ms，对齐 Vue throttle） */
    __drawThrottled(left: number) {
      const s = state(this)
      const now = Date.now()
      if (now - s.lastDrawAt >= 10) {
        s.lastDrawAt = now
        this.__draw(left)
      } else if (s.drawTimer == null) {
        s.drawTimer = setTimeout(() => {
          s.drawTimer = null
          s.lastDrawAt = Date.now()
          this.__draw(s.lastLeft)
        }, 10)
      }
    },

    /** draw/drawLine 移植（canvas 2D） */
    __draw(left: number) {
      const s = state(this)
      const ctx = s.ctx
      if (!ctx || !s.canvasWidth) return
      left = +Number(left).toFixed(2)
      s.lastLeft = left
      const d = this.data
      const geom = geometryOf(this)
      const x = geom.baseX - left

      ctx.clearRect(0, 0, s.canvasWidth, CLIENT_HEIGHT)

      const isBottom = d.stepTextPosition === 'bottom'
      const fontSize = 22
      const y = 120 - (isBottom ? fontSize + 40 : 0)

      const ticks = tickLayoutOf(
        x,
        geom.unitCount,
        d.step,
        d.unit > 0 ? d.unit : 1,
        (Array.isArray(d.scope) ? d.scope : [0, 100])[0],
        geom.blankLeft,
        geom.blankRight,
        s.canvasWidth,
      )
      for (const tick of ticks) {
        ctx.fillStyle = tick.outRange ? MINOR_FILL : MAJOR_FILL
        ctx.strokeStyle = tick.outRange ? MINOR_FILL : MAJOR_STROKE
        ctx.lineWidth = 2
        ctx.font = `${fontSize * RATIO}px ${FONT_FAMILY}`
        ctx.beginPath()
        ctx.moveTo(tick.cx, y)
        if (tick.major) {
          ctx.fillText(tick.text, tick.cx - (tick.text.length * fontSize) / 2, fontSize * RATIO + (isBottom ? 70 : 0))
          ctx.lineTo(tick.cx, y - 40)
        } else {
          ctx.lineTo(tick.cx, y - 20)
        }
        ctx.stroke()
      }

      // 基线
      ctx.strokeStyle = MINOR_FILL
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + geom.unitCount * BLANK, y)
      ctx.stroke()

      // 值换算 + emit（对齐 drawLine → updateValue → onInput）
      if (s.isInitialed) {
        const value = valueAtOffset(
          geom.baseX,
          left,
          s.canvasWidth,
          (Array.isArray(d.scope) ? d.scope : [0, 100])[0],
          d.unit > 0 ? d.unit : 1,
          geom.realMin,
          geom.realMax,
        )
        this.triggerEvent('change', {value})
      }
    },

    // ------------------------------------------------------------------
    // 触摸（拖动刻度）
    // ------------------------------------------------------------------
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const s = state(this)
      const ticker = s.ticker
      if (!ticker) return
      const touch = e.touches && e.touches[0]
      if (!touch) return
      // 触摸位移 → 2x 绘制空间
      ticker.onTouchStart(touch.pageX * RATIO, touch.pageY * RATIO)
    },

    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      const ticker = state(this).ticker
      if (!ticker) return
      const touch = e.touches && e.touches[0]
      if (!touch) return
      ticker.onTouchMove(touch.pageX * RATIO, touch.pageY * RATIO)
    },

    onTouchEnd() {
      state(this).ticker?.onTouchEnd()
    },
  },
})

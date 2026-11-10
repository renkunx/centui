/**
 * Source: packages/vue/src/components/slider/Slider.vue
 *
 * 滑块：拖拽用 touch 事件 + 选区换算（offsetWidth → createSelectorQuery 量取
 * track 宽度缓存）；step/min/max/disabled 对齐 Vue 修复后实现（主动画被动跟随、
 * isDragging 守卫、受控双向）；buffer 实心段（.cu-slider-bar）。
 *
 * 映射：
 *  props    modelValue→value(Number|Array), min(0), max(100), step(1), range(false),
 *           disabled(false), format（no-op，差异 3）
 *  events   update:modelValue → change {value: number | number[]}（拖拽每次 updateValue
 *           即 emit，对齐 Vue update:modelValue 频率）
 *  slots    无
 *
 * 平台差异（有意为之）：
 *  1. window 级 mouse/touch 监听 → handle 节点 catch:touchstart/move/end
 *     （catch 自带 preventDefault，拖动不穿透页面滚动）；track 宽度异步量取并缓存，
 *     量取完成前的 move 按 0 增量处理（等价 Vue elWidth===0 return 分支）。
 *  2. CSS ::after content: attr(data-hint) 依赖 DOM attribute，小程序 dataset 不参与
 *     CSS attr() → 拖拽提示气泡不可见（data-hint 属性保留，可由调用方读取）；
 *     slider.styl 的 `.cu-slider-handle span` 元素选择器同样无对应节点，把手圆钮以
 *     inline style 复刻（popup-title-bar 同款先例：token 优先，box-shadow 阴影色为
 *     设计稿字面量），active scale(1.3) 经 wxml 表达式绑定。
 *  3. format 为函数属性，小程序 properties 不支持函数 → no-op，hint 恒为原始数值。
 *  4. 初始挂载与 Vue watch(modelValue, immediate) 一致：value 与当前值不同则归一并
 *     emit（受控回写对齐后不再触发，无环）。
 */
import {CuComponent} from '../../shared/component'
import {
  barStyleOf,
  dragDeltaOf,
  hintOf,
  normalizeValues,
  parseValueProp,
  positionOf,
  type SliderValues,
} from './logic'

/** 结构化上下文（helper 以宽松形态访问 data/properties，方法内 this 已具名类型化） */
interface SliderCtx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
  triggerEvent(name: string, payload?: unknown): void
}

interface SliderState {
  timers: number | null
  trackWidth: number
  startDragPos: number
  startVal: number
}

function state(ctx: unknown): SliderState {
  const self = ctx as {__slider?: SliderState}
  if (!self.__slider) {
    self.__slider = {timers: null, trackWidth: 0, startDragPos: 0, startVal: 0}
  }
  return self.__slider
}

function emitValue(self: SliderCtx, values: SliderValues) {
  self.triggerEvent('change', {
    value: self.data.range ? [values.lower, values.upper] : values.lower,
  })
}

function refreshView(self: SliderCtx, values: SliderValues) {
  const d = self.data
  self.setData({
    lower: values.lower,
    upper: values.upper,
    lowerPos: positionOf(values.lower, d.min as number, d.max as number),
    upperPos: positionOf(values.upper, d.min as number, d.max as number),
    barStyle: barStyleOf(!!d.range, values, d.min as number, d.max as number),
    hint: hintOf(values.lower),
  })
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** Vue modelValue：number 或 range 模式的 [lower, upper] */
    value: {type: Number, optionalTypes: [Array], value: 0},
    min: {type: Number, value: 0},
    max: {type: Number, value: 100},
    step: {type: Number, value: 1},
    range: {type: Boolean, value: false},
    /** 函数属性不可用：no-op（差异 3） */
    format: {type: null, value: null},
    disabled: {type: Boolean, value: false},
  },

  data: {
    lower: 0,
    upper: 100,
    lowerPos: 0,
    upperPos: 100,
    barStyle: '',
    hint: '0',
    isDragging: false,
    isDragingUpper: false,
  },

  observers: {
    value(val: number | Array<number>) {
      // 对齐 Vue watch(modelValue)：与当前值一致时不重算（受控回写收敛）
      const d = this.data
      const current: number | number[] = d.range ? [d.lower, d.upper] : d.lower
      const same = Array.isArray(val)
        ? Array.isArray(current) && val[0] === current[0] && val[1] === current[1]
        : val === current
      if (!same) {
        this.updateValue(val)
      }
    },
    disabled(newVal: boolean) {
      // 对齐 Vue watch(disabled)：恢复可用时终止拖拽状态
      if (!newVal) {
        this.stopDrag()
      }
    },
    'range, min, max, step'() {
      this.updateValue(this.data.value as number | number[])
    },
  },

  lifetimes: {
    attached() {
      const s = state(this)
      const d = this.data
      // 对齐 values ref 初始值 [min, max]，再走 watch immediate 语义
      const initial: SliderValues = {lower: d.min, upper: d.max}
      refreshView(this, initial)
      const parsed = parseValueProp(d.value)
      const normalized = normalizeValues(parsed.lower, parsed.upper, initial, d.min, d.max, d.step)
      if (normalized.lower !== initial.lower || normalized.upper !== initial.upper) {
        this.setData({lower: normalized.lower, upper: normalized.upper})
        refreshView(this, normalized)
        emitValue(this, normalized)
      }
      void s
    },
    ready() {
      this.__measureTrack()
    },
    detached() {
      this.stopDrag()
    },
  },

  methods: {
    __measureTrack() {
      const s = state(this)
      if (s.trackWidth > 0) return
      this.createSelectorQuery()
        .select('.cu-slider')
        .boundingClientRect((rect) => {
          const r = rect as WechatMiniprogram.BoundingClientRectCallbackResult | null
          if (r && r.width > 0) {
            state(this).trackWidth = r.width
          }
        })
        .exec()
    },

    /** updateValue 移植：归一 → 变更才 setData + emit */
    updateValue(newVal: number | Array<number>) {
      const d = this.data
      const parsed = parseValueProp(newVal)
      const normalized = normalizeValues(
        parsed.lower,
        parsed.upper,
        {lower: d.lower, upper: d.upper},
        d.min,
        d.max,
        d.step,
      )
      if (normalized.lower === d.lower && normalized.upper === d.upper) {
        return
      }
      refreshView(this, normalized)
      emitValue(this, normalized)
    },

    // ------------------------------------------------------------------
    // 拖拽
    // ------------------------------------------------------------------
    onHandleTouchStart(e: WechatMiniprogram.TouchEvent) {
      const d = this.data
      if (d.disabled) return
      const s = state(this)
      if (s.trackWidth <= 0) {
        this.__measureTrack()
      }
      const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
      if (!touch) return
      const isUpper = !!(e.currentTarget.dataset as {upper?: boolean}).upper
      s.startDragPos = touch.pageX
      s.startVal = isUpper ? d.upper : d.lower
      this.setData({isDragingUpper: isUpper, isDragging: true})
    },

    onHandleTouchMove(e: WechatMiniprogram.TouchEvent) {
      const d = this.data
      if (d.disabled) return
      const s = state(this)
      if (!d.isDragging) return
      const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
      if (!touch) return
      // 量取完成前按 0 增量处理（等价 Vue elWidth===0 return）
      const delta = dragDeltaOf(touch.pageX - s.startDragPos, s.trackWidth, d.min, d.max)
      const nextVal = s.startVal + delta
      this.updateValue(d.isDragingUpper ? [null as unknown as number, nextVal] : [nextVal, null as unknown as number])
    },

    onHandleTouchEnd() {
      this.stopDrag()
    },

    stopDrag() {
      const d = this.data
      if (d.isDragging || d.isDragingUpper) {
        this.setData({isDragging: false, isDragingUpper: false})
      }
    },
  },
})

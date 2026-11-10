/**
 * Source: packages/vue/src/components/stepper/Stepper.vue
 *
 * 映射：
 *  props    defaultValue(0), modelValue→value(0), step(1), min(-Number.MAX_VALUE),
 *           max(Number.MAX_VALUE), disabled, readOnly, isInteger
 *  events   update:modelValue → change {value}；increase/decrease {value: diff}
 *           （Vue 载荷为增量数值，统一装 {value} 信封，见差异 4）
 *  slots    无
 *
 * 语义对齐：
 *  - emit 前 clamp（watch(currentNum) 收敛），越界值（键入中间态、min/max 动态收紧）
 *    不得外流；min/max 变更 clamp 后经 change 补发。
 *  - 退化区间（min > max）仅告警不纠正，max 收敛优先。
 *  - 初始化 currentNum = getCurrentNum(modelValue || defaultValue)——modelValue 为 0
 *    时按 Vue 版 falsy 短路取 defaultValue（历史语义，保留）。
 *
 * 平台差异：
 *  1. Vue input :type="!isInteger ? 'number' : 'tel'" → 小程序映射为
 *     !isInteger ? 'digit'（带小数键盘）: 'number'（整数键盘）。
 *  2. readOnly 无原生只读：bindinput 中直接回写 currentNum 抵消键入（样式保持
 *     非 disabled 态）；blur 时再 clamp 一次。
 *  3. Vue input 的 size/contentLength 属性（HTML size）无对应，宽度由样式固定。
 *  4. increase/decrease 事件载荷 Vue 为裸数值 diff，小程序统一 {value: diff} 信封。
 *  5. 键入时展示值随收敛后的 currentNum 重置（对齐 Vue :value="currentNum" 的
 *     patch 行为，"1." 等中间态在两端同样不保留）。
 */
import {CuComponent} from '../../shared/component'
import {
  accAdd,
  formatNum,
  getCurrentNum,
  subtr,
  transitionStepper,
  type NumLike,
} from './logic'

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
  triggerEvent(name: string, payload?: unknown): void
}

function warnMinMax(min: NumLike, max: NumLike) {
  if (Number(min) > Number(max)) {
    console.warn('[cu-wechat-stepper] minNum is larger than maxNum')
  }
}

function applyTransition(self: Ctx, next: number, prev: number) {
  const t = transitionStepper(prev, next, {
    min: self.data.min as NumLike,
    max: self.data.max as NumLike,
    modelValue: self.data.value as NumLike,
  })
  self.setData({currentNum: t.value, inputText: String(t.value)})
  ;(self as unknown as {__checkStatus(): void}).__checkStatus()
  if (t.changed) {
    self.setData({value: t.value})
    self.triggerEvent('change', {value: t.value})
  }
  if (t.diff > 0) {
    self.triggerEvent('increase', {value: t.diff})
  } else if (t.diff < 0) {
    self.triggerEvent('decrease', {value: Math.abs(t.diff)})
  }
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    defaultValue: {type: Number, optionalTypes: [String], value: 0},
    /** Vue modelValue */
    value: {type: Number, optionalTypes: [String], value: 0},
    step: {type: Number, optionalTypes: [String], value: 1},
    min: {type: Number, optionalTypes: [String], value: -Number.MAX_VALUE},
    max: {type: Number, optionalTypes: [String], value: Number.MAX_VALUE},
    disabled: {type: Boolean, value: false},
    readOnly: {type: Boolean, value: false},
    isInteger: {type: Boolean, value: false},
  },

  data: {
    currentNum: 0,
    inputText: '0',
    isMin: false,
    isMax: false,
    isEditing: false,
  },

  observers: {
    defaultValue(val: NumLike) {
      // 对齐 Vue watch(defaultValue)：重置当前值（走收敛链，必要时补发 change）
      const prev = this.data.currentNum
      applyTransition(this, getCurrentNum(val, this.data.min, this.data.max, this.data.isInteger), prev)
    },
    value(val: NumLike) {
      // 对齐 Vue watch(modelValue)：编辑期忽略外部回写
      if (this.data.isEditing) {
        return
      }
      const next = getCurrentNum(val, this.data.min, this.data.max, this.data.isInteger)
      if (next !== this.data.currentNum) {
        this.setData({currentNum: next, inputText: String(next)})
        this.__checkStatus()
      }
    },
    min(val: NumLike) {
      // 对齐 Vue watch(min)：低于新 min 时 clamp 并补发 change
      warnMinMax(val, this.data.max)
      const min = Number(val)
      if (this.data.currentNum < min) {
        applyTransition(this, min, this.data.currentNum)
      } else {
        this.__checkStatus()
      }
    },
    max(val: NumLike) {
      // 对齐 Vue watch(max)：高于新 max 时 clamp 并补发 change
      warnMinMax(this.data.min, val)
      const max = Number(val)
      if (this.data.currentNum > max) {
        applyTransition(this, max, this.data.currentNum)
      } else {
        this.__checkStatus()
      }
    },
  },

  lifetimes: {
    attached() {
      // 对齐 Vue setup 期同步初始化（modelValue || defaultValue 的 falsy 短路保留）
      const initial = getCurrentNum(
        (this.data.value || this.data.defaultValue) as NumLike,
        this.data.min,
        this.data.max,
        this.data.isInteger,
      )
      this.setData({currentNum: initial, inputText: String(initial)})
      warnMinMax(this.data.min, this.data.max)
      this.__checkStatus()
    },
  },

  methods: {
    __checkStatus() {
      this.setData({
        isMin: this.data.currentNum <= Number(this.data.min),
        isMax: this.data.currentNum >= Number(this.data.max),
      })
    },

    onReduce() {
      if (this.data.disabled || this.data.isMin) {
        return
      }
      applyTransition(
        this,
        subtr(this.data.currentNum, this.data.step as NumLike),
        this.data.currentNum,
      )
    },

    onAdd() {
      if (this.data.disabled || this.data.isMax) {
        return
      }
      applyTransition(
        this,
        accAdd(this.data.currentNum, this.data.step as NumLike),
        this.data.currentNum,
      )
    },

    onInput(e: WechatMiniprogram.Input) {
      const raw = e.detail.value
      if (this.data.readOnly) {
        // 只读：抵消键入（保持非 disabled 视觉）
        this.setData({inputText: String(this.data.currentNum)})
        return
      }
      const formatted = formatNum(raw, this.data.isInteger)
      this.setData({isEditing: true})
      // 展示值随收敛后的 currentNum 重置（对齐 Vue :value="currentNum" 的 patch 行为）
      applyTransition(this, formatted, this.data.currentNum)
    },

    onFocus() {
      this.setData({isEditing: true})
    },

    onBlur() {
      // 对齐 Vue onChange（blur）：退出编辑态并按 min/max 收敛
      this.setData({isEditing: false})
      const clamped = getCurrentNum(
        this.data.currentNum,
        this.data.min,
        this.data.max,
        this.data.isInteger,
      )
      if (clamped !== this.data.currentNum) {
        applyTransition(this, clamped, this.data.currentNum)
      } else {
        this.setData({inputText: String(this.data.currentNum)})
      }
    },
  },
})

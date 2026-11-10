/**
 * Source: packages/vue/src/components/amount/Amount.vue
 *
 * 映射：
 *  props    value(0), precision(2), isRoundUp(true), hasSeparator(false), separator(','),
 *           isAnimated(false), transition(false, v2 遗留别名，等价 isAnimated 的过渡开关),
 *           isCapital(false), duration(1000)
 *  events   无（Vue 版无 emits）
 *  slots    无
 *
 * 实现说明：
 *  - 格式化走 @centui/core 主入口纯函数（与 Amount.vue 实际用的 API 一一对应）：
 *    toFixedPrecision / formatNumberWithSeparator / numberToChineseCapital；
 *    禁用 /web 子入口。v2 曾有的 blur 模式在当前 Vue 版不存在，不实现。
 *  - Animate（@centui/core/web，小程序禁用 /web 入口）→ shared/ticker.animateValue
 *    （逻辑层 16ms 线性步进，语义对齐 Vue Animate.start(step, verify, done, duration)）。
 *  - 首帧语义对齐修复后的 Vue 版：attached（≈onMounted）前直接同步终值不播动画，
 *    attached 后 value 变更且 isAnimated/transition=true 才走动画。
 *  - 动画重入先 stop 旧句柄（对齐 Vue animateId stop），detached 全量清理。
 *
 * 平台差异：
 *  1. 模板双分支（nonCapital/capital computed）合并为单一 text 字段由 JS 计算。
 *  2. core 引用以相对路径指向 core 主入口源码（零依赖、DOM-free）：@centui/wechat
 *     尚未声明 @centui/core 依赖（workspace 未链接），包说明符无法被 tsc/vitest 解析；
 *     语义与构建期 corePlugin（@centui/core → core/dist/index.cjs）一致，待依赖声明
 *     补齐后可切回 '@centui/core'（详见 packages/wechat/src/components/amount/logic.ts）。
 */
import {CuComponent} from '../../shared/component'
import {animateValue, type TickerHandle} from '../../shared/ticker'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {formatAmountText} from './logic'

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

interface AmountState {
  timers: TimerRegistry
  handle: TickerHandle | null
}

function amountState(ctx: unknown): AmountState {
  const self = ctx as {__amountState?: AmountState}
  if (!self.__amountState) {
    self.__amountState = {timers: createTimerRegistry(ctx), handle: null}
  }
  return self.__amountState
}

function refresh(self: Ctx) {
  const d = self.data
  self.setData({
    text: formatAmountText(d.displayValue as number, {
      precision: d.precision as number,
      isRoundUp: d.isRoundUp as boolean,
      hasSeparator: d.hasSeparator as boolean,
      separator: d.separator as string,
      isCapital: d.isCapital as boolean,
    }),
  })
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    value: {type: Number, value: 0},
    precision: {type: Number, value: 2},
    isRoundUp: {type: Boolean, value: true},
    hasSeparator: {type: Boolean, value: false},
    separator: {type: String, value: ','},
    isAnimated: {type: Boolean, value: false},
    /** v2 遗留别名，等价 isAnimated 的过渡开关 */
    transition: {type: Boolean, value: false},
    isCapital: {type: Boolean, value: false},
    duration: {type: Number, value: 1000},
  },

  data: {
    /** 动画推进中的展示值（Vue displayValue ref） */
    displayValue: 0,
    /** 由 displayValue + 格式化 props 派生的最终文本 */
    text: '0.00',
    isMounted: false,
  },

  observers: {
    value(val: number, oldVal: number) {
      // 对齐修复后的 Vue 版：首轮（isMounted=false）直接同步终值（首帧不闪变），
      // attached 后才按 isAnimated/transition 决定动画
      if (!this.data.isMounted) {
        this.setData({displayValue: val})
        refresh(this)
        return
      }
      if (this.data.isAnimated || this.data.transition) {
        // 对齐 Vue animateDisplay(oldVal, val)：起点为上一个 prop 值
        this.__animateDisplay(
          typeof oldVal === 'number' ? oldVal : this.data.displayValue,
          val,
        )
      } else {
        this.setData({displayValue: val})
        refresh(this)
      }
    },
    'precision, isRoundUp, hasSeparator, separator, isCapital'() {
      refresh(this)
    },
  },

  lifetimes: {
    attached() {
      const state = amountState(this)
      void state
      // Vue watch immediate + onMounted：首轮同步终值、随后置位 isMounted
      this.setData({displayValue: this.data.value, isMounted: true})
      refresh(this)
    },
    detached() {
      this.__stopAnimate()
      amountState(this).timers.clearAll()
    },
  },

  methods: {
    __stopAnimate() {
      const state = amountState(this)
      if (state.handle) {
        state.handle.stop()
        state.handle = null
      }
    },

    /** 对齐 Vue animateDisplay：重入先 stop 旧句柄，动画结束落地终值 */
    __animateDisplay(fromValue: number, toValue: number) {
      this.__stopAnimate()
      const state = amountState(this)
      state.handle = animateValue({
        from: fromValue,
        to: toValue,
        duration: this.data.duration,
        onUpdate: (value: number) => {
          this.setData({displayValue: value})
          refresh(this)
        },
        onComplete: () => {
          const s = amountState(this)
          s.handle = null
        },
      })
    },
  },
})

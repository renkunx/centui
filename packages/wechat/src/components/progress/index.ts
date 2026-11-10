/**
 * Source: packages/vue/src/components/progress/Progress.vue
 *
 * 映射：
 *  props    size(70), width(0=未设置→size/12), color('#2F86F6'), borderColor(rgba(0,0,0,.1)),
 *           fill('transparent'), linecap('round', no-op), rotate(0),
 *           value(0), transition(false), duration(1000)
 *  events   无（Vue 版无 emits）
 *  slots    默认插槽 → cu-activity-indicator 的 center 槽（环心内容，对齐 Roller 默认插槽）；
 *           defs 插槽为 SVG defs，无平台等价物，no-op（差异声明）
 *
 * 实现说明：
 *  - 环体直接委托 cu-activity-indicator（type=roller + process），环几何由
 *    shared/indicator-ring.ts 提供，与 Roller.vue 公式一致（无 SVG，见其差异声明）。
 *  - Animate（@centui/core/web，小程序禁用 /web 入口）→ shared/ticker.animateValue
 *    （逻辑层 16ms 步进线性插值，语义与 Vue Animate.start(step, verify, done, duration) 一致）。
 *  - 首轮（attached 前）直接同步终值，attached 后且 transition=true 才走动画（对齐
 *    Vue isMounted watch 语义）。
 *
 * 样式：Vue 版 .cu-progress 类在 styles 源中无任何规则，组件自身无样式需求；
 * packages/styles/src/components/progress.styl 不存在（构建产出占位 wxss），无差异。
 */
import {CuComponent} from '../../shared/component'
import {animateValue, type TickerHandle} from '../../shared/ticker'
import {resolveFormatValue} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    size: {type: Number, value: 70},
    width: {type: Number, value: 0},
    color: {type: String, value: '#2F86F6'},
    borderColor: {type: String, value: 'rgba(0, 0, 0, .1)'},
    fill: {type: String, value: 'transparent'},
    /** SVG stroke 语义，小程序 no-op */
    linecap: {type: String, value: 'round'},
    rotate: {type: Number, value: 0},
    /** 进度 0-1 */
    value: {type: Number, value: 0},
    transition: {type: Boolean, value: false},
    duration: {type: Number, value: 1000},
  },

  data: {
    formatValue: 0,
    isMounted: false,
  },

  observers: {
    value(val: number, oldVal: number) {
      const action = resolveFormatValue({
        value: val,
        oldValue: oldVal,
        isMounted: this.data.isMounted,
        transition: this.data.transition,
      })
      if (action.type === 'sync') {
        this.__stopAnimate()
        this.setData({formatValue: action.value})
      } else {
        this.__animateDisplay(action.from, action.to)
      }
    },
  },

  lifetimes: {
    attached() {
      // Vue onMounted：首轮已由 immediate watch 同步，此处仅置位
      this.setData({isMounted: true})
    },
    detached() {
      this.__stopAnimate()
    },
  },

  methods: {
    __stopAnimate() {
      const self = this as unknown as {__progressHandle?: TickerHandle | null}
      if (self.__progressHandle) {
        self.__progressHandle.stop()
        self.__progressHandle = null
      }
    },

    /** 对齐 Vue animateDisplay：from + (to-from) * percent，线性 */
    __animateDisplay(from: number, to: number) {
      this.__stopAnimate()
      const self = this as unknown as {__progressHandle?: TickerHandle | null}
      self.__progressHandle = animateValue({
        from,
        to,
        duration: this.data.duration,
        onUpdate: (v: number) => this.setData({formatValue: v}),
        onComplete: () => {
          self.__progressHandle = null
        },
      })
    },
  },
})

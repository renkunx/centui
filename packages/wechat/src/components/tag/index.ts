/**
 * Source: packages/vue/src/components/tag/Tag.vue
 *
 * 映射：
 *  props    size(large/small/tiny), shape(square/circle/fillet/quarter/coupon/bubble),
 *           sharp(top-left/top-right/bottom-left/bottom-right), type(fill/ghost),
 *           fillColor, fontWeight(normal/bold/bolder), fontColor
 *  events   无（Vue 版无 emits）
 *  slots    默认插槽
 *
 * 平台差异：
 *  1. circle 形状的内边距/圆角按内容高度动态计算（Vue 用 ref.offsetHeight 同步度量），
 *     小程序改用 createSelectorQuery 异步度量：ready + shape/sharp/size 变化时触发，
 *     高度去重收敛；插槽内容变化后的自动重测无 MutationObserver 等价物，
 *     对外提供 refresh() 方法手动触发（差异声明）。
 *  2. 其余类名/颜色样式全部由 stylus 源编译的 wxss 承担，无差异。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  buildCircleStyle,
  buildColorStyle,
  buildComputedClass,
  buildCouponStyle,
} from './logic'

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** tiny | small | large */
    size: {type: String, value: 'large'},
    /** square | circle | fillet | quarter | coupon | bubble */
    shape: {type: String, value: 'square'},
    /** top-left | top-right | bottom-left | bottom-right */
    sharp: {type: String, value: ''},
    /** fill | ghost */
    type: {type: String, value: 'ghost'},
    fillColor: {type: String, value: ''},
    /** normal | bold | bolder */
    fontWeight: {type: String, value: 'normal'},
    fontColor: {type: String, value: ''},
  },

  data: {
    computedClass: '',
    colorStyle: '',
    leftCouponStyle: '',
    rightCouponStyle: '',
    sizeStyle: '',
  },

  observers: {
    'size, shape, type, fontWeight'(this: WechatMiniprogram.Component.TrivialInstance) {
      this.__refreshStatics()
    },
    'fillColor, fontColor'() {
      this.__refreshStatics()
    },
    'shape, sharp, size'() {
      const state = tagState(this)
      state.lastCircleHeight = -1
      this.__refreshCircleSize()
    },
  },

  lifetimes: {
    attached() {
      tagState(this)
      this.__refreshStatics()
    },
    ready() {
      this.__refreshCircleSize()
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    __refreshStatics() {
      const p = this.data as unknown as {
        size: string
        shape: string
        type: string
        fontWeight: string
        fillColor: string
        fontColor: string
      }
      this.setData({
        computedClass: buildComputedClass(p),
        colorStyle: buildColorStyle(p),
        leftCouponStyle: buildCouponStyle(p.fillColor, 'left'),
        rightCouponStyle: buildCouponStyle(p.fillColor, 'right'),
      })
    },

    /** circle 形状度量收敛（对齐 Vue refreshCircleSize + onUpdated 去重） */
    __refreshCircleSize() {
      if (this.data.shape !== 'circle') {
        return
      }
      const state = tagState(this)
      const query = this.createSelectorQuery()
      query.select('#cu-tag-el').boundingClientRect()
      query.exec((res: Array<{height: number} | null>) => {
        const rect = res && res[0]
        if (!rect || typeof rect.height !== 'number') {
          return
        }
        const height = Math.round(rect.height)
        const next = buildCircleStyle(height, this.data.sharp, state.lastCircleHeight)
        if (!next) {
          return
        }
        state.lastCircleHeight = next.height
        this.setData({sizeStyle: next.style})
        // 内边距变化会改变内容高度（Vue onUpdated 链），再度量一轮直至收敛
        timers(this).setTimeout(() => this.__refreshCircleSize(), 50)
      })
    },

    /** 手动触发 circle 重测（插槽内容动态变化时使用） */
    refresh() {
      const state = tagState(this)
      state.lastCircleHeight = -1
      this.__refreshCircleSize()
    },
  },
})

interface TagState {
  timers: TimerRegistry
  lastCircleHeight: number
}

function tagState(ctx: unknown): TagState {
  const self = ctx as {__tagState?: TagState}
  if (!self.__tagState) {
    self.__tagState = {timers: createTimerRegistry(ctx), lastCircleHeight: -1}
  }
  return self.__tagState
}

function timers(ctx: unknown): TimerRegistry {
  return tagState(ctx).timers
}

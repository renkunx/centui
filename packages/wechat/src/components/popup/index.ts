/**
 * Source: packages/vue/src/components/popup/Popup.vue
 *
 * 映射：
 *  props    modelValue→show, hasMask, maskClosable, position, transition, preventScroll,
 *           preventScrollExclude（平台差异，见下）
 *  events   change(show=false 时 emit false，对齐 update:modelValue),
 *           beforeShow/beforeHide/show/hide/maskClick（camelCase，与 Vue emits 同名）
 *  slots    默认插槽
 *
 * 平台差异（有意为之）：
 *  1. 无 teleport：弹层渲染在组件位置，样式 position:fixed + z-index 由 tokens 提供。
 *  2. 进出场由 shared/transition.ts 状态机驱动（四段类 + 定时器真源），不依赖 transitionend。
 *  3. preventScrollExclude 不支持（无 DOM 查询）；prevent-scroll=true 时遮罩 catch:touchmove 锁定滚动穿透。
 *  4. largeRadius 由子组件（popup-title-bar）通过 relations 调 setLargeRadius() 回写，
 *     对齐 Vue 版 provide/inject 反向通道。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  defaultTransition,
  enterStartClasses,
  enterActiveClasses,
  leaveClasses,
  transitionDuration,
} from '../../shared/transition'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** 受控显隐（对齐 Vue modelValue） */
    show: {type: Boolean, value: false},
    hasMask: {type: Boolean, value: true},
    maskClosable: {type: Boolean, value: true},
    /** center | top | bottom | left | right */
    position: {type: String, value: 'center'},
    /** 覆盖默认过渡名（fade / slide-up / ...，对应 transition.styl 的 cu-<name> 家族） */
    transition: {type: String, value: ''},
    preventScroll: {type: Boolean, value: false},
  },

  data: {
    isShown: false, // 根节点 wx:if
    boxShown: false, // 弹层盒 v-show
    boxCls: '',
    maskCls: '',
    largeRadius: false,
    transitionName: '',
  },

  observers: {
    show(val: boolean) {
      if (val) {
        if (popupState(this).isAnimating) {
          // v2 行为：动画锁期间再次打开走 50ms 重试
          timers(this).setTimeout(() => this.__showPopupBox(), 50)
        } else {
          this.__showPopupBox()
        }
      } else {
        this.__hidePopupBox()
      }
    },
    position(val: string) {
      this.setData({transitionName: this.data.transition || defaultTransition(val)})
    },
    transition(val: string) {
      this.setData({transitionName: val || defaultTransition(this.data.position)})
    },
  },

  lifetimes: {
    attached() {
      // 惰性状态（定时器表 + 动画锁），observer 可能在 attached 前触发，此处仅预热
      popupState(this)
      this.setData({transitionName: this.data.transition || defaultTransition(this.data.position)})
      // 对齐 Vue onMounted：初始即 show 时直接打开
      if (this.data.show) {
        this.__showPopupBox()
      }
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    /** 子组件（popup-title-bar）经 relations 回写大圆角 */
    setLargeRadius(val: boolean) {
      this.setData({largeRadius: !!val})
    },

    __showPopupBox() {
      const state = popupState(this)
      const name = this.data.transitionName
      // 打断进行中的离场：清理其定时器（对齐 Vue transition 中断语义——
      // 终态跟随最新值，被中断的 leave 不再触发 hide/isShown 收尾）
      timers(this).clearAll()
      state.isAnimating = true
      this.setData({
        isShown: true,
        boxShown: true,
        boxCls: enterStartClasses(name),
        maskCls: enterStartClasses('mask-fade'),
      })
      // before-show 在过渡启动时触发（对齐 Vue onPopupTransitionStart）
      this.triggerEvent('beforeShow')
      // 双帧后移除起始类，触发过渡
      wx.nextTick(() => {
        wx.nextTick(() => {
          // isAnimating 已被时长定时器复位（duration 0 立即完成）时不再回填 active 类
          if (!this.data.boxShown || !popupState(this).isAnimating) return
          this.setData({
            boxCls: enterActiveClasses(name),
            maskCls: `cu-mask-fade-enter-active`,
          })
        })
      })
      timers(this).setTimeout(() => {
        if (!this.data.boxShown) return
        this.setData({boxCls: '', maskCls: ''})
        state.isAnimating = false
        this.triggerEvent('show')
      }, transitionDuration(name, 'enter'))
    },

    __hidePopupBox() {
      if (!this.data.isShown) return
      const state = popupState(this)
      const name = this.data.transitionName
      state.isAnimating = true
      this.setData({
        boxCls: leaveClasses(name),
        maskCls: leaveClasses('mask-fade'),
      })
      this.triggerEvent('beforeHide')
      // 对齐 Vue hidePopupBox：隐藏启动即 emit change(false)
      this.triggerEvent('change', {value: false})
      timers(this).setTimeout(() => {
        this.setData({isShown: false, boxShown: false, boxCls: '', maskCls: ''})
        state.isAnimating = false
        this.triggerEvent('hide')
      }, transitionDuration(name, 'leave'))
    },

    onMaskTap() {
      if (this.data.maskClosable) {
        this.__hidePopupBox()
        this.triggerEvent('maskClick')
      }
    },

    noop() {},
  },
})

/** 定时器登记表与动画锁（attached 前的 observer 触发也安全） */
interface PopupState {
  timers: TimerRegistry
  isAnimating: boolean
}

function popupState(ctx: unknown): PopupState {
  const self = ctx as {__popupState?: PopupState}
  if (!self.__popupState) {
    self.__popupState = {timers: createTimerRegistry(ctx), isAnimating: false}
  }
  return self.__popupState
}

function timers(ctx: unknown): TimerRegistry {
  return popupState(ctx).timers
}

/**
 * Source: packages/vue/src/components/transition/Transition.vue
 *
 * 映射：
 *  props    name（Vue 经 attrs 透传给内置 <Transition>，缺省 'v'；小程序缺省 'fade'
 *           ——见差异 2）、show（新增受控显隐）
 *  events   show / hide（过渡定时器结束时触发；Vue <Transition> 无事件，为平台
 *           必要补充）、beforeShow / beforeHide（过渡启动时，对齐 popup 约定）
 *  slots    默认插槽（被包裹内容）
 *
 * ★ API 差异声明（显著）：
 *  Vue 版是无逻辑包装组件 `<Transition><slot/></Transition>`——进出场由「子元素
 *  的插入/移除」自动触发（v-if 控制），name 等属性经 attrs 透传。小程序没有
 *  <transition>/transitionend 等价物，无法感知子元素插入移除，故本组件为
 *  「演示性包装组件」：以 show 属性手动控制显隐，切换时对子内容应用
 *  cu-<name>-* 四段类（enter → enter-active → 清理 / leave-to → leave-active
 *  → 隐藏），驱动内核与 popup 一致（shared/transition 状态机 + 定时器真源，
 *  时长查 TRANSITION_DURATIONS）。语义 = 手动控制 show 的容器过渡；
 *  Vue 用法 `<cu-transition name="fade"><div v-if="x"/></cu-transition>` 需改写为
 *  `<cu-transition name="fade" show="{{x}}">…</cu-transition>`。
 *
 * 平台差异：
 *  1. 进出场由 shared/transition.ts 状态机驱动（四段类 + 定时器真源），时长表与
 *     transition.styl 同步；未知 name 按时长 0 立即完成（无动画直达终态）。
 *  2. 过渡名不带 cu- 前缀（popup 约定），兼容剥除 Vue 风格 'cu-' 前缀；缺省
 *     'fade'（Vue 内置缺省 'v' 无样式意义，fade 是本库视觉约定）。
 *  3. 无 appear 语义：attached 时 show=true 直接呈现、不播入场动画（Vue
 *     <Transition> 默认也不播 initial 动画，语义一致）。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  enterStartClasses,
  enterActiveClasses,
  leaveClasses,
  transitionDuration,
} from '../../shared/transition'

interface TransitionState {
  timers: TimerRegistry
  isAnimating: boolean
}

function state(ctx: unknown): TransitionState {
  const self = ctx as {__transitionState?: TransitionState}
  if (!self.__transitionState) {
    self.__transitionState = {timers: createTimerRegistry(ctx), isAnimating: false}
  }
  return self.__transitionState
}

function timers(ctx: unknown): TimerRegistry {
  return state(ctx).timers
}

/** 过渡名规范化：剥除 Vue 风格 'cu-' 前缀，空值回退默认 'fade'（popup 约定） */
function normalizeName(name: string): string {
  return (name || '').replace(/^cu-/, '') || 'fade'
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** 过渡名：fade/slide-up/zoom/...（对应 transition.styl 的 cu-<name> 家族） */
    name: {type: String, value: 'fade'},
    /** 受控显隐（对齐 Vue 子元素 v-if 的手动等价物，见头注释 ★） */
    show: {type: Boolean, value: false},
  },

  data: {
    isShown: false,
    cls: '',
    transitionName: 'fade',
  },

  observers: {
    name(val: string) {
      this.setData({transitionName: normalizeName(val)})
    },
    show(val: boolean) {
      if (val) {
        if (state(this).isAnimating) {
          // 对齐 Vue/popup：过渡未结束再次触发走 50ms 重试
          timers(this).setTimeout(() => this.__enter(), 50)
        } else {
          this.__enter()
        }
      } else {
        this.__leave()
      }
    },
  },

  lifetimes: {
    attached() {
      this.setData({transitionName: normalizeName(this.data.name)})
      // 无 appear 语义：初始 show=true 直接呈现（与 Vue <Transition> 一致）
      if (this.data.show) {
        this.setData({isShown: true})
      }
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    __enter() {
      const name = this.data.transitionName
      const st = state(this)
      // 打断进行中的离场：清理其定时器（对齐 Vue transition 中断语义，同 popup）
      timers(this).clearAll()
      st.isAnimating = true
      this.setData({
        isShown: true,
        cls: enterStartClasses(name),
      })
      this.triggerEvent('beforeShow')
      // 双帧后移除起始类，触发过渡（对齐 popup 状态机）
      wx.nextTick(() => {
        wx.nextTick(() => {
          // isAnimating 已被时长定时器复位（duration 0 立即完成）时不再回填 active 类
          if (!this.data.isShown || !st.isAnimating) return
          this.setData({cls: enterActiveClasses(name)})
        })
      })
      timers(this).setTimeout(() => {
        if (!this.data.isShown) return
        this.setData({cls: ''})
        st.isAnimating = false
        this.triggerEvent('show')
      }, transitionDuration(name, 'enter'))
    },

    __leave() {
      if (!this.data.isShown) return
      const name = this.data.transitionName
      const st = state(this)
      st.isAnimating = true
      this.setData({cls: leaveClasses(name)})
      this.triggerEvent('beforeHide')
      timers(this).setTimeout(() => {
        this.setData({isShown: false, cls: ''})
        st.isAnimating = false
        this.triggerEvent('hide')
      }, transitionDuration(name, 'leave'))
    },
  },
})

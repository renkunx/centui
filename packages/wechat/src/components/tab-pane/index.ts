/**
 * Source: packages/vue/src/components/tabs/TabPane.vue
 *
 * tabs 内容面板：注册到父 cu-tabs（relations 对齐 Vue provide/inject rootTabs），
 * 激活态与切换方向由父下发，v-show 语义（hidden 保持挂载）+ 300ms 过渡类。
 *
 * 映射：
 *  props    name, label, disabled
 *  events   无（Vue 版无 emits；label/disabled 变化经 forceUpdate 通道由
 *           notifyChange() 通知父刷新菜单——对齐 rootTabs.forceUpdate）
 *  slots    默认插槽
 *
 * 平台差异（有意为之）：
 *  1. Vue 的 <Transition name> 进出场 → 四段类 + 300ms 定时器（shared/transition 同款
 *     状态机思路，时长与 tabs.styl 的 cu-tab-slide-* 300ms 一致）；
 *  2. v-show → hidden 属性（节点保持挂载，slot 内容状态不丢失）。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  enterActiveClasses,
  enterStartClasses,
  leaveClasses,
  PANE_TRANSITION_MS,
  type PaneTransition,
} from './logic'

interface PaneState {
  timers: TimerRegistry
  wasActive: boolean
}

function state(ctx: unknown): PaneState {
  const self = ctx as {__pane?: PaneState}
  if (!self.__pane) {
    self.__pane = {timers: createTimerRegistry(ctx), wasActive: false}
  }
  return self.__pane
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    name: {type: String, optionalTypes: [Number], value: ''},
    label: {type: String, value: ''},
    disabled: {type: Boolean, value: false},
  },

  data: {
    active: false,
    paneCls: '',
  },

  observers: {
    'label, disabled'() {
      // 对齐 Vue watch(label/disabled) → rootTabs.forceUpdate()
      const parent = (this as unknown as {__tabs?: WechatMiniprogram.Component.TrivialInstance}).__tabs
      if (parent && typeof parent.syncPanes === 'function') {
        parent.syncPanes()
      }
    },
  },

  lifetimes: {
    attached() {
      state(this)
    },
    detached() {
      state(this).timers.clearAll()
    },
  },

  relations: {
    '../tabs/index': {
      type: 'ancestor',
      linked(this: unknown, parent: WechatMiniprogram.Component.TrivialInstance) {
        ;(this as unknown as {__tabs?: WechatMiniprogram.Component.TrivialInstance}).__tabs = parent
      },
      unlinked(this: unknown) {
        ;(this as unknown as {__tabs?: WechatMiniprogram.Component.TrivialInstance | null}).__tabs = null
      },
    },
  },

  methods: {
    /** 父下发激活态与切换方向（对齐 Vue Transition name + v-show） */
    setActive(active: boolean, transitionName: PaneTransition) {
      const s = state(this)
      s.timers.clearAll()
      if (active) {
        this.setData({active: true, paneCls: enterStartClasses(transitionName)})
        wx.nextTick(() => {
          wx.nextTick(() => {
            if (!this.data.active) return
            this.setData({paneCls: enterActiveClasses(transitionName)})
            s.timers.setTimeout(() => {
              this.setData({paneCls: ''})
            }, PANE_TRANSITION_MS)
          })
        })
      } else if (s.wasActive) {
        this.setData({paneCls: leaveClasses(transitionName)})
        s.timers.setTimeout(() => {
          this.setData({active: false, paneCls: ''})
        }, PANE_TRANSITION_MS)
      } else {
        this.setData({active: false, paneCls: ''})
      }
      s.wasActive = active
    },
  },
})

/**
 * Source: packages/vue/src/components/notice-bar/NoticeBar.vue
 *
 * 映射：
 *  props    mode(link/closable), type(default/activity/warning), time(0), round(false),
 *           multiRows(false), scrollable(false), icon(''), iconSvg(no-op), closable(false)
 *  events   close（Vue 无载荷）
 *  slots    默认插槽（正文）；left/right 具名插槽（自定义左右区，优先于 icon/mode）
 *
 * 平台差异：
 *  1. 溢出判定：Vue 用 getComputedStyle + scrollWidth 同步度量；小程序以
 *     「探测态 inline-block」节点的 boundingClientRect 等价自然宽度（nowrap 下
 *     不被收缩），padding-left 取左右缘差。ready、scrollable/multiRows 变化时重测，
 *     另暴露 resize() 方法；插槽内容动态变化无 MutationObserver 等价物，
 *     需调用方手动触发 resize()（差异声明）。
 *  2. left 区空态类（cu-notice-bar-empty，Vue 为 $slots.left 同步判断）以插槽探针实现。
 *  3. iconSvg 为 Web 语义 no-op（图标统一 svg-mask 渲染）。
 *  4. 图标尺寸沿用 cu-icon 预置档位（Vue 亦未传 size，默认 md，无差异）。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {buildBarClass, isOverflow, rightIcon} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** link | closable */
    mode: {type: String, value: ''},
    /** default | activity | warning */
    type: {type: String, value: 'default'},
    /** 自动关闭毫秒数，0 不自动关闭 */
    time: {type: Number, value: 0},
    round: {type: Boolean, value: false},
    multiRows: {type: Boolean, value: false},
    scrollable: {type: Boolean, value: false},
    icon: {type: String, value: ''},
    /** Web 语义 no-op */
    iconSvg: {type: Boolean, value: false},
    closable: {type: Boolean, value: false},
  },

  data: {
    isShow: true,
    overflow: false,
    leftEmpty: false,
    barClass: 'cu-notice-bar default',
    rightIconName: 'close',
    measuring: false,
    innerStyle: '',
  },

  observers: {
    'round, type'(round: boolean, type: string) {
      this.setData({barClass: buildBarClass(round, type)})
    },
    mode(mode: string) {
      this.setData({rightIconName: rightIcon(mode)})
    },
    icon(icon: string) {
      this.setData({leftEmpty: !icon})
      this.__checkLeftEmpty()
    },
    'scrollable, multiRows'() {
      this.__checkOverflow()
    },
    time(time: number) {
      if (time) {
        this.__hide(time)
      }
    },
  },

  lifetimes: {
    attached() {
      noticeState(this)
      this.setData({
        barClass: buildBarClass(this.data.round, this.data.type),
        rightIconName: rightIcon(this.data.mode),
        leftEmpty: !this.data.icon,
      })
      if (this.data.time) {
        this.__hide(this.data.time)
      }
    },
    ready() {
      this.__checkLeftEmpty()
      this.__checkOverflow()
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    /** Vue hide(time)：自动关闭定时器，重启时回收 */
    __hide(time: number) {
      const state = noticeState(this)
      state.timers.clearTimeout(state.hideTimer)
      state.hideTimer = state.timers.setTimeout(() => {
        state.hideTimer = null
        this.setData({isShow: false})
      }, time)
    },

    /** Vue close：closable 语义才隐藏，close 事件恒触发 */
    onClose() {
      if (this.data.mode === 'closable' || this.data.closable) {
        this.setData({isShow: false})
      }
      this.triggerEvent('close')
    },

    /** left 探针：图标未设置且左插槽为空时置 empty 态 */
    __checkLeftEmpty() {
      if (this.data.icon) {
        return
      }
      const query = this.createSelectorQuery()
      query.select('#cu-nb-left-probe').boundingClientRect()
      query.exec((res: Array<unknown | null>) => {
        if (res && res[0] !== null) {
          // 探针仍在渲染 = 插槽为空
          this.setData({leftEmpty: true})
        } else if (!this.data.icon) {
          this.setData({leftEmpty: false})
        }
      })
    },

    /**
     * 溢出探测：探测态下给内容节点 inline display:inline-block（自然宽度不被收缩），
     * 度量后恢复。探测期间冻结跑马灯类，避免 padding-left:100% 污染度量。
     */
    __checkOverflow() {
      if (!this.data.scrollable) {
        return
      }
      const state = noticeState(this)
      state.timers.clearTimeout(state.measureTimer)
      state.measureTimer = state.timers.setTimeout(() => {
        state.measureTimer = null
        if (!this.data.scrollable || this.data.measuring) {
          return
        }
        this.setData({measuring: true, innerStyle: 'display:inline-block;'}, () => {
          const query = this.createSelectorQuery()
          query.select('.cu-notice-bar-content').boundingClientRect()
          query.select('.cu-notice-bar-content-inner').boundingClientRect()
          query.exec((res: Array<{width: number; left: number} | null>) => {
            const wrap = res && res[0]
            const inner = res && res[1]
            const done = () => this.setData({measuring: false, innerStyle: ''})
            if (!wrap || !inner || typeof wrap.width !== 'number') {
              done()
              return
            }
            const next = isOverflow(inner.width, inner.left - wrap.left, wrap.width)
            // 度量未变化时跳过赋值（对齐 Vue lastMeasure 去重）
            if (next !== this.data.overflow) {
              this.setData({overflow: next, measuring: false, innerStyle: ''})
            } else {
              done()
            }
          })
        })
      }, 50)
    },

    /** 手动重测（插槽内容动态变化后调用） */
    resize() {
      this.__checkLeftEmpty()
      this.__checkOverflow()
    },
  },
})

interface NoticeState {
  timers: TimerRegistry
  hideTimer: number | null
  measureTimer: number | null
}

function noticeState(ctx: unknown): NoticeState {
  const self = ctx as {__nbState?: NoticeState}
  if (!self.__nbState) {
    self.__nbState = {timers: createTimerRegistry(ctx), hideTimer: null, measureTimer: null}
  }
  return self.__nbState
}

function timers(ctx: unknown): TimerRegistry {
  return noticeState(ctx).timers
}

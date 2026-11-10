/**
 * Source: packages/vue/src/components/toast/Toast.vue + index.ts
 *
 * 映射：
 *  props    content, icon, duration, position(top/center/bottom), hasMask, square
 *           iconSvg 为 Web 语义 no-op（小程序统一 svg-mask 渲染）
 *  events   show / hide
 *  slots    默认插槽（与 icon/content 回退共存：有插槽内容则两者都渲染，
 *           Vue 版插槽优先——差异注释）
 *
 * 命令式 API（对齐 Vue 版 Toast.info/succeed/failed/loading/hide，第一参数为页面上下文）：
 *   import {Toast} from 'centui-wechat/components/toast/index'
 *   Toast.info(this, '已保存')
 *   Toast.loading(this, '加载中')      // duration=0，需 Toast.clear(this) 关闭
 *   Toast.clear(this)
 * 页面 wxml 需放置：<cu-toast id="cu-toast" />
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'

type Context = WechatMiniprogram.Component.TrivialInstance

CuComponent({
  options: {virtualHost: true},

  properties: {
    content: {type: String, value: ''},
    icon: {type: String, value: ''},
    /** 组件默认 0（不自动隐藏，loading 语义）；命令式工厂传入 3000 */
    duration: {type: Number, value: 0},
    /** top | center | bottom */
    position: {type: String, value: 'center'},
    hasMask: {type: Boolean, value: false},
    square: {type: Boolean, value: false},
  },

  data: {
    visible: false,
  },

  lifetimes: {
    attached() {
      ;(this as unknown as {__timers: TimerRegistry}).__timers = createTimerRegistry(this)
    },
    detached() {
      ;(this as unknown as {__timers: TimerRegistry}).__timers.clearAll()
    },
  },

  methods: {
    /** 命令式入口：一次应用全部 props 并显示（对齐 Vue 工厂 createVNode+render 语义） */
    show(props: Record<string, unknown> = {}) {
      const patch: Record<string, unknown> = {visible: true}
      for (const key of ['content', 'icon', 'duration', 'position', 'hasMask', 'square']) {
        if (props[key] !== undefined) patch[key] = props[key]
      }
      this.setData(patch)
      this.fire()
    },

    hide() {
      this.setData({visible: false})
    },

    /** duration>0 时自动隐藏（对齐 Vue fire()） */
    fire() {
      const timers = (this as unknown as {__timers: TimerRegistry}).__timers
      timers.clearAll()
      const {visible, duration} = this.data
      if (visible && duration > 0) {
        timers.setTimeout(() => this.hide(), duration)
      }
    },

    onPopupShow() {
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.triggerEvent('hide')
    },
  },
})

// ---------------------------------------------------------------------------
// 命令式工厂
// ---------------------------------------------------------------------------

const DEFAULT_SELECTOR = '#cu-toast'

function resolve(context: Context, selector?: string) {
  const inst = context.selectComponent(selector ?? DEFAULT_SELECTOR)
  if (!inst) {
    console.warn(
      '[CentUI] Toast: 未找到 <cu-toast>，请在页面 wxml 放置 <cu-toast id="cu-toast" />',
    )
  }
  return inst
}

/**
 * Toast factory
 * @param context 页面或组件实例
 * @param props   content/icon/duration/position/hasMask/square
 * @param selector 默认 '#cu-toast'
 */
const Toast = (context: Context, props: Record<string, unknown> = {}, selector?: string) => {
  const inst = resolve(context, selector)
  inst?.show(props)
  return inst
}

Toast.hide = (context: Context, selector?: string) => {
  resolve(context, selector)?.hide()
}
Toast.clear = Toast.hide

Toast.info = (context: Context, content = '', duration = 3000, hasMask = false, square = false) =>
  Toast(context, {icon: '', content, duration, hasMask, square})

Toast.succeed = (context: Context, content = '', duration = 3000, hasMask = false, square = false) =>
  Toast(context, {icon: 'success', content, duration, hasMask, square})

Toast.failed = (context: Context, content = '', duration = 3000, hasMask = false, square = false) =>
  Toast(context, {icon: 'fail', content, duration, hasMask, square})

Toast.loading = (context: Context, content = '', duration = 0, hasMask = true, square = false) =>
  Toast(context, {icon: 'spinner', content, duration, hasMask, square})

export {Toast}
export default Toast

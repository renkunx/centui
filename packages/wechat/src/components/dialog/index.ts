/**
 * Source: packages/vue/src/components/dialog/Dialog.vue + index.ts
 *
 * 映射：
 *  props    modelValue→show(false), title(''), icon(''), iconSvg(false, Web 语义 no-op
 *           ——小程序统一 svg-mask 渲染), closable(true), content(''), btns([]),
 *           layout('row'), appendTo(Web 挂载点概念，小程序无 teleport，no-op),
 *           hasMask(true), maskClosable(false), transition('fade'，Vue 默认 cu-fade),
 *           preventScroll(false), preventScrollExclude(''，平台差异 no-op，遮罩
 *           catch:touchmove 锁滚动穿透)
 *  events   update:modelValue→change({value})；show / hide（popup 状态机转发，
 *           show 在进场结束、hide 在离场结束——对齐 Vue 转发时机）
 *  slots    header（具名）；默认插槽覆盖 content 的 v-html 文本
 *  methods  close()（defineExpose 对齐）；show(options)/hide()（命令式一等 API，§6）
 *
 * 命令式 API（页面需放置 <cu-dialog id="cu-dialog" />）：
 *   import {Dialog} from '.../components/dialog/index'
 *   await Dialog.confirm(this, {title, content})   // resolve=确认 reject={type:'cancel'}
 *   await Dialog.alert(this, {content})            // 任何关闭 resolve
 *   Dialog.succeed(this, {...}) / Dialog.failed(this, {...})  // icon 预设（浅拷贝 options）
 *   Dialog.closeAll()
 *   实现见 ./factory.ts（可独立测试）。
 *
 * 平台差异（有意为之）：
 *  1. 无 teleport/appendTo：弹层渲染在组件位置，z-index 经 dialog.wxss 的
 *     .cu-dialog .cu-popup 规则（token dialog-zindex）覆盖 popup 默认值；
 *     本组件 styleIsolation: shared 以命中 popup/activity-indicator 内部节点。
 *  2. v-html → <rich-text nodes="{{content}}"/>（§8）；默认插槽与 content 同时提供时
 *     两者都渲染（Vue 为插槽优先，WXML 无插槽探测，约定二选一）。
 *  3. btns 内 handler 函数不进 setData：show()/property 归一化时抽离登记到实例状态
 *     （normalizeDialogBtns），按钮点击按索引取回调用；handler 返回 false 不关闭（Vue 语义）。
 *  4. loading 指示器为 cu-activity-indicator roller（32px），着色由 color 属性按
 *     按钮位次传 token（Vue 为 SVG stroke 的 CSS 覆盖，warning/disabled 态描边色差异已声明）。
 *  5. 工厂过渡名剥除 Vue 风格 cu- 前缀（'cu-bounce'→'bounce'），兼容传入。
 *  6. preventScrollExclude 无 DOM 查询，不支持；prevent-scroll=true 时遮罩锁滚动穿透。
 */
import {CuComponent} from '../../shared/component'
import {optimisticUpdate} from '../../shared/controlled'
import {
  btnLoadingColor,
  DIALOG_TEXT,
  isBtnBlocked,
  normalizeDialogBtns,
  stripTransition,
  type DialogBtn,
  type DialogBtnView,
} from './logic'
import {DialogFactory} from './factory'

interface DialogState {
  handlers: Array<DialogBtn['handler'] | undefined>
  onHide?: () => void
  onShow?: () => void
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue（受控显隐） */
    show: {type: Boolean, value: false},
    title: {type: String, value: ''},
    icon: {type: String, value: ''},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
    closable: {type: Boolean, value: true},
    /** 经 rich-text 渲染（对齐 Vue v-html，勿传不可信内容） */
    content: {type: String, value: ''},
    /** DialogBtn[]：handler 抽离实例状态，渲染字段进 data */
    btns: {type: Object, value: [] as DialogBtn[]},
    /** row | column */
    layout: {type: String, value: 'row'},
    hasMask: {type: Boolean, value: true},
    maskClosable: {type: Boolean, value: false},
    /** Vue 默认 cu-fade；小程序过渡名不带 cu- 前缀 */
    transition: {type: String, value: 'fade'},
    preventScroll: {type: Boolean, value: false},
    /** 平台差异 no-op */
    preventScrollExclude: {type: String, value: ''},
  },

  data: {
    innerShow: false,
    transitionName: 'fade',
    btnViews: [] as DialogBtnView[],
    btnColors: [] as string[],
    confirmText: DIALOG_TEXT.confirm,
    cancelText: DIALOG_TEXT.cancel,
  },

  observers: {
    show(v: boolean) {
      this.setData({innerShow: v})
    },
    'btns, layout'() {
      this.__refreshBtns()
    },
    transition(val: string) {
      this.setData({transitionName: stripTransition(val, 'fade')})
    },
  },

  lifetimes: {
    attached() {
      const self = this as unknown as {__dialogState?: DialogState}
      // observer 可能先于 attached 归一化出 handlers，不覆盖已有状态
      if (!self.__dialogState) self.__dialogState = {handlers: []}
      this.setData({
        innerShow: this.data.show,
        transitionName: stripTransition(this.data.transition, 'fade'),
      })
      this.__refreshBtns()
    },
  },

  methods: {
    __refreshBtns() {
      const {views, handlers} = normalizeDialogBtns(this.data.btns as DialogBtn[])
      const state = (this as unknown as {__dialogState?: DialogState}).__dialogState
      if (state) state.handlers = handlers
      this.setData({
        btnViews: views,
        btnColors: views.map((_, i) => btnLoadingColor(i, views.length)),
      })
    },

    /**
     * 命令式入口：一次应用全部选项并显示（对齐 Vue 工厂 createVNode 语义）。
     * btns 内 handler、_onShow/_onHide 钩子为函数，抽离实例状态，不入 setData。
     */
    show(options: Record<string, unknown> = {}) {
      const state = (this as unknown as {__dialogState?: DialogState}).__dialogState ?? {handlers: []}
      const serializable: Record<string, unknown> = {}
      for (const key of [
        'title',
        'icon',
        'iconSvg',
        'closable',
        'content',
        'btns',
        'layout',
        'hasMask',
        'maskClosable',
        'transition',
        'preventScroll',
      ]) {
        if (options[key] !== undefined) serializable[key] = options[key]
      }
      if (typeof options._onHide === 'function') state.onHide = options._onHide as () => void
      if (typeof options._onShow === 'function') state.onShow = options._onShow as () => void
      // 属性写入（含 btns），observer 'btns, layout' 会归一化 handler
      this.setData({...serializable, innerShow: true})
    },

    hide() {
      this.setData({innerShow: false})
    },

    /** defineExpose close：emit update:modelValue(false)（对齐 Vue close()） */
    close() {
      optimisticUpdate(this, {innerShow: false}, 'change', {value: false})
    },

    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail.value) return
      optimisticUpdate(this, {innerShow: false}, 'change', {value: false})
    },

    onPopupShow() {
      const state = (this as unknown as {__dialogState?: DialogState}).__dialogState
      state?.onShow?.()
      this.triggerEvent('show')
    },

    onPopupHide() {
      const state = (this as unknown as {__dialogState?: DialogState}).__dialogState
      state?.onHide?.()
      // 命令式钩子一次性（对齐 Vue 工厂：hide 后容器销毁）
      if (state) state.onHide = undefined
      this.triggerEvent('hide')
    },

    /** Vue onClickBtn：disabled/loading 阻断；handler 返回 false 不关闭；无 handler 直接关闭 */
    onClickBtn(e: WechatMiniprogram.BaseEvent) {
      const index = Number((e.currentTarget.dataset as {index: number}).index)
      const view = this.data.btnViews[index]
      if (!view || isBtnBlocked(view)) return
      const state = (this as unknown as {__dialogState?: DialogState}).__dialogState
      const handler = state?.handlers[index]
      if (typeof handler === 'function') {
        const btn = (this.data.btns as DialogBtn[])[index] ?? {}
        if (handler(btn) === false) return
      }
      this.close()
    },

    /** 关闭图标（closable） */
    onClose() {
      this.close()
    },

    noop() {},
  },
})

export {DialogFactory as Dialog}
export default DialogFactory

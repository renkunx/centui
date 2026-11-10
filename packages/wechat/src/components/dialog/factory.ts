/**
 * Dialog 命令式工厂（对齐 Vue 版 components/dialog/index.ts 的 confirm/alert/succeed/failed/closeAll；
 * 自 v2 契约迁移为「页面放置 <cu-dialog id="cu-dialog"/> + selectComponent」的小程序惯例，PORTING_SPEC §6）。
 *
 * Promise 语义（Vue 版本体为实例 + 回调；本移植按 §6 Vant Weapp 惯例扩展为 Promise）：
 *   Dialog.confirm(context, options) → 确认按钮 resolve；取消按钮/关闭图标/遮罩/hide()/closeAll reject({type:'cancel'})
 *   Dialog.alert(context, options)   → 单按钮无取消语义，任何关闭路径均 resolve
 *   onConfirm/onCancel 返回 false 时阻止关闭，Promise 保持 pending（对齐 Vue 版）
 *   succeed/failed = confirm 的 icon 预设（浅拷贝 options，不改写入参——对齐修复后的 Vue 版）
 *
 * 独立于 index.ts（不触达 Component()），可被逻辑测试直接加载。
 */
import {DIALOG_TEXT, DialogBtn, stripTransition} from './logic'

type Context = WechatMiniprogram.Component.TrivialInstance

interface DialogComp {
  show(options: Record<string, unknown>): void
  hide(): void
}

export interface DialogHost {
  selectComponent(selector: string): DialogComp | null
}

export interface DialogGenerateOptions {
  title?: string
  icon?: string
  iconSvg?: boolean
  content?: string
  closable?: boolean
  layout?: string
  transition?: string
  hasMask?: boolean
  maskClosable?: boolean
  /** 弹层组件 selector，默认 '#cu-dialog' */
  selector?: string
  onShow?: () => void
  onHide?: () => void
}

export interface DialogConfirmOptions extends DialogGenerateOptions {
  cancelText?: string
  cancelWarning?: boolean
  confirmText?: string
  confirmWarning?: boolean
  onConfirm?: () => boolean | void
  onCancel?: () => boolean | void
}

export interface DialogAlertOptions extends DialogGenerateOptions {
  confirmText?: string
  warning?: boolean
  onConfirm?: () => boolean | void
}

export interface DialogInstance {
  close: () => void
}

const DEFAULT_SELECTOR = '#cu-dialog'
const noop = () => {}

/** 全部活跃实例（closeAll 用，对齐 Vue 版 instances 登记表） */
const instances: DialogInstance[] = []

function resolve(context: Context, selector?: string): DialogComp | null {
  const inst = context.selectComponent(selector ?? DEFAULT_SELECTOR) as unknown as DialogComp | null
  if (!inst) {
    console.warn(
      '[CentUI] Dialog: 未找到 <cu-dialog>，请在页面 wxml 放置 <cu-dialog id="cu-dialog" />',
    )
  }
  return inst
}

function unregister(instance: DialogInstance) {
  const index = instances.indexOf(instance)
  if (index >= 0) instances.splice(index, 1)
}

interface GenerateHooks {
  /** Promise settle 分支：confirm 按钮以外关闭时的语义 */
  dismissResolves: boolean
  onShow?: () => void
  onHide?: () => void
}

/**
 * Dialog factory 内核（对齐 Vue 版 generate()）：
 * Promise 先建、btns handler 内联 settle + close、_onHide 钩子兜底 settle + 注销。
 * 每个按钮自带 confirmed 语义（取消按钮 settle(false)）。
 */
function generate(
  context: Context,
  options: DialogGenerateOptions,
  btns: Array<{btn: DialogBtn; confirmed: boolean}>,
  hooks: GenerateHooks,
  /** always-resolve：alert 等无取消语义的形态 */
  alwaysResolve: boolean,
): Promise<void> {
  const comp = resolve(context, options.selector)
  if (!comp) {
    return Promise.reject(new Error('[CentUI] Dialog: 未找到 <cu-dialog> 弹层组件'))
  }

  let resolveP: () => void = noop
  let rejectP: (reason: unknown) => void = noop
  const promise = new Promise<void>((res, rej) => {
    resolveP = res
    rejectP = rej
  })

  const state = {settled: false, closed: false}
  const settle = (confirmed: boolean) => {
    if (state.settled) return
    state.settled = true
    if (confirmed || alwaysResolve) resolveP()
    else rejectP({type: 'cancel'})
  }

  const instance: DialogInstance = {
    close: () => {
      // Vue generate instance.close：value 已关闭时幂等返回
      if (state.closed) return
      state.closed = true
      settle(false)
      comp.hide()
    },
  }
  instances.push(instance)

  const wrapped: DialogBtn[] = btns.map(({btn, confirmed}) => ({
    ...btn,
    handler: (view: DialogBtn) => {
      const result = btn.handler ? btn.handler(view) : undefined
      if (result !== false) {
        state.closed = true
        settle(confirmed)
        comp.hide()
      }
    },
  }))

  // 函数一律走钩子，不进 setData（§9 禁止 setData 传函数）
  const {selector, onShow, onHide, ...rest} = options
  void selector
  comp.show({
    ...rest,
    btns: wrapped,
    transition: stripTransition(options.transition, 'bounce'),
    _onShow: () => {
      ;(onShow ?? noop)()
    },
    _onHide: () => {
      settle(hooks.dismissResolves)
      unregister(instance)
      ;(onHide ?? hooks.onHide ?? noop)()
    },
  })

  return promise
}

/**
 * Dynamically create a confirm dialog（对齐 Vue 版 Dialog.confirm 的按钮组装与 locale 默认值）
 */
function confirm(context: Context, options: DialogConfirmOptions = {}): Promise<void> {
  const {
    title = '',
    icon = '',
    iconSvg = true,
    content = '',
    cancelText = DIALOG_TEXT.cancel,
    cancelWarning = false,
    confirmText = DIALOG_TEXT.confirm,
    confirmWarning = false,
    closable = false,
    transition,
    onConfirm = noop,
    onCancel = noop,
  } = options

  return generate(
    context,
    {
      selector: options.selector,
      title,
      icon,
      iconSvg,
      content,
      closable,
      transition,
      onShow: options.onShow,
      onHide: options.onHide,
    },
    [
      {
        btn: {
          text: cancelText,
          warning: cancelWarning,
          handler: () => onCancel() !== false,
        },
        confirmed: false,
      },
      {
        btn: {
          text: confirmText,
          warning: confirmWarning,
          handler: () => onConfirm() !== false,
        },
        confirmed: true,
      },
    ],
    {dismissResolves: false},
    false,
  )
}

/**
 * Dynamically create an alert dialog（单按钮，任何关闭路径均 resolve）
 */
function alert(context: Context, options: DialogAlertOptions = {}): Promise<void> {
  const {
    title = '',
    icon = '',
    iconSvg = true,
    content = '',
    confirmText = DIALOG_TEXT.confirm,
    closable = false,
    warning = false,
    transition,
    onConfirm = noop,
  } = options

  return generate(
    context,
    {
      selector: options.selector,
      title,
      icon,
      iconSvg,
      content,
      closable,
      transition,
      onShow: options.onShow,
      onHide: options.onHide,
    },
    [
      {
        btn: {
          text: confirmText,
          warning,
          handler: () => onConfirm() !== false,
        },
        confirmed: true,
      },
    ],
    {dismissResolves: true},
    true,
  )
}

/**
 * Dynamically create a succeed dialog（icon 预设；浅拷贝不改写入参——对齐修复后的 Vue 版）
 */
function succeed(context: Context, options: DialogConfirmOptions = {}): Promise<void> {
  return confirm(context, {...options, icon: 'success-color'})
}

/**
 * Dynamically create a failed dialog（icon 预设；浅拷贝不改写入参——对齐修复后的 Vue 版）
 */
function failed(context: Context, options: DialogConfirmOptions = {}): Promise<void> {
  return confirm(context, {...options, icon: 'warn-color'})
}

/**
 * Close all actived static dialogs
 */
function closeAll() {
  for (const instance of [...instances]) {
    instance.close()
  }
}

export const DialogFactory = {confirm, alert, succeed, failed, closeAll}
export {DEFAULT_SELECTOR as DIALOG_DEFAULT_SELECTOR}

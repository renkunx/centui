/**
 * ActionSheet 命令式工厂（对齐 Vue 版 components/action-sheet/index.ts 的 create；
 * 自 v2 契约迁移为「页面放置 <cu-action-sheet id="cu-action-sheet"/> + selectComponent」，§6）。
 *
 * Promise 语义（对齐任务契约）：
 *   ActionSheet.create(context, options) → 选中项 resolve {index, text}；取消/close() resolve {cancel:true}
 *   options.onSelected/onCancel/onShow/onHide 回调保持 v2 兼容。
 *
 * 未 show 即 close 的清理路径对齐修复后的 Vue 版（mounted/destroyed 标志幂等清理）：
 *   create({value: false}) 后直接 close() → 不触发 onHide、直接注销登记并 settle {cancel:true}。
 *
 * 同一弹层组件上重复 create：前一个未决注册按 {cancel:true} settle（小程序无法并行
 * 挂载两个容器，Vue 版为独立容器——差异声明）。
 *
 * 独立于 index.ts（不触达 Component()），可被逻辑测试直接加载。
 */

type Context = WechatMiniprogram.Component.TrivialInstance

interface ActionSheetComp {
  show(options: Record<string, unknown>): void
  hide(): void
}

export interface ActionSheetHost {
  selectComponent(selector: string): ActionSheetComp | null
}

export type ActionSheetOption = {
  text?: string
  label?: string
  disabled?: boolean
}

export interface ActionSheetCreateProps {
  /** 创建即显示（false 时需手动 show 或由 close 清理——v2 契约） */
  value?: boolean
  title?: string
  options?: ActionSheetOption[]
  defaultIndex?: number
  invalidIndex?: number | number[]
  cancelText?: string
  maxHeight?: number
  /** 弹层组件 selector，默认 '#cu-action-sheet' */
  selector?: string
  onShow?: () => void
  onHide?: () => void
  onSelected?: (option: ActionSheetOption) => void
  onCancel?: () => void
}

export type ActionSheetResult = {index: number; text: string} | {cancel: true}

export interface ActionSheetPromise extends Promise<ActionSheetResult> {
  /** 关闭动作面板（等价 v2 instance.close） */
  close: () => void
}

const DEFAULT_SELECTOR = '#cu-action-sheet'
const noop = () => {}

/** 组件实例 → 活跃注册（同一弹层组件重复 create 时收敛前一个） */
const activeByComp = new WeakMap<object, {settle: (result: ActionSheetResult) => void}>()

function resolve(context: Context, selector?: string): ActionSheetComp | null {
  const inst = context.selectComponent(selector ?? DEFAULT_SELECTOR) as unknown as ActionSheetComp | null
  if (!inst) {
    console.warn(
      '[CentUI] ActionSheet: 未找到 <cu-action-sheet>，请在页面 wxml 放置 <cu-action-sheet id="cu-action-sheet" />',
    )
  }
  return inst
}

/**
 * Dynamically create an ActionSheet（对齐 Vue 版 create 的 mounted/destroyed 生命周期）
 */
function create(context: Context, props: ActionSheetCreateProps = {}): ActionSheetPromise {
  const {
    value = true,
    title = '',
    options = [],
    defaultIndex = -1,
    invalidIndex = -1,
    cancelText,
    maxHeight = 400,
    selector,
    onShow = noop,
    onHide = noop,
    onSelected = noop,
    onCancel = noop,
  } = props

  const comp = resolve(context, selector)
  if (!comp) {
    return Promise.reject(new Error('[CentUI] ActionSheet: 未找到弹层组件')) as unknown as ActionSheetPromise
  }

  // 同一组件上的前一个未决注册按 cancel 收敛
  const previous = activeByComp.get(comp)
  if (previous) previous.settle({cancel: true})

  let resolveP: (result: ActionSheetResult) => void = noop
  const promise = new Promise<ActionSheetResult>(res => {
    resolveP = res
  }) as ActionSheetPromise

  /** 是否执行过 show（决定 close 走弹层关闭还是直接清理，对齐 Vue mounted 标志） */
  const state = {mounted: false, destroyed: false, settled: false}
  const settle = (result: ActionSheetResult) => {
    if (state.settled) return
    state.settled = true
    resolveP(result)
  }
  const cleanup = () => {
    if (state.destroyed) return
    state.destroyed = true
    activeByComp.delete(comp)
  }

  promise.close = () => {
    if (state.destroyed) return
    if (!state.mounted) {
      // 从未显示过（value:false 创建后直接 close）：不会触发 hide 回调，
      // 必须直接清理注册并 settle，否则实例会永久滞留（对齐修复后的 Vue 版）
      settle({cancel: true})
      cleanup()
      return
    }
    comp.hide()
  }

  activeByComp.set(comp, {settle})

  const showPayload: Record<string, unknown> = {
    title,
    options,
    defaultIndex,
    invalidIndex,
    maxHeight,
    _onShow: () => {
      state.mounted = true
      onShow()
    },
    _onSelected: (payload: {index: number; item: ActionSheetOption}) => {
      settle({index: payload.index, text: payload.item?.text || payload.item?.label || ''})
      onSelected(payload.item)
      comp.hide()
    },
    _onCancel: () => {
      settle({cancel: true})
      onCancel()
    },
    _onHide: () => {
      cleanup()
      onHide()
    },
  }
  if (cancelText !== undefined) showPayload.cancelText = cancelText

  if (value) {
    comp.show(showPayload)
  } else {
    // value:false：仅登记配置，不显示（v2 契约；close() 走未挂载清理路径）
    comp.show({...showPayload, _deferred: true})
  }

  return promise
}

export const ActionSheetFactory = {create}
export {DEFAULT_SELECTOR as ACTION_SHEET_DEFAULT_SELECTOR}

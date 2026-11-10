/**
 * dialog 纯逻辑（对照 Vue 版 Dialog.vue + index.ts）
 */

export interface DialogBtn {
  text?: string
  icon?: string
  iconSvg?: boolean
  disabled?: boolean
  warning?: boolean
  loading?: boolean
  handler?: (btn: DialogBtn) => boolean | void
}

/** 渲染用按钮视图（可序列化，供 setData；handler 抽离另行登记） */
export interface DialogBtnView {
  text: string
  icon: string
  disabled: boolean
  warning: boolean
  loading: boolean
}

export interface NormalizedBtns {
  views: DialogBtnView[]
  handlers: Array<DialogBtn['handler'] | undefined>
}

/**
 * Vue onClickBtn / 模板渲染的按钮归一化：
 * handler 抽出（setData 禁止函数，登记到实例状态），渲染字段序列化。
 */
export function normalizeDialogBtns(btns: DialogBtn[] | undefined): NormalizedBtns {
  const list = Array.isArray(btns) ? btns : []
  const views: DialogBtnView[] = []
  const handlers: Array<DialogBtn['handler'] | undefined> = []
  for (const btn of list) {
    const item = btn ?? {}
    views.push({
      text: item.text ?? '',
      icon: item.icon ?? '',
      disabled: !!item.disabled,
      warning: !item.disabled && !!item.warning,
      loading: !!item.loading,
    })
    handlers.push(typeof item.handler === 'function' ? item.handler : undefined)
  }
  return {views, handlers}
}

/** Vue onClickBtn：disabled/loading 阻断 */
export function isBtnBlocked(view: DialogBtnView): boolean {
  return view.disabled || view.loading
}

/**
 * loading 指示器着色（Vue 由 CSS 按 .cu-dialog-btn 状态链指定 stroke）：
 * 末位（确认）按钮 highlight 色，其余 minor 色；warning/disabled 的 stroke 覆盖无平台等价物。
 */
export function btnLoadingColor(index: number, total: number): string {
  return index === total - 1
    ? 'var(--dialog-action-highlight-color)'
    : 'var(--color-text-minor)'
}

/** Vue transition 值（'cu-fade' / 'cu-bounce'）→ 小程序过渡名（剥 cu- 前缀） */
export function stripTransition(name: string | undefined, fallback: string): string {
  const stripped = (name || '').replace(/^cu-/, '')
  return stripped || fallback
}

/** locale 默认值（对齐 @centui/core lang/zh-CN） */
export const DIALOG_TEXT = {
  confirm: '确定',
  cancel: '取消',
} as const

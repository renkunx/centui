/**
 * action-bar 纯逻辑（对照 Vue 版 ActionBar.vue）
 */

export interface ActionBarAction {
  text?: string
  type?: string
  plain?: boolean
  round?: boolean
  inactive?: boolean
  loading?: boolean
  icon?: string
  iconSvg?: boolean
  disabled?: boolean
  /** Vue 支持逐项 onClick 回调；小程序属性不可携带函数，仅触发组件 click 事件（差异声明） */
  onClick?: unknown
}

/** 传给 cu-button 的视图模型（纯数据） */
export interface ActionBarButtonVM {
  text: string
  type: string
  plain: boolean
  round: boolean
  inactive: boolean
  loading: boolean
  icon: string
  iconSvg: boolean
}

/** v2 契约：actions 最多展示两个 */
export function coerceActions(actions: ActionBarAction[]): ActionBarAction[] {
  return actions.slice(0, 2)
}

/** Vue 模板：:type="item.type || (item.disabled ? 'disabled' : 'primary')"、:plain="item.plain || index !== length-1" */
export function toButtonVMs(actions: ActionBarAction[]): ActionBarButtonVM[] {
  const coerced = coerceActions(actions)
  return coerced.map((item, index) => ({
    text: item.text ?? '',
    type: item.type || (item.disabled ? 'disabled' : 'primary'),
    plain: !!(item.plain || index !== coerced.length - 1),
    round: !!item.round,
    inactive: !!item.inactive,
    loading: !!item.loading,
    icon: item.icon ?? '',
    iconSvg: !!item.iconSvg,
  }))
}

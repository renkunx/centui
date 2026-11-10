/**
 * agree 纯逻辑（对照 Vue 版 Agree.vue）
 */

export interface AgreeProps {
  value: boolean
  disabled: boolean
  size: string
  iconType: string
}

/** Vue onChange：disabled 直接返回；否则取反并 emit */
export function nextChecked(props: Pick<AgreeProps, 'value' | 'disabled'>): boolean | null {
  if (props.disabled) {
    return null
  }
  return !props.value
}

/** 图标名：circle → checked/check，square → square-checked/square-check */
export function iconNames(iconType: string): {checked: string; unchecked: string} {
  if (iconType === 'square') {
    return {checked: 'square-checked', unchecked: 'square-check'}
  }
  return {checked: 'checked', unchecked: 'check'}
}

/**
 * 两个图标的着色（mask 图标不走 CSS color，改由内联 background-color 承担，
 * 缩放/透明度过渡仍由 styl 的 transform/opacity 规则驱动）：
 *  - checked 图标：勾选态 agree-fill，未勾选 transparent（对齐 .cu-icon-checked color 规则）
 *  - check 图标：恒为 agree-fill（对齐 .cu-icon-check color 规则；勾选后 0.8 透明度由 styl 承担）
 */
export function iconColors(checked: boolean, agreeFill: string): {checked: string; unchecked: string} {
  return {
    checked: checked ? agreeFill : 'transparent',
    unchecked: agreeFill,
  }
}

/**
 * action-sheet 纯逻辑（对照 Vue 版 ActionSheet.vue）
 */

export interface ActionSheetOption {
  /** 选项文案（Vue 经 v-html 渲染，小程序改 rich-text） */
  text?: string
  /** 同 text（v2 兼容字段） */
  label?: string
  disabled?: boolean
}

/** Vue invalidIndex: number | number[]；-1 视为无禁用 */
export function normalizeInvalidIndex(value: number | number[] | undefined | null): number[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'number' && Number.isInteger(item))
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return [value]
  return []
}

/** Vue: index === props.invalidIndex || inArray(props.invalidIndex, index) */
export function isInvalidIndex(index: number, invalidList: number[]): boolean {
  return invalidList.includes(index)
}

/** Vue: item.text || item.label */
export function optionText(item: ActionSheetOption | string | undefined | null): string {
  if (item == null) return ''
  if (typeof item === 'string') return item
  return item.text || item.label || ''
}

/** locale 默认（对齐 @centui/core lang/zh-CN md.action_sheet.cancel） */
export const ACTION_SHEET_CANCEL_TEXT = '取消'

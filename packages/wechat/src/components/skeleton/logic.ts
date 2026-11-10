/**
 * skeleton 纯逻辑（对照 Vue 版 Skeleton.vue）
 */

export const DEFAULT_TITLE_WIDTH = '40%'
export const DEFAULT_WIDTH = '100%'

function isNumber(n: unknown): n is number {
  return typeof n === 'number'
}

/** Vue rowWidthStyle(index)：数组按位取值（缺位回退 100%），数值补 %，字符串原样 */
export function rowWidthStyle(
  rowWidth: number | string | Array<number | string> | undefined,
  index: number,
): string {
  if (Array.isArray(rowWidth)) {
    const v = rowWidth[index]
    if (v == null) {
      return DEFAULT_WIDTH
    }
    return isNumber(v) ? `${v}%` : String(v)
  }
  if (rowWidth) {
    return isNumber(rowWidth) ? `${rowWidth}%` : String(rowWidth)
  }
  return DEFAULT_WIDTH
}

/** Vue titleWidthStyle：数值补 %，字符串原样 */
export function titleWidthStyle(titleWidth: number | string | undefined): string {
  return titleWidth == null
    ? DEFAULT_TITLE_WIDTH
    : isNumber(titleWidth)
      ? `${titleWidth}%`
      : String(titleWidth)
}

/** 最后一行固定 60%（Vue 模板 index === row 分支） */
export function rowStyleAt(
  rowWidth: number | string | Array<number | string> | undefined,
  index: number,
  row: number,
): string {
  return index === row - 1 ? '60%' : rowWidthStyle(rowWidth, index)
}

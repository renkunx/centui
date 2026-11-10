/**
 * bill 纯逻辑（对照 Vue 版 Bill.vue）
 */

/** Vue 模板 NO.{{ no }}（no 为 string|number，空值不渲染节点——wx:if 承担） */
export function buildNoLabel(no: string | number): string {
  return `NO.${no}`
}

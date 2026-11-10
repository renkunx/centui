/**
 * Radio 家族共享纯逻辑（自 Vue 版 check/shared.ts useRadioDelegate 提取）。
 */
export type RadioValue = string | number | boolean

/** Radio 选中态：自身 v-model 命中，或所在 RadioGroup 的值等于 name */
export function isRadioChecked(
  value: RadioValue,
  name: RadioValue,
  groupValue: RadioValue | null,
): boolean {
  return value === name || (groupValue !== null && groupValue === name)
}

/** Radio 点击后的目标值（disabled 守卫在组件层处理） */
export function nextRadioValue(name: RadioValue): RadioValue {
  return name
}

/**
 * Check 家族共享纯逻辑（自 Vue 版 check/shared.ts useCheckDelegate 与
 * CheckGroup 的 check/uncheck/toggle/toggleAll 提取，行为逐一对照）。
 *
 * 注意：toggleAll 对齐 Vue 版 Object.keys(children) 的键字符串化行为——
 * 非 string 类型 name 会以 String(name) 形态进入结果数组（v2 血统的历史语义）。
 */
export type CheckValue = string | number | boolean
export type CheckGroupValue = CheckValue[]

/** Check 选中态：自身 v-model 命中，或所在 CheckGroup 的 value 数组包含 name */
export function isCheckChecked(
  value: CheckValue,
  name: CheckValue,
  groupValue: CheckGroupValue,
): boolean {
  return value === name || groupValue.indexOf(name) !== -1
}

/** Check 点击后的自身 v-model 目标值：布尔名取反 / 已选反选为 '' / 未选选中上报 */
export function nextCheckValue(name: CheckValue, value: CheckValue, isChecked: boolean): CheckValue {
  if (typeof name === 'boolean') {
    return !value
  }
  if (isChecked) {
    return ''
  }
  return name
}

/** CheckGroup.check：未选中且未超 max 时追加（对齐 Vue rootGroup.check） */
export function checkName(value: CheckGroupValue, name: CheckValue, max: number): CheckGroupValue {
  const index = value.indexOf(name)
  if (index === -1 && (max < 1 || value.length < max)) {
    return value.concat(name)
  }
  return value
}

/** CheckGroup.uncheck：已选中时移除（对齐 Vue rootGroup.uncheck） */
export function uncheckName(value: CheckGroupValue, name: CheckValue): CheckGroupValue {
  const index = value.indexOf(name)
  if (index !== -1) {
    return value.slice(0, index).concat(value.slice(index + 1))
  }
  return value
}

/** CheckGroup.toggle：选中态取反（对齐 Vue rootGroup.toggle） */
export function toggleName(
  value: CheckGroupValue,
  name: CheckValue,
  max: number,
): CheckGroupValue {
  return value.indexOf(name) === -1 ? checkName(value, name, max) : uncheckName(value, name)
}

export interface CheckChildRecord {
  name: CheckValue
  disabled?: boolean
}

/**
 * CheckGroup.toggleAll：disabled 子项保持原状；checked=false 全清、缺省取反、
 * truthy 全选。子项登记表语义与 Vue 一致（name 为 true/'' 的子项不参与），
 * 结果键与 Vue Object.keys 相同地字符串化。
 */
export function toggleAllValues(
  children: CheckChildRecord[],
  value: CheckGroupValue,
  checked?: boolean,
): CheckValue[] {
  return children
    .filter((child) => child.name !== true && child.name !== '')
    .filter((child) => {
      const isChecked = !!~value.indexOf(child.name)
      // disabled options retain original status
      if (child.disabled) {
        return isChecked
      }
      return checked === false ? false : !checked ? !isChecked : true
    })
    .map((child) => String(child.name))
}

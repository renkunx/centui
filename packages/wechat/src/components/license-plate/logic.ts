/**
 * license-plate 纯逻辑（对照 Vue 版 LicensePlate.vue + LicensePlateKeyboard.vue）。
 * 顺序填写契约见 packages/vue/test/components/license-plate-order.spec.ts。
 */

export const PLATE_LENGTH = 8

/** 默认省份简写（Vue shortcuts 默认值） */
export const DEFAULT_SHORTCUTS = [
  '京', '津', '渝', '沪', '冀', '晋', '辽', '吉', '黑', '苏',
  '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '琼',
  '川', '贵', '云', '陕', '甘', '青', '蒙', '桂', '宁', '新', '藏',
]

export interface LicenseKeyItem {
  value?: string | number
  type?: 'delete' | 'confirm'
  text?: string
  disabled?: boolean
}

/** 字母键盘数据（I/O 不可用） */
export const LETTER_KEYS: LicenseKeyItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => ({
  value: letter,
  disabled: letter === 'I' || letter === 'O',
}))

export const NUMBER_KEYS: LicenseKeyItem[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(value => ({
  value,
  disabled: false,
}))

/** 键盘面板数据（Vue dyKeyboard computed） */
export interface LicenseKeyboard {
  shortcuts: string[]
  mixedKeyboard: LicenseKeyItem[]
  /** 1=省份简写键盘（第一位）；2=字母数字混合键盘（第二位起） */
  keyboardType: number
}

export function buildKeyboard(selectedIndex: number, shortcuts: string[]): LicenseKeyboard {
  if (selectedIndex === 0) {
    return {shortcuts, mixedKeyboard: [], keyboardType: 1}
  }
  // 字母键盘 + 功能键：删除键插在 T 后（index 19），确定键追加尾部
  const letters = LETTER_KEYS.map(item => ({...item}))
  letters.splice(19, 0, {type: 'delete', disabled: false})
  letters.push({type: 'confirm', text: '确定', disabled: false})

  // 数字键（第二位禁用数字）
  const nums =
    selectedIndex === 1
      ? NUMBER_KEYS.map(item => ({value: item.value, disabled: true}))
      : NUMBER_KEYS.map(item => ({...item}))

  return {shortcuts, mixedKeyboard: nums.concat(letters), keyboardType: 2}
}

/** 空 keyArray（8 位） */
export function emptyKeyArray(): string[] {
  return new Array(PLATE_LENGTH).fill('')
}

/**
 * Vue keyMapping 的顺序填写守卫（license-plate-order.spec 契约）：
 * disorderClick=false 时，"前后两位均为空"的中间位点击被拦截（第 0 位放行）。
 */
export function canSelectBox(
  keyArray: string[],
  index: number,
  disorderClick: boolean,
): boolean {
  if (disorderClick) return true
  if (index <= 0) return true
  const prevFilled = !!keyArray[index - 1]
  const nextFilled = !!keyArray[index + 1]
  return prevFilled || nextFilled
}

/** Vue onEnter：写入当前位；末位自动 confirm */
export function enterValue(
  keyArray: string[],
  selectedIndex: number,
  value: string | number | undefined,
): {keyArray: string[]; selectedIndex: number; confirmed: boolean} {
  const next = [...keyArray]
  next[selectedIndex] = String(value ?? '')
  if (selectedIndex === next.length - 1) {
    return {keyArray: next, selectedIndex, confirmed: true}
  }
  return {keyArray: next, selectedIndex: selectedIndex + 1, confirmed: false}
}

/** Vue onDelete：清空当前位并回退；第 0 位（division）收起键盘 */
export function deleteValue(
  keyArray: string[],
  selectedIndex: number,
  modeShow: string,
): {keyArray: string[]; selectedIndex: number; hideKeyboard: boolean} {
  const next = [...keyArray]
  next[selectedIndex] = ''
  if (selectedIndex <= 0) {
    return {keyArray: next, selectedIndex, hideKeyboard: modeShow === 'division'}
  }
  return {keyArray: next, selectedIndex: selectedIndex - 1, hideKeyboard: false}
}

/** Vue keyArrayCopy.join('')：空位补空格 */
export function joinPlate(keyArray: string[]): string {
  return keyArray.map(item => (item ? item : ' ')).join('')
}

/** Vue defaultValue watcher：按位覆盖（缺省位清空） */
export function applyDefaultValue(keyArray: string[], defaultValue: string): string[] {
  if (defaultValue === '') return [...keyArray]
  const chars = defaultValue.split('')
  return keyArray.map((_, index) => chars[index] ?? '')
}

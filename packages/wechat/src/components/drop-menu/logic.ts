/**
 * DropMenu 纯逻辑（自 Vue 版 drop-menu/DropMenu.vue 提取）。
 */
export interface DropMenuListOption {
  value?: string | number
  text?: string
  label?: string
}

export interface DropMenuItem {
  text?: string
  disabled?: boolean
  options?: DropMenuListOption[]
}

/**
 * initSelectedBar（对齐 Vue v2 traverse）：按 bar 项遍历其 options，
 * 以 value/text/label 匹配 defaultValue[index] 定位选中记录。
 * 注意与 Vue 一致：level 恒为 0，仅匹配一层 options（历史语义）。
 */
export function initSelectedBar(
  data: DropMenuItem[],
  defaultValue: Array<string | number>,
): {selectedItems: Array<DropMenuListOption | undefined>; selectedValues: Array<string | number>} {
  const selectedItems: Array<DropMenuListOption | undefined> = []
  data.forEach((barItem, barItemIndex) => {
    const expect = defaultValue[barItemIndex]
    const options = (barItem.options ?? []) as DropMenuListOption[]
    options.forEach((option) => {
      const record = option as DropMenuListOption
      if (
        expect !== undefined &&
        (record.value === expect || record.text === expect || record.label === expect)
      ) {
        selectedItems[barItemIndex] = record
      }
    })
  })
  return {selectedItems, selectedValues: defaultValue.slice()}
}

/** bar 项是否处于「已选」态（对齐 Vue checkBarItemSelect） */
export function isBarItemSelected(
  selectedItem: DropMenuListOption | undefined,
  defaultValue: Array<string | number>,
  index: number,
): boolean {
  return !!(selectedItem !== undefined || defaultValue[index])
}

/** bar 项文本：有选中记录取其 text（缺省空串），否则取 bar 项 text（对齐 getBarItemText） */
export function barItemText(
  item: DropMenuItem,
  selectedItem: DropMenuListOption | undefined,
): string {
  return selectedItem !== undefined ? String(selectedItem.text ?? '') : String(item.text ?? '')
}

/**
 * bar 点击状态机（对齐 Vue onBarItemClick）：关闭态打开并记 activeIndex；
 * 打开态（无论点击哪个 bar）一律收起；disabled 项不动。
 */
export function barItemTapState(
  isPopupShow: boolean,
  item: DropMenuItem | undefined,
): {show: boolean; activeIndexSet: boolean} {
  if (!item || item.disabled) {
    return {show: isPopupShow, activeIndexSet: false}
  }
  if (!isPopupShow) {
    return {show: true, activeIndexSet: true}
  }
  return {show: false, activeIndexSet: false}
}

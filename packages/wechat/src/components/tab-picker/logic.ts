/**
 * tab-picker 纯逻辑：多级面板树展开（panes）、选项单元格视图。
 * 对齐 packages/vue/src/components/tab-picker/TabPicker.vue 的 panes computed。
 */
export interface TabPickerOption {
  value?: string | number
  label?: string
  children?: TabPickerNode
  [key: string]: unknown
}

export interface TabPickerNode {
  name?: string
  label?: string
  value?: string | number
  children?: TabPickerNode
  options?: TabPickerOption[]
  [key: string]: unknown
}

export interface TabPickerPane {
  name: string
  label: string
  value: string | number | undefined
  selected: TabPickerOption | undefined
  options: TabPickerOption[]
  no: number
}

/** 选项单元格视图（自绘 radio-item，无图标——Vue 版 icon='' 同款） */
export interface TabPickerCell {
  no: number
  title: string
  selected: boolean
  disabled: boolean
}

/**
 * 面板树展开（panes computed 移植）：
 * 沿 data→选中项 children 逐层推进，label 依次被选中项 label 覆盖；
 * selected[cursor] 未命中时该层为叶子，链条终止。
 */
export function buildPanes(
  data: TabPickerNode | undefined,
  selected: Array<string | number>,
  placeholder: string,
): TabPickerPane[] {
  const result: TabPickerPane[] = []
  let target: TabPickerNode | undefined = data
  let cursor = 0
  while (target && target.name) {
    const pane: TabPickerPane = {
      name: target.name,
      label: target.label || placeholder,
      value: selected[cursor],
      selected: undefined,
      options: (target.options ?? []) as TabPickerOption[],
      no: result.length,
    }
    let find = false
    const options = (target.options ?? []) as TabPickerOption[]
    for (let i = 0; i < options.length; i++) {
      if (options[i].value === selected[cursor]) {
        pane.label = options[i].label as string
        pane.selected = options[i]
        target = options[i].children
        find = true
        cursor++
        break
      }
    }
    if (!find) {
      target = undefined
    }
    result.push(pane)
  }
  return result
}

/** 面板 → 单元格视图：value 命中 pane.value 为选中；disabled 透传 */
export function buildPaneCells(pane: TabPickerPane | undefined): TabPickerCell[] {
  if (!pane) return []
  return pane.options.map((option, i) => ({
    no: i,
    title: (option.label ?? (option.value as string | number | undefined) ?? '') as string,
    selected: option.value !== undefined && option.value === pane.value,
    disabled: !!(option as {disabled?: boolean}).disabled,
  }))
}

/** 选中值路径截断写入（onSelectPaneItem：splice(index, len - index, value)） */
export function spliceSelected(
  selected: Array<string | number>,
  index: number,
  value: string | number,
): Array<string | number> {
  const next = selected.slice()
  next.length = index
  next.push(value)
  return next
}

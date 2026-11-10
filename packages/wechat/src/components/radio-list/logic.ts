/**
 * RadioList 纯逻辑（自 Vue 版 radio-list/RadioList.vue 提取）。
 */
export interface RadioListOption {
  value: string | number | boolean
  text?: string
  label?: string
  brief?: string
  disabled?: boolean
}

/** 当前生效值：输入项被选中（聚焦）时以输入值为准（对齐 Vue currentValue computed） */
export function currentValueOf(
  inputSelected: boolean,
  inputValue: string,
  selectedValue: RadioListOption['value'],
): RadioListOption['value'] {
  return inputSelected ? inputValue : selectedValue
}

/** 选项展示标题：text 优先、label 兜底（对齐 Vue item.text || item.label） */
export function optionTitle(option: RadioListOption): string {
  return String((option.text || option.label) ?? '')
}

export interface RadioCellView {
  no: number
  title: string
  brief: string
  disabled: boolean
  noBorder: boolean
  selected: boolean
  showIcon: boolean
  side: 'left' | 'right'
  checked: boolean
  icon: string
}

/** 构建单元格渲染视图（对齐 Vue RadioList 模板的逐项 class/图标分支） */
export function buildRadioCells(
  options: RadioListOption[],
  opts: {
    selectedValue: RadioListOption['value']
    inputSelected: boolean
    alignCenter: boolean
    withoutIcon: boolean
    iconPosition: string
    icon: string
    iconInverse: string
    iconDisabled: string
  },
): RadioCellView[] {
  return options.map((option, index) => {
    const checked = opts.selectedValue === option.value
    const disabled = !!option.disabled
    const selected = checked && !opts.inputSelected
    const showIcon = !opts.alignCenter && !opts.inputSelected && !opts.withoutIcon
    return {
      no: index,
      title: optionTitle(option),
      brief: option.brief || '',
      disabled,
      noBorder: index === options.length - 1,
      selected,
      showIcon,
      side: opts.iconPosition === 'right' ? 'right' : 'left',
      checked,
      icon: disabled ? opts.iconDisabled : checked ? opts.icon : opts.iconInverse,
    }
  })
}

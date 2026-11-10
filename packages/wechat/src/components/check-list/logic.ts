/**
 * check-list 纯逻辑（自 Vue 版 CheckList.vue 模板分支提取）。
 */
import type {CheckValue} from '../check/logic'

export interface CheckListOption {
  value: CheckValue
  text?: string
  label?: string
  brief?: string
  disabled?: boolean
}

/** Vue :title="hasSlot ? '' : item.text || item.label"（小程序无作用域插槽，恒按文本渲染） */
export function optionTitle(option: CheckListOption): string {
  return String((option.text || option.label) ?? '')
}

export interface CheckCellView {
  no: number
  value: CheckValue
  title: string
  brief: string
  disabled: boolean
  /** 是否选中（Vue :class="{'is-checked': modelValue.indexOf(item.value) !== -1}"，
   *  小程序无对应类通道，仅供视图/测试语义） */
  checked: boolean
  /** 图标位置：iconPosition 'right' → 右槽，其余 → 左槽（Vue iconSlotName computed） */
  side: 'left' | 'right'
  /** alignCenter 时不渲染图标（Vue v-if="!alignCenter"） */
  showIcon: boolean
}

/** 构建选项单元格视图（对照 Vue CheckList 模板的逐项 class/图标分支） */
export function buildCheckCells(
  options: CheckListOption[],
  opts: {
    value: CheckValue[]
    alignCenter: boolean
    iconPosition: string
  },
): CheckCellView[] {
  return options.map((option, index) => ({
    no: index,
    value: option.value,
    title: optionTitle(option),
    brief: option.brief || '',
    disabled: !!option.disabled,
    checked: opts.value.indexOf(option.value) !== -1,
    side: opts.iconPosition === 'right' ? 'right' : 'left',
    showIcon: !opts.alignCenter,
  }))
}

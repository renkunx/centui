/**
 * Selector 纯逻辑（自 Vue 版 selector/Selector.vue 提取）。
 */
export interface SelectorItem {
  value: string | number | boolean
  text?: string
  label?: string
  brief?: string
  disabled?: boolean
}

export type MultiValue = Array<string | number>

/** multi 模式 defaultValue 归一：数组取副本，标量包一元数组（对齐 Vue watch） */
export function normalizeMultiValue(val: unknown): MultiValue {
  return Array.isArray(val) ? (val.slice() as MultiValue) : [val as string | number]
}

/** cancelText 未传（null/undefined）时：有 okText 回退「取消」，否则空（对齐 Vue ?? 语义） */
export function resolveCancelText(
  cancelText: string | null | undefined,
  okText: string,
): string {
  return cancelText ?? (okText ? '取消' : '')
}

/** onlyClose：非多选、无确认文案且未传 cancelText 时仅渲染关闭钮（对齐 Vue computed） */
export function isOnlyClose(
  isCheck: boolean,
  isNeedConfirm: boolean,
  cancelText: string | null | undefined,
): boolean {
  return !isCheck && !isNeedConfirm && !cancelText
}

/** isNeedConfirm：okText 非空（对齐 Vue computed） */
export function isNeedConfirmOf(okText: string): boolean {
  return okText !== ''
}

export interface SelectorCell {
  no: number
  title: string
  brief: string
  disabled: boolean
  /** 单选态（multi=false） */
  selected: boolean
  /** 多选态（multi=true） */
  checked: boolean
  side: 'left' | 'right'
  icon: string
}

/** 构建选项单元格视图（单选/多选共用，图标态对齐 Radio/Check currentIcon） */
export function buildSelectorCells(
  items: SelectorItem[],
  opts: {
    multi: boolean
    selectedValue: SelectorItem['value']
    multiValue: MultiValue
    alignCenter: boolean
    iconPosition: string
    icon: string
    iconInverse: string
    iconDisabled: string
  },
): SelectorCell[] {
  return items.map((item, index) => {
    const disabled = !!item.disabled
    const selected = opts.selectedValue === item.value
    const checked = opts.multiValue.indexOf(item.value as string | number) !== -1
    return {
      no: index,
      title: String((item.text || item.label) ?? ''),
      brief: item.brief || '',
      disabled,
      selected,
      checked,
      side: opts.iconPosition === 'right' ? 'right' : 'left',
      icon: disabled ? opts.iconDisabled : opts.multi ? (checked ? opts.icon : opts.iconInverse) : selected ? opts.icon : opts.iconInverse,
    }
  })
}

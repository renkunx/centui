import { useContext, useMemo, type ReactNode } from 'react'
import {
  CheckGroupContext,
  CuCheck,
  CuCheckGroup,
  type CheckValue,
} from './Check'
import { CuCellItem } from '../cell-item/CellItem'

export interface CheckListOption {
  value: CheckValue
  text?: string
  label?: string
  brief?: string
  disabled?: boolean
}

export interface CheckListProps {
  /** 外部附加类名（对齐 Vue 透传语义） */
  className?: string
  options?: CheckListOption[]
  value?: CheckValue[]
  alignCenter?: boolean
  isSlotScope?: boolean
  icon?: string
  iconInverse?: string
  iconDisabled?: string
  iconSvg?: boolean
  iconSize?: string
  iconPosition?: string
  children?: (slotProps: { option: CheckListOption; index: number; selected: boolean }) => ReactNode
  onChange?: (value: CheckValue[]) => void
}

export function CuCheckList({
  options = [],
  value = [],
  className,
  alignCenter = false,
  isSlotScope,
  icon = 'checked',
  iconInverse = 'check',
  iconDisabled = 'check-disabled',
  iconSvg = false,
  iconSize = 'md',
  iconPosition = 'right',
  children,
  onChange,
}: CheckListProps) {
  const hasSlot = isSlotScope !== undefined ? isSlotScope : !!children
  // 组操作经内部 CheckGroup 完成后回流
  const groupRef = useContext(CheckGroupContext)

  const items = useMemo(
    () =>
      options.map((item, index) => ({
        item,
        index,
        selected: value.indexOf(item.value) !== -1,
      })),
    [options, value],
  )

  const renderIcon = (item: CheckListOption) => (
    <CuCheck
      name={item.value}
      value={value.includes(item.value) ? item.value : false}
      disabled={item.disabled}
      size={iconSize}
      icon={icon}
      iconInverse={iconInverse}
      iconDisabled={iconDisabled}
      iconSvg={iconSvg}
    />
  )

  return (
    <CuCheckGroup
      value={value}
      onChange={onChange}
      className={`cu-check-list${className ? ` ${className}` : ''}${alignCenter ? ' is-align-center' : ''}`}
    >
      <InnerList
        options={items}
        alignCenter={alignCenter}
        hasSlot={hasSlot}
        iconPosition={iconPosition}
        renderIcon={renderIcon}
        slotRender={children}
        groupToggle={name => {
          // toggle 逻辑在 Provider 内部，通过二次渲染回调实现：
          // 直接以当前 value 计算增删（与组内 toggle 等价）
          const index = value.indexOf(name)
          if (index === -1) {
            onChange?.(value.concat(name))
          } else {
            onChange?.(value.slice(0, index).concat(value.slice(index + 1)))
          }
          void groupRef
        }}
      />
    </CuCheckGroup>
  )
}

interface InnerListItem {
  item: CheckListOption
  index: number
  selected: boolean
}

function InnerList({
  options,
  alignCenter,
  hasSlot,
  iconPosition,
  renderIcon,
  slotRender,
  groupToggle,
}: {
  options: InnerListItem[]
  alignCenter: boolean
  hasSlot: boolean
  iconPosition: string
  renderIcon: (item: CheckListOption) => ReactNode
  slotRender?: (slotProps: { option: CheckListOption; index: number; selected: boolean }) => ReactNode
  groupToggle: (name: CheckValue) => void
}) {
  return (
    <>
      {options.map(({ item, index, selected }) => (
        <CuCellItem
          key={index}
          className={`cu-check-item${selected ? ' is-checked' : ''}`}
          title={hasSlot ? '' : item.text || item.label || ''}
          brief={hasSlot ? '' : item.brief}
          disabled={item.disabled}
          right={iconPosition === 'right' && !alignCenter ? renderIcon(item) : undefined}
          left={iconPosition === 'left' && !alignCenter ? renderIcon(item) : undefined}
          onClick={() => groupToggle(item.value)}
        >
          {hasSlot ? slotRender?.({ option: item, index, selected }) : null}
        </CuCellItem>
      ))}
    </>
  )
}

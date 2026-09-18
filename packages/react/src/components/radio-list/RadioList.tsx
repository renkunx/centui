import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { MdRadio } from '../radio/Radio'
import { MdCellItem } from '../cell-item/CellItem'
import { MdInputItem } from '../input-item/InputItem'
import type { CheckValue } from '../check/Check'

export interface RadioListOption {
  value: CheckValue
  text?: string
  label?: string
  brief?: string
  disabled?: boolean
}

export interface RadioListProps {
  options?: RadioListOption[]
  value?: CheckValue
  hasInput?: boolean
  inputLabel?: string
  inputPlaceholder?: string
  alignCenter?: boolean
  isSlotScope?: boolean
  icon?: string
  iconInverse?: string
  iconDisabled?: string
  iconSvg?: boolean
  iconSize?: string
  iconPosition?: string
  children?: (slotProps: { option: RadioListOption; index: number; selected: boolean }) => ReactNode
  onChange?: (option: RadioListOption, index: number) => void
  onChangeValue?: (value: CheckValue) => void
}

export interface RadioListExposed {
  select: (value: CheckValue) => void
  selectByIndex: (index: number) => void
}

export const MdRadioList = forwardRef<RadioListExposed, RadioListProps>(function MdRadioList(
  {
    options = [],
  value = '',
  hasInput = false,
  inputLabel = '',
  inputPlaceholder = '',
  alignCenter = false,
  isSlotScope,
  icon = 'checked',
  iconInverse = 'check',
  iconDisabled = 'check-disabled',
  iconSvg = false,
  iconSize = 'md',
    iconPosition = 'left',
    children,
    onChange,
    onChangeValue,
  }: RadioListProps,
  ref,
) {
  const inputItemRef = useRef<{ focus: () => void } | null>(null)
  const [selectedValue, setSelectedValue] = useState(value)
  const [inputSelected, setInputSelected] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const hasSlot = isSlotScope !== undefined ? isSlotScope : !!children
  const withoutIcon = !!isSlotScope && !icon

  // currentValue 变化派发（v2 watch 契约）
  const currentValue = inputSelected ? inputValue : selectedValue

  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value)
    }
  }, [value])

  useEffect(() => {
    onChangeValue?.(currentValue)
  }, [currentValue])

  const select = (option: RadioListOption, index: number) => {
    setSelectedValue(option.value)
    setInputSelected(false)
    if (inputValue) {
      setInputValue('')
    }
    onChange?.(option, index)
  }

  const selectByValue = (val: CheckValue) => {
    setSelectedValue(val)
    setInputSelected(false)
  }

  const selectByIndex = (index: number) => {
    const item = options[index]
    if (item) {
      selectByValue(item.value)
    }
  }

  useImperativeHandle(ref, () => ({ select: selectByValue, selectByIndex }), [options])

  const iconNode = (item: RadioListOption) =>
    !alignCenter && !inputSelected && !withoutIcon ? (
      <MdRadio
        name={item.value}
        value={selectedValue}
        disabled={item.disabled}
        size={iconSize}
        icon={icon}
        iconInverse={iconInverse}
        iconDisabled={iconDisabled}
        iconSvg={iconSvg}
      />
    ) : null

  return (
    <div className={`md-radio-list${alignCenter ? ' is-align-center' : ''}`}>
      {options.map((item, index) => (
        <MdCellItem
          key={index}
          className={`md-radio-item${selectedValue === item.value && !inputSelected ? ' is-selected' : ''}`}
          title={hasSlot ? '' : item.text || item.label || ''}
          brief={hasSlot ? '' : item.brief}
          disabled={item.disabled}
          noBorder={index === options.length - 1 && !hasInput}
          left={iconPosition === 'left' ? iconNode(item) : undefined}
          right={iconPosition === 'right' ? iconNode(item) : undefined}
          onClick={() => select(item, index)}
        >
          {hasSlot ? children?.({ option: item, index, selected: currentValue === item.value }) : null}
        </MdCellItem>
      ))}
      {hasInput ? (
        <MdInputItem
          ref={inputItemRef as never}
          className={`md-radio-item${inputSelected ? ' is-selected' : ''}`}
          title={inputLabel}
          placeholder={inputPlaceholder}
          value={inputValue}
          onChange={setInputValue}
          onFocus={() => setInputSelected(true)}
        />
      ) : null}
    </div>
  )
})

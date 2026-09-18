import type { ReactNode } from 'react'
import { MdIcon } from '../icon/Icon'
import { MdCheckBaseBox } from '../check/Check'
import { RadioGroupContext, useRadioDelegate, type CheckValue, type RadioRootGroupValue } from '../check/Check'

export interface RadioProps {
  name: CheckValue
  value?: CheckValue
  size?: string
  label?: string
  inline?: boolean
  disabled?: boolean
  icon?: string
  iconInverse?: string
  iconDisabled?: string
  iconSvg?: boolean
  children?: ReactNode
  onChange?: (value: CheckValue) => void
}

export function MdRadio({
  name,
  value = '',
  size = 'md',
  label = '',
  inline = false,
  disabled = false,
  icon = 'checked',
  iconInverse = 'check',
  iconDisabled = 'check-disabled',
  iconSvg = false,
  children,
  onChange,
}: RadioProps) {
  const { isChecked, onClick } = useRadioDelegate({ name, value, disabled }, onChange!)
  const currentIcon = disabled ? iconDisabled : isChecked ? icon : iconInverse

  return (
    <label
      className={[
        'md-radio',
        disabled ? 'is-disabled' : '',
        isChecked ? 'is-checked' : '',
        inline ? 'is-inline' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      <div className="md-radio-icon">
        <MdIcon name={currentIcon} size={size} svg={iconSvg} />
      </div>
      {children || label ? <div className="md-radio-label">{children ?? label}</div> : null}
    </label>
  )
}

export interface RadioBoxProps {
  name?: CheckValue
  value?: CheckValue
  label?: string
  disabled?: boolean
  /** lt | rt */
  iconPosition?: string
  children?: ReactNode
  onChange?: (value: CheckValue) => void
}

export function MdRadioBox({
  name = true,
  value = false,
  label = '',
  disabled = false,
  iconPosition = 'rt',
  children,
  onChange,
}: RadioBoxProps) {
  const { isChecked, onClick } = useRadioDelegate({ name, value, disabled }, onChange!)

  return (
    <MdCheckBaseBox
      className="md-radio-box"
      isChecked={isChecked}
      disabled={disabled}
      iconPosition={iconPosition}
      label={label}
      onClick={onClick}
    >
      {children ?? label}
    </MdCheckBaseBox>
  )
}

export interface RadioGroupProps {
  value?: CheckValue
  max?: number
  children?: ReactNode
  onChange?: (value: CheckValue) => void
}

export function MdRadioGroup({ value = '', children, onChange }: RadioGroupProps) {
  const group: RadioRootGroupValue = {
    value,
    check(name) {
      onChange?.(name)
    },
  }

  return (
    <RadioGroupContext.Provider value={group}>
      <div className="md-radio-group">{children}</div>
    </RadioGroupContext.Provider>
  )
}

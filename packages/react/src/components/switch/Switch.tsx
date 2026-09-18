import { type MouseEvent } from 'react'

export interface SwitchProps {
  value?: boolean
  disabled?: boolean
  onChange?: (value: boolean, event: MouseEvent<HTMLDivElement>) => void
}

export function MdSwitch({ value = false, disabled = false, onChange }: SwitchProps) {
  return (
    <div
      className={`md-switch${disabled ? ' disabled' : ''}${value ? ' active' : ''}`}
      onClick={event => {
        if (disabled) {
          return
        }
        onChange?.(!value, event)
      }}
    ></div>
  )
}

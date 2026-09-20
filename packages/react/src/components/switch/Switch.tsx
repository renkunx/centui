import { type MouseEvent } from 'react'

export interface SwitchProps {
  value?: boolean
  disabled?: boolean
  onChange?: (value: boolean, event: MouseEvent<HTMLDivElement>) => void
}

export function CuSwitch({ value = false, disabled = false, onChange }: SwitchProps) {
  return (
    <div
      className={`cu-switch${disabled ? ' disabled' : ''}${value ? ' active' : ''}`}
      onClick={event => {
        if (disabled) {
          return
        }
        onChange?.(!value, event)
      }}
    ></div>
  )
}

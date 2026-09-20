import { type MouseEvent, type ReactNode, type HTMLAttributes } from 'react'
import { CuIcon } from '../icon/Icon'

export type AgreeProps = {
  value?: boolean
  disabled?: boolean
  size?: string
  /** circle | square */
  iconType?: string
  iconSlot?: (checked: boolean) => ReactNode
  children?: ReactNode
  onChange?: (value: boolean, event: MouseEvent<HTMLDivElement>) => void
  /** v2 场景遗留：checked 作为透传 attr */
  checked?: boolean
} & HTMLAttributes<HTMLDivElement>

export function CuAgree({
  value = false,
  checked,
  disabled = false,
  size = 'md',
  iconType = 'circle',
  iconSlot,
  children,
  onChange,
  ...rest
}: AgreeProps) {
  // v2 场景契约：checked 以 attr 形式落 DOM（React 对 checked 走 property，手动 setAttribute）
  const applyCheckedAttr = (node: HTMLDivElement | null) => {
    if (!node || checked === undefined) {
      return
    }
    if (checked) {
      node.setAttribute('checked', 'checked')
    } else {
      node.removeAttribute('checked')
    }
  }
  return (
    <div
      ref={applyCheckedAttr}
      className={`cu-agree${disabled ? ' disabled' : ''}`}
      {...rest}
    >
      <div
        className={`cu-agree-icon${value ? ' checked' : ''}`}
        onClick={event => {
          if (disabled) {
            return
          }
          onChange?.(!value, event)
        }}
      >
        <div className="cu-agree-icon-container">
          {iconSlot?.(value) ?? (
            <span>
              {iconType === 'square' ? (
                <>
                  <CuIcon name="square-checked" size={size} />
                  <CuIcon name="square-check" size={size} />
                </>
              ) : (
                <>
                  <CuIcon name="checked" size={size} />
                  <CuIcon name="check" size={size} />
                </>
              )}
            </span>
          )}
        </div>
      </div>
      <div className="cu-agree-content">{children}</div>
    </div>
  )
}

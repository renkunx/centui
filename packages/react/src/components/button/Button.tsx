import type { ReactNode, MouseEvent, ButtonHTMLAttributes } from 'react'
import { MdActivityIndicatorRolling } from '../activity-indicator/Roller'
import { MdIcon } from '../icon/Icon'

export type ButtonProps = {
  /** default | primary | warning | disabled | link */
  type?: string
  /** button | submit | reset */
  nativeType?: 'button' | 'submit' | 'reset'
  icon?: string
  iconSvg?: boolean
  /** large | small */
  size?: string
  plain?: boolean
  round?: boolean
  inline?: boolean
  inactive?: boolean
  loading?: boolean
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'>

export function MdButton({
  type = 'default',
  nativeType = 'button',
  icon = '',
  iconSvg = false,
  size = 'large',
  plain = false,
  round = false,
  inline = false,
  inactive = false,
  loading = false,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={nativeType}
      className={[
        'md-button',
        type,
        inactive ? 'inactive' : 'active',
        inline ? 'inline' : 'block',
        round ? 'round' : '',
        plain ? 'plain' : '',
        size === 'small' ? 'small' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={inactive || type === 'disabled'}
      onClick={onClick}
      {...rest}
    >
      <div className="md-button-inner">
        {loading ? (
          <MdActivityIndicatorRolling className="md-button-loading" />
        ) : icon ? (
          <MdIcon name={icon} svg={iconSvg} />
        ) : null}
        <div className="md-button-content">{children}</div>
      </div>
    </button>
  )
}

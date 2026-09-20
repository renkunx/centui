import type { ReactNode, MouseEvent, ButtonHTMLAttributes } from 'react'
import { CuActivityIndicatorRolling } from '../activity-indicator/Roller'
import { CuIcon } from '../icon/Icon'

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

export function CuButton({
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
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={nativeType}
      className={[
        'cu-button',
        type,
        inactive ? 'inactive' : 'active',
        inline ? 'inline' : 'block',
        round ? 'round' : '',
        plain ? 'plain' : '',
        size === 'small' ? 'small' : '',
        // v2 契约：外部 class 与组件 class 合并（Vue 透传语义）
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={inactive || type === 'disabled'}
      onClick={onClick}
      {...rest}
    >
      <div className="cu-button-inner">
        {loading ? (
          <CuActivityIndicatorRolling className="cu-button-loading" />
        ) : icon ? (
          <CuIcon name={icon} svg={iconSvg} />
        ) : null}
        <div className="cu-button-content">{children}</div>
      </div>
    </button>
  )
}

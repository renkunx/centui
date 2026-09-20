import type { ReactNode } from 'react'
import { CuIcon } from '../icon/Icon'

export interface TipContentProps {
  /** top | left | bottom | right */
  placement?: string
  closable?: boolean
  icon?: string
  iconSvg?: boolean
  content?: string | number
  name?: string | number
  children?: ReactNode
  onClose?: () => void
}

export function CuTipContent({
  placement = 'top',
  closable = true,
  icon,
  iconSvg = false,
  content = '',
  name,
  children,
  onClose,
}: TipContentProps) {
  const wrapperCls = [
    'cu-tip',
    closable ? 'has-close' : '',
    ['left', 'bottom', 'right'].includes(placement ?? '') ? `is-${placement}` : '',
    name ? String(name) : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperCls}>
      <div className="cu-tip-content">
        {children ?? (
          <>
            {icon ? <CuIcon className="content-icon" name={icon} svg={iconSvg} /> : null}
            <div className="content-text">{content}</div>
          </>
        )}
        {closable ? <CuIcon name="close" size="md" onClick={() => onClose?.()} /> : null}
      </div>
      <div className="cu-tip-bg"></div>
    </div>
  )
}

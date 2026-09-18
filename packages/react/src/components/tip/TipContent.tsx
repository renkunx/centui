import type { ReactNode } from 'react'
import { MdIcon } from '../icon/Icon'

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

export function MdTipContent({
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
    'md-tip',
    closable ? 'has-close' : '',
    ['left', 'bottom', 'right'].includes(placement ?? '') ? `is-${placement}` : '',
    name ? String(name) : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperCls}>
      <div className="md-tip-content">
        {children ?? (
          <>
            {icon ? <MdIcon className="content-icon" name={icon} svg={iconSvg} /> : null}
            <div className="content-text">{content}</div>
          </>
        )}
        {closable ? <MdIcon name="close" size="md" onClick={() => onClose?.()} /> : null}
      </div>
      <div className="md-tip-bg"></div>
    </div>
  )
}

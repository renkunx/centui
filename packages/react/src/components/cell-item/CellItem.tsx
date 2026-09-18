import { type MouseEvent, type ReactNode } from 'react'
import { MdIcon } from '../icon/Icon'

export interface CellItemProps {
  className?: string
  title?: string
  brief?: string
  addon?: string
  arrow?: boolean
  disabled?: boolean
  noBorder?: boolean
  left?: ReactNode
  right?: ReactNode
  children?: ReactNode
  childrenSlot?: ReactNode
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
}

export function MdCellItem({
  className,
  title = '',
  brief = '',
  addon = '',
  arrow = false,
  disabled = false,
  noBorder = false,
  left,
  right,
  children,
  childrenSlot,
  onClick,
}: CellItemProps) {
  const hasContent = !!(title || brief || children)

  return (
    <div
      className={[
        'md-cell-item',
        className,
        disabled ? 'is-disabled' : '',
        noBorder ? 'no-border' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={event => {
        if (!disabled) {
          onClick?.(event)
        }
      }}
    >
      <div className={`md-cell-item-body${brief ? ' multilines' : ''}`}>
        {left ? <div className="md-cell-item-left">{left}</div> : null}
        {hasContent ? (
          <div className="md-cell-item-content">
            {title ? <p className="md-cell-item-title">{title}</p> : null}
            {brief ? <p className="md-cell-item-brief">{brief}</p> : null}
            {children}
          </div>
        ) : null}
        {arrow || addon || right ? (
          <div className="md-cell-item-right">
            {right ?? addon}
            {arrow ? <MdIcon name="arrow" size="md" /> : null}
          </div>
        ) : null}
      </div>
      {childrenSlot ? <div className="md-cell-item-children">{childrenSlot}</div> : null}
    </div>
  )
}

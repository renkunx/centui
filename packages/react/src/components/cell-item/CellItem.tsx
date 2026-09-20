import { type MouseEvent, type ReactNode } from 'react'
import { CuIcon } from '../icon/Icon'

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

export function CuCellItem({
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
        'cu-cell-item',
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
      <div className={`cu-cell-item-body${brief ? ' multilines' : ''}`}>
        {left ? <div className="cu-cell-item-left">{left}</div> : null}
        {hasContent ? (
          <div className="cu-cell-item-content">
            {title ? <p className="cu-cell-item-title">{title}</p> : null}
            {brief ? <p className="cu-cell-item-brief">{brief}</p> : null}
            {children}
          </div>
        ) : null}
        {arrow || addon || right ? (
          <div className="cu-cell-item-right">
            {right ?? addon}
            {arrow ? <CuIcon name="arrow" size="md" /> : null}
          </div>
        ) : null}
      </div>
      {childrenSlot ? <div className="cu-cell-item-children">{childrenSlot}</div> : null}
    </div>
  )
}

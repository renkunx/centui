import { type MouseEvent, type ReactNode } from 'react'
import { MdIcon } from '../icon/Icon'
import { useFieldDisabled } from '../field/Field'

export interface FieldItemProps {
  className?: string
  title?: string
  placeholder?: string
  content?: string
  addon?: string
  arrow?: boolean | string
  solid?: boolean
  alignRight?: boolean
  disabled?: boolean
  left?: ReactNode
  right?: ReactNode
  childrenSlot?: ReactNode
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
}



export function MdFieldItem({
  className,
  title = '',
  placeholder = '',
  content = '',
  addon = '',
  arrow = false,
  solid = false,
  alignRight = false,
  disabled = false,
  left,
  right,
  childrenSlot,
  children,
  onClick,
}: FieldItemProps) {
  const currentDisabled = useFieldDisabled(disabled)

  return (
    <div
      className={[
        'md-field-item',
        className,
        solid ? 'is-solid' : '',
        currentDisabled ? 'is-disabled' : '',
        alignRight ? 'is-align-right' : '',
        'is-browser',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={event => {
        if (!currentDisabled) {
          onClick?.(event)
        }
      }}
    >
      <div className="md-field-item-content">
        {title ? <label className="md-field-item-title">{title}</label> : null}
        {left ? <div className="md-field-item-left">{left}</div> : null}
        <div className="md-field-item-control">
          {children ?? (
            <>
              {content ? content : null}
              {!content && placeholder ? (
                <div className="md-field-item-placeholder">{placeholder}</div>
              ) : null}
            </>
          )}
        </div>
        {arrow || addon || right ? (
          <div className="md-field-item-right">
            {right ?? addon}
            {arrow ? <MdIcon name={arrow === true ? 'arrow' : String(arrow)} size="md" /> : null}
          </div>
        ) : null}
      </div>
      {childrenSlot ? <div className="md-field-item-children">{childrenSlot}</div> : null}
    </div>
  )
}

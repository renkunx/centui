import { type MouseEvent, type ReactNode } from 'react'
import { CuIcon } from '../icon/Icon'
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



export function CuFieldItem({
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
        'cu-field-item',
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
      <div className="cu-field-item-content">
        {title ? <label className="cu-field-item-title">{title}</label> : null}
        {left ? <div className="cu-field-item-left">{left}</div> : null}
        <div className="cu-field-item-control">
          {children ?? (
            <>
              {content ? content : null}
              {!content && placeholder ? (
                <div className="cu-field-item-placeholder">{placeholder}</div>
              ) : null}
            </>
          )}
        </div>
        {arrow || addon || right ? (
          <div className="cu-field-item-right">
            {right ?? addon}
            {arrow ? <CuIcon name={arrow === true ? 'arrow' : String(arrow)} size="md" /> : null}
          </div>
        ) : null}
      </div>
      {childrenSlot ? <div className="cu-field-item-children">{childrenSlot}</div> : null}
    </div>
  )
}

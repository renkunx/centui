import { createContext, useContext, type ReactNode } from 'react'

export interface FieldContextValue {
  disabled?: boolean
}

export const FieldContext = createContext<FieldContextValue>({})

export function useFieldDisabled(disabled?: boolean): boolean {
  const field = useContext(FieldContext)
  return !!field.disabled || !!disabled
}

export interface FieldProps {
  title?: string
  brief?: string
  disabled?: boolean
  plain?: boolean
  header?: ReactNode
  action?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

export function MdField({
  title = '',
  brief = '',
  disabled = false,
  plain = false,
  header,
  action,
  footer,
  children,
}: FieldProps) {
  return (
    <FieldContext.Provider value={{ disabled }}>
      <fieldset
        className={`md-field${plain ? ' is-plain' : ''}${disabled ? ' is-disabled' : ''}`}
      >
        {title || brief || header || action ? (
          <header className="md-field-header">
            <div className="md-field-heading">
              {title ? <legend className="md-field-title">{title}</legend> : null}
              {brief ? <p className="md-field-brief">{brief}</p> : null}
              {header}
            </div>
            {action ? <div className="md-field-action">{action}</div> : null}
          </header>
        ) : null}
        <div className="md-field-content">{children}</div>
        {footer ? <footer className="md-field-footer">{footer}</footer> : null}
      </fieldset>
    </FieldContext.Provider>
  )
}

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

export function CuField({
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
        className={`cu-field${plain ? ' is-plain' : ''}${disabled ? ' is-disabled' : ''}`}
      >
        {title || brief || header || action ? (
          <header className="cu-field-header">
            <div className="cu-field-heading">
              {title ? <legend className="cu-field-title">{title}</legend> : null}
              {brief ? <p className="cu-field-brief">{brief}</p> : null}
              {header}
            </div>
            {action ? <div className="cu-field-action">{action}</div> : null}
          </header>
        ) : null}
        <div className="cu-field-content">{children}</div>
        {footer ? <footer className="cu-field-footer">{footer}</footer> : null}
      </fieldset>
    </FieldContext.Provider>
  )
}

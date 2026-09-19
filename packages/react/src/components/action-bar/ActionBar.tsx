import { forwardRef, type MouseEvent, type ReactNode } from 'react'
import { MdButton } from '../button/Button'

export interface ActionBarAction {
  text?: string
  type?: string
  plain?: boolean
  round?: boolean
  inactive?: boolean
  loading?: boolean
  icon?: string
  iconSvg?: boolean
  disabled?: boolean
  onClick?: (event: MouseEvent<HTMLButtonElement>, action: ActionBarAction) => void
}

export interface ActionBarProps {
  actions?: ActionBarAction[]
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>, action: ActionBarAction) => void
}

export const MdActionBar = forwardRef<HTMLDivElement, ActionBarProps>(function MdActionBar(
  { actions = [], children, onClick },
  ref,
) {
  // v2 契约：actions 最多展示两个
  const coerceActions = actions.slice(0, 2)
  const hasSlots = !!(children && (!Array.isArray(children) || children.length))

  return (
    <div className="md-action-bar" ref={ref}>
      <div className="md-action-bar-container">
        {hasSlots ? <div className="md-action-bar-text">{children}</div> : null}
        <div className="md-action-bar-group">
          {coerceActions.map((item, index) => (
            <MdButton
              key={index}
              className="md-action-bar-button"
              type={item.type || (item.disabled ? 'disabled' : 'primary')}
              plain={item.plain || index !== coerceActions.length - 1}
              round={item.round}
              inactive={item.inactive}
              loading={item.loading}
              icon={item.icon}
              iconSvg={item.iconSvg}
              onClick={(event) => {
                item.onClick?.(event, item)
                onClick?.(event, item)
              }}
            >
              {item.text}
            </MdButton>
          ))}
        </div>
      </div>
    </div>
  )
})

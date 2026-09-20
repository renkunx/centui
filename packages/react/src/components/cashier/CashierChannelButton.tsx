import { CuButton } from '../button/Button'

export interface CashierAction {
  buttonText?: string
  handler?: () => void
}

export function CuCashierChannelButton({ actions = [] }: { actions?: CashierAction[] }) {
  return (
    <div className="cu-cashier-block-btn">
      {actions.map((action, index) => (
        <CuButton
          key={index}
          type={index === actions.length - 1 ? 'primary' : 'default'}
          inline={actions.length > 1}
          onClick={() => action.handler && action.handler()}
        >
          {action.buttonText}
        </CuButton>
      ))}
    </div>
  )
}

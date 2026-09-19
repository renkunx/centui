import { MdButton } from '../button/Button'

export interface CashierAction {
  buttonText?: string
  handler?: () => void
}

export function MdCashierChannelButton({ actions = [] }: { actions?: CashierAction[] }) {
  return (
    <div className="md-cashier-block-btn">
      {actions.map((action, index) => (
        <MdButton
          key={index}
          type={index === actions.length - 1 ? 'primary' : 'default'}
          inline={actions.length > 1}
          onClick={() => action.handler && action.handler()}
        >
          {action.buttonText}
        </MdButton>
      ))}
    </div>
  )
}

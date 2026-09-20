import { CuIcon } from '../icon/Icon'

export interface CashierChannelItemData {
  icon?: string
  img?: string
  text?: string
  desc?: string
  disabled?: boolean
  action?: { text: string; handler: () => void }
}

export function CuCashierChannelItem({
  data = {},
  active = false,
  className,
  onClick,
}: {
  data?: CashierChannelItemData
  active?: boolean
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`cu-cashier-channel-item${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      {data.icon ? (
        <div className="item-icon" data-icon={data.icon}>
          <CuIcon name={data.icon} size="lg" />
        </div>
      ) : data.img ? (
        <div className="item-image">
          <img src={data.img} />
        </div>
      ) : null}
      <div className="item-label">
        <p className="title">
          <span dangerouslySetInnerHTML={{ __html: data.text ?? '' }} />
          {data.action ? (
            <span
              className="title-active"
              dangerouslySetInnerHTML={{ __html: data.action.text }}
              onClick={e => {
                e.stopPropagation()
                data.action?.handler()
              }}
            />
          ) : null}
        </p>
        {data.desc ? <p className="desc" dangerouslySetInnerHTML={{ __html: data.desc }} /> : null}
      </div>
      <div className="item-check-icon">
        {data.disabled ? <CuIcon name="check-disabled" /> : active ? <CuIcon name="checked" /> : <CuIcon name="check" />}
      </div>
    </div>
  )
}

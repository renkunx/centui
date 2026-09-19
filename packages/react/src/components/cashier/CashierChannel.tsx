import { useState, type ReactNode } from 'react'
import { MdButton } from '../button/Button'
import { MdCashierChannelItem } from './CashierChannelItem'
import type { CashierChannelItemData } from './CashierChannelItem'

export interface CashierChannel {
  text?: string
  desc?: string
  img?: string
  icon?: string
  value?: string
  disabled?: boolean
  action?: { text: string; handler: () => void }
}

export interface CashierChannelProps {
  paymentTitle?: string
  paymentAmount?: string
  paymentDescribe?: string
  moreButtonText?: string
  payButtonText?: string
  payButtonDisabled?: boolean
  channels?: CashierChannel[]
  channelLimit?: number
  defaultIndex?: number
  channelSlot?: ReactNode
  buttonSlot?: ReactNode
  onSelect?: (item: CashierChannel) => void
  onPay?: (item: CashierChannel) => void
}

export function MdCashierChannel({
  paymentTitle = '',
  paymentAmount = '',
  paymentDescribe = '',
  moreButtonText = '',
  payButtonText = '',
  payButtonDisabled = false,
  channels = [],
  channelLimit = 2,
  defaultIndex = 0,
  channelSlot,
  buttonSlot,
  onSelect,
  onPay,
}: CashierChannelProps) {
  const [isChannelShow, setIsChannelShow] = useState(false)
  const [isChannelActive, setIsChannelActive] = useState(false)
  const [activeChannelIndex, setActiveChannelIndex] = useState(defaultIndex)

  const isSingle = channelLimit < 1 || !(channels.length > channelLimit)

  return (
    <div className="md-cashier-channel">
      <div className="choose-text">
        {paymentTitle ? <p className="choose-title" dangerouslySetInnerHTML={{ __html: paymentTitle }} /> : null}
        {paymentAmount ? <p className="choose-number" dangerouslySetInnerHTML={{ __html: paymentAmount }} /> : null}
        {paymentDescribe ? <p className="choose-describe" dangerouslySetInnerHTML={{ __html: paymentDescribe }} /> : null}
      </div>
      <div className={`choose-channel${isChannelActive ? ' active' : ''}`}>
        {channelSlot}
        {isChannelShow || isSingle ? (
          <div className="choose-channel-list">
            {channels.map((item, index) => (
              <MdCashierChannelItem
                key={index}
                className={index === defaultIndex ? 'default' : undefined}
                data={item}
                active={index === activeChannelIndex}
                onClick={() => {
                  if (item.disabled) {
                    return
                  }
                  setActiveChannelIndex(index)
                  onSelect?.(item)
                }}
              />
            ))}
          </div>
        ) : channels[defaultIndex] ? (
          <div className="choose-channel-list">
            <MdCashierChannelItem
              data={channels[defaultIndex] as unknown as CashierChannelItemData}
              active
              onClick={() => onSelect?.(channels[defaultIndex])}
            />
          </div>
        ) : null}
        {!isSingle ? (
          <div
            className={`choose-channel-more${isChannelActive ? ' disabled' : ''}`}
            dangerouslySetInnerHTML={{ __html: moreButtonText }}
            onClick={() => {
              if (isChannelActive) {
                return
              }
              setIsChannelShow(true)
              setTimeout(() => setIsChannelActive(true), 0)
            }}
          />
        ) : null}
      </div>
      <div className="md-cashier-block-btn">
        <MdButton
          className="md-cashier-pay-button"
          type={payButtonDisabled ? 'disabled' : 'primary'}
          onClick={() => onPay?.(channels[activeChannelIndex])}
        >
          {buttonSlot ?? payButtonText}
        </MdButton>
      </div>
    </div>
  )
}

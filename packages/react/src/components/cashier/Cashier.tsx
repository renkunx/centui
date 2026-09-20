import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { t } from '@centui/core'
import { CuPopup } from '../popup/Popup'
import { CuPopupTitleBar } from '../popup/PopupTitleBar'
import { CuCaptcha } from '../captcha/Captcha'
import { CuIcon } from '../icon/Icon'
import { CuRollerSuccess } from '../activity-indicator/RollerSuccess'
import { CuCashierChannel, type CashierChannel } from './CashierChannel'
import { CuCashierChannelButton, type CashierAction } from './CashierChannelButton'

export type CashierScene = 'choose' | 'captcha' | 'loading' | 'success' | 'fail' | 'custom'

export interface CashierProps {
  value?: boolean
  channels?: CashierChannel[]
  channelLimit?: number
  defaultIndex?: number
  paymentTitle?: string
  paymentAmount?: string
  paymentDescribe?: string
  payButtonText?: string
  payButtonDisabled?: boolean
  moreButtonText?: string
  title?: string
  describe?: string
  largeRadius?: boolean
  headerSlot?: (scene: CashierScene) => ReactNode
  channelSlot?: ReactNode
  payButtonSlot?: ReactNode
  sceneSlot?: ReactNode
  footerSlot?: (scene: CashierScene) => ReactNode
  onChange?: (value: boolean) => void
  onSelect?: (item: CashierChannel) => void
  onPay?: (item: CashierChannel) => void
  onShow?: () => void
  onHide?: () => void
  onCancel?: () => void
}

export interface CashierSceneOption {
  loading?: { text?: string }
  success?: { text?: string; buttonText?: string; handler?: () => void; actions?: CashierAction[] }
  fail?: { text?: string; buttonText?: string; handler?: () => void; actions?: CashierAction[] }
  captcha?: {
    text?: string
    brief?: string
    maxlength?: number
    count?: number
    autoCountdown?: boolean
    countNormalText?: string
    countActiveText?: string
    onSend?: () => void
    onSubmit?: (code: string) => void
  }
}

export const CuCashier = forwardRef<
  { next: (scene: CashierScene, option?: CashierSceneOption) => void },
  CashierProps
>(function CuCashier(
  {
    value = false,
    channels = [],
    channelLimit = 2,
    defaultIndex = 0,
    paymentTitle = t('md.cashier.payCash'),
    paymentAmount = '0.00',
    paymentDescribe = '',
    payButtonText = t('md.cashier.confirmPay'),
    payButtonDisabled = false,
    moreButtonText = t('md.cashier.morePayWays'),
    title = t('md.cashier.pay'),
    describe = '',
    largeRadius = false,
    headerSlot,
    channelSlot,
    payButtonSlot,
    sceneSlot,
    footerSlot,
    onChange,
    onSelect,
    onPay,
    onShow,
    onHide,
    onCancel,
  },
  ref,
) {
  const [isCashierShow, setIsCashierShow] = useState(value)
  const [scene, setScene] = useState<CashierScene>('choose')
  const [sceneKey, setSceneKey] = useState(() => Date.now())
  const sceneOptionRef = useRef<{
    loading: { text: string }
    success: { text: string; buttonText: string; handler?: () => void; actions?: CashierAction[] }
    fail: { text: string; buttonText: string; handler?: () => void; actions?: CashierAction[] }
    captcha: {
      text: string
      brief: string
      maxlength: number
      count: number
      autoCountdown: boolean
      countNormalText?: string
      countActiveText?: string
      onSend: () => void
      onSubmit: (code: string) => void
    }
  }>({
    loading: { text: t('md.cashier.payResultSearch') },
    success: {
      text: t('md.cashier.paySuccess'),
      buttonText: t('md.cashier.confirm'),
      handler: undefined,
    },
    fail: {
      text: t('md.cashier.payFail'),
      buttonText: t('md.cashier.confirm'),
      handler: undefined,
    },
    captcha: {
      text: '',
      brief: '',
      maxlength: 4,
      count: 60,
      autoCountdown: true,
      onSend: () => {},
      onSubmit: () => {},
    },
  })

  // v2 watch value / isCashierShow
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      setIsCashierShow(value)
    }
  }, [value])

  const prevShowRef = useRef(isCashierShow)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    if (prevShowRef.current !== isCashierShow) {
      prevShowRef.current = isCashierShow
      onChangeRef.current?.(isCashierShow)
    }
  }, [isCashierShow])

  useImperativeHandle(ref, () => ({
    next: (nextScene, option = {}) => {
      const target = (sceneOptionRef.current as unknown as Record<string, unknown>)[nextScene]
      if (target) {
        Object.assign(target, option)
      }
      setScene(nextScene)
      setSceneKey(Date.now())
    },
  }))

  const captcha = sceneOptionRef.current.captcha

  return (
    <div className="cu-cashier">
      <CuPopup
        className="inner-popup"
        value={isCashierShow}
        position="bottom"
        maskClosable={false}
        preventScrollExclude=".choose-channel"
        preventScroll
        onShow={() => onShow?.()}
        onHide={() => {
          setScene('choose')
          onHide?.()
        }}
      >
        <CuPopupTitleBar
          title={title}
          describe={describe}
          largeRadius={largeRadius}
          onlyClose
          onCancel={() => {
            setIsCashierShow(false)
            onCancel?.()
          }}
        />
        <div className="cu-cashier-container">
          {headerSlot ? headerSlot(scene) : null}

          {scene === 'choose' ? (
            <div key={sceneKey} className="cu-cashier-block cu-cashier-choose">
              <CuCashierChannel
                paymentTitle={paymentTitle}
                paymentAmount={paymentAmount}
                paymentDescribe={paymentDescribe}
                moreButtonText={moreButtonText}
                payButtonText={payButtonText}
                payButtonDisabled={payButtonDisabled}
                channels={channels}
                channelLimit={channelLimit}
                defaultIndex={defaultIndex}
                channelSlot={channelSlot}
                buttonSlot={payButtonSlot}
                onSelect={onSelect}
                onPay={onPay}
              />
            </div>
          ) : scene === 'captcha' ? (
            <div key={sceneKey} className="cu-cashier-block cu-cashier-captcha">
              <CuCaptcha
                maxlength={captcha.maxlength}
                count={captcha.count}
                countNormalText={captcha.countNormalText}
                countActiveText={captcha.countActiveText}
                autoCountdown={captcha.autoCountdown}
                brief={captcha.brief}
                isView
                onSend={() => captcha.onSend()}
                onSubmit={code => captcha.onSubmit(code)}
              >
                <div>{captcha.text}</div>
              </CuCaptcha>
            </div>
          ) : scene === 'loading' || scene === 'success' ? (
            <div
              key={sceneKey}
              className={`cu-cashier-block${scene === 'loading' ? ' cu-cashier-loading' : ''}${
                scene === 'success' ? ' cu-cashier-success' : ''
              }`}
            >
              <div className="cu-cashier-block-icon">
                <CuRollerSuccess isSuccess={scene === 'success'} />
              </div>
              <div className="cu-cashier-block-text">
                {scene === 'success' ? sceneOptionRef.current.success.text : sceneOptionRef.current.loading.text}
              </div>
              {scene === 'success' ? (
                <CuCashierChannelButton
                  actions={
                    sceneOptionRef.current.success.actions || [
                      {
                        buttonText: sceneOptionRef.current.success.buttonText,
                        handler: sceneOptionRef.current.success.handler,
                      },
                    ]
                  }
                />
              ) : null}
            </div>
          ) : scene === 'fail' ? (
            <div key={sceneKey} className="cu-cashier-block cu-cashier-fail">
              <div className="cu-cashier-block-icon">
                <CuIcon name="warn-color" />
              </div>
              <div className="cu-cashier-block-text">{sceneOptionRef.current.fail.text}</div>
              <CuCashierChannelButton
                actions={
                  sceneOptionRef.current.fail.actions || [
                    {
                      buttonText: sceneOptionRef.current.fail.buttonText,
                      handler: sceneOptionRef.current.fail.handler,
                    },
                  ]
                }
              />
            </div>
          ) : scene === 'custom' ? (
            <div key={sceneKey} className="cu-cashier-block cu-cashier-custom">
              {sceneSlot}
            </div>
          ) : null}

          {footerSlot ? footerSlot(scene) : null}
        </div>
      </CuPopup>
    </div>
  )
})

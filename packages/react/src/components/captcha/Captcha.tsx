import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CuPopup } from '../popup/Popup'
import { CuPopupTitleBar } from '../popup/PopupTitleBar'
import { CuDialog } from '../dialog/Dialog'
import { CuCodebox, type CodeboxExposed } from '../codebox/Codebox'
import { t } from '@centui/core'

export interface CaptchaProps {
  value?: boolean
  title?: string
  subtitle?: string
  brief?: string
  maxlength?: number | string
  mask?: boolean
  system?: boolean
  autoSend?: boolean
  autoCountdown?: boolean
  count?: number
  countNormalText?: string
  countActiveText?: string
  isView?: boolean
  /** inline | halfScreen | dialog */
  type?: string
  inputType?: string
  disableSend?: boolean
  children?: ReactNode
  onChange?: (value: boolean) => void
  onShow?: () => void
  onHide?: () => void
  onSubmit?: (code: string) => void
  /** 重发验证码回调，携带 countdown 以便手动重置 */
  onSend?: (countdown: () => void) => void
}

const SEND_TEXT = () => t('md.captcha.sendCaptcha')
const COUNTDOWN_TEXT = () => t('md.captcha.countdown')

export const CuCaptcha = forwardRef<
  { countdown: () => void; resetcount: () => void; setError: (m: string) => void; close: () => void },
  CaptchaProps
>(function CuCaptcha(
  {
    value = false,
    title,
    subtitle,
    brief = '',
    maxlength = 4,
    mask = false,
    system = false,
    autoSend = true,
    autoCountdown = true,
    count = 60,
    countNormalText = SEND_TEXT(),
    countActiveText = COUNTDOWN_TEXT(),
    isView = false,
    type = 'dialog',
    inputType = 'tel',
    disableSend = false,
    children,
    onChange,
    onShow,
    onHide,
    onSubmit,
    onSend,
  },
  ref,
) {
  const codeboxRef = useRef<CodeboxExposed | null>(null)
  const [code, setCode] = useState('')
  const [visible, setVisible] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isCounting, setIsCounting] = useState(false)
  const firstShownRef = useRef(false)
  const [countBtnText, setCountBtnText] = useState(countNormalText)
  const [isKeyboard, setIsKeyboard] = useState(false)
  const originHeightRef = useRef(0)
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isInline = isView || type === 'inline'
  const isShowErrorStyle = errorMsg !== '' && !disableSend

  // v2 watch value：打开清空码值；首次打开自动发送
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      if (value) {
        setCode('')
        if (!firstShownRef.current) {
          firstShownRef.current = true
          if (autoSend) {
            handleResend()
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // v2 watch code：输入时清错误
  useEffect(() => {
    if (code && errorMsg) {
      setErrorMsg('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // v2 mounted：Android 键盘高度监听 + 内联/初始打开自动发送
  useEffect(() => {
    const ua = window.navigator.userAgent.toLocaleLowerCase()
    const isAndroid = /android/.test(ua)
    const listenResize = () => {
      const resizeHeight = document.documentElement.clientHeight || document.body.clientHeight
      setIsKeyboard(originHeightRef.current < resizeHeight)
      originHeightRef.current = resizeHeight
    }
    if (isAndroid && type === 'halfScreen') {
      originHeightRef.current = document.documentElement.clientHeight || document.body.clientHeight
      window.addEventListener('resize', listenResize, false)
    }
    if (value || isInline) {
      firstShownRef.current = true
      if (autoSend) {
        handleResend()
      }
    }
    return () => {
      if (isAndroid && type === 'halfScreen') {
        window.removeEventListener('resize', listenResize)
      }
      if (counterRef.current) {
        clearInterval(counterRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleResend() {
    if (autoCountdown) {
      countdown()
    }
    onSend?.(countdown)
  }

  function countdown() {
    if (!count) {
      return
    }
    if (counterRef.current) {
      clearInterval(counterRef.current)
    }
    const timestamp = Date.now()
    let i = count
    setIsCounting(true)
    setCountBtnText(countActiveText.replace('{$1}', String(i)))
    counterRef.current = setInterval(() => {
      if (i <= 1) {
        resetcount()
      } else {
        i = count - Math.floor((Date.now() - timestamp) / 1000)
        setCountBtnText(countActiveText.replace('{$1}', String(i)))
      }
    }, 1000)
  }

  function resetcount() {
    setIsCounting(false)
    setCountBtnText(countNormalText)
    if (counterRef.current) {
      clearInterval(counterRef.current)
    }
  }

  useImperativeHandle(ref, () => ({
    countdown,
    resetcount,
    setError: (m: string) => {
      setTimeout(() => setErrorMsg(m), 0)
    },
    close: () => {
      onChange?.(false)
    },
  }))

  const footer = (
    <footer className="cu-captcha-footer">
      {errorMsg ? <div className="cu-captcha-error">{errorMsg}</div> : <div className="cu-captcha-brief">{brief}</div>}
      {count ? (
        <button className="cu-captcha-btn" disabled={isCounting} onClick={handleResend}>
          {countBtnText}
        </button>
      ) : null}
    </footer>
  )

  const inlineBlock =
    isInline ? (
      <>
        <div className="cu-captcha-content">
          {title ? <h2 className="cu-captcha-title">{title}</h2> : null}
          <div className="cu-captcha-message">{children}</div>
        </div>
        <CuCodebox
          ref={codeboxRef}
          value={code}
          maxlength={maxlength}
          system={system}
          mask={mask}
          closable={false}
          isView
          justify
          autofocus={false}
          inputType={inputType}
          onChange={setCode}
          onSubmit={onSubmit}
        >
          {footer}
        </CuCodebox>
      </>
    ) : null

  const halfScreenBlock =
    type === 'halfScreen' ? (
      <CuPopup
        value={value}
        hasMask
        position="bottom"
        maskClosable={false}
        onChange={(v) => {
          onChange?.(v)
          if (v) {
            onShow?.()
            setVisible(true)
            codeboxRef.current?.focus()
          } else {
            onHide?.()
            setVisible(false)
            codeboxRef.current?.blur()
          }
        }}
      >
        <div className="cu-captcha-half-container">
          <CuPopupTitleBar onlyClose largeRadius title={title} describe={subtitle} titleAlign="left" onCancel={() => onChange?.(false)} />
          <div className="cu-captcha-half-content">{children}</div>
          <CuCodebox
            ref={codeboxRef}
            value={code}
            maxlength={maxlength}
            system={system}
            mask={mask}
            disabled={disableSend}
            closable={false}
            isView
            justify
            autofocus={false}
            inputType={inputType}
            isErrorStyle={isShowErrorStyle}
            onChange={setCode}
            onSubmit={onSubmit}
          >
            <footer className={`cu-captcha-footer${isKeyboard ? ' halfStyle' : ''}`}>
              {errorMsg ? <div className="cu-captcha-error">{errorMsg}</div> : <div className="cu-captcha-brief">{brief}</div>}
              {count ? (
                <button
                  className={`cu-captcha-btn${disableSend ? ' is-disabled-send' : ''}`}
                  disabled={isCounting}
                  onClick={handleResend}
                >
                  {countBtnText}
                </button>
              ) : null}
            </footer>
          </CuCodebox>
        </div>
      </CuPopup>
    ) : null

  const dialogBlock =
    type === 'dialog' ? (
      <CuDialog
        value={value}
        closable
        appendTo={false}
        position="center"
        onChange={(v) => {
          onChange?.(v)
          if (v) {
            onShow?.()
            setVisible(true)
            codeboxRef.current?.focus()
          } else {
            onHide?.()
            setVisible(false)
            codeboxRef.current?.blur()
          }
        }}
      >
        <div className="cu-captcha-content">
          {title ? <h2 className="cu-captcha-title">{title}</h2> : null}
          <div className="cu-captcha-message">{children}</div>
        </div>
        <CuCodebox
          ref={codeboxRef}
          value={code}
          maxlength={maxlength}
          system={system}
          closable={false}
          mask={mask}
          justify
          autofocus={false}
          inputType={inputType}
          onChange={setCode}
          onSubmit={onSubmit}
        >
          {footer}
        </CuCodebox>
      </CuDialog>
    ) : null

  return (
    <div className="cu-captcha" style={{ display: isInline || value || visible ? '' : 'none' }}>
      {inlineBlock}
      {halfScreenBlock}
      {dialogBlock}
    </div>
  )
})

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CuPopup } from '../popup/Popup'
import { CuIcon } from '../icon/Icon'

export interface ToastProps {
  icon?: string
  iconSvg?: boolean
  content?: string | number
  duration?: number
  /** top | center | bottom */
  position?: string
  hasMask?: boolean
  square?: boolean
  children?: ReactNode
  onShow?: () => void
  onHide?: () => void
}

export interface ToastExposed {
  visible: boolean
  show: () => void
  hide: () => void
}

export const CuToast = forwardRef<ToastExposed, ToastProps>(function CuToast(
  {
    icon = '',
    iconSvg = false,
    content = '',
    duration = 0,
    position = 'center',
    hasMask = false,
    square = false,
    children,
    onShow,
    onHide,
  }: ToastProps,
  ref,
) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const durationRef = useRef(duration)
  durationRef.current = duration

  useImperativeHandle(
    ref,
    () => ({
      get visible() {
        return visibleRef.current
      },
      show,
      hide,
    }),
    [],
  )

  const visibleRef = useRef(visible)
  visibleRef.current = visible

  const show = () => {
    setVisible(true)
  }
  const hide = () => {
    setVisible(false)
  }

  // duration 到时自动隐藏（v2 fire 契约：visible 期间重放计时）
  useEffect(() => {
    if (!visible) {
      return
    }
    if (durationRef.current) {
      timerRef.current = setTimeout(() => setVisible(false), durationRef.current)
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [visible])

  useEffect(() => {
    if (visible) {
      onShow?.()
    } else {
      onHide?.()
    }
  }, [visible])

  return (
    <div className={`cu-toast ${position}`}>
      <CuPopup value={visible} hasMask={hasMask} maskClosable={false} onShow={onShow} onHide={onHide}>
        {children ? (
          <div className={`cu-toast-content${square ? ' square' : ''}`}>{children}</div>
        ) : (
          <div className={`cu-toast-content${square ? ' square' : ''}`}>
            {icon ? <CuIcon name={icon} size="lg" svg={iconSvg} /> : null}
            {content !== '' ? <div className="cu-toast-text">{content}</div> : null}
          </div>
        )}
      </CuPopup>
    </div>
  )
})

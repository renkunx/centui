import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface PopupContextValue {
  setLargeRadius: (value: boolean) => void
}

export const PopupContext = createContext<PopupContextValue>({
  setLargeRadius: () => {},
})

export interface PopupProps {
  value?: boolean
  hasMask?: boolean
  maskClosable?: boolean
  /** center | top | bottom | left | right */
  position?: string
  /** 覆盖默认过渡名（样式由 @centui/styles 提供） */
  transition?: string
  preventScroll?: boolean
  preventScrollExclude?: string | HTMLElement
  onBeforeShow?: () => void
  onBeforeHide?: () => void
  onShow?: () => void
  onHide?: () => void
  /** 遮罩点击（maskClosable 时触发） */
  onMaskClick?: () => void
  onChange?: (value: boolean) => void
  children?: ReactNode
  className?: string
}

const isTestEnv =
  typeof process !== 'undefined' && (process.env as { MAND_ENV?: string }).MAND_ENV === 'test'

function defaultTransition(position: string): string {
  switch (position) {
    case 'bottom':
      return 'cu-slide-up'
    case 'top':
      return 'cu-slide-down'
    case 'left':
      return 'cu-slide-right'
    case 'right':
      return 'cu-slide-left'
    default:
      return 'cu-fade'
  }
}

export function CuPopup({
  value = false,
  hasMask = true,
  maskClosable = true,
  position = 'center',
  transition,
  preventScroll = false,
  preventScrollExclude = '',
  onBeforeShow,
  onBeforeHide,
  onShow,
  onHide,
  onMaskClick,
  onChange,
  children,
  className,
}: PopupProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPopupShow, setIsPopupShow] = useState(false)
  const [isPopupBoxShow, setIsPopupBoxShow] = useState(false)
  // 过渡钩子需要读取最新开关态（state 闭包值在首帧过期）
  const isPopupBoxShowRef = useRef(false)
  const [largeRadius, setLargeRadius] = useState(false)
  const isAnimationRef = useRef(false)

  const transitionName = transition ?? defaultTransition(position)

  const fireTransitionStart = () => {
    if (!isPopupBoxShowRef.current) {
      onBeforeHide?.()
    } else {
      onBeforeShow?.()
    }
  }

  const fireTransitionEnd = () => {
    if (!isAnimationRef.current) {
      return
    }
    if (!isPopupBoxShowRef.current) {
      setIsPopupShow(false)
      onHide?.()
    } else {
      onShow?.()
    }
    isAnimationRef.current = false
  }

  const showPopupBox = () => {
    setIsPopupShow(true)
    isAnimationRef.current = true
    setIsPopupBoxShow(true)
    isPopupBoxShowRef.current = true
    if (isTestEnv) {
      // v2 契约：测试环境同步触发过渡钩子
      fireTransitionStart()
      fireTransitionEnd()
    }
    if (preventScroll) {
      bindPreventScroll(true)
    }
  }

  const hidePopupBox = () => {
    isAnimationRef.current = true
    setIsPopupBoxShow(false)
    isPopupBoxShowRef.current = false
    if (preventScroll) {
      bindPreventScroll(false)
    }
    onChange?.(false)
    if (isTestEnv) {
      fireTransitionStart()
      fireTransitionEnd()
    }
  }

  // v2 契约：动画锁期间再次打开走 50ms 延迟分支
  useEffect(() => {
    if (value) {
      if (isAnimationRef.current) {
        const timer = setTimeout(showPopupBox, 50)
        return () => clearTimeout(timer)
      }
      showPopupBox()
    } else if (isPopupShow || isPopupBoxShow) {
      hidePopupBox()
    }
  }, [value])

  const preventDefault = (event: Event) => event.preventDefault()
  const stopImmediatePropagation = (event: Event) => event.stopImmediatePropagation()

  const bindPreventScroll = (isBind: boolean) => {
    const handler = isBind ? 'addEventListener' : 'removeEventListener'
    const masker = rootRef.current?.querySelector<HTMLElement>('.cu-popup-mask')
    const boxer = rootRef.current?.querySelector<HTMLElement>('.cu-popup-box')
    masker?.[handler]('touchmove', preventDefault, false)
    boxer?.[handler]('touchmove', preventDefault, false)

    const excluder: HTMLElement | undefined | null =
      typeof preventScrollExclude === 'string'
        ? preventScrollExclude
          ? rootRef.current?.querySelector<HTMLElement>(preventScrollExclude)
          : undefined
        : preventScrollExclude
    if (excluder) {
      excluder[handler]('touchmove', stopImmediatePropagation, false)
    }
  }

  const handleMaskClick = () => {
    if (maskClosable) {
      hidePopupBox()
      onMaskClick?.()
    }
  }

  const contextValue = useRef({ setLargeRadius })
  contextValue.current.setLargeRadius = setLargeRadius

  return (
    <PopupContext.Provider value={contextValue.current}>
      <div
        ref={rootRef}
        className={[
          'cu-popup',
          className,
          hasMask ? 'with-mask' : '',
          largeRadius ? 'large-radius' : '',
          position,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ display: isPopupShow ? undefined : 'none' }}
      >
        <div
          className="cu-popup-mask"
          style={{ display: hasMask && isPopupBoxShow ? undefined : 'none' }}
          onClick={handleMaskClick}
        ></div>
        <div
          className={`cu-popup-box ${transitionName}`}
          style={{ display: isPopupBoxShow ? undefined : 'none' }}
        >
          {children}
        </div>
      </div>
    </PopupContext.Provider>
  )
}

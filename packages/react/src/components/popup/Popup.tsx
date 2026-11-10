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

/**
 * S1 修复说明：过渡完成的驱动在下方 transitionEpoch effect 中——
 * 按 computed duration 选择 transitionend/animationend 监听，并以 duration+100ms 兜底；
 * 无动画环境（duration=0，含 jsdom）下一拍立即完成，保证 onShow/onHide/动画锁复位必然发生。
 */
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
  // 过渡纪元：每次 show/hide 递增，驱动下方真实事件监听 effect 重挂
  const [transitionEpoch, setTransitionEpoch] = useState(0)
  const timerCleanupRef = useRef<(() => void) | null>(null)

  // 回调 ref-mirror：过渡完成回调必须取最新 props（事件/兜底定时器跨越多次渲染）
  const onShowRef = useRef(onShow)
  onShowRef.current = onShow
  const onHideRef = useRef(onHide)
  onHideRef.current = onHide

  const transitionName = transition ?? defaultTransition(position)

  const fireTransitionStart = () => {
    if (!isPopupBoxShowRef.current) {
      onBeforeHide?.()
    } else {
      onBeforeShow?.()
    }
  }

  const fireTransitionEnd = () => {
    // 幂等闩：动画锁未挂起时忽略（重复 transitionend / 兜底定时器 / 同步触发竞争）
    if (!isAnimationRef.current) {
      return
    }
    isAnimationRef.current = false
    timerCleanupRef.current?.()
    timerCleanupRef.current = null
    if (!isPopupBoxShowRef.current) {

      setIsPopupShow(false)
      onHideRef.current?.()
    } else {
      onShowRef.current?.()
    }
  }

  const showPopupBox = () => {
    setIsPopupShow(true)
    isAnimationRef.current = true
    setIsPopupBoxShow(true)
    isPopupBoxShowRef.current = true
    setTransitionEpoch(n => n + 1)
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
    setTransitionEpoch(n => n + 1)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  /**
   * S1 修复：生产环境的过渡完成驱动。
   * show/hide 后在 box 元素上按 computed duration 监听 transitionend/animationend，
   * 并以 duration+100ms 兜底；无动画（duration=0）时下一拍立即完成。
   * 测试环境（MAND_ENV=test）已在 show/hide 中同步触发，此处跳过。
   */
  useEffect(() => {
    if (isTestEnv || !isAnimationRef.current) {
      return
    }
    const box = rootRef.current?.querySelector<HTMLElement>('.cu-popup-box') ?? null
    let duration = 0
    let transitionMs = 0
    let animationMs = 0
    if (box) {
      let style: CSSStyleDeclaration | null
      try {
        style = window.getComputedStyle(box)
      } catch {
        style = null
      }
      const parse = (raw?: string | null): number => {
        if (!raw) {
          return 0
        }
        return raw.split(',').reduce((max, part) => {
          const v = parseFloat(part)
          if (Number.isNaN(v)) {
            return max
          }
          return Math.max(max, part.trim().endsWith('ms') ? v : v * 1000)
        }, 0)
      }
      transitionMs = parse(style?.transitionDuration)
      animationMs = parse(style?.animationDuration)
      duration = Math.max(transitionMs, animationMs)
    }

    const onEnd = (event: Event) => {
      if (!box || event.target === box) {
        fireTransitionEnd()
      }
    }
    const removers: Array<() => void> = []
    if (box) {
      // 按 duration 选择监听目标；两者皆无时防御性双挂（部分环境低报 duration）
      if (transitionMs > 0 || (transitionMs === 0 && animationMs === 0)) {
        box.addEventListener('transitionend', onEnd)
        removers.push(() => box.removeEventListener('transitionend', onEnd))
      }
      if (animationMs > 0 || (transitionMs === 0 && animationMs === 0)) {
        box.addEventListener('animationend', onEnd)
        removers.push(() => box.removeEventListener('animationend', onEnd))
      }
    }
    const fallbackTimer = setTimeout(fireTransitionEnd, duration > 0 ? duration + 100 : 0)
    timerCleanupRef.current = () => clearTimeout(fallbackTimer)
    return () => {
      clearTimeout(fallbackTimer)
      removers.forEach(remove => remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionEpoch])

  // 卸载兜底：清理遗留动画锁与定时器
  useEffect(
    () => () => {
      timerCleanupRef.current?.()
      timerCleanupRef.current = null
      isAnimationRef.current = false
    },
    [],
  )

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

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CuIcon } from '../icon/Icon'

export interface NoticeBarProps {
  /** link | closable */
  mode?: string
  /** default | activity | warning */
  type?: string
  time?: number
  round?: boolean
  multiRows?: boolean
  scrollable?: boolean
  icon?: string
  iconSvg?: boolean
  closable?: boolean
  left?: ReactNode
  right?: ReactNode
  children?: ReactNode
  onClose?: () => void
}

export function CuNoticeBar({
  mode = '',
  type = 'default',
  time = 0,
  round = false,
  multiRows = false,
  scrollable = false,
  icon = '',
  iconSvg = false,
  closable = false,
  left,
  right,
  children,
  onClose,
}: NoticeBarProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isShow, setIsShow] = useState(true)
  const [overflow, setOverflow] = useState(false)

  const customLeft = left !== undefined
  const customRight = right !== undefined
  const rightIcon = mode === 'link' ? 'arrow' : 'close'

  /**
   * 计算 padding-left 对宽度的影响（v2 契约：getBoundingClientRect）
   */
  const checkOverflow = useCallback(() => {
    if (!scrollable) {
      return
    }
    const wrapEl = wrapRef.current
    const contentEl = contentRef.current
    if (!wrapEl || !contentEl) {
      return
    }
    const paddingLeft =
      window.getComputedStyle(contentEl, null).getPropertyValue('padding').split(' ')[3] || '0px'
    const pad = +(paddingLeft.match(/\d+/g) as string[])[0]
    setOverflow(contentEl.scrollWidth - pad > Math.ceil(wrapEl.getBoundingClientRect().width))
  }, [scrollable])

  useEffect(() => {
    if (time) {
      const timer = setTimeout(() => setIsShow(false), time)
      return () => clearTimeout(timer)
    }
  }, [time])

  useEffect(() => {
    checkOverflow()
  }, [checkOverflow, children])

  const close = () => {
    if (mode === 'closable' || closable) {
      setIsShow(false)
    }
    onClose?.()
  }

  if (!isShow) {
    return null
  }

  return (
    <div
      className={`cu-notice-bar${round ? ' cu-notice-bar-round' : ''} ${type}`}
    >
      <div
        className={`cu-notice-bar-left${!customLeft && !icon ? ' cu-notice-bar-empty' : ''}`}
      >
        {customLeft ? (
          left
        ) : icon ? (
          <CuIcon name={icon} svg={iconSvg} className="cu-notice-icon" />
        ) : null}
      </div>
      <div
        ref={wrapRef}
        className={`cu-notice-bar-content${multiRows ? ' cu-notice-bar-multi-content' : ''}`}
      >
        <div ref={contentRef} className={overflow && scrollable ? 'cu-notice-bar-content-animate' : ''}>
          {children}
        </div>
      </div>
      <div className="cu-notice-bar-right">
        {customRight ? (
          right
        ) : mode || closable ? (
          <CuIcon
            name={rightIcon}
            className="cu-notice-icon cu-notice-icon-right"
            onClick={event => {
              event.stopPropagation()
              close()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

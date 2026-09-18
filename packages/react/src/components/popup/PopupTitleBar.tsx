import { useContext, useEffect, type ReactNode } from 'react'
import { MdIcon } from '../icon/Icon'
import { PopupContext } from './Popup'

export interface PopupTitleBarProps {
  title?: string
  describe?: string
  okText?: string
  cancelText?: string
  largeRadius?: boolean
  onlyClose?: boolean
  /** center | left | right */
  titleAlign?: string
  onConfirm?: () => void
  onCancel?: () => void
  cancelSlot?: ReactNode
  confirmSlot?: ReactNode
  titleSlot?: ReactNode
}

export function MdPopupTitleBar({
  title = '',
  describe = '',
  okText = '',
  cancelText = '',
  largeRadius = false,
  onlyClose = false,
  titleAlign = 'center',
  onConfirm,
  onCancel,
  cancelSlot,
  confirmSlot,
  titleSlot,
}: PopupTitleBarProps) {
  // v2 契约：title-bar 的 largeRadius 同步到父级 Popup 修饰类
  const popup = useContext(PopupContext)
  useEffect(() => {
    popup.setLargeRadius(largeRadius)
  }, [largeRadius, popup])

  const preventTouch = (event: React.TouchEvent) => event.preventDefault()

  return (
    <div
      className={`md-popup-title-bar title-align-${titleAlign}${describe ? ' large' : ''}${
        largeRadius ? ' large-radius' : ''
      }`}
      onTouchMove={preventTouch}
    >
      {!onlyClose ? (
        <>
          {cancelText ? (
            <div
              className="title-bar-left md-popup-cancel"
              dangerouslySetInnerHTML={{ __html: cancelText }}
              onClick={() => onCancel?.()}
            ></div>
          ) : cancelSlot ? (
            <div className="title-bar-left md-popup-cancel" onClick={() => onCancel?.()}>
              {cancelSlot}
            </div>
          ) : null}
        </>
      ) : null}

      {title ? (
        <div className="title-bar-title">
          <p className="title" dangerouslySetInnerHTML={{ __html: title }}></p>
          {describe ? (
            <p className="describe" dangerouslySetInnerHTML={{ __html: describe }}></p>
          ) : null}
        </div>
      ) : (
        <div className="title-bar-title">{titleSlot}</div>
      )}

      {!onlyClose ? (
        <>
          {okText ? (
            <div
              className="title-bar-right md-popup-confirm"
              dangerouslySetInnerHTML={{ __html: okText }}
              onClick={() => onConfirm?.()}
            ></div>
          ) : confirmSlot ? (
            <div className="title-bar-right md-popup-confirm" onClick={() => onConfirm?.()}>
              {confirmSlot}
            </div>
          ) : null}
        </>
      ) : null}
      {onlyClose ? (
        <div className="title-bar-right md-popup-close" onClick={() => onCancel?.()}>
          <MdIcon name="close" size="lg" />
        </div>
      ) : null}
    </div>
  )
}

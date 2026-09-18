import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { MdPopup } from '../popup/Popup'
import { MdIcon } from '../icon/Icon'
import { MdActivityIndicatorRolling } from '../activity-indicator/Roller'

export interface DialogBtn {
  text?: string
  icon?: string
  iconSvg?: boolean
  disabled?: boolean
  warning?: boolean
  loading?: boolean
  handler?: (btn: DialogBtn) => void
}

export interface DialogProps {
  value?: boolean
  title?: string
  icon?: string
  iconSvg?: boolean
  closable?: boolean
  content?: string
  btns?: DialogBtn[]
  /** row | column */
  layout?: string
  appendTo?: HTMLElement | null
  hasMask?: boolean
  maskClosable?: boolean
  transition?: string
  preventScroll?: boolean
  preventScrollExclude?: string
  headerSlot?: ReactNode
  children?: ReactNode
  onChange?: (value: boolean) => void
  onShow?: () => void
  onHide?: () => void
}

export interface DialogExposed {
  close: () => void
}

export const MdDialog = forwardRef<DialogExposed, DialogProps>(function MdDialog(
  {
    value = false,
    title = '',
    icon = '',
    iconSvg = false,
    closable = true,
    content = '',
    btns = [],
    layout = 'row',
    appendTo,
    hasMask = true,
    maskClosable = false,
    transition = 'md-fade',
    preventScroll = false,
    preventScrollExclude = '',
    headerSlot,
    children,
    onChange,
    onShow,
    onHide,
  }: DialogProps,
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  // v2 契约：appendTo 迁移以 portal 实现（保持 React 事件委托）；null = 原地渲染
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null | undefined>(undefined)

  useEffect(() => {
    setPortalTarget(appendTo === undefined ? document.body : appendTo)
  }, [appendTo])

  useImperativeHandle(ref, () => ({ close: () => onChange?.(false) }), [onChange])

  const close = () => onChange?.(false)

  const onClickBtn = (btn: DialogBtn) => {
    if (btn.disabled || btn.loading) {
      return
    }
    if (typeof btn.handler === 'function') {
      btn.handler(btn)
    } else {
      close()
    }
  }

  const dialogTree = (
    <div ref={rootRef} className="md-dialog">
      <MdPopup
        value={value}
        hasMask={hasMask}
        maskClosable={maskClosable}
        position="center"
        transition={transition}
        preventScroll={preventScroll}
        preventScrollExclude={preventScrollExclude}
        onChange={onChange}
        onShow={onShow}
        onHide={onHide}
      >
        <div className="md-dialog-content">
          {headerSlot}
          <div className="md-dialog-body">
            {closable ? (
              <a role="button" className="md-dialog-close" onClick={close}>
                <MdIcon name="close" />
              </a>
            ) : null}
            {icon ? (
              <div className="md-dialog-icon">
                <MdIcon name={icon} svg={iconSvg} />
              </div>
            ) : null}
            {title ? <h2 className="md-dialog-title">{title}</h2> : null}
            {children ?? <div className="md-dialog-text" dangerouslySetInnerHTML={{ __html: content }} />}
          </div>
          <footer className={`md-dialog-actions${layout === 'column' ? ' is-column' : ''}`}>
            {btns.map((btn, index) => (
              <a
                role="button"
                key={index}
                className={`md-dialog-btn${btn.disabled ? ' disabled' : ''}${
                  !btn.disabled && btn.warning ? ' warning' : ''
                }`}
                onClick={() => onClickBtn(btn)}
                onTouchMove={event => event.preventDefault()}
              >
                {btn.loading ? <MdActivityIndicatorRolling /> : null}
                {!btn.loading && btn.icon ? (
                  <MdIcon name={btn.icon} svg={btn.iconSvg} size="md" />
                ) : null}
                {` ${btn.text ?? ''} `}
              </a>
            ))}
          </footer>
        </div>
      </MdPopup>
    </div>
  )

  // portal target 未就绪（SSR/首帧）或显式 null 时原地渲染
  if (portalTarget === undefined || portalTarget === null) {
    return dialogTree
  }
  return createPortal(dialogTree, portalTarget)
})

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CuPopup } from '../popup/Popup'
import { CuIcon } from '../icon/Icon'
import { CuActivityIndicatorRolling } from '../activity-indicator/Roller'

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
  /** v2 透传属性：渲染为根节点 position attribute */
  position?: string
  title?: string
  icon?: string
  iconSvg?: boolean
  closable?: boolean
  content?: string
  btns?: DialogBtn[]
  /** row | column */
  layout?: string
  appendTo?: HTMLElement | null | false
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

export const CuDialog = forwardRef<DialogExposed, DialogProps>(function CuDialog(
  {
    value = false,
    title = '',
    icon = '',
    iconSvg = false,
    closable = true,
    position,
    content = '',
    btns = [],
    layout = 'row',
    appendTo,
    hasMask = true,
    maskClosable = false,
    transition = 'cu-fade',
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
    setPortalTarget(appendTo === false ? null : appendTo === undefined ? document.body : appendTo)
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
    <div ref={rootRef} className="cu-dialog" {...(position ? ({ position } as object) : {})}>
      <CuPopup
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
        <div className="cu-dialog-content">
          {headerSlot}
          <div className="cu-dialog-body">
            {closable ? (
              <a role="button" className="cu-dialog-close" onClick={close}>
                <CuIcon name="close" />
              </a>
            ) : null}
            {icon ? (
              <div className="cu-dialog-icon">
                <CuIcon name={icon} svg={iconSvg} />
              </div>
            ) : null}
            {title ? <h2 className="cu-dialog-title">{title}</h2> : null}
            {children ?? <div className="cu-dialog-text" dangerouslySetInnerHTML={{ __html: content }} />}
          </div>
          <footer className={`cu-dialog-actions${layout === 'column' ? ' is-column' : ''}`}>
            {btns.map((btn, index) => (
              <a
                role="button"
                key={index}
                className={`cu-dialog-btn${btn.disabled ? ' disabled' : ''}${
                  !btn.disabled && btn.warning ? ' warning' : ''
                }`}
                onClick={() => onClickBtn(btn)}
                onTouchMove={event => event.preventDefault()}
              >
                {btn.loading ? <CuActivityIndicatorRolling /> : null}
                {!btn.loading && btn.icon ? (
                  <CuIcon name={btn.icon} svg={btn.iconSvg} size="md" />
                ) : null}
                {` ${btn.text ?? ''} `}
              </a>
            ))}
          </footer>
        </div>
      </CuPopup>
    </div>
  )

  // portal target 未就绪（SSR/首帧）或显式 null 时原地渲染
  if (portalTarget === undefined || portalTarget === null) {
    return dialogTree
  }
  return createPortal(dialogTree, portalTarget)
})

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CuPopup } from '../popup/Popup'

export interface KeyboardKeyProps {
  value?: string | number
  noTouch?: boolean
  noPrevent?: boolean
  className?: string
  onPress?: (value: string | number) => void
  /** a11y：无可见文本的按键（删除/收起）需提供可读标签 */
  ariaLabel?: string
}

export const CuNumberKey = memo(function CuNumberKey({
  value = '',
  noTouch = false,
  noPrevent = false,
  className,
  onPress,
  ariaLabel,
}: KeyboardKeyProps) {
  const [active, setActive] = useState(false)
  const activeTypeRef = useRef('')

  const onFocus = (event: React.SyntheticEvent, type: string) => {
    if (!noPrevent) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (activeTypeRef.current && activeTypeRef.current !== type) {
      return
    }
    activeTypeRef.current = type
    if (!noTouch) {
      setActive(true)
    }
    onPress?.(value)
  }

  if (noTouch) {
    return (
      <li
        className={[className, active ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={event => onFocus(event, 'click')}
        aria-label={ariaLabel}
      >
        <span>{value}</span>
      </li>
    )
  }
  return (
    <li
      className={[className, active ? 'active' : ''].filter(Boolean).join(' ')}
      onTouchStart={event => onFocus(event, 'touch')}
      onTouchMove={() => setActive(false)}
      onTouchEnd={() => setActive(false)}
      onTouchCancel={() => setActive(false)}
      onClick={event => onFocus(event, 'click')}
      aria-label={ariaLabel}
    >
      <span>{value}</span>
    </li>
  )
})

export interface KeyboardBoardProps {
  /** simple | professional */
  type?: string
  disorder?: boolean
  hideDot?: boolean
  okText?: string
  isView?: boolean
  textRender?: (val: string | number) => string | number | undefined
  disabled?: boolean
  duplicateZero?: boolean
  onEnter?: (value: string | number) => void
  onDelete?: () => void
  onConfirm?: () => void
  onHide?: () => void
}

export function CuKeyboardBoard({
  type = 'professional',
  disorder = false,
  hideDot = false,
  okText,
  isView = false,
  textRender,
  disabled = false,
  duplicateZero = false,
  onEnter,
  onDelete,
  onConfirm,
  onHide,
}: KeyboardBoardProps) {
  // v2 created 契约：键位在首帧渲染前生成
  const [keyNumberList] = useState<Array<string | number>>(() => {
    const baseStack = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    const baseStackTmp = [...baseStack]
    return baseStack.map(item => {
      const val = disorder
        ? baseStackTmp.splice(parseInt(`${Math.random() * baseStackTmp.length}`), 1)[0] ?? 0
        : item
      return textRender?.(val) || val
    })
  })

  // 稳定回调：配合 CuNumberKey 的 memo，避免任一状态变化引发全部键位重渲
  const handleEnter = useCallback(
    (val: string | number) => {
      if (!disabled) {
        onEnter?.(val)
      }
    },
    [disabled, onEnter],
  )
  const handleDelete = useCallback(() => {
    if (!disabled) {
      onDelete?.()
    }
  }, [disabled, onDelete])
  const handleConfirm = useCallback(() => {
    if (!disabled) {
      onConfirm?.()
    }
  }, [disabled, onConfirm])
  const handleHide = useCallback(() => {
    onHide?.()
  }, [onHide])

  const resolvedOkText = okText ?? '确定'
  const dotText = textRender?.('.') || '.'
  const duplicateZeroValue = textRender?.('00') || '00'
  const zeroValue = textRender?.('0') || '0'

  return (
    <div className={`cu-number-keyboard-container ${type}${disabled ? ' disabled' : ''}`}>
      <div className="keyboard-number">
        <ul className="keyboard-number-list">
          {Array.from({ length: 9 }, (_, i) => i).map(i => (
            <CuNumberKey
              key={i}
              className="keyboard-number-item"
              value={keyNumberList[i]}
              onPress={handleEnter}
              ariaLabel={String(keyNumberList[i])}
            />
          ))}
          {type === 'professional' ? (
            <>
              {!hideDot ? (
                <CuNumberKey
                  className="keyboard-number-item"
                  value={duplicateZero ? zeroValue : dotText}
                  onPress={handleEnter}
                  ariaLabel={duplicateZero ? String(zeroValue) : '小数点'}
                />
              ) : null}
              <CuNumberKey
                className={`keyboard-number-item${hideDot ? ' large-item' : ''}`}
                value={duplicateZero ? duplicateZeroValue : keyNumberList[9]}
                onPress={handleEnter}
                ariaLabel={String(duplicateZero ? duplicateZeroValue : keyNumberList[9])}
              />
              {duplicateZero ? (
                <CuNumberKey
                  className="keyboard-number-item"
                  value={dotText}
                  onPress={handleEnter}
                  ariaLabel="小数点"
                />
              ) : null}
              {!duplicateZero ? (
                isView ? (
                  <li className="keyboard-number-item"></li>
                ) : (
                  <CuNumberKey
                    className="keyboard-number-item slidedown"
                    noTouch
                    noPrevent
                    onPress={handleHide}
                    ariaLabel="收起键盘"
                  />
                )
              ) : null}
            </>
          ) : (
            <>
              <li className="keyboard-number-item no-bg"></li>
              <CuNumberKey
                className="keyboard-number-item"
                value={keyNumberList[9]}
                onPress={handleEnter}
                ariaLabel={String(keyNumberList[9])}
              />
              <CuNumberKey
                className="keyboard-number-item no-bg delete"
                onPress={handleDelete}
                ariaLabel="删除"
              />
            </>
          )}
        </ul>
      </div>
      {type === 'professional' ? (
        <div className="keyboard-operate">
          <ul className="keyboard-operate-list">
            <CuNumberKey
              className="keyboard-operate-item delete"
              onPress={handleDelete}
              ariaLabel="删除"
            />
            <CuNumberKey
              className="keyboard-operate-item confirm"
              value={resolvedOkText}
              noTouch
              noPrevent
              onPress={handleConfirm}
              ariaLabel={String(resolvedOkText)}
            />
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export interface NumberKeyboardProps {
  value?: boolean
  /** simple | professional */
  type?: string
  isView?: boolean
  hideDot?: boolean
  disorder?: boolean
  isHideConfirm?: boolean
  disabled?: boolean
  okText?: string
  textRender?: (val: string | number) => string | number | undefined
  duplicateZero?: boolean
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
  onChange?: (value: boolean) => void
  onEnter?: (value: string | number) => void
  onDelete?: () => void
  onConfirm?: () => void
  onShow?: () => void
  onHide?: () => void
}

export interface NumberKeyboardExposed {
  show: () => void
  hide: () => void
  $el?: HTMLElement
}

export const CuNumberKeyboard = forwardRef<NumberKeyboardExposed, NumberKeyboardProps>(
  function CuNumberKeyboard(
    {
      value = false,
      type,
      isView = false,
      hideDot = false,
      disorder = false,
      isHideConfirm = true,
      disabled = false,
      okText,
      textRender,
      duplicateZero = false,
      className,
      style,
      children,
      onChange,
      onEnter,
      onDelete,
      onConfirm,
      onShow,
      onHide,
    }: NumberKeyboardProps,
    ref,
  ) {
    // 初始态即持 value（挂载 value=true 时立即可见，v2 watch immediate 契约）
    const [isKeyboardShow, setIsKeyboardShow] = useState(value)
    const rootRef = useRef<HTMLDivElement>(null)
    const boardWrapperRef = useRef<HTMLDivElement>(null)

    // v2 契约（S3 修复）：受控 value 双向同步，外部置 false 也能关闭
    const prevValueRef = useRef(value)
    useEffect(() => {
      if (prevValueRef.current !== value) {
        prevValueRef.current = value
        setIsKeyboardShow(value)
      }
    }, [value])

    useEffect(() => {
      onChange?.(isKeyboardShow)
    }, [isKeyboardShow])

    // React 17+ 触摸事件为 passive：键盘面板的滚动阻断需原生非 passive 监听（S2）
    useEffect(() => {
      const el = boardWrapperRef.current
      if (!el) {
        return
      }
      const prevent = (event: Event) => event.preventDefault()
      el.addEventListener('touchmove', prevent, { passive: false })
      return () => {
        el.removeEventListener('touchmove', prevent)
      }
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        show: () => setIsKeyboardShow(true),
        hide: () => setIsKeyboardShow(false),
        get $el() {
          return rootRef.current ?? undefined
        },
      }),
      [],
    )

    const board = (isView: boolean) => (
      <CuKeyboardBoard
        type={type}
        disorder={disorder}
        okText={okText}
        isView={isView}
        hideDot={hideDot}
        textRender={textRender}
        disabled={disabled}
        duplicateZero={duplicateZero}
        onEnter={onEnter}
        onDelete={onDelete}
        onConfirm={() => {
          onConfirm?.()
          if (isHideConfirm) {
            setIsKeyboardShow(false)
          }
        }}
        onHide={() => setIsKeyboardShow(false)}
      />
    )

    if (isView) {
      return (
        <div ref={rootRef} className={`cu-number-keyboard in-view${className ? ` ${className}` : ''}`} style={style}>
          {children}
          {board(true)}
        </div>
      )
    }

    return (
      <div ref={rootRef} className={`cu-number-keyboard${className ? ` ${className}` : ''}`} style={style}>
        <CuPopup
          value={isKeyboardShow}
          position="bottom"
          hasMask={false}
          onChange={setIsKeyboardShow}
          onShow={onShow}
          onHide={onHide}
        >
          {children}
          <div ref={boardWrapperRef}>{board(false)}</div>
        </CuPopup>
      </div>
    )
  },
)

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MdPopup } from '../popup/Popup'

export interface KeyboardKeyProps {
  value?: string | number
  noTouch?: boolean
  noPrevent?: boolean
  className?: string
  onPress?: (value: string | number) => void
}

export function MdNumberKey({
  value = '',
  noTouch = false,
  noPrevent = false,
  className,
  onPress,
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
    >
      <span>{value}</span>
    </li>
  )
}

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

export function MdKeyboardBoard({
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

  const resolvedOkText = okText ?? '确定'
  const dotText = textRender?.('.') || '.'
  const duplicateZeroValue = textRender?.('00') || '00'
  const zeroValue = textRender?.('0') || '0'

  return (
    <div className={`md-number-keyboard-container ${type}${disabled ? ' disabled' : ''}`}>
      <div className="keyboard-number">
        <ul className="keyboard-number-list">
          {Array.from({ length: 9 }, (_, i) => i).map(i => (
            <MdNumberKey
              key={i}
              className="keyboard-number-item"
              value={keyNumberList[i]}
              onPress={val => !disabled && onEnter?.(val)}
            />
          ))}
          {type === 'professional' ? (
            <>
              {!hideDot ? (
                <MdNumberKey
                  className="keyboard-number-item"
                  value={duplicateZero ? zeroValue : dotText}
                  onPress={val => !disabled && onEnter?.(val)}
                />
              ) : null}
              <MdNumberKey
                className={`keyboard-number-item${hideDot ? ' large-item' : ''}`}
                value={duplicateZero ? duplicateZeroValue : keyNumberList[9]}
                onPress={val => !disabled && onEnter?.(val)}
              />
              {duplicateZero ? (
                <MdNumberKey
                  className="keyboard-number-item"
                  value={dotText}
                  onPress={val => !disabled && onEnter?.(val)}
                />
              ) : null}
              {!duplicateZero ? (
                isView ? (
                  <li className="keyboard-number-item"></li>
                ) : (
                  <MdNumberKey
                    className="keyboard-number-item slidedown"
                    noTouch
                    noPrevent
                    onPress={() => onHide?.()}
                  />
                )
              ) : null}
            </>
          ) : (
            <>
              <li className="keyboard-number-item no-bg"></li>
              <MdNumberKey
                className="keyboard-number-item"
                value={keyNumberList[9]}
                onPress={val => !disabled && onEnter?.(val)}
              />
              <MdNumberKey
                className="keyboard-number-item no-bg delete"
                onPress={() => !disabled && onDelete?.()}
              />
            </>
          )}
        </ul>
      </div>
      {type === 'professional' ? (
        <div className="keyboard-operate">
          <ul className="keyboard-operate-list">
            <MdNumberKey
              className="keyboard-operate-item delete"
              onPress={() => !disabled && onDelete?.()}
            />
            <MdNumberKey
              className="keyboard-operate-item confirm"
              value={resolvedOkText}
              noTouch
              noPrevent
              onPress={() => !disabled && onConfirm?.()}
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

export const MdNumberKeyboard = forwardRef<NumberKeyboardExposed, NumberKeyboardProps>(
  function MdNumberKeyboard(
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
    const [isKeyboardShow, setIsKeyboardShow] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (value) {
        setIsKeyboardShow(value)
      }
    }, [value])

    useEffect(() => {
      onChange?.(isKeyboardShow)
    }, [isKeyboardShow])

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
      <MdKeyboardBoard
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
        <div ref={rootRef} className={`md-number-keyboard in-view${className ? ` ${className}` : ''}`} style={style}>
          {children}
          {board(true)}
        </div>
      )
    }

    return (
      <div ref={rootRef} className={`md-number-keyboard${className ? ` ${className}` : ''}`} style={style}>
        <MdPopup
          value={isKeyboardShow}
          position="bottom"
          hasMask={false}
          onChange={setIsKeyboardShow}
          onShow={onShow}
          onHide={onHide}
        >
          {children}
          <div onTouchMove={event => event.preventDefault()}>{board(false)}</div>
        </MdPopup>
      </div>
    )
  },
)

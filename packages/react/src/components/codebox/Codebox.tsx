import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CuNumberKeyboard, type NumberKeyboardExposed } from '../number-keyboard/NumberKeyboard'

export interface CodeboxProps {
  value?: string
  maxlength?: number | string
  autofocus?: boolean
  disabled?: boolean
  justify?: boolean
  mask?: boolean
  closable?: boolean
  /** 使用系统键盘 */
  system?: boolean
  okText?: string
  disorder?: boolean
  isView?: boolean
  inputType?: string
  isErrorStyle?: boolean
  children?: ReactNode
  onChange?: (value: string) => void
  onSubmit?: (code: string) => void
  onFocus?: () => void
  onBlur?: () => void
}

export interface CodeboxExposed {
  focus: () => void
  blur: () => void
}

export const CuCodebox = forwardRef<CodeboxExposed, CodeboxProps>(function CuCodebox(
  {
    value = '',
    maxlength = 4,
    autofocus = false,
    disabled = false,
    justify = false,
    mask = false,
    closable = true,
    system = false,
    okText,
    disorder = false,
    isView = false,
    inputType = 'tel',
    isErrorStyle = false,
    children,
    onChange,
    onSubmit,
    onFocus,
    onBlur,
  }: CodeboxProps,
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<NumberKeyboardExposed | null>(null)

  // v2 watch immediate 契约：初始渲染即持 value
  const [code, setCode] = useState(value)
  const [focused, setFocused] = useState(autofocus)
  const codeRef = useRef(code)
  codeRef.current = code
  const focusedRef = useRef(focused)
  focusedRef.current = focused

  const maxLengthNum = Number(maxlength)
  const num = Math.abs(parseInt(String(maxlength), 10)) || 1

  // 外部 value 同步（v2 watch 契约）：仅当外部 value 变化时覆盖内部状态
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      if (value !== codeRef.current) {
        codeRef.current = value
        setCode(value)
        if (inputRef.current) {
          inputRef.current.value = value
        }
      }
    }
  }, [value])

  useEffect(() => {
    if (closable) {
      const handler = (e: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          setFocused(false)
        }
      }
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [closable])

  // 非系统键盘挂载到 body（v2 契约）
  useEffect(() => {
    const keyboard = keyboardRef.current
    if (!system && !isView && keyboard?.$el) {
      document.body.appendChild(keyboard.$el)
      return () => {
        keyboard.$el?.parentNode?.removeChild(keyboard.$el)
      }
    }
  }, [system, isView])

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (disabled) {
        return
      }
      setFocused(true)
      if (system) {
        inputRef.current?.focus()
      }
    },
    blur: () => {
      setFocused(false)
      if (system) {
        inputRef.current?.blur()
      }
    },
  }))

  const emitChange = (next: string) => {
    codeRef.current = next
    setCode(next)
    onChange?.(next)
  }

  const onKeyboardEnter = (val: string | number) => {
    const current = codeRef.current
    if ((maxLengthNum < 0 || current.length < maxLengthNum) && val !== '.') {
      const next = current + val
      if (next.length === maxLengthNum) {
        setTimeout(() => onSubmit?.(next), 0)
      }
      emitChange(next)
    }
  }

  const onKeyboardDelete = () => {
    emitChange(codeRef.current.slice(0, codeRef.current.length - 1))
  }

  const onKeyboardConfirm = () => {
    onSubmit?.(codeRef.current)
  }

  const onNativeInput = (event: React.FormEvent<HTMLInputElement>) => {
    const inputValue = (event.target as HTMLInputElement).value
    if (maxLengthNum < 0 || inputValue.length <= maxLengthNum) {
      if (inputValue.length === maxLengthNum) {
        onSubmit?.(inputValue)
      }
      emitChange(inputValue)
    }
  }

  const boxes = []
  for (let i = 1; i <= num; i++) {
    const isActive = i === code.length + 1 && focused
    const isFilled = code.charAt(i - 1) !== ''
    boxes.push(
      <span
        key={i}
        className={[
          'cu-codebox-box',
          isActive ? 'is-active' : '',
          isFilled ? 'is-filled' : '',
          isErrorStyle ? 'is-error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {code.charAt(i - 1) ? (
          mask ? <i className="cu-codebox-dot" /> : code.charAt(i - 1)
        ) : null}
        {i === code.length + 1 && focused ? <i className="cu-codebox-blink" /> : null}
      </span>,
    )
  }

  return (
    <div ref={rootRef} className="cu-codebox-wrapper">
      <div
        className={`cu-codebox${disabled ? ' is-disabled' : ''}${justify ? ' is-justify' : ''}`}
        onClick={() => {
          if (!disabled) {
            setFocused(true)
            if (system) {
              inputRef.current?.focus()
              onFocus?.()
            }
          }
        }}
      >
        {maxLengthNum > 0 ? (
          boxes
        ) : (
          <input
            type={mask ? 'password' : inputType}
            maxLength={maxLengthNum}
            value={code}
            readOnly
            disabled
            className={`cu-codebox-holder${focused ? ' is-active' : ''}`}
          />
        )}
      </div>
      {children}
      <form
        action=""
        style={{ display: system ? undefined : 'none' }}
        onSubmit={event => {
          event.preventDefault()
          onSubmit?.(codeRef.current)
        }}
      >
        <input
          ref={inputRef}
          defaultValue={code}
          type={inputType}
          maxLength={maxLengthNum}
          className="cu-codebox-input"
          onInput={onNativeInput}
          onChange={onNativeInput as never}
          onFocus={() => onFocus?.()}
          onBlur={() => {
            setFocused(false)
            onBlur?.()
          }}
        />
      </form>
      <CuNumberKeyboard
        ref={keyboardRef}
        style={{ display: !system ? undefined : 'none' }}
        className="cu-codebox-keyboard"
        type={maxLengthNum > 0 ? 'simple' : 'professional'}
        okText={okText}
        disorder={disorder}
        isView={isView}
        value={focused}
        onChange={setFocused}
        onDelete={onKeyboardDelete}
        onEnter={onKeyboardEnter}
        onConfirm={onKeyboardConfirm}
      />
    </div>
  )
})

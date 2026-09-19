import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { MdFieldItem } from '../field-item/FieldItem'
import { MdIcon } from '../icon/Icon'
import { getCursorsPosition, setCursorsPosition } from '../input-item/cursor'

export interface TextareaItemProps {
  title?: string
  name?: string | number
  placeholder?: string
  value?: string
  maxLength?: string | number
  maxHeight?: string | number
  solid?: boolean
  readonly?: boolean
  disabled?: boolean
  clearable?: boolean
  rows?: string | number
  autosize?: boolean
  error?: string
  formation?: (
    name: string | number,
    value: string,
    pos: number,
  ) => { value: string; range: number } | undefined
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onKeyup?: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void
  onKeydown?: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void
}

export interface TextareaItemExposed {
  resizeTextarea: () => void
  focus: () => void
  blur: () => void
  getValue: () => string
}

export const MdTextareaItem = forwardRef<TextareaItemExposed, TextareaItemProps>(function MdTextareaItem(
  {
    title = '',
    name = `textarea-item-${Math.floor(Math.random() * 10000)}`,
    placeholder = '',
    value = '',
    maxLength = '',
    maxHeight = '',
    solid = true,
    readonly = false,
    disabled = false,
    clearable = false,
    rows = '3',
    autosize = false,
    error = '',
    formation,
    onChange,
    onFocus,
    onBlur,
    onKeyup,
    onKeydown,
  },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState(value)
  const [isInputFocus, setIsInputFocus] = useState(false)
  const maxHeightRef = useRef(maxHeight)

  const isInputEmpty = !inputValue.length
  const errorInfo = error

  // v2 watch value：外部值同步 + 重新计算高度
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value)
      setTimeout(() => resizeTextareaRef.current(), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    resizeTextareaRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resizeTextareaRef = useRef<() => void>(() => {})

  useImperativeHandle(ref, () => ({
    resizeTextarea: () => resizeTextareaRef.current(),
    focus: () => {
      textareaRef.current?.focus()
      setTimeout(() => setIsInputFocus(true), 200)
    },
    blur: () => {
      textareaRef.current?.blur()
      setIsInputFocus(false)
    },
    getValue: () => inputValue,
  }))

  function formatValue(curValue: string, curPos = 0) {
    const customValue = formation?.(name, curValue, curPos)
    if (customValue) {
      return customValue
    }
    return { value: curValue, range: curPos }
  }

  function onInput(event: ReactFocusEvent<HTMLTextAreaElement> & { target: HTMLTextAreaElement }) {
    const target = event.target
    const formated = formatValue(target.value, getCursorsPosition(target))
    setInputValue(formated.value)
    setTimeout(() => {
      setCursorsPosition(target, formated.range)
      resizeTextareaRef.current()
    }, 0)
  }

  function calcTextareaHeight(el: HTMLTextAreaElement) {
    // 触发重绘
    el.style.height = 'auto'
    let scrollHeight = el.scrollHeight
    if (scrollHeight === 0) {
      return
    }
    const max = Number(maxHeightRef.current)
    if (maxHeightRef.current && scrollHeight > max) {
      scrollHeight = max
    }
    el.style.height = `${scrollHeight}px`
  }

  resizeTextareaRef.current = () => {
    if (autosize) {
      calcTextareaHeight(textareaRef.current!)
    }
  }

  return (
    <MdFieldItem
      className={`md-textarea-item${disabled ? ' is-disabled' : ''}${errorInfo ? ' is-error' : ''}`}
      title={title}
      solid={solid}
      // v2.7.0 契约：clear 不参与渲染时右插槽整体不出现
      right={
        clearable && !disabled && !readonly ? (
          <div
            className="md-textarea-item__clear"
            style={{ display: !isInputEmpty && isInputFocus ? '' : 'none' }}
            onClick={() => {
              setInputValue('')
              onChange?.('')
              setTimeout(() => resizeTextareaRef.current(), 0)
              textareaRef.current?.focus()
              setTimeout(() => setIsInputFocus(true), 200)
            }}
          >
            <MdIcon name="clear"></MdIcon>
          </div>
        ) : undefined
      }
      childrenSlot={
        errorInfo ? (
          <div className="md-textarea-item-msg">
            <p>{errorInfo}</p>
          </div>
        ) : undefined
      }
    >
      <textarea
        ref={textareaRef}
        className="md-textarea-item__textarea"
        disabled={disabled}
        readOnly={readonly}
        {...({ maxlength: maxLength === '' ? '' : Number(maxLength) } as object)}
        placeholder={placeholder}
        rows={typeof rows === 'string' ? Number(rows) : rows}
        value={inputValue}
        onChange={(event) => {
          onInput(event as unknown as ReactFocusEvent<HTMLTextAreaElement> & { target: HTMLTextAreaElement })
          onChange?.(event.target.value)
        }}
        onFocus={() => {
          setIsInputFocus(true)
          onFocus?.()
        }}
        onBlur={() => {
          setTimeout(() => {
            setIsInputFocus(false)
            onBlur?.()
          }, 100)
        }}
        onKeyUp={(e) => onKeyup?.(e)}
        onKeyDown={(e) => onKeydown?.(e)}
      ></textarea>
    </MdFieldItem>
  )
})

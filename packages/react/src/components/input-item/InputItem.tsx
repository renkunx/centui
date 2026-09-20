import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CuFieldItem } from '../field-item/FieldItem'
import { CuIcon } from '../icon/Icon'
import { CuNumberKeyboard } from '../number-keyboard/NumberKeyboard'
import {
  formatValueByGapRule,
  formatValueByGapStep,
  trimValue,
  type FormattedValue,
} from '@centui/core'

/** 输入光标位置读写（自 v2 cursor.js 迁移） */
export function getCursorsPosition(ctrl: HTMLInputElement | null): number {
  if (!ctrl) {
    return 0
  }
  if (ctrl.selectionStart || ctrl.selectionStart === 0) {
    return ctrl.selectionStart
  }
  return 0
}

export function setCursorsPosition(ctrl: HTMLInputElement | null, pos: number): void {
  if (!ctrl) {
    return
  }
  setTimeout(() => {
    if (ctrl.setSelectionRange) {
      ctrl.focus()
      ctrl.setSelectionRange(pos, pos)
    }
  }, 0)
}

export interface InputItemProps {
  className?: string
  /** text | bankCard | password | phone | money | digit */
  type?: string
  previewType?: string
  name?: string
  title?: string
  brief?: string
  value?: string | number
  placeholder?: string
  maxlength?: string | number
  /** large | normal */
  size?: string
  /** left | center | right */
  align?: string
  error?: string
  readonly?: boolean
  disabled?: boolean
  solid?: boolean
  clearable?: boolean
  isVirtualKeyboard?: boolean
  virtualKeyboardDisorder?: boolean
  virtualKeyboardOkText?: string
  virtualKeyboardVm?: { show: () => void; hide: () => void; $el?: HTMLElement } | null
  isTitleLatent?: boolean
  isFormative?: boolean
  isHighlight?: boolean
  isAmount?: boolean
  formation?: (name: string, curValue: string, curPos: number) => FormattedValue | undefined
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  errorSlot?: ReactNode
  briefSlot?: ReactNode
  onChange?: (value: string, name?: string) => void
  onFocus?: (name?: string) => void
  onBlur?: (name?: string) => void
  onConfirm?: (name?: string, value?: string) => void
  onKeydown?: (name?: string, event?: React.KeyboardEvent<HTMLInputElement>) => void
  onKeyup?: (name?: string, event?: React.KeyboardEvent<HTMLInputElement>) => void
}

export interface InputItemExposed {
  focus: () => void
  blur: () => void
  getValue: () => string
}

export const CuInputItem = forwardRef<InputItemExposed, InputItemProps>(function CuInputItem(
  {
    className,
    type = 'text',
    previewType = '',
    name = 'input-item',
    title = '',
    brief = '',
    value = '',
    placeholder = '',
    maxlength = '',
    size = 'normal',
    align = 'left',
    error = '',
    readonly = false,
    disabled = false,
    solid = true,
    clearable = false,
    isVirtualKeyboard = false,
    virtualKeyboardDisorder = false,
    virtualKeyboardOkText,
    virtualKeyboardVm = null,
    isTitleLatent = false,
    isFormative = false,
    isHighlight = false,
    isAmount = false,
    formation,
    leftSlot,
    rightSlot,
    errorSlot,
    briefSlot,
    onChange,
    onFocus,
    onBlur,
    onConfirm,
    onKeydown,
    onKeyup,
  }: InputItemProps,
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<{ show: () => void; hide: () => void; $el?: HTMLElement } | null>(null)

  const [isInputFocus, setIsInputFocus] = useState(false)
  const [isPreview, setIsPreview] = useState(!!previewType)
  const isEditingRef = useRef(false)
  const stopEditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keyboardInstanceRef = useRef<{ show: () => void; hide: () => void } | null>(null)
  const inputValueRef = useRef('')

  const inputItemType = (isPreview ? previewType : type) || 'text'
  const inputType = (() => {
    let t = inputItemType || 'text'
    if (t === 'bankCard' || t === 'phone' || t === 'digit') {
      t = 'tel'
    } else if (t === 'money') {
      t = 'text'
    }
    return t
  })()
  const inputMaxLength = inputItemType === 'phone' ? 11 : maxlength
  const isInputFormative =
    isFormative ||
    inputItemType === 'bankCard' ||
    inputItemType === 'phone' ||
    inputItemType === 'money' ||
    inputItemType === 'digit'

  const subValue = (val: string): string => {
    const len = inputMaxLength
    if (len !== '' && len !== undefined) {
      return val.substring(0, Number(len))
    }
    return val
  }

  // v2 created 契约：初始渲染即持格式化后的 value（is-active 等派生态随此值）
  // 首帧同步格式化（与 formateValue 同规则；oldValue 为空）
  const initialFormatted = (() => {
    const curValue = subValue(`${value}`)
    if (!isInputFormative || curValue === '' || formation) {
      const custom = formation?.(name, curValue, 0)
      return custom ? custom.value : curValue
    }
    let gap = ' '
    switch (inputItemType) {
      case 'bankCard': {
        const cur = subValue(trimValue(curValue.replace(/\D/g, '')))
        return formatValueByGapStep(4, cur, gap, 'left', 0, 1, '').value
      }
      case 'phone': {
        const cur = subValue(trimValue(curValue.replace(/\D/g, '')))
        return formatValueByGapRule('3|4|4', cur, gap, 0, 1).value
      }
      case 'money': {
        gap = ','
        const moneyCur = subValue(trimValue(curValue.replace(/[^\d.]/g, '')))
        const dotPos = moneyCur.indexOf('.')
        const moneyCurDecimal = ~dotPos ? `.${moneyCur.split('.')[1]}` : ''
        return (
          formatValueByGapStep(
            3,
            trimValue(moneyCur.split('.')[0], gap),
            gap,
            'right',
            0,
            1,
            '',
          ).value + moneyCurDecimal
        )
      }
      case 'digit':
        return subValue(trimValue(curValue.replace(/\D/g, '')))
      default:
        return curValue
    }
  })()

  const [inputValue, setInputValue] = useState(initialFormatted)
  const [inputBindValue, setInputBindValue] = useState(initialFormatted)
  inputValueRef.current = initialFormatted
  const formateValue = useCallback(
    (curValue: string, curPos = 0): FormattedValue => {
      const oldValue = inputValueRef.current
      const isAdd = oldValue.length > curValue.length ? -1 : 1
      let formatted: FormattedValue = { value: curValue, range: curPos }

      if (!isInputFormative || curValue === '') {
        return formatted
      }

      const custom = formation?.(name, curValue, curPos)
      if (custom) {
        return custom
      }

      let gap = ' '
      switch (inputItemType) {
        case 'bankCard': {
          curValue = subValue(trimValue(curValue.replace(/\D/g, '')))
          formatted = formatValueByGapStep(4, curValue, gap, 'left', curPos, isAdd, oldValue)
          break
        }
        case 'phone': {
          curValue = subValue(trimValue(curValue.replace(/\D/g, '')))
          formatted = formatValueByGapRule('3|4|4', curValue, gap, curPos, isAdd)
          break
        }
        case 'money': {
          gap = ','
          curValue = subValue(trimValue(curValue.replace(/[^\d.]/g, '')))
          const dotPos = curValue.indexOf('.')
          const moneyCurValue = curValue.split('.')[0]
          const moneyCurDecimal = ~dotPos ? `.${curValue.split('.')[1]}` : ''
          formatted = formatValueByGapStep(
            3,
            trimValue(moneyCurValue, gap),
            gap,
            'right',
            curPos,
            isAdd,
            oldValue.split('.')[0],
          )
          formatted.value += moneyCurDecimal
          break
        }
        case 'digit': {
          curValue = subValue(trimValue(curValue.replace(/\D/g, '')))
          formatted.value = curValue
          break
        }
      }
      return formatted
    },
    [isInputFormative, inputItemType, inputMaxLength, formation, name],
  )

  // （初始化合并进 useState 初始化器，见下）
  // 初始化 + 外部 value 变化（去抖双向绑定回环）
  useEffect(() => {
    const formatted = formateValue(subValue(`${value}`)).value
    inputValueRef.current = formatted
    setInputValue(formatted)
    setInputBindValue(formatted)
  }, [value])


  useEffect(() => {
    if (value !== trimValue(inputValue, '\\s|,')) {
      const formatted = formateValueRef.current(subValue(`${value}`)).value
      setInputValue(formatted)
      setInputBindValue(formatted)
    }
  }, [value])

  // inputValue → 派发 change（与 v2 watcher 等价）
  useEffect(() => {
    setInputBindValue(inputValue)
    const emitted = isInputFormative ? trimValue(inputValue, '\\s|,') : inputValue
    if (emitted !== value) {
      onChange?.(emitted, name)
    }
  }, [inputValue])

  // 虚拟键盘显隐联动
  useEffect(() => {
    const keyboard =
      virtualKeyboardVm && typeof virtualKeyboardVm === 'object'
        ? virtualKeyboardVm
        : keyboardRef.current
    keyboardInstanceRef.current = keyboard
    if (!isVirtualKeyboard || !keyboard) {
      return
    }
    if (isInputFocus) {
      keyboard.show?.()
      onFocus?.(name)
    } else {
      keyboard.hide?.()
      onBlur?.(name)
    }
  }, [isInputFocus])

  useEffect(() => {
    setIsPreview(!!previewType)
  }, [previewType])

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        if (isVirtualKeyboard) {
          onFakeInputClick()
        } else {
          inputRef.current?.focus()
          setTimeout(() => setIsInputFocus(true), 200)
        }
      },
      blur: () => {
        if (isVirtualKeyboard) {
          blurFakeInput()
        } else {
          inputRef.current?.blur()
        }
      },
      getValue: () => inputValue,
    }),
    [inputValue, isVirtualKeyboard],
  )

  const startEditInput = () => {
    isEditingRef.current = true
    if (stopEditTimerRef.current) {
      clearTimeout(stopEditTimerRef.current)
    }
    stopEditTimerRef.current = setTimeout(() => {
      isEditingRef.current = false
    }, 500)
  }

  const blurFakeInput = () => {
    setIsInputFocus(false)
    document.removeEventListener('click', blurFakeInput)
  }

  const focusFakeInput = () => {
    setIsInputFocus(true)
    setTimeout(() => {
      document.addEventListener('click', blurFakeInput)
    }, 0)
  }

  const onFakeInputClick = () => {
    if (disabled || readonly) {
      return
    }
    blurFakeInput()
    if (!isInputFocus) {
      focusFakeInput()
    }
  }

  const stopPreview = () => {
    setInputValue('')
    if (!isTitleLatent) {
      setTimeout(() => setIsInputFocus(true), 200)
    }
    setIsPreview(false)
  }

  const onNativeInput = (event: React.FormEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    const formatted = formateValue(target.value, isInputFormative ? getCursorsPosition(target) : 0)
    setInputValue(formatted.value)
    setInputBindValue(formatted.value)
    if (isInputFormative) {
      setTimeout(() => setCursorsPosition(target, formatted.range as number), 0)
    }
  }

  const handleKeyup = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyup?.(name, event)
    if (+event.keyCode === 13 || +event.keyCode === 108) {
      onConfirm?.(name, inputValue)
    }
  }

  const handleKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeydown?.(name, event)
    if (!(+event.keyCode === 13 || +event.keyCode === 108)) {
      startEditInput()
      if (isPreview) {
        stopPreview()
      }
    }
  }

  // 内置虚拟键盘事件
  const onKeyboardEnter = (val: string | number) => {
    if (isPreview) {
      stopPreview()
    }
    if (
      Number(inputMaxLength) > 0 &&
      trimValue(inputValue, '\\s|,').length >= Number(inputMaxLength)
    ) {
      return
    }
    setInputValue(formateValueRef.current(inputValue + val).value)
    startEditInput()
  }

  const onKeyboardDelete = () => {
    if (inputValue === '') {
      return
    }
    setInputValue(formateValueRef.current(inputValue.substring(0, inputValue.length - 1)).value)
    startEditInput()
    if (isPreview) {
      stopPreview()
    }
  }

  const onKeyboardConfirm = () => {
    onConfirm?.(name, inputValue)
  }

  const formateValueRef = useRef(formateValue)
  formateValueRef.current = formateValue
  // keep ref mirror of inputValue for formatter（isAdd/money 分支依赖旧值）
  inputValueRef.current = inputValue

  const isInputEmpty = !inputValue.length
  // v2 契约：latent 以激活态（有值或聚焦）判断，而非仅聚焦
  const isInputActive = !isInputEmpty || isInputFocus
  const inputPlaceholder = isTitleLatent && isInputActive ? '' : placeholder
  const hasError = !!errorSlot || error !== ''
  const hasBrief = !!briefSlot || brief !== ''

  const classes = [
    'cu-input-item',
    className,
    isHighlight ? 'is-highlight' : '',
    isTitleLatent ? 'is-title-latent' : '',
    isInputActive ? 'is-active' : '',
    isInputFocus ? 'is-focus' : '',
    hasError ? 'is-error' : '',
    hasBrief && !hasError ? 'with-brief' : '',
    disabled ? 'is-disabled' : '',
    isAmount ? 'is-amount' : '',
    clearable ? 'is-clear' : '',
    align,
    size,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <CuFieldItem
        className={classes}
        title={title}
        solid={solid && !isTitleLatent}
        left={leftSlot}
        childrenSlot={
          hasError ? (
            <div className="cu-input-item-msg">
              <p>{error}</p>
              {errorSlot}
            </div>
          ) : hasBrief ? (
            <div className="cu-input-item-brief">
              <p>{brief}</p>
              {briefSlot}
            </div>
          ) : null
        }
        right={
          (clearable && !disabled && !readonly) || rightSlot ? (
            <>
              {clearable && !disabled && !readonly ? (
                <div
                  className="cu-input-item-clear"
                  style={{ display: !isInputEmpty && isInputFocus ? undefined : 'none' }}
                  onClick={() => {
                    setInputValue('')
                    if (!isTitleLatent) {
                      setTimeout(() => setIsInputFocus(true), 200)
                    }
                    setIsPreview(false)
                  }}
                >
                  <CuIcon name="clear" />
                </div>
              ) : null}
              {rightSlot}
            </>
          ) : undefined
        }
      >
        {!isVirtualKeyboard ? (
          <input
            ref={node => {
              inputRef.current = node
              // v2 golden 契约：maxlength 始终落 attr（格式化模式为空串）；React 对空串不渲染
              node?.setAttribute('maxlength', isInputFormative ? '' : String(inputMaxLength))
            }}
            className="cu-input-item-input"
            type={inputType}
            name={name}
            value={inputBindValue}
            placeholder={inputPlaceholder}
            disabled={disabled}
            readOnly={readonly}
            autoComplete="off"
            onFocus={() => {
              setIsInputFocus(true)
              onFocus?.(name)
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsInputFocus(false)
                onBlur?.(name)
              }, 100)
            }}
            onKeyUp={handleKeyup}
            onKeyDown={handleKeydown}
            onInput={onNativeInput}
          />
        ) : (
          <div
            className={`cu-input-item-fake${isInputFocus ? ' is-focus' : ''}${
              !isEditingRef.current ? ' is-waiting' : ''
            }${disabled ? ' disabled' : ''}${readonly ? ' readonly' : ''}`}
            onClick={onFakeInputClick}
          >
            <span>{inputValue}</span>
            {inputValue === '' && inputPlaceholder !== '' ? (
              <span className="cu-input-item-fake-placeholder">{inputPlaceholder}</span>
            ) : null}
          </div>
        )}
      </CuFieldItem>
      {isVirtualKeyboard && !virtualKeyboardVm ? (
        <CuNumberKeyboard
          ref={keyboardRef}
          okText={virtualKeyboardOkText}
          disorder={virtualKeyboardDisorder}
          onEnter={onKeyboardEnter}
          onDelete={onKeyboardDelete}
          onConfirm={onKeyboardConfirm}
        />
      ) : null}
    </>
  )
})

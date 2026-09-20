import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
import { CuPopup } from '../popup/Popup'
import { CuPopupTitleBar } from '../popup/PopupTitleBar'
import { CuScrollView, type ScrollViewExposed } from '../scroll-view/ScrollView'
import { CuRadioList, type RadioListExposed, type RadioListOption } from '../radio-list/RadioList'
import { CuCheckList, type CheckListOption } from '../check/CheckList'

export interface SelectorItem extends RadioListOption {
  text?: string
}

export interface SelectorProps {
  value?: boolean
  data?: SelectorItem[]
  defaultValue?: string | number | boolean | Array<string | number>
  isCheck?: boolean
  maxHeight?: string | number
  minHeight?: string | number
  title?: string
  describe?: string
  okText?: string
  cancelText?: string
  maskClosable?: boolean
  hideTitleBar?: boolean
  multi?: boolean
  icon?: string
  iconInverse?: string
  iconDisabled?: string
  iconSvg?: boolean
  iconSize?: string
  iconPosition?: string
  largeRadius?: boolean
  /** 自定义选项内容 */
  children?: (slotProps: { option: RadioListOption; index: number; selected: boolean }) => ReactNode
  header?: ReactNode
  footer?: ReactNode
  /** 显示状态变化（对齐 v2 input 事件） */
  onChange?: (value: boolean) => void
  onChoose?: (item: SelectorItem) => void
  onConfirm?: (item: SelectorItem | Array<string | number>) => void
  onCancel?: () => void
  onShow?: () => void
  onHide?: () => void
}

const CANCEL_TEXT = '取消'

export const CuSelector = forwardRef<HTMLDivElement, SelectorProps>(function CuSelector(
  {
    value = false,
    data = [],
    defaultValue = '',
    isCheck = false,
    maxHeight = 'auto',
    minHeight = 'auto',
    title = '',
    describe = '',
    okText = '',
    cancelText,
    maskClosable = true,
    hideTitleBar = false,
    multi = false,
    icon = 'checked',
    iconInverse = 'check',
    iconDisabled = 'check-disabled',
    iconSvg = false,
    iconSize = 'md',
    iconPosition = 'right',
    largeRadius = false,
    children,
    header,
    footer,
    onChange,
    onChoose,
    onConfirm,
    onCancel,
    onShow,
    onHide,
  },
  ref,
) {
  const scrollRef = useRef<ScrollViewExposed | null>(null)
  const radioRef = useRef<RadioListExposed | null>(null)

  const [isSelectorShow, setIsSelectorShow] = useState(value)
  const [radioKey, setRadioKey] = useState(() => Date.now())
  const [checkKey, setCheckKey] = useState(() => Date.now() + 1)
  const activeIndexRef = useRef(-1)
  const tmpActiveIndexRef = useRef(-1)
  const [multiDefaultValue, setMultiDefaultValue] = useState<Array<string | number>>([])

  const isNeedConfirm = okText !== ''
  const hasSlot = !!children
  const actualCancelText = cancelText ?? (okText ? CANCEL_TEXT : '')

  // v2 watch value
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      setIsSelectorShow(value)
    }
  }, [value])

  // v2 watch defaultValue immediate（multi 模式）
  const prevDefaultRef = useRef(defaultValue)
  useEffect(() => {
    if (prevDefaultRef.current !== defaultValue) {
      prevDefaultRef.current = defaultValue
    }
    if (!multi || defaultValue === '') {
      return
    }
    setMultiDefaultValue(!Array.isArray(defaultValue) ? [defaultValue as string | number] : defaultValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue])

  // v2 watch isSelectorShow → emit input
  const prevShowRef = useRef(isSelectorShow)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    if (prevShowRef.current !== isSelectorShow) {
      prevShowRef.current = isSelectorShow
      onChangeRef.current?.(isSelectorShow)
    }
  }, [isSelectorShow])

  function onSelectorConfirm() {
    if (multi) {
      onConfirm?.(multiDefaultValue.slice())
      setIsSelectorShow(false)
      return
    }

    if (tmpActiveIndexRef.current > -1) {
      activeIndexRef.current = tmpActiveIndexRef.current
      setIsSelectorShow(false)
      onConfirm?.(data[activeIndexRef.current])
    }
  }

  function onSelectorCancel() {
    setIsSelectorShow(false)
    tmpActiveIndexRef.current = activeIndexRef.current

    if (tmpActiveIndexRef.current !== -1) {
      radioRef.current?.selectByIndex(tmpActiveIndexRef.current)
    } else {
      setRadioKey(Date.now())
      setCheckKey(Date.now() + 1)
    }

    onCancel?.()
  }

  function onSelectorChoose(item: RadioListOption, index: number) {
    tmpActiveIndexRef.current = index
    if (!isNeedConfirm) {
      activeIndexRef.current = index
      setIsSelectorShow(false)
    }
    onChoose?.(item as SelectorItem)
  }

  return (
    <div className={`cu-selector${!isCheck ? ' is-normal' : ''}${isCheck ? ' is-check' : ''}`} ref={ref}>
      <CuPopup
        className="inner-popup"
        value={isSelectorShow}
        position="bottom"
        maskClosable={maskClosable}
        onShow={onShow}
        onHide={onHide}
        onMaskClick={onSelectorCancel}
      >
        {!hideTitleBar || isNeedConfirm ? (
        <CuPopupTitleBar
          title={title}
          describe={describe}
          okText={okText}
          cancelText={actualCancelText}
          largeRadius={largeRadius}
          onlyClose={!isCheck && !isNeedConfirm && !actualCancelText}
          onConfirm={onSelectorConfirm}
          onCancel={onSelectorCancel}
        ></CuPopupTitleBar>
        ) : null}
        <div className="cu-selector-container">
          <CuScrollView
            ref={scrollRef}
            scrollingX={false}
            style={{
              maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
              minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            }}
          >
            {header}
            {!multi ? (
              <CuRadioList
                key={radioKey}
                ref={radioRef}
                className="cu-selector-list"
                value={defaultValue as string | number | boolean}
                options={data}
                isSlotScope={hasSlot}
                icon={icon}
                iconDisabled={iconDisabled}
                iconInverse={iconInverse}
                iconPosition={iconPosition}
                iconSize={iconSize}
                iconSvg={iconSvg}
                onChange={onSelectorChoose}
              >
                {children}
              </CuRadioList>
            ) : (
              <CuCheckList
                key={checkKey}
                className="cu-selector-list"
                value={multiDefaultValue}
                options={data as unknown as CheckListOption[]}
                isSlotScope={hasSlot}
                icon={icon}
                iconDisabled={iconDisabled}
                iconInverse={iconInverse}
                iconPosition={iconPosition}
                iconSize={iconSize}
                iconSvg={iconSvg}
                onChange={(v) => setMultiDefaultValue(v as Array<string | number>)}
              >
                {children
                  ? (slotProps: { option: CheckListOption; index: number; selected: boolean }) =>
                      children(slotProps)
                  : undefined}
              </CuCheckList>
            )}
            {footer}
          </CuScrollView>
        </div>
      </CuPopup>
    </div>
  )
})

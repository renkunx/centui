import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { CuPopup } from '../popup/Popup'
import { CuRadioList, type RadioListOption } from '../radio-list/RadioList'

export interface DropMenuItem {
  text?: string
  disabled?: boolean
  options?: Array<{ value?: string | number; text?: string; label?: string }>
}

export interface DropMenuProps {
  data?: DropMenuItem[]
  defaultValue?: Array<string | number>
  children?: (slotProps: { option: RadioListOption }) => ReactNode
  onChange?: (barItem: DropMenuItem, listItem: Record<string, unknown>) => void
  onShow?: () => void
  onHide?: () => void
}

export interface DropMenuExposed {
  getSelectedValues: () => Array<Record<string, unknown> | undefined>
  getSelectedValue: (index: number) => Record<string, unknown> | undefined
}

export const CuDropMenu = forwardRef<DropMenuExposed, DropMenuProps>(function CuDropMenu(
  { data = [], defaultValue = [], children, onChange, onShow, onHide },
  ref,
) {
  const [isPopupShow, setIsPopupShow] = useState(false)
  const [selectedMenuListItem, setSelectedMenuListItem] = useState<Array<Record<string, unknown> | undefined>>([])
  const [selectedMenuListValue, setSelectedMenuListValue] = useState<Array<string | number>>([])
  const [activeMenuBarIndex, setActiveMenuBarIndex] = useState(-1)
  const [scroller, setScroller] = useState('')

  const hasSlot = !!children
  const activeMenuListData: RadioListOption[] =
    activeMenuBarIndex < 0 || !data[activeMenuBarIndex]
      ? []
      : ((data[activeMenuBarIndex].options ?? []) as unknown as RadioListOption[])

  function initSelectedBar(currentData: DropMenuItem[], currentDefault: Array<string | number>) {
    setSelectedMenuListValue(currentDefault)
    const found: Array<Record<string, unknown> | undefined> = []
    currentData.forEach((barItem, barItemIndex) => {
      const dv = currentDefault[barItemIndex]
      const options = (barItem.options ?? []) as unknown as Array<Record<string, unknown>>
      options.forEach((record) => {
        if (
          dv !== undefined &&
          (record.value === dv || record.text === dv || record.label === dv)
        ) {
          found[barItemIndex] = record
        }
      })
    })
    setSelectedMenuListItem(found)
  }

  // v2 mounted + watch data/defaultValue
  const initDataRef = useRef({ data, defaultValue })
  initDataRef.current = { data, defaultValue }
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      initSelectedBar(data, defaultValue)
      return
    }
    const prev = initDataRef.current
    if (
      JSON.stringify(prev.data) !== JSON.stringify(data) ||
      JSON.stringify(prev.defaultValue) !== JSON.stringify(defaultValue)
    ) {
      initDataRef.current = { data, defaultValue }
      initSelectedBar(data, defaultValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, defaultValue])

  function checkBarItemSelect(index: number) {
    return !!(selectedMenuListItem[index] !== undefined || defaultValue[index])
  }

  function getBarItemText(item: DropMenuItem, index: number) {
    const selected = selectedMenuListItem[index]
    return selected !== undefined ? String((selected as { text?: string }).text ?? '') : item.text
  }

  function onBarItemClick(barItem: DropMenuItem, index: number) {
    if (!barItem || barItem.disabled) {
      return
    }

    if (!isPopupShow) {
      setIsPopupShow(true)
      setActiveMenuBarIndex(index)
    } else {
      setIsPopupShow(false)
    }
  }

  function onListItemClick(listItem: RadioListOption) {
    const index = activeMenuBarIndex
    const barItem = data[index]
    setIsPopupShow(false)
    setSelectedMenuListValue((prev) => {
      const next = [...prev]
      next[index] = listItem.value as string | number
      return next
    })
    setSelectedMenuListItem((prev) => {
      const next = [...prev]
      next[index] = listItem as unknown as Record<string, unknown>
      return next
    })
    onChange?.(barItem, listItem as unknown as Record<string, unknown>)
  }

  useImperativeHandle(ref, () => ({
    getSelectedValues: () => selectedMenuListItem,
    getSelectedValue: (index: number) => selectedMenuListItem[index],
  }))

  return (
    <div className="cu-drop-menu">
      <div className="cu-drop-menu-bar">
        {data.map((item, index) => (
          <div
            key={index}
            className={`bar-item${index === activeMenuBarIndex ? ' active' : ''}${
              checkBarItemSelect(index) ? ' selected' : ''
            }${item.disabled ? ' disabled' : ''}`}
            onClick={() => onBarItemClick(item, index)}
          >
            <span>{getBarItemText(item, index)}</span>
          </div>
        ))}
      </div>
      <CuPopup
        value={isPopupShow}
        position="top"
        preventScroll
        preventScrollExclude={scroller}
        onShow={() => {
          // v2 $_setScroller：弹层高度超出时列表自滚
          setScroller('.cu-drop-menu-list')
          onShow?.()
        }}
        onHide={onHide}
        onBeforeHide={() => setActiveMenuBarIndex(-1)}
      >
        <div className="cu-drop-menu-list">
          <CuRadioList
            value={selectedMenuListValue[activeMenuBarIndex]}
            options={activeMenuListData}
            isSlotScope={hasSlot}
            alignCenter
            onChange={(option) => onListItemClick(option)}
          >
            {children}
          </CuRadioList>
        </div>
      </CuPopup>
    </div>
  )
})

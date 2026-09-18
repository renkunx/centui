import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { cascade, t, type CascadeNode } from '@mand-mobile/core'
import { MdPopup } from '../popup/Popup'
import { MdPopupTitleBar } from '../popup/PopupTitleBar'
import { MdPickerColumn, type PickerColumnExposed, type PickerColumnItem } from './PickerColumn'

export interface PickerExposed {
  refresh: (callback?: () => void, startIndex?: number) => void
  getColumnValues: () => Array<PickerColumnItem | undefined>
  getColumnIndex: (index?: number) => number | undefined
  getColumnIndexs: () => number[]
}

export interface PickerProps {
  value?: boolean
  isView?: boolean
  title?: string
  describe?: string
  okText?: string
  cancelText?: string
  maskClosable?: boolean
  lineHeight?: number
  keepIndex?: boolean
  largeRadius?: boolean
  data?: PickerColumnItem[][]
  cols?: number
  defaultValue?: unknown[]
  defaultIndex?: number[]
  invalidIndex?: Array<number | number[]>
  isCascade?: boolean
  children?: ReactNode
  onInitialed?: () => void
  onConfirm?: (values: Array<PickerColumnItem | undefined>) => void
  onCancel?: () => void
  onChange?: (columnIndex: number, itemIndex: number, value: PickerColumnItem) => void
  onShow?: () => void
  onHide?: () => void
  onChangeValue?: (value: boolean) => void
}

export const MdPicker = forwardRef<PickerExposed, PickerProps>(function MdPicker({
  value = false,
  isView = false,
  title = '',
  describe = '',
  okText,
  cancelText,
  maskClosable = true,
  lineHeight = 45,
  keepIndex = false,
  largeRadius = false,
  data = [],
  cols = 1,
  defaultValue = [],
  defaultIndex = [],
  invalidIndex = [],
  isCascade = false,
  onInitialed,
  onConfirm,
  onCancel,
  onChange,
  onShow,
  onHide,
  onChangeValue,
}: PickerProps,
  ref,
) {
  const resolvedOkText = okText ?? t('md.picker.confirm')
  const resolvedCancelText = cancelText ?? t('md.picker.cancel')

  const columnRef = useRef<PickerColumnExposed>(null)
  const [isPickerShow, setIsPickerShow] = useState(false)
  const isPickerFirstPopupRef = useRef(true)
  const oldActivedIndexsRef = useRef<number[] | null>(null)

  const column = () => columnRef.current

  const initPickerColumn = () => {
    if (!isCascade) {
      return
    }
    const defIndex = oldActivedIndexsRef.current || defaultIndex
    const defValue = oldActivedIndexsRef.current ? [] : defaultValue
    setTimeout(() => {
      cascade(column() as never, {
        currentLevel: -1,
        maxLevel: cols,
        values: (data || []) as unknown as CascadeNode[][],
        defaultIndex: defIndex,
        defaultValue: defValue as Array<string | number | null>,
      })
    }, 0)
  }

  // v2 契约：data 深比较变化重建级联列
  useEffect(() => {
    initPickerColumn()
  }, [data])

  // v2 契约：isView 模式挂载后主动 refresh 定位默认项
  useEffect(() => {
    if (isView) {
      const timer = setTimeout(() => column()?.refresh(), 0)
      return () => clearTimeout(timer)
    }
  }, [isView])

  useEffect(() => {
    if (value) {
      setIsPickerShow(value)
    }
    if (isPickerFirstPopupRef.current) {
      isPickerFirstPopupRef.current = false
    } else {
      setTimeout(() => {
        oldActivedIndexsRef.current = [...(column()?.getColumnIndexs() ?? [])]
      }, 100)
    }
  }, [value])

  const onPickerConfirm = () => {
    const col = column()
    if (!col) {
      return
    }
    const columnValues = col.getColumnValues()
    let isScrolling = false
    ;(col as unknown as { scrollers?: ScrollerAlias[] }).scrollers?.forEach(scroller => {
      if (
        scroller._isAnimating !== false ||
        scroller._isDecelerating !== false ||
        scroller._isDragging !== false ||
        scroller._isGesturing !== false
      ) {
        isScrolling = true
      }
    })

    if (!isScrolling) {
      setIsPickerShow(false)
      onChangeValue?.(false)
      onConfirm?.(columnValues)
    }
  }

  const onPickerCancel = () => {
    setIsPickerShow(false)
    onChangeValue?.(false)
    onCancel?.()
    // reset picker by snapshot（v2 契约）
    setTimeout(() => {
      if (isCascade) {
        initPickerColumn()
      }
      column()?.refresh()
    }, 0)
  }

  const onPickerChange = (columnIndex: number, itemIndex: number, value: PickerColumnItem) => {
    if (isCascade) {
      const col = column()
      if (col) {
        cascade(
          col as never,
          {
            currentLevel: columnIndex,
            maxLevel: cols,
            values: [value] as unknown as CascadeNode[],
          },
          () => {
            col.refresh(undefined, columnIndex + 1)
          },
        )
      }
    }
    onChange?.(columnIndex, itemIndex, value)
  }

  type ScrollerAlias = {
    _isAnimating?: boolean
    _isDecelerating?: boolean
    _isDragging?: boolean
    _isGesturing?: boolean
  }

  useImperativeHandle(ref, () => ({
    refresh: (callback?: () => void, startIndex?: number) => column()?.refresh(callback, startIndex),
    getColumnValues: () => getColumnValuesSafe(),
    getColumnIndex: (index?: number) => column()?.getColumnIndex(index),
    getColumnIndexs: () => column()?.getColumnIndexs() ?? [],
  }))

  const getColumnValuesSafe = () => column()?.getColumnValues() ?? []

  const columnNode = (
    <MdPickerColumn
      ref={columnRef}
      data={data}
      defaultValue={oldActivedIndexsRef.current ? [] : defaultValue}
      defaultIndex={oldActivedIndexsRef.current || defaultIndex}
      invalidIndex={invalidIndex}
      lineHeight={lineHeight}
      keepIndex={keepIndex}
      cols={cols}
      onInitialed={onInitialed}
      onChange={onPickerChange}
    />
  )

  if (isView) {
    return (
      <div className="md-picker">
        {columnNode}
      </div>
    )
  }

  return (
    <div className="md-picker with-popup">
      <MdPopup
        className="inner-popup"
        value={isPickerShow}
        position="bottom"
        maskClosable={maskClosable}
        preventScroll
        onChange={val => {
          setIsPickerShow(val)
          if (!val) {
            onChangeValue?.(val)
          }
        }}
        onBeforeShow={() => {
          if (!(column() as unknown as { isScrollInitialed?: boolean })?.isScrollInitialed) {
            setTimeout(() => column()?.refresh(), 0)
          }
        }}
        onShow={onShow}
        onHide={onHide}
        onMaskClick={onPickerCancel}
      >
        <MdPopupTitleBar
          title={title}
          describe={describe}
          okText={resolvedOkText}
          cancelText={resolvedCancelText}
          largeRadius={largeRadius}
          onConfirm={onPickerConfirm}
          onCancel={onPickerCancel}
        ></MdPopupTitleBar>
        {columnNode}
      </MdPopup>
    </div>
  )
})

export { MdPickerColumn }
export type { PickerColumnItem, PickerColumnExposed }

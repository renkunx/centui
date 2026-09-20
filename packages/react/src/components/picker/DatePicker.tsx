import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { warn } from '@centui/core'
import {
  buildDateColumns,
  formatDate,
  type DateColumnGenerator,
  type DateColumnItem,
  type DatePickerColumnOptions,
  type PrevColumnRef,
} from '@centui/core'
import { CuPicker, type PickerColumnItem } from './Picker'

export interface DatePickerProps {
  value?: boolean
  /** date | time | datetime | custom */
  type?: DatePickerColumnOptions['type']
  customTypes?: NonNullable<DatePickerColumnOptions['customTypes']>
  minDate?: Date
  maxDate?: Date
  defaultDate?: Date
  minuteStep?: number
  unitText?: string[]
  todayText?: string
  textRender?: DatePickerColumnOptions['textRender']
  isView?: boolean
  title?: string
  describe?: string
  okText?: string
  cancelText?: string
  maskClosable?: boolean
  lineHeight?: number
  keepIndex?: boolean
  largeRadius?: boolean
  children?: ReactNode
  onInitialed?: () => void
  onChange?: (columnIndex: number, itemIndex: number, value: PickerColumnItem) => void
  onConfirm?: (columnsValue: DateColumnItem[]) => void
  onCancel?: () => void
  onShow?: () => void
  onHide?: () => void
  onChangeValue?: (value: boolean) => void
}

export const CuDatePicker = forwardRef<{ getFormatDate: (format?: string) => string }, DatePickerProps>(
  function CuDatePicker({
  type = 'date',
  customTypes,
  minDate,
  maxDate,
  defaultDate,
  minuteStep = 1,
  unitText,
  todayText,
  textRender,
  onInitialed,
  onChange,
  onConfirm,
  onCancel,
  onShow,
  onHide,
  onChangeValue,
  ...pickerProps
}: DatePickerProps,
  ref,
) {
  const pickerRef = useRef<{ refresh: () => void; getColumnValues: () => Array<PickerColumnItem | undefined>; getColumnIndex: (i?: number) => number | undefined } | null>(null)

  const [columnData, setColumnData] = useState<DateColumnItem[][]>([])
  const [columnDataDefault, setColumnDataDefault] = useState<Array<string | number>>([])
  const columnDataGeneratorRef = useRef<DateColumnGenerator[]>([])
  const oldColumnDataRef = useRef<DateColumnItem[][] | null>(null)
  const dataRef = useRef(columnData)
  dataRef.current = columnData

  const coreOptions = (): DatePickerColumnOptions => ({
    type,
    customTypes,
    minDate,
    maxDate,
    defaultDate,
    minuteStep,
    unitText,
    todayText,
    textRender,
  })

  // 从 columnIndex 起按当前各列选中值重建后续列（v2 $_initColumnData）
  const initColumnData = (columnIndex: number, defaults: number[] = []) => {
    const generatorList = columnDataGeneratorRef.current
    const next = [...dataRef.current]
    for (let i = columnIndex, len = generatorList.length; i < len; i++) {
      const params: PrevColumnRef[] = []
      const generator = generatorList[i]
      for (let j = 0; j < i; j++) {
        const prevGenerator = generatorList[j]
        if (defaults[j] && prevGenerator) {
          params.push({ type: prevGenerator.type, value: defaults[j] })
          continue
        }
        const itemIndex = pickerRef.current?.getColumnIndex(j) ?? 0
        if (next[j]) {
          params.push(next[j][itemIndex] ?? '')
        } else {
          params.push('')
          warn(`DatePicker columnData of index ${j} is void`)
        }
      }
      next[i] = generator ? generator(...params) : []
    }
    setColumnData(next)
  }

  const initPickerColumn = () => {
    const { generators, defaults, columns } = buildDateColumns(coreOptions())
    columnDataGeneratorRef.current = generators
    setColumnDataDefault(defaults)
    setColumnData(columns)
    setTimeout(() => pickerRef.current?.refresh(), 0)
  }

  useEffect(() => {
    initPickerColumn()
  }, [type, minDate, maxDate, defaultDate, minuteStep])

  // 列联动：右列按左列选中项重建（v2 $_onPickerChange 契约）
  const handlePickerChange = (columnIndex: number, itemIndex: number, value: PickerColumnItem) => {
    onChange?.(columnIndex, itemIndex, value)
    if (columnIndex < dataRef.current.length - 1) {
      initColumnData(columnIndex + 1)
    }
  }

  const getFormatDate = (format = 'yyyy-MM-dd hh:mm') =>
    formatDate(
      (pickerRef.current?.getColumnValues() ?? []) as unknown as DateColumnItem[],
      format,
    )

  // v2 公共 API：getFormatDate
  useImperativeHandle(ref, () => ({ getFormatDate }), [pickerRef])

  return (
    <div className={`cu-date-picker ${type}`}>
      <CuPicker
        {...pickerProps}
        ref={pickerRef as never}
        data={columnData as unknown as PickerColumnItem[][]}
        cols={columnData.length}
        defaultValue={columnDataDefault}
        onInitialed={onInitialed}
        onChange={handlePickerChange}
        onConfirm={onConfirm as ((values: Array<PickerColumnItem | undefined>) => void) | undefined}
        onCancel={onCancel}
        onShow={() => {
          oldColumnDataRef.current = [...dataRef.current]
          onShow?.()
        }}
        onHide={onHide}
        onChangeValue={onChangeValue}
      ></CuPicker>
    </div>
  )
})

export { CuPicker }
export type { PickerColumnItem }

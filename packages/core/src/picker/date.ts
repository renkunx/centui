/**
 * 日期时间选择器列数据生成（自 v2 date-picker/index.vue 的 methods 抽取为纯逻辑）。
 * 生成器之间通过前一列选中项联动（{type, value}），与 UI 框架解耦。
 */
import { warn } from '../debug'
import { t } from '../locale'

export type DateColumnType = 'Year' | 'Month' | 'Date' | 'Hour' | 'Minute'
export type DateColumnTypeFormat = 'yyyy' | 'MM' | 'dd' | 'HH' | 'hh' | 'mm'

/** yyyy-MM-dd hh:mm => Year-Month-Date Hour:Minute */
const TYPE_FORMAT: Record<DateColumnTypeFormat, DateColumnType> = {
  yyyy: 'Year',
  MM: 'Month',
  dd: 'Date',
  HH: 'Hour',
  hh: 'Hour',
  mm: 'Minute',
}

const TYPE_FORMAT_INVERSE: Record<DateColumnType, DateColumnTypeFormat> = {
  Year: 'yyyy',
  Month: 'MM',
  Date: 'dd',
  Hour: 'hh',
  Minute: 'mm',
}

const TYPE_METHODS: Record<DateColumnType, 'getFullYear' | 'getMonth' | 'getDate' | 'getHours' | 'getMinutes'> = {
  Year: 'getFullYear',
  Month: 'getMonth',
  Date: 'getDate',
  Hour: 'getHours',
  Minute: 'getMinutes',
}

export interface DateColumnItem {
  text: string
  value: number
  typeFormat: DateColumnTypeFormat | DateColumnType
  type: DateColumnType
}

/** 上一列选中项引用：v2 仅传递 {type, value} 部分 */
export type PrevColumnRef = DateColumnItem | { type: DateColumnType; value: number } | ''

export interface DateColumnGenerator {
  type: DateColumnType
  (...prevColumns: PrevColumnRef[]): DateColumnItem[]
}

export interface DatePickerColumnOptions {
  type?: 'date' | 'time' | 'datetime' | 'custom'
  /** type=custom 时的列类型序列，支持 yyyy/MM/dd/HH/hh/mm */
  customTypes?: DateColumnTypeFormat[]
  minDate?: Date
  maxDate?: Date
  defaultDate?: Date
  minuteStep?: number
  unitText?: string[]
  todayText?: string
  textRender?: (typeFormat: string, ...values: Array<string | number>) => string
  /** 注入"当前时间"，测试可控；默认 new Date() */
  now?: Date
}

interface GeneratorContext {
  now: Date
  minDate?: Date
  maxDate?: Date
  minuteStep: number
  unitText: string[]
  todayText: string
  textRender?: DatePickerColumnOptions['textRender']
}

function getContextDefaults(ctx: GeneratorContext): Record<DateColumnType, number> {
  return {
    Year: ctx.now.getFullYear(),
    Month: ctx.now.getMonth() + 1,
    Date: ctx.now.getDate(),
    Hour: ctx.now.getHours(),
    Minute: ctx.now.getMinutes(),
  }
}

function getGeneratorArguments(
  ctx: GeneratorContext,
  args: PrevColumnRef[],
): Record<DateColumnType, number> {
  const defaults = getContextDefaults(ctx)
  args.forEach(item => {
    if (item) {
      defaults[item.type] = item.value
    }
  })
  return defaults
}

/**
 * Determine whether year, month, date, etc of the current date are equal to the given value
 */
function isDateTimeEqual(date: Date | undefined, ...values: number[]): boolean {
  const methods = Object.keys(TYPE_METHODS).map(key => TYPE_METHODS[key as DateColumnType])

  if (!date) {
    return false
  }

  for (let i = 1; i <= values.length; i++) {
    const methodName = methods[i - 1]
    const curVal = date[methodName]() + Number(methodName === 'getMonth')
    const targetVal = +values[i - 1]

    if (curVal !== targetVal) {
      return false
    }
  }

  return true
}

function generateData(
  ctx: GeneratorContext,
  from: number,
  to: number | undefined,
  type: DateColumnType,
  unit: string,
  step = 1,
  args: PrevColumnRef[] = [],
): DateColumnItem[] {
  let count = from
  let text: string | undefined
  const data: DateColumnItem[] = []
  const defaultArgs = args.map(item => (typeof item === 'object' ? item.value : item))

  while (to !== undefined && count <= to) {
    if (ctx.textRender) {
      text = ctx.textRender(TYPE_FORMAT_INVERSE[type], ...defaultArgs, count)
    }
    data.push({
      text: text || `${count}${unit}`,
      value: count,
      typeFormat: TYPE_FORMAT_INVERSE[type] || type,
      type,
    })
    count += step
  }

  return data
}

function generateYearData(ctx: GeneratorContext): DateColumnItem[] {
  const start = ctx.minDate ? ctx.minDate.getFullYear() : ctx.now.getFullYear() - 20
  const end = ctx.maxDate ? ctx.maxDate.getFullYear() : ctx.now.getFullYear() + 20
  if (start > end) {
    warn('MinDate Year should be earlier than MaxDate')
    return []
  }
  return generateData(ctx, start, end, 'Year', ctx.unitText[0], 1)
}

function generateMonthData(ctx: GeneratorContext, ...args: PrevColumnRef[]): DateColumnItem[] {
  const values = getGeneratorArguments(ctx, args)
  let start: number, end: number

  if (isDateTimeEqual(ctx.minDate, values.Year)) {
    start = ctx.minDate!.getMonth() + 1
  } else {
    start = 1
  }

  if (isDateTimeEqual(ctx.maxDate, values.Year)) {
    end = ctx.maxDate!.getMonth() + 1
  } else {
    end = 12
  }
  return generateData(ctx, start, end, 'Month', ctx.unitText[1] || '', 1, args)
}

function generateDateData(ctx: GeneratorContext, ...args: PrevColumnRef[]): DateColumnItem[] {
  const values = getGeneratorArguments(ctx, args)

  let start: number, end: number

  if (isDateTimeEqual(ctx.minDate, values.Year, values.Month)) {
    start = ctx.minDate!.getDate()
  } else {
    start = 1
  }

  if (isDateTimeEqual(ctx.maxDate, values.Year, values.Month)) {
    end = ctx.maxDate!.getDate()
  } else {
    end = new Date(values.Year, values.Month, 0).getDate()
  }

  const dateData = generateData(ctx, start, end, 'Date', ctx.unitText[2] || '', 1, args)

  if (
    isDateTimeEqual(ctx.now, values.Year, values.Month) &&
    ctx.now.getDate() >= start &&
    ctx.now.getDate() <= end &&
    ctx.todayText
  ) {
    const currentDateIndex = ctx.now.getDate() - start
    const currentDate = dateData[currentDateIndex].text
    dateData[currentDateIndex].text = ctx.todayText.replace('&', currentDate)
  }

  return dateData
}

function generateHourData(ctx: GeneratorContext, ...args: PrevColumnRef[]): DateColumnItem[] {
  const values = getGeneratorArguments(ctx, args)
  let start: number, end: number

  if (isDateTimeEqual(ctx.minDate, values.Year, values.Month, values.Date)) {
    start = ctx.minDate!.getHours()
  } else {
    start = 0
  }

  if (isDateTimeEqual(ctx.maxDate, values.Year, values.Month, values.Date)) {
    end = ctx.maxDate!.getHours()
  } else {
    end = 23
  }

  if (end < start) {
    end = 23
  }
  if (start > end) {
    warn('MinDate Hour should be earlier than MaxDate')
    return []
  }

  return generateData(ctx, start, end, 'Hour', ctx.unitText[3] || '', 1, args)
}

function generateMinuteData(ctx: GeneratorContext, ...args: PrevColumnRef[]): DateColumnItem[] {
  const values = getGeneratorArguments(ctx, args)
  let start: number, end: number

  if (isDateTimeEqual(ctx.minDate, values.Year, values.Month, values.Date, values.Hour)) {
    start = ctx.minDate!.getMinutes()
  } else {
    start = 0
  }

  if (isDateTimeEqual(ctx.maxDate, values.Year, values.Month, values.Date, values.Hour)) {
    end = ctx.maxDate!.getMinutes()
  } else {
    end = 59
  }

  return generateData(ctx, start, end, 'Minute', ctx.unitText[4] || '', ctx.minuteStep, args)
}

function getClampedDefaultDate(options: DatePickerColumnOptions): Date | undefined {
  const { defaultDate, minDate, maxDate } = options

  if (!defaultDate) {
    return defaultDate
  }

  if (minDate && defaultDate.getTime() < minDate.getTime()) {
    return minDate
  }

  if (maxDate && defaultDate.getTime() > maxDate.getTime()) {
    return maxDate
  }

  return defaultDate
}

export interface DatePickerColumns {
  generators: DateColumnGenerator[]
  /** defaultDate 对应的各列初始值（无 defaultDate 时为空数组） */
  defaults: number[]
  /** 按 defaults 逐级生成的列数据 */
  columns: DateColumnItem[][]
}

/**
 * 创建日期选择器列生成器（v2 $_initColumnDataGenerator 的纯函数版）
 */
export function getDateColumnGenerators(
  options: DatePickerColumnOptions = {},
): Pick<DatePickerColumns, 'generators' | 'defaults'> {
  const type = options.type ?? 'date'
  const minuteStep = options.minuteStep ?? 1
  const unitText =
    options.unitText ??
    [
      t('md.date_picker.year'),
      t('md.date_picker.month'),
      t('md.date_picker.day'),
      t('md.date_picker.hour'),
      t('md.date_picker.minute'),
    ]

  const ctx: GeneratorContext = {
    now: options.now ?? new Date(),
    minDate: options.minDate,
    maxDate: options.maxDate,
    minuteStep,
    unitText,
    todayText: options.todayText ?? '',
    textRender: options.textRender,
  }

  const generators: DateColumnGenerator[] = []
  const defaults: number[] = []
  const defaultDate = getClampedDefaultDate(options)

  const pushGenerator = (gen: DateColumnGenerator) => {
    generators.push(gen)
  }

  const pushDefault = (value: number) => {
    defaults.push(value)
  }

  const forDate = () => {
    pushGenerator(Object.assign((..._args: PrevColumnRef[]) => generateYearData(ctx), { type: 'Year' as const }))
    pushGenerator(Object.assign((...args: PrevColumnRef[]) => generateMonthData(ctx, ...args), { type: 'Month' as const }))
    pushGenerator(Object.assign((...args: PrevColumnRef[]) => generateDateData(ctx, ...args), { type: 'Date' as const }))
    if (defaultDate) {
      pushDefault(defaultDate.getFullYear())
      pushDefault(defaultDate.getMonth() + 1)
      pushDefault(defaultDate.getDate())
    }
  }

  const forTime = () => {
    pushGenerator(Object.assign((...args: PrevColumnRef[]) => generateHourData(ctx, ...args), { type: 'Hour' as const }))
    pushGenerator(Object.assign((...args: PrevColumnRef[]) => generateMinuteData(ctx, ...args), { type: 'Minute' as const }))
    if (defaultDate) {
      pushDefault(defaultDate.getHours())
      pushDefault(defaultDate.getMinutes())
    }
  }

  const forCustom = () => {
    ;(options.customTypes ?? []).forEach(typeFormat => {
      const columnType = TYPE_FORMAT[typeFormat] ?? (typeFormat as unknown as DateColumnType)
      const gen = (() => {
        switch (columnType) {
          case 'Year':
            return (ctx: GeneratorContext) => generateYearData(ctx)
          case 'Month':
            return generateMonthData
          case 'Date':
            return generateDateData
          case 'Hour':
            return generateHourData
          case 'Minute':
            return generateMinuteData
        }
      })()
      pushGenerator(Object.assign((...args: PrevColumnRef[]) => gen(ctx, ...args), { type: columnType }))

      if (defaultDate) {
        let value = defaultDate[TYPE_METHODS[columnType]]()
        if (columnType === 'Month') {
          value += 1
        }
        pushDefault(value)
      }
    })
  }

  switch (type) {
    case 'date':
      forDate()
      break
    case 'time':
      forTime()
      break
    case 'datetime':
      forDate()
      forTime()
      break
    default:
      forCustom()
      break
  }

  return { generators, defaults }
}

/**
 * 按 defaults 逐级生成全部列数据（v2 $_initColumnData(0, default) 的纯函数版）
 */
export function buildDateColumns(options: DatePickerColumnOptions = {}): DatePickerColumns {
  const { generators, defaults } = getDateColumnGenerators(options)
  const columns: DateColumnItem[][] = []

  for (let i = 0, len = generators.length; i < len; i++) {
    const generator = generators[i]
    const params: PrevColumnRef[] = []
    for (let j = 0; j < i; j++) {
      if (defaults[j] && generators[j]) {
        params.push({ type: generators[j].type, value: defaults[j] })
        continue
      }
      // 无 defaultDate 时取上一列第一个选项（v2: columnIndex || 0）
      params.push(columns[j]?.[0] ?? '')
    }
    columns[i] = generator(...params)
  }

  return { generators, defaults, columns }
}

/**
 * 将列选中值格式化为日期字符串（v2 getFormatDate 的纯函数版）
 */
export function formatDate(
  columnValues: DateColumnItem[],
  format = 'yyyy-MM-dd hh:mm',
): string {
  let result = format
  columnValues.forEach(item => {
    if (!item) {
      return
    }

    let value: string | number = item.value
    if (value < 10) {
      value = '0' + value
    }

    result = result.replace('HH', 'hh') // deal with HH as hh
    result = result.replace(item.type, String(value))
    result = result.replace(TYPE_FORMAT_INVERSE[item.type], String(value))
  })

  return result
}

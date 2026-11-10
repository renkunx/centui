/**
 * date-picker 列数据生成：对齐 @centui/core/picker/date.ts（纯函数移植）。
 * 小程序包测试/编译环境不解析 @centui/core 包依赖（无 node_modules 链接与 tsconfig
 * paths，既有批次 input-item/logic.ts 同惯例），故在组件目录内同步实现；
 * 构建期 bundle 语义与 core 主入口一致（DOM-free，禁用 /web 子入口）。
 *
 * 同步范围：generate 系列、minuteStep 钳制、min/max 边界联动、todayText 替换、
 * defaultDate 钳制、customTypes、formatDate。
 * 差异：textRender 保留参数但小程序组件层不传（函数属性不可用，组件头声明）；
 * unitText 默认值取 zh-CN 词条（年/月/日/时/分）。
 */

export type DateColumnType = 'Year' | 'Month' | 'Date' | 'Hour' | 'Minute'
export type DateColumnTypeFormat = 'yyyy' | 'MM' | 'dd' | 'HH' | 'hh' | 'mm'

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

const TYPE_METHODS: Record<
  DateColumnType,
  'getFullYear' | 'getMonth' | 'getDate' | 'getHours' | 'getMinutes'
> = {
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
  [key: string]: unknown
}

export type PrevColumnRef = DateColumnItem | {type: DateColumnType; value: number} | ''

export interface DateColumnGenerator {
  type: DateColumnType
  (...prevColumns: PrevColumnRef[]): DateColumnItem[]
}

export interface DatePickerColumnOptions {
  type?: 'date' | 'time' | 'datetime' | 'custom'
  customTypes?: DateColumnTypeFormat[]
  minDate?: Date
  maxDate?: Date
  defaultDate?: Date
  minuteStep?: number
  unitText?: string[]
  todayText?: string
  textRender?: (typeFormat: string, ...values: Array<string | number>) => string
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

/** min/max/defaultDate 属性归一（小程序侧接受 Date | 时间戳数字 | 可解析字符串） */
export function toDate(v: unknown): Date | undefined {
  if (v == null || v === '') return undefined
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v
  if (typeof v === 'number' && isFinite(v)) return new Date(v)
  if (typeof v === 'string') {
    const d = new Date(v.replace(/-/g, '/'))
    return isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

function warn(msg: string) {
  console.warn(`[CentUI date-picker] ${msg}`)
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

function isDateTimeEqual(date: Date | undefined, ...values: number[]): boolean {
  const methods = Object.keys(TYPE_METHODS).map((key) => TYPE_METHODS[key as DateColumnType])
  if (!date) return false
  for (let i = 1; i <= values.length; i++) {
    const methodName = methods[i - 1]
    const curVal = date[methodName]() + Number(methodName === 'getMonth')
    if (curVal !== +values[i - 1]) return false
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
  const defaultArgs = args.map((item) => (typeof item === 'object' && item ? item.value : item))

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
  let start: number
  let end: number
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
  let start: number
  let end: number
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
  let start: number
  let end: number
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
  if (end < start) end = 23
  if (start > end) {
    warn('MinDate Hour should be earlier than MaxDate')
    return []
  }
  return generateData(ctx, start, end, 'Hour', ctx.unitText[3] || '', 1, args)
}

function generateMinuteData(ctx: GeneratorContext, ...args: PrevColumnRef[]): DateColumnItem[] {
  const values = getGeneratorArguments(ctx, args)
  let start: number
  let end: number
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

function getGeneratorArguments(
  ctx: GeneratorContext,
  args: PrevColumnRef[],
): Record<DateColumnType, number> {
  const defaults = getContextDefaults(ctx)
  args.forEach((item) => {
    if (item) {
      defaults[item.type] = item.value
    }
  })
  return defaults
}

function getClampedDefaultDate(options: DatePickerColumnOptions): Date | undefined {
  const {defaultDate, minDate, maxDate} = options
  if (!defaultDate) return defaultDate
  if (minDate && defaultDate.getTime() < minDate.getTime()) return minDate
  if (maxDate && defaultDate.getTime() > maxDate.getTime()) return maxDate
  return defaultDate
}

export interface DatePickerColumns {
  generators: DateColumnGenerator[]
  defaults: number[]
  columns: DateColumnItem[][]
}

/** 创建列生成器 + defaultDate 各列初值（v2 $_initColumnDataGenerator 纯函数版） */
export function getDateColumnGenerators(
  options: DatePickerColumnOptions = {},
): Pick<DatePickerColumns, 'generators' | 'defaults'> {
  const type = options.type ?? 'date'
  // minuteStep < 1（0/负数/NaN）会让 while 永不终止，钳到 1（core 同款防护）
  let minuteStep = options.minuteStep ?? 1
  if (!(minuteStep >= 1)) {
    warn(`minuteStep should be >= 1, got ${options.minuteStep}; fallback to 1`)
    minuteStep = 1
  }
  const unitText = options.unitText ?? ['年', '月', '日', '时', '分']

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

  const push = (gen: (...args: PrevColumnRef[]) => DateColumnItem[], columnType: DateColumnType) => {
    const wrapped = (...args: PrevColumnRef[]) => gen(...args)
    ;(wrapped as DateColumnGenerator).type = columnType
    generators.push(wrapped as DateColumnGenerator)
  }

  const forDate = () => {
    push(() => generateYearData(ctx), 'Year')
    push((...args: PrevColumnRef[]) => generateMonthData(ctx, ...args), 'Month')
    push((...args: PrevColumnRef[]) => generateDateData(ctx, ...args), 'Date')
    if (defaultDate) {
      defaults.push(defaultDate.getFullYear(), defaultDate.getMonth() + 1, defaultDate.getDate())
    }
  }

  const forTime = () => {
    push((...args: PrevColumnRef[]) => generateHourData(ctx, ...args), 'Hour')
    push((...args: PrevColumnRef[]) => generateMinuteData(ctx, ...args), 'Minute')
    if (defaultDate) {
      defaults.push(defaultDate.getHours(), defaultDate.getMinutes())
    }
  }

  const isDateColumnType = (t: string): t is DateColumnType =>
    t === 'Year' || t === 'Month' || t === 'Date' || t === 'Hour' || t === 'Minute'

  const forCustom = () => {
    ;(options.customTypes ?? []).forEach((typeFormat) => {
      const columnType: DateColumnType | null =
        TYPE_FORMAT[typeFormat] ?? (isDateColumnType(typeFormat) ? typeFormat : null)
      if (!columnType) {
        warn(`Unknown custom column type: ${String(typeFormat)}; column is skipped`)
        return
      }
      const gen = (...args: PrevColumnRef[]) => {
        switch (columnType) {
          case 'Year':
            return generateYearData(ctx)
          case 'Month':
            return generateMonthData(ctx, ...args)
          case 'Date':
            return generateDateData(ctx, ...args)
          case 'Hour':
            return generateHourData(ctx, ...args)
          case 'Minute':
            return generateMinuteData(ctx, ...args)
        }
      }
      push(gen, columnType)
      if (defaultDate) {
        let value = defaultDate[TYPE_METHODS[columnType]]()
        if (columnType === 'Month') value += 1
        defaults.push(value)
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

  return {generators, defaults}
}

/** 按 defaults 逐级生成全部列数据（v2 $_initColumnData(0, default) 纯函数版） */
export function buildDateColumns(options: DatePickerColumnOptions = {}): DatePickerColumns {
  const {generators, defaults} = getDateColumnGenerators(options)
  const columns: DateColumnItem[][] = []

  for (let i = 0; i < generators.length; i++) {
    const params: PrevColumnRef[] = []
    for (let j = 0; j < i; j++) {
      if (defaults[j]) {
        params.push({type: generators[j].type, value: defaults[j]})
        continue
      }
      params.push(columns[j]?.[0] ?? '')
    }
    columns[i] = generators[i](...params)
  }

  return {generators, defaults, columns}
}

/** 列选中值 → 日期字符串（v2 getFormatDate 纯函数版） */
export function formatDate(columnValues: DateColumnItem[], format = 'yyyy-MM-dd hh:mm'): string {
  let result = format
  columnValues.forEach((item) => {
    if (!item) return
    let value: string | number = item.value
    if (value < 10) value = '0' + value
    result = result.replace('HH', 'hh')
    result = result.replace(item.type, String(value))
    result = result.replace(TYPE_FORMAT_INVERSE[item.type], String(value))
  })
  return result
}

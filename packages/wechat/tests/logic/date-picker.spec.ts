/**
 * date-picker 纯逻辑测试：列生成边界（minuteStep 钳制、闰月、min/max 联动、
 * customTypes、todayText）、defaultDate 钳制与 formatDate，对照 core/picker/date.ts。
 */
import {describe, it, expect} from 'vitest'
import {
  buildDateColumns,
  formatDate,
  getDateColumnGenerators,
  toDate,
  type DateColumnItem,
} from '../../src/components/date-picker/logic'

const NOW = new Date(2024, 0, 15, 10, 30) // 2024-01-15 10:30

describe('date-picker/logic 基础列生成', () => {
  it('type=date 默认生成 年/月/日 三列，年份 ±20', () => {
    const {columns, defaults} = buildDateColumns({now: NOW, defaultDate: NOW})
    expect(columns).toHaveLength(3)
    expect(columns[0]).toHaveLength(41) // 2004..2044
    expect(columns[1]).toHaveLength(12)
    expect(columns[2]).toHaveLength(31)
    expect(defaults).toEqual([2024, 1, 15])
    expect(columns[0][0].text).toBe('2004年')
  })

  it('type=datetime 生成 5 列；minuteStep 生效', () => {
    const {columns, defaults} = buildDateColumns({
      now: NOW,
      type: 'datetime',
      minuteStep: 15,
      defaultDate: NOW,
    })
    expect(columns).toHaveLength(5)
    expect(columns[4].map((i) => i.value)).toEqual([0, 15, 30, 45])
    expect(defaults).toEqual([2024, 1, 15, 10, 30])
  })

  it('type=time 只生成 时/分 两列', () => {
    const {columns, defaults} = buildDateColumns({now: NOW, type: 'time', defaultDate: NOW})
    expect(columns).toHaveLength(2)
    expect(columns[0][0].type).toBe('Hour')
    expect(defaults).toEqual([10, 30])
  })

  it('无 defaultDate 时 defaults 为空、首列取首项联动（2004-01-01）', () => {
    const {columns, defaults} = buildDateColumns({now: NOW})
    expect(defaults).toEqual([])
    // 无 defaultDate：后续列取上一列第一项 → 2004 年 1 月 1 日
    expect(columns[1][0].value).toBe(1)
    expect(columns[2][0].value).toBe(1)
  })
})

describe('date-picker/logic minuteStep 钳制', () => {
  it('minuteStep<1（0/负数/NaN）钳到 1，不死循环', () => {
    for (const bad of [0, -5, NaN]) {
      const {columns} = buildDateColumns({now: NOW, type: 'time', minuteStep: bad})
      expect(columns[1]).toHaveLength(60)
    }
  })
})

describe('date-picker/logic 闰月（闰年 2 月）', () => {
  it('2024 年 2 月生成 29 天，2023 年 2 月生成 28 天', () => {
    const leap = buildDateColumns({now: NOW, customTypes: ['yyyy', 'MM', 'dd'], type: 'custom'})
    const feb2024 = leap.generators[2]({type: 'Month', value: 2}, {type: 'Year', value: 2024})
    expect(feb2024).toHaveLength(29)
    const feb2023 = leap.generators[2]({type: 'Month', value: 2}, {type: 'Year', value: 2023})
    expect(feb2023).toHaveLength(28)
  })
})

describe('date-picker/logic min/max 边界联动', () => {
  const min = new Date(2024, 0, 10, 8, 20)
  const max = new Date(2024, 0, 20, 18, 40)

  it('min/max 年月日时分逐级收窄', () => {
    const {columns, defaults} = buildDateColumns({
      now: NOW,
      type: 'datetime',
      minDate: min,
      maxDate: max,
      defaultDate: new Date(2024, 0, 15, 12, 0),
    })
    expect(columns[0].map((i) => i.value)).toEqual([2024])
    expect(columns[1].map((i) => i.value)).toEqual([1])
    expect(columns[2]).toHaveLength(11) // 10..20
    expect(defaults).toEqual([2024, 1, 15, 12, 0])
  })

  it('边界日的小时/分钟收窄（min/max 同日）', () => {
    const min = new Date(2024, 0, 15, 8, 20)
    const max = new Date(2024, 0, 15, 18, 40)
    const {columns, defaults} = buildDateColumns({
      now: NOW,
      type: 'datetime',
      minDate: min,
      maxDate: max,
      defaultDate: new Date(2024, 0, 15, 9, 0),
    })
    expect(columns[3].map((i) => i.value)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(defaults).toEqual([2024, 1, 15, 9, 0])

    // 分钟列仅在选中小时与 min/max 同小时时收窄（经生成器直接断言）
    const {generators} = getDateColumnGenerators({now: NOW, type: 'time', minDate: min, maxDate: max})
    const minutesAt8 = generators[1]({type: 'Hour', value: 8})
    expect(minutesAt8[0].value).toBe(20)
    expect(minutesAt8[minutesAt8.length - 1].value).toBe(59)
    const minutesAt18 = generators[1]({type: 'Hour', value: 18})
    expect(minutesAt18[0].value).toBe(0)
    expect(minutesAt18[minutesAt18.length - 1].value).toBe(40)
  })

  it('defaultDate 越界钳到 min/max', () => {
    const {defaults} = buildDateColumns({now: NOW, minDate: min, maxDate: max, defaultDate: new Date(2020, 5, 1)})
    expect(defaults).toEqual([2024, 1, 10])
    const {defaults: d2} = buildDateColumns({now: NOW, maxDate: max, defaultDate: new Date(2030, 5, 1)})
    expect(d2).toEqual([2024, 1, 20])
  })
})

describe('date-picker/logic customTypes', () => {
  it('按格式序列生成列；未知格式跳过', () => {
    const {generators, columns, defaults} = buildDateColumns({
      now: NOW,
      type: 'custom',
      customTypes: ['MM', 'dd', 'hh', 'mm'],
      defaultDate: new Date(2024, 0, 15, 10, 30),
    })
    expect(generators.map((g) => g.type)).toEqual(['Month', 'Date', 'Hour', 'Minute'])
    expect(defaults).toEqual([1, 15, 10, 30])
    expect(columns[0][0].typeFormat).toBe('MM')
  })

  it('customTypes 含未知格式时 warn 跳过（不崩溃）', () => {
    const {generators} = buildDateColumns({now: NOW, type: 'custom', customTypes: ['xx' as never, 'yyyy']})
    expect(generators).toHaveLength(1)
    expect(generators[0].type).toBe('Year')
  })
})

describe('date-picker/logic todayText / unitText', () => {
  it('todayText 替换今日文本（& 占位为完整项文本，仅选中链命中今日时）', () => {
    const {columns} = buildDateColumns({now: NOW, todayText: '今天&', defaultDate: NOW})
    const today = columns[2].find((i) => i.value === 15)
    expect(today?.text).toBe('今天15日')
  })

  it('unitText 自定义单位拼接', () => {
    const {columns} = buildDateColumns({now: NOW, unitText: ['年', '月', '日', '时', '分']})
    expect(columns[0][0].text).toBe('2004年')
    expect(columns[1][0].text).toBe('1月')
  })
})

describe('date-picker/logic formatDate', () => {
  const values: DateColumnItem[] = [
    {text: '2024年', value: 2024, typeFormat: 'yyyy', type: 'Year'},
    {text: '1月', value: 1, typeFormat: 'MM', type: 'Month'},
    {text: '15日', value: 15, typeFormat: 'dd', type: 'Date'},
    {text: '9时', value: 9, typeFormat: 'hh', type: 'Hour'},
    {text: '5分', value: 5, typeFormat: 'mm', type: 'Minute'},
  ]

  it('默认格式 yyyy-MM-dd hh:mm，补零', () => {
    expect(formatDate(values)).toBe('2024-01-15 09:05')
  })

  it('HH 视作 hh（v2 语义）', () => {
    expect(formatDate(values.slice(3), 'HH:mm')).toBe('09:05')
  })
})

describe('date-picker/logic toDate 属性归一', () => {
  it('Date/时间戳/字符串均可；非法输入 undefined', () => {
    expect(toDate(new Date(2024, 0, 1))?.getTime()).toBe(new Date(2024, 0, 1).getTime())
    expect(toDate(1704038400000)?.getFullYear()).toBeGreaterThan(2020)
    expect(toDate('2024-01-15')?.getDate()).toBe(15)
    expect(toDate('')).toBeUndefined()
    expect(toDate(null)).toBeUndefined()
    expect(toDate('not-a-date')).toBeUndefined()
  })
})

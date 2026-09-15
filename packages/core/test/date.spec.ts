import { describe, expect, it } from 'vitest'
import type { DateColumnItem } from '../src/picker/date'
import {
  buildDateColumns,
  formatDate,
  getDateColumnGenerators,
} from '../src/picker/date'

const NOW = new Date(2026, 5, 15, 10, 30) // 2026-06-15 10:30

describe('getDateColumnGenerators', () => {
  it('builds date type as Year/Month/Date', () => {
    const { generators } = getDateColumnGenerators({ type: 'date', now: NOW })
    expect(generators.map(g => g.type)).toEqual(['Year', 'Month', 'Date'])
  })

  it('builds time type as Hour/Minute', () => {
    const { generators } = getDateColumnGenerators({ type: 'time', now: NOW })
    expect(generators.map(g => g.type)).toEqual(['Hour', 'Minute'])
  })

  it('builds datetime type as five columns', () => {
    const { generators } = getDateColumnGenerators({ type: 'datetime', now: NOW })
    expect(generators.map(g => g.type)).toEqual(['Year', 'Month', 'Date', 'Hour', 'Minute'])
  })

  it('builds custom types in given order', () => {
    const { generators } = getDateColumnGenerators({
      type: 'custom',
      customTypes: ['hh', 'yyyy'],
      now: NOW,
    })
    expect(generators.map(g => g.type)).toEqual(['Hour', 'Year'])
  })
})

describe('列内容生成', () => {
  it('generates year column centered on now by default', () => {
    const { columns } = buildDateColumns({ type: 'date', now: NOW })
    const years = columns[0]
    expect(years[0].value).toBe(2006)
    expect(years.at(-1)!.value).toBe(2046)
    expect(years[20].text).toBe('2026年')
    expect(years[20].typeFormat).toBe('yyyy')
  })

  it('respects minDate/maxDate year range', () => {
    const { columns } = buildDateColumns({
      type: 'date',
      now: NOW,
      minDate: new Date(2020, 0, 1),
      maxDate: new Date(2030, 11, 31),
    })
    expect(columns[0][0].value).toBe(2020)
    expect(columns[0].at(-1)!.value).toBe(2030)
  })

  it('limits month column when year equals min/max year', () => {
    const { columns } = buildDateColumns({
      type: 'date',
      now: NOW,
      defaultDate: new Date(2020, 5, 15),
      minDate: new Date(2020, 2, 10), // 2020-03-10
      maxDate: new Date(2020, 9, 20), // 2020-10-20
    })
    expect(columns[0].at(-1)!.value).toBe(2020)
    expect(columns[1][0].value).toBe(3)
    expect(columns[1].at(-1)!.value).toBe(10)
  })

  it('handles leap year february and 30-day months', () => {
    // 注意 v2 契约：Date 列长度由「当前年 + 选中月」计算，
    // 需包含 yyyy 列才能按 defaultDate 的年份判断闰月
    const leap = buildDateColumns({
      type: 'custom',
      customTypes: ['yyyy', 'MM', 'dd'],
      defaultDate: new Date(2020, 1, 10),
      now: NOW,
    })
    expect(leap.columns[2].at(-1)!.value).toBe(29) // 2020-02 闰月

    const april = buildDateColumns({
      type: 'custom',
      customTypes: ['yyyy', 'MM', 'dd'],
      defaultDate: new Date(2021, 3, 10),
      now: NOW,
    })
    expect(april.columns[2].at(-1)!.value).toBe(30)
  })

  it('applies minuteStep to minute column', () => {
    const { columns } = buildDateColumns({
      type: 'time',
      minuteStep: 5,
      now: NOW,
    })
    expect(columns[1].map(i => i.value)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
    expect(columns[1][1].text).toBe('5分')
  })

  it('marks today with todayText', () => {
    // v2 契约：todayText 仅在当前列选中的年月等于 now 的年月时生效
    const { columns } = buildDateColumns({
      type: 'date',
      now: NOW,
      defaultDate: NOW,
      todayText: '今天(&)',
    })
    const dayCol = columns[2]
    // v2 契约：& 被替换为含单位的原文本
    expect(dayCol.find(i => i.value === 15)!.text).toBe('今天(15日)')
  })

  it('renders text via textRender', () => {
    const { columns } = buildDateColumns({
      type: 'time',
      now: NOW,
      textRender: (typeFormat, ...args) => {
        void args
        return `${typeFormat}-x`
      },
    })
    // v2 契约：textRender 收到的是 TYPE_FORMAT_INVERSE（Hour -> hh）
    expect(columns[0][0].text).toBe('hh-x')
    expect(columns[1][0].text).toBe('mm-x')
  })

  it('clamps defaultDate into min/max range', () => {
    const out = buildDateColumns({
      type: 'date',
      now: NOW,
      defaultDate: new Date(2030, 0, 1),
      minDate: new Date(2020, 0, 1),
      maxDate: new Date(2025, 11, 31),
    })
    // defaultDate 超上限 → 使用 maxDate 所在年月初始化列
    expect(out.columns[0].at(-1)!.value).toBe(2025)
  })

  it('returns default column values for defaultDate', () => {
    const { defaults } = buildDateColumns({
      type: 'date',
      now: NOW,
      defaultDate: new Date(2024, 3, 8),
    })
    expect(defaults).toEqual([2024, 4, 8])
  })
})

describe('formatDate', () => {
  it('formats column values with zero padding', () => {
    const values: DateColumnItem[] = [
      { text: '2024年', value: 2024, type: 'Year', typeFormat: 'yyyy' },
      { text: '4月', value: 4, type: 'Month', typeFormat: 'MM' },
      { text: '8日', value: 8, type: 'Date', typeFormat: 'dd' },
    ]
    // v2 契约：默认格式中的 hh:mm 分段未被列值替换时原样保留
    expect(formatDate(values)).toBe('2024-04-08 hh:mm')
    expect(formatDate(values, 'yyyy年MM月dd日')).toBe('2024年04月08日')
  })

  it('handles HH as hh', () => {
    const values: DateColumnItem[] = [
      { text: '9时', value: 9, type: 'Hour', typeFormat: 'hh' },
      { text: '5分', value: 5, type: 'Minute', typeFormat: 'mm' },
    ]
    expect(formatDate(values, 'hh:mm')).toBe('09:05')
    expect(formatDate(values, 'HH:mm')).toBe('09:05')
  })
})

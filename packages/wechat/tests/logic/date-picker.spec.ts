/**
 * date-picker 纯逻辑测试：列生成边界（minuteStep 钳制、闰月、min/max 联动、
 * customTypes、todayText）、defaultDate 钳制与 formatDate，对照 core/picker/date.ts。
 */
import {describe, it, expect, vi, afterEach} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'
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

// ---------------------------------------------------------------------------
// date-picker 组件实例（index.ts）：attached 列初始化 / observers / cu-picker
// 事件桥接 / 快照恢复（定时器）/ getFormatDate
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/date-picker/index'))

interface PickerStub {
  refreshCount: number
  values: DateColumnItem[]
  refresh(): void
  getColumnValues(): DateColumnItem[]
}

function fakePicker(values: DateColumnItem[] = []): PickerStub {
  return {
    refreshCount: 0,
    values,
    refresh() {
      this.refreshCount++
    },
    getColumnValues() {
      return this.values
    },
  }
}

function mountDatePicker(props: Record<string, unknown> = {}, picker: PickerStub | null = null) {
  let selects = 0
  const inst: Mounted = mountDef(comp.def, {
    props,
    selectComponent(selector: string) {
      void selector
      selects++
      return picker
    },
  })
  return {inst, selectCount: () => selects}
}

afterEach(() => {
  vi.useRealTimers()
})

describe('date-picker 组件 attached / observers', () => {
  it('attached：type=date 生成三列，pickerDefaults 空；picker.refresh 触发', () => {
    const picker = fakePicker()
    const {inst, selectCount} = mountDatePicker({}, picker)
    inst.attached()
    expect(inst.data.pickerData).toHaveLength(3)
    expect(inst.data.pickerDefaults).toEqual([])
    expect(picker.refreshCount).toBe(1)
    expect(selectCount()).toBe(1)
    // __pickerRef 缓存：再次 initPickerColumn 不重复 selectComponent
    inst.methods.initPickerColumn()
    expect(selectCount()).toBe(1)
    expect(picker.refreshCount).toBe(2)
  })

  it('observer type：date → time 重建为两列', () => {
    const picker = fakePicker()
    const {inst} = mountDatePicker({}, picker)
    inst.attached()
    inst.setData({type: 'time'})
    expect(inst.data.pickerData).toHaveLength(2)
    expect(inst.data.pickerData[0][0].type).toBe('Hour')
    expect(picker.refreshCount).toBe(2)
  })

  it('defaultDate 字符串归一 + min/max Date 对象收窄列边界', () => {
    const {inst} = mountDatePicker({
      type: 'date',
      defaultDate: '2024-01-15',
      minDate: new Date(2024, 0, 10),
      maxDate: new Date(2024, 0, 20),
    })
    inst.attached()
    expect(inst.data.pickerDefaults).toEqual([2024, 1, 15])
    expect(inst.data.pickerData[2]).toHaveLength(11) // 10..20
  })

  it('minuteStep observer：分钟列按步长生成', () => {
    const {inst} = mountDatePicker({type: 'time'})
    inst.attached()
    inst.setData({minuteStep: 15})
    expect(inst.data.pickerData[1].map((i: DateColumnItem) => i.value)).toEqual([0, 15, 30, 45])
  })

  it('unitText：非空数组传入（true 分支）；默认空数组走 undefined 分支', () => {
    const {inst} = mountDatePicker({type: 'time'})
    inst.attached()
    expect(inst.data.pickerData).toHaveLength(2) // unitText [] → undefined 分支
    // unitText 按列槽位（年/月/日/时/分）取用，时列取第 4 项
    inst.setData({unitText: ['年', '月', '日', '时', '分']})
    expect(inst.data.pickerData[0][0].text).toBe('0时')
  })

  it('picker 缺 refresh / selectComponent 返回 null：不崩溃', () => {
    const {inst} = mountDatePicker({}, {refreshCount: 0, values: []} as unknown as PickerStub)
    expect(() => inst.attached()).not.toThrow()

    const bare = mountDatePicker()
    expect(() => bare.inst.attached()).not.toThrow()
    expect(bare.inst.data.pickerData).toHaveLength(3)
    // 无列值：format 不被替换，原样返回
    expect(bare.inst.methods.getFormatDate()).toBe('yyyy-MM-dd hh:mm')
  })

  it('customTypes observer：custom 列序列生效', () => {
    const {inst} = mountDatePicker({type: 'custom', customTypes: ['yyyy', 'MM']})
    inst.attached()
    expect(inst.data.pickerData).toHaveLength(2)
    inst.setData({customTypes: ['yyyy']})
    expect(inst.data.pickerData).toHaveLength(1)
  })
})

describe('date-picker 列联动 __initColumnData', () => {
  const YEAR: DateColumnItem = {text: '2024年', value: 2024, typeFormat: 'yyyy', type: 'Year'}
  const MONTH: DateColumnItem = {text: '1月', value: 1, typeFormat: 'MM', type: 'Month'}

  it('从 columnIndex 起按 picker 当前值重建后续列', () => {
    const picker = fakePicker([YEAR, MONTH])
    const {inst} = mountDatePicker({type: 'date'}, picker)
    inst.attached()
    inst.methods.__initColumnData(1)
    expect(inst.data.pickerData[1]).toHaveLength(12) // 2024 年 12 个月
    expect(inst.data.pickerData[2]).toHaveLength(31) // 2024-01 → 31 天
  })

  it("picker 无 getColumnValues：prev 传 ''（?? '' 分支）", () => {
    const {inst} = mountDatePicker({type: 'date'}, {refreshCount: 0, values: []} as unknown as PickerStub)
    inst.attached()
    inst.methods.__initColumnData(1)
    // prev 为 ''：生成器回退到 now 缺省值，列仍被重建（长度合法）
    expect(inst.data.pickerData[1].length).toBeGreaterThan(0)
    expect(inst.data.pickerData[2].length).toBeGreaterThanOrEqual(28)
  })

  it("pickerData 短于 generators：缺失列 prev 传 ''（else 分支）", () => {
    const {inst} = mountDatePicker({type: 'date'})
    inst.attached()
    inst.setData({pickerData: []})
    inst.methods.__initColumnData(1)
    // 循环内逐列回填：i=1 时 pickerData[0] 缺失走 else，i=2 时 pickerData[1] 已回填
    expect(inst.data.pickerData).toHaveLength(3)
    expect(inst.data.pickerData[1].length).toBe(12)
    expect(inst.data.pickerData[2].length).toBeGreaterThanOrEqual(28)
  })
})

describe('date-picker cu-picker 事件桥接', () => {
  const ITEM: DateColumnItem = {text: '2024年', value: 2024, typeFormat: 'yyyy', type: 'Year'}

  it('onPickerChange：change 透传；非末列触发后续列重建', () => {
    const picker = fakePicker([ITEM])
    const {inst} = mountDatePicker({type: 'date'}, picker)
    inst.attached()
    inst.methods.onPickerChange({detail: {columnIndex: 0, itemIndex: 40, value: ITEM}})
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {columnIndex: 0, itemIndex: 40, value: ITEM}},
    ])
    expect(inst.data.pickerData[1]).toHaveLength(12) // 2024 年联动
  })

  it('onPickerChange：末列不重建（columnIndex < length-1 false 分支）', () => {
    const {inst} = mountDatePicker({type: 'time'})
    inst.attached()
    const before = inst.data.pickerData
    inst.methods.onPickerChange({detail: {columnIndex: 1, itemIndex: 5, value: ITEM}})
    expect(inst.eventsOf('change')).toHaveLength(1)
    expect(inst.data.pickerData).toBe(before)
  })

  it('onPickerConfirm / onPickerShow / onPickerHide / onPickerInitialed 透传', () => {
    const {inst} = mountDatePicker()
    inst.attached()
    inst.methods.onPickerConfirm({detail: {values: [ITEM]}})
    inst.methods.onPickerShow()
    inst.methods.onPickerHide()
    inst.methods.onPickerInitialed()
    expect(inst.eventsOf('confirm')).toEqual([{name: 'confirm', detail: {values: [ITEM]}}])
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)
    expect(inst.eventsOf('initialed')).toHaveLength(1)
    // onPickerShow 快照列数据
    expect((inst as unknown as {__datePicker: {oldColumnData: unknown}}).__datePicker.oldColumnData)
      .toEqual(inst.data.pickerData)
  })

  it('onPickerCancel：定时器异步恢复打开前快照（fake timers）', () => {
    vi.useFakeTimers()
    const {inst} = mountDatePicker({type: 'date'})
    inst.attached()
    const snapshot = inst.data.pickerData
    inst.methods.onPickerShow()
    inst.setData({pickerData: []}) // 模拟联动后列数据被改写
    inst.methods.onPickerCancel()
    expect(inst.eventsOf('cancel')).toHaveLength(1)
    expect(inst.data.pickerData).toEqual([]) // 定时器未到
    vi.advanceTimersByTime(1)
    expect(inst.data.pickerData).toEqual(snapshot) // 恢复快照（深拷贝）
  })

  it('onPickerCancel：无快照（未 onPickerShow）不恢复', () => {
    vi.useFakeTimers()
    const {inst} = mountDatePicker({type: 'date'})
    inst.attached()
    const before = inst.data.pickerData
    inst.methods.onPickerCancel()
    vi.advanceTimersByTime(1)
    expect(inst.data.pickerData).toEqual(before)
  })

  it('detached：清理未决定时器（取消后恢复不再执行）', () => {
    vi.useFakeTimers()
    const {inst} = mountDatePicker({type: 'date'})
    inst.attached()
    inst.methods.onPickerShow()
    inst.setData({pickerData: []})
    inst.methods.onPickerCancel()
    inst.detached()
    expect((inst as unknown as {__datePicker: {timers: {size(): number}}}).__datePicker.timers.size()).toBe(0)
    vi.advanceTimersByTime(10)
    expect(inst.data.pickerData).toEqual([]) // 定时器被清理
  })
})

describe('date-picker getFormatDate（defineExpose）', () => {
  const VALUES: DateColumnItem[] = [
    {text: '2024年', value: 2024, typeFormat: 'yyyy', type: 'Year'},
    {text: '1月', value: 1, typeFormat: 'MM', type: 'Month'},
    {text: '15日', value: 15, typeFormat: 'dd', type: 'Date'},
    {text: '9时', value: 9, typeFormat: 'hh', type: 'Hour'},
    {text: '5分', value: 5, typeFormat: 'mm', type: 'Minute'},
  ]

  it('默认格式 yyyy-MM-dd hh:mm；自定义格式', () => {
    const picker = fakePicker(VALUES)
    const {inst} = mountDatePicker({type: 'datetime'}, picker)
    inst.attached()
    expect(inst.methods.getFormatDate()).toBe('2024-01-15 09:05')
    expect(inst.methods.getFormatDate('yyyy/MM/dd')).toBe('2024/01/15')
  })

  it('picker 无 getColumnValues：空串结果', () => {
    const {inst} = mountDatePicker({}, {refreshCount: 0, values: []} as unknown as PickerStub)
    inst.attached()
    expect(inst.methods.getFormatDate('yyyy-MM-dd')).toBe('yyyy-MM-dd')
  })
})

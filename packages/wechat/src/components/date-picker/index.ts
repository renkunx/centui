/**
 * Source: packages/vue/src/components/date-picker/DatePicker.vue
 *
 * 基于 cu-picker 组合（年/月/日/时/分列），列数据生成逻辑在 ./logic.ts
 * （对齐 @centui/core/picker/date.ts 纯函数，禁用 /web 子入口）。
 *
 * 映射：
 *  props    modelValue→show, type(date/time/datetime/custom), customTypes,
 *           minDate/maxDate/defaultDate（Date | 时间戳数字 | 'yyyy-MM-dd' 字符串，
 *           归一见 logic.toDate——差异 3）, minuteStep(1), unitText, todayText,
 *           textRender（no-op，差异 2）, isView, title, describe, okText, cancelText,
 *           maskClosable, lineHeight, keepIndex, largeRadius
 *  events   update:modelValue→change {value}；initialed；change {columnIndex,itemIndex,value}；
 *           confirm {values: DateColumnItem[]}；cancel；show / hide
 *  方法     getFormatDate(format?)（Vue defineExpose 契约）
 *
 * 平台差异（有意为之）：
 *  1. 列联动经 cu-picker 的 data 属性重建（非级联 preserve 语义：换列数据保留选中索引、
 *     越界钳位——对齐 PickerColumn refreshScrollerDimensions 行为）。
 *  2. textRender 为函数属性，小程序 properties 不支持函数 → no-op（文案用 unitText/todayText）。
 *  3. minDate/maxDate/defaultDate 接受 Date | 时间戳 | 字符串（wxml 侧无法传 Date 对象，
 *     属性经 logic.toDate 归一；语义与 Vue 一致）。
 *  4. 取消恢复：show 时快照列数据，cancel 后恢复快照（对齐 Vue 修复后语义——恢复列数据、
 *     选中索引保留钳位；popup 模式下 Vue 的 picker.refresh() 在此时序为 no-op，等价）。
 *  5. date-picker.styl 的 .cu-date-picker .column-item 字号覆盖无法跨组件样式隔离作用于
 *     cu-picker 内部节点（差异登记，需页面级覆盖或集成期 DEP 处理）。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  buildDateColumns,
  formatDate,
  toDate,
  type DateColumnGenerator,
  type DateColumnItem,
  type DateColumnTypeFormat,
  type PrevColumnRef,
} from './logic'

/** cu-picker 结构化接口（selectComponent 拿到的是无类型实例） */
interface PickerLike {
  refresh?: (callback?: () => void, startIndex?: number) => void
  getColumnValues?: () => unknown[]
}

interface DatePickerState {
  timers: TimerRegistry
  generators: DateColumnGenerator[]
  oldColumnData: DateColumnItem[][] | null
  picker: PickerLike | null
}

function state(ctx: unknown): DatePickerState {
  const self = ctx as {__datePicker?: DatePickerState}
  if (!self.__datePicker) {
    self.__datePicker = {
      timers: createTimerRegistry(ctx),
      generators: [],
      oldColumnData: null,
      picker: null,
    }
  }
  return self.__datePicker
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue：显隐 */
    show: {type: Boolean, value: false},
    /** date | time | datetime | custom */
    type: {type: String, value: 'date'},
    /** type=custom 时的列类型序列（yyyy/MM/dd/HH/hh/mm） */
    customTypes: {type: Object, value: []},
    /** Date | 时间戳数字 | 'yyyy-MM-dd' 字符串 */
    minDate: {type: Object, value: null},
    maxDate: {type: Object, value: null},
    defaultDate: {type: Object, value: null},
    minuteStep: {type: Number, value: 1},
    unitText: {type: Object, value: []},
    todayText: {type: String, value: ''},
    /** 函数属性不可用：no-op（差异 2） */
    textRender: {type: null, value: null},
    isView: {type: Boolean, value: false},
    title: {type: String, value: ''},
    describe: {type: String, value: ''},
    okText: {type: String, value: ''},
    cancelText: {type: String, value: ''},
    maskClosable: {type: Boolean, value: true},
    lineHeight: {type: Number, value: 45},
    keepIndex: {type: Boolean, value: false},
    largeRadius: {type: Boolean, value: false},
  },

  data: {
    /** 传给 cu-picker 的列数据（DateColumnItem[][]） */
    pickerData: [] as DateColumnItem[][],
    /** 传给 cu-picker 的 defaultValue（defaultDate 各列初值） */
    pickerDefaults: [] as number[],
  },

  observers: {
    'type, minDate, maxDate, defaultDate, minuteStep, customTypes, unitText, todayText'() {
      // 对齐 Vue watch([type, minDate, maxDate, defaultDate, minuteStep])
      this.initPickerColumn()
    },
  },

  lifetimes: {
    attached() {
      this.initPickerColumn()
    },
    detached() {
      state(this).timers.clearAll()
    },
  },

  methods: {
    __coreOptions() {
      const d = this.data
      return {
        type: d.type as 'date' | 'time' | 'datetime' | 'custom',
        customTypes: (d.customTypes || []) as DateColumnTypeFormat[],
        minDate: toDate(d.minDate),
        maxDate: toDate(d.maxDate),
        defaultDate: toDate(d.defaultDate),
        minuteStep: d.minuteStep,
        unitText: Array.isArray(d.unitText) && d.unitText.length ? (d.unitText as string[]) : undefined,
        todayText: d.todayText,
      }
    },

    initPickerColumn() {
      const s = state(this)
      const {generators, defaults, columns} = buildDateColumns(this.__coreOptions())
      s.generators = generators
      this.setData({pickerData: columns, pickerDefaults: defaults})
      // 对齐 Vue：picker.value?.refresh()（popup 未展示时 picker 内部为 no-op）
      const picker = this.__pickerRef()
      if (picker && typeof picker.refresh === 'function') {
        picker.refresh()
      }
    },

    /**
     * 从 columnIndex 起按当前各列选中值重建后续列（v2 $_initColumnData）
     */
    __initColumnData(columnIndex: number) {
      const s = state(this)
      const pickerData = this.data.pickerData.slice()
      const picker = this.__pickerRef()
      const currentValues = (picker && typeof picker.getColumnValues === 'function'
        ? picker.getColumnValues()
        : []) as DateColumnItem[]

      for (let i = columnIndex; i < s.generators.length; i++) {
        const params: PrevColumnRef[] = []
        for (let j = 0; j < i; j++) {
          if (pickerData[j]) {
            const picked = currentValues[j]
            params.push(picked ?? '')
          } else {
            params.push('')
          }
        }
        pickerData[i] = s.generators[i](...params)
      }

      this.setData({pickerData})
    },

    __pickerRef(): PickerLike | null {
      const s = state(this)
      if (!s.picker) {
        s.picker = this.selectComponent('#dp-picker') as unknown as PickerLike | null
      }
      return s.picker
    },

    // ------------------------------------------------------------------
    // cu-picker 事件桥接
    // ------------------------------------------------------------------
    onPickerChange(e: WechatMiniprogram.CustomEvent<{columnIndex: number; itemIndex: number; value: DateColumnItem}>) {
      const {columnIndex, itemIndex, value} = e.detail
      this.triggerEvent('change', {columnIndex, itemIndex, value})
      if (columnIndex < this.data.pickerData.length - 1) {
        this.__initColumnData(columnIndex + 1)
      }
    },

    onPickerConfirm(e: WechatMiniprogram.CustomEvent<{values: DateColumnItem[]}>) {
      this.triggerEvent('confirm', {values: e.detail.values})
    },

    onPickerCancel() {
      this.triggerEvent('cancel')
      // 恢复打开前的列数据快照（差异 4）
      state(this).timers.setTimeout(() => {
        const snapshot = state(this).oldColumnData
        if (snapshot) {
          this.setData({pickerData: snapshot.map((col) => col.slice())})
        }
      }, 0)
    },

    onPickerShow() {
      state(this).oldColumnData = this.data.pickerData.map((col) => col.slice())
      this.triggerEvent('show')
    },

    onPickerHide() {
      this.triggerEvent('hide')
    },

    onPickerInitialed() {
      this.triggerEvent('initialed')
    },

    /** 列选中值格式化为日期字符串（Vue defineExpose） */
    getFormatDate(format = 'yyyy-MM-dd hh:mm'): string {
      const picker = this.__pickerRef()
      const values = (picker && typeof picker.getColumnValues === 'function'
        ? picker.getColumnValues()
        : []) as DateColumnItem[]
      return formatDate(values, format)
    },
  },
})

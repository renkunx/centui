/**
 * Source: packages/vue/src/components/picker/Picker.vue + PickerColumn.vue
 *
 * 映射：
 *  props    modelValue→show(Boolean), isView, title, describe, okText(默认「确认」),
 *           cancelText(默认「取消」), maskClosable, lineHeight(默认 45), keepIndex,
 *           largeRadius, data(PickerColumnItem[][] 或级联树), cols(1), defaultValue,
 *           defaultIndex, invalidIndex, isCascade
 *  events   update:modelValue→change {value:boolean}；initialed；confirm {values}；
 *           cancel；change {columnIndex,itemIndex,value}；show / hide（popup 桥接）
 *  slots    无（Vue 版亦无插槽；列内容由 data 驱动）
 *  方法     refresh(cb?, startIndex?) / getColumnValues / getColumnValue /
 *           getColumnIndex / getColumnIndexs（Vue defineExpose 契约）
 *           + setValue/getValue（本批要求的便捷扩展，见差异 6）+ setColumnValues（级联接口）
 *
 * 平台差异（有意为之）：
 *  1. Scroller(@centui/core/web) → shared/drag-ticker 逻辑层惯性内核：速度每帧 ×0.95、
 *     越界 0.5 阻尼；触摸位移按 750/windowWidth 换算到 rpx 空间，transform 经
 *     OffsetFlusher 16ms 节流 setData。无 view 线程级流畅度。
 *  2. 列触摸面（.cu-picker-column-hooks）以 catch:touchmove 锁滚动穿透
 *     （Vue 版 touchmove preventDefault 等价）。
 *  3. 几何全部由 props 推导（rpx 空间），无 DOM 测量——Vue 版 popup 首开前不初始化
 *     scroller 的时序约束不复存在，attached 即构建（initialed 提前触发，语义不变）。
 *  4. 弹层 z-index（picker-zindex）无法跨组件样式隔离作用于 cu-popup
 *     （picker.styl 的 .cu-picker .cu-popup 规则失效），弹层用 popup 默认层级；
 *     需要调整时由页面层对 cu-popup 施加 cu-class 覆盖。
 *  5. 确认守卫对齐 Vue：任一列滚动/动画中 confirm 忽略（ticker 活动标志位）；
 *     取消恢复：级联模式回退到「本次打开后 100ms 的选中快照」（Vue oldActivedIndexs），
 *     非级联模式保持现场（Vue resetPickerColumn 仅级联生效）。
 *  6. setValue(indexs)/getValue() 为批次要求的便捷扩展（Vue 版无此 API）。
 *  7. okText/cancelText 经 observer 响应式解析默认词条（Vue setup 常量，等价）。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {createDragTicker, type DragTicker} from '../../shared/drag-ticker'
import {
  buildColumnViews,
  cascadeRootOf,
  clampIndex,
  columnHeightOf,
  expandCascade,
  findValidIndex,
  indexOfOffset,
  isInvalidIndex,
  maskerHeightOf,
  maxOffsetOf,
  OffsetFlusher,
  offsetOfIndex,
  resolveDefaultIndexs,
  type ColumnView,
  type PickerColumnItem,
} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance
type TouchEvent = WechatMiniprogram.TouchEvent

/** 组件私有状态（不入 data） */
interface PickerState {
  timers: TimerRegistry
  flusher: OffsetFlusher
  tickers: Array<DragTicker | undefined>
  columnItems: PickerColumnItem[][]
  activeIndexs: number[]
  scrolling: boolean[]
  dragDirection: Array<1 | -1>
  lastOffsets: number[]
  initialed: boolean
  /** 是否已用真实数据解析过默认选中（首帧空数据的 preserve 回退 defaults） */
  resolved: boolean
  isFirstPopup: boolean
  snapshotIndexs: number[] | null
  ratio: number
}

function state(ctx: unknown): PickerState {
  const self = ctx as {__picker?: PickerState}
  if (!self.__picker) {
    const host = self as unknown as {setData(patch: Record<string, unknown>): void}
    self.__picker = {
      timers: createTimerRegistry(ctx),
      flusher: new OffsetFlusher((patch) => host.setData(patch)),
      tickers: [],
      columnItems: [],
      activeIndexs: [],
      scrolling: [],
      dragDirection: [],
      lastOffsets: [],
      initialed: false,
      resolved: false,
      isFirstPopup: true,
      snapshotIndexs: null,
      ratio: 0,
    }
  }
  return self.__picker
}

function refreshButtonDefaults(self: {data: Record<string, unknown>; setData(patch: Record<string, unknown>): void}) {
  self.setData({
    actualOkText: self.data.okText || '确认',
    actualCancelText: self.data.cancelText || '取消',
  })
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue：显隐 */
    show: {type: Boolean, value: false},
    isView: {type: Boolean, value: false},
    title: {type: String, value: ''},
    describe: {type: String, value: ''},
    okText: {type: String, value: ''},
    cancelText: {type: String, value: ''},
    maskClosable: {type: Boolean, value: true},
    /** 行高（设计稿 px/rpx），Vue 版 lineHeight ?? 45 */
    lineHeight: {type: Number, value: 45},
    keepIndex: {type: Boolean, value: false},
    largeRadius: {type: Boolean, value: false},
    /** PickerColumnItem[][]（非级联）或级联树（[[nodes]] / 裸节点列表） */
    data: {type: Object, value: []},
    cols: {type: Number, value: 1},
    defaultValue: {type: Object, value: []},
    defaultIndex: {type: Object, value: []},
    invalidIndex: {type: Object, value: []},
    isCascade: {type: Boolean, value: false},
  },

  data: {
    pickerShow: false,
    actualOkText: '确认',
    actualCancelText: '取消',
    columns: [] as ColumnView[],
    maskerHeight: maskerHeightOf(45),
    columnHeight: columnHeightOf(45),
  },

  observers: {
    show(val: boolean) {
      this.setData({pickerShow: !!val})
      if (val) {
        // 对齐 Picker.initPicker：首次打开不快照，其后每次打开 100ms 后快照当前选中
        const s = state(this)
        if (s.isFirstPopup) {
          s.isFirstPopup = false
        } else {
          s.timers.setTimeout(() => {
            s.snapshotIndexs = s.activeIndexs.slice()
          }, 100)
        }
      }
    },
    data() {
      // 对齐 Picker watch(data)：级联全量重建；非级联换数据保留选中（PickerColumn 行为）
      this.__rebuildColumns(state(this).initialed && !this.data.isCascade ? 'preserve' : 'defaults')
    },
    'cols, defaultIndex, defaultValue'() {
      // 对齐 Picker watch(defaultIndex)/initPickerColumn：仅级联响应
      if (this.data.isCascade) {
        this.__rebuildColumns('defaults')
      }
    },
    isCascade() {
      this.__rebuildColumns('defaults')
    },
    'okText, cancelText'() {
      refreshButtonDefaults(this)
    },
    lineHeight(val: number) {
      const lh = val > 0 ? val : 45
      this.setData({maskerHeight: maskerHeightOf(lh), columnHeight: columnHeightOf(lh)})
      // 行高变化后按新几何重落位
      if (state(this).initialed) {
        this.__rebuildColumns('preserve')
      }
    },
  },

  lifetimes: {
    attached() {
      const s = state(this)
      const lh = this.data.lineHeight > 0 ? this.data.lineHeight : 45
      this.setData({maskerHeight: maskerHeightOf(lh), columnHeight: columnHeightOf(lh)})
      refreshButtonDefaults(this)
      this.__rebuildColumns('defaults')
      void s
    },
    detached() {
      const s = state(this)
      s.tickers.forEach((ticker) => ticker?.destroy())
      s.tickers = []
      s.flusher.clear()
      s.timers.clearAll()
    },
  },

  relations: {
    '../popup/index': {
      type: 'descendant', // 基础库 3.8 实测：'child' 在「子组件由页面模板引用」时 relation 匹配崩溃渲染层，descendant 语义等价
      linked(this: unknown, popup: Instance) {
        ;(this as unknown as {__popup?: Instance}).__popup = popup
        popup.setLargeRadius(!!(this as {data?: Record<string, unknown>}).data?.largeRadius)
      },
      unlinked(this: unknown) {
        ;(this as unknown as {__popup?: Instance | null}).__popup = null
      },
    },
  },

  methods: {
    // ------------------------------------------------------------------
    // 列构建与滚动内核
    // ------------------------------------------------------------------
    __touchRatio(): number {
      const s = state(this)
      if (!s.ratio) {
        let windowWidth = 375
        try {
          const info = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync()
          if (info && info.windowWidth > 0) windowWidth = info.windowWidth
        } catch (e) {
          void e
        }
        s.ratio = 750 / windowWidth
      }
      return s.ratio
    },

    /**
     * 重建列视图与 ticker。
     * @param mode defaults=按 defaultIndex/defaultValue 重解析；preserve=保留选中（钳位）；
     *             snapshot=按打开时快照（级联取消恢复）
     */
    __rebuildColumns(mode: 'defaults' | 'preserve' | 'snapshot') {
      const s = state(this)
      const d = this.data
      const ih = d.lineHeight > 0 ? d.lineHeight : 45
      const invalidIndex = (d.invalidIndex || []) as Array<number | number[]>

      let columns: PickerColumnItem[][] = []
      let indexs: number[] = []

      if (d.isCascade) {
        const cols = Math.max(1, Math.floor(d.cols) || 1)
        const picks =
          mode === 'preserve'
            ? s.activeIndexs.map((v) => (typeof v === 'number' ? v : undefined))
            : mode === 'snapshot'
              ? ((s.snapshotIndexs || []) as Array<number | undefined>)
              : []
        const res = expandCascade(
          cascadeRootOf(Array.isArray(d.data) ? d.data : []),
          cols,
          picks,
          mode === 'preserve' ? [] : ((d.defaultIndex || []) as number[]),
          mode === 'preserve' ? [] : ((d.defaultValue || []) as unknown[]),
        )
        columns = res.columns
        indexs = res.indexs
      } else {
        const flat = (Array.isArray(d.data) ? d.data : []) as PickerColumnItem[][]
        const colCount = Math.max(Math.floor(d.cols) || 1, flat.length)
        for (let i = 0; i < colCount; i++) {
          columns[i] = flat[i] || []
        }
        indexs =
          mode === 'preserve' && s.resolved
            ? columns.map((items, i) => clampIndex(s.activeIndexs[i] ?? 0, items.length))
            : resolveDefaultIndexs(columns, d.defaultIndex as number[], (d.defaultValue || []) as unknown[])
      }

      s.columnItems = columns
      s.activeIndexs = indexs
      s.tickers.forEach((ticker) => ticker?.destroy())
      s.tickers = columns.map((items, i) => {
        s.scrolling[i] = false
        s.dragDirection[i] = 1
        s.lastOffsets[i] = offsetOfIndex(indexs[i], ih)
        return createDragTicker({
          min: 0,
          max: maxOffsetOf(items.length, ih),
          onTranslate: (offset, source) => {
            s.scrolling[i] = true
            if (source === 'drag') {
              const last = s.lastOffsets[i]
              if (offset !== last) s.dragDirection[i] = offset > last ? 1 : -1
              s.lastOffsets[i] = offset
            }
            s.flusher.set(`columns[${i}].offset`, offset)
          },
          onStop: (offset) => {
            s.scrolling[i] = false
            this.__onColumnStop(i, offset)
          },
        })
      })

      this.setData({columns: buildColumnViews(columns, indexs, invalidIndex, ih)})

      // ticker 初始 offset 落位（无动画直达，onStop 与选中一致不触发 change）
      columns.forEach((items, i) => {
        if (items.length) {
          s.tickers[i]?.scrollTo(offsetOfIndex(indexs[i], ih), false)
        }
      })

      if (!s.resolved && columns.length > 0 && columns[0].length > 0) {
        s.resolved = true
      }
      if (s.resolved && !s.initialed) {
        s.initialed = true
        this.triggerEvent('initialed')
      }
    },

    /** 滚动停止：吸附到最近项；invalid 项按拖动方向寻找有效项（对齐 onColumnScrollEnd） */
    __onColumnStop(columnIndex: number, offset: number) {
      const s = state(this)
      const d = this.data
      const ih = d.lineHeight > 0 ? d.lineHeight : 45
      const invalidIndex = (d.invalidIndex || []) as Array<number | number[]>
      const items = s.columnItems[columnIndex] || []
      const ticker = s.tickers[columnIndex]
      if (!items.length || !ticker) return

      let idx = clampIndex(indexOfOffset(offset, ih), items.length)
      if (isInvalidIndex(invalidIndex, columnIndex, idx)) {
        idx = findValidIndex(items, invalidIndex, columnIndex, idx, s.dragDirection[columnIndex] ?? 1)
        ticker.scrollTo(offsetOfIndex(idx, ih), true)
        return
      }

      if (idx !== s.activeIndexs[columnIndex]) {
        s.activeIndexs[columnIndex] = idx
        s.flusher.set(`columns[${columnIndex}].activeIndex`, idx)
        this.triggerEvent('change', {
          columnIndex,
          itemIndex: idx,
          value: items[idx],
        })
        ticker.scrollTo(offsetOfIndex(idx, ih), true)
      } else {
        const target = offsetOfIndex(idx, ih)
        if (Math.abs(target - offset) > 0.01) {
          ticker.scrollTo(target, true)
        }
      }
    },

    // ------------------------------------------------------------------
    // 列触摸（hooks 面，catch 锁滚动穿透）
    // ------------------------------------------------------------------
    onColumnTouchStart(e: TouchEvent) {
      const i = Number(e.currentTarget.dataset.column)
      const ticker = state(this).tickers[i]
      if (!ticker) return
      const touch = e.touches && e.touches[0]
      if (!touch) return
      const r = this.__touchRatio()
      ticker.onTouchStart(touch.pageX * r, touch.pageY * r)
    },

    onColumnTouchMove(e: TouchEvent) {
      const i = Number(e.currentTarget.dataset.column)
      const ticker = state(this).tickers[i]
      if (!ticker) return
      const touch = e.touches && e.touches[0]
      if (!touch) return
      const r = this.__touchRatio()
      ticker.onTouchMove(touch.pageX * r, touch.pageY * r)
    },

    onColumnTouchEnd(e: TouchEvent) {
      const i = Number(e.currentTarget.dataset.column)
      const ticker = state(this).tickers[i]
      if (ticker) ticker.onTouchEnd()
    },

    // ------------------------------------------------------------------
    // popup 事件桥接
    // ------------------------------------------------------------------
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail && e.detail.value === false) {
        this.setData({pickerShow: false})
        this.triggerEvent('change', {value: false})
      }
    },

    onPopupBeforeShow() {
      // 对齐 onPickerBeforeShow：首开前确保列已构建（本实现 attached 已构建，兜底）
      if (!state(this).initialed) {
        this.__rebuildColumns('defaults')
      }
    },

    onPopupShow() {
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.triggerEvent('hide')
    },

    onPopupMaskClick() {
      this.onPickerCancel()
    },

    // ------------------------------------------------------------------
    // 确认 / 取消
    // ------------------------------------------------------------------
    onPickerConfirm() {
      // Vue 守卫：任一列滚动/动画中忽略确认
      if (state(this).scrolling.some(Boolean)) return
      this.setData({pickerShow: false})
      this.triggerEvent('confirm', {values: this.getColumnValues()})
    },

    onPickerCancel() {
      if (this.data.pickerShow) {
        this.setData({pickerShow: false})
      }
      this.triggerEvent('cancel')
      // 级联取消：100ms 后按快照恢复（对齐 resetPickerColumn + oldActivedIndexs）
      state(this).timers.setTimeout(() => {
        if (this.data.isCascade) {
          this.__rebuildColumns(state(this).snapshotIndexs ? 'snapshot' : 'defaults')
        }
      }, 100)
    },

    // ------------------------------------------------------------------
    // 公开 API（Vue defineExpose 契约 + 批次扩展）
    // ------------------------------------------------------------------
    refresh(callback?: () => void, startIndex = 0) {
      if (this.data.isView || this.data.pickerShow) {
        this.__rebuildColumns(startIndex ? 'preserve' : 'defaults')
      }
      if (typeof callback === 'function') callback()
    },

    getColumnValues(): PickerColumnItem[] {
      const s = state(this)
      return s.columnItems.map((items, i) => items[s.activeIndexs[i]])
    },

    getColumnValue(index = 0): PickerColumnItem | undefined {
      return this.getColumnValues()[index]
    },

    getColumnIndex(index = 0): number | undefined {
      return state(this).activeIndexs[index]
    },

    getColumnIndexs(): number[] {
      return state(this).activeIndexs.slice()
    },

    /** 批次扩展：按索引设置各列选中（滚动动画落位） */
    setValue(indexs: number[]) {
      const s = state(this)
      const ih = this.data.lineHeight > 0 ? this.data.lineHeight : 45
      indexs.forEach((raw, i) => {
        const items = s.columnItems[i] || []
        if (!items.length) return
        const idx = clampIndex(Math.floor(raw) || 0, items.length)
        if (idx === s.activeIndexs[i]) return
        s.activeIndexs[i] = idx
        s.flusher.set(`columns[${i}].activeIndex`, idx)
        s.tickers[i]?.scrollTo(offsetOfIndex(idx, ih), true)
        this.triggerEvent('change', {columnIndex: i, itemIndex: idx, value: items[idx]})
      })
    },

    /** 批次扩展：当前选中值（getColumnValues 别名） */
    getValue(): PickerColumnItem[] {
      return this.getColumnValues()
    },

    /** 级联接口（Vue PICKER_COLUMN_API_LIST）：替换某列数据，keepIndex=false 时选中归 0 */
    setColumnValues(index: number, values: PickerColumnItem[]) {
      const s = state(this)
      const d = this.data
      if (index === undefined || index < 0 || !Array.isArray(values)) return
      const ih = d.lineHeight > 0 ? d.lineHeight : 45
      s.columnItems[index] = values
      if (!d.keepIndex) {
        s.activeIndexs[index] = 0
      } else {
        s.activeIndexs[index] = clampIndex(s.activeIndexs[index] ?? 0, values.length)
      }
      s.tickers[index]?.destroy()
      s.tickers[index] = createDragTicker({
        min: 0,
        max: maxOffsetOf(values.length, ih),
        onTranslate: (offset, source) => {
          s.scrolling[index] = true
          if (source === 'drag') s.dragDirection[index] = offset > s.lastOffsets[index] ? 1 : -1
          s.lastOffsets[index] = offset
          s.flusher.set(`columns[${index}].offset`, offset)
        },
        onStop: (offset) => {
          s.scrolling[index] = false
          this.__onColumnStop(index, offset)
        },
      })
      const views = buildColumnViews(
        s.columnItems,
        s.activeIndexs,
        (d.invalidIndex || []) as Array<number | number[]>,
        ih,
      )
      this.setData({[`columns[${index}]`]: views[index]})
      s.tickers[index]?.scrollTo(offsetOfIndex(s.activeIndexs[index], ih), false)
    },
  },
})

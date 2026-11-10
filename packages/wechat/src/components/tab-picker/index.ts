/**
 * Source: packages/vue/src/components/tab-picker/TabPicker.vue
 *
 * 多级异步 tab 选择（popup + 自绘 tab 条 + 自绘 radio 选项列表）。
 *
 * 映射：
 *  props    modelValue→show, data(TabPickerNode), defaultValue(Array),
 *           placeholder(默认「请选择」), title, describe, maskClosable, largeRadius
 *  events   update:modelValue→change {value:boolean}（与 Vue change({values,options})
 *           合并为同一事件：选择完成路径载荷 {value:false, values, options}，
 *           其余关闭路径 {value:false}——差异 3）；select {index,value,option}；show / hide
 *  slots    默认插槽为作用域插槽（option）→ 小程序无作用域插槽，选项恒按 label/value
 *           文本自绘（差异 2）
 *  方法     getSelectedValues() / getSelectedOptions()（Vue defineExpose 契约）
 *
 * 平台差异（有意为之）：
 *  1. CuTabs/CuTabPane/CuScrollView/CuRadioList 组合 → 自绘：头部 tab 条复用
 *     tab-bar.styl 类名（.cu-tab-bar-list/.cu-tab-bar-item，构建期 DEP 编入），
 *     选项复用 radio.styl/cell-item.styl 类名（同 selector 自绘先例——样式隔离下
 *     后代选择器必须与节点同树）；内容区用原生 scroll-view（scroll-y / scroll-x）。
 *  2. 作用域插槽不可用 → 选项文本渲染（label ?? value）。
 *  3. Vue 的 update:modelValue 与 change 为两个事件，小程序按 §3.2 约定 v-model 走
 *     'change'；选择完成事件并入 'change' 载荷（values/options 字段），并用
     __suppressChange 抑制 popup 桥接的重复发射。
 *  4. tabsTmpKey 强制重挂载（取消恢复）不需要——panes/cells 全量重建即等价。
 *  5. 弹层 z-index（tab-picker-zindex）跨组件样式隔离不生效，同 picker 差异 4。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  buildPaneCells,
  buildPanes,
  spliceSelected,
  type TabPickerCell,
  type TabPickerNode,
  type TabPickerOption,
  type TabPickerPane,
} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

interface TabPickerState {
  timers: TimerRegistry
  oldSelected: Array<string | number>
  oldCurrentTab: string
  suppressChange: boolean
  popup: Instance | null
}

function state(ctx: unknown): TabPickerState {
  const self = ctx as {__tabPicker?: TabPickerState}
  if (!self.__tabPicker) {
    self.__tabPicker = {
      timers: createTimerRegistry(ctx),
      oldSelected: [],
      oldCurrentTab: '',
      suppressChange: false,
      popup: null,
    }
  }
  return self.__tabPicker
}

/** 结构化上下文（helper 以宽松形态访问 data，方法内 this 已具名类型化） */
interface TabPickerCtx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

function refreshPanes(self: TabPickerCtx) {
  const d = self.data
  const panes = buildPanes(
    d.data as TabPickerNode,
    (d.selected || []) as Array<string | number>,
    (d.placeholder as string) || '请选择',
  )
  const current = panes.find((p) => p.name === d.currentTab)
  const cells = buildPaneCells(current)
  // 对齐 Vue watch(panes)：panes 重算后 currentTab 推进到最后一个面板
  const nextTab = panes.length ? panes[panes.length - 1].name : ''
  self.setData({panes, cells, currentTab: nextTab, currentIndex: Math.max(0, panes.length - 1)})
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue：显隐 */
    show: {type: Boolean, value: false},
    /** TabPickerNode 树 */
    data: {type: Object, value: {}},
    /** Array<string | number> 初始选中路径 */
    defaultValue: {type: Object, value: []},
    placeholder: {type: String, value: '请选择'},
    title: {type: String, value: ''},
    describe: {type: String, value: ''},
    maskClosable: {type: Boolean, value: true},
    largeRadius: {type: Boolean, value: false},
  },

  data: {
    pickerShow: false,
    selected: [] as Array<string | number>,
    panes: [] as TabPickerPane[],
    cells: [] as TabPickerCell[],
    currentTab: '',
    currentIndex: 0,
    paneScrollTop: 0,
    tabIntoView: '',
  },

  observers: {
    show(val: boolean) {
      this.setData({pickerShow: !!val})
    },
    defaultValue(val: Array<string | number>) {
      if (Array.isArray(val) && val.length) {
        this.setData({selected: val.slice()})
      }
    },
    'data, selected, placeholder'() {
      refreshPanes(this)
    },
  },

  lifetimes: {
    attached() {
      const s = state(this)
      const dv = this.data.defaultValue
      const selected = Array.isArray(dv) && dv.length ? (dv as Array<string | number>).slice() : []
      this.setData({selected})
      refreshPanes(this)
      void s
    },
    detached() {
      state(this).timers.clearAll()
    },
  },

  relations: {
    '../popup/index': {
      type: 'descendant', // 基础库 3.8 实测：'child' 在「子组件由页面模板引用」时 relation 匹配崩溃渲染层，descendant 语义等价
      linked(this: unknown, popup: Instance) {
        ;(this as unknown as {__tabPicker?: TabPickerState}).__tabPicker!.popup = popup
        popup.setLargeRadius(!!(this as {data?: Record<string, unknown>}).data?.largeRadius)
      },
      unlinked(this: unknown) {
        ;(this as unknown as {__tabPicker?: TabPickerState}).__tabPicker!.popup = null
      },
    },
  },

  methods: {
    // ------------------------------------------------------------------
    // popup 桥接
    // ------------------------------------------------------------------
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail && e.detail.value === false) {
        this.setData({pickerShow: false})
        if (!state(this).suppressChange) {
          this.triggerEvent('change', {value: false})
        }
        state(this).suppressChange = false
      }
    },

    onPopupShow() {
      const s = state(this)
      // 对齐 onPopupShow：展示稳定后快照（取消恢复用）
      s.timers.setTimeout(() => {
        s.oldSelected = (this.data.selected as Array<string | number>).slice()
        s.oldCurrentTab = this.data.currentTab
      }, 100)
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.triggerEvent('hide')
    },

    // ------------------------------------------------------------------
    // 取消（only-close 关闭钮 / 遮罩）
    // ------------------------------------------------------------------
    onCancel() {
      const s = state(this)
      if (this.data.pickerShow) {
        this.setData({pickerShow: false})
      }
      s.timers.setTimeout(() => {
        this.setData({
          selected: s.oldSelected.slice(),
          currentTab: s.oldCurrentTab,
        })
      }, 100)
    },

    // ------------------------------------------------------------------
    // tab 条 / 选项
    // ------------------------------------------------------------------
    onTabTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const pane = (this.data.panes as TabPickerPane[])[index]
      if (!pane) return
      this.setData({
        currentTab: pane.name,
        currentIndex: index,
        cells: buildPaneCells(pane),
        // 切回前面 tab 时内容滚动条复位（scroll-top 同值不触发，用 0/0.1 交替）
        paneScrollTop: this.data.paneScrollTop > 0 ? 0 : 0.1,
        tabIntoView: `tp-tab-${index}`,
      })
    },

    onOptionTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const tappedPaneIndex = this.data.currentIndex
      const pane = (this.data.panes as TabPickerPane[])[tappedPaneIndex]
      const option = pane && pane.options[index]
      if (!option || (option as {disabled?: boolean}).disabled) return
      const value = option.value as string | number
      // 对齐 onSelectPaneItem：截断写入选中路径
      this.setData({selected: spliceSelected(this.data.selected as Array<string | number>, tappedPaneIndex, value)})
      // v2 契约：nextTick 后推进 tab / 触发 select / change。
      // 注意 selected observer 会同步把 currentIndex 推进到末层面板，
      // 必须传捕获的面板序号（Vue 版 onSelectPaneItem 以参数传入 index，同语义）
      state(this).timers.setTimeout(() => this.__afterSelect(value, tappedPaneIndex), 0)
    },

    __afterSelect(value: string | number, index: number) {
      const s = state(this)
      const panes = this.data.panes as TabPickerPane[]
      const pane = panes[index]
      this.triggerEvent('select', {index, value, option: pane ? pane.selected : undefined})

      const nextPane = panes[index + 1]
      if (nextPane) {
        this.setData({
          // selected observer 已重建 panes/currentTab；此处确保视图同步
          currentTab: nextPane.name,
          currentIndex: index + 1,
          cells: buildPaneCells(nextPane),
          paneScrollTop: this.data.paneScrollTop > 0 ? 0 : 0.1,
          tabIntoView: `tp-tab-${index + 1}`,
        })
      } else if (value !== '') {
        s.timers.setTimeout(() => {
          s.suppressChange = true
          this.triggerEvent('change', {
            value: false,
            values: this.getSelectedValues(),
            options: this.getSelectedOptions(),
          })
          this.setData({pickerShow: false})
        }, 300)
      }
    },

    // ------------------------------------------------------------------
    // 公开 API（Vue defineExpose 契约）
    // ------------------------------------------------------------------
    getSelectedValues(): Array<string | number> {
      return (this.data.selected as Array<string | number>).slice()
    },

    getSelectedOptions(): TabPickerOption[] {
      return (this.data.panes as TabPickerPane[])
        .filter((pane) => pane.value !== undefined && pane.value !== '')
        .map((pane) => pane.selected as TabPickerOption)
        .filter(Boolean)
    },
  },
})

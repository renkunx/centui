/**
 * Source: packages/vue/src/components/action-sheet/ActionSheet.vue + index.ts
 *
 * 映射：
 *  props    modelValue→show(false), title(''), options([]), defaultIndex(-1),
 *           invalidIndex(-1, number|number[]), cancelText(''→locale「取消」),
 *           maxHeight(400，Vue 模板未使用——保留属性 no-op，差异声明)
 *  events   update:modelValue→change({value:false})；show / hide（popup 转发，时机对齐）；
 *           selected({item, index})(Vue 载荷为 option 对象，index 为小程序附加字段)；
 *           cancel
 *  slots    无（Vue 版无插槽；选项/取消均为数据驱动渲染）
 *  methods  show(options)/hide()（§6 一等 API）
 *
 * 命令式 API（页面需放置 <cu-action-sheet id="cu-action-sheet" />）：
 *   import {ActionSheet} from '.../components/action-sheet/index'
 *   const result = await ActionSheet.create(this, {title, options})  // {index,text} | {cancel:true}
 *   实现见 ./factory.ts（可独立测试）。
 *
 * 平台差异（有意为之）：
 *  1. 无 teleport：popup 渲染在组件位置，z-index/盒底色经 action-sheet.wxss 的
 *     .cu-action-sheet .cu-popup(.cu-popup-box) 规则（shared 隔离）覆盖 popup 默认值。
 *  2. 项文本 v-html → <rich-text>（§8）。
 *  3. create 为单例收敛：同一弹层组件上重复 create 时前一个未决 Promise 以 {cancel:true}
 *     settle（Vue 版为独立容器并行挂载）。
 *  4. 关闭链路的 change 事件可能多次派发（select→hideSheet、popup change 回流、popup hide
 *     ——对齐 Vue 版三处各派发一次的 v2 契约）。
 *  5. invalidIndex 以归一化数组参与判断（normalizeInvalidIndex），-1 视为无禁用。
 */
import {CuComponent} from '../../shared/component'
import {optimisticUpdate} from '../../shared/controlled'
import {
  ACTION_SHEET_CANCEL_TEXT,
  isInvalidIndex,
  normalizeInvalidIndex,
  type ActionSheetOption,
} from './logic'
import {ActionSheetFactory} from './factory'

interface ActionSheetState {
  onShow?: () => void
  onHide?: () => void
  onSelected?: (payload: {index: number; item: ActionSheetOption}) => void
  onCancel?: () => void
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** Vue modelValue（受控显隐） */
    show: {type: Boolean, value: false},
    title: {type: String, value: ''},
    options: {type: Object, value: [] as ActionSheetOption[]},
    defaultIndex: {type: Number, value: -1},
    /** number | number[] */
    invalidIndex: {type: Number, optionalTypes: [Array], value: -1},
    /** 传空取 locale 默认「取消」（Vue 为 props.cancelText ?? t(...)） */
    cancelText: {type: String, value: ''},
    /** Vue 模板未使用（v2 遗留属性），保留 no-op */
    maxHeight: {type: Number, value: 400},
  },

  data: {
    innerShow: false,
    clickIndex: -1,
    invalidList: [] as number[],
    cancelTextResolved: ACTION_SHEET_CANCEL_TEXT,
  },

  observers: {
    show(v: boolean) {
      this.setData({innerShow: v})
    },
    defaultIndex(v: number) {
      this.setData({clickIndex: v})
    },
    invalidIndex(val: number | number[]) {
      this.setData({invalidList: normalizeInvalidIndex(val)})
    },
    cancelText(val: string) {
      this.setData({cancelTextResolved: val || ACTION_SHEET_CANCEL_TEXT})
    },
  },

  lifetimes: {
    attached() {
      const self = this as unknown as {__sheetState?: ActionSheetState}
      if (!self.__sheetState) self.__sheetState = {}
      this.setData({
        innerShow: this.data.show,
        clickIndex: this.data.defaultIndex,
        invalidList: normalizeInvalidIndex(this.data.invalidIndex),
        cancelTextResolved: this.data.cancelText || ACTION_SHEET_CANCEL_TEXT,
      })
    },
  },

  methods: {
    /**
     * 命令式入口（对齐 Vue 工厂）：应用选项并显示。
     * _onShow/_onHide/_onSelected/_onCancel 为工厂钩子（函数抽离，不入 setData）；
     * _deferred=true 仅登记配置不显示（create({value:false}) 语义）。
     */
    show(options: Record<string, unknown> = {}) {
      const state =
        (this as unknown as {__sheetState?: ActionSheetState}).__sheetState ?? {}
      const serializable: Record<string, unknown> = {}
      for (const key of ['title', 'options', 'defaultIndex', 'invalidIndex', 'cancelText', 'maxHeight']) {
        if (options[key] !== undefined) serializable[key] = options[key]
      }
      if (typeof options._onShow === 'function') state.onShow = options._onShow as () => void
      if (typeof options._onHide === 'function') state.onHide = options._onHide as () => void
      if (typeof options._onSelected === 'function') {
        state.onSelected = options._onSelected as ActionSheetState['onSelected']
      }
      if (typeof options._onCancel === 'function') state.onCancel = options._onCancel as () => void
      this.setData({...serializable, innerShow: options._deferred ? false : true})
      if (typeof state.onShow === 'function' && !options._deferred) state.onShow()
    },

    hide() {
      this.setData({innerShow: false})
    },

    /** Vue onPopupInput：popup 关闭回流 → hideSheet（change 可能多次派发，见文件头差异 4） */
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail.value) return
      this.hideSheet()
    },

    onPopupShow() {
      const state = (this as unknown as {__sheetState?: ActionSheetState}).__sheetState
      state?.onShow?.()
      this.triggerEvent('show')
    },

    onPopupHide() {
      const state = (this as unknown as {__sheetState?: ActionSheetState}).__sheetState
      state?.onHide?.()
      if (state) state.onHide = undefined
      this.triggerEvent('hide')
      this.hideSheet()
    },

    /** Vue onSelect：禁用位阻断；高亮 + selected + 关闭 */
    onSelect(e: WechatMiniprogram.BaseEvent) {
      const index = Number((e.currentTarget.dataset as {index: number}).index)
      if (isInvalidIndex(index, this.data.invalidList)) return
      this.setData({clickIndex: index})
      const item = ((this.data.options as ActionSheetOption[]) ?? [])[index] ?? {}
      const state = (this as unknown as {__sheetState?: ActionSheetState}).__sheetState
      state?.onSelected?.({index, item})
      this.triggerEvent('selected', {item, index})
      this.hideSheet()
    },

    /** Vue onCancel：cancel + 关闭 */
    onCancel() {
      const state = (this as unknown as {__sheetState?: ActionSheetState}).__sheetState
      state?.onCancel?.()
      this.triggerEvent('cancel')
      this.hideSheet()
    },

    /** Vue hideSheet：内态收起 + emit update:modelValue(false) */
    hideSheet() {
      optimisticUpdate(this, {innerShow: false}, 'change', {value: false})
    },

    noop() {},
  },
})

export {ActionSheetFactory as ActionSheet}
export default ActionSheetFactory

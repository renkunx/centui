/**
 * Source: packages/vue/src/components/selector/Selector.vue
 *
 * 映射：
 *  props    modelValue→show(Boolean), data(SelectorItem[]),
 *           defaultValue(String|Number|Boolean|Array), isCheck, maxHeight('auto'),
 *           minHeight('auto'), title, describe, okText, cancelText(缺省 null，
 *           对齐 Vue undefined ?? 语义), maskClosable, hideTitleBar, multi,
 *           icon(checked), iconInverse(check), iconDisabled(check-disabled),
 *           iconSvg(no-op), iconSize(md), iconPosition(right), largeRadius
 *  events   update:modelValue → change {value:boolean}；choose {item}；
 *           confirm：单选 {item} / 多选 {value: 数组副本}；cancel；show / hide
 *  slots    header / footer（默认插槽为作用域插槽，见差异 4）
 *
 * 结构：cu-popup（bottom + slide-up 状态机）+ cu-popup-title-bar（尚未移植，
 * usingComponents 先挂）+ 原生 scroll-view + 自绘选项列表。
 * largeRadius 经 relations 调 popup.setLargeRadius 回写（对齐 Vue provide/inject
 * 反向通道，参照 popup 范例）。
 *
 * 平台差异：
 *  1. CuScrollView → 原生 scroll-view（scroll-y）；maxHeight/minHeight 内联样式
 *     不参与构建期 px→rpx 换算，建议传 rpx 单位字符串。
 *  2. CuRadioList/CuCheckList 不再嵌套：样式隔离下选择器对 .cu-radio-item/
 *     .cu-check-item 的后代规则（padding/is-selected 主色标题/is-normal 居中）
 *     必须与节点同树，故选项列表在本组件内自绘（cell-item.styl/radio.styl/
 *     check.styl 经构建期 DEP 编入）。
 *  3. 单选确认模式的选择暂存（tmpActiveIndex/activeIndex）、取消时 selectByIndex
 *     回退与 Vue 逐一对照；cancelText 缺省「取消」走 core 词条默认值。
 *  4. 默认插槽为作用域插槽（option/index/selected），小程序无作用域插槽能力，
 *     选项恒按 text/label/brief 渲染（header/footer 具名插槽不受影响）。
 *  5. cu-popup-title-bar 为纯文本渲染（Vue 版经 v-html，富文本无对应）。
 */
import {CuComponent} from '../../shared/component'
import {
  buildSelectorCells,
  isNeedConfirmOf,
  isOnlyClose,
  normalizeMultiValue,
  resolveCancelText,
  type MultiValue,
  type SelectorItem,
} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

function refreshCells(self: Ctx) {
  const d = self.data
  const cells = buildSelectorCells((d.data as SelectorItem[]) || [], {
    multi: !!d.multi,
    selectedValue: d.selectedValue as SelectorItem['value'],
    multiValue: (d.multiDefaultValue as MultiValue) || [],
    alignCenter: false,
    iconPosition: d.iconPosition as string,
    icon: d.icon as string,
    iconInverse: d.iconInverse as string,
    iconDisabled: d.iconDisabled as string,
  })
  self.setData({cells})
}

function refreshMeta(self: Ctx) {
  const d = self.data
  self.setData({
    isNeedConfirm: isNeedConfirmOf(d.okText as string),
    actualCancelText: resolveCancelText(d.cancelText as string | null | undefined, d.okText as string),
    onlyClose: isOnlyClose(!!d.isCheck, isNeedConfirmOf(d.okText as string), d.cancelText as string | null | undefined),
  })
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue：显隐 */
    show: {type: Boolean, value: false},
    /** SelectorItem[] */
    data: {type: Object, value: []},
    defaultValue: {type: String, optionalTypes: [Number, Boolean, Object], value: ''},
    isCheck: {type: Boolean, value: false},
    maxHeight: {type: String, optionalTypes: [Number], value: 'auto'},
    minHeight: {type: String, optionalTypes: [Number], value: 'auto'},
    title: {type: String, value: ''},
    describe: {type: String, value: ''},
    okText: {type: String, value: ''},
    cancelText: {type: String, value: null},
    maskClosable: {type: Boolean, value: true},
    hideTitleBar: {type: Boolean, value: false},
    multi: {type: Boolean, value: false},
    icon: {type: String, value: 'checked'},
    iconInverse: {type: String, value: 'check'},
    iconDisabled: {type: String, value: 'check-disabled'},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
    /** xss | xs | sm | md | lg */
    iconSize: {type: String, value: 'md'},
    /** left | right */
    iconPosition: {type: String, value: 'right'},
    largeRadius: {type: Boolean, value: false},
  },

  data: {
    selectorShow: false,
    selectedValue: '' as SelectorItem['value'],
    multiDefaultValue: [] as MultiValue,
    cells: [] as ReturnType<typeof buildSelectorCells>,
    isNeedConfirm: false,
    actualCancelText: '',
    onlyClose: false,
    activeIndex: -1,
    tmpActiveIndex: -1,
  },

  observers: {
    show(val: boolean) {
      this.setData({selectorShow: !!val})
    },
    largeRadius(val: boolean) {
      const popup = (this as unknown as {__popup?: Instance}).__popup
      if (popup && typeof popup.setLargeRadius === 'function') {
        popup.setLargeRadius(!!val)
      }
    },
    defaultValue(val: SelectorItem['value'] | MultiValue) {
      // 对齐 Vue watch(defaultValue)：多选归一，单选同步选中值
      if (this.data.multi) {
        if (val === '' || val === undefined || val === null) {
          return
        }
        this.setData({multiDefaultValue: normalizeMultiValue(val)})
      } else {
        this.setData({selectedValue: val as SelectorItem['value']})
      }
    },
    'data, selectedValue, multiDefaultValue, multi, icon, iconInverse, iconDisabled, iconPosition'() {
      refreshCells(this)
    },
    'okText, cancelText, isCheck'() {
      refreshMeta(this)
    },
  },

  lifetimes: {
    attached() {
      this.setData({selectorShow: !!this.data.show})
      refreshMeta(this)
      // 对齐 Vue watch(defaultValue) immediate
      const dv = this.data.defaultValue
      if (this.data.multi && dv !== '' && dv !== undefined && dv !== null) {
        this.setData({multiDefaultValue: normalizeMultiValue(dv)})
      } else if (!this.data.multi) {
        this.setData({selectedValue: dv as SelectorItem['value']})
      }
      refreshCells(this)
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
    // popup 事件桥接
    // ------------------------------------------------------------------
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      // popup 收起启动即 change(false)（对齐 Vue watch(isSelectorShow)）
      if (e.detail && e.detail.value === false) {
        this.setData({selectorShow: false})
        this.triggerEvent('change', {value: false})
      }
    },

    onPopupShow() {
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.triggerEvent('hide')
    },

    onPopupMaskClick() {
      this.onSelectorCancel()
    },

    __close() {
      this.setData({selectorShow: false})
    },

    // ------------------------------------------------------------------
    // 选项交互
    // ------------------------------------------------------------------
    onOptionTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const item = ((this.data.data as SelectorItem[]) || [])[index]
      if (!item || item.disabled) {
        return
      }
      // 对齐 Vue onSelectorChoose
      this.setData({tmpActiveIndex: index, selectedValue: item.value})
      if (!this.data.isNeedConfirm) {
        this.setData({activeIndex: index})
        this.__close()
      }
      this.triggerEvent('choose', {item})
    },

    onOptionMultiTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const item = ((this.data.data as SelectorItem[]) || [])[index]
      if (!item || item.disabled) {
        return
      }
      // 对齐 CuCheckGroup toggle（check / uncheck）
      const next = (this.data.multiDefaultValue as MultiValue).slice()
      const i = next.indexOf(item.value as string | number)
      if (i === -1) {
        next.push(item.value as string | number)
      } else {
        next.splice(i, 1)
      }
      this.setData({multiDefaultValue: next})
    },

    onSelectorConfirm() {
      if (this.data.multi) {
        this.triggerEvent('confirm', {value: (this.data.multiDefaultValue as MultiValue).slice()})
        this.__close()
        return
      }
      if (this.data.tmpActiveIndex > -1) {
        const activeIndex = this.data.tmpActiveIndex
        this.setData({activeIndex})
        this.__close()
        const item = ((this.data.data as SelectorItem[]) || [])[activeIndex]
        if (item) {
          this.triggerEvent('confirm', {item})
        }
      }
    },

    onSelectorCancel() {
      // 对齐 Vue onSelectorCancel：以已确认项回退选择，未确认则重置
      const tmpActiveIndex = this.data.activeIndex
      this.setData({tmpActiveIndex})
      if (tmpActiveIndex !== -1) {
        const item = ((this.data.data as SelectorItem[]) || [])[tmpActiveIndex]
        if (item) {
          this.setData({selectedValue: item.value})
        }
      } else {
        this.setData({selectedValue: this.data.defaultValue as SelectorItem['value']})
      }
      if (this.data.selectorShow) {
        this.__close()
      }
      this.triggerEvent('cancel')
    },
  },
})

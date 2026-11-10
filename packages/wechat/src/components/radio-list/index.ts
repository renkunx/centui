/**
 * Source: packages/vue/src/components/radio-list/RadioList.vue
 *
 * 映射：
 *  props    options(RadioListOption[]), modelValue→value(String|Number|Boolean, 默认 ''),
 *           hasInput, inputLabel, inputPlaceholder, alignCenter, isSlotScope,
 *           icon(checked), iconInverse(check), iconDisabled(check-disabled),
 *           iconSvg（no-op）, iconSize(md), iconPosition(left)
 *  events   Vue 的 update:modelValue 与 change(option, index) 合并为单一
 *           change {value, option?, index?}：点选选项时携带 option/index，
 *           输入项输入与外部回写时仅携带 value（v-model 语义不变）
 *  slots    作用域插槽（option/index/selected）不支持——恒按 options 渲染
 *           text/label/brief（isSlotScope 属性保留，见差异 2）
 *  methods  select(value)（=selectByValue）、selectByIndex(index)
 *
 * 受控/非受控：内部 selectedValue/inputSelected/inputValue，currentValue 变化时
 * emit change（对齐 Vue watch(currentValue)）；外部回写 value 经 observer 同步。
 *
 * 平台差异：
 *  1. 单元格不再嵌套 cu-cell-item/cu-radio 组件，而是以同类名结构自绘
 *     （cell-item.styl / radio.styl 由构建期编入本组件 wxss）：小程序样式隔离下
 *     父组件 wxss 无法命中子组件内部节点，.cu-radio-item .cu-radio 的 margin
 *     重置等后代规则必须与节点同树才能生效。
 *  2. 作用域插槽无对应能力：isSlotScope 仅影响 withoutIcon 分支，默认恒按
 *     options 渲染（声明式差异）。
 *  3. has-input 单元格嵌套 cu-input-item（自带样式与格式化管线）。
 */
import {CuComponent} from '../../shared/component'
import {
  buildRadioCells,
  currentValueOf,
  type RadioListOption,
} from './logic'

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
  triggerEvent(name: string, payload?: unknown): void
}

function syncEmit(self: Ctx) {
  const cv = currentValueOf(
    self.data.inputSelected as boolean,
    self.data.inputValue as string,
    self.data.selectedValue as RadioListOption['value'],
  )
  const box = self as unknown as {__lastCurrent?: RadioListOption['value']}
  if (cv !== box.__lastCurrent) {
    box.__lastCurrent = cv
    self.triggerEvent('change', {value: cv})
  }
}

function refreshCells(self: Ctx) {
  const d = self.data
  const withoutIcon = !!d.isSlotScope && !d.icon
  const cells = buildRadioCells((d.options as RadioListOption[]) || [], {
    selectedValue: d.selectedValue as RadioListOption['value'],
    inputSelected: d.inputSelected as boolean,
    alignCenter: d.alignCenter as boolean,
    withoutIcon,
    iconPosition: d.iconPosition as string,
    icon: d.icon as string,
    iconInverse: d.iconInverse as string,
    iconDisabled: d.iconDisabled as string,
  })
  self.setData({cells})
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    options: {type: Object, value: []},
    /** Vue modelValue */
    value: {type: String, optionalTypes: [Number, Boolean], value: ''},
    hasInput: {type: Boolean, value: false},
    inputLabel: {type: String, value: ''},
    inputPlaceholder: {type: String, value: ''},
    alignCenter: {type: Boolean, value: false},
    /** 小程序不支持作用域插槽：true 时仅关闭 withoutIcon 分支（见文件头差异 2） */
    isSlotScope: {type: Boolean, value: false},
    icon: {type: String, value: 'checked'},
    iconInverse: {type: String, value: 'check'},
    iconDisabled: {type: String, value: 'check-disabled'},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
    /** xss | xs | sm | md | lg */
    iconSize: {type: String, value: 'md'},
    /** left | right */
    iconPosition: {type: String, value: 'left'},
  },

  data: {
    selectedValue: '' as RadioListOption['value'],
    inputSelected: false,
    inputValue: '',
    cells: [] as ReturnType<typeof buildRadioCells>,
  },

  observers: {
    value(val: RadioListOption['value']) {
      // 对齐 Vue watch(modelValue)：仅在外部值与内部选中值不一致时同步
      if (val !== this.data.selectedValue) {
        this.setData({selectedValue: val})
        syncEmit(this)
      }
    },
    'options, selectedValue, inputSelected, alignCenter, isSlotScope, icon, iconInverse, iconDisabled, iconPosition'() {
      refreshCells(this)
    },
  },

  lifetimes: {
    attached() {
      // observers 不在初始值时触发：选中态需在 attached 对齐初始 value
      ;(this as unknown as {__lastCurrent?: RadioListOption['value']}).__lastCurrent =
        this.data.value
      this.setData({selectedValue: this.data.value})
      refreshCells(this)
    },
  },

  methods: {
    onCellTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const option = ((this.data.options as RadioListOption[]) || [])[index]
      if (!option || option.disabled) {
        return
      }
      // 对齐 Vue select()：选中项落地、输入态退出；change 载荷携带 option/index
      const patch: Record<string, unknown> = {
        selectedValue: option.value,
        inputSelected: false,
      }
      if (this.data.inputValue) {
        patch.inputValue = ''
      }
      this.setData(patch)
      ;(this as unknown as {__lastCurrent?: RadioListOption['value']}).__lastCurrent = option.value
      this.triggerEvent('change', {value: option.value, option, index})
    },

    onInputFocus() {
      // 对齐 Vue @focus="inputSelected = true"（不直接 emit，输入值变化时统一 emit）
      this.setData({inputSelected: true})
    },

    onInputChange(e: WechatMiniprogram.CustomEvent<{name?: string | number; value: string}>) {
      this.setData({inputValue: e.detail.value})
      syncEmit(this)
    },

    /** 对齐 Vue defineExpose.select（= selectByValue） */
    select(value: RadioListOption['value']) {
      this.setData({selectedValue: value, inputSelected: false})
      syncEmit(this)
    },

    selectByIndex(index: number) {
      const item = ((this.data.options as RadioListOption[]) || [])[index]
      if (item) {
        this.select(item.value)
      }
    },
  },
})

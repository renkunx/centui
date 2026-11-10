/**
 * Source: packages/vue/src/components/input-item/InputItem.vue
 *
 * 映射：
 *  props    type(text|bankCard|password|phone|money|digit), previewType,
 *           name(String|Number), title, brief, modelValue→value(String|Number),
 *           placeholder, maxlength(String|Number), size(normal|large),
 *           align(left|center|right), error, readonly, disabled, solid, clearable,
 *           isVirtualKeyboard, virtualKeyboardDisorder, virtualKeyboardOkText,
 *           virtualKeyboardVm（no-op，见差异 6）, isTitleLatent, isFormative,
 *           isHighlight, isAmount, formation（函数属性小程序无法经 wxml 传入，
 *           保留 property 并提供 setFormation(fn) 注入）
 *  events   update:modelValue + change(name, value) → change {name, value}；
 *           focus/blur {name}；confirm {name, value}；keyup/keydown 无对应（no-op）
 *  slots    left / right / error / brief（brief 仅在无 error 时渲染，对齐 Vue）
 *  methods  focus() / blur() / getValue()
 *
 * 格式化管线与 Vue 版逐一对照（logic.ts）：非格式化类型直通 → formation 优先 →
 * 类型默认格式化（bankCard 4 位左分组 / phone 3|4|4 / money 千分位+小数 /
 * digit 去非数字）；phone 输入上限 11；对外发射值剥离空白与逗号
 * （stripSeparators 修复后语义）。受控/非受控双模：emit change，外部回写 value
 * 经 observer 以「与剥离值不同」为门重新格式化。
 *
 * 平台差异：
 *  1. input 渲染：小程序原生 input；type 映射 bankCard/phone/digit → 'number'
 *     （Vue 为 'tel'）、money/text → 'text'，password → type=text + password 属性。
 *  2. IME 组合：bind:compositionstart/end 挂载于 input（组字期仅同步原文不格式化）。
 *     基础库 input 组件官方未声明组合事件，若运行时不派发则退化为「无组合概念、
 *     逐键格式化」（与声明一致处理，行为风险与 Vue 修复前一致）。
 *  3. 光标：小程序无 setSelectionRange，格式化后光标无法回设（原生受控回写，
 *     追加输入时光标通常仍在末尾）；formatValue 的 range 仍计算保留。
 *  4. keyup/keydown 与 startEditInput 的键盘中间态在原生键盘上无对应事件，
 *     keyup/keydown 不派发；confirm 走 bind:confirm（键盘确认键）。
 *  5. 虚拟键盘（is-virtual-keyboard）：假输入框 + cu-number-keyboard（尚未移植，
 *     usingComponents 先挂）；「点击外部收起」无 document click，依赖键盘收起回传。
 *  6. virtualKeyboardVm 传外部键盘实例：小程序无法传组件实例，属性保留为 no-op，
 *     外部键盘由使用方 selectComponent 自行接线。
 *  7. inputEnv（is-ios/is-android/is-browser）由 wx.getDeviceInfo().platform 推导。
 *  8. field-item 结构自绘（cell 结构与 field.styl 规则构建期编入本组件 wxss），
 *     rootField 禁用态经 relations 从 cu-field 接收，类名与 Vue 版一致。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  emittedValue,
  formatInputValue,
  inputMaxlength,
  isFormativeType,
  randomId,
  stripSeparators,
  subValue,
  type Formation,
} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

function detectInputEnv(): string {
  try {
    const platform = String(wx.getDeviceInfo().platform || '')
    if (platform === 'ios') return 'is-ios'
    if (platform === 'android') return 'is-android'
    return 'is-browser'
  } catch {
    return 'is-browser'
  }
}

function timers(self: Instance): TimerRegistry {
  const box = self as unknown as {__timers?: TimerRegistry}
  if (!box.__timers) box.__timers = createTimerRegistry(self)
  return box.__timers
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** text | bankCard | password | phone | money | digit */
    type: {type: String, value: 'text'},
    previewType: {type: String, value: ''},
    name: {type: String, optionalTypes: [Number], value: ''},
    title: {type: String, value: ''},
    brief: {type: String, value: ''},
    /** Vue modelValue */
    value: {type: String, optionalTypes: [Number], value: ''},
    placeholder: {type: String, value: ''},
    maxlength: {type: String, optionalTypes: [Number], value: ''},
    /** large | normal */
    size: {type: String, value: 'normal'},
    /** left | center | right */
    align: {type: String, value: 'left'},
    error: {type: String, value: ''},
    readonly: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
    solid: {type: Boolean, value: true},
    clearable: {type: Boolean, value: false},
    isVirtualKeyboard: {type: Boolean, value: false},
    virtualKeyboardDisorder: {type: Boolean, value: false},
    virtualKeyboardOkText: {type: String, value: null},
    /** 小程序无法传组件实例：保留 no-op（见文件头差异 6） */
    virtualKeyboardVm: {type: null, optionalTypes: [String], value: null},
    isTitleLatent: {type: Boolean, value: false},
    isFormative: {type: Boolean, value: false},
    isHighlight: {type: Boolean, value: false},
    isAmount: {type: Boolean, value: false},
    /** 经 setFormation(fn) 注入（wxml 无法传函数） */
    formation: {type: null, value: null},
  },

  data: {
    inputValue: '',
    inputText: '',
    isInputFocus: false,
    isInputEditing: false,
    isPreview: false,
    composing: false,
    focusAttr: false,
    fieldDisabled: false,
    inputEnv: 'is-browser',
    // 派生量（observers 维护）
    itemType: 'text',
    inputType: 'text',
    inputPassword: false,
    inputPlaceholder: '',
    nativeMaxlength: -1,
    isInputFormative: false,
    isInputActive: false,
    isInputEmpty: true,
    isDisabled: false,
    showClear: false,
    rootClass: '',
    showLeft: true,
    showRight: true,
    showMsg: true,
    showBrief: true,
    showChildren: true,
    rightFilled: true,
    errorFilled: true,
    briefFilled: true,
  },

  observers: {
    value(val: string | number) {
      // 对齐 Vue watch(modelValue)：与剥离值相同则视为回写过滤（two-way binding）
      if (val !== stripSeparators(this.data.inputValue)) {
        const formatted = this.__formateValue(subValue(`${val ?? ''}`, this.__maxLength()), 0)
        this.setData({inputValue: formatted.value, inputText: formatted.value})
        this.__emitIfChanged()
      }
    },
    previewType(val: string) {
      this.setData({isPreview: !!val})
      this.__refresh()
    },
    'type, previewType, isPreview, maxlength, placeholder, isTitleLatent, isFormative'() {
      this.__refresh()
    },
    'error, disabled, readonly, clearable, solid'() {
      this.__refresh()
    },
    inputValue() {
      this.__refresh()
      this.__emitIfChanged()
    },
    isInputFocus(val: boolean) {
      if (!val) {
        this.setData({focusAttr: false})
      }
      this.__refresh()
    },
  },

  lifetimes: {
    attached() {
      ;(this as unknown as {__name: string | number}).__name =
        this.data.name || randomId('input-item')
      ;(this as unknown as {__isComposing?: boolean}).__isComposing = false
      this.setData({inputEnv: detectInputEnv(), isPreview: !!this.data.previewType})
      // 对齐 Vue setup 期初始化：formateValue(subValue(`${modelValue}`))
      const formatted = this.__formateValue(
        subValue(`${this.data.value ?? ''}`, this.__maxLength()),
        0,
      )
      this.setData({inputValue: formatted.value, inputText: formatted.value})
      this.__refresh()
    },
    detached() {
      timers(this).clearAll()
    },
    ready() {
      // 插槽探测（left/right/error/brief 包裹节点显隐，与 Vue hasSlot 语义对齐）
      const query = this.createSelectorQuery()
      query.select('.cu-field-item-left').boundingClientRect()
      query.select('.cu-field-item-right').boundingClientRect()
      query.select('.cu-input-item-msg').boundingClientRect()
      query.select('.cu-input-item-brief').boundingClientRect()
      query.exec((rects: Array<{height: number} | null> | null) => {
        if (!rects) return
        const patch: Record<string, unknown> = {}
        const [left, right, msg, brief] = rects
        if (left && !(left.height > 0)) patch.showLeft = false
        if (right) {
          patch.rightFilled = right.height > 0
        }
        if (msg && !(msg.height > 0)) patch.errorFilled = false
        if (brief && !(brief.height > 0)) patch.briefFilled = false
        if (Object.keys(patch).length > 0) this.setData(patch)
        // 探测结果落库后重算派生量（showRight 依赖 rightFilled）
        this.__refresh()
      })
    },
  },

  relations: {
    '../field/index': {
      type: 'ancestor',
      linked(this: Instance, parent: {data?: Record<string, unknown>}) {
        this.setData({fieldDisabled: !!((parent.data ?? {}) as Record<string, unknown>).disabled})
        this.__refresh()
      },
    },
  },

  methods: {
    /** cu-field 经 relations 推送的 disabled（对齐 inject rootField.disabled） */
    receiveFieldDisabled(val: boolean) {
      this.setData({fieldDisabled: !!val})
      this.__refresh()
    },

    /** 注入自定义格式化函数（小程序属性系统无法经 wxml 传函数） */
    setFormation(fn: Formation | null) {
      this.setData({formation: fn})
    },

    // ------------------------------------------------------------------
    // 派生量
    // ------------------------------------------------------------------
    __itemType(): string {
      return (this.data.isPreview ? this.data.previewType : this.data.type) || 'text'
    },

    __maxLength(): string | number {
      return inputMaxlength(this.__itemType(), this.data.maxlength)
    },

    __formative(): boolean {
      return isFormativeType(this.__itemType(), !!this.data.isFormative)
    },

    __formateValue(curValue: string, curPos = 0) {
      return formatInputValue(curValue, {
        type: this.__itemType(),
        isFormative: this.__formative(),
        maxlength: this.__maxLength(),
        name: (this as unknown as {__name: string | number}).__name ?? '',
        oldValue: this.data.inputValue,
        curPos,
        formation: (this.data.formation as Formation | null) ?? null,
      })
    },

    __emitIfChanged() {
      const emitted = emittedValue(this.data.inputValue, this.data.isInputFormative)
      if (emitted !== this.data.value) {
        this.triggerEvent('change', {
          name: (this as unknown as {__name: string | number}).__name ?? '',
          value: emitted,
        })
      }
    },

    __refresh() {
      const d = this.data
      const itemType = this.__itemType()
      // 对齐 Vue inputType：bankCard/phone/digit → 'tel'（小程序映射 'number'）
      let inputType = itemType || 'text'
      if (inputType === 'bankCard' || inputType === 'phone' || inputType === 'digit') {
        inputType = 'number'
      } else if (inputType === 'money') {
        inputType = 'text'
      }
      const inputPassword = itemType === 'password'
      if (inputPassword) inputType = 'text'
      const isInputEmpty = !d.inputValue.length
      const isInputActive = !isInputEmpty || d.isInputFocus
      const isDisabled = !!d.fieldDisabled || d.disabled
      const isFormative = this.__formative()
      const maxLen = this.__maxLength()
      const nativeMaxlength = isFormative
        ? -1
        : maxLen === '' || maxLen === undefined || maxLen === null
          ? -1
          : Number(maxLen)
      const inputPlaceholder = d.isTitleLatent && isInputActive ? '' : d.placeholder
      const hasInputError = d.error !== '' || d.errorFilled
      const hasInputBrief = d.briefFilled || d.brief !== ''
      const showClear = d.clearable && !isDisabled && !d.readonly
      const classes = [
        'cu-input-item',
        d.isHighlight ? 'is-highlight' : '',
        d.isTitleLatent ? 'is-title-latent' : '',
        isInputActive ? 'is-active' : '',
        d.isInputFocus ? 'is-focus' : '',
        hasInputError ? 'is-error' : '',
        hasInputBrief && !hasInputError ? 'with-brief' : '',
        isDisabled ? 'is-disabled' : '',
        d.isAmount ? 'is-amount' : '',
        d.clearable ? 'is-clear' : '',
        d.align,
        d.size,
        d.inputEnv,
        d.solid && !d.isTitleLatent ? 'is-solid' : '',
      ]
        .filter(Boolean)
        .join(' ')
      this.setData({
        itemType,
        inputType,
        inputPassword,
        inputPlaceholder,
        nativeMaxlength,
        isInputFormative: isFormative,
        isInputActive,
        isInputEmpty,
        isDisabled,
        showClear,
        rootClass: classes,
        showRight: showClear || d.rightFilled,
        showMsg: d.error !== '' || d.errorFilled,
        showBrief: hasInputBrief && !hasInputError,
        showChildren:
          d.error !== '' || d.errorFilled || (hasInputBrief && !hasInputError) ||
          (!!d.isVirtualKeyboard && !d.virtualKeyboardVm),
      })
    },

    // ------------------------------------------------------------------
    // 原生 input 事件
    // ------------------------------------------------------------------
    onInput(e: WechatMiniprogram.Input) {
      const box = this as unknown as {__isComposing?: boolean}
      // IME 组合期：仅同步原始文本，不格式化不回写（对齐 Vue 修复）
      if (box.__isComposing) {
        this.setData({inputValue: e.detail.value, inputText: e.detail.value})
        return
      }
      const curPos = this.data.isInputFormative ? Number(e.detail.cursor ?? 0) : 0
      // 小程序无 setSelectionRange：range 仅计算保留（文件头差异 3）
      const formatted = this.__formateValue(e.detail.value, curPos)
      this.setData({inputValue: formatted.value, inputText: formatted.value})
    },

    onCompositionStart() {
      ;(this as unknown as {__isComposing?: boolean}).__isComposing = true
    },

    onCompositionEnd(e: WechatMiniprogram.Input) {
      ;(this as unknown as {__isComposing?: boolean}).__isComposing = false
      // 组合结束后按当前 input 值补一次常规格式化（对齐 Vue onCompositionEnd）
      this.onInput(e)
    },

    onFocus() {
      this.setData({isInputFocus: true, focusAttr: true})
      this.triggerEvent('focus', {
        name: (this as unknown as {__name: string | number}).__name ?? '',
      })
    },

    onBlur() {
      // 对齐 Vue onBlur：延迟 100ms 收起（避免点击清除按钮等瞬时失焦）
      timers(this).setTimeout(() => {
        this.setData({isInputFocus: false})
        this.triggerEvent('blur', {
          name: (this as unknown as {__name: string | number}).__name ?? '',
        })
      }, 100)
    },

    onConfirm() {
      this.triggerEvent('confirm', {
        name: (this as unknown as {__name: string | number}).__name ?? '',
        value: this.data.inputValue,
      })
    },

    // ------------------------------------------------------------------
    // 公开方法（Vue defineExpose）
    // ------------------------------------------------------------------
    focus() {
      if (this.data.isVirtualKeyboard) {
        this.__focusFakeInput()
        return
      }
      this.setData({focusAttr: true})
    },

    blur() {
      if (this.data.isVirtualKeyboard) {
        this.__blurFakeInput()
        return
      }
      this.setData({focusAttr: false})
    },

    getValue() {
      return this.data.inputValue
    },

    // ------------------------------------------------------------------
    // 清除 / 预览
    // ------------------------------------------------------------------
    clearInput() {
      this.setData({inputValue: '', inputText: '', isPreview: false})
      if (!this.data.isTitleLatent) {
        this.focus()
      }
    },

    stopPreview() {
      this.clearInput()
    },

    onClearTap() {
      this.clearInput()
    },

    // ------------------------------------------------------------------
    // 虚拟键盘（fake input + cu-number-keyboard）
    // ------------------------------------------------------------------
    __focusFakeInput() {
      this.setData({isInputFocus: true})
    },

    __blurFakeInput() {
      this.setData({isInputFocus: false})
    },

    onFakeInputClick() {
      if (this.data.isDisabled || this.data.readonly) {
        return
      }
      this.__blurFakeInput()
      if (!this.data.isInputFocus) {
        this.__focusFakeInput()
      }
    },

    __startEditInput() {
      const t = timers(this)
      this.setData({isInputEditing: true})
      t.setTimeout(() => {
        this.setData({isInputEditing: false})
      }, 500)
    },

    onKeyboardEnter(e: WechatMiniprogram.CustomEvent<Record<string, unknown>>) {
      const detail = e.detail as {value?: string | number} | string | number | null
      const val =
        detail && typeof detail === 'object' ? detail.value : (detail as string | number)
      if (this.data.isPreview) {
        this.stopPreview()
      }
      const maxLen = Number(this.__maxLength())
      if (maxLen > 0 && stripSeparators(this.data.inputValue).length >= maxLen) {
        return
      }
      const formatted = this.__formateValue(this.data.inputValue + val, 0)
      this.setData({inputValue: formatted.value, inputText: formatted.value})
      this.__startEditInput()
    },

    onKeyboardDelete() {
      const value = this.data.inputValue
      if (value === '') {
        return
      }
      const formatted = this.__formateValue(value.substring(0, value.length - 1), 0)
      this.setData({inputValue: formatted.value, inputText: formatted.value})
      this.__startEditInput()
      if (this.data.isPreview) {
        this.stopPreview()
      }
    },

    onKeyboardConfirm() {
      this.triggerEvent('confirm', {
        name: (this as unknown as {__name: string | number}).__name ?? '',
        value: this.data.inputValue,
      })
    },

    onKeyboardVisibleChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail && e.detail.value === false) {
        this.setData({isInputFocus: false})
      }
    },
  },
})

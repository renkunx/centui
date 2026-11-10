/**
 * Source: packages/vue/src/components/codebox/Codebox.vue
 *
 * 映射：
 *  props    modelValue→value(String, ''), maxlength(4, Number|String), autofocus,
 *           disabled, justify, mask, closable, system, okText, disorder, isView,
 *           inputType('tel'), isErrorStyle
 *  events   update:modelValue → change {value}；submit {value}；focus / blur
 *  slots    默认插槽（codebox 下方内容，如提示文案）
 *  methods  focus() / blur()
 *
 * 语义对齐：
 *  - maxlength>0 分格渲染（mask 圆点 / active 光标闪烁 / error 描边），
 *    maxlength<=0 走 holder 输入框（readonly 展示）。
 *  - system=true 用系统键盘：输入达到 maxlength 触发 submit。
 *  - system=false 用 cu-number-keyboard（尚未移植，usingComponents 先挂）：
 *    enter 追加（'.' 不追加）、满位 submit、delete 末删、confirm 直接 submit。
 *
 * 平台差异：
 *  1. closable 的「点击外部收起」依赖 document click，小程序无对应：
 *     system 路径以输入框 blur 收起；自定义键盘路径以键盘收起回传收起。
 *  2. system 路径隐藏 input 用绝对定位（styl .cu-codebox-input），聚焦经 focus 属性。
 *  3. inputType 'tel' 小程序不支持 → 映射 'number'。
 *  4. 自定义键盘与 number-keyboard 的事件契约（enter 载荷 {value}）以
 *     number-keyboard 移植批次的最终实现为准，接线处已做兼容读取。
 *  5. maxlength<=0 时 Vue 渲染 disabled input 展示（含 mask 密文），小程序同构实现。
 */
import {CuComponent} from '../../shared/component'
import {
  buildCodeboxCells,
  ingestDelete,
  ingestKeyboardKey,
  ingestSystemInput,
  useBoxes,
  type CodeboxMaxlength,
} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue */
    value: {type: String, value: ''},
    maxlength: {type: Number, optionalTypes: [String], value: 4},
    autofocus: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
    justify: {type: Boolean, value: false},
    mask: {type: Boolean, value: false},
    /** 保留 API；收起行为见文件头差异 1 */
    closable: {type: Boolean, value: true},
    /** 使用系统键盘 */
    system: {type: Boolean, value: false},
    okText: {type: String, value: null},
    disorder: {type: Boolean, value: false},
    isView: {type: Boolean, value: false},
    inputType: {type: String, value: 'tel'},
    isErrorStyle: {type: Boolean, value: false},
  },

  data: {
    code: '',
    focused: false,
    focusSystem: false,
    boxes: [] as ReturnType<typeof buildCodeboxCells>,
    useBoxes: true,
    keyboardType: 'simple',
    nativeMaxlength: 4,
    inputTypeMp: 'number',
  },

  observers: {
    value(val: string) {
      if (val !== this.data.code) {
        this.setData({code: val})
      }
    },
    'code, focused, maxlength'() {
      this.__refresh()
    },
    'maxlength, system'() {
      this.__refreshStatic()
    },
  },

  lifetimes: {
    attached() {
      // observers 不在初始值时触发：code 需在 attached 对齐初始 value
      this.setData({focused: !!this.data.autofocus, code: this.data.value})
      this.__refreshStatic()
      this.__refresh()
    },
  },

  methods: {
    __refreshStatic() {
      const maxlength = this.data.maxlength as CodeboxMaxlength
      this.setData({
        useBoxes: useBoxes(maxlength),
        keyboardType: Number(maxlength) > 0 ? 'simple' : 'professional',
        nativeMaxlength: Number(maxlength) || -1,
        inputTypeMp: this.data.inputType === 'tel' ? 'number' : this.data.inputType,
      })
    },

    __refresh() {
      const {code, focused, maxlength} = this.data
      this.setData({boxes: buildCodeboxCells(code, maxlength, focused)})
    },

    __commit(code: string) {
      this.setData({code})
      this.triggerEvent('change', {value: code})
    },

    // ------------------------------------------------------------------
    // 盒子点击 / 公开方法
    // ------------------------------------------------------------------
    onBoxTap() {
      if (this.data.disabled) {
        return
      }
      this.focus()
    },

    focus() {
      if (this.data.disabled) {
        return
      }
      this.setData({focused: true})
      if (this.data.system) {
        this.setData({focusSystem: true})
      }
    },

    blur() {
      this.setData({focused: false})
      if (this.data.system) {
        this.setData({focusSystem: false})
      }
    },

    // ------------------------------------------------------------------
    // 系统键盘路径
    // ------------------------------------------------------------------
    onSystemInput(e: WechatMiniprogram.Input) {
      const maxNum = Number(this.data.maxlength)
      const result = ingestSystemInput(this.data.code, e.detail.value, maxNum)
      this.__commit(result.code)
      if (result.submit) {
        this.triggerEvent('submit', {value: result.code})
      }
    },

    onSystemFocus() {
      this.triggerEvent('focus')
    },

    onSystemBlur() {
      // 对齐 closable 语义的平台化收起（文件头差异 1）
      this.setData({focused: false})
      this.triggerEvent('blur')
    },

    // ------------------------------------------------------------------
    // 自定义键盘路径（cu-number-keyboard）
    // ------------------------------------------------------------------
    onKbEnter(e: WechatMiniprogram.CustomEvent<Record<string, unknown>>) {
      const detail = e.detail as {value?: string | number} | string | number | null
      const key = String(
        detail && typeof detail === 'object' ? detail.value : (detail as string | number),
      )
      const maxNum = Number(this.data.maxlength)
      const result = ingestKeyboardKey(this.data.code, key, maxNum)
      this.__commit(result.code)
      if (result.submit) {
        this.triggerEvent('submit', {value: result.code})
      }
    },

    onDelete() {
      this.__commit(ingestDelete(this.data.code))
    },

    onConfirm() {
      this.triggerEvent('submit', {value: this.data.code})
    },

    onKbVisibleChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail && e.detail.value === false) {
        this.setData({focused: false})
      }
    },
  },
})


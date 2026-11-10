/**
 * Source: packages/vue/src/components/textarea-item/TextareaItem.vue
 *
 * 映射：
 *  props    title, name(String|Number, 缺省随机), placeholder,
 *           modelValue/value → value（v-model 与 v2 value 合并为同一 property，
 *           Vue 版 modelValue 优先语义在单一 property 下自然成立）,
 *           maxLength(String|Number), maxHeight, solid, readonly, disabled,
 *           clearable, rows('3'), autosize, error, formation（经 setFormation(fn)
 *           注入，wxml 无法传函数）
 *  events   update:modelValue + change(value) → change {value}；input {value}；
 *           focus / blur；keyup/keydown 无对应（no-op）
 *  slots    footer（control 区尾部）/ right / children（error 文本区）
 *  methods  resizeTextarea() / focus() / blur() / getValue()
 *
 * 平台差异：
 *  1. textarea 渲染：小程序原生 textarea；autosize → auto-height 属性；
 *     maxHeight → 内联 max-height（内联样式不参与构建期 px→rpx 换算，
 *     建议传 rpx 单位字符串）；rows → 按 line-height 1.4 估算的 height 内联样式。
 *  2. 光标：小程序无 setSelectionRange，formation 格式化后光标无法回设。
 *  3. Vue TextareaItem 不消费 rootField（isDisabled 仅取自身 disabled），
 *     relations 登记仅用于 cu-field 收集，不改变禁用行为（对齐）。
 *  4. field-item 结构自绘（field.styl 规则构建期编入本组件 wxss），类名与 Vue 一致。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {randomId, type Formation} from '../input-item/logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

function timers(self: Instance): TimerRegistry {
  const box = self as unknown as {__timers?: TimerRegistry}
  if (!box.__timers) box.__timers = createTimerRegistry(self)
  return box.__timers
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    title: {type: String, value: ''},
    name: {type: String, optionalTypes: [Number], value: ''},
    placeholder: {type: String, value: ''},
    /** Vue modelValue（与 v2 value 合并） */
    value: {type: String, value: ''},
    /** '' 视为不限长 */
    maxLength: {type: String, optionalTypes: [Number], value: ''},
    maxHeight: {type: String, optionalTypes: [Number], value: ''},
    solid: {type: Boolean, value: true},
    readonly: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
    clearable: {type: Boolean, value: false},
    rows: {type: String, optionalTypes: [Number], value: '3'},
    autosize: {type: Boolean, value: false},
    error: {type: String, value: ''},
    /** 经 setFormation(fn) 注入（wxml 无法传函数） */
    formation: {type: null, value: null},
  },

  data: {
    current: '',
    isInputFocus: false,
    focusAttr: false,
    isDisabled: false,
    isInputEmpty: true,
    errorInfo: '',
    heightStyle: '',
    maxHeightStyle: '',
    nativeMaxlength: -1,
    rootClass: '',
    showRight: true,
    rightFilled: true,
  },

  observers: {
    value(val: string) {
      this.setData({current: val})
    },
    current() {
      this.setData({isInputEmpty: !this.data.current.length})
      this.triggerEvent('change', {value: this.data.current})
    },
    'disabled, solid, error'() {
      this.__refresh()
    },
    'maxLength, autosize, rows, maxHeight'() {
      this.__refresh()
    },
  },

  lifetimes: {
    attached() {
      ;(this as unknown as {__name: string | number}).__name =
        this.data.name || randomId('textarea-item')
      this.setData({current: this.data.value})
      this.__refresh()
    },
    detached() {
      timers(this).clearAll()
    },
    ready() {
      this.createSelectorQuery()
        .select('.cu-field-item-right')
        .boundingClientRect((rect: {height: number} | null) => {
          if (rect) {
            const patch: Record<string, unknown> = {rightFilled: rect.height > 0}
            this.setData(patch)
            this.__refresh()
          }
        })
        .exec()
    },
  },

  relations: {
    '../field/index': {
      type: 'ancestor',
      linked(this: Instance, parent: Instance) {
        // 仅登记：Vue TextareaItem 不消费 rootField（对齐）
        ;(this as unknown as {__field?: Instance}).__field = parent
      },
    },
  },

  methods: {
    /** 注入自定义格式化函数（小程序属性系统无法经 wxml 传函数） */
    setFormation(fn: Formation | null) {
      this.setData({formation: fn})
    },

    __refresh() {
      const d = this.data
      // rows → height 估算（line-height 1.4，token textarea-item-line-height）
      const rowsNum = Number(d.rows) > 0 ? Number(d.rows) : 3
      // 1.4em/行（token textarea-item-line-height）；toFixed 消除 3*1.4=4.1999... 浮点尾巴
      const heightStyle = d.autosize ? '' : `height: ${Number((rowsNum * 1.4).toFixed(2))}em;`
      const maxH = d.maxHeight
      const maxHeightStyle =
        maxH === '' || maxH === undefined || maxH === null ? '' : `max-height: ${maxH};`
      const maxLen = d.maxLength
      const nativeMaxlength =
        maxLen === '' || maxLen === undefined || maxLen === null ? -1 : Number(maxLen)
      const classes = [
        'cu-field-item',
        'cu-textarea-item',
        d.isDisabled || d.disabled ? 'is-disabled' : '',
        d.error ? 'is-error' : '',
        d.solid ? 'is-solid' : '',
      ]
        .filter(Boolean)
        .join(' ')
      this.setData({
        isDisabled: !!d.disabled,
        errorInfo: d.error,
        heightStyle,
        maxHeightStyle,
        nativeMaxlength,
        rootClass: classes,
        showRight: d.clearable || d.rightFilled,
      })
    },

    __format(curValue: string): string {
      const formation = this.data.formation as Formation | null
      if (formation) {
        const result = formation(
          (this as unknown as {__name: string | number}).__name ?? '',
          curValue,
          0,
        )
        if (result) {
          return result.value
        }
      }
      return curValue
    },

    onInput(e: WechatMiniprogram.TextareaInput) {
      const next = this.__format(e.detail.value)
      this.setData({current: next})
      this.triggerEvent('input', {value: next})
    },

    onFocus() {
      this.setData({isInputFocus: true, focusAttr: true})
      this.triggerEvent('focus')
    },

    onBlur() {
      // 对齐 Vue onBlur：延迟 100ms 收起
      timers(this).setTimeout(() => {
        this.setData({isInputFocus: false, focusAttr: false})
        this.triggerEvent('blur')
      }, 100)
    },

    onClearTap() {
      this.setData({current: ''})
      this.focus()
    },

    /** autosize 由原生 auto-height 承担；保留公开方法对齐 Vue defineExpose */
    resizeTextarea() {},

    focus() {
      this.setData({focusAttr: true})
    },

    blur() {
      this.setData({focusAttr: false})
    },

    getValue() {
      return this.data.current
    },
  },
})

/**
 * Source: packages/vue/src/components/radio/Radio.vue + check/shared.ts（useRadioDelegate）
 *
 * 映射：
 *  props    name(String|Number|Boolean, Vue 版必传、无默认；小程序缺省 ''), 
 *           modelValue→value(默认 ''), size(md), label, inline, disabled,
 *           icon(checked), iconInverse(check), iconDisabled(check-disabled),
 *           iconSvg（Web 语义 no-op，统一 svg-mask）
 *  events   update:modelValue → change {value}（§3.2 v-model 映射）
 *  slots    默认插槽（缺省回退 label 文本）
 *
 * 受控/非受控：点击走「乐观 setData + emit change」；放入 cu-radio-group 时经
 * relations 接收组值广播，isChecked 对齐 Vue isChecked computed。
 *
 * 平台差异：
 *  1. Vue <label role="radio"> → <view aria-role="radio">（label 表单关联语义无对应）。
 *  2. name 在 Vue 版为必填无默认，小程序属性系统给 '' 缺省（行为差异仅在不传 name
 *     的非常规用法下出现）。
 *  3. 插槽回退（label 文本）经 ready 插槽探测回写（首帧可能闪现）。
 */
import {CuComponent} from '../../shared/component'
import {isRadioChecked, type RadioValue} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

function refresh(self: Ctx) {
  const {value, name, groupValue, disabled, icon, iconInverse, iconDisabled} = self.data
  const isChecked = isRadioChecked(
    value as RadioValue,
    name as RadioValue,
    (groupValue as RadioValue | null) ?? null,
  )
  const currentIcon = disabled ? iconDisabled : isChecked ? icon : iconInverse
  self.setData({isChecked, currentIcon})
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** String | Number | Boolean（Vue 版必传） */
    name: {type: String, optionalTypes: [Number, Boolean], value: ''},
    /** Vue modelValue */
    value: {type: String, optionalTypes: [Number, Boolean], value: ''},
    /** xss | xs | sm | md | lg */
    size: {type: String, value: 'md'},
    label: {type: String, value: ''},
    inline: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
    icon: {type: String, value: 'checked'},
    iconInverse: {type: String, value: 'check'},
    iconDisabled: {type: String, value: 'check-disabled'},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
  },

  data: {
    groupValue: null as RadioValue | null,
    isChecked: false,
    currentIcon: 'check',
    hasDefault: true,
  },

  observers: {
    'value, groupValue'() {
      refresh(this)
    },
    'disabled, icon, iconInverse, iconDisabled'() {
      refresh(this)
    },
  },

  lifetimes: {
    attached() {
      refresh(this)
    },
    ready() {
      // 默认插槽探测：空则回退渲染 label 文本（与 Vue $slots.default 判定对齐）
      this.createSelectorQuery()
        .select('.cu-radio-label')
        .boundingClientRect((rect: {height: number} | null) => {
          if (rect && !(rect.height > 0)) {
            this.setData({hasDefault: false})
          }
        })
        .exec()
    },
  },

  relations: {
    '../radio-group/index': {
      type: 'ancestor',
      linked(this: Instance, parent: {data?: Record<string, unknown>}) {
        ;(this as unknown as {__radioGroup: unknown}).__radioGroup = parent
        this.setData({groupValue: ((parent.data ?? {}).value as RadioValue) ?? null})
      },
      unlinked(this: Instance) {
        ;(this as unknown as {__radioGroup: unknown}).__radioGroup = null
      },
    },
  },

  methods: {
    /** cu-radio-group 广播的组值（对齐 inject rootGroup.value） */
    receiveGroupValue(val: RadioValue) {
      this.setData({groupValue: (val ?? null) as RadioValue | null})
    },

    onTap() {
      if (this.data.disabled) {
        return
      }
      const name = this.data.name as RadioValue
      // 对齐 Vue useRadioDelegate：emit 自身 v-model + 上报组
      this.setData({value: name})
      this.triggerEvent('change', {value: name})
      const group = (this as unknown as {__radioGroup: unknown}).__radioGroup as
        | {checkChild?: (n: RadioValue) => void}
        | undefined
      if (group && typeof group.checkChild === 'function') {
        group.checkChild(name)
      }
    },
  },
})

/**
 * Source: packages/vue/src/components/radio/RadioBox.vue + check/shared.ts（useRadioDelegate）
 *
 * 映射：
 *  props    name(String|Number|Boolean, Vue 版必传、无默认；小程序缺省 true——
 *           与 CheckBox 的 name 默认对齐，见差异 2), modelValue→value(默认 false),
 *           label(''), disabled(false), iconPosition('lt'|'rt'，默认 rt)
 *  events   update:modelValue → change {value}（§3.2 v-model 映射）
 *  slots    默认插槽（缺省回退 label 文本）
 *
 * 视觉底座：渲染 cu-check-base-box（Vue CuCheckBaseBox + useRadioDelegate），
 * 勾选角标/配色由基座承担；单选语义——选中不可反选，点击即上报 name。
 *
 * 受控/非受控：点击走「乐观 setData + emit change」；放入 cu-radio-group 时经
 * relations 接收组值广播，isChecked 对齐 Vue isChecked computed
 * （value===name || 组值===name）。
 *
 * 平台差异：
 *  1. Vue @click 经 attrs fallthrough 挂到 CuCheckBaseBox 根元素 → 小程序监听
 *     基座 triggerEvent('tap')；class="cu-radio-box" 经 externalClasses 通道；
 *     role="radio" → 基座 role 属性（aria-role）。
 *  2. name 在 Vue 版必填无默认，小程序属性系统需给缺省——取 true（布尔开关
 *     形态，与 cu-check-box 缺省一致；行为差异仅在不传 name 的非常规用法下出现）。
 *  3. 插槽回退（label 文本）经 ready 插槽探测回写（首帧可能闪现，同 cu-radio）。
 */
import {CuComponent} from '../../shared/component'
import {isRadioChecked, type RadioValue} from '../radio/logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

function refresh(self: Ctx) {
  const {value, name, groupValue} = self.data
  const isChecked = isRadioChecked(
    value as RadioValue,
    name as RadioValue,
    (groupValue as RadioValue | null) ?? null,
  )
  self.setData({isChecked})
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** String | Number | Boolean（Vue 版必传，见头注释差异 2） */
    name: {type: Boolean, optionalTypes: [String, Number], value: true},
    /** Vue modelValue */
    value: {type: Boolean, optionalTypes: [String, Number], value: false},
    label: {type: String, value: ''},
    disabled: {type: Boolean, value: false},
    /** lt | rt */
    iconPosition: {type: String, value: 'rt'},
  },

  data: {
    groupValue: null as RadioValue | null,
    isChecked: false,
    hasDefault: true,
  },

  observers: {
    'value, groupValue'() {
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
        .select('.cu-radio-box-content')
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

    /** 基座根节点 tap（Vue attrs fallthrough click → useRadioDelegate.onClick） */
    onBaseTap() {
      if (this.data.disabled) {
        return
      }
      const name = this.data.name as RadioValue
      // 对齐 Vue useRadioDelegate：单选无反选，emit 自身 v-model + 上报组
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

/**
 * Source: packages/vue/src/components/check/Check.vue + shared.ts（useCheckDelegate）
 *
 * 映射：
 *  props    name(Boolean|String|Number, 默认 true), modelValue→value(Boolean|String|Number,
 *           默认 false), size(md), label, disabled, icon(checked), iconInverse(check),
 *           iconDisabled(check-disabled), iconSvg（Web 语义 no-op，统一 svg-mask）
 *  events   update:modelValue → change {value}（§3.2 v-model 映射）
 *  slots    默认插槽（缺省回退 label 文本）
 *
 * 受控/非受控：点击走「乐观 setData + emit change」，受控方回写 value 后经 observer
 * 覆盖（src/shared/controlled.ts 语义）。放入 cu-check-group 时经 relations 接收
 * 组值广播，isChecked 对齐 Vue isChecked computed。
 *
 * 平台差异：
 *  1. Vue <label role="checkbox"> → <view aria-role="checkbox">（aria-role/aria-label
 *     在小程序部分组件生效，尽力设置；label 的表单关联语义无对应）。
 *  2. 插槽回退（label 文本）与包裹节点显隐经 ready 插槽探测回写（首帧可能闪现）。
 */
import {CuComponent} from '../../shared/component'
import {isCheckChecked, nextCheckValue, type CheckValue} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

function refresh(self: Ctx) {
  const {value, name, groupValue, disabled, icon, iconInverse, iconDisabled} = self.data
  const isChecked = isCheckChecked(value as CheckValue, name as CheckValue, (groupValue as CheckValue[]) || [])
  const currentIcon = disabled ? iconDisabled : isChecked ? icon : iconInverse
  self.setData({isChecked, currentIcon})
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Boolean | String | Number；默认 true（布尔开关语义，Vue withDefaults name: true） */
    name: {type: Boolean, optionalTypes: [String, Number], value: true},
    /** Vue modelValue */
    value: {type: Boolean, optionalTypes: [String, Number], value: false},
    /** xss | xs | sm | md | lg */
    size: {type: String, value: 'md'},
    label: {type: String, value: ''},
    disabled: {type: Boolean, value: false},
    icon: {type: String, value: 'checked'},
    iconInverse: {type: String, value: 'check'},
    iconDisabled: {type: String, value: 'check-disabled'},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
  },

  data: {
    groupValue: [] as CheckValue[],
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
        .select('.cu-check-label')
        .boundingClientRect((rect: {height: number} | null) => {
          if (rect && !(rect.height > 0)) {
            this.setData({hasDefault: false})
          }
        })
        .exec()
    },
  },

  relations: {
    '../check-group/index': {
      type: 'ancestor',
      linked(this: Instance, parent: {data?: Record<string, unknown>}) {
        ;(this as unknown as {__checkGroup: Instance | null}).__checkGroup =
          parent as unknown as Instance
        this.setData({groupValue: ((parent.data ?? {}).value as CheckValue[]) || []})
      },
      unlinked(this: Instance) {
        ;(this as unknown as {__checkGroup: Instance | null}).__checkGroup = null
      },
    },
  },

  methods: {
    /** cu-check-group 广播的组值（对齐 inject rootGroup.value） */
    receiveGroupValue(val: CheckValue[]) {
      this.setData({groupValue: val || []})
    },

    onTap() {
      if (this.data.disabled) {
        return
      }
      const name = this.data.name as CheckValue
      const next = nextCheckValue(name, this.data.value as CheckValue, this.data.isChecked)
      // 乐观更新 + emit（受控方回写后 observer 以最终值为准）
      this.setData({value: next})
      this.triggerEvent('change', {value: next})
      const group = (this as unknown as {__checkGroup: unknown}).__checkGroup as
        | {toggleChild?: (n: CheckValue) => void}
        | undefined
      if (group && typeof name !== 'boolean') {
        // 对齐 Vue：非布尔名时同步上报组（check / uncheck 由组按当前值裁决）
        if (typeof group.toggleChild === 'function') {
          group.toggleChild(name)
        }
      }
    },
  },
})

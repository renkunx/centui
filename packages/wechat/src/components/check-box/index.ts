/**
 * Source: packages/vue/src/components/check/CheckBox.vue + check/shared.ts（useCheckDelegate）
 *
 * 映射：
 *  props    name(String|Number|Boolean, 默认 true), modelValue→value(同联合类型,
 *           默认 false), label(''), disabled(false), iconPosition('lt'|'rt'，默认 rt)
 *  events   update:modelValue → change {value}（§3.2 v-model 映射）
 *  slots    默认插槽（缺省回退 label 文本，Vue <slot>{{label}}</slot>）
 *
 * 视觉底座：渲染 cu-check-base-box（Vue CuCheckBaseBox），勾选角标/配色由基座承担。
 *
 * 受控/非受控：点击走「乐观 setData + emit change」（shared/controlled.ts 语义），
 * 受控方回写 value 后经 observer 覆盖；放入 cu-check-group 时经 relations 接收
 * 组值广播，isChecked 对齐 Vue isChecked computed（value===name || 组值包含 name）。
 *
 * 平台差异：
 *  1. Vue @click 经 attrs fallthrough 挂到 CuCheckBaseBox 根元素 → 小程序监听
 *     基座 triggerEvent('tap')（bind:tap="onBaseTap"）。
 *  2. class="cu-check-box" 经 externalClasses（cu-class）通道传给基座
 *     （virtualHost 下无 fallthrough class）。
 *  3. role="checkbox" → 基座 role 属性（aria-role）。
 *  4. 插槽回退（label 文本）经 ready 插槽探测回写（首帧可能闪现，同 cu-check）。
 *  5. Vue <label role="checkbox"> 表单关联语义无对应，以 aria-role 尽力设置。
 */
import {CuComponent} from '../../shared/component'
import {isCheckChecked, nextCheckValue, type CheckValue} from '../check/logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

function refresh(self: Ctx) {
  const {value, name, groupValue} = self.data
  const isChecked = isCheckChecked(value as CheckValue, name as CheckValue, (groupValue as CheckValue[]) || [])
  self.setData({isChecked})
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Boolean | String | Number；默认 true（布尔开关语义，Vue withDefaults name: true） */
    name: {type: Boolean, optionalTypes: [String, Number], value: true},
    /** Vue modelValue */
    value: {type: Boolean, optionalTypes: [String, Number], value: false},
    label: {type: String, value: ''},
    disabled: {type: Boolean, value: false},
    /** lt | rt */
    iconPosition: {type: String, value: 'rt'},
  },

  data: {
    groupValue: [] as CheckValue[],
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
        .select('.cu-check-box-content')
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

    /** 基座根节点 tap（Vue attrs fallthrough click → useCheckDelegate.onClick） */
    onBaseTap() {
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

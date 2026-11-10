/**
 * Source: packages/vue/src/components/check-base/CheckBoxBase.vue
 *
 * 映射：
 *  props    label(''), disabled(false), isChecked(false), iconPosition('lt'|'rt'，默认 rt)
 *  events   Vue 无 emits（勾选行为由 CheckBox/RadioBox 经 attrs fallthrough 把
 *           @click 挂到根元素）→ 小程序根节点 bind:tap 触发 triggerEvent('tap')，
 *           由 check-box/radio-box 监听（语义对齐 Vue fallthrough click）
 *  slots    默认插槽（Vue 版无 label 回退——label prop 仅存在于 API 形参，
 *           模板未渲染；保持一致）
 *
 * 平台差异：
 *  1. role="checkbox"/"radio" 经 attrs 透传（RadioBox 传 radio）→ 内部 role 属性
 *     （默认 checkbox），映射 aria-role/aria-checked/aria-disabled。
 *  2. class 透传（CheckBox 挂 cu-check-box / RadioBox 挂 cu-radio-box）→
 *     externalClasses cu-class 通道（根节点 class 列表含 cu-class）。
 *  3. 本组件 styleIsolation: shared——check-base.styl 的 .cu-check-base-box .cu-tag
 *     （角标定位/quarter-bg 着色）需命中 apply-shared 的 cu-tag 内部节点。
 *  4. 角标图标着色：Vue 的 mask 图标无 currentColor，显式以
 *     color-text-base-inverse（tag fill 型的文字色 token）着色，与 Vue 视觉一致。
 */
import {CuComponent} from '../../shared/component'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    label: {type: String, value: ''},
    disabled: {type: Boolean, value: false},
    isChecked: {type: Boolean, value: false},
    /** lt | rt */
    iconPosition: {type: String, value: 'rt'},
    /** a11y：box 形态由具体变体声明 checkbox/radio（Vue 为 attrs 透传 role） */
    role: {type: String, value: 'checkbox'},
  },

  methods: {
    /** 根节点 tap → 上抛（Vue 经 attrs fallthrough 直连根元素 click） */
    onRootTap() {
      this.triggerEvent('tap')
    },
  },
})

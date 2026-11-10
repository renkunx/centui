/**
 * Source: packages/vue/src/components/agree/Agree.vue
 *
 * 映射：
 *  props    modelValue→value(Boolean), disabled, size(md，透传给图标),
 *           iconType(circle/square)
 *  events   update:modelValue→change({value})（受控协议见 PORTING_SPEC §3.2）；
 *           Vue 的 change(MouseEvent) 载荷为 DOM 事件对象，无平台等价物，与
 *           update:modelValue 合并为同一 change 事件（差异声明）
 *  slots    默认插槽（协议文案）；icon 具名插槽（Vue 为作用域插槽 :checked，
 *           小程序无作用域插槽，不传 checked 参数——差异声明）
 *
 * 平台差异：
 *  1. 勾选动画的着色：Vue 依赖 .cu-icon-checked/.cu-icon-check 的 CSS color 规则，
 *     小程序图标为 mask-image 渲染，color 不生效——两枚图标的显隐改由组件内联
 *     background-color 驱动（iconColors()），缩放/位置/透明度过渡仍由 styl 的
 *     transform/opacity 规则承担（本组件 styleIsolation: shared 以命中图标内部类）。
 *  2. 图标着色值走 token CSS 变量 var(--agree-fill)，无字面量。
 */
import {CuComponent} from '../../shared/component'
import {optimisticUpdate} from '../../shared/controlled'
import {iconColors, iconNames, nextChecked} from './logic'

/** agree-fill token（theme.css-vars.styl: agree-fill = var(--agree-fill)） */
const AGREE_FILL = 'var(--agree-fill)'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** 对齐 Vue modelValue（受控） */
    value: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
    size: {type: String, value: 'md'},
    /** circle | square */
    iconType: {type: String, value: 'circle'},
  },

  data: {
    innerValue: false,
    checkedName: 'checked',
    uncheckedName: 'check',
    checkedColor: 'transparent',
    uncheckedColor: AGREE_FILL,
  },

  observers: {
    value(v: boolean) {
      this.setData({innerValue: v})
    },
    iconType(iconType: string) {
      const names = iconNames(iconType)
      this.setData({checkedName: names.checked, uncheckedName: names.unchecked})
    },
    'innerValue, disabled'(innerValue: boolean) {
      const colors = iconColors(innerValue, AGREE_FILL)
      this.setData({checkedColor: colors.checked, uncheckedColor: colors.unchecked})
    },
  },

  lifetimes: {
    attached() {
      const names = iconNames(this.data.iconType)
      const colors = iconColors(this.data.value, AGREE_FILL)
      this.setData({
        innerValue: this.data.value,
        checkedName: names.checked,
        uncheckedName: names.unchecked,
        checkedColor: colors.checked,
        uncheckedColor: colors.unchecked,
      })
    },
  },

  methods: {
    onChange() {
      const next = nextChecked({value: this.data.innerValue, disabled: this.data.disabled})
      if (next === null) {
        return
      }
      // 乐观更新 + emit：受控方回写 value 后 observer 以最终值为准
      optimisticUpdate(this, {innerValue: next}, 'change', {value: next})
    },
  },
})

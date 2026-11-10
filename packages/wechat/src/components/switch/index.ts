/**
 * Source: packages/vue/src/components/switch/Switch.vue
 *
 * 映射：
 *  props    modelValue→value(Boolean, 默认 false), disabled
 *  events   update:modelValue 与 change(MouseEvent) 合并为 change {value}
 *           （§3.2 v-model 映射；Vue change 载荷为原生事件对象，小程序无对应，
 *           改携带切换后的布尔值）
 *  slots    无
 *
 * 受控/非受控：点击走「乐观 setData(current) + emit change」，受控方回写 value 后
 * 经 observer 覆盖 current（src/shared/controlled.ts 语义）；非受控时 current 即
 * 视觉真源，修复 Vue 版「非受控下视觉不切换」的受控残留。
 *
 * 平台差异：
 *  Vue role="switch"/aria-* → 小程序 aria-role="switch"/aria-checked/aria-disabled
 *  （wxml aria 属性在部分组件/渲染引擎生效，尽力设置，其余无差异）。
 */
import {CuComponent} from '../../shared/component'

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** Vue modelValue */
    value: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
  },

  data: {
    current: false,
  },

  observers: {
    value(val: boolean) {
      this.setData({current: !!val})
    },
  },

  lifetimes: {
    attached() {
      this.setData({current: !!this.data.value})
    },
  },

  methods: {
    onTap() {
      if (this.data.disabled) {
        return
      }
      const next = !this.data.current
      this.setData({current: next})
      this.triggerEvent('change', {value: next})
    },
  },
})

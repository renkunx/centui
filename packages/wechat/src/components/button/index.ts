/**
 * Source: packages/vue/src/components/button/Button.vue
 *
 * 映射：
 *  props    type(default/primary/warning/disabled/link), icon, size(large/small),
 *           plain, round, inline, inactive, loading
 *           nativeType/iconSvg 为 Web 概念，小程序端保留属性但为 no-op（差异注释）
 *  events   click（bind:tap 触发，事件名对齐 Vue emit('click')）
 *  slots    默认插槽
 *
 * 平台差异：
 *  1. 原生 <button> 渲染（保留 disabled 语义与无障碍），button 默认样式由
 *     styles/global.wxss 的平台 shim 重置（button::after 等）。
 *  2. loading 态的 35px spinner 由 cu-activity-indicator size 属性给出
 *     （Vue 版由 .cu-button-loading CSS 覆盖 svg 尺寸，小程序无 svg 元素）。
 */
import {CuComponent} from '../../shared/component'

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** default | primary | warning | disabled | link */
    type: {type: String, value: 'default'},
    /** Web 语义 no-op */
    nativeType: {type: String, value: 'button'},
    icon: {type: String, value: ''},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
    /** large | small */
    size: {type: String, value: 'large'},
    plain: {type: Boolean, value: false},
    round: {type: Boolean, value: false},
    inline: {type: Boolean, value: false},
    inactive: {type: Boolean, value: false},
    loading: {type: Boolean, value: false},
  },

  data: {
    disabled: false,
  },

  observers: {
    'inactive, type'(inactive: boolean, type: string) {
      this.setData({disabled: inactive || type === 'disabled'})
    },
  },

  lifetimes: {
    attached() {
      // observers 不在初始值时触发：初始 type=disabled/inactive 需在此派生
      // （同 field-item attached 补齐模式；缺失会导致初始禁用态可点击）
      this.setData({disabled: this.data.inactive || this.data.type === 'disabled'})
    },
  },

  methods: {
    onTap() {
      if (this.data.disabled) return
      this.triggerEvent('click')
    },
  },
})

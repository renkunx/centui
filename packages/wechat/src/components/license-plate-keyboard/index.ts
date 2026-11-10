/**
 * Source: packages/vue/src/components/license-plate/LicensePlateKeyboard.vue
 *
 * 映射：
 *  props    keyboard({shortcuts, mixedKeyboard, keyboardType}——LicensePlate dyKeyboard)
 *  events   enter({value})（Vue 载荷为 value 裸值，小程序统一 detail 对象）、
 *           delete / confirm
 *  slots    无
 *
 * 平台差异：无（独立组件目录以承载 license-plate-keyboard.styl 的构建产物；
 * 禁用键的点击阻断在 TS 内判断，对齐 Vue `!item.disabled && $emit('enter', ...)`)。
 */
import {CuComponent} from '../../shared/component'

interface LicenseKeyItem {
  value?: string | number
  type?: 'delete' | 'confirm'
  text?: string
  disabled?: boolean
}

interface KeyboardProp {
  shortcuts?: string[]
  mixedKeyboard?: LicenseKeyItem[]
  keyboardType?: number
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    keyboard: {type: Object, value: {} as KeyboardProp},
  },

  methods: {
    /** 省份简写键盘（第一位） */
    onShortcutTap(e: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('enter', {value: (e.currentTarget.dataset as {value: string}).value})
    },

    /** 功能键（delete / confirm） */
    onFnTap(e: WechatMiniprogram.BaseEvent) {
      const type = (e.currentTarget.dataset as {type: 'delete' | 'confirm'}).type
      if (type === 'delete') this.triggerEvent('delete')
      else this.triggerEvent('confirm')
    },

    /** 字母数字键（禁用阻断，对齐 Vue !item.disabled && emit） */
    onValueTap(e: WechatMiniprogram.BaseEvent) {
      const index = Number((e.currentTarget.dataset as {index: number}).index)
      const item = ((this.data.keyboard as KeyboardProp).mixedKeyboard ?? [])[index]
      if (!item || item.disabled) return
      this.triggerEvent('enter', {value: item.value})
    },
  },
})

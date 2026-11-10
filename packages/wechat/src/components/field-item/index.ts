/**
 * Source: packages/vue/src/components/field-item/FieldItem.vue
 *
 * 映射：
 *  props    title, placeholder, content, addon, arrow(Boolean|String), solid,
 *           alignRight, disabled
 *  events   click（currentDisabled 时不触发，对齐 Vue 守卫）
 *  slots    left / 默认（缺省回退 content → placeholder）/ right（缺省回退 addon）/
 *           children
 *
 * inject('rootField') → relations：登记到祖先 cu-field，接收其 disabled 广播，
 * currentDisabled = fieldDisabled || disabled（对齐 Vue computed）。
 *
 * 平台差异：
 *  1. is-ios / is-android / is-browser 环境类由 wx.getDeviceInfo().platform 推导
 *     （Vue 版读 UA；devtools/windows/mac 归入 is-browser）。
 *  2. left/right/children 包裹节点显隐经 ready 测量回写（首帧可能闪现空包裹，
 *     不支持运行中动态增删插槽内容）；control 包裹节点 Vue 版本就恒渲染，无探测。
 *  3. arrow 为 Boolean|String 联合（optionalTypes），true 渲染 arrow 图标，
 *     字符串渲染对应图标名，与 Vue 版一致。
 */
import {CuComponent} from '../../shared/component'

type Instance = WechatMiniprogram.Component.TrivialInstance

function detectInputEnv(): string {
  try {
    const info = wx.getDeviceInfo()
    const platform = String(info.platform || '')
    if (platform === 'ios') return 'is-ios'
    if (platform === 'android') return 'is-android'
    return 'is-browser'
  } catch {
    return 'is-browser'
  }
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    title: {type: String, value: ''},
    placeholder: {type: String, value: ''},
    content: {type: String, value: ''},
    addon: {type: String, value: ''},
    /** Boolean | String：true → arrow 图标；字符串 → 对应图标名 */
    arrow: {type: String, optionalTypes: [Boolean], value: false},
    solid: {type: Boolean, value: false},
    alignRight: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
  },

  data: {
    fieldDisabled: false,
    inputEnv: 'is-browser',
    showLeft: true,
    showRight: true,
    showChildren: true,
    // 初始假定默认/right 插槽有内容（content/placeholder/addon 回退不渲染），
    // ready 探测后校正，避免回退内容污染插槽探测结果
    hasDefault: true,
    rightFilled: true,
    arrowName: '',
  },

  observers: {
    arrow(val: boolean | string) {
      this.setData({arrowName: val === true ? 'arrow' : String(val || '')})
      if (val) this.setData({showRight: true})
    },
    addon(val: string) {
      if (val) this.setData({showRight: true})
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        inputEnv: detectInputEnv(),
        // observers 不在初始值时触发：arrowName 需在 attached 补齐
        arrowName: this.data.arrow === true ? 'arrow' : String(this.data.arrow || ''),
      })
    },
    ready() {
      const query = this.createSelectorQuery()
      query.select('.cu-field-item-left').boundingClientRect()
      query.select('.cu-field-item-control').boundingClientRect()
      query.select('.cu-field-item-right').boundingClientRect()
      query.select('.cu-field-item-children').boundingClientRect()
      query.exec((rects: Array<{height: number} | null> | null) => {
        if (!rects) return
        const patch: Record<string, boolean> = {}
        const [left, control, right, children] = rects
        if (left && !(left.height > 0)) patch.showLeft = false
        if (control) patch.hasDefault = control.height > 0
        if (right) {
          const filled = right.height > 0
          patch.rightFilled = filled
          if (!filled && !this.data.addon && !this.data.arrow) patch.showRight = false
        }
        if (children && !(children.height > 0)) patch.showChildren = false
        if (Object.keys(patch).length > 0) this.setData(patch)
      })
    },
  },

  relations: {
    '../field/index': {
      type: 'ancestor',
      linked(this: Instance, parent: {data?: Record<string, unknown>}) {
        this.setData({fieldDisabled: !!((parent.data ?? {}) as Record<string, unknown>).disabled})
      },
    },
  },

  methods: {
    /** cu-field 经 relations 推送的 disabled（对齐 inject rootField.disabled） */
    receiveFieldDisabled(val: boolean) {
      this.setData({fieldDisabled: !!val})
    },

    onTap() {
      if (!(this.data.fieldDisabled || this.data.disabled)) {
        this.triggerEvent('click')
      }
    },
  },
})

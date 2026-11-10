/**
 * Source: packages/vue/src/components/popup/PopupTitleBar.vue
 *
 * 弹层标题栏（popup-title-bar），本批 captcha / cashier / license-plate 的公共子组件。
 *
 * 映射：
 *  props    title(''), describe(''), okText(''), cancelText(''), largeRadius(false),
 *           onlyClose(false), titleAlign('center')
 *  events   confirm / cancel（Vue 同名）
 *  slots    title（无 title 时渲染）、cancel（无 cancelText 时渲染）、confirm（无 okText 时渲染）
 *
 * 平台差异（有意为之）：
 *  1. 基础几何/排版规则位于 popup.styl 的 title-bar 段——它只编译进 cu-popup 的 wxss，
 *     按小程序组件样式隔离无法作用于本组件模板节点（wxss 构建管线无本组件的 styl 源），
 *     故以 inline style 复刻基础规则：token 变量优先（--popup-title-bar-*、--h-gap-sl），
 *     无对应 token 的 60rpx（&>div padding-top）/15rpx（describe margin-top）/20%（左右留白）
 *     为设计稿字面量。调用方 styl 的覆盖（如 captcha.styl 的 halfStyle !important 组）
 *     经标准优先级正确生效。
 *  2. title/describe/cancelText/okText 经 rich-text 渲染（对齐 Vue v-html）。
 *  3. Vue 的 largeRadius 经 provide/inject 反向同步父级 Popup（large-radius 修饰类）；
 *     小程序侧由调用方组件 wxss（cashier.styl 的 .cu-cashier .cu-popup-box）承担盒样式，
 *     本属性保留 API，仅输出 large-radius 类（popup.styl 中与默认值同值）。
 *  4. @touchmove prevent → catch:touchmove（锁滚动穿透）。
 */
import {CuComponent} from '../../shared/component'
import {buildTitleBarStyles} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** 经 rich-text 渲染（对齐 Vue v-html） */
    title: {type: String, value: ''},
    /** 经 rich-text 渲染（对齐 Vue v-html） */
    describe: {type: String, value: ''},
    okText: {type: String, value: ''},
    cancelText: {type: String, value: ''},
    largeRadius: {type: Boolean, value: false},
    onlyClose: {type: Boolean, value: false},
    /** center | left | right */
    titleAlign: {type: String, value: 'center'},
  },

  data: {
    barStyle: '',
    titleWrapStyle: '',
    titleStyle: '',
    describeStyle: '',
    leftStyle: '',
    rightStyle: '',
    closeStyle: '',
  },

  observers: {
    'title, describe, largeRadius, onlyClose, titleAlign'() {
      this.__refresh()
    },
  },

  lifetimes: {
    attached() {
      this.__refresh()
    },
  },

  methods: {
    __refresh() {
      this.setData(
        buildTitleBarStyles({
          title: this.data.title,
          describe: this.data.describe,
          largeRadius: this.data.largeRadius,
          onlyClose: this.data.onlyClose,
          titleAlign: this.data.titleAlign,
        }),
      )
    },

    onCancel() {
      this.triggerEvent('cancel')
    },

    onConfirm() {
      this.triggerEvent('confirm')
    },

    noop() {},
  },
})

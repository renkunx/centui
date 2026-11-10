/**
 * Source: packages/vue/src/components/result-page/ResultPage.vue
 *
 * 映射：
 *  props    type('empty'), imgUrl(''), text(''), subtext(''), buttons([])
 *  events   Vue 无 emits；buttons 项的 handler() 直调在跨端数据通道不可达——
 *           点击按钮时优先调用实例赋值注入的 handler（setData/wxml 无法携带函数），
 *           否则 triggerEvent('buttonClick', {index, button})（新增事件，见差异 3）
 *  slots    Vue 无插槽；小程序补默认插槽（渲染在按钮区之后，供自定义内容扩展，
 *           不影响 Vue 语义）
 *
 * 平台差异：
 *  1. 默认图为协议相对 URL（//manhattan.didistatic.com/...），小程序 image 需完整
 *     协议，统一补 https:（cdn 路径与 Vue 版一致）。SVG 字符串/自定义图走 imgUrl：
 *     image 组件支持 https 与本地路径；data:URI（含 svg base64）在部分基础库受
 *     限制，建议转本地临时文件后传入。
 *  2. <img> 标签选择器规则（width:100%; margin-bottom:40px，见 result-page.styl）
 *     无法命中 image 组件，改为内联样式 width:100% + mode="widthFix"（等价
 *     img 的宽随容器、高自适应），margin-bottom 以 rpx 内联（40rpx 与构建期
 *     px→rpx 恒等换算一致）。
 *  3. buttons[].handler：跨端数据通道（setData/wxml）无法携带函数——实例赋值
 *     （this.selectComponent('#rp').buttons = [...]）传入时可调用；否则触发
 *     buttonClick {index, button} 由页面侧处理（Vue 为直接调用 handler）。
 *  4. 默认文案走 @centui/core t()（md.result_page.*，与 Vue 同 key 同文案）。
 *  5. buttons 的 plain 缺省语义（plain === undefined || plain）由 JS 预计算为
 *     buttonsView（wxml 无法调用函数）。
 */
import {CuComponent} from '../../shared/component'
import {
  actualImgUrl,
  actualSubText,
  actualText,
  buttonPlain,
  IMAGE_INLINE_STYLE,
  type ResultPageButton,
} from './logic'

interface ButtonView {
  text: string
  type: string
  plain: boolean
  round: boolean
  inactive: boolean
  loading: boolean
  icon: string
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** empty | network | lost 等内置类型（决定默认图与默认文案） */
    type: {type: String, value: 'empty'},
    imgUrl: {type: String, value: ''},
    text: {type: String, value: ''},
    subtext: {type: String, value: ''},
    buttons: {type: Object, value: []},
  },

  data: {
    imgUrlView: '',
    imgClass: '',
    imageViewStyle: IMAGE_INLINE_STYLE,
    textView: '',
    subtextView: '',
    buttonsView: [] as ButtonView[],
  },

  observers: {
    'type, imgUrl, text, subtext, buttons'() {
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
      const d = this.data
      const type = d.type as string
      const buttons = (d.buttons as ResultPageButton[]) || []
      this.setData({
        imgUrlView: actualImgUrl(d.imgUrl as string, type),
        imgClass: d.imgUrl ? '' : type,
        textView: actualText(d.text as string, type),
        subtextView: actualSubText(d.subtext as string, type),
        buttonsView: buttons.map((button) => ({
          text: button.text || '',
          type: button.type || 'default',
          // Vue :plain="button.plain === undefined || button.plain"
          plain: buttonPlain(button.plain),
          round: !!button.round,
          inactive: !!button.inactive,
          loading: !!button.loading,
          icon: button.icon || '',
        })),
      })
    },

    /** 按钮点击：handler 直调（实例注入场景）→ buttonClick 事件兜底 */
    onButtonTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const buttons = (this.data.buttons as ResultPageButton[]) || []
      const button = buttons[index]
      if (!button) {
        return
      }
      if (typeof button.handler === 'function') {
        button.handler()
        return
      }
      this.triggerEvent('buttonClick', {index, button})
    },
  },
})

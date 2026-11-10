/**
 * Source: packages/vue/src/components/landscape/Landscape.vue
 *
 * 映射：
 *  props    modelValue→show(Boolean), scroll(false), fullScreen(false), hasMask(true),
 *           maskClosable(false), transition('')
 *  events   update:modelValue→change({value:false})；input({value:false})（v2 兼容事件
 *           一并保留）；show/hide（popup 转发，时机对齐：show 在进出场结束、hide 在
 *           离场结束——popup 状态机语义）
 *  slots    默认插槽（内容区）
 *
 * 平台差异：
 *  1. 无 teleport：popup 渲染在组件位置（fixed + token z-index）。
 *  2. preventScroll 恒开（Vue prevent-scroll + exclude=.cu-landscape-content）：
 *     popup 遮罩 catch:touchmove；内容区滚动用 scroll-view（Vue 为 CSS overflow:auto，
 *     scroll 属性类名照常输出但 styl 无对应规则，行为等价）。
 *  3. 本组件 styleIsolation: shared——landscape.styl 的 .cu-landscape .cu-popup-box
 *     （z-index/全屏铺满）与关闭图标规则需命中 apply-shared 的 popup 内部节点。
 *  4. 关闭图标 .cu-icon.cu-landscape-close 规则要求图标节点携带该类，而 cu-icon
 *     虚拟宿主不支持外部类，无法附加——尺寸/边距规则不生效（Vue 50px 居中下边距），
 *     着色改由 color 属性传 token（Vue 为 CSS color 规则，对 mask 图标本就不生效），
 *     已声明为已知视觉差异。
 *  5. 过渡名不带 cu- 前缀（默认 fullScreen→fade、否则 punch），兼容剥除 Vue 风格前缀。
 */
import {CuComponent} from '../../shared/component'
import {optimisticUpdate} from '../../shared/controlled'
import {closeColor, closeIcon, resolveTransition} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** 对齐 Vue modelValue（受控显隐） */
    show: {type: Boolean, value: false},
    scroll: {type: Boolean, value: false},
    fullScreen: {type: Boolean, value: false},
    hasMask: {type: Boolean, value: true},
    maskClosable: {type: Boolean, value: false},
    transition: {type: String, value: ''},
  },

  data: {
    innerShow: false,
    actualTransition: 'punch',
    closeIconName: 'close',
    closeColorStyle: '',
  },

  observers: {
    show(v: boolean) {
      this.setData({innerShow: v})
    },
    'transition, fullScreen'(transition: string, fullScreen: boolean) {
      this.setData({actualTransition: resolveTransition(transition, fullScreen)})
    },
    'fullScreen, hasMask'(fullScreen: boolean, hasMask: boolean) {
      this.setData({
        closeIconName: closeIcon(fullScreen),
        closeColorStyle: closeColor(fullScreen, hasMask),
      })
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        innerShow: this.data.show,
        actualTransition: resolveTransition(this.data.transition, this.data.fullScreen),
        closeIconName: closeIcon(this.data.fullScreen),
        closeColorStyle: closeColor(this.data.fullScreen, this.data.hasMask),
      })
    },
  },

  methods: {
    /** popup 关闭（遮罩点击 / 父级收起）：对齐 Vue onPopupInput，回传 change+input */
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail.value) {
        return
      }
      optimisticUpdate(this, {innerShow: false}, 'change', {value: false})
      this.triggerEvent('input', {value: false})
    },

    onPopupShow() {
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.triggerEvent('hide')
    },

    /** 关闭按钮（Vue close）：仅收起，popup 关闭后的 change 回调统一外发事件（避免双发） */
    onClose() {
      this.setData({innerShow: false})
    },
  },
})

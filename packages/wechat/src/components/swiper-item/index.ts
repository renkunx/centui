/**
 * Source: packages/vue/src/components/swiper/SwiperItem.vue
 *
 * swiper 子项：布局盒 + loop 拷贝渲染 + fade 透明度受控口。
 * 与父 cu-swiper 经 relations 通信（对齐 Vue provide/inject 的 mdSwiper 通道）。
 *
 * 映射：
 *  props    isCopy（Vue 版拷贝实例不注册；小程序版拷贝由宿主 item 内渲染第二份 slot，
 *           本属性保留为 no-op——差异 2）
 *  slots    默认插槽（可多次渲染：宿主内容 + loop 拷贝）
 *
 * 平台差异（有意为之）：
 *  1. 尺寸由父组件经 relations 下发（setDimensions），对齐 Vue inject mdSwiper.dimension()；
 *  2. Vue 版 loop 拷贝为克隆 VNode 追加于容器首尾（[c3, 1, 2, 3, c1]）；小程序无法复制
 *     插槽内容到容器层，改为「首项渲染尾拷贝（绝对定位 count*dim）、末项渲染头拷贝
 *     （绝对定位 -count*dim）」——视觉序与 Vue 完全一致，DOM 序不同；
 *  3. virtualHost 关闭：本组件节点即布局盒（宽高内联样式由父下发）。
 */
import {CuComponent} from '../../shared/component'

CuComponent({
  options: {multipleSlots: false},

  properties: {
    /** Vue 版拷贝标记；小程序版拷贝由宿主 item 自渲染，保留 API 兼容 */
    isCopy: {type: Boolean, value: false},
  },

  data: {
    boxStyle: '',
    copyStyle: '',
    fadeStyle: '',
  },

  relations: {
    '../swiper/index': {
      type: 'ancestor',
      linked(this: unknown, parent: WechatMiniprogram.Component.TrivialInstance) {
        ;(this as unknown as {__swiper?: WechatMiniprogram.Component.TrivialInstance | null}).__swiper = parent
      },
      unlinked(this: unknown) {
        ;(this as unknown as {__swiper?: WechatMiniprogram.Component.TrivialInstance | null}).__swiper = null
      },
    },
  },

  methods: {
    /** 尺寸下发（slide 横向 → width；slideY 纵向 → height；fade → width） */
    setDimensions(dimension: number, isVertical: boolean) {
      this.setData({
        boxStyle: isVertical ? `height: ${dimension}px;` : `width: ${dimension}px;`,
      })
    },

    /** loop 拷贝定位（left 绝对偏移；null 关闭拷贝） */
    setCopy(left: number | null) {
      if (left === null) {
        if (this.data.copyStyle) {
          this.setData({copyStyle: ''})
        }
        return
      }
      const base = this.data.boxStyle || ''
      this.setData({
        copyStyle: `${base}position: absolute; left: ${left}px; top: 0;`,
      })
    },

    /** fade 透明度受控（transition 传空串关闭过渡） */
    setFade(opacity: number, transition: string) {
      this.setData({
        fadeStyle: `opacity: ${opacity};${transition ? ` transition: ${transition};` : ''}`,
      })
    },
  },
})

/**
 * Source: packages/vue/src/components/image-viewer/ImageViewer.vue
 *
 * 映射：
 *  props    modelValue→show(false), list(Array<string|{url,alt,cls}>→Object), initialIndex(0),
 *           hasDots(true)
 *  events   update:modelValue→change({value})（显隐回流）；
 *           change({fromIndex, toIndex})（Vue emit('change', from, to)——与显隐 change
 *           同名不同载荷，按 detail 字段区分，见差异 3）；show/hide 无（Vue 无此事件）
 *  slots    无
 *  methods  无（Vue defineExpose 未暴露）
 *
 * 平台差异（有意为之）：
 *  1. Vue 的 CuSwiper（自研滚动引擎）→ 原生 <swiper>（current + bindchange 语义对齐
 *     after-change：切换完成后更新 currentImgIndex 并派发 change）。
 *  2. 双指缩放：Vue 底层 swiper 支持 pinch 缩放，小程序 swiper 无等价能力，本移植
 *     简化为仅切换（任务允许的声明式简化）。
 *  3. Vue 的 update:modelValue 与 change 两个事件在小程序统一映射为 change（§3 规则 2
 *     + 事件名对齐），载荷分别为 {value:boolean} 与 {fromIndex,toIndex}，互不混淆。
 *  4. <img> → <image mode="widthFix">（宽 100%、高按比例，视觉对齐 .item>img 规则；
 *     alt/cls 为 Web 语义 no-op）。
 *  5. 点击任意处关闭（Vue onViewerClick，含图片点击）；显隐走自带 fixed 容器
 *     （image-viewer.wxss 的 .cu-image-viewer，z-index 为 image-viewer-zindex token）。
 */
import {CuComponent} from '../../shared/component'
import {normalizeList, type ImageViewerItem} from './logic'

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** Vue modelValue（受控显隐） */
    show: {type: Boolean, value: false},
    /** Array<string | {url, alt, cls}> */
    list: {type: Object, value: []},
    initialIndex: {type: Number, value: 0},
    hasDots: {type: Boolean, value: true},
  },

  data: {
    isViewerShow: false,
    imgs: [] as ImageViewerItem[],
    currentImgIndex: 0,
  },

  observers: {
    show(val: boolean) {
      // Vue watch(modelValue)：复位 initialIndex → 显隐 → 下一帧 imgsInit
      this.setData({currentImgIndex: this.data.initialIndex, isViewerShow: val})
      wx.nextTick(() => this.imgsInit())
    },
    isViewerShow(val: boolean) {
      // Vue watch(isViewerShow) → emit update:modelValue
      this.triggerEvent('change', {value: val})
    },
  },

  lifetimes: {
    attached() {
      // v2 mounted：初始显隐；initialIndex 在挂载即打开时同样生效
      const isViewerShow = this.data.show
      const patch: Record<string, unknown> = {isViewerShow}
      if (isViewerShow) {
        patch.currentImgIndex = this.data.initialIndex
        patch.imgs = normalizeList(this.data.list)
      }
      this.setData(patch)
    },
  },

  methods: {
    /** Vue imgsInit：list 归一化为 {url} 对象 */
    imgsInit() {
      this.setData({imgs: normalizeList(this.data.list)})
    },

    /** Vue afterChange：更新索引 + emit change(from, to) */
    onSwiperChange(e: WechatMiniprogram.SwiperChange) {
      const toIndex = e.detail.current
      const fromIndex = this.data.currentImgIndex
      if (toIndex === fromIndex) return
      this.setData({currentImgIndex: toIndex})
      this.triggerEvent('change', {fromIndex, toIndex})
    },

    /** Vue onViewerClick：点击任意处关闭 */
    onViewerClick() {
      this.setData({isViewerShow: false})
    },

    noop() {},
  },
})

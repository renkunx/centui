/**
 * Source: packages/vue/src/components/bill/Bill.vue
 *
 * 映射：
 *  props    title(''), no(''，String|number), waterMark('')
 *  events   无
 *  slots    默认插槽（明细区）；header 具名插槽（提供时替换 title/no，Vue hasHeaderSlot
 *           语义以「插槽兜底内容」实现）；footer 具名插槽（Vue 包一层 .cu-bill-footer，
 *           且仅在有内容时渲染——小程序无法探测插槽内容，改为常驻插槽节点，
 *           空插槽不产生可见节点，视觉等价，差异声明）；watermark 作用域插槽
 *           （:coord）无作用域插槽等价物，no-op（差异声明）
 *
 * 平台差异：
 *  1. Vue 版整体包裹 CuWaterMark（content=waterMark）；cu-water-mark 尚未移植，
 *     按规范先行 usingComponents 引用相对路径。根类 .cu-bill（背景/定位）挂在本组件
 *     自有包裹节点上（Vue 挂在 water-mark 根），盒模型等价。
 *  2. .cu-bill-neck 的分隔线在 styl 源中使用 span 元素选择器，小程序无 span 节点、
 *     规则不可达——以 inline style 按同一 token（--color-border-element）复现，
 *     已在 wxml 处注明（唯一一处 inline 静态样式）。
 */
import {CuComponent} from '../../shared/component'
import {buildNoLabel} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    title: {type: String, value: ''},
    no: {type: String, optionalTypes: [Number], value: ''},
    waterMark: {type: String, value: ''},
  },

  data: {
    noLabel: '',
  },

  observers: {
    no(no: string) {
      this.setData({noLabel: buildNoLabel(no as unknown as string | number)})
    },
  },

  lifetimes: {
    attached() {
      this.setData({noLabel: buildNoLabel(this.data.no as unknown as string | number)})
    },
  },
})

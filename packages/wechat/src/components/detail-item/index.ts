/**
 * Source: packages/vue/src/components/detail-item/DetailItem.vue
 *
 * 映射：
 *  props    title(''), content(''，String|number), bold(false)
 *  events   无
 *  slots    默认插槽兜底 content（Vue: <slot>{{ content }}</slot>，语义一致）
 *
 * 平台差异：
 *  小程序（基础库 3.8.0 实测）不支持 <slot>{{fallback}}</slot> 插槽回退写法——
 *  含该写法的组件会使整页 wxml 渲染静默失败（无任何报错）。
 *  因此回退改为 ready 时测量探测：插槽包裹节点尺寸 > 0 视为有插槽内容，
 *  否则渲染 content 兜底文本。首帧可能闪现兜底文本，不支持运行中动态增删插槽。
 */
import {CuComponent} from '../../shared/component'

CuComponent({
  options: {virtualHost: true},

  properties: {
    title: {type: String, value: ''},
    content: {type: String, optionalTypes: [Number], value: ''},
    bold: {type: Boolean, value: false},
  },

  data: {
    hasSlot: false,
  },

  lifetimes: {
    ready() {
      this.createSelectorQuery()
        .select('#cu-detail-slot-probe')
        .boundingClientRect((rect: {width: number; height: number} | null) => {
          const hasSlot = !!rect && rect.width > 0 && rect.height > 0
          // 度量去重：仅在实际变化时写回
          if (hasSlot !== this.data.hasSlot) {
            this.setData({hasSlot})
          }
        })
        .exec()
    },
  },
})

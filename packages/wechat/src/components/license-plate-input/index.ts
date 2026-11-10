/**
 * Source: packages/vue/src/components/license-plate/LicensePlateInput.vue
 *
 * 映射：
 *  props    keyArray(string[]), selectedIndex(0)
 *  events   keyMapping({index})（Vue 载荷为 index 裸值，小程序统一 detail 对象）
 *  slots    无
 *
 * 平台差异：无（独立组件目录以承载 license-plate-input.styl 的构建产物）。
 */
import {CuComponent} from '../../shared/component'

CuComponent({
  options: {virtualHost: true},

  properties: {
    keyArray: {type: Object, value: [] as string[]},
    selectedIndex: {type: Number, value: 0},
  },

  data: {
    items: [] as Array<{value: string; active: boolean; animation: boolean; isNewEnergy: boolean}>,
  },

  observers: {
    'keyArray, selectedIndex'(keyArray: string[], selectedIndex: number) {
      const list = Array.isArray(keyArray) ? keyArray : []
      this.setData({
        items: list.map((item, index) => ({
          value: item ?? '',
          active: selectedIndex === index,
          animation: selectedIndex === index && !item,
          isNewEnergy: index === list.length - 1,
        })),
      })
    },
  },

  lifetimes: {
    attached() {
      const list = Array.isArray(this.data.keyArray) ? this.data.keyArray : []
      this.setData({
        items: list.map((item, index) => ({
          value: item ?? '',
          active: this.data.selectedIndex === index,
          animation: this.data.selectedIndex === index && !item,
          isNewEnergy: index === list.length - 1,
        })),
      })
    },
  },

  methods: {
    onItemTap(e: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('keyMapping', {index: Number((e.currentTarget.dataset as {index: number}).index)})
    },
  },
})

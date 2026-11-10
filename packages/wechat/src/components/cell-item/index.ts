/**
 * Source: packages/vue/src/components/cell-item/CellItem.vue
 *
 * 映射：
 *  props    title, brief, addon, arrow, disabled, noBorder
 *  events   click（disabled 时不触发，对齐 Vue onClick 守卫）
 *  slots    left / 默认 / right（缺省回退 addon）/ children
 *
 * 平台差异：
 *  1. 插槽有无探测：小程序无法同步获知插槽是否有内容，left/content/right/children
 *     包裹节点的显隐改为 ready 时 createSelectorQuery 测量后回写（首帧可能闪现空包裹，
 *     且不支持运行中动态增删插槽内容）。title/brief/arrow/addon 等 prop 驱动的分支与
 *     Vue 版一致。
 *  2. <p> 语义标签以 <view> 等价实现（无差异样式，类名与 Vue 版相同）。
 */
import {CuComponent} from '../../shared/component'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    title: {type: String, value: ''},
    brief: {type: String, value: ''},
    addon: {type: String, value: ''},
    arrow: {type: Boolean, value: false},
    disabled: {type: Boolean, value: false},
    noBorder: {type: Boolean, value: false},
  },

  data: {
    // 插槽/内容包裹节点显隐：初始渲染全部包裹节点以便 ready 测量，空的随后隐藏
    showLeft: true,
    showContent: true,
    showRight: true,
    showChildren: true,
    // 初始假定 right 插槽有内容（addon 回退不渲染），ready 探测后校正，
    // 避免回退内容污染插槽探测结果
    rightFilled: true,
  },

  observers: {
    title(val: string) {
      if (val) this.setData({showContent: true})
    },
    brief(val: string) {
      if (val) this.setData({showContent: true})
    },
    'addon, arrow'(addon: string, arrow: boolean) {
      if (addon || arrow) this.setData({showRight: true})
    },
  },

  lifetimes: {
    ready() {
      this.__probeSlots()
    },
  },

  methods: {
    onTap() {
      if (!this.data.disabled) {
        this.triggerEvent('click')
      }
    },

    /** 测量各插槽包裹节点：高度为 0 视为无内容（prop 驱动的分支除外） */
    __probeSlots() {
      const query = this.createSelectorQuery()
      query.select('.cu-cell-item-left').boundingClientRect()
      query.select('.cu-cell-item-content').boundingClientRect()
      query.select('.cu-cell-item-right').boundingClientRect()
      query.select('.cu-cell-item-children').boundingClientRect()
      query.exec((rects: Array<{height: number} | null> | null) => {
        if (!rects) return
        const patch: Record<string, boolean> = {}
        const [left, content, right, children] = rects
        if (left && !(left.height > 0)) patch.showLeft = false
        if (content && !(content.height > 0) && !this.data.title && !this.data.brief) {
          patch.showContent = false
        }
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
})

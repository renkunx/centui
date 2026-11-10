/**
 * Source: packages/vue/src/components/action-bar/ActionBar.vue
 *
 * 映射：
 *  props    actions（ActionBarAction[]，最多渲染前两个，v2 契约）
 *  events   click（Vue 载荷 (event, action) → 小程序 detail {action, index}，
 *           action 为原始对象；tap 事件对象本身不透传——差异声明）
 *  slots    默认插槽（文本区，有内容时渲染于按钮组左侧）
 *
 * 平台差异：
 *  1. action.onClick 回调无法经 wxml 属性传入（小程序属性不可携带函数），
 *     点击统一触发组件 click 事件（载荷含 action 与 index），差异声明。
 *  2. 默认插槽有无的判断（Vue hasSlots 渲染期同步判断）以「插槽探针」实现：
 *     ready 后探测兜底节点是否存在，一帧内收敛为 Vue 的渲染结果。
 *  3. cu-button 为虚拟宿主组件且未启用外部类占位，.cu-action-bar-button 类
 *     （flex:1 / 浮动 / 间距）挂在本组件自有的包裹 view 上，视觉与 Vue 一致。
 *  4. 本组件 styleIsolation: shared——.cu-action-bar-button 规则需命中
 *     apply-shared 的子组件树内节点。
 */
import {CuComponent} from '../../shared/component'
import {toButtonVMs, type ActionBarAction} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    actions: {type: Object, value: [] as ActionBarAction[]},
  },

  data: {
    buttons: [] as ReturnType<typeof toButtonVMs>,
    hasText: true,
  },

  observers: {
    actions(actions: ActionBarAction[]) {
      this.setData({buttons: toButtonVMs(Array.isArray(actions) ? actions : [])})
    },
  },

  lifetimes: {
    ready() {
      // 插槽探针：兜底节点存在 = 默认插槽为空 → 收起文本区（对齐 Vue hasSlots）
      const query = this.createSelectorQuery()
      query.select('#cu-ab-text-probe').boundingClientRect()
      query.exec((res: Array<unknown | null>) => {
        if (res && res[0] !== null) {
          this.setData({hasText: false})
        }
      })
    },
  },

  methods: {
    onBtnClick(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const actions = (Array.isArray(this.data.actions) ? this.data.actions : []) as ActionBarAction[]
      const action = actions[index]
      this.triggerEvent('click', {action, index})
    },
  },
})

/**
 * Source: packages/vue/src/components/tabs/{Tabs,TabBar}.vue
 *
 * tab 条 + ink bar（异步量取几何）+ 面板切换（cu-tab-pane 子组件经 relations 注册）。
 *
 * 映射：
 *  props    modelValue→value(String|Number), hasInk(true), inkLength(25，百分比数字
 *           或字符串 px), immediate(false)
 *  events   update:modelValue + change(TabBarItem) 合并为 'change'：载荷
 *           {value, tab, index, prevIndex}（差异 2）
 *  slots    默认插槽（cu-tab-pane）；TabBar 的 item 作用域插槽 → 不支持，恒渲染
 *           label 文本（差异 3）
 *  方法     reflowTabBar()（Vue defineExpose reflowTabBar → TabBar.reflow）
 *
 * 平台差异（有意为之）：
 *  1. TabBar 内嵌 CuScrollView → 原生 scroll-view（scroll-x）+ scroll-left 定位；
 *     ink bar 为滚动内容内的绝对定位节点（随内容滚动，与 Vue 定位语义一致），
 *     几何经 createSelectorQuery 异步量取（对照 TabBar.reflow）。
 *  2. Vue 的 update:modelValue(name) 与 change(tab) 双事件在小程序同以 'change'
 *     承载（value/tab 字段并存），v-model 协议按 §3.2 以 value 字段对齐。
 *  3. item 作用域插槽不可用；tab 条渐变遮罩（.cu-tab-bar-start/end）保留渲染。
 *  4. window resize 监听无平台对应物；提供 reflowTabBar() 供布局变化后手动触发。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  inkGeometryOf,
  maskVisibilityOf,
  scrollTargetOf,
  type ItemRect,
  type TabBarItem,
} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

/** tab-pane 结构化接口（relations 通道） */
interface TabPaneLike {
  data?: {name?: string | number; label?: string; disabled?: boolean}
  setActive?: (active: boolean, transitionName: 'cu-tab-slide-left' | 'cu-tab-slide-right') => void
}

interface TabsState {
  timers: TimerRegistry
  panes: Instance[]
  prevIndex: number
  immediateFired: boolean
}

function state(ctx: unknown): TabsState {
  const self = ctx as {__tabs?: TabsState}
  if (!self.__tabs) {
    self.__tabs = {timers: createTimerRegistry(ctx), panes: [], prevIndex: 0, immediateFired: false}
  }
  return self.__tabs
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue：当前 tab 名 */
    value: {type: String, optionalTypes: [Number], value: ''},
    hasInk: {type: Boolean, value: true},
    /** 百分比数字（相对激活项宽度）或字符串（直接作 px） */
    inkLength: {type: Number, optionalTypes: [String], value: 25},
    immediate: {type: Boolean, value: false},
  },

  data: {
    items: [] as TabBarItem[],
    currentName: '' as string | number,
    currentIndex: 0,
    inkStyle: '',
    scrollLeft: 0,
    scrollable: false,
    maskStartShown: false,
    maskEndShown: true,
    contentWidth: 0,
    wrapperWidth: 0,
  },

  observers: {
    value(val: string | number) {
      if (val !== this.data.currentName) {
        this.__applyCurrentName(val)
      }
    },
  },

  lifetimes: {
    attached() {
      state(this)
    },
    ready() {
      this.reflowTabBar()
      // 对齐 TabBar.resizeEnterBehavior：immediate 时 emit change(当前项, index, index)
      const s = state(this)
      if (this.data.immediate && !s.immediateFired) {
        s.immediateFired = true
        const item = this.data.items[this.data.currentIndex]
        if (item) {
          this.triggerEvent('change', {
            value: item.name,
            tab: {name: item.name, label: item.label, disabled: item.disabled},
            index: this.data.currentIndex,
            prevIndex: this.data.currentIndex,
          })
        }
      }
    },
    detached() {
      state(this).timers.clearAll()
    },
  },

  relations: {
    '../tab-pane/index': {
      type: 'descendant', // 基础库 3.8 实测：'child' 在「子组件由页面模板引用」时 relation 匹配崩溃渲染层，descendant 语义等价
      linked(this: unknown, pane: Instance) {
        const s = state(this)
        if (s.panes.indexOf(pane) === -1) s.panes.push(pane)
        ;(this as unknown as {syncPanes(): void}).syncPanes()
      },
      unlinked(this: unknown, pane: Instance) {
        const s = state(this)
        const idx = s.panes.indexOf(pane)
        if (idx >= 0) s.panes.splice(idx, 1)
        ;(this as unknown as {syncPanes(): void}).syncPanes()
      },
    },
  },

  methods: {
    // ------------------------------------------------------------------
    // 面板登记（对齐 rootTabs addPane/removePane/forceUpdate）
    // ------------------------------------------------------------------
    syncPanes() {
      const s = state(this)
      const items: TabBarItem[] = s.panes.map((raw, i) => {
        const pane = raw as unknown as TabPaneLike
        return {
          name: pane.data?.name ?? '',
          label: pane.data?.label ?? '',
          disabled: !!pane.data?.disabled,
          no: i,
        }
      })
      const patch: Record<string, unknown> = {items}
      // 对齐 Tabs.onMounted：未指定 value 时默认首项（静默，不 emit）
      if (!this.data.currentName && items.length) {
        patch.currentName = items[0].name
        patch.currentIndex = 0
      }
      this.setData(patch)
      this.__distribute()
      s.timers.setTimeout(() => this.reflowTabBar(), 0)
    },

    __distribute() {
      const s = state(this)
      const currentName = this.data.currentName
      const currentIndex = this.__indexOf(currentName)
      s.panes.forEach((raw) => {
        const pane = raw as unknown as TabPaneLike
        if (typeof pane.setActive !== 'function') return
        const active = pane.data?.name === currentName
        const transition = s.prevIndex > currentIndex ? 'cu-tab-slide-right' : 'cu-tab-slide-left'
        pane.setActive(active, transition)
      })
    },

    __indexOf(name: string | number): number {
      const items = this.data.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].name === name) return i
      }
      return 0
    },

    __applyCurrentName(name: string | number) {
      const s = state(this)
      const prev = this.data.currentIndex
      s.prevIndex = prev
      this.setData({currentName: name, currentIndex: this.__indexOf(name)})
      this.__distribute()
      s.timers.setTimeout(() => this.reflowTabBar(), 0)
    },

    // ------------------------------------------------------------------
    // tab 条
    // ------------------------------------------------------------------
    onItemTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const item = this.data.items[index]
      if (!item || item.disabled) return
      const s = state(this)
      const prevIndex = this.data.currentIndex
      s.prevIndex = prevIndex
      this.setData({currentName: item.name, currentIndex: index})
      this.triggerEvent('change', {
        value: item.name,
        tab: {name: item.name, label: item.label, disabled: item.disabled},
        index,
        prevIndex,
      })
      this.__distribute()
      s.timers.setTimeout(() => this.reflowTabBar(), 0)
    },

    onBarScroll(e: WechatMiniprogram.ScrollViewScroll) {
      const {start, end} = maskVisibilityOf(
        e.detail.scrollLeft,
        this.data.contentWidth,
        this.data.wrapperWidth,
      )
      this.setData({maskStartShown: start, maskEndShown: end})
    },

    /** ink 几何与自动滚动（TabBar.reflow 移植，全部异步量取） */
    reflowTabBar() {
      if (!this.data.items.length) return
      const query = this.createSelectorQuery()
      query.select('.cu-tab-bar-inner').boundingClientRect()
      query.select('.cu-tab-bar-scroll-content').boundingClientRect()
      query.selectAll('.cu-tab-bar-item').boundingClientRect()
      query.exec((res) => {
        if (!res) return
        const [wrapper, content, itemRects] = res as [
          WechatMiniprogram.BoundingClientRectCallbackResult | null,
          WechatMiniprogram.BoundingClientRectCallbackResult | null,
          Array<WechatMiniprogram.BoundingClientRectCallbackResult> | null,
        ]
        if (!wrapper || !content || !itemRects) return
        const wrapperW = wrapper.width
        const contentLeft = content.left
        const rects: ItemRect[] = itemRects.map((r) => ({
          left: r.left - contentLeft,
          width: r.width,
        }))
        const contentW = rects.reduce((sum, r) => sum + r.width, 0)
        const scrollable = contentW > wrapperW

        const index = this.data.currentIndex
        const patch: Record<string, unknown> = {
          contentWidth: contentW,
          wrapperWidth: wrapperW,
          scrollable,
        }
        const current = rects[index]
        if (current && this.data.hasInk) {
          const ink = inkGeometryOf(current, this.data.inkLength as number | string)
          patch.inkStyle = `width: ${ink.width}px; transform: translateX(${ink.pos}px);`
        }
        const target = scrollTargetOf(index, rects, contentW, wrapperW, this.data.scrollLeft)
        if (target !== null) {
          patch.scrollLeft = target
        }
        const masks = maskVisibilityOf(this.data.scrollLeft, contentW, wrapperW)
        patch.maskStartShown = masks.start
        patch.maskEndShown = masks.end
        this.setData(patch)
      })
    },
  },
})

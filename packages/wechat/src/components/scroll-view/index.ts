/**
 * Source: packages/vue/src/components/scroll-view/{ScrollView,ScrollViewMore,ScrollViewRefresh}.vue
 *
 * 下拉刷新 + 触底加载。外层为原生 scroll-view（scroll-y / scroll-x），下拉刷新自绘
 * （translate 下拉距离与 v2 阈值语义对齐），触底经 scroll 事件 + endOffset 阈值判定。
 *
 * 映射：
 *  props    scrollingX, scrollingY, bouncing, autoReflow, manualInit,
 *           endReachedThreshold(0, px), immediateCheckEndReaching, touchAngle, isPrevent
 *           + defaultRefresher(Boolean, 默认 false——内置刷新头开关，差异 4)
 *           + refreshText/refreshActiveText/refreshingText/rollerColor（ScrollViewRefresh 透传）
 *  events   refreshActive / refreshing / endReached / scroll {scrollLeft,scrollTop}
 *           （Vue 同时 emit 'endReached' 与 'end-reached'，小程序统一 camelCase endReached——差异 5）
 *  slots    header / footer / refresh / more / 默认
 *  方法     init / scrollTo / getOffsets / reflowScroller / triggerRefresh /
 *           finishRefresh / finishLoadMore（Vue defineExpose 契约）
 *
 * 平台差异（有意为之）：
 *  1. @centui/core/web Scroller → 原生 scroll-view 滚动（无自定义动量/回弹；
 *     bouncing 仅在 enhanced 特性下由 bounces 属性透传）；滚动位置/内容尺寸取自
 *     scroll 事件 detail 与 createSelectorQuery 缓存。
 *  2. 作用域插槽（refresh 槽的 scrollTop/isRefreshing/isRefreshActive 与 more 槽的
 *     isEndReaching）不可用——自定义刷新头经 slot="refresh" 静态渲染，动态状态通过
 *     refreshActive/refreshing 事件与 getRefreshState() 方法获取。
 *  3. 槽位探测（$slots.header 等）改为「包装节点常渲染 + 尺寸探测」：header/footer/
 *     refresh/more 包装节点始终渲染，空内容零尺寸无视觉影响；刷新头高度为 0 时
 *     下拉逻辑自动不激活（等价 hasRefresher=false）。
 *  4. defaultRefresher 为小程序侧新增开关属性：true 时渲染内置刷新头
 *     （cu-activity-indicator roller + 文案，等价 ScrollViewRefresh 组合）；
 *     Vue 版由用户组合 <cu-scroll-view-refresh>。
 *  5. isPrevent/touchAngle 保留 API：滚动穿透由 scroll-view 天然隔离，触摸角度门控
 *     由原生滚动接管（横向 swipe 不触发下拉）；autoReflow/manualInit 为 no-op
 *     （原生 scroll-view 自适应内容尺寸）。
 *  6. scroll-view.styl 的 .refresh-tip 色值 #999 为 styles 源字面量（非本组件引入），
 *     verify.mjs 颜色检查需在集成期统一处理（见报告）。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {animateValue, type TickerHandle} from '../../shared/ticker'
import {
  createEndReachedTrigger,
  endOffsetOf,
  pullDistanceOf,
  refreshProcessOf,
  refreshTipOf,
  type RefreshPhase,
} from './logic'

interface ScrollViewState {
  timers: TimerRegistry
  endReached: ReturnType<typeof createEndReachedTrigger> | null
  refreshAnim: TickerHandle | null
  containerH: number
  contentH: number
  moreOffsetY: number
  refreshH: number
  lastLeft: number
  lastTop: number
  startY: number
  pulling: boolean
  scrollLeftCache: number
  scrollTopCache: number
}

function state(ctx: unknown): ScrollViewState {
  const self = ctx as {__scrollView?: ScrollViewState}
  if (!self.__scrollView) {
    self.__scrollView = {
      timers: createTimerRegistry(ctx),
      endReached: null,
      refreshAnim: null,
      containerH: 0,
      contentH: 0,
      moreOffsetY: 0,
      refreshH: 0,
      lastLeft: 0,
      lastTop: 0,
      startY: 0,
      pulling: false,
      scrollLeftCache: 0,
      scrollTopCache: 0,
    }
  }
  return self.__scrollView
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    scrollingX: {type: Boolean, value: true},
    scrollingY: {type: Boolean, value: true},
    bouncing: {type: Boolean, value: true},
    autoReflow: {type: Boolean, value: false},
    manualInit: {type: Boolean, value: false},
    /** px */
    endReachedThreshold: {type: Number, value: 0},
    immediateCheckEndReaching: {type: Boolean, value: false},
    touchAngle: {type: Number, value: 45},
    isPrevent: {type: Boolean, value: true},
    /** 内置刷新头开关（差异 4） */
    defaultRefresher: {type: Boolean, value: false},
    refreshText: {type: String, value: ''},
    refreshActiveText: {type: String, value: ''},
    refreshingText: {type: String, value: ''},
    rollerColor: {type: String, value: '#2F86F6'},
  },

  data: {
    isRefreshing: false,
    isRefreshActive: false,
    /** 下拉位移（px，作用于 .scroll-view-refresh translateY） */
    pullDistance: 0,
    refreshProcess: 0,
    refreshTip: '下拉刷新',
    isEndReachingStart: false,
    isEndReaching: false,
    scrollLeft: 0,
    scrollTop: 0,
    horizon: false,
    /** 刷新头内联 transform（-100% 基准由 styl 类提供；量得高度后按 px 精确下拉） */
    refreshStyle: '',
  },

  lifetimes: {
    attached() {
      const s = state(this)
      s.endReached = createEndReachedTrigger(() => {
        this.setData({isEndReaching: true})
        this.triggerEvent('endReached')
      }, 50)
      this.setData({horizon: this.data.scrollingX && !this.data.scrollingY})
    },
    ready() {
      // 尺寸探测（异步缓存）：刷新头/加载更多高度 + 容器高度
      this.__measure()
      if (this.data.immediateCheckEndReaching) {
        state(this).timers.setTimeout(() => this.__checkEndReaching(this.data.scrollTop), 50)
      }
    },
    detached() {
      const s = state(this)
      s.endReached?.reset()
      s.refreshAnim?.stop()
      s.timers.clearAll()
    },
  },

  methods: {
    __measure() {
      const s = state(this)
      const query = this.createSelectorQuery()
      query.select('.scroll-view-container').boundingClientRect()
      query.select('.scroll-view-refresh').boundingClientRect()
      query.select('.scroll-view-more').boundingClientRect()
      query.exec((res) => {
        if (!res) return
        const [container, refresh, more] = res as Array<WechatMiniprogram.BoundingClientRectCallbackResult | null>
        if (container) s.containerH = container.height
        if (refresh) s.refreshH = refresh.height
        if (more) s.moreOffsetY = more.height
        // 量得刷新头高度后按 px 精确控制下拉位移
        this.__setPull(this.data.pullDistance)
      })
    },

    __refreshTip() {
      const d = this.data
      const phase: RefreshPhase = d.isRefreshing ? 'refreshing' : d.isRefreshActive ? 'active' : 'idle'
      this.setData({
        refreshTip: refreshTipOf(phase, {
          refreshText: d.refreshText || undefined,
          refreshActiveText: d.refreshActiveText || undefined,
          refreshingText: d.refreshingText || undefined,
        }),
      })
    },

    /** pullDistance 与刷新头 transform 同步下发（translate = pullDistance - refreshH） */
    __setPull(distance: number) {
      const s = state(this)
      const style =
        s.refreshH > 0 ? `transform: translate3d(0, ${distance - s.refreshH}px, 0)` : ''
      this.setData({pullDistance: distance, refreshStyle: style})
    },

    __checkEndReaching(scrollTop: number) {
      const s = state(this)
      const endOffset = endOffsetOf(
        s.contentH,
        s.containerH,
        scrollTop,
        s.moreOffsetY,
        this.data.endReachedThreshold,
      )
      if (scrollTop >= 0 && !this.data.isEndReaching && endOffset <= 0 && s.endReached) {
        // 先进入「准备加载」，50ms 防抖后进入「加载中」并触发 endReached（对齐 v2 两段状态）
        this.setData({isEndReachingStart: true})
        s.endReached.trigger()
      }
    },

    // ------------------------------------------------------------------
    // 原生滚动
    // ------------------------------------------------------------------
    onNativeScroll(e: WechatMiniprogram.ScrollViewScroll) {
      const s = state(this)
      const left = +Number(e.detail.scrollLeft).toFixed(2)
      const top = +Number(e.detail.scrollTop).toFixed(2)
      s.scrollLeftCache = left
      s.scrollTopCache = top
      s.contentH = e.detail.scrollHeight
      s.lastLeft = left
      s.lastTop = top
      this.setData({
        scrollTop: top,
        scrollLeft: left,
      })
      this.__checkEndReaching(top)
      this.triggerEvent('scroll', {scrollLeft: left, scrollTop: top})
    },

    // ------------------------------------------------------------------
    // 下拉刷新（自绘 translate 状态机）
    // ------------------------------------------------------------------
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const s = state(this)
      const touch = e.touches && e.touches[0]
      if (!touch) return
      s.startY = touch.pageY
      // 顶部才监听下拉（scrollTop==0；滚动中不劫持）
      s.pulling = s.scrollTopCache <= 0 && !this.data.isRefreshing
    },

    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      const s = state(this)
      if (!s.pulling) return
      const touch = e.touches && e.touches[0]
      if (!touch) return
      const dy = touch.pageY - s.startY
      if (dy <= 0) {
        // 回到顶以下：复位（未过阈值）
        if (!this.data.isRefreshActive && this.data.pullDistance !== 0) {
          this.__setPull(0)
          this.setData({isRefreshActive: false, refreshProcess: 0})
          this.__refreshTip()
        }
        return
      }
      const threshold = s.refreshH
      if (threshold <= 0) return // 无刷新头（差异 3 的自动探测）
      const distance = pullDistanceOf(dy, threshold)
      const active = distance >= threshold
      const patch: Record<string, unknown> = {}
      if (active !== this.data.isRefreshActive) {
        patch.isRefreshActive = active
        if (active) {
          patch.isRefreshing = false
          this.triggerEvent('refreshActive')
        }
        this.__refreshTip()
      }
      patch.refreshProcess = refreshProcessOf(distance, threshold)
      this.setData(patch)
      this.__setPull(distance)
    },

    onTouchEnd() {
      const s = state(this)
      if (!s.pulling) return
      s.pulling = false
      const threshold = s.refreshH
      if (threshold <= 0) return
      if (this.data.isRefreshActive) {
        // 进入刷新：吸附到刷新头全高
        s.refreshAnim?.stop()
        this.setData({isRefreshActive: false, isRefreshing: true, refreshProcess: 0})
        this.__setPull(threshold)
        this.__refreshTip()
        this.triggerEvent('refreshing')
      } else if (this.data.pullDistance > 0) {
        // 弹回原位（200ms，对齐 v2 animationDuration）
        const from = this.data.pullDistance
        s.refreshAnim?.stop()
        s.refreshAnim = animateValue({
          from,
          to: 0,
          duration: 200,
          onUpdate: (v) => this.__setPull(v),
        })
      }
    },

    // ------------------------------------------------------------------
    // 公开 API（Vue defineExpose 契约）
    // ------------------------------------------------------------------
    /** 兼容 API：原生 scroll-view 无需手动初始化（manualInit 语义 no-op，差异 5） */
    init() {},

    scrollTo(left: number, top: number, _animate = false) {
      // 原生 scroll-view 仅支持纵向 scroll-top 定位（横向经 transform 的场景不适用）
      void left
      this.setData({scrollTop: top})
      state(this).scrollTopCache = top
    },

    getOffsets(): {left: number; top: number} {
      const s = state(this)
      return {left: s.scrollLeftCache, top: s.scrollTopCache}
    },

    /** 兼容 API：重测刷新头/更多/容器尺寸 */
    reflowScroller() {
      this.__measure()
    },

    /** 程序化触发刷新（对齐 triggerPullToRefresh） */
    triggerRefresh() {
      const s = state(this)
      if (s.refreshH <= 0 || this.data.isRefreshing) return
      this.setData({isRefreshing: true, refreshProcess: 0})
      this.__setPull(s.refreshH)
      this.__refreshTip()
      this.triggerEvent('refreshing')
    },

    /** 刷新完成：回弹并复位（对齐 finishPullToRefresh） */
    finishRefresh() {
      const s = state(this)
      if (!this.data.isRefreshing) return
      s.refreshAnim?.stop()
      const from = this.data.pullDistance
      s.refreshAnim = animateValue({
        from,
        to: 0,
        duration: 200,
        onUpdate: (v) => this.__setPull(v),
        onComplete: () => this.setData({isRefreshing: false}),
      })
      this.__measure()
    },

    /** 加载更多完成：复位两段触底状态 */
    finishLoadMore() {
      state(this).endReached?.reset()
      this.setData({isEndReachingStart: false, isEndReaching: false})
      this.__measure()
    },

    /** 差异 2：作用域参数替代读取口 */
    getRefreshState() {
      const d = this.data
      return {
        scrollTop: d.scrollTop,
        isRefreshing: d.isRefreshing,
        isRefreshActive: d.isRefreshActive,
      }
    },
  },
})

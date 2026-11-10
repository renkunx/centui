/**
 * Source: packages/vue/src/components/swiper/Swiper.vue（含 SwiperItem.vue 配套）
 *
 * 轮播：drag-ticker 时代的横向/纵向滑动 + 自动播放 + loop 首尾拷贝 + fade 过渡。
 *
 * 映射：
 *  props    autoplay(3000), transition(slide/slideY/fade), transitionDuration(250),
 *           defaultIndex(0), hasDots(true), isPrevent, isLoop(true), dragable(true),
 *           useNativeDriver（no-op，差异 5）
 *  events   beforeChange(from, to)（Vue 同名）；
 *           afterChange(from, to)（Vue 'after-change'，统一 camelCase——差异 4）
 *  slots    默认插槽（cu-swiper-item 子项）
 *  方法     next / prev / goto(displayIndex) / getIndex / play(d) / stop
 *
 * 平台差异（有意为之）：
 *  1. Scroller(@centui/core/web) → 手势平移（1:1，无动量）+ shared/ticker.animateValue
 *     线性补间（Vue 为 scroller scrollTo 缓动，近似）；
 *  2. loop 拷贝经 swiper-item 组件内二次渲染 slot + 绝对定位实现（React 版教训：
 *     ready 异步量取真实 dimension 后才下发尺寸/拷贝/定位，mount 不同步定位）；
 *  3. 快速拖拽判定（<300ms 必翻页）、角度门控（isPageScrolling）与 v2 一致；
 *     isPrevent 保留 API 但触摸层恒 catch:touchmove（等价 preventDefault=true 分支）；
 *  4. Vue emits 'beforeChange' + 'after-change' 命名不一致，小程序统一 camelCase：
 *     beforeChange / afterChange；
 *  5. useNativeDriver 为 Web 渲染层概念，no-op；resize 监听（window resize）无平台
 *     对应物，尺寸变化需重新插入组件或调用 play() 触发重测。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {animateValue, type TickerHandle} from '../../shared/ticker'
import {OffsetFlusher} from '../picker/logic'
import {
  calcDisplayIndex,
  calcRealIndex,
  copyOffsets,
  fadeNeighbor,
  geometryOf,
  initialRealIndex,
  isPageScrolling,
  nextIndex,
  pagingTowards,
  PAGING_DURATION,
} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance
type TouchEvent = WechatMiniprogram.TouchEvent

/** swiper-item 结构化接口（relations 下发的受控口） */
interface SwiperItemLike {
  setDimensions?: (dimension: number, isVertical: boolean) => void
  setCopy?: (left: number | null) => void
  setFade?: (opacity: number, transition: string) => void
}

const TOUCH_ANGLE = 45

interface DragState {
  startTime: number
  startLeft: number
  startTop: number
  currentLeft?: number
  currentTop?: number
}

interface SwiperState {
  timers: TimerRegistry
  flusher: OffsetFlusher
  items: Instance[]
  reinitTimer: number | null
  anim: TickerHandle | null
  fadeTimer: number | null
  autoplayTimer: number | null
  duration: number
  // 几何
  oItemCount: number
  rItemCount: number
  dimension: number
  isSlide: boolean
  isVertical: boolean
  firstIndex: number
  lastIndex: number
  index: number
  fromIndex: number
  toIndex: number
  offset: number
  // 手势
  dragging: boolean
  userScrolling: boolean | null
  dragState: DragState
  isStoped: boolean
  ready: boolean
}

function state(ctx: unknown): SwiperState {
  const self = ctx as {__swiper?: SwiperState}
  if (!self.__swiper) {
    const host = self as unknown as {setData(patch: Record<string, unknown>): void}
    self.__swiper = {
      timers: createTimerRegistry(ctx),
      flusher: new OffsetFlusher((patch) => host.setData(patch)),
      items: [],
      reinitTimer: null,
      anim: null,
      fadeTimer: null,
      autoplayTimer: null,
      duration: 0,
      oItemCount: 0,
      rItemCount: 0,
      dimension: 0,
      isSlide: true,
      isVertical: false,
      firstIndex: 0,
      lastIndex: 0,
      index: 0,
      fromIndex: 0,
      toIndex: 0,
      offset: 0,
      dragging: false,
      userScrolling: null,
      dragState: {startTime: 0, startLeft: 0, startTop: 0},
      isStoped: true,
      ready: false,
    }
  }
  return self.__swiper
}

function axisOf(self: {data: {isVertical: boolean}}): 'x' | 'y' {
  return self.data.isVertical ? 'y' : 'x'
}

function setTranslate(ctx: unknown, offset: number) {
  const s = state(ctx)
  s.offset = offset
  s.flusher.set('translate', -offset)
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    autoplay: {type: Number, value: 3000},
    /** slide | slideY | fade */
    transition: {type: String, value: 'slide'},
    transitionDuration: {type: Number, value: 250},
    defaultIndex: {type: Number, value: 0},
    hasDots: {type: Boolean, value: true},
    isPrevent: {type: Boolean, value: true},
    isLoop: {type: Boolean, value: true},
    dragable: {type: Boolean, value: true},
    /** no-op（差异 5） */
    useNativeDriver: {type: Boolean, value: true},
  },

  data: {
    translate: 0,
    axis: 'x',
    isVertical: false,
    isFade: false,
    isInitial: false,
    indicatorCount: 0,
    currentIndex: 0,
  },

  lifetimes: {
    attached() {
      const s = state(this)
      const transition = this.data.transition
      s.isSlide = transition.toLowerCase().indexOf('slide') !== -1
      s.isVertical = transition === 'slideY'
      // 先写 isVertical 再派生 axis（axisOf 读 data.isVertical，顺序颠倒会把
      // 纵向轮播按 translateX 位移）
      this.setData({isVertical: s.isVertical, isFade: !s.isSlide})
      this.setData({axis: axisOf(this)})
      s.duration = this.data.autoplay
    },
    ready() {
      const s = state(this)
      s.ready = true
      // React 版教训：先异步量取真实尺寸，再定位/下发拷贝
      this.createSelectorQuery()
        .select('.cu-swiper')
        .boundingClientRect((rect) => {
          const r = rect as WechatMiniprogram.BoundingClientRectCallbackResult | null
          if (!r) return
          state(this).dimension = state(this).isVertical ? r.height : r.width
          this.__reInitItems()
          this.play(state(this).duration || this.data.autoplay)
        })
        .exec()
    },
    detached() {
      const s = state(this)
      s.anim?.stop()
      if (s.reinitTimer != null) {
        clearTimeout(s.reinitTimer)
        s.reinitTimer = null
      }
      s.flusher.clear()
      this.stop()
      s.timers.clearAll()
    },
  },

  relations: {
    '../swiper-item/index': {
      type: 'descendant', // 基础库 3.8 实测：'child' 在「子组件由页面模板引用」时 relation 匹配崩溃渲染层，descendant 语义等价
      linked(this: unknown, item: Instance) {
        const s = state(this)
        if (s.items.indexOf(item) === -1) s.items.push(item)
        ;(this as unknown as {__debouncedReInit(): void}).__debouncedReInit()
      },
      unlinked(this: unknown, item: Instance) {
        const s = state(this)
        const idx = s.items.indexOf(item)
        if (idx >= 0) s.items.splice(idx, 1)
        ;(this as unknown as {__debouncedReInit(): void}).__debouncedReInit()
      },
    },
  },

  methods: {
    /** 50ms 防抖重建（对齐 Vue debouncedReInit） */
    __debouncedReInit() {
      const s = state(this)
      if (!s.ready) return
      if (s.reinitTimer != null) return
      s.reinitTimer = setTimeout(() => {
        s.reinitTimer = null
        this.stop()
        this.__reInitItems()
        if (!s.isStoped) {
          this.play(s.duration)
        }
      }, 50)
    },

    __reInitItems(startIndex?: number) {
      const s = state(this)
      const count = s.items.length
      if (!count) return

      s.oItemCount = count
      const geometry = geometryOf(count, this.data.transition, this.data.isLoop, s.dimension)
      s.rItemCount = geometry.rItemCount
      s.isSlide = geometry.isSlide
      s.isVertical = geometry.isVertical

      // initState
      s.index = initialRealIndex(startIndex, this.data.defaultIndex, count)
      s.firstIndex = 0
      s.lastIndex = count - 1
      s.fromIndex =
        s.index === s.firstIndex
          ? s.lastIndex
          : s.index === s.lastIndex
            ? s.firstIndex
            : s.index + 1
      s.toIndex = s.index

      // backupItem（loop 拷贝占位）
      const hasCopies = s.items.length > 1 && this.data.isLoop && s.isSlide
      if (hasCopies) {
        s.firstIndex++
        s.lastIndex++
        s.index++
      }

      // 下发尺寸与拷贝定位（先量后定位）
      const copies = hasCopies ? copyOffsets(count, s.dimension) : null
      s.items.forEach((raw, i) => {
        const item = raw as unknown as SwiperItemLike
        if (typeof item.setDimensions === 'function') {
          item.setDimensions(s.dimension, s.isVertical)
        }
        if (typeof item.setCopy === 'function') {
          if (i === 0 && copies) item.setCopy(copies.first)
          else if (i === count - 1 && copies) item.setCopy(copies.last)
          else item.setCopy(null)
        }
      })

      if (s.isSlide) {
        setTranslate(this, s.dimension * s.index)
      } else {
        // fade：initState 后 opacity(false)
        this.__fadeSettle(false)
      }

      this.setData({
        isInitial: true,
        indicatorCount: count,
        currentIndex: this.getIndex(),
      })
    },

    // ------------------------------------------------------------------
    // fade 模式
    // ------------------------------------------------------------------
    __fadeSettle(animate: boolean) {
      const s = state(this)
      const transition = animate ? 'opacity 500ms ease' : ''
      s.items.forEach((raw, i) => {
        const item = raw as unknown as SwiperItemLike
        if (typeof item.setFade === 'function') {
          item.setFade(i === s.toIndex ? 1 : 0, transition)
        }
      })
      if (animate) {
        if (s.fadeTimer != null) s.timers.clearTimeout(s.fadeTimer)
        s.fadeTimer = s.timers.setTimeout(() => {
          s.fadeTimer = null
          this.triggerEvent('afterChange', {fromIndex: s.fromIndex, toIndex: s.toIndex})
        }, 500)
      }
    },

    __fadeDrag(ratio: number) {
      const s = state(this)
      const from = s.index
      const to = fadeNeighbor(from, s.oItemCount, ratio)
      const fromItem = s.items[from] as unknown as SwiperItemLike | undefined
      const toItem = s.items[to] as unknown as SwiperItemLike | undefined
      if (!fromItem || !toItem) return
      if (typeof fromItem.setFade === 'function') fromItem.setFade(1 - Math.abs(ratio), '')
      if (typeof toItem.setFade === 'function') toItem.setFade(Math.abs(ratio), '')
    },

    // ------------------------------------------------------------------
    // 过渡（slide）
    // ------------------------------------------------------------------
    __doTransition(towards: 'prev' | 'next' | null, options?: {index: number}) {
      const s = state(this)
      if (s.oItemCount === 0) return
      if (!options && s.oItemCount < 2) return
      if (!towards && !options) return

      const oldIndex = s.index
      if (options && options.index !== undefined) {
        s.index = options.index
      } else if (towards) {
        s.index = nextIndex(s.index, s.rItemCount, towards, s.isSlide, this.data.isLoop)
      }

      if (this.data.isLoop && s.isSlide) {
        s.fromIndex = calcDisplayIndex(oldIndex, true, true, s.oItemCount)
        s.toIndex = calcDisplayIndex(s.index, true, true, s.oItemCount)
      } else {
        s.fromIndex = s.toIndex
        s.toIndex = s.index
      }
      this.triggerEvent('beforeChange', {fromIndex: s.fromIndex, toIndex: s.toIndex})

      if (!s.isSlide) {
        this.__fadeSettle(true)
        return
      }

      const target = s.dimension * s.index
      const wasFirst = s.index === 0 && this.data.isLoop
      const wasLast = s.index === s.rItemCount - 1 && this.data.isLoop
      // 指示器即时回收（对齐 Vue：index 在启动过渡时即调整）
      if (wasFirst) {
        s.index = s.lastIndex
      } else if (wasLast) {
        s.index = s.firstIndex
      }
      this.setData({currentIndex: this.getIndex()})

      s.timers.setTimeout(() => {
        s.anim?.stop()
        const from = s.offset
        s.anim = animateValue({
          from,
          to: target,
          duration: this.data.transitionDuration,
          onUpdate: (v) => setTranslate(this, v),
          onComplete: () => {
            // loop 首尾回收（瞬时跳变）
            if (wasLast) {
              setTranslate(this, s.firstIndex * s.dimension)
            } else if (wasFirst) {
              setTranslate(this, s.lastIndex * s.dimension)
            }
            this.triggerEvent('afterChange', {fromIndex: s.fromIndex, toIndex: s.toIndex})
          },
        })
      }, 10)
    },

    // ------------------------------------------------------------------
    // 手势
    // ------------------------------------------------------------------
    __consumePendingTransition() {
      const s = state(this)
      s.anim?.stop()
      s.anim = null
    },

    onDragStart(e: TouchEvent) {
      const s = state(this)
      if (s.oItemCount === 0 || s.dimension === 0) return
      const noDrag = s.oItemCount === 1 || !this.data.dragable
      if (noDrag) return
      this.__consumePendingTransition()
      this.stop()

      const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
      if (!touch) return
      s.dragging = true
      s.userScrolling = null
      s.dragState = {startTime: Date.now(), startLeft: touch.pageX, startTop: touch.pageY}
    },

    onDragMove(e: TouchEvent) {
      const s = state(this)
      if (!s.dragging) return
      const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
      if (!touch) return
      s.dragState.currentLeft = touch.pageX
      s.dragState.currentTop = touch.pageY

      const offsetLeft = touch.pageX - s.dragState.startLeft
      const offsetTop = touch.pageY - s.dragState.startTop
      if (s.userScrolling === null) {
        s.userScrolling = isPageScrolling(Math.abs(offsetLeft), Math.abs(offsetTop), s.isVertical, TOUCH_ANGLE)
      }
      if (s.userScrolling) return

      const dimension = s.dimension
      const clamped =
        s.isVertical
          ? Math.min(Math.max(-dimension + 1, offsetTop), dimension - 1)
          : Math.min(Math.max(-dimension + 1, offsetLeft), dimension - 1)

      if (s.isSlide) {
        // tx = dimension*index - delta ⇔ offset（滚动空间）= dimension*index - clamped
        setTranslate(this, dimension * s.index - clamped)
      } else {
        this.__fadeDrag(offsetLeft / dimension)
      }
    },

    onDragEnd(_e: TouchEvent) {
      const s = state(this)
      if (!s.dragging) return
      s.dragging = false
      if (s.userScrolling) {
        // 纵向页面滚动手势：动画回到当前页
        s.anim = animateValue({
          from: s.offset,
          to: s.dimension * s.index,
          duration: this.data.transitionDuration,
          onUpdate: (v) => setTranslate(this, v),
        })
        this.play(s.duration)
        s.userScrolling = null
        return
      }

      const dragDuration = Date.now() - s.dragState.startTime
      const offset =
        s.isVertical
          ? (s.dragState.currentTop ?? s.dragState.startTop) - s.dragState.startTop
          : (s.dragState.currentLeft ?? s.dragState.startLeft) - s.dragState.startLeft
      const tapped = s.dragState.currentLeft === undefined && s.dragState.currentTop === undefined
      if (dragDuration < PAGING_DURATION && tapped) {
        this.play(s.duration)
        return
      }

      const towards = pagingTowards(
        offset,
        s.dimension,
        dragDuration,
        s.index,
        s.rItemCount,
        this.data.isLoop,
      )
      this.__doTransition(towards)
      this.play(s.duration)
    },

    // ------------------------------------------------------------------
    // 自动播放
    // ------------------------------------------------------------------
    __startPlay() {
      const s = state(this)
      this.stop()
      if (s.duration > 0 && s.oItemCount > 1) {
        s.autoplayTimer = s.timers.setInterval(() => {
          if (!this.data.isLoop && s.index >= s.rItemCount - 1) {
            this.stop()
            return
          }
          if (!s.dragging) {
            this.next()
          }
        }, s.duration)
      }
    },

    // ------------------------------------------------------------------
    // 公开 API（Vue defineExpose 契约）
    // ------------------------------------------------------------------
    next() {
      this.__doTransition('next')
    },

    prev() {
      this.__doTransition('prev')
    },

    goto(displayIndex: number) {
      if (isNaN(displayIndex)) return
      const s = state(this)
      const real = calcRealIndex(Math.floor(displayIndex), this.data.isLoop, s.isSlide, s.oItemCount)
      const towards = real > s.index ? 'next' : 'prev'
      this.__doTransition(towards, {index: real})
      this.play(s.duration)
    },

    getIndex(): number {
      const s = state(this)
      return calcDisplayIndex(s.index, this.data.isLoop, s.isSlide, s.oItemCount)
    },

    play(d = 3000) {
      const s = state(this)
      this.stop()
      if (d < 500) return
      s.duration = d || this.data.autoplay
      this.__startPlay()
      s.isStoped = false
    },

    stop() {
      const s = state(this)
      if (s.autoplayTimer != null) {
        s.timers.clearInterval(s.autoplayTimer)
        s.autoplayTimer = null
      }
      s.isStoped = true
    },
  },
})

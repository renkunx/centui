<template>
  <div
    ref="root"
    class="cu-swiper"
    :class="{ 'cu-swiper-vertical': isVertical, 'cu-swiper-fade': !isSlide, disabled: !isInitial }"
    @mousedown="onDragStart"
    @mousemove="onDragMove"
    @mouseup="onDragEnd"
    @mouseleave="onDragEnd"
    @touchstart="onDragStart"
    @touchmove="onDragMove"
    @touchend="onDragEnd"
    @touchcancel="onDragEnd"
  >
    <div ref="swiperBox" class="cu-swiper-box">
      <div ref="swiper" class="cu-swiper-container">
        <!-- v2 契约：lastCopy 置于最前、firstCopy 追加最后（[c3, 1, 2, 3, c1]） -->
        <template v-if="loopCopies && $slots.default">
          <VNodeRenderer :vnode="lastCopyVnode" v-if="lastCopyVnode" />
        </template>
        <slot></slot>
        <template v-if="loopCopies && $slots.default">
          <VNodeRenderer :vnode="firstCopyVnode" v-if="firstCopyVnode" />
        </template>
      </div>
    </div>
    <div class="cu-swiper-indicators" :class="{ disabled: !hasDots }" v-if="oItemCount > 1 && hasDots">
      <div
        v-for="index in oItemCount"
        :key="index"
        class="cu-swiper-indicator"
        :class="{ 'cu-swiper-indicator-active': index - 1 === realIndex }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  cloneVNode,
  computed,
  
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  provide,
  ref,
  useSlots,
  watch,
  type VNode,
} from 'vue'
import { debounce, warn } from '@centui/core'
import { render as renderTransform, Scroller, type Scroller as ScrollerType } from '@centui/core/web'

const isTestEnv = typeof process !== 'undefined' && process.env.MAND_ENV === 'test'

defineOptions({ name: 'cu-swiper' })

// scale of sliding distance & touch duration that triggers page turning
const PAGING_SCALE = 0.5
const PAGING_DURATION = 300

const props = withDefaults(
  defineProps<{
    autoplay?: number
    /** slide | slideY | fade */
    transition?: string
    transitionDuration?: number
    defaultIndex?: number
    hasDots?: boolean
    isPrevent?: boolean
    isLoop?: boolean
    dragable?: boolean
    useNativeDriver?: boolean
  }>(),
  {
    autoplay: 3000,
    transition: 'slide',
    transitionDuration: 250,
    defaultIndex: 0,
    hasDots: true,
    isPrevent: true,
    isLoop: true,
    dragable: true,
    useNativeDriver: true,
  },
)

const emit = defineEmits<{
  (e: 'beforeChange', fromIndex: number, toIndex: number): void
  (e: 'after-change', fromIndex: number, toIndex: number): void
}>()

const slots = useSlots()
const root = ref<HTMLElement>()
const swiperBox = ref<HTMLElement>()
const swiper = ref<HTMLElement>()

const ready = ref(false)
const dragging = ref(false)
const isInitial = ref(false)
const duration = ref(0)
const index = ref(0) // real index (swiper perspective)
const fromIndex = ref(0) // display index
const toIndex = ref(0) // display index
const firstIndex = ref(0) // display index
const lastIndex = ref(0) // display index
const oItemCount = ref(0) // original item count
const rItemCount = ref(0) // real item count
const dimension = ref(0)
const noDrag = ref(false)
const isStoped = ref(true)

const scrollerRef = ref<ScrollerType | null>(null)
const backedUp = ref(false)
let dragState: Record<string, unknown> = {}
let userScrolling: boolean | null = null
let timer: ReturnType<typeof setInterval> | null = null
let transitionEndHandler: (() => void) | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
let touchAngle = 45

// Vue3 适配：$children → 注册制（opacity 模式需要取到子组件实例）
const itemInstances: ComponentPublicInstanceLike[] = []

interface ComponentPublicInstanceLike {
  $el: HTMLElement
}

// 子项注册（由 CuSwiperItem 调用）
function registerItem(item: ComponentPublicInstanceLike) {
  itemInstances.push(item)
  if (ready.value) {
    debouncedReInit()
  }
}

function unregisterItem(item: ComponentPublicInstanceLike) {
  const idx = itemInstances.indexOf(item)
  if (idx >= 0) {
    itemInstances.splice(idx, 1)
  }
  if (ready.value) {
    debouncedReInit()
  }
}

const debouncedReInit = debounce(() => {
  nextTick(() => {
    clearTimer()
    reInitItems()
    if (!isStoped.value) {
      play(duration.value)
    }
  })
}, 50)

provide('mdSwiper', {
  dimension: () => dimension.value,
  isVertical: () => isVertical.value,
  register: registerItem,
  unregister: unregisterItem,
})

watch(
  () => props.autoplay,
  val => {
    duration.value = val
  },
  { immediate: true },
)

const isLastItem = computed(() => index.value === rItemCount.value - 1)
const isFirstItem = computed(() => index.value === 0)
const realIndex = computed(() => getIndex())
const isSlide = computed(() => props.transition.toLowerCase().includes('slide'))
const isVertical = computed(() => props.transition === 'slideY')

// loop 拷贝 vnode：克隆首/尾插槽子项，附加拷贝类与尺寸样式
const firstCopyVnode = computed<VNode | null>(() => {
  const children = slots.default?.() ?? []
  const elementChildren = children.filter(n => (n as VNode).type !== Symbol.for('v-cmt'))
  if (!loopCopies.value || elementChildren.length < 2) {
    return null
  }
  return cloneVNode(elementChildren[0], {
    class: 'cu-swiper-item-first-copy',
    style: copyStyle.value,
    isCopy: true,
  })
})
const lastCopyVnode = computed<VNode | null>(() => {
  const children = slots.default?.() ?? []
  const elementChildren = children.filter(n => (n as VNode).type !== Symbol.for('v-cmt'))
  if (!loopCopies.value || elementChildren.length < 2) {
    return null
  }
  return cloneVNode(elementChildren[elementChildren.length - 1], {
    class: 'cu-swiper-item-last-copy',
    style: copyStyle.value,
    isCopy: true,
  })
})
const loopCopies = computed(() => isSlide.value && isInitial.value)

/** 函数式渲染器：直接输出传入的 vnode */
const VNodeRenderer = (props: { vnode: VNode }) => props.vnode
VNodeRenderer.props = ['vnode']
const copyStyle = computed(() =>
  isVertical.value ? { height: `${dimension.value}px` } : { width: `${dimension.value}px` },
)

onMounted(() => {
  resizeEnterBehavior()
})

onActivated(() => {
  resizeEnterBehavior()
})

onDeactivated(() => {
  resizeLeaveBehavior()
})

onBeforeUnmount(() => {
  resizeLeaveBehavior()
})

function resizeBehavior() {
  // 防止屏幕翻转时，容器的尺寸更改不及时导致异常
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  const startIndex = index.value
  resizeTimeout = setTimeout(() => {
    reInitItems(startIndex)
  }, 300)
}

function resizeEnterBehavior() {
  ready.value = true
  nextTick(() => {
    reInitItems()
    play(duration.value)
    window.addEventListener('resize', resizeBehavior)
  })
}

function resizeLeaveBehavior() {
  ready.value = false
  clearTimer()
  window.removeEventListener('resize', resizeBehavior)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
}

function getDimension() {
  dimension.value = isVertical.value ? root.value?.clientHeight ?? 0 : root.value?.clientWidth ?? 0
}

function initScroller() {
  const scroller = new Scroller(
    (left, top) => {
      renderTransform(swiper.value as HTMLElement, left, top, 1, props.useNativeDriver)
    },
    {
      scrollingY: isVertical.value,
      scrollingX: !isVertical.value,
      snapping: false,
      bouncing: false,
      animationDuration: props.transitionDuration,
      scrollingComplete: () => {
        transitionEndHandler && transitionEndHandler()
      },
    },
  )

  const container = swiperBox.value
  if (!container) {
    return
  }
  const contentWidth = isVertical.value ? container.clientWidth : container.clientWidth * rItemCount.value
  const contentHeight = isVertical.value
    ? container.clientHeight * rItemCount.value
    : container.clientHeight
  scroller.setPosition(container.clientLeft, container.clientTop)
  scroller.setDimensions(container.clientWidth, container.clientHeight, contentWidth, contentHeight)

  scrollerRef.value = scroller
}

function backupItem() {
  // v2 通过 DOM clone；Vue3 由模板渲染 loop 拷贝（见 loopCopies/firstCopyVnode）
  if (itemInstances.length > 1 && props.isLoop) {
    firstIndex.value++
    lastIndex.value++
    index.value++
    backedUp.value = true
  }
}

function translate(element: HTMLElement | undefined, offset: number, animate = true) {
  if (!element) {
    warn('[cu-swiper] no element for translate')
    return
  }
  const x = isVertical.value ? 0 : -offset
  const y = isVertical.value ? -offset : 0
  scrollerRef.value?.scrollTo(x, y, animate)
}

function opacity(animate = true, opacityVal?: number) {
  const children = itemInstances
  if (!children || !children.length) {
    return
  }
  if (typeof opacityVal !== 'undefined') {
    let toIndexLocal = 0
    const from = toIndex.value
    const itemCount = rItemCount.value

    if (opacityVal > 0) {
      if (from > 0) {
        toIndexLocal = from - 1
      } else if (from === 0) {
        toIndexLocal = itemCount - 1
      }
    } else {
      if (from < itemCount - 1) {
        toIndexLocal = from + 1
      } else if (from === itemCount - 1) {
        toIndexLocal = 0
      }
    }
    const fromEl = children[from]?.$el
    const toEl = children[toIndexLocal]?.$el
    if (!fromEl || !toEl) {
      return
    }
    fromEl.style.opacity = String(1 - Math.abs(opacityVal))
    fromEl.style.transition = animate ? 'opacity 300ms ease' : ''
    toEl.style.opacity = String(Math.abs(opacityVal))
    return
  }

  const fromEl = children[fromIndex.value]?.$el
  const toEl = children[toIndex.value]?.$el
  if (!fromEl || !toEl) {
    return
  }
  fromEl.style.opacity = '0'
  fromEl.style.transition = animate ? 'opacity 500ms ease' : ''
  toEl.style.opacity = '1'
  if (animate) {
    setTimeout(() => {
      emit('after-change', fromIndex.value, toIndex.value)
    }, 500)
  }
}

function initState(itemCount: number, startIndex?: number) {
  oItemCount.value = itemCount
  // loop 模式首尾各补一位：+2（与 backupItem 的模板拷贝数量一致）
  rItemCount.value = itemCount + (props.isLoop && isSlide.value && itemCount > 1 ? 2 : 0)
  backedUp.value = false
  noDrag.value = itemCount === 1 || !props.dragable

  index.value =
    startIndex !== undefined
      ? calcDisplayIndex(startIndex)
      : props.defaultIndex >= 0 && props.defaultIndex < itemCount
        ? parseInt(String(props.defaultIndex))
        : 0

  firstIndex.value = 0
  lastIndex.value = itemCount - 1
  fromIndex.value =
    index.value === firstIndex.value
      ? lastIndex.value
      : index.value === lastIndex.value
        ? firstIndex.value
        : index.value + 1
  toIndex.value = index.value
}

function reInitItems(startIndex?: number) {
  const itemCount = itemInstances.length

  if (!itemCount) {
    return
  }

  getDimension()
  initState(itemCount, startIndex)

  if (isSlide.value) {
    backupItem()
    initScroller()
    translate(swiper.value, -dimension.value * index.value, false)
  } else {
    opacity(false)
  }
  isInitial.value = true
}

function startPlay() {
  if (duration.value > 0 && oItemCount.value > 1) {
    clearTimer()
    timer = setInterval(() => {
      if (!props.isLoop && index.value >= rItemCount.value - 1) {
        return clearTimer()
      }
      if (!dragging.value) {
        next()
      }
    }, duration.value)
  }
}

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function isScroll(diffX: number, diffY: number): boolean {
  const vertical = isVertical.value
  const { currentLeft, currentTop, startLeft, startTop } = dragState as Record<string, number>

  if (userScrolling === null) {
    if ((!vertical && currentTop === startTop) || (vertical && currentLeft === startLeft)) {
      return false
    } else {
      if (diffX * diffX + diffY * diffY >= 25) {
        const touchAngleDeg = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI
        return !vertical ? touchAngleDeg > touchAngle : 90 - touchAngleDeg > touchAngle
      } else {
        return false
      }
    }
  }

  return userScrolling
}

// real index => display index
function calcDisplayIndex(idx: number) {
  if (props.isLoop && isSlide.value && oItemCount.value > 0) {
    return idx - 1 < 0 ? oItemCount.value - 1 : idx - 1 > oItemCount.value - 1 ? 0 : idx - 1
  }
  return idx
}
// display index => real index
function calcuRealIndex(idx: number) {
  if (idx < 0) {
    idx = 0
  } else if (oItemCount.value > 0 && idx > oItemCount.value - 1) {
    idx = oItemCount.value - 1
  }

  if (props.isLoop && isSlide.value) {
    return idx + 1
  }
  return idx
}

function doTransition(towards: 'prev' | 'next' | null, options?: { index: number }) {
  if (oItemCount.value === 0) {
    return
  }
  if (!options && oItemCount.value < 2) {
    return
  }

  const currentIndex = index.value
  const itemCount = rItemCount.value
  const oldIndex = index.value

  if (!towards) {
    return
  }
  if (options && options.index !== undefined) {
    index.value = options.index
  } else if (towards === 'prev') {
    if (currentIndex > 0) {
      index.value = currentIndex - 1
    } else if (!isSlide.value && currentIndex === 0) {
      index.value = itemCount - 1
    } else if (props.isLoop && currentIndex === 0) {
      index.value = itemCount - 1
    }
  } else if (towards === 'next') {
    if (currentIndex < itemCount - 1) {
      index.value = currentIndex + 1
    } else if (!isSlide.value && currentIndex === itemCount - 1) {
      index.value = 0
    } else if (props.isLoop && currentIndex === itemCount - 1) {
      index.value = 1
    }
  }

  if (props.isLoop && isSlide.value) {
    fromIndex.value = calcDisplayIndex(oldIndex)
    toIndex.value = calcDisplayIndex(index.value)
  } else {
    fromIndex.value = toIndex.value
    toIndex.value = index.value
  }
  emit('beforeChange', fromIndex.value, toIndex.value)
  if (!isSlide.value) {
    opacity()
    return
  }

  setTimeout(() => {
    const isFirst = isFirstItem.value && props.isLoop
    const isLast = isLastItem.value && props.isLoop
    transitionEndHandler = () => {
      // Recover first and last page
      if (isLast) {
        const x = isVertical.value ? 0 : firstIndex.value * dimension.value
        const y = isVertical.value ? firstIndex.value * dimension.value : 0
        scrollerRef.value?.scrollTo(x, y, false)
      }
      if (isFirst) {
        const x = isVertical.value ? 0 : lastIndex.value * dimension.value
        const y = isVertical.value ? lastIndex.value * dimension.value : 0
        scrollerRef.value?.scrollTo(x, y, false)
      }
      emit('after-change', fromIndex.value, toIndex.value)
      transitionEndHandler = null
    }
    translate(swiper.value, -dimension.value * index.value)

    // Recover first and last indicator
    if (isFirst) {
      index.value = lastIndex.value
    } else if (isLast) {
      index.value = firstIndex.value
    }
  }, 10)
}

function doOnTouchStart(event: MouseEvent | TouchEvent) {
  if (noDrag.value) {
    return
  }
  stop()

  // jsdom 的 TouchEvent.changedTouches 是空 TouchList（truthy），需取 [0] 判空回退
  const e = event as TouchEvent & { changedTouches?: TouchList; touches?: TouchList; targetTouches?: TouchList }
  const point = e.changedTouches?.[0] ?? e.touches?.[0] ?? e.targetTouches?.[0] ?? (e as unknown as MouseEvent)

  dragState = {}
  dragState.startTime = new Date()
  dragState.startLeft = point.pageX
  dragState.startTop = point.pageY
  dragState.itemWidth = isTestEnv ? 100 : root.value?.offsetWidth ?? 0
  dragState.itemHeight = isTestEnv ? 100 : root.value?.offsetHeight ?? 0
}

function doOnTouchMove(event: MouseEvent | TouchEvent) {
  if (noDrag.value) {
    return
  }

  const e2 = event as TouchEvent & { changedTouches?: TouchList; touches?: TouchList; targetTouches?: TouchList }
  const point = e2.changedTouches?.[0] ?? e2.touches?.[0] ?? e2.targetTouches?.[0] ?? (e2 as unknown as MouseEvent)

  dragState.currentLeft = point.pageX
  dragState.currentTop = point.pageY

  const offsetLeft = Number(dragState.currentLeft) - Number(dragState.startLeft)
  const offsetTop = Number(dragState.currentTop) - Number(dragState.startTop)
  userScrolling = isScroll(Math.abs(offsetLeft), Math.abs(offsetTop))
  if (userScrolling) {
    return
  }

  event.preventDefault()

  const itemWidth = Number(dragState.itemWidth)
  const itemHeight = Number(dragState.itemHeight)
  const offsetLeftClamped = Math.min(Math.max(-itemWidth + 1, offsetLeft), itemWidth - 1)
  const offsetTopClamped = Math.min(Math.max(-itemHeight + 1, offsetTop), itemHeight - 1)

  const offset = isVertical.value
    ? offsetTopClamped - itemHeight * index.value
    : offsetLeftClamped - itemWidth * index.value

  if (isSlide.value) {
    translate(swiper.value, offset, false)
  } else {
    opacity(false, offsetLeft / itemWidth)
  }
}

function doOnTouchEnd() {
  if (noDrag.value) {
    return
  }
  const dragDuration = Number(new Date()) - Number(dragState.startTime)
  const offsetLeft = Number(dragState.currentLeft) - Number(dragState.startLeft)
  const offsetTop = Number(dragState.currentTop) - Number(dragState.startTop)
  const itemWidth = Number(dragState.itemWidth)
  const itemHeight = Number(dragState.itemHeight)
  const currentIndex = index.value
  const itemCount = rItemCount.value
  const isFastDrag = dragDuration < PAGING_DURATION

  let towards: 'prev' | 'next' | null = null

  if (isFastDrag && dragState.currentLeft === undefined) {
    play(duration.value)
    return
  }

  if (isVertical.value) {
    if (Math.abs(offsetTop) > itemHeight * PAGING_SCALE || isFastDrag) {
      towards = offsetTop < 0 ? 'next' : 'prev'
    } else {
      translate(swiper.value, -dimension.value * currentIndex, true)
    }
  } else {
    if (Math.abs(offsetLeft) > itemWidth * PAGING_SCALE || isFastDrag) {
      towards = offsetLeft < 0 ? 'next' : 'prev'
    } else {
      if (isSlide.value) {
        translate(swiper.value, -dimension.value * currentIndex, true)
      } else {
        opacity(true, 0)
      }
    }
  }

  if (!props.isLoop) {
    if ((currentIndex === 0 && towards === 'prev') || (currentIndex === itemCount - 1 && towards === 'next')) {
      towards = null
    }
  }

  doTransition(towards)

  dragState = {}

  play(duration.value)
}

function onDragStart(e: MouseEvent | TouchEvent) {
  // Consume unfinished transition handler first
  transitionEndHandler && transitionEndHandler()

  if (props.isPrevent) {
    e.preventDefault()
  }
  dragging.value = true
  userScrolling = null
  doOnTouchStart(e)
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (props.isPrevent) {
    e.preventDefault()
  }
  if (!dragging.value) {
    return
  }
  doOnTouchMove(e)
}

function onDragEnd(e: MouseEvent | TouchEvent) {
  if (props.isPrevent) {
    e.preventDefault()
  }
  if (userScrolling) {
    play(duration.value)
    dragging.value = false
    dragState = {}
    return
  }
  if (!dragging.value) {
    return
  }
  doOnTouchEnd()
  dragging.value = false
}

// MARK: public methods
function next() {
  doTransition('next')
}

function prev() {
  doTransition('prev')
}

function goto(displayIndex: number) {
  if (isNaN(displayIndex)) {
    return
  }
  displayIndex = parseInt(String(displayIndex))

  const realIndexLocal = calcuRealIndex(displayIndex)
  const towards = realIndexLocal > index.value ? 'next' : 'prev'

  doTransition(towards as 'next' | 'prev', {
    index: realIndexLocal,
  })

  // restart timer
  play(duration.value)
}

function getIndex() {
  return calcDisplayIndex(index.value)
}

function play(d = 3000) {
  clearTimer()
  if (d < 500) {
    return
  }

  duration.value = d || props.autoplay
  startPlay()
  isStoped.value = false
}

function stop() {
  clearTimer()
  isStoped.value = true
}

defineExpose({ next, prev, goto, getIndex, play, stop, index, rItemCount, oItemCount })
</script>

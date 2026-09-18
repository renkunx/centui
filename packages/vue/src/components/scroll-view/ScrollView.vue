<template>
  <div
    ref="root"
    class="md-scroll-view"
    @touchstart="onScrollerTouchStart"
    @touchmove="onScrollerTouchMove"
    @touchend="onScrollerTouchEnd"
    @touchcancel="onScrollerTouchEnd"
    @mousedown="onScrollerMouseDown"
    @mousemove="onScrollerMouseMove"
    @mouseup="onScrollerMouseUp"
    @mouseleave="onScrollerMouseUp"
  >
    <div v-if="$slots.header" class="scroll-view-header">
      <slot name="header"></slot>
    </div>
    <div
      class="scroll-view-container"
      :class="{
        horizon: scrollingX && !scrollingY,
      }"
      scroll-wrapper
    >
      <div
        v-if="hasRefresher"
        class="scroll-view-refresh"
        :class="{
          refreshing: isRefreshing,
          'refresh-active': isRefreshActive,
        }"
      >
        <!-- v2 契约：作用域插槽键为 camelCase（scrollTop/isRefreshing/isRefreshActive） -->
        <slot name="refresh" :scrollTop="scrollYRef ?? 0" :isRefreshing="isRefreshing" :isRefreshActive="isRefreshActive"></slot>
      </div>
      <slot></slot>
      <div v-if="hasMore" class="scroll-view-more" :class="{ active: isEndReachingStart || isEndReaching }">
        <slot name="more" :isEndReaching="isEndReachingStart || isEndReaching"></slot>
      </div>
    </div>
    <div v-if="$slots.footer" class="scroll-view-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { debounce } from '@mand-mobile/core'
import { render, Scroller, type Scroller as ScrollerType } from '@mand-mobile/core/web'

defineOptions({ name: 'md-scroll-view' })

const props = withDefaults(
  defineProps<{
    scrollingX?: boolean
    scrollingY?: boolean
    bouncing?: boolean
    autoReflow?: boolean
    manualInit?: boolean
    endReachedThreshold?: number
    immediateCheckEndReaching?: boolean
    touchAngle?: number
    isPrevent?: boolean
  }>(),
  {
    scrollingX: true,
    scrollingY: true,
    bouncing: true,
    autoReflow: false,
    manualInit: false,
    endReachedThreshold: 0,
    immediateCheckEndReaching: false,
    touchAngle: 45,
    isPrevent: true,
  },
)

const emit = defineEmits<{
  (e: 'refreshActive'): void
  (e: 'refreshing'): void
  (e: 'endReached'): void
  (e: 'end-reached'): void
  (e: 'scroll', offsets: { scrollLeft: number; scrollTop: number }): void
}>()

const slots = useSlots()
const root = ref<HTMLElement>()
const scrollerRef = ref<ScrollerType | null>(null)

const isInitialed = ref(false)
const isMouseDown = ref(false)
const isRefreshing = ref(false)
const isRefreshActive = ref(false)
const isEndReachingStart = ref(false)
const isEndReaching = ref(false)
const scrollXRef = ref<number | null>(null)
const scrollYRef = ref<number | null>(null)

let container: HTMLElement | null = null
let content: HTMLElement | null = null
let moreOffsetY = 0
let startX = 0
let startY = 0
let currentX = 0
let currentY = 0
let containerW = 0
let containerH = 0
let contentW = 0
let contentH = 0
let reflowTimer: ReturnType<typeof setInterval> | null = null
let endReachedHandler: (() => void) | null = null

const hasRefresher = computed(() => !!slots.refresh)
const hasMore = computed(() => !!slots.more)

watch(
  () => props.autoReflow,
  val => {
    if (val) {
      initAutoReflow()
    } else {
      destroyAutoReflow()
    }
  },
)

onMounted(() => {
  if (!props.manualInit) {
    initScroller()
  }
})

onBeforeUnmount(() => {
  destroyAutoReflow()
})

function initScroller() {
  if (isInitialed.value) {
    return
  }
  container = root.value ?? null
  const refreshEl = container?.querySelector<HTMLElement>('.scroll-view-refresh') ?? null
  const moreEl = container?.querySelector<HTMLElement>('.scroll-view-more') ?? null
  content = container?.querySelector<HTMLElement>('.scroll-view-container') ?? null
  const refreshOffsetY = refreshEl ? refreshEl.clientHeight : 0
  moreOffsetY = moreEl ? moreEl.clientHeight : 0

  if (!container || !content) {
    return
  }
  const rect = container.getBoundingClientRect()
  const scroller = new Scroller(
    (left, top) => {
      render(content as HTMLElement, left, top)
      if (isInitialed.value) {
        onScroll(left, top)
      }
    },
    {
      scrollingX: props.scrollingX,
      scrollingY: props.scrollingY,
      bouncing: props.bouncing,
      zooming: false,
      animationDuration: 200,
      speedMultiplier: 1.2,
      inRequestAnimationFrame: true,
    },
  )
  scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop)
  if (hasRefresher.value) {
    scroller.activatePullToRefresh(
      refreshOffsetY,
      () => {
        isRefreshActive.value = true
        isRefreshing.value = false
        emit('refreshActive')
      },
      () => {
        isRefreshActive.value = false
        isRefreshing.value = false
      },
      () => {
        isRefreshActive.value = false
        isRefreshing.value = true
        emit('refreshing')
      },
    )
  }
  scrollerRef.value = scroller
  reflowScroller(true)
  if (props.autoReflow) {
    initAutoReflow()
  }
  endReachedHandler = debounce(() => {
    isEndReaching.value = true
    emit('endReached')
    emit('end-reached')
  }, 50)

  setTimeout(() => {
    isInitialed.value = true
  }, 50)

  if (props.immediateCheckEndReaching) {
    checkScrollerEnd()
  }
}

function initAutoReflow() {
  destroyAutoReflow()
  reflowTimer = setInterval(() => {
    reflowScroller()
  }, 100)
}

function destroyAutoReflow() {
  if (reflowTimer) {
    clearInterval(reflowTimer)
    reflowTimer = null
  }
}

function checkScrollerEnd() {
  const scroller = scrollerRef.value as unknown as
    | { _clientHeight: number; _contentHeight: number; _scrollTop: number }
    | null
  if (!scroller) {
    return
  }
  const containerHeight = scroller._clientHeight
  const contentHeight = scroller._contentHeight
  const top = scroller._scrollTop
  const moreThreshold = props.endReachedThreshold
  const endOffset = contentHeight - containerHeight - (top + moreOffsetY + moreThreshold)
  if (top >= 0 && !isEndReaching.value && endOffset <= 0 && endReachedHandler) {
    // First prepare for "load more" state
    isEndReachingStart.value = true
    // Second enter "load more" state & trigger endReached once after rebound
    endReachedHandler()
  }
}

function getScrollerAngle() {
  const diffX = currentX - startX
  const diffY = currentY - startY
  const angle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI
  return props.scrollingX ? 90 - angle : angle
}

function onScrollerTouchStart(event: TouchEvent) {
  const scroller = scrollerRef.value
  if (!scroller) {
    return
  }
  startX = event.targetTouches[0].pageX
  startY = event.targetTouches[0].pageY
  scroller.doTouchStart(Array.from(event.touches), event.timeStamp)
}

function onScrollerTouchMove(event: TouchEvent) {
  const scroller = scrollerRef.value
  if (!scroller) {
    return
  }
  let hadPrevent = false

  if (props.isPrevent) {
    event.preventDefault()
    hadPrevent = true
  }

  currentX = event.targetTouches[0].pageX
  currentY = event.targetTouches[0].pageY

  if (!props.scrollingX || !props.scrollingY) {
    const currentTouchAngle = getScrollerAngle()
    if (currentTouchAngle < props.touchAngle) {
      return
    }
  }

  if (!hadPrevent && event.cancelable) {
    event.preventDefault()
  }

  scroller.doTouchMove(
    Array.from(event.touches),
    event.timeStamp,
    (event as TouchEvent & { scale?: number }).scale,
  )

  const boundaryDistance = 15
  const scrollLeft = document.documentElement.scrollLeft || window.pageXOffset || document.body.scrollLeft
  const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop

  const pX = currentX - scrollLeft
  const pY = currentY - scrollTop
  if (
    pX > document.documentElement.clientWidth - boundaryDistance ||
    pY > document.documentElement.clientHeight - boundaryDistance ||
    pX < boundaryDistance ||
    pY < boundaryDistance
  ) {
    scroller.doTouchEnd(event.timeStamp)
  }
}

function onScrollerTouchEnd(event: TouchEvent) {
  const scroller = scrollerRef.value
  if (!scroller) {
    return
  }
  scroller.doTouchEnd(event.timeStamp)
}

function onScrollerMouseDown(event: MouseEvent) {
  const scroller = scrollerRef.value
  if (!scroller) {
    return
  }
  startX = event.pageX
  startY = event.pageY
  scroller.doTouchStart([{ pageX: event.pageX, pageY: event.pageY }], event.timeStamp)
  isMouseDown.value = true
}

function onScrollerMouseMove(event: MouseEvent) {
  const scroller = scrollerRef.value
  if (!scroller || !isMouseDown.value) {
    return
  }

  currentX = event.pageX
  currentY = event.pageY
  if (!props.scrollingX || !props.scrollingY) {
    const currentTouchAngle = getScrollerAngle()
    if (currentTouchAngle < props.touchAngle) {
      return
    }
  }
  scroller.doTouchMove([{ pageX: event.pageX, pageY: event.pageY }], event.timeStamp)
  isMouseDown.value = true
}

function onScrollerMouseUp(event: MouseEvent) {
  const scroller = scrollerRef.value
  if (!scroller || !isMouseDown.value) {
    return
  }
  scroller.doTouchEnd(event.timeStamp)
  isMouseDown.value = false
}

function onScroll(left: number, top: number) {
  left = +left.toFixed(2)
  top = +top.toFixed(2)
  if (scrollXRef.value === left && scrollYRef.value === top) {
    return
  }
  scrollXRef.value = left
  scrollYRef.value = top
  checkScrollerEnd()
  emit('scroll', { scrollLeft: left, scrollTop: top })
}

function init() {
  setTimeout(() => {
    initScroller()
  }, 0)
}

function scrollTo(left: number, top: number, animate = false) {
  scrollerRef.value?.scrollTo(left, top, animate)
}

function getOffsets(): { left: number; top: number } {
  return scrollerRef.value?.getValues() ?? { left: 0, top: 0 }
}

function reflowScroller(force = false) {
  const scroller = scrollerRef.value
  if (!scroller || !container || !content) {
    return
  }
  setTimeout(() => {
    const nextContainerW = container!.clientWidth
    const nextContainerH = container!.clientHeight
    const nextContentW = content!.offsetWidth
    const nextContentH = content!.offsetHeight

    if (
      force ||
      containerW !== nextContainerW ||
      containerH !== nextContainerH ||
      contentW !== nextContentW ||
      contentH !== nextContentH
    ) {
      scroller.setDimensions(
        container!.clientWidth,
        container!.clientHeight,
        content!.offsetWidth,
        content!.offsetHeight,
      )
      containerW = nextContainerW
      containerH = nextContainerH
      contentW = nextContentW
      contentH = nextContentH
    }
  }, 0)
}

function triggerRefresh() {
  scrollerRef.value?.triggerPullToRefresh()
}

function finishRefresh() {
  scrollerRef.value?.finishPullToRefresh()
  reflowScroller()
}

function finishLoadMore() {
  isEndReachingStart.value = false
  isEndReaching.value = false
  reflowScroller()
}

defineExpose({ init, scrollTo, getOffsets, reflowScroller, triggerRefresh, finishRefresh, finishLoadMore })
</script>

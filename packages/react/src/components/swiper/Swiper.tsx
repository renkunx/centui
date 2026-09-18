import {
  cloneElement,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,

} from 'react'
import { warn } from '@mand-mobile/core'
import { render, Scroller } from '@mand-mobile/core/web'

// scale of sliding distance & touch duration that triggers page turning
const PAGING_SCALE = 0.5
const PAGING_DURATION = 300

const isTestEnv =
  typeof process !== 'undefined' && (process.env as { MAND_ENV?: string }).MAND_ENV === 'test'

export interface SwiperProps {
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
  children?: ReactNode
  onBeforeChange?: (from: number, to: number) => void
  onAfterChange?: (from: number, to: number) => void
}

export interface SwiperExposed {
  next: () => void
  prev: () => void
  goto: (index: number) => void
  getIndex: () => number
  play: (duration?: number) => void
  stop: () => void
}

interface SwiperCtx {
  dimension: () => number
  isVertical: () => boolean
}

const SwiperDimensionContext = createContext<SwiperCtx>({
  dimension: () => 0,
  isVertical: () => false,
})

export function MdSwiperItem({ children }: { children?: ReactNode }) {
  const ctx = useContext(SwiperDimensionContext) as {
    dimension: (i?: number) => number
    isVertical: () => boolean
  }
  const dimension = ctx.dimension()
  const vertical = ctx.isVertical()

  return (
    <div
      className="md-swiper-item"
      style={{ width: vertical ? 'auto' : `${dimension}px`, height: vertical ? `${dimension}px` : 'auto' }}
    >
      {children}
    </div>
  )
}

export const MdSwiper = forwardRef<SwiperExposed, SwiperProps>(function MdSwiper(
  {
    autoplay = 3000,
    transition = 'slide',
    transitionDuration = 250,
    defaultIndex = 0,
    hasDots = true,
    isPrevent = true,
    isLoop = true,
    dragable = true,
    useNativeDriver = true,
    children,
    onBeforeChange,
    onAfterChange,
  }: SwiperProps,
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const swiperBoxRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<Scroller | null>(null)

  const [isInitial, setIsInitial] = useState(false)
  const [index, setIndex] = useState(0) // real index
  const [dimension, setDimension] = useState(0)
  const [oItemCount, setOItemCount] = useState(0)
  const [rItemCount, setRItemCount] = useState(0)
  // loop 首尾渲染拷贝（v2 backupItem 的声明式等价）
  const [copies, setCopies] = useState<{ head: ReactNode; tail: ReactNode } | null>(null)
  const draggingRef = useRef(false)
  const userScrollingRef = useRef<boolean | null>(null)
  const durationRef = useRef(autoplay)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transitionEndHandlerRef = useRef<(() => void) | null>(null)
  const fromIndexRef = useRef(0)
  const toIndexRef = useRef(0)
  const firstIndexRef = useRef(0)
  const lastIndexRef = useRef(0)
  const noDragRef = useRef(false)
  const isStopedRef = useRef(true)
  const touchAngle = 45
  const dragStateRef = useRef<Record<string, number | string | Date | undefined>>({})
  const indexRef = useRef(0)
  indexRef.current = index
  const rItemCountRef = useRef(0)
  rItemCountRef.current = rItemCount
  // interval/setTimeout 闭包可能停留在首帧，读取需走 ref（对齐 v2 响应式语义）
  const dimensionRef = useRef(0)
  dimensionRef.current = dimension

  const isSlide = transition.toLowerCase().includes('slide')
  const isVertical = transition === 'slideY'

  const itemArray = Array.isArray(children) ? children : children ? [children] : []
  const itemNodes = itemArray.filter(Boolean) as ReactNode[]
  const oCount = itemNodes.length

  const realIndex = calcDisplayIndex(index)

  function calcDisplayIndex(idx: number) {
    if (isLoop && isSlide && oCount > 0) {
      return idx - 1 < 0 ? oCount - 1 : idx - 1 > oCount - 1 ? 0 : idx - 1
    }
    return idx
  }

  function calcuRealIndex(idx: number) {
    if (idx < 0) {
      idx = 0
    } else if (oCount > 0 && idx > oCount - 1) {
      idx = oCount - 1
    }
    if (isLoop && isSlide) {
      return idx + 1
    }
    return idx
  }

  function getDimension() {
    setDimension(isVertical ? rootRef.current?.clientHeight ?? 0 : rootRef.current?.clientWidth ?? 0)
  }

  function initScroller() {
    const container = swiperBoxRef.current
    const content = swiperRef.current
    if (!container || !content) {
      return
    }
    const scroller = new Scroller(
      (left, top) => {
        render(content, left, top, 1, useNativeDriver)
      },
      {
        scrollingY: isVertical,
        scrollingX: !isVertical,
        snapping: false,
        bouncing: false,
        animationDuration: transitionDuration,
        scrollingComplete: () => {
          if (transitionEndHandlerRef.current) {
            transitionEndHandlerRef.current()
          }
        },
      },
    )
    const contentWidth = isVertical ? container.clientWidth : container.clientWidth * rItemCount
    const contentHeight = isVertical
      ? container.clientHeight * rItemCount
      : container.clientHeight
    scroller.setPosition(container.clientLeft, container.clientTop)
    scroller.setDimensions(container.clientWidth, container.clientHeight, contentWidth, contentHeight)
    scrollerRef.current = scroller
  }

  function translate(offset: number, animate = true) {
    const el = swiperRef.current
    if (!el) {
      warn('[md-swiper] no element for translate')
      return
    }
    const x = isVertical ? 0 : -offset
    const y = isVertical ? -offset : 0
    scrollerRef.current?.scrollTo(x, y, animate)
  }

  function opacity(animate = true, opacityVal?: number) {
    const els = swiperRef.current?.children
    if (!els || !els.length) {
      return
    }
    if (typeof opacityVal !== 'undefined') {
      const from = toIndexRef.current
      const itemCount = rItemCount
      const toIdx = opacityVal > 0
        ? (from > 0 ? from - 1 : itemCount - 1)
        : (from < itemCount - 1 ? from + 1 : 0)
      const fromEl = els[from] as HTMLElement
      const toEl = els[toIdx] as HTMLElement
      if (!fromEl || !toEl) {
        return
      }
      fromEl.style.opacity = String(1 - Math.abs(opacityVal))
      fromEl.style.transition = animate ? 'opacity 300ms ease' : ''
      toEl.style.opacity = String(Math.abs(opacityVal))
      return
    }
    const fromEl = els[fromIndexRef.current] as HTMLElement
    const toEl = els[toIndexRef.current] as HTMLElement
    if (!fromEl || !toEl) {
      return
    }
    fromEl.style.opacity = '0'
    fromEl.style.transition = animate ? 'opacity 500ms ease' : ''
    toEl.style.opacity = '1'
    if (animate) {
      setTimeout(() => {
        onAfterChange?.(fromIndexRef.current, toIndexRef.current)
      }, 500)
    }
  }

  function initState(count: number, startIndex?: number) {
    setOItemCount(count)
    const backup = isLoop && isSlide && count > 1 ? 1 : 0
    // v2 契约：rItemCount 含首尾拷贝（+2），index/firstIndex/lastIndex 偏移 +backup
    setRItemCount(count + (backup ? 2 : 0))
    noDragRef.current = count === 1 || !dragable

    if (backup) {
      const items = itemNodes
      setCopies({
        head: cloneElement(items[count - 1] as never, {
          className: 'md-swiper-item md-swiper-item-last-copy',
          style: { width: `${dimension}px`, height: `${dimension}px` },
        }),
        tail: cloneElement(items[0] as never, {
          className: 'md-swiper-item md-swiper-item-first-copy',
          style: { width: `${dimension}px`, height: `${dimension}px` },
        }),
      })
    } else {
      setCopies(null)
    }

    // v2 backupItem 契约：loop 模式下 index 偏移 +1（头部 lastCopy 占位）；
    // startIndex 与 v2 一致为「显示索引」，需经 calcDisplayIndex 归一
    const nextIdx =
      (startIndex !== undefined
        ? calcDisplayIndex(startIndex)
        : defaultIndex >= 0 && defaultIndex < count
          ? parseInt(String(defaultIndex))
          : 0) + backup
    setIndex(nextIdx)
    indexRef.current = nextIdx

    firstIndexRef.current = backup
    lastIndexRef.current = count - 1 + backup
    fromIndexRef.current = nextIdx === 0 ? count - 1 : nextIdx === count - 1 ? 0 : nextIdx + 1
    toIndexRef.current = nextIdx
  }

  function reInitItems(startIndex?: number) {
    if (!oCount) {
      return
    }
    getDimension()
    initState(oCount, startIndex)

    if (isSlide) {
      initScroller()
      translate(-dimension * indexRef.current, false)
    } else {
      opacity(false)
    }
    setIsInitial(true)
  }

  function startPlay() {
    if (durationRef.current > 0 && oCount > 1) {
      clearTimer()
      timerRef.current = setInterval(() => {
        // v2 契约：rItemCount 需读实时值（interval 闭包跨越多次渲染）
        if (!isLoop && indexRef.current >= rItemCountRef.current - 1) {
          clearTimer()
          return
        }
        if (!draggingRef.current) {
          doTransition('next')
        }
      }, durationRef.current)
    }
  }

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function doTransition(towards: 'prev' | 'next' | null, options?: { index: number }) {
    if (oCount === 0) {
      return
    }
    if (!options && oCount < 2) {
      return
    }
    const itemCount = rItemCountRef.current
    const oldIndex = indexRef.current

    if (!towards) {
      return
    }
    if (options && options.index !== undefined) {
      setIndex(options.index)
      indexRef.current = options.index
    } else if (towards === 'prev') {
      if (oldIndex > 0) {
        setIndex(oldIndex - 1)
        indexRef.current = oldIndex - 1
      } else if (!isSlide && oldIndex === 0) {
        setIndex(itemCount - 1)
        indexRef.current = itemCount - 1
      } else if (isLoop && oldIndex === 0) {
        setIndex(itemCount - 1)
        indexRef.current = itemCount - 1
      }
    } else if (towards === 'next') {
      if (oldIndex < itemCount - 1) {
        setIndex(oldIndex + 1)
        indexRef.current = oldIndex + 1
      } else if (!isSlide && oldIndex === itemCount - 1) {
        setIndex(0)
        indexRef.current = 0
      } else if (isLoop && oldIndex === itemCount - 1) {
        setIndex(1)
        indexRef.current = 1
      }
    }

    const newIndex = indexRef.current

    if (isLoop && isSlide) {
      fromIndexRef.current = calcDisplayIndex(oldIndex)
      toIndexRef.current = calcDisplayIndex(newIndex)
    } else {
      fromIndexRef.current = toIndexRef.current
      toIndexRef.current = newIndex
    }
    onBeforeChange?.(fromIndexRef.current, toIndexRef.current)

    if (!isSlide) {
      opacity(true)
      return
    }

    setTimeout(() => {
      const curDimension = dimensionRef.current
      const isLast = newIndex === rItemCountRef.current - 1 && isLoop
      const isFirst = newIndex === 0 && isLoop
      transitionEndHandlerRef.current = () => {
        if (isLast) {
          const x = isVertical ? 0 : firstIndexRef.current * curDimension
          const y = isVertical ? firstIndexRef.current * curDimension : 0
          scrollerRef.current?.scrollTo(x, y, false)
        }
        if (isFirst) {
          const x = isVertical ? 0 : lastIndexRef.current * curDimension
          const y = isVertical ? lastIndexRef.current * curDimension : 0
          scrollerRef.current?.scrollTo(x, y, false)
        }
        onAfterChange?.(fromIndexRef.current, toIndexRef.current)
        transitionEndHandlerRef.current = null
      }
      translate(-curDimension * newIndex, true)

      if (isFirst) {
        setIndex(lastIndexRef.current)
        indexRef.current = lastIndexRef.current
      } else if (isLast) {
        setIndex(firstIndexRef.current)
        indexRef.current = firstIndexRef.current
      }
    }, 10)
  }

  const getPoint = (
    event: React.TouchEvent | React.MouseEvent,
  ): { pageX: number; pageY: number } => {
    const e = event as unknown as {
      changedTouches?: { pageX: number; pageY: number }[]
      touches?: { pageX: number; pageY: number }[]
    }
    if (e.changedTouches && e.changedTouches.length) {
      return e.changedTouches[0]
    }
    if (e.touches && e.touches.length) {
      return e.touches[0]
    }
    return event as unknown as { pageX: number; pageY: number }
  }

  function doOnTouchStart(event: React.TouchEvent | React.MouseEvent) {
    if (noDragRef.current) {
      return
    }
    stop()

    const point = getPoint(event)

    dragStateRef.current = {}
    dragStateRef.current.startTime = new Date()
    dragStateRef.current.startLeft = point.pageX
    dragStateRef.current.startTop = point.pageY
    dragStateRef.current.itemWidth = isTestEnv ? 100 : rootRef.current?.offsetWidth ?? 0
    dragStateRef.current.itemHeight = isTestEnv ? 100 : rootRef.current?.offsetHeight ?? 0
  }

  function doOnTouchMove(event: React.TouchEvent | React.MouseEvent) {
    if (noDragRef.current) {
      return
    }
    const point = getPoint(event)

    dragStateRef.current.currentLeft = point.pageX
    dragStateRef.current.currentTop = point.pageY

    const offsetLeft = Number(dragStateRef.current.currentLeft) - Number(dragStateRef.current.startLeft)
    const offsetTop = Number(dragStateRef.current.currentTop) - Number(dragStateRef.current.startTop)
    userScrollingRef.current = isScroll(Math.abs(offsetLeft), Math.abs(offsetTop))
    if (userScrollingRef.current) {
      return
    }

    event.preventDefault()

    const itemWidth = Number(dragStateRef.current.itemWidth)
    const itemHeight = Number(dragStateRef.current.itemHeight)
    const offsetLeftClamped = Math.min(Math.max(-itemWidth + 1, offsetLeft), itemWidth - 1)
    const offsetTopClamped = Math.min(Math.max(-itemHeight + 1, offsetTop), itemHeight - 1)

    const offset = isVertical
      ? offsetTopClamped - itemHeight * indexRef.current
      : offsetLeftClamped - itemWidth * indexRef.current

    if (isSlide) {
      translate(offset, false)
    } else {
      opacity(false, offsetLeft / itemWidth)
    }
  }

  const playFnRef = useRef<(d?: number) => void>(() => {})
  playFnRef.current = (d?: number) => play(d)

  function doOnTouchEnd() {
    if (noDragRef.current) {
      return
    }
    const dragDuration = Number(new Date()) - Number(dragStateRef.current.startTime)
    const offsetLeft = Number(dragStateRef.current.currentLeft) - Number(dragStateRef.current.startLeft)
    const offsetTop = Number(dragStateRef.current.currentTop) - Number(dragStateRef.current.startTop)
    const itemWidth = Number(dragStateRef.current.itemWidth)
    const itemHeight = Number(dragStateRef.current.itemHeight)
    const currentIndex = indexRef.current
    const itemCount = rItemCount
    const isFastDrag = dragDuration < PAGING_DURATION

    let towards: 'prev' | 'next' | null = null

    if (isFastDrag && dragStateRef.current.currentLeft === undefined) {
      playFnRef.current(durationRef.current)
      return
    }

    if (isVertical) {
      if (Math.abs(offsetTop) > itemHeight * PAGING_SCALE || isFastDrag) {
        towards = offsetTop < 0 ? 'next' : 'prev'
      } else {
        translate(-dimension * currentIndex, true)
      }
    } else {
      if (Math.abs(offsetLeft) > itemWidth * PAGING_SCALE || isFastDrag) {
        towards = offsetLeft < 0 ? 'next' : 'prev'
      } else {
        if (isSlide) {
          translate(-dimension * currentIndex, true)
        } else {
          opacity(true, 0)
        }
      }
    }

    if (!isLoop) {
      if ((currentIndex === 0 && towards === 'prev') || (currentIndex === itemCount - 1 && towards === 'next')) {
        towards = null
      }
    }

    doTransition(towards)
    dragStateRef.current = {}
    play(durationRef.current)
  }

  function isScroll(diffX: number, diffY: number): boolean {
    const vertical = isVertical
    const ds = dragStateRef.current as Record<string, number>
    if (userScrollingRef.current === null) {
      if ((!vertical && ds.currentTop === ds.startTop) || (vertical && ds.currentLeft === ds.startLeft)) {
        return false
      }
      if (diffX * diffX + diffY * diffY >= 25) {
        const angle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI
        return !vertical ? angle > touchAngle : 90 - angle > touchAngle
      }
      return false
    }
    return userScrollingRef.current
  }

  function onDragStart(event: React.TouchEvent | React.MouseEvent) {
    if (transitionEndHandlerRef.current) {
      transitionEndHandlerRef.current()
    }
    if (isPrevent) {
      event.preventDefault()
    }
    draggingRef.current = true
    userScrollingRef.current = null
    doOnTouchStart(event)
  }

  function onDragMove(event: React.TouchEvent | React.MouseEvent) {
    if (isPrevent) {
      event.preventDefault()
    }
    if (!draggingRef.current) {
      return
    }
    doOnTouchMove(event)
  }

  function onDragEnd(event: React.TouchEvent | React.MouseEvent) {
    if (isPrevent) {
      event.preventDefault()
    }
    if (userScrollingRef.current) {
      playFnRef.current(durationRef.current)
      draggingRef.current = false
      dragStateRef.current = {}
      return
    }
    if (!draggingRef.current) {
      return
    }
    doOnTouchEnd()
    draggingRef.current = false
  }

  function play(d = 3000) {
    clearTimer()
    if (d < 500) {
      return
    }
    durationRef.current = d || autoplay
    startPlay()
    isStopedRef.current = false
  }

  useImperativeHandle(
    ref,
    () => ({
      next: () => doTransition('next'),
      prev: () => doTransition('prev'),
      goto: (displayIndex: number) => {
        if (isNaN(displayIndex)) {
          return
        }
        displayIndex = parseInt(String(displayIndex))
        const realIdx = calcuRealIndex(displayIndex)
        const towards = realIdx > indexRef.current ? 'next' : 'prev'
        doTransition(towards, { index: realIdx })
        playFnRef.current(durationRef.current)
      },
      getIndex: () => calcDisplayIndex(indexRef.current),
      play: (d = 3000) => {
        clearTimer()
        if (d < 500) {
          return
        }
        durationRef.current = d || autoplay
        startPlay()
        isStopedRef.current = false
      },
      stop: () => {
        clearTimer()
        isStopedRef.current = true
      },
    }),
  )

  useEffect(() => {
    const t = setTimeout(() => {
      reInitItems()
      startPlay()
      window.addEventListener('resize', onResize)
    }, 0)
    return () => {
      clearTimeout(t)
      clearTimer()
      window.removeEventListener('resize', onResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  function onResize() {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = setTimeout(() => {
      reInitItems(indexRef.current)
    }, 300)
  }

  return (
    <SwiperDimensionContext.Provider value={{ dimension: () => dimension, isVertical: () => isVertical }}>
      <div
        ref={rootRef}
        className={`md-swiper${isVertical ? ' md-swiper-vertical' : ''}${!isSlide ? ' md-swiper-fade' : ''}${!isInitial ? ' disabled' : ''}`}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        onTouchCancel={onDragEnd}
      >
        <div className="md-swiper-box" ref={swiperBoxRef}>
          <div className="md-swiper-container" ref={swiperRef}>
          {copies?.head}
          {itemNodes}
          {copies?.tail}
        </div>
        </div>
        {oItemCount > 1 && hasDots ? (
          <div className="md-swiper-indicators">
            {Array.from({ length: oItemCount }, (_, i) => (
              <div
                key={i}
                className={`md-swiper-indicator${i === realIndex ? ' md-swiper-indicator-active' : ''}`}
              ></div>
            ))}
          </div>
        ) : null}
      </div>
    </SwiperDimensionContext.Provider>
  )
})


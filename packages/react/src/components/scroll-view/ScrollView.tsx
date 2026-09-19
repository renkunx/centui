import { useEffect, forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { debounce } from '@mand-mobile/core'
import { render, Scroller, type Scroller as ScrollerType } from '@mand-mobile/core/web'

export interface ScrollViewProps {
  style?: React.CSSProperties
  scrollingX?: boolean
  scrollingY?: boolean
  bouncing?: boolean
  autoReflow?: boolean
  manualInit?: boolean
  endReachedThreshold?: number
  immediateCheckEndReaching?: boolean
  touchAngle?: number
  isPrevent?: boolean
  header?: ReactNode
  footer?: ReactNode
  refresh?: (slotProps: { scrollTop: number; isRefreshing: boolean; isRefreshActive: boolean }) => ReactNode
  more?: (slotProps: { isEndReaching: boolean }) => ReactNode
  children?: ReactNode
  onRefreshActive?: () => void
  onRefreshing?: () => void
  onEndReached?: () => void
  onEndReachedKebab?: () => void
  onScroll?: (offsets: { scrollLeft: number; scrollTop: number }) => void
}

export interface ScrollViewExposed {
  init: () => void
  scrollTo: (left: number, top: number, animate?: boolean) => void
  getOffsets: () => { left: number; top: number }
  reflowScroller: (force?: boolean) => void
  triggerRefresh: () => void
  finishRefresh: () => void
  finishLoadMore: () => void
}

export const MdScrollView = forwardRef<ScrollViewExposed, ScrollViewProps>(function MdScrollView(
  {
    scrollingX = true,
    scrollingY = true,
    bouncing = true,
    autoReflow = false,
    manualInit = false,
    endReachedThreshold = 0,
    immediateCheckEndReaching = false,
    touchAngle = 45,
    isPrevent = true,
    header,
    footer,
    refresh,
    more,
    children,
    onRefreshActive,
    onRefreshing,
    onEndReached,
    onEndReachedKebab,
    onScroll,
    style,
  }: ScrollViewProps,
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<ScrollerType | null>(null)
  const contentElRef = useRef<HTMLElement | null>(null)

  const [isRefreshActive, setIsRefreshActive] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isEndReachingStart, setIsEndReachingStart] = useState(false)
  const [isEndReaching, setIsEndReaching] = useState(false)
  const scrollRef = useRef({ scrollX: -1, scrollY: -1 })
  const moreOffsetYRef = useRef(0)
  const dimsRef = useRef({ cw: 0, ch: 0, ctw: 0, cth: 0 })
  const startRef = useRef({ x: 0, y: 0, cx: 0, cy: 0 })
  const isMouseDownRef = useRef(false)
  const isInitialedRef = useRef(false)
  const reflowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endReachedHandlerRef = useRef<(() => void) | null>(null)

  const hasRefresher = !!refresh

  const checkScrollerEnd = useCallback(() => {
    const scroller = scrollerRef.current as unknown as
      | { _clientHeight: number; _contentHeight: number; _scrollTop: number }
      | null
    if (!scroller) {
      return
    }
    const endOffset =
      scroller._contentHeight - scroller._clientHeight - (scroller._scrollTop + moreOffsetYRef.current + endReachedThreshold)
    if (scroller._scrollTop >= 0 && !isEndReaching && endOffset <= 0 && endReachedHandlerRef.current) {
      setIsEndReachingStart(true)
      endReachedHandlerRef.current()
    }
  }, [endReachedThreshold, isEndReaching])

  const onScrollCb = useCallback(
    (left: number, top: number) => {
      left = +left.toFixed(2)
      top = +top.toFixed(2)
      if (scrollRef.current.scrollX === left && scrollRef.current.scrollY === top) {
        return
      }
      scrollRef.current = { scrollX: left, scrollY: top }
      checkScrollerEnd()
      onScroll?.({ scrollLeft: left, scrollTop: top })
    },
    [checkScrollerEnd, onScroll],
  )

  const initScroller = useCallback(() => {
    if (isInitialedRef.current) {
      return
    }
    const container = rootRef.current
    const content = contentRef.current
    if (!container || !content) {
      return
    }
    contentElRef.current = content
    const refreshEl = container.querySelector<HTMLElement>('.scroll-view-refresh')
    const moreEl = container.querySelector<HTMLElement>('.scroll-view-more')
    moreOffsetYRef.current = moreEl ? moreEl.clientHeight : 0
    const refreshOffsetY = refreshEl ? refreshEl.clientHeight : 0

    const rect = container.getBoundingClientRect()
    const scroller = new Scroller(
      (left, top) => {
        render(content, left, top)
        if (isInitialedRef.current) {
          onScrollCb(+left.toFixed(2), +top.toFixed(2))
        }
      },
      {
        scrollingX,
        scrollingY,
        bouncing,
        zooming: false,
        animationDuration: 200,
        speedMultiplier: 1.2,
        inRequestAnimationFrame: true,
      },
    )
    scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop)
    if (hasRefresher) {
      scroller.activatePullToRefresh(
        refreshOffsetY,
        () => {
          setIsRefreshActive(true)
          setIsRefreshing(false)
          onRefreshActive?.()
        },
        () => {
          setIsRefreshActive(false)
          setIsRefreshing(false)
        },
        () => {
          setIsRefreshActive(false)
          setIsRefreshing(true)
          onRefreshing?.()
        },
      )
    }
    scrollerRef.current = scroller
    reflowScroller(true)
    if (autoReflow) {
      initAutoReflow()
    }
    endReachedHandlerRef.current = debounce(() => {
      setIsEndReaching(true)
      onEndReached?.()
      onEndReachedKebab?.()
    }, 50)

    setTimeout(() => {
      isInitialedRef.current = true
    }, 50)

    if (immediateCheckEndReaching) {
      setTimeout(checkScrollerEnd, 0)
    }
  }, [
    scrollingX, scrollingY, bouncing, autoReflow, hasRefresher, immediateCheckEndReaching,
    onRefreshActive, onRefreshing, onEndReached, onEndReachedKebab, onScrollCb, checkScrollerEnd,
  ])

  const initAutoReflow = useCallback(() => {
    destroyAutoReflow()
    reflowTimerRef.current = setInterval(() => {
      reflowScrollerRef.current(false)
    }, 100)
  }, [])

  const destroyAutoReflow = useCallback(() => {
    if (reflowTimerRef.current) {
      clearInterval(reflowTimerRef.current)
      reflowTimerRef.current = null
    }
  }, [])

  const reflowScrollerRef = useRef<(force?: boolean) => void>(() => {})

  const reflowScroller = useCallback(
    (force = false) => {
      const scroller = scrollerRef.current
      if (!scroller || !containerRefCurrent() || !contentElRef.current) {
        return
      }
      setTimeout(() => {
        const c = containerRefCurrent()
        const ct = contentElRef.current
        if (!c || !ct) {
          return
        }
        const nextCw = c.clientWidth
        const nextCh = c.clientHeight
        const nextCtw = ct.offsetWidth
        const nextCth = ct.offsetHeight
        const d = dimsRef.current
        if (force || d.cw !== nextCw || d.ch !== nextCh || d.ctw !== nextCtw || d.cth !== nextCth) {
          scroller.setDimensions(c.clientWidth, c.clientHeight, ct.offsetWidth, ct.offsetHeight)
          dimsRef.current = { cw: nextCw, ch: nextCh, ctw: nextCtw, cth: nextCth }
        }
      }, 0)
    },
    [scrollerRef],
  )

  function containerRefCurrent(): HTMLElement | null {
    return rootRef.current
  }

  reflowScrollerRef.current = reflowScroller

  useEffect(() => {
    if (!manualInit) {
      initScroller()
    }
    if (autoReflow) {
      initAutoReflow()
    }
    return () => {
      destroyAutoReflow()
    }
  }, [manualInit, autoReflow])

  useImperativeHandle(
    ref,
    () => ({
      init: initScroller,
      scrollTo: (left: number, top: number, animate = false) =>
        scrollerRef.current?.scrollTo(left, top, animate),
      getOffsets: () => scrollerRef.current?.getValues() ?? { left: 0, top: 0 },
      reflowScroller: (force = false) => reflowScrollerPrivate(force),
      triggerRefresh: () => scrollerRef.current?.triggerPullToRefresh(),
      finishRefresh: () => {
        scrollerRef.current?.finishPullToRefresh()
        reflowScrollerPrivate()
      },
      finishLoadMore: () => {
        setIsEndReachingStart(false)
        setIsEndReaching(false)
        reflowScrollerPrivate()
      },
    }),
    [],
  )

  const reflowScrollerPrivate = useCallback((force = false) => {
    const scroller = scrollerRef.current
    if (!scroller || !rootRef.current || !contentElRef.current) {
      return
    }
    setTimeout(() => {
      const c = rootRef.current
      const ct = contentElRef.current
      if (!c || !ct) {
        return
      }
      const d = dimsRef.current
      if (force || d.cw !== c.clientWidth || d.ch !== c.clientHeight || d.ctw !== ct.offsetWidth || d.cth !== ct.offsetHeight) {
        scroller.setDimensions(c.clientWidth, c.clientHeight, ct.offsetWidth, ct.offsetHeight)
        dimsRef.current = { cw: c.clientWidth, ch: c.clientHeight, ctw: ct.offsetWidth, cth: ct.offsetHeight }
      }
    }, 0)
  }, [])

  const onScrollerTouchStart = (event: React.TouchEvent) => {
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }
    startRef.current.x = event.targetTouches[0].pageX
    startRef.current.y = event.targetTouches[0].pageY
    scroller.doTouchStart(Array.from(event.touches), event.timeStamp)
  }

  const onScrollerTouchMove = (event: React.TouchEvent) => {
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }
    let hadPrevent = false
    if (isPrevent) {
      event.preventDefault()
      hadPrevent = true
    }
    startRef.current.cx = event.targetTouches[0].pageX
    startRef.current.cy = event.targetTouches[0].pageY

    if (!scrollingX || !scrollingY) {
      const diffX = startRef.current.cx - startRef.current.x
      const diffY = startRef.current.cy - startRef.current.y
      const angle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI
      const gate = scrollingX ? 90 - angle : angle
      if (gate < touchAngle) {
        return
      }
    }

    if (!hadPrevent && event.cancelable) {
      event.preventDefault()
    }
    scroller.doTouchMove(
      Array.from(event.touches),
      event.timeStamp,
      (event as React.TouchEvent & { scale?: number }).scale,
    )

    const boundaryDistance = 15
    const doc = document.documentElement
    const scrollLeft = doc.scrollLeft || window.pageXOffset || document.body.scrollLeft
    const scrollTop = doc.scrollTop || window.pageYOffset || document.body.scrollTop
    const pX = startRef.current.cx - scrollLeft
    const pY = startRef.current.cy - scrollTop
    if (
      pX > doc.clientWidth - boundaryDistance ||
      pY > doc.clientHeight - boundaryDistance ||
      pX < boundaryDistance ||
      pY < boundaryDistance
    ) {
      scroller.doTouchEnd(event.timeStamp)
    }
  }

  const onScrollerTouchEnd = (event: React.TouchEvent) => {
    scrollerRef.current?.doTouchEnd(event.timeStamp)
  }

  const onScrollerMouseDown = (event: React.MouseEvent) => {
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }
    startRef.current.x = event.pageX
    startRef.current.y = event.pageY
    scroller.doTouchStart([{ pageX: event.pageX, pageY: event.pageY }], event.timeStamp)
    isMouseDownRef.current = true
  }

  const onScrollerMouseMove = (event: React.MouseEvent) => {
    const scroller = scrollerRef.current
    if (!scroller || !isMouseDownRef.current) {
      return
    }
    startRef.current.cx = event.pageX
    startRef.current.cy = event.pageY
    if (!scrollingX || !scrollingY) {
      const diffX = startRef.current.cx - startRef.current.x
      const diffY = startRef.current.cy - startRef.current.y
      const angle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI
      const gate = scrollingX ? 90 - angle : angle
      if (gate < touchAngle) {
        return
      }
    }
    scroller.doTouchMove([{ pageX: event.pageX, pageY: event.pageY }], event.timeStamp)
    isMouseDownRef.current = true
  }

  const onScrollerMouseUp = (event: React.MouseEvent) => {
    const scroller = scrollerRef.current
    if (!scroller || !isMouseDownRef.current) {
      return
    }
    scroller.doTouchEnd(event.timeStamp)
    isMouseDownRef.current = false
  }

  return (
    <div
      ref={rootRef}
      className="md-scroll-view"
      style={style}
      onTouchStart={onScrollerTouchStart}
      onTouchMove={onScrollerTouchMove}
      onTouchEnd={onScrollerTouchEnd}
      onTouchCancel={onScrollerTouchEnd}
      onMouseDown={onScrollerMouseDown}
      onMouseMove={onScrollerMouseMove}
      onMouseUp={onScrollerMouseUp}
      onMouseLeave={onScrollerMouseUp}
    >
      {header ? <div className="scroll-view-header">{header}</div> : null}
      <div
        ref={contentRef}
        className={`scroll-view-container${scrollingX && !scrollingY ? ' horizon' : ''}`}
        {...({ 'scroll-wrapper': '' } as object)}
      >
        {refresh ? (
          <div
            className={`scroll-view-refresh${isRefreshing ? ' refreshing' : ''}${
              isRefreshActive ? ' refresh-active' : ''
            }`}
          >
            {refresh({ scrollTop: 0, isRefreshing, isRefreshActive })}
          </div>
        ) : null}
        {children}
        {more ? (
          <div
            className={`scroll-view-more${isEndReachingStart || isEndReaching ? ' active' : ''}`}
          >
            {more({ isEndReaching: isEndReachingStart || isEndReaching })}
          </div>
        ) : null}
      </div>
      {footer ? <div className="scroll-view-footer">{footer}</div> : null}
    </div>
  )
})

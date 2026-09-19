import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { MdScrollView, type ScrollViewExposed } from '../scroll-view/ScrollView'

export interface TabBarItem {
  name: string | number
  label?: string
  disabled?: boolean
}

export interface TabBarProps {
  value?: string | number
  items?: TabBarItem[]
  hasInk?: boolean
  inkLength?: number | string
  immediate?: boolean
  renderItem?: (opts: { item: TabBarItem; items: TabBarItem[]; index: number; currentName: string | number }) => ReactNode
  onChange?: (item: TabBarItem, index: number, prevIndex: number) => void
  onInput?: (name: string | number) => void
}

export interface TabBarExposed {
  reflow: () => void
}

export const MdTabBar = forwardRef<TabBarExposed, TabBarProps>(function MdTabBar(
  { value = '', items = [], hasInk = true, inkLength = '25', immediate = false, renderItem, onChange, onInput },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const scrollViewRef = useRef<ScrollViewExposed | null>(null)
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [currentName, setCurrentName] = useState<string | number>(() => {
    // created 语义：默认选中首项并通知
    if (value === '' && items.length) {
      const first = items[0]
      setTimeout(() => onChange?.(first, 0, 0), 0)
      return first.name
    }
    return value
  })
  const [wrapperW, setWrapperW] = useState(0)
  const [contentW, setContentW] = useState(0)
  const [inkWidth, setInkWidth] = useState(0)
  const [inkPos, setInkPos] = useState(0)
  const [scrollerTmpKey, setScrollerTmpKey] = useState(() => Date.now())
  const [maskStartShown, setMaskStartShown] = useState(false)
  const [maskEndShown, setMaskEndShown] = useState(true)

  // v2 watch value：仅在 prop 实际变化时同步（created 默认选中不被清掉）
  const prevValueRef = useRef(value)
  const currentNameRef = useRef(currentName)
  currentNameRef.current = currentName
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      if (value !== currentNameRef.current) {
        setCurrentName(value)
      }
    }
  }, [value])

  const currentIndex = items.findIndex((item) => item.name === currentName)
  // v2 契约：if (this.currentIndex) 真值判断（index 0 时 currentTab 为 undefined）
  const currentTab = currentIndex ? items[currentIndex] : undefined

  const scrollable = contentW > wrapperW

  // v2 watch scrollable：可滚动状态变化时重建 scroller
  const scrollableRef = useRef(scrollable)
  useEffect(() => {
    if (scrollableRef.current !== scrollable) {
      scrollableRef.current = scrollable
      setScrollerTmpKey(Date.now())
    }
  }, [scrollable])

  const reflowRef = useRef<() => void>(() => {})

  const reflow = useCallback(() => {
    const refs = itemRefs.current
    if (!refs.length) {
      return
    }
    const wrapperRect = wrapperRef.current?.getBoundingClientRect()
    setWrapperW(wrapperRect?.width ?? 0)

    let contentWidth = 0
    for (let i = 0; i < items.length; i++) {
      contentWidth += refs[i]?.getBoundingClientRect().width ?? 0
    }
    setContentW(contentWidth)
    scrollViewRef.current?.reflowScroller()

    setTimeout(() => {
      const target = itemRefs.current[currentIndex]
      if (!target) {
        return
      }
      const width = typeof inkLength === 'string' ? Number(inkLength) : (target.offsetWidth * inkLength) / 100
      setInkWidth(width)
      setInkPos(target.offsetLeft + (target.offsetWidth - width) / 2)

      const prevTarget = itemRefs.current[currentIndex - 1]
      const nextTarget = itemRefs.current[currentIndex + 1]
      if (!prevTarget) {
        scrollViewRef.current?.scrollTo(0, 0, true)
        return
      }
      if (!nextTarget) {
        scrollViewRef.current?.scrollTo(contentWidth, 0, true)
        return
      }
      const wrapperRect2 = wrapperRef.current?.getBoundingClientRect()
      const prevRect = prevTarget.getBoundingClientRect()
      const nextRect = nextTarget.getBoundingClientRect()
      if (wrapperRect2 && prevRect.left < wrapperRect2.left) {
        scrollViewRef.current?.scrollTo(prevTarget.offsetLeft, 0, true)
      } else if (wrapperRect2 && nextRect.right > wrapperRect2.right) {
        scrollViewRef.current?.scrollTo(nextTarget.offsetLeft + nextTarget.offsetWidth - (wrapperRect2.width ?? 0), 0, true)
      }
    }, 0)
  }, [items, currentIndex, inkLength])

  reflowRef.current = reflow
  useImperativeHandle(ref, () => ({ reflow: () => reflowRef.current() }))

  useEffect(() => {
    reflowRef.current()
    const onResize = () => reflowRef.current()
    window.addEventListener('resize', onResize)
    if (immediate) {
      setTimeout(() => {
        const item = items[currentIndex]
        if (item) {
          onChange?.(item, currentIndex, currentIndex)
        }
      }, 0)
    }
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const setItemRef = (el: HTMLAnchorElement | null, index: number) => {
    itemRefs.current[index] = el
  }

  return (
    <nav className="md-tab-bar">
      <div className="md-tab-bar-inner" ref={wrapperRef}>
        {scrollable ? (
          <>
            <div className="md-tab-bar-start" style={{ display: maskStartShown ? '' : 'none' }}></div>
            <div className="md-tab-bar-end" style={{ display: maskEndShown ? '' : 'none' }}></div>
          </>
        ) : null}
        <MdScrollView
          key={scrollerTmpKey}
          ref={scrollViewRef as never}
          scrollingX={scrollable}
          scrollingY={false}
          onScroll={({ scrollLeft }) => {
            if (scrollLeft > 0) {
              setMaskStartShown(true)
            } else {
              setMaskStartShown(false)
            }
            setMaskEndShown(!(contentW > 0 && scrollLeft >= contentW - wrapperW))
          }}
        >
          <div className="md-tab-bar-list" style={{ width: `${contentW}px` }}>
            {items.map((item, index) => (
              <a
                key={item.name}
                ref={(el) => setItemRef(el, index)}
                className={`md-tab-bar-item${currentName === item.name ? ' is-active' : ''}${
                  item.disabled ? ' is-disabled' : ''
                }${items.length > 5 && index === 0 ? ' more-than-five' : ''}`}
                onClick={() => {
                  if (item.disabled) {
                    return
                  }
                  onChange?.(item, index, currentIndex)
                  setCurrentName(item.name)
                  onInput?.(item.name)
                }}
              >
                {renderItem
                  ? renderItem({ item, items, index, currentName })
                  : item.label}
              </a>
            ))}
          </div>
          {hasInk ? (
            <span
              className={`md-tab-bar-ink${currentTab && currentTab.disabled ? ' is-disabled' : ''}`}
              style={{
                width: `${inkWidth}px`,
                transform: `translateX(${inkPos}px)`,
              }}
            ></span>
          ) : null}
        </MdScrollView>
      </div>
    </nav>
  )
})

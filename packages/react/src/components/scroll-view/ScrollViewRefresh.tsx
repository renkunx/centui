import { useEffect, useRef, useState } from 'react'
import { MdActivityIndicatorRolling } from '../activity-indicator/Roller'

export interface ScrollViewRefreshProps {
  scrollTop?: number
  isRefreshing?: boolean
  isRefreshActive?: boolean
  refreshText?: string
  refreshActiveText?: string
  refreshingText?: string
  rollerColor?: string
}

export function MdScrollViewRefresh({
  scrollTop = 0,
  isRefreshing = false,
  isRefreshActive = false,
  refreshText = '下拉刷新',
  refreshActiveText = '释放刷新',
  refreshingText = '刷新中...',
  rollerColor = '#2F86F6',
}: ScrollViewRefreshProps) {
  // v2 契约：process 需挂载后测量 clientHeight；首帧以 +scrollTop 参与
  const [elHeight, setElHeight] = useState<number | null>(null)
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (elRef.current) {
      setElHeight(elRef.current.clientHeight)
    }
  }, [])

  const process = (() => {
    if (isRefreshing) {
      return undefined
    }
    if (elHeight === null || !scrollTop) {
      return +scrollTop
    }
    if (Math.abs(scrollTop) < elHeight / 2) {
      return 0
    }
    return (Math.abs(scrollTop) - elHeight / 2) / (elHeight / 2)
  })()

  const refreshTip = isRefreshing
    ? refreshingText
    : isRefreshActive
      ? refreshActiveText
      : refreshText

  return (
    <div ref={elRef} className="md-scroll-view-refresh">
      <MdActivityIndicatorRolling
        process={process}
        width={10}
        color={rollerColor}
      />
      <p className="refresh-tip">{refreshTip}</p>
    </div>
  )
}

export interface ScrollViewMoreProps {
  loadingText?: string
  finishedText?: string
  isFinished?: boolean
}

export function MdScrollViewMore({
  loadingText = '更多加载中...',
  finishedText = '全部已加载',
  isFinished = false,
}: ScrollViewMoreProps) {
  return <div className="md-scroll-view-more">{isFinished ? finishedText : loadingText}</div>
}

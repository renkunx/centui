/**
 * scroll-view 纯逻辑：触底阈值状态机、下拉刷新状态机（pullDistance/refreshActive/
 * refreshing 事件链）、默认刷新头文案与进度。
 * 对齐 packages/vue/src/components/scroll-view/{ScrollView,ScrollViewRefresh}.vue
 * 与 @centui/core/web Scroller 的 activatePullToRefresh 阈值语义。
 */
export type RefreshPhase = 'idle' | 'dragging' | 'active' | 'refreshing'

/** 触底判定（ScrollView.checkScrollerEnd）：endOffset <= 0 即触底起始 */
export function endOffsetOf(
  contentHeight: number,
  containerHeight: number,
  scrollTop: number,
  moreOffsetY: number,
  threshold: number,
): number {
  return contentHeight - containerHeight - (scrollTop + moreOffsetY + threshold)
}

/**
 * 下拉距离的橡皮筋阻尼：阈值内线性，超出部分 0.3 阻尼
 * （v2 scroller 越界阻尼 0.5 的收敛近似，差异在组件头声明）。
 */
export function pullDistanceOf(dy: number, threshold: number): number {
  if (dy <= 0) return 0
  if (dy <= threshold) return dy
  return threshold + (dy - threshold) * 0.3
}

/** 默认刷新头进度（ScrollViewRefresh.process：前 1/2 为 0，后 1/2 线性到 1） */
export function refreshProcessOf(pullDistance: number, refreshHeight: number): number {
  if (refreshHeight <= 0 || !pullDistance) return 0
  if (Math.abs(pullDistance) < refreshHeight / 2) return 0
  return Math.min(1, (Math.abs(pullDistance) - refreshHeight / 2) / (refreshHeight / 2))
}

/** 刷新头文案（ScrollViewRefresh.refreshTip，zh-CN 词条默认） */
export function refreshTipOf(
  phase: RefreshPhase,
  texts: {refreshText?: string; refreshActiveText?: string; refreshingText?: string},
): string {
  if (phase === 'refreshing') {
    return texts.refreshingText ?? '刷新中...'
  }
  if (phase === 'active') {
    return texts.refreshActiveText ?? '释放刷新'
  }
  return texts.refreshText ?? '下拉刷新'
}

/** 50ms 防抖的 endReached 触发器（ScrollView initScroller 的 debounce 语义） */
export function createEndReachedTrigger(emit: () => void, wait = 50) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    trigger() {
      if (timer != null) return
      timer = setTimeout(() => {
        timer = null
        emit()
      }, wait)
    },
    reset() {
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}

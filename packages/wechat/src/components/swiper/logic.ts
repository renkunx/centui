/**
 * swiper 布局纯逻辑：loop 拷贝偏移、索引换算、翻页判定。
 * 对齐 packages/vue/src/components/swiper/Swiper.vue 的 initState/calcDisplayIndex/
 * calcuRealIndex/doTransition/doOnTouchEnd 关键分支。
 */

/** slide 距离阈值（PAGING_SCALE）与快速拖拽时长（PAGING_DURATION） */
export const PAGING_SCALE = 0.5
export const PAGING_DURATION = 300

export interface SwiperGeometry {
  isVertical: boolean
  isSlide: boolean
  isLoop: boolean
  /** 原始项数 */
  oItemCount: number
  /** 渲染项数（loop+slide 时 +2） */
  rItemCount: number
  dimension: number
}

export function geometryOf(
  oItemCount: number,
  transition: string,
  isLoop: boolean,
  dimension: number,
): SwiperGeometry {
  const isSlide = transition.toLowerCase().indexOf('slide') !== -1
  const isVertical = transition === 'slideY'
  return {
    isVertical,
    isSlide,
    isLoop,
    oItemCount,
    rItemCount: oItemCount + (isLoop && isSlide && oItemCount > 1 ? 2 : 0),
    dimension,
  }
}

/** initState：loop+slide 模式下 realIndex 前移一位（首尾拷贝占位） */
export function initialRealIndex(
  startIndex: number | undefined,
  defaultIndex: number,
  oItemCount: number,
): number {
  if (startIndex !== undefined) return startIndex
  if (defaultIndex >= 0 && defaultIndex < oItemCount) return Math.floor(defaultIndex)
  return 0
}

/** real index → display index（calcDisplayIndex） */
export function calcDisplayIndex(realIndex: number, isLoop: boolean, isSlide: boolean, oItemCount: number): number {
  if (isLoop && isSlide && oItemCount > 0) {
    const idx = realIndex - 1
    if (idx < 0) return oItemCount - 1
    if (idx > oItemCount - 1) return 0
    return idx
  }
  return realIndex
}

/** display index → real index（calcuRealIndex） */
export function calcRealIndex(displayIndex: number, isLoop: boolean, isSlide: boolean, oItemCount: number): number {
  let idx = displayIndex
  if (idx < 0) idx = 0
  else if (oItemCount > 0 && idx > oItemCount - 1) idx = oItemCount - 1
  if (isLoop && isSlide) return idx + 1
  return idx
}

/** loop 拷贝的绝对定位偏移（相对宿主 item）：首项拷贝在尾部、末项拷贝在头部 */
export function copyOffsets(oItemCount: number, dimension: number): {first: number; last: number} | null {
  if (oItemCount < 2) return null
  // 首项位于 real 空间 1 → 拷贝置于 rItemCount-1（即 count+1 位）
  return {first: oItemCount * dimension, last: -oItemCount * dimension}
}

/** doTransition 的 next index 分支（slide 模式，含 loop 回绕） */
export function nextIndex(
  currentIndex: number,
  rItemCount: number,
  towards: 'prev' | 'next',
  isSlide: boolean,
  isLoop: boolean,
): number {
  if (towards === 'prev') {
    if (currentIndex > 0) return currentIndex - 1
    if (!isSlide && currentIndex === 0) return rItemCount - 1
    if (isLoop && currentIndex === 0) return rItemCount - 1
    return currentIndex
  }
  if (currentIndex < rItemCount - 1) return currentIndex + 1
  if (!isSlide && currentIndex === rItemCount - 1) return 0
  if (isLoop && currentIndex === rItemCount - 1) return 1
  return currentIndex
}

/** doOnTouchEnd 的翻页判定 */
export function pagingTowards(
  offset: number,
  dimension: number,
  dragDuration: number,
  currentIndex: number,
  rItemCount: number,
  isLoop: boolean,
): 'prev' | 'next' | null {
  const isFastDrag = dragDuration < PAGING_DURATION
  let towards: 'prev' | 'next' | null = null
  if (Math.abs(offset) > dimension * PAGING_SCALE || isFastDrag) {
    towards = offset < 0 ? 'next' : 'prev'
  }
  if (!isLoop) {
    if ((currentIndex === 0 && towards === 'prev') || (currentIndex === rItemCount - 1 && towards === 'next')) {
      towards = null
    }
  }
  return towards
}

/** 拖拽中转（isScroll 角度门控）：是否判定为页面纵向滚动（放弃翻页手势） */
export function isPageScrolling(
  diffX: number,
  diffY: number,
  isVertical: boolean,
  touchAngle: number,
): boolean {
  if (diffX * diffX + diffY * diffY < 25) return false
  const angle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI
  return !isVertical ? angle > touchAngle : 90 - angle > touchAngle
}

/** fade 拖拽的相邻项与透明度（opacity(offsetVal) 分支） */
export function fadeNeighbor(from: number, itemCount: number, opacityVal: number): number {
  if (opacityVal > 0) {
    return from > 0 ? from - 1 : itemCount - 1
  }
  return from < itemCount - 1 ? from + 1 : 0
}

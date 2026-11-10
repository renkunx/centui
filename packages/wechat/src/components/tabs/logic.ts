/**
 * tabs 纯逻辑：tab 条几何（ink 宽度/位置、自动滚动目标）与条目归一。
 * 对齐 packages/vue/src/components/tabs/TabBar.vue 的 reflow/onScroll。
 */
export interface TabBarItem {
  name: string | number
  label?: string
  disabled?: boolean
  no?: number
}

export interface ItemRect {
  /** 相对滚动内容的横向偏移 */
  left: number
  width: number
}

/**
 * ink bar 几何：inkLength 为百分比数字（相对激活项宽度），字符串直接作 px
 * （TabBar.reflow：typeof inkLength === 'string' ? Number(inkLength) : width * n / 100）。
 */
export function inkGeometryOf(
  item: ItemRect,
  inkLength: number | string,
): {width: number; pos: number} {
  const inkWidth = typeof inkLength === 'string' ? Number(inkLength) : (item.width * inkLength) / 100
  return {width: inkWidth, pos: item.left + (item.width - inkWidth) / 2}
}

/**
 * 激活项变化后的自动滚动目标（TabBar.reflow 尾段）：
 * 无前项 → 0；无后项 → contentW - wrapperW；
 * 前项滚出视口左缘 → 前项 offset；后项滚出视口右缘 → 后项右缘对齐；否则保持。
 * rects 为滚动内容相对坐标，scrollLeft 为当前滚动位（Vue 以 viewport rect 比较，
 * 此处以「内容坐标 vs 当前滚动窗口」等价表达）。
 */
export function scrollTargetOf(
  index: number,
  rects: ItemRect[],
  contentW: number,
  wrapperW: number,
  scrollLeft = 0,
): number | null {
  const prev = rects[index - 1]
  const next = rects[index + 1]
  if (!prev) return 0
  if (!next) return Math.max(0, contentW - wrapperW)
  if (prev.left < scrollLeft) return prev.left
  if (next.left + next.width > scrollLeft + wrapperW) return next.left + next.width - wrapperW
  return null
}

/** 渐变遮罩可见性（TabBar.onScroll） */
export function maskVisibilityOf(
  scrollLeft: number,
  contentW: number,
  wrapperW: number,
): {start: boolean; end: boolean} {
  return {
    start: scrollLeft > 0,
    end: !(contentW > 0 && scrollLeft >= contentW - wrapperW),
  }
}

/**
 * picker 纯逻辑：列视图构建、默认索引解析、invalid 导航、级联展开、偏移↔索引换算、
 * 高频 setData 节流器。
 *
 * 对齐来源：
 *  - packages/vue/src/components/picker/PickerColumn.vue（默认索引/invalid/换算语义）
 *  - @centui/core/picker/cascade.ts（级联展开；小程序测试环境不解析 @centui/core 包依赖，
 *    按既有批次惯例在组件目录内同步实现，构建期 bundle 语义一致）
 */
export interface PickerColumnItem {
  text?: string
  label?: string
  value?: unknown
  [key: string]: unknown
}

/** core/picker/cascade 的节点（结构子集） */
export interface CascadeNode {
  text?: string
  label?: string
  value?: string | number
  children?: CascadeNode[]
}

/** 列视图（wxml 渲染用，含 no 供 wx:key） */
export interface ColumnViewItem {
  text?: string
  label?: string
  value?: unknown
  disabled: boolean
  no: number
  [key: string]: unknown
}

export interface ColumnView {
  no: number
  items: ColumnViewItem[]
  activeIndex: number
  offset: number
}

/** Vue 版 lineHeight ?? 45 */
export const DEFAULT_LINE_HEIGHT = 45

/** PickerColumn style：maskerHeight = lineHeight*2 + 10（rpx 空间，1px=1rpx） */
export function maskerHeightOf(lineHeight: number): number {
  return lineHeight * 2 + 10
}

/** 根节点高度 = indicatorHeight + 2 * maskerHeight */
export function columnHeightOf(lineHeight: number): number {
  return lineHeight + maskerHeightOf(lineHeight) * 2
}

/** 列内容最大滚动偏移 = (count-1) * itemHeight（对照 setDimensions 后的 maxTop） */
export function maxOffsetOf(count: number, lineHeight: number): number {
  return Math.max(0, (count - 1) * lineHeight)
}

/** offset → itemIndex（getColumnIndexByOffset：round(top / indicatorHeight)） */
export function indexOfOffset(offset: number, lineHeight: number): number {
  return Math.round(offset / lineHeight)
}

export function offsetOfIndex(index: number, lineHeight: number): number {
  return index * lineHeight
}

/** 按 text/label/value 匹配默认值（PickerColumn.getColumnIndexByDefault 的单列语义） */
export function matchItemIndex(items: PickerColumnItem[], defaultValue: unknown): number {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.text === defaultValue || item.label === defaultValue || item.value === defaultValue) {
      return i
    }
  }
  return 0
}

/**
 * 各列默认索引（非级联）：defaultIndex 优先，其次 defaultValue 匹配，兜底 0。
 * 两者的同列值都未给时取 0（v2：避免 activedIndexs 初始化失败）。
 */
export function resolveDefaultIndexs(
  columns: PickerColumnItem[][],
  defaultIndex: number[],
  defaultValue: unknown[],
): number[] {
  return columns.map((items, col) => {
    if (typeof defaultIndex[col] === 'number') {
      return clampIndex(defaultIndex[col] as number, items.length)
    }
    if (defaultValue[col] !== undefined && defaultValue[col] !== null) {
      return clampIndex(matchItemIndex(items, defaultValue[col]), items.length)
    }
    return 0
  })
}

export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(count - 1, Math.max(0, index))
}

/** isColumnIndexInvalid：invalidIndex[column] 可为数组或标量（inArray 语义） */
export function isInvalidIndex(
  invalidIndex: Array<number | number[]>,
  columnIndex: number,
  itemIndex: number,
): boolean {
  const invalid = invalidIndex[columnIndex]
  if (invalid === undefined || invalid === null) return false
  if (Array.isArray(invalid)) return invalid.indexOf(itemIndex) !== -1
  return invalid === itemIndex
}

/** 列内是否存在有效项（PickerColumn.hasValidIndex） */
export function hasValidIndex(
  items: PickerColumnItem[],
  invalidIndex: Array<number | number[]>,
  columnIndex: number,
): boolean {
  for (let i = 0; i < items.length; i++) {
    if (!isInvalidIndex(invalidIndex, columnIndex, i)) return true
  }
  return false
}

/**
 * findValidIndex：从 start 起按 direction 探测第一个有效项；
 * 本方向无有效项时反向再探（PickerColumn.findValidIndex）。全列无有效项返回 start 原值。
 */
export function findValidIndex(
  items: PickerColumnItem[],
  invalidIndex: Array<number | number[]>,
  columnIndex: number,
  start: number,
  direction: 1 | -1,
): number {
  if (!hasValidIndex(items, invalidIndex, columnIndex)) {
    return start
  }
  let temp = start
  while (temp >= 0 && temp <= items.length - 1 && isInvalidIndex(invalidIndex, columnIndex, temp)) {
    temp += direction
  }
  if (temp < 0 || temp > items.length - 1) {
    return findValidIndex(items, invalidIndex, columnIndex, start, (direction === 1 ? -1 : 1) as 1 | -1)
  }
  return temp
}

/**
 * 级联列展开（core/picker cascade 的纯函数化）：
 * 逐层取 list（第 0 层为 root，其余取上一层选中节点的 children）；
 * 选中序优先级 picks[i] > defaultIndex[i] > defaultValue[i] 匹配 > 0，
 * 越界回 0（cascade: activeIndex >= len → 0）。
 */
export function expandCascade(
  root: CascadeNode[],
  cols: number,
  picks: Array<number | undefined>,
  defaultIndex: number[],
  defaultValue: unknown[],
): {columns: PickerColumnItem[][]; indexs: number[]} {
  const columns: PickerColumnItem[][] = []
  const indexs: number[] = []
  let node: CascadeNode | undefined

  for (let i = 0; i < cols; i++) {
    const list: CascadeNode[] =
      i === 0 ? root : ((node?.children as CascadeNode[] | undefined) ?? [])
    let idx: number
    if (typeof picks[i] === 'number' && (picks[i] as number) < list.length) {
      idx = picks[i] as number
    } else if (typeof defaultIndex[i] === 'number') {
      idx = defaultIndex[i] as number
    } else if (defaultValue[i] !== undefined && defaultValue[i] !== null) {
      idx = matchItemIndex(list as PickerColumnItem[], defaultValue[i])
    } else {
      idx = 0
    }
    if (idx >= list.length) idx = 0
    indexs[i] = idx
    columns[i] = list as PickerColumnItem[]
    node = list[idx]
  }

  return {columns, indexs}
}

/** 级联数据形态归一：[[nodes]] 包裹 / 裸节点列表均可（组件扩展，Vue 版约定包裹数组） */
export function cascadeRootOf(data: unknown[]): CascadeNode[] {
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    return data[0] as CascadeNode[]
  }
  return (data as CascadeNode[]) ?? []
}

/** 构建列视图（wxml 用）：item 展开 disabled/no，activeIndex/offset 落位 */
export function buildColumnViews(
  columns: PickerColumnItem[][],
  indexs: number[],
  invalidIndex: Array<number | number[]>,
  lineHeight: number,
): ColumnView[] {
  return columns.map((items, col) => {
    const active = clampIndex(indexs[col] ?? 0, items.length)
    return {
      no: col,
      activeIndex: active,
      offset: offsetOfIndex(active, lineHeight),
      items: items.map((item, i) => ({
        ...item,
        disabled: isInvalidIndex(invalidIndex, col, i),
        no: i,
      })),
    }
  })
}

/**
 * 高频 transform 的 setData 节流器：≥16ms 直发，否则合并尾帧一次下发
 * （PORTING_SPEC §9：滚动类只传 transform 所需最小字段）。
 */
export class OffsetFlusher {
  private last = 0
  private pending = new Map<string, unknown>()
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private apply: (patch: Record<string, unknown>) => void,
    private frame = 16,
  ) {}

  set(key: string, value: unknown): void {
    this.pending.set(key, value)
    const now = Date.now()
    if (now - this.last >= this.frame) {
      this.flush()
    } else if (this.timer == null) {
      this.timer = setTimeout(() => {
        this.timer = null
        this.flush()
      }, this.frame - (now - this.last))
    }
  }

  flush(): void {
    if (this.timer != null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.pending.size === 0) return
    this.last = Date.now()
    const patch: Record<string, unknown> = {}
    this.pending.forEach((value, key) => {
      patch[key] = value
    })
    this.pending.clear()
    this.apply(patch)
  }

  clear(): void {
    if (this.timer != null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.pending.clear()
  }
}

/**
 * 级联列数据联动（自 v2 picker/cascade.js 迁移）。
 * v2 数据格式：[[第一列节点...]] 包裹数组；联动时 values 为当前激活节点（含 children）。
 * 与 v2 差异：默认值改用展开合并，修复 v2 extend 污染模块级共享 defaultOptions 的隐患。
 */
import { warn } from '../debug'

export interface CascadeNode {
  text?: string
  label?: string
  value?: string | number
  children?: CascadeNode[]
}

/** 结构化 picker 接口：任何框架的 picker 列组件实现此接口即可接入级联 */
export interface CascadePickerLike {
  setColumnValues: (level: number, values: CascadeNode[]) => unknown
}

export interface CascadeOptions {
  currentLevel?: number
  maxLevel?: number
  /** 初始调用传包裹数组 [[第一列...]]；联动时传当前激活节点 */
  values?: CascadeNode[] | CascadeNode | CascadeNode[][]
  defaultIndex?: number[]
  defaultValue?: Array<string | number | null>
}

const defaultOptions: Required<Pick<CascadeOptions, 'currentLevel' | 'maxLevel'>> & CascadeOptions = {
  currentLevel: 0,
  maxLevel: 0,
  values: [],
  defaultIndex: [],
  defaultValue: [],
}

const EMPTY_CHILDREN: CascadeNode[] = []

function getDefaultIndex(
  data: CascadeNode[],
  defaultIndex: number | undefined,
  defaultValue: string | number | null | undefined,
): number {
  let activeIndex = 0
  if (defaultIndex !== undefined) {
    return defaultIndex
  } else if (defaultValue !== undefined) {
    data.some((item, index) => {
      if (item.text === defaultValue || item.label === defaultValue || item.value === defaultValue) {
        activeIndex = index
        return true
      }
      return false
    })
  }
  return activeIndex
}

/**
 * cascade column by set value of following columns
 * @param picker 结构化 picker（setColumnValues 接口）
 * @param options { currentLevel, maxLevel, values, defaultIndex, defaultValue }
 * @param fn 级联完成后的回调
 */
export function cascade(
  picker: CascadePickerLike | undefined,
  options: CascadeOptions = {},
  fn?: () => void,
): void {
  const opts = { ...defaultOptions, ...options }

  if (!picker) {
    warn('cascade: picker is undefined')
    return
  }

  let values = opts.values as CascadeNode | CascadeNode[] | CascadeNode[][]

  for (let i = (opts.currentLevel ?? 0) + 1; i < (opts.maxLevel ?? 0); i++) {
    const columnValues =
      (i === 0 ? (values as CascadeNode[][])[0] : (values as CascadeNode).children) || []
    picker.setColumnValues(i, columnValues)
    let activeIndex = getDefaultIndex(
      columnValues,
      opts.defaultIndex?.[i],
      opts.defaultValue?.[i],
    )
    if (activeIndex >= columnValues.length) {
      activeIndex = 0
    }
    values = columnValues[activeIndex] || EMPTY_CHILDREN
  }

  fn?.()
}

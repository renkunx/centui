/**
 * 对象/数组工具（自 v2 _util/store.js 迁移，含 traverse 的 level 重置怪癖——见测试注释）。
 */
import { noop } from './lang'

/**
 * Mix properties into target object.
 */
export function extend<T extends Record<string, unknown>>(to: T, _from: Record<string, unknown> | null): T {
  for (const key in _from) {
    ;(to as Record<string, unknown>)[key] = _from[key]
  }
  return to
}

export interface TraverseNode {
  [key: string]: unknown
}

export type TraverseCallback = (
  node: TraverseNode,
  level: number,
  indexs: number[],
) => void | 1 | 2

/**
 * Multiple Array traversal
 * @return 1 continue
 * @return 2 break
 *
 * @remarks
 * ⚠️ v2 契约怪癖（行为保持不变，既有组件依赖）：`walk` 在每个子树遍历结束后会把
 * `level` / `indexs` 重置为初始值。后果是——在同一层数组中，位于任一「含 children
 * 的节点」之后的兄弟节点会被**静默跳过**（level 被重置为 0，小于 childrenKeys 的
 * 长度而被当作非叶子）；例如 `[branch, leaf]` 只会访问 branch 的子树，`leaf` 不会
 * 被回调；`[leaf, branch]` 则 leaf 先被访问、branch 子树正常。
 *
 * 因此数据需满足「同一层级的节点要么都有 children、要么都没有」才能得到完整遍历
 * （v2 picker-column / drop-menu 的数据即满足此约定）。修复此怪癖会导致上述组件
 * 行为变化，v3 选择保留并在此显式记录。
 */
export function traverse(
  data: TraverseNode[],
  childrenKeys: string[] | string | TraverseCallback,
  fn: TraverseCallback = noop,
): void {
  if (!data) {
    return
  }
  if (typeof childrenKeys === 'function') {
    fn = childrenKeys
    childrenKeys = []
  }
  let level = 0 // current level
  let indexs: number[] = [] // index set of all levels
  const walk = (curData: TraverseNode[]) => {
    for (let i = 0, len = curData.length; i < len; i++) {
      const isArray = Array.isArray(curData[i])
      const key = Array.isArray(childrenKeys) ? childrenKeys[level] : childrenKeys
      if (isArray || (curData[i] && curData[i][key as string])) {
        level++
        indexs.push(i)
        walk(
          (isArray ? curData[i] : curData[i][key as string]) as TraverseNode[],
        )
      } else if (level >= (childrenKeys as string[]).length) {
        const res = fn(curData[i], level, [...indexs, i])
        if (res === 1) {
          continue
        } else if (res === 2) {
          break
        }
      } else {
        continue
      }
    }
    level = 0
    indexs = []
  }
  walk(data)
}

/**
 * Merge an Array of Objects into a single Object.
 */
export function toObject(arr: Array<Record<string, unknown> | null>): Record<string, unknown> {
  const res: Record<string, unknown> = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/**
 * Convert an Array-like object to a real Array.
 */
export function toArray<T>(list: ArrayLike<T>, start = 0): T[] {
  let i = list.length - start
  const ret: T[] = []
  while (i--) {
    ret.unshift(list[i + start])
  }
  return ret
}

/**
 * whether item is in list or list equal item
 */
export function inArray<T>(list: T[] | T, item: T): boolean {
  return Array.isArray(list) ? !!~list.indexOf(item) : item === list
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 */
export function toNumber(val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

/**
 * Convert a value to a string
 */
export function toString(val: unknown): string {
  return val == null ? '' : typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
}

/**
 * Determine whether the two objects are equal or not shallowly
 */
export function compareObjects(object0: unknown, object1: unknown): boolean {
  let ret = true

  if (!object0 || !object1) {
    ret = false
  } else if (typeof object0 !== 'object' || typeof object1 !== 'object') {
    ret = false
  } else if (JSON.stringify(object0) !== JSON.stringify(object1)) {
    ret = false
  }

  return ret
}

/**
 * Check object is empty
 */
export function isEmptyObject(obj: Record<string, unknown>): boolean {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false
    }
  }
  return true
}

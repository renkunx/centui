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

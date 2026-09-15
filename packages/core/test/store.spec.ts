import { describe, expect, it } from 'vitest'
import {
  compareObjects,
  extend,
  inArray,
  isEmptyObject,
  toArray,
  toNumber,
  toObject,
  toString,
  traverse,
} from '../src/store'

describe('extend', () => {
  it('mixes properties into target', () => {
    expect(extend({ a: 1 }, { b: 2, c: 3 })).toEqual({ a: 1, b: 2, c: 3 })
    expect(extend<{ a: number }>({ a: 1 }, null as never)).toEqual({ a: 1 })
  })
})

describe('traverse', () => {
  // v2 实际调用方式（picker-column/drop-menu）：数组 childrenKeys 或函数简写
  const tree = [
    { value: 'a', children: [{ value: 'a-1' }, { value: 'a-2' }] },
    { value: 'b' },
  ]

  it('visits leaf nodes with level and index path', () => {
    const visited: Array<[string, number, number[]]> = []
    traverse(tree, ['children'], (node, level, indexs) => {
      visited.push([(node as { value: string }).value, level, indexs])
    })
    expect(visited).toEqual([
      ['a-1', 1, [0, 0]],
      ['a-2', 1, [0, 1]],
    ])
  })

  it('keeps v2 quirk: siblings after a nested branch are skipped (level reset)', () => {
    // v2 walk() 在嵌套分支返回后把 level 重置为 0，
    // 后续无 children 的兄弟节点因 level < childrenKeys.length 被跳过。
    // 此行为是既有组件依赖的事实契约，迁移保持一致。
    const visited: string[] = []
    traverse(tree, ['children'], (node) => {
      visited.push((node as { value: string }).value)
    })
    expect(visited).toEqual(['a-1', 'a-2'])
  })

  it('supports childrenKeys as function shorthand', () => {
    const visited: string[] = []
    traverse(tree, (node) => {
      visited.push((node as { value: string }).value)
    })
    // 无 childrenKeys 时全部按叶子处理
    expect(visited).toEqual(['a', 'b'])
  })

  it('stops walking when callback returns 2', () => {
    const visited: string[] = []
    traverse(
      [
        { value: 'x' },
        { value: 'y' },
      ],
      (node) => {
        visited.push((node as { value: string }).value)
        return 2
      },
    )
    expect(visited).toEqual(['x'])
  })
})

describe('toObject', () => {
  it('merges an array of objects', () => {
    expect(toObject([{ a: 1 }, { b: 2 }, null])).toEqual({ a: 1, b: 2 })
  })
})

describe('toArray', () => {
  it('converts array-like from start offset', () => {
    expect(toArray({ 0: 'a', 1: 'b', 2: 'c', length: 3 })).toEqual(['a', 'b', 'c'])
    expect(toArray({ 0: 'a', 1: 'b', 2: 'c', length: 3 }, 1)).toEqual(['b', 'c'])
  })
})

describe('inArray', () => {
  it('checks membership for arrays', () => {
    expect(inArray([1, 2], 2)).toBe(true)
    expect(inArray([1, 2], 3)).toBe(false)
  })

  it('falls back to strict equality for non-arrays', () => {
    expect(inArray(2, 2)).toBe(true)
    expect(inArray<string | number>('2', 2)).toBe(false)
  })
})

describe('toNumber', () => {
  it('parses numeric strings and keeps others', () => {
    expect(toNumber('123')).toBe(123)
    expect(toNumber('1.5')).toBe(1.5)
    expect(toNumber('abc')).toBe('abc')
  })
})

describe('toString', () => {
  it('serializes values', () => {
    expect(toString(null)).toBe('')
    expect(toString(123)).toBe('123')
    expect(toString({ a: 1 })).toBe('{\n  "a": 1\n}')
  })
})

describe('compareObjects', () => {
  it('compares shallowly via JSON', () => {
    expect(compareObjects({ a: 1 }, { a: 1 })).toBe(true)
    expect(compareObjects({ a: 1 }, { a: 2 })).toBe(false)
    expect(compareObjects(null, {})).toBe(false)
    expect(compareObjects('x', 'x')).toBe(false)
  })
})

describe('isEmptyObject', () => {
  it('detects empty objects', () => {
    expect(isEmptyObject({})).toBe(true)
    expect(isEmptyObject({ a: 1 })).toBe(false)
  })
})

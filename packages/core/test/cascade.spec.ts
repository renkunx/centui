import { describe, expect, it, vi } from 'vitest'
import { cascade } from '../src/picker/cascade'
import type { CascadeNode } from '../src/picker/cascade'

/** v2 级联数据格式：[[第一列节点...]] 包裹数组 */
const data: CascadeNode[][] = [
  [
    {
      value: 'a',
      label: 'A',
      children: [
        { value: 'a1', label: 'A1', children: [] },
        { value: 'a2', label: 'A2', children: [] },
      ],
    },
    { value: 'b', label: 'B', children: [] },
  ],
]

function createMockPicker() {
  const columns: CascadeNode[][] = []
  return {
    columns,
    setColumnValues: vi.fn((level: number, values: CascadeNode[]) => {
      columns[level] = values
    }),
  }
}

describe('cascade', () => {
  it('builds following columns from wrapped data (initial call)', () => {
    const picker = createMockPicker()
    cascade(picker as never, {
      currentLevel: -1,
      maxLevel: 3,
      values: data,
    })
    expect(picker.columns[0]).toBe(data[0])
    expect(picker.columns[1]).toBe(data[0][0].children)
    expect(picker.columns[2]).toEqual([]) // 叶子节点 children 为空
  })

  it('walks by active node on column change', () => {
    const picker = createMockPicker()
    cascade(picker as never, {
      currentLevel: 0,
      maxLevel: 3,
      values: data[0][0], // 联动：当前激活节点
    })
    expect(picker.setColumnValues).toHaveBeenCalledWith(1, data[0][0].children)
    expect(picker.columns[1]).toBe(data[0][0].children)
  })

  it('resolves defaultIndex per level', () => {
    const picker = createMockPicker()
    cascade(picker as never, {
      currentLevel: -1,
      maxLevel: 3,
      values: data,
      defaultIndex: [1],
    })
    expect(picker.columns[0]).toBe(data[0])
    expect(picker.columns[1]).toEqual([]) // b 分支无 children
  })

  it('resolves defaultValue by text/label/value match', () => {
    const picker = createMockPicker()
    cascade(picker as never, {
      currentLevel: -1,
      maxLevel: 3,
      values: data,
      defaultValue: ['B'],
    })
    expect(picker.columns[1]).toEqual([])
  })

  it('falls back to index 0 when default out of range', () => {
    const picker = createMockPicker()
    cascade(picker as never, {
      currentLevel: -1,
      maxLevel: 3,
      values: data,
      defaultIndex: [99],
    })
    expect(picker.columns[1]).toBe(data[0][0].children)
  })

  it('calls back after cascading', () => {
    const picker = createMockPicker()
    const fn = vi.fn()
    cascade(picker as never, { currentLevel: -1, maxLevel: 1, values: data }, fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('warns and returns early (no callback) when picker is missing', () => {
    const fn = vi.fn()
    cascade(undefined as never, { currentLevel: -1, maxLevel: 3, values: data }, fn)
    expect(fn).not.toHaveBeenCalled()
  })

  it('does not leak options between calls (v3 fix for v2 shared-state bug)', () => {
    const picker1 = createMockPicker()
    const picker2 = createMockPicker()
    cascade(picker1 as never, { currentLevel: -1, maxLevel: 2, values: data })
    // 第二次不传 values，不应复用第一次的 data（v2 的 extend 会污染共享默认值）
    cascade(picker2 as never, { currentLevel: -1, maxLevel: 2 })
    expect(picker2.columns[0]).toEqual([])
  })
})

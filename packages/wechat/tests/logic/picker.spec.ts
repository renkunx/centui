/**
 * picker 纯逻辑测试：偏移↔索引换算、默认索引解析、invalid 导航、级联展开、
 * 列视图构建与 setData 节流器，对照 Vue 版 PickerColumn.vue 与 core/picker/cascade。
 */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {
  buildColumnViews,
  cascadeRootOf,
  clampIndex,
  columnHeightOf,
  expandCascade,
  findValidIndex,
  hasValidIndex,
  indexOfOffset,
  isInvalidIndex,
  maskerHeightOf,
  matchItemIndex,
  maxOffsetOf,
  OffsetFlusher,
  offsetOfIndex,
  resolveDefaultIndexs,
  type PickerColumnItem,
} from '../../src/components/picker/logic'

const COL_A: PickerColumnItem[] = [{text: 'a1'}, {text: 'a2'}, {text: 'a3'}, {text: 'a4'}]
const COL_B: PickerColumnItem[] = [{text: 'b1'}, {text: 'b2'}]

describe('picker/logic 几何换算', () => {
  it('maskerHeight/columnHeight 与 PickerColumn style 计算一致（ih + 2*masker）', () => {
    expect(maskerHeightOf(45)).toBe(100)
    expect(columnHeightOf(45)).toBe(245)
  })

  it('maxOffset = (count-1)*ih；单列无滚动', () => {
    expect(maxOffsetOf(4, 45)).toBe(135)
    expect(maxOffsetOf(1, 45)).toBe(0)
    expect(maxOffsetOf(0, 45)).toBe(0)
  })

  it('offset ↔ index 往返（round 语义）', () => {
    expect(indexOfOffset(90, 45)).toBe(2)
    expect(indexOfOffset(70, 45)).toBe(2) // round(1.55) → 2
    expect(offsetOfIndex(3, 45)).toBe(135)
  })
})

describe('picker/logic 默认索引解析', () => {
  it('defaultIndex 优先、defaultValue 按 text/label/value 匹配、兜底 0', () => {
    const cols = [COL_A, COL_B]
    expect(resolveDefaultIndexs(cols, [2], [])).toEqual([2, 0])
    expect(resolveDefaultIndexs(cols, [], ['a3'])).toEqual([2, 0]) // defaultValue 按列匹配
    expect(resolveDefaultIndexs(cols, [], ['a1', 'b2'])).toEqual([0, 1])
    expect(resolveDefaultIndexs(cols, [9], ['x'])).toEqual([3, 0]) // 越界钳位
    expect(resolveDefaultIndexs(cols, [], [])).toEqual([0, 0])
  })

  it('matchItemIndex 命中 value 字段', () => {
    const items = [{text: 'A', value: 10}, {text: 'B', value: 20}]
    expect(matchItemIndex(items, 20)).toBe(1)
    expect(matchItemIndex(items, 'B')).toBe(1)
    expect(matchItemIndex(items, 99)).toBe(0)
  })
})

describe('picker/logic invalid 导航', () => {
  const invalid: Array<number | number[]> = [[1], 0]

  it('isInvalidIndex 支持数组与标量形态', () => {
    expect(isInvalidIndex(invalid, 0, 1)).toBe(true)
    expect(isInvalidIndex(invalid, 1, 0)).toBe(true)
    expect(isInvalidIndex(invalid, 1, 1)).toBe(false)
    expect(isInvalidIndex([], 0, 1)).toBe(false)
  })

  it('hasValidIndex / findValidIndex 方向探测与反向回退', () => {
    const items = [{text: 'a'}, {text: 'b'}, {text: 'c'}, {text: 'd'}]
    const inv: Array<number | number[]> = [[1, 2]]
    expect(hasValidIndex(items, inv, 0)).toBe(true)
    expect(findValidIndex(items, inv, 0, 1, 1)).toBe(3) // 向后探到 3
    expect(findValidIndex(items, inv, 0, 2, -1)).toBe(0) // 向前探到 0
    expect(findValidIndex(items, inv, 0, 1, -1)).toBe(0)
  })

  it('全列 invalid 时返回原值（scrollInZoon 兜底钳位）', () => {
    const items = [{text: 'a'}, {text: 'b'}]
    const inv: Array<number | number[]> = [[0, 1]]
    expect(findValidIndex(items, inv, 0, 1, 1)).toBe(1)
  })
})

describe('picker/logic 级联展开（core/picker cascade 语义）', () => {
  const tree = [
    {text: '浙江', children: [{text: '杭州', children: [{text: '西湖'}]}, {text: '宁波'}]},
    {text: '江苏', children: [{text: '南京'}]},
  ]

  it('初始展开：defaultIndex/defaultValue 逐层解析，越界回 0', () => {
    const res = expandCascade(tree, 3, [], [], [])
    expect(res.columns[0].map((i) => i.text)).toEqual(['浙江', '江苏'])
    expect(res.columns[1].map((i) => i.text)).toEqual(['杭州', '宁波'])
    expect(res.columns[2].map((i) => i.text)).toEqual(['西湖'])
    expect(res.indexs).toEqual([0, 0, 0])

    const byValue = expandCascade(tree, 3, [], [], ['江苏', '南京'])
    expect(byValue.indexs).toEqual([1, 0, 0])
  })

  it('联动展开：picks 优先于默认值；children 缺失补空列', () => {
    const res = expandCascade(tree, 3, [1, 0], [], ['浙江'])
    expect(res.indexs).toEqual([1, 0, 0])
    expect(res.columns[1].map((i) => i.text)).toEqual(['南京'])

    const leaf = expandCascade(tree, 3, [0, 1], [], [])
    expect(leaf.columns[2]).toEqual([]) // 宁波无 children
    expect(leaf.indexs[2]).toBe(0)
  })

  it('cascadeRootOf：包裹数组与裸树均可', () => {
    expect(cascadeRootOf([tree])).toBe(tree)
    expect(cascadeRootOf(tree)).toBe(tree)
  })
})

describe('picker/logic 列视图构建', () => {
  it('activeIndex/offset 落位、invalid 展开为 disabled、no 序号', () => {
    const views = buildColumnViews([COL_A, COL_B], [2, 1], [[1]], 45)
    expect(views[0].activeIndex).toBe(2)
    expect(views[0].offset).toBe(90)
    expect(views[0].items[1].disabled).toBe(true)
    expect(views[0].items[0].disabled).toBe(false)
    expect(views[1].activeIndex).toBe(1)
    expect(views[1].items.map((i) => i.no)).toEqual([0, 1])
  })

  it('空列 activeIndex 钳位 0', () => {
    expect(clampIndex(5, 0)).toBe(0)
    const views = buildColumnViews([[]], [3], [], 45)
    expect(views[0].activeIndex).toBe(0)
    expect(views[0].offset).toBe(0)
  })
})

describe('picker/logic OffsetFlusher（16ms 节流）', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('首批直发，窗口内合并，尾帧补发', () => {
    const apply = vi.fn()
    const flusher = new OffsetFlusher(apply, 16)
    flusher.set('columns[0].offset', 10)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(apply.mock.calls[0][0]).toEqual({'columns[0].offset': 10})

    flusher.set('columns[0].offset', 20)
    flusher.set('columns[1].offset', 5)
    expect(apply).toHaveBeenCalledTimes(1) // 窗口内挂起
    vi.advanceTimersByTime(20)
    expect(apply).toHaveBeenCalledTimes(2)
    expect(apply.mock.calls[1][0]).toEqual({'columns[0].offset': 20, 'columns[1].offset': 5})
  })

  it('clear 丢弃挂起补发', () => {
    const apply = vi.fn()
    const flusher = new OffsetFlusher(apply, 16)
    flusher.set('k', 1)
    expect(apply).toHaveBeenCalledTimes(1)
    flusher.set('k', 2)
    flusher.clear()
    vi.advanceTimersByTime(50)
    expect(apply).toHaveBeenCalledTimes(1)
  })
})

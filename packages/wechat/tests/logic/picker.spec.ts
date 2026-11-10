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

// ---------------------------------------------------------------------------
// picker 组件实例（index.ts）：observers / lifetimes / 触摸内核 / popup 桥接 / 公开 API
// ---------------------------------------------------------------------------
import {beforeEach as beforeAll2, afterEach as afterAll2} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const compPicker = await loadComponent(() => import('../../src/components/picker/index'))

type PickerInst = Mounted & {__picker: {
  activeIndexs: number[]
  snapshotIndexs: number[] | null
  scrolling: boolean[]
  dragDirection: number[]
  tickers: Array<{scrollTo(target: number, animated?: boolean): void} | undefined>
  columnItems: unknown[][]
  initialed: boolean
  resolved: boolean
}}

beforeAll2(() => vi.useFakeTimers())
afterAll2(() => vi.useRealTimers())

const TREE = [
  {text: '浙江', children: [{text: '杭州', children: [{text: '西湖'}]}, {text: '宁波'}]},
  {text: '江苏', children: [{text: '南京'}]},
]

function touchEvt(column: number, touches?: Array<{pageX: number; pageY: number}>) {
  return {currentTarget: {dataset: {column}}, touches} as never
}

function stateOf(inst: Mounted): PickerInst['__picker'] {
  return (inst as unknown as PickerInst).__picker
}

/** 推进足够时间让动量/回弹/吸附全部落定 */
function settle(ms = 4000) {
  vi.advanceTimersByTime(ms)
}

describe('picker attached 构建', () => {
  it('attached：非级联双列构建、initialed 一次、默认按钮文案、默认选中', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A, COL_B]}})
    inst.attached()
    expect(inst.data.actualOkText).toBe('确认')
    expect(inst.data.actualCancelText).toBe('取消')
    expect(inst.data.maskerHeight).toBe(100)
    expect(inst.data.columnHeight).toBe(245)
    expect(inst.eventsOf('initialed')).toHaveLength(1)
    const columns = inst.data.columns as Array<{no: number; activeIndex: number; offset: number; items: unknown[]}>
    expect(columns).toHaveLength(2)
    expect(columns[0].no).toBe(0)
    expect(columns[0].activeIndex).toBe(0)
    expect(columns[0].offset).toBe(0)
    expect(stateOf(inst).resolved).toBe(true)
    expect(inst.methods.getColumnValues.call(inst)).toEqual([COL_A[0], COL_B[0]])
  })

  it('attached：defaultIndex 解析与 ticker 初始落位', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A, COL_B], defaultIndex: [3, 1]}})
    inst.attached()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([3, 1])
    expect(inst.methods.getColumnValue.call(inst, 1)).toEqual(COL_B[1])
    expect(inst.methods.getColumnIndex.call(inst, 1)).toBe(1)
    expect(inst.methods.getColumnIndex.call(inst)).toBe(3) // 缺省第 0 列
  })

  it('attached：okText/cancelText 自定义与 lineHeight 非正回退 45', () => {
    const inst = mountDef(compPicker.def, {
      props: {data: [COL_A], okText: 'OK', cancelText: 'CLOSE', lineHeight: 0},
    })
    inst.attached()
    expect(inst.data.actualOkText).toBe('OK')
    expect(inst.data.actualCancelText).toBe('CLOSE')
    expect(inst.data.maskerHeight).toBe(100)
    expect(inst.data.columnHeight).toBe(245)
  })

  it('空数据：单空列、resolved 不置位、initialed 不派发；后续补数据触发', () => {
    const inst = mountDef(compPicker.def)
    inst.attached()
    expect(inst.eventsOf('initialed')).toHaveLength(0)
    expect(inst.data.columns).toHaveLength(1)
    // onPopupBeforeShow 兜底：未 initialed 时重建（仍空）
    inst.methods.onPopupBeforeShow.call(inst)
    expect(inst.eventsOf('initialed')).toHaveLength(0)
    inst.setData({data: [COL_A]}) // initialed=false → defaults 重建
    expect(inst.eventsOf('initialed')).toHaveLength(1)
  })

  it('data observer：initialed 后非级联换数据保留选中（preserve 钳位）', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A], defaultIndex: [2]}})
    inst.attached()
    inst.setData({data: [COL_B]}) // preserve：activeIndexs 2 → 钳位 1
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([1])
    expect(inst.eventsOf('initialed')).toHaveLength(1) // 不重复派发
  })

  it('data observer：级联模式全量 defaults 重建', () => {
    const inst = mountDef(compPicker.def, {props: {isCascade: true, cols: 3, data: TREE}})
    inst.attached()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0, 0, 0])
    inst.setData({data: [TREE]}) // 包裹形态（cascadeRootOf 剥一层）
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0, 0, 0])
    const columns = inst.data.columns as Array<{items: Array<{text: string}>}>
    expect(columns[1].items.map((i) => i.text)).toEqual(['杭州', '宁波'])
  })

  it('cols/defaultIndex/defaultValue observer：仅级联响应；非级联跳过', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A], defaultIndex: [2]}})
    inst.attached()
    inst.setData({defaultIndex: [0]}) // 非级联 → 不重建
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([2])

    const cascade = mountDef(compPicker.def, {props: {isCascade: true, cols: 3, data: TREE}})
    cascade.attached()
    cascade.setData({defaultIndex: [1, 0]})
    expect(cascade.methods.getColumnIndexs.call(cascade)).toEqual([1, 0, 0])
    cascade.setData({defaultValue: ['江苏', '南京']})
    expect(cascade.methods.getColumnIndexs.call(cascade)).toEqual([1, 0, 0])
    cascade.setData({cols: 2})
    expect(cascade.methods.getColumnIndexs.call(cascade)).toEqual([1, 0])
  })

  it('isCascade observer：切换为级联重建 defaults', () => {
    const inst = mountDef(compPicker.def, {props: {data: [TREE]}})
    inst.attached()
    inst.setData({isCascade: true, cols: 2})
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0, 0])
  })

  it('okText/cancelText observer：非空覆盖、空串回退默认', () => {
    const inst = mountDef(compPicker.def)
    inst.attached()
    inst.setData({okText: '好的'})
    expect(inst.data.actualOkText).toBe('好的')
    inst.setData({okText: ''})
    expect(inst.data.actualOkText).toBe('确认')
    inst.setData({cancelText: '不'})
    expect(inst.data.actualCancelText).toBe('不')
    inst.setData({cancelText: ''})
    expect(inst.data.actualCancelText).toBe('取消')
  })

  it('lineHeight observer：新几何 + initialed 后 preserve 重落位；非正回退 45', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A], defaultIndex: [1]}})
    inst.attached()
    inst.setData({lineHeight: 60})
    expect(inst.data.maskerHeight).toBe(130)
    expect(inst.data.columnHeight).toBe(60 + 130 * 2)
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([1]) // preserve
    inst.setData({lineHeight: 0})
    expect(inst.data.maskerHeight).toBe(100)
  })
})

describe('picker relations（popup 反向通道）', () => {
  it('linked：largeRadius 回写 popup；unlinked 置空', () => {
    const radii: boolean[] = []
    const popup = {setLargeRadius: (v: boolean) => radii.push(v)}
    const inst = mountDef(compPicker.def, {props: {largeRadius: true}})
    inst.linkRelation('../popup/index', popup)
    expect(radii).toEqual([true])
    expect((inst as unknown as {__popup: unknown}).__popup).toBe(popup)

    const rel = compPicker.def.relations!['../popup/index']
    rel.unlinked!.call(inst, popup as never)
    expect((inst as unknown as {__popup: unknown}).__popup).toBe(null)
    expect(radii).toEqual([true])

    const inst2 = mountDef(compPicker.def)
    inst2.linkRelation('../popup/index', popup)
    expect(radii).toEqual([true, false]) // 无 largeRadius → false
  })
})

describe('picker __touchRatio', () => {
  const inst = () => {
    const i = mountDef(compPicker.def, {props: {data: [COL_A]}})
    i.attached()
    return i
  }

  it('getWindowInfo 正常：750 / windowWidth', () => {
    expect(inst().methods.__touchRatio.call(inst())).toBe(2) // 750 / 375
  })

  it('windowWidth 非正：回退 375', () => {
    const g = globalThis as unknown as {wx: {getWindowInfo?: () => unknown}}
    const prev = g.wx.getWindowInfo
    g.wx.getWindowInfo = () => ({windowWidth: 0})
    try {
      expect(inst().methods.__touchRatio.call(inst())).toBe(2)
    } finally {
      g.wx.getWindowInfo = prev
    }
  })

  it('getWindowInfo 抛错：catch 回退 375（getSystemInfoSync 缺失）', () => {
    const g = globalThis as unknown as {wx: {getWindowInfo?: () => unknown}}
    const prev = g.wx.getWindowInfo
    g.wx.getWindowInfo = () => {
      throw new Error('boom')
    }
    try {
      expect(inst().methods.__touchRatio.call(inst())).toBe(2)
    } finally {
      g.wx.getWindowInfo = prev
    }
  })
})

describe('picker 列触摸与滚动内核', () => {
  it('拖拽（向下）到列尾：方向记录、动量回弹、change 落最大索引', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.methods.onColumnTouchStart.call(inst, touchEvt(0, [{pageX: 0, pageY: 0}]))
    inst.methods.onColumnTouchMove.call(inst, touchEvt(0, [{pageX: 0, pageY: -22.5}])) // 2x 空间 -45 → offset 45
    expect(stateOf(inst).dragDirection[0]).toBe(1)
    inst.methods.onColumnTouchEnd.call(inst, touchEvt(0))
    settle()
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {columnIndex: 0, itemIndex: 3, value: COL_A[3]}},
    ])
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([3])
  })

  it('拖拽（向上）回列首：负方向记录、回弹到 0', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.methods.setValue.call(inst, [3])
    settle()
    inst.events.length = 0
    inst.methods.onColumnTouchStart.call(inst, touchEvt(0, [{pageX: 0, pageY: 0}]))
    inst.methods.onColumnTouchMove.call(inst, touchEvt(0, [{pageX: 0, pageY: -22.5}])) // 先向下 → 方向 1、lastOffsets=45
    inst.methods.onColumnTouchMove.call(inst, touchEvt(0, [{pageX: 0, pageY: 22.5}])) // 再向上 → offset 回 0，方向 -1
    expect(stateOf(inst).dragDirection[0]).toBe(-1)
    inst.methods.onColumnTouchEnd.call(inst, touchEvt(0))
    settle()
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {columnIndex: 0, itemIndex: 0, value: COL_A[0]}},
    ])
  })

  it('触摸守卫：无 ticker / 无 touches / 空 touches 静默', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    expect(() => {
      inst.methods.onColumnTouchStart.call(inst, touchEvt(9, [{pageX: 0, pageY: 0}]))
      inst.methods.onColumnTouchMove.call(inst, touchEvt(9, [{pageX: 0, pageY: 0}]))
      inst.methods.onColumnTouchEnd.call(inst, touchEvt(9))
      inst.methods.onColumnTouchStart.call(inst, touchEvt(0, undefined))
      inst.methods.onColumnTouchStart.call(inst, touchEvt(0, []))
      inst.methods.onColumnTouchMove.call(inst, touchEvt(0, []))
    }).not.toThrow()
  })

  it('停止吸附：同索引小偏移（≤0.01）不重滚；偏差大则吸附滚动', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.methods.setValue.call(inst, [2])
    settle()
    const ticker = stateOf(inst).tickers[0]!
    // 同索引 + 偏差 ≤ 0.01：不触发二次滚动
    ticker.scrollTo(90.005, false)
    expect(inst.eventsOf('change')).toHaveLength(1) // 仅 setValue 的一次
    // 同索引 + 偏差 > 0.01：吸附回 90
    ticker.scrollTo(80, false)
    settle()
    expect(inst.eventsOf('change')).toHaveLength(1)
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([2])
  })

  it('invalidIndex：停止在禁用项按方向寻找有效项（正/负方向两路）', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A], invalidIndex: [[1, 2]]}})
    inst.attached()
    const ticker = stateOf(inst).tickers[0]!
    ticker.scrollTo(90, false) // 落在 index 2（invalid）→ 方向 1 → 3
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([3])
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {columnIndex: 0, itemIndex: 3, value: COL_A[3]}},
    ])

    inst.methods.setValue.call(inst, [3])
    settle()
    stateOf(inst).dragDirection[0] = -1
    inst.events.length = 0
    ticker.scrollTo(90, false) // invalid → 方向 -1 → 0
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0])
  })

  it('全列 invalid：挂载与停稳均不触发同位 scrollTo 递归（栈溢出回归）', () => {
    // invalidIndex 覆盖全部条目时 findValidIndex 原值返回，同位 scrollTo 会再次
    // 触发 onStop → __onColumnStop 无限递归（RangeError）；正确语义 = 同位跳过修正
    const inst = mountDef(compPicker.def, {props: {data: [COL_A], invalidIndex: [[0, 1, 2, 3]]}})
    expect(() => inst.attached()).not.toThrow()
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0])
    // 停稳路径同样不崩：拖到任意位置松手，修正目标即当前位置
    const ticker = stateOf(inst).tickers[0]!
    expect(() => {
      ticker.scrollTo(90, false)
      settle()
    }).not.toThrow()
  })
})

describe('picker setValue / setColumnValues / refresh', () => {
  it('setValue：变更派发 change、越界钳位、同值不派发、空列跳过、NaN 兜底', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.methods.setValue.call(inst, [2])
    settle()
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {columnIndex: 0, itemIndex: 2, value: COL_A[2]}},
    ])
    inst.methods.setValue.call(inst, [2]) // 同值 → 不派发
    expect(inst.eventsOf('change')).toHaveLength(1)
    inst.methods.setValue.call(inst, [9]) // 越界钳位 3
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([3])
    inst.methods.setValue.call(inst, [0, 5]) // 第 1 列不存在 → 跳过
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0])
    inst.methods.setValue.call(inst, [Number.NaN]) // Math.floor(NaN) || 0 → 0
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0])
    expect(inst.methods.getValue.call(inst)).toEqual([COL_A[0]])
  })

  it('setColumnValues：非法入参静默（undefined / 负索引 / 非数组）', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    expect(() => {
      inst.methods.setColumnValues.call(inst, undefined, COL_B)
      inst.methods.setColumnValues.call(inst, -1, COL_B)
      inst.methods.setColumnValues.call(inst, 0, 'x' as never)
    }).not.toThrow()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0])
  })

  it('setColumnValues：keepIndex=false 选中归 0，列视图与 ticker 重建', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.methods.setValue.call(inst, [2])
    settle()
    inst.methods.setColumnValues.call(inst, 0, COL_B)
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0])
    // indexed setData 键（columns[0]）在 mountDef 平铺存储；columnItems 为真源
    expect(stateOf(inst).columnItems[0]).toEqual(COL_B)
    const patched = inst.data['columns[0]'] as {items: Array<{text: string}>}
    expect(patched.items.map((i) => i.text)).toEqual(['b1', 'b2'])
  })

  it('setColumnValues：keepIndex=true 保留索引并钳位', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A], keepIndex: true}})
    inst.attached()
    inst.methods.setValue.call(inst, [3])
    settle()
    inst.methods.setColumnValues.call(inst, 0, [{text: 'x1'}, {text: 'x2'}])
    settle()
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([1]) // clamp 3 → 1
  })

  it('refresh：未显示且非 view 跳过重建；pickerShow/isView 时重建；callback 必调', () => {
    const inst = mountDef(compPicker.def) // 空数据
    inst.attached()
    const cb1 = vi.fn()
    inst.methods.refresh.call(inst, cb1)
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(inst.eventsOf('initialed')).toHaveLength(0) // 未重建

    inst.setData({show: true}) // pickerShow=true
    const cb2 = vi.fn()
    inst.methods.refresh.call(inst, cb2)
    expect(cb2).toHaveBeenCalledTimes(1)
    expect(inst.eventsOf('initialed')).toHaveLength(0) // 数据仍空

    inst.setData({data: [COL_A], show: false})
    inst.setData({show: true})
    inst.methods.refresh.call(inst) // 无 callback 分支
    expect(inst.eventsOf('initialed')).toHaveLength(1)

    const view = mountDef(compPicker.def, {props: {isView: true, data: [COL_A], defaultIndex: [1]}})
    view.attached()
    view.methods.refresh.call(view, undefined, 1) // startIndex → preserve
    expect(view.methods.getColumnIndexs.call(view)).toEqual([1])
    expect(view.eventsOf('initialed')).toHaveLength(1)
  })
})

describe('picker confirm/cancel 与 popup 桥接', () => {
  it('onPickerConfirm：滚动中忽略（scrolling 守卫）；静止时关闭 + confirm 载荷', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A, COL_B], defaultIndex: [1, 1]}})
    inst.attached()
    inst.setData({show: true})
    inst.events.length = 0 // attached 的 initialed 不参与断言
    stateOf(inst).scrolling[0] = true
    inst.methods.onPickerConfirm.call(inst)
    expect(inst.events).toEqual([])
    expect(inst.data.pickerShow).toBe(true)

    stateOf(inst).scrolling[0] = false
    inst.methods.onPickerConfirm.call(inst)
    expect(inst.data.pickerShow).toBe(false)
    expect(inst.eventsOf('confirm')).toEqual([
      {name: 'confirm', detail: {values: [COL_A[1], COL_B[1]]}},
    ])
  })

  it('onPickerCancel：pickerShow 收起 + cancel；非级联定时器到期无恢复动作', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.methods.onPickerCancel.call(inst) // pickerShow=false 分支
    expect(inst.eventsOf('cancel')).toHaveLength(1)
    inst.setData({show: true})
    inst.methods.onPickerCancel.call(inst)
    expect(inst.data.pickerShow).toBe(false)
    settle(200)
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0])
  })

  it('级联取消：按 100ms 快照恢复（snapshot 模式）', () => {
    const inst = mountDef(compPicker.def, {props: {isCascade: true, cols: 3, data: TREE}})
    inst.attached()
    inst.setData({show: true}) // 首开：不快照
    vi.advanceTimersByTime(100)
    inst.setData({show: false})
    inst.setData({show: true}) // 二次打开：100ms 后快照
    vi.advanceTimersByTime(100)
    expect(stateOf(inst).snapshotIndexs).toEqual([0, 0, 0])

    inst.methods.setValue.call(inst, [1]) // 选到江苏
    settle()
    inst.events.length = 0
    inst.methods.onPickerCancel.call(inst)
    settle(200)
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0, 0, 0]) // 快照恢复
  })

  it('级联取消：无快照时回 defaults（snapshotIndexs null 分支）', () => {
    const inst = mountDef(compPicker.def, {props: {isCascade: true, cols: 3, data: TREE}})
    inst.attached()
    inst.methods.setValue.call(inst, [1])
    settle()
    inst.methods.onPickerCancel.call(inst)
    settle(200)
    expect(inst.methods.getColumnIndexs.call(inst)).toEqual([0, 0, 0])
  })

  it('show observer：pickerShow 同步与快照定时器；detached 清理', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.setData({show: true})
    expect(inst.data.pickerShow).toBe(true)
    inst.setData({show: false})
    expect(inst.data.pickerShow).toBe(false)
    inst.setData({show: true})
    expect(vi.getTimerCount()).toBe(1) // 快照定时器挂起
    inst.detached()
    expect(vi.getTimerCount()).toBe(0)
    settle(300)
    expect(stateOf(inst).snapshotIndexs).toBe(null) // 清理后不快照
  })

  it('onPopupChange：value=false 关闭 + change；true/无 detail 忽略', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.setData({show: true})
    inst.events.length = 0 // attached 的 initialed 不参与断言
    inst.methods.onPopupChange.call(inst, {detail: {value: true}} as never)
    expect(inst.data.pickerShow).toBe(true)
    expect(inst.events).toEqual([])
    inst.methods.onPopupChange.call(inst, {} as never)
    expect(inst.events).toEqual([])
    inst.methods.onPopupChange.call(inst, {detail: {value: false}} as never)
    expect(inst.data.pickerShow).toBe(false)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])
  })

  it('onPopupShow/onPopupHide/onPopupMaskClick 事件桥接', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    inst.methods.onPopupShow.call(inst)
    inst.methods.onPopupHide.call(inst)
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)
    inst.setData({show: true})
    inst.methods.onPopupMaskClick.call(inst) // → onPickerCancel
    expect(inst.eventsOf('cancel')).toHaveLength(1)
    expect(inst.data.pickerShow).toBe(false)
  })
})

describe('picker detached 清理', () => {
  it('detached：ticker destroy、flusher 挂起补发丢弃、定时器清空', () => {
    const inst = mountDef(compPicker.def, {props: {data: [COL_A]}})
    inst.attached()
    // 两次快速 touchmove（不推进时间）制造 flusher 挂起帧
    inst.methods.onColumnTouchStart.call(inst, touchEvt(0, [{pageX: 0, pageY: 0}]))
    inst.methods.onColumnTouchMove.call(inst, touchEvt(0, [{pageX: 0, pageY: -22.5}]))
    inst.methods.onColumnTouchMove.call(inst, touchEvt(0, [{pageX: 0, pageY: -45}]))
    inst.detached()
    const count = inst.events.length
    settle(4000)
    expect(inst.events.length).toBe(count) // 无后续 change（ticker 已销毁、定时器清空）
  })
})

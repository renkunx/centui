/**
 * swiper 纯逻辑测试：几何（loop 渲染项数）、索引换算（display↔real）、
 * loop 拷贝偏移、翻页判定与角度门控、fade 邻项。
 * 对照 Vue 版 Swiper.vue 的 initState/calcDisplayIndex/doTransition/doOnTouchEnd。
 */
import {describe, it, expect} from 'vitest'
import {
  calcDisplayIndex,
  calcRealIndex,
  copyOffsets,
  fadeNeighbor,
  geometryOf,
  initialRealIndex,
  isPageScrolling,
  nextIndex,
  pagingTowards,
  PAGING_DURATION,
  PAGING_SCALE,
} from '../../src/components/swiper/logic'

describe('swiper/logic 几何', () => {
  it('loop+slide 渲染项数 +2；fade/slideY 不加', () => {
    expect(geometryOf(3, 'slide', true, 375).rItemCount).toBe(5)
    expect(geometryOf(3, 'fade', true, 375).rItemCount).toBe(3)
    expect(geometryOf(3, 'slideY', true, 375).rItemCount).toBe(5)
    expect(geometryOf(1, 'slide', true, 375).rItemCount).toBe(1) // 单项不拷贝
  })

  it('isSlide/isVertical 判定', () => {
    expect(geometryOf(3, 'slide', true, 100).isSlide).toBe(true)
    expect(geometryOf(3, 'slideY', true, 100).isVertical).toBe(true)
    expect(geometryOf(3, 'fade', true, 100).isSlide).toBe(false)
  })

  it('initState 初始 realIndex：startIndex 优先，defaultIndex 钳位', () => {
    expect(initialRealIndex(undefined, 2, 3)).toBe(2)
    expect(initialRealIndex(undefined, 9, 3)).toBe(0)
    expect(initialRealIndex(undefined, -1, 3)).toBe(0)
    expect(initialRealIndex(1, 2, 3)).toBe(1)
  })
})

describe('swiper/logic 索引换算', () => {
  it('display ↔ real（loop+slide 相差 1，含回绕）', () => {
    expect(calcDisplayIndex(1, true, true, 3)).toBe(0)
    expect(calcDisplayIndex(4, true, true, 3)).toBe(0) // c1 位（real=rItemCount-1）→ 首项
    expect(calcDisplayIndex(0, true, true, 3)).toBe(2) // c3 位 → 末项
    expect(calcDisplayIndex(5, true, true, 3)).toBe(0) // 超界回 0
    expect(calcDisplayIndex(2, false, true, 3)).toBe(2) // 非 loop 不偏移

    expect(calcRealIndex(0, true, true, 3)).toBe(1)
    expect(calcRealIndex(2, true, true, 3)).toBe(3)
    expect(calcRealIndex(9, true, true, 3)).toBe(3) // 钳位后 +1
    expect(calcRealIndex(2, false, false, 3)).toBe(2)
  })
})

describe('swiper/logic loop 拷贝偏移', () => {
  it('首项拷贝在尾部（count*dim）、末项拷贝在头部（-count*dim）', () => {
    expect(copyOffsets(3, 100)).toEqual({first: 300, last: -300})
    expect(copyOffsets(2, 50)).toEqual({first: 100, last: -100})
  })

  it('单项不拷贝', () => {
    expect(copyOffsets(1, 100)).toBeNull()
  })
})

describe('swiper/logic 翻页目标（doTransition 分支）', () => {
  it('slide 非 loop：0..count-1 往返', () => {
    // rItemCount=3（无拷贝）
    expect(nextIndex(1, 3, 'next', true, false)).toBe(2)
    expect(nextIndex(2, 3, 'next', true, false)).toBe(2) // 尾部停住
    expect(nextIndex(0, 3, 'prev', true, false)).toBe(0)
  })

  it('slide loop：尾→1（c1 拷贝位）、首→count（c3 拷贝位）', () => {
    // rItemCount=5（loop +2），real 空间 1..3
    expect(nextIndex(3, 5, 'next', true, true)).toBe(4) // → c1
    expect(nextIndex(1, 5, 'prev', true, true)).toBe(0) // → c3
  })

  it('fade：0 ↔ count-1 回绕', () => {
    expect(nextIndex(2, 3, 'next', false, false)).toBe(0)
    expect(nextIndex(0, 3, 'prev', false, false)).toBe(2)
  })
})

describe('swiper/logic 翻页判定（doOnTouchEnd）', () => {
  it('过半翻页；非 loop 边界不翻', () => {
    expect(pagingTowards(-60, 100, 500, 1, 5, true)).toBe('next')
    expect(pagingTowards(60, 100, 500, 1, 5, true)).toBe('prev')
    expect(pagingTowards(-49, 100, 500, 1, 5, true)).toBeNull() // 未过 0.5 且非快速拖
    expect(pagingTowards(-60, 100, 500, 1, 5, false)).toBe('next')
    expect(pagingTowards(60, 100, 500, 0, 5, false)).toBeNull() // 非 loop 首 prev
    expect(pagingTowards(-60, 100, 500, 4, 5, false)).toBeNull() // 非 loop 尾 next
  })

  it('快速拖拽（<PAGING_DURATION）必翻页', () => {
    expect(PAGING_DURATION).toBe(300)
    expect(pagingTowards(-5, 100, 200, 1, 5, true)).toBe('next')
    expect(pagingTowards(5, 100, 200, 1, 5, true)).toBe('prev')
  })

  it('PAGING_SCALE = 0.5', () => {
    expect(PAGING_SCALE).toBe(0.5)
  })
})

describe('swiper/logic 角度门控（isScroll）', () => {
  it('横滑轮播：纵向主导判定为页面滚动；5px 内不定', () => {
    expect(isPageScrolling(50, 5, false, 45)).toBe(false)
    expect(isPageScrolling(5, 50, false, 45)).toBe(true)
    expect(isPageScrolling(3, 3, false, 45)).toBe(false)
  })

  it('纵向轮播（slideY）：横向主导判定为页面滚动', () => {
    expect(isPageScrolling(5, 50, true, 45)).toBe(false)
    expect(isPageScrolling(50, 5, true, 45)).toBe(true)
  })
})

describe('swiper/logic fade 邻项', () => {
  it('正偏移（prev 方向）取前一项，首项回绕末项；反之亦然', () => {
    expect(fadeNeighbor(2, 3, 0.5)).toBe(1)
    expect(fadeNeighbor(0, 3, 0.5)).toBe(2)
    expect(fadeNeighbor(1, 3, -0.5)).toBe(2)
    expect(fadeNeighbor(2, 3, -0.5)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// swiper 组件实例（index.ts）：attached/ready 几何、__reInitItems、四段过渡、
// 自动播放、触摸手势（slide/slideY/fade）、loop 回绕、goto/stop、detached 清理
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/swiper/index'))
const compItem = await loadComponent(() => import('../../src/components/swiper-item/index'))

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

interface SwiperState {
  items: Mounted[]
  oItemCount: number
  rItemCount: number
  dimension: number
  isSlide: boolean
  isVertical: boolean
  firstIndex: number
  lastIndex: number
  index: number
  fromIndex: number
  toIndex: number
  offset: number
  dragging: boolean
  userScrolling: boolean | null
  isStoped: boolean
  ready: boolean
  duration: number
}

function stateOf(inst: Mounted): SwiperState {
  return (inst as unknown as {__swiper: SwiperState}).__swiper
}

function makeItem() {
  return mountDef(compItem.def)
}

function touchEvt(x: number, y = 0) {
  return {changedTouches: [{pageX: x, pageY: y}]} as never
}

/** 标准挂载：attached → 登记 items → ready（量取 + 首次定位 + 播放） */
function mountSwiper(props: Record<string, unknown> = {}, items: Mounted[] = [], rects: Record<string, unknown> | undefined = {'.cu-swiper': {width: 375, height: 200}}) {
  const inst = mountDef(comp.def, {props, rects: rects as never})
  inst.attached()
  for (const it of items) inst.linkRelation('../swiper-item/index', it)
  inst.ready()
  return inst
}

d2('swiper attached 与 ready 几何', () => {
  i2('attached：slide/slideY/fade 三种过渡派生', () => {
    const d = mountDef(comp.def)
    d.attached()
    e2(d.data.axis).toBe('x')
    e2(d.data.isFade).toBe(false)
    const v = mountDef(comp.def, {props: {transition: 'slideY'}})
    v.attached()
    e2(v.data.isVertical).toBe(true)
    // slideY → axis 'y'（isVertical 先写再派生 axis，纵向轮播按 translateY 位移）
    e2(v.data.axis).toBe('y')
    const f = mountDef(comp.def, {props: {transition: 'fade'}})
    f.attached()
    e2(f.data.isFade).toBe(true)
    e2(f.data.isVertical).toBe(false)
    e2(f.data.axis).toBe('x')
  })

  i2('ready（3 items loop slide）：先量后定位，loop 拷贝下发 + translate -375', () => {
    const items = [makeItem(), makeItem(), makeItem()]
    const inst = mountSwiper({}, items)
    e2(stateOf(inst).ready).toBe(true)
    e2(stateOf(inst).dimension).toBe(375)
    e2(stateOf(inst).oItemCount).toBe(3)
    e2(stateOf(inst).rItemCount).toBe(5) // loop +2 拷贝
    e2(stateOf(inst).index).toBe(1) // realIndex 前移一位
    e2(stateOf(inst).firstIndex).toBe(1)
    e2(stateOf(inst).lastIndex).toBe(3)
    e2(inst.data.translate).toBe(-375)
    e2(inst.data.indicatorCount).toBe(3)
    e2(inst.data.currentIndex).toBe(0)
    e2(inst.data.isInitial).toBe(true)
    // 尺寸与拷贝定位
    e2(items[0].data.boxStyle).toBe('width: 375px;')
    e2(items[0].data.copyStyle).toContain('left: 1125px;') // 首项尾拷贝
    e2(items[1].data.copyStyle).toBe('') // 中间项无拷贝
    e2(items[2].data.copyStyle).toContain('left: -1125px;') // 末项头拷贝
  })

  i2('defaultIndex 起始位', () => {
    const items = [makeItem(), makeItem(), makeItem()]
    const inst = mountSwiper({defaultIndex: 2}, items)
    e2(stateOf(inst).index).toBe(3) // 2 + 1（loop 占位）
    e2(inst.data.currentIndex).toBe(2)
    e2(inst.data.translate).toBe(-1125)
  })

  i2('非 loop：无拷贝', () => {
    const items = [makeItem(), makeItem(), makeItem()]
    const inst = mountSwiper({isLoop: false}, items)
    e2(stateOf(inst).rItemCount).toBe(3)
    e2(stateOf(inst).index).toBe(0)
    e2(items[0].data.copyStyle).toBe('')
  })

  i2('slideY：dimension 取高度', () => {
    const items = [makeItem(), makeItem(), makeItem()]
    const inst = mountSwiper({transition: 'slideY'}, items)
    e2(stateOf(inst).dimension).toBe(200)
    e2(items[0].data.boxStyle).toBe('height: 200px;')
    e2(inst.data.translate).toBe(-200)
  })

  i2('fade：初始化 opacity（toIndex 亮、其余暗）', () => {
    const items = [makeItem(), makeItem(), makeItem()]
    const inst = mountSwiper({transition: 'fade'}, items)
    e2(stateOf(inst).isSlide).toBe(false)
    e2(items[0].data.fadeStyle).toBe('opacity: 1;')
    e2(items[1].data.fadeStyle).toBe('opacity: 0;')
    e2(inst.data.translate).toBe(0) // 不位移
  })

  i2('空 items：reInit 早退；无尺寸：drag 早退', () => {
    const inst = mountSwiper()
    e2(stateOf(inst).oItemCount).toBe(0)
    e2(inst.data.isInitial).toBe(false)
    e2(() => inst.methods.onDragStart.call(inst, touchEvt(0))).not.toThrow()

    const noRect = mountDef(comp.def, {rects: {'.cu-swiper': null}})
    noRect.attached()
    noRect.ready() // rect null → 不初始化
    e2(stateOf(noRect).ready).toBe(true)
    e2(stateOf(noRect).dimension).toBe(0)
  })

  i2('relations：linked 登记 + 防抖重建；unlinked 移除；ready 前登记不触发', () => {
    const a = makeItem()
    const inst = mountDef(comp.def)
    inst.attached()
    inst.linkRelation('../swiper-item/index', a) // !ready → 早退
    e2(stateOf(inst).items).toHaveLength(1)
    e2(vi.getTimerCount()).toBe(0)

    inst.ready()
    const b = makeItem()
    inst.linkRelation('../swiper-item/index', b) // 防抖 50ms
    e2(vi.getTimerCount()).toBe(1)
    inst.linkRelation('../swiper-item/index', makeItem()) // 挂起中不再排程
    e2(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(50)
    e2(inst.data.indicatorCount).toBe(3)

    const rel = comp.def.relations!['../swiper-item/index']
    rel.unlinked!.call(inst, stateOf(inst).items[0] as never)
    vi.advanceTimersByTime(50)
    e2(inst.data.indicatorCount).toBe(2)
  })

  i2('无 setDimensions/setCopy 的 item（防御）', () => {
    const bare = {data: {}} as never
    const inst = mountDef(comp.def, {rects: {'.cu-swiper': {width: 100}} as never})
    inst.attached()
    inst.linkRelation('../swiper-item/index', bare)
    inst.ready()
    e2(inst.data.indicatorCount).toBe(1)
  })
})

d2('swiper 四段过渡（slide）', () => {
  i2('next()：beforeChange 即时 → 10ms 启动补间 → 250ms afterChange + translate', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.next()
    e2(inst.eventsOf('beforeChange')).toEqual([{name: 'beforeChange', detail: {fromIndex: 0, toIndex: 1}}])
    e2(inst.data.currentIndex).toBe(1) // 指示器即时回收
    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(300) // 250ms 补间 + flusher 尾帧窗口
    e2(inst.eventsOf('afterChange')).toEqual([{name: 'afterChange', detail: {fromIndex: 0, toIndex: 1}}])
    e2(inst.data.translate).toBe(-750)
  })

  i2('prev()：回退 + translate 回落', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.next()
    await vi.advanceTimersByTimeAsync(300)
    inst.events.length = 0
    inst.prev()
    e2(inst.eventsOf('beforeChange')).toEqual([{name: 'beforeChange', detail: {fromIndex: 1, toIndex: 0}}])
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.translate).toBe(-375)
  })

  i2('loop 尾→首：c1 拷贝位动画后瞬时回跳（translate -375、指示器 0）', async () => {
    const inst = mountSwiper({defaultIndex: 2}, [makeItem(), makeItem(), makeItem()])
    inst.next() // display 2 → c1 拷贝位（real 4）
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 2, toIndex: 0})
    e2(inst.data.currentIndex).toBe(0)
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.eventsOf('afterChange')[0].detail).toEqual({fromIndex: 2, toIndex: 0})
    e2(inst.data.translate).toBe(-375) // wasLast → 回跳 firstIndex*dim
  })

  i2('loop 首→尾：prev 回绕 c3 拷贝位（translate -1125）', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.prev() // display 0 → c3 拷贝位（real 0）
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 0, toIndex: 2})
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.translate).toBe(-1125) // wasFirst → 回跳 lastIndex*dim
    e2(inst.data.currentIndex).toBe(2)
  })

  i2('非 loop 边界：尾停/首停', () => {
    const inst = mountSwiper({isLoop: false, defaultIndex: 2}, [makeItem(), makeItem(), makeItem()])
    inst.next()
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 2, toIndex: 2})
    const inst2 = mountSwiper({isLoop: false}, [makeItem(), makeItem(), makeItem()])
    inst2.prev()
    e2(inst2.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 0, toIndex: 0})
  })

  i2('防御：0 项 / 单项（无 options）/ 无 towards 无 options', () => {
    const empty = mountSwiper()
    e2(() => empty.next()).not.toThrow()
    const single = mountSwiper({}, [makeItem()])
    e2(() => single.next()).not.toThrow() // oItemCount < 2 且无 options
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    const before = inst.events.length
    ;(inst.methods as unknown as {__doTransition: (t: null) => void}).__doTransition.call(inst, null)
    e2(inst.events.length).toBe(before)
  })

  i2('goto：displayIndex → real index；NaN/越界钳位；同位补间即完成', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    e2(() => inst.methods.goto.call(inst, Number.NaN)).not.toThrow()
    e2(inst.events).toEqual([])

    inst.methods.goto.call(inst, 2)
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 0, toIndex: 2})
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.translate).toBe(-1125)

    inst.methods.goto.call(inst, 9) // 钳位 → real 3 → display 2
    e2(inst.eventsOf('beforeChange')[1].detail).toEqual({fromIndex: 2, toIndex: 2})

    inst.methods.goto.call(inst, 0.9) // floor → 0 → real 1 = 当前 → 同位
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.translate).toBe(-375) // 同位补间 from==to 即完成
  })
})

d2('swiper 自动播放', () => {
  i2('ready 后默认播放：3000ms 一次 next；stop 后停', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    e2(stateOf(inst).isStoped).toBe(false)
    await vi.advanceTimersByTimeAsync(3000)
    e2(inst.eventsOf('beforeChange')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(3000)
    e2(inst.eventsOf('beforeChange')).toHaveLength(2)
    inst.stop()
    await vi.advanceTimersByTimeAsync(6000)
    e2(inst.eventsOf('beforeChange')).toHaveLength(2)
  })

  i2('play(d)：d<500 早退；合法 d 覆盖时长；播放中 dragging 跳过翻页', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.stop()
    inst.play(100) // d < 500 → 早退
    e2(stateOf(inst).isStoped).toBe(true)
    inst.play(700) // 合法 d → duration 700
    e2(stateOf(inst).isStoped).toBe(false)
    e2(stateOf(inst).duration).toBe(700)
    inst.stop()

    const inst2 = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    stateOf(inst2).dragging = true // 白盒：拖拽中
    await vi.advanceTimersByTimeAsync(3000)
    e2(inst2.eventsOf('beforeChange')).toHaveLength(0) // 跳过
    stateOf(inst2).dragging = false
    await vi.advanceTimersByTimeAsync(3000)
    e2(inst2.eventsOf('beforeChange')).toHaveLength(1)
  })

  i2('非 loop 播完停止（interval 自清）', async () => {
    const inst = mountSwiper({isLoop: false, autoplay: 1000}, [makeItem(), makeItem(), makeItem()])
    inst.stop() // 关掉 ready 时的默认播放
    inst.play(1000)
    await vi.advanceTimersByTimeAsync(1000)
    e2(inst.eventsOf('beforeChange')).toHaveLength(1) // → 1
    await vi.advanceTimersByTimeAsync(1000)
    e2(inst.eventsOf('beforeChange')).toHaveLength(2) // → 2（末位）
    await vi.advanceTimersByTimeAsync(1000)
    e2(inst.eventsOf('beforeChange')).toHaveLength(2) // 停止
    e2(stateOf(inst).isStoped).toBe(true)
  })
})

d2('swiper 触摸手势（slide）', () => {
  i2('拖拽过半松手 → 翻页；translate 跟手', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.methods.onDragStart.call(inst, touchEvt(0))
    e2(stateOf(inst).dragging).toBe(true)
    inst.methods.onDragMove.call(inst, touchEvt(-100))
    await vi.advanceTimersByTimeAsync(20) // flusher 窗口
    e2(inst.data.translate).toBe(-475) // 375*1 + 100
    inst.methods.onDragEnd.call(inst, touchEvt(-100))
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 0, toIndex: 1})
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.translate).toBe(-750)
  })

  i2('反向拖拽 → prev', () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.methods.onDragStart.call(inst, touchEvt(0))
    inst.methods.onDragMove.call(inst, touchEvt(200))
    inst.methods.onDragEnd.call(inst, touchEvt(200))
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 0, toIndex: 2})
  })

  i2('角度门控：纵向主导 → userScrolling，松手回弹当页', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.methods.onDragStart.call(inst, touchEvt(0))
    inst.methods.onDragMove.call(inst, touchEvt(5, 50)) // atan2(50,5) ≈ 84° > 45
    e2(stateOf(inst).userScrolling).toBe(true)
    e2(inst.data.translate).toBe(-375) // 未跟手
    inst.methods.onDragEnd.call(inst, touchEvt(5, 50))
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.translate).toBe(-375) // 回弹
    e2(inst.eventsOf('beforeChange')).toHaveLength(0)
  })

  i2('小位移不定门控（< 5px）：正常跟手；慢速未过半不翻页', () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.stop()
    inst.methods.onDragStart.call(inst, touchEvt(0))
    inst.methods.onDragMove.call(inst, touchEvt(3, 3))
    e2(stateOf(inst).userScrolling).toBe(false)
    vi.advanceTimersByTime(400) // 慢速（≥ PAGING_DURATION）
    inst.methods.onDragEnd.call(inst, touchEvt(3, 3))
    // 位移 3 < 187.5 且非快速拖 → 不翻页
    e2(inst.eventsOf('beforeChange')).toHaveLength(0)
  })

  i2('快速轻点（无 move 且 < 300ms）：仅恢复播放', () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.stop()
    inst.methods.onDragStart.call(inst, touchEvt(0))
    inst.methods.onDragEnd.call(inst, touchEvt(0))
    e2(inst.events).toEqual([])
    e2(stateOf(inst).isStoped).toBe(false) // play 恢复
  })

  i2('慢速小位移（≥300ms 且未过半）：不翻页', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.stop()
    inst.methods.onDragStart.call(inst, touchEvt(0))
    inst.methods.onDragMove.call(inst, touchEvt(-10))
    vi.advanceTimersByTime(400) // dragDuration ≥ PAGING_DURATION
    inst.methods.onDragEnd.call(inst, touchEvt(-10))
    e2(inst.eventsOf('beforeChange')).toHaveLength(0)
  })

  i2('手势防御：单项/不可拖/无 touch/未拖拽/无尺寸', () => {
    const single = mountSwiper({}, [makeItem()])
    single.methods.onDragStart.call(single, touchEvt(0))
    e2(stateOf(single).dragging).toBe(false)

    const noDrag = mountSwiper({dragable: false}, [makeItem(), makeItem()])
    noDrag.methods.onDragStart.call(noDrag, touchEvt(0))
    e2(stateOf(noDrag).dragging).toBe(false)

    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    e2(() => inst.methods.onDragStart.call(inst, {changedTouches: []} as never)).not.toThrow()
    e2(() => inst.methods.onDragMove.call(inst, {changedTouches: []} as never)).not.toThrow()
    e2(() => inst.methods.onDragMove.call(inst, touchEvt(10))).not.toThrow() // 未 dragging 早退
    e2(() => inst.methods.onDragEnd.call(inst, touchEvt(0))).not.toThrow() // 未 dragging 早退

    const noDim = mountSwiper({}, [makeItem(), makeItem()], {'.cu-swiper': {width: 0, height: 0}})
    noDim.methods.onDragStart.call(noDim, touchEvt(0))
    e2(stateOf(noDim).dragging).toBe(false) // dimension 0 早退
  })

  i2('slideY：纵向拖拽与翻页', async () => {
    const inst = mountSwiper({transition: 'slideY'}, [makeItem(), makeItem(), makeItem()])
    inst.methods.onDragStart.call(inst, touchEvt(0, 200))
    inst.methods.onDragMove.call(inst, touchEvt(0, 100)) // 上滑 100px
    await vi.advanceTimersByTimeAsync(20)
    e2(inst.data.translate).toBe(-300) // 200*1 + 100
    inst.methods.onDragEnd.call(inst, touchEvt(0, 100))
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 0, toIndex: 1})
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.data.translate).toBe(-400)
  })
})

d2('swiper fade 手势与过渡', () => {
  i2('fade next：双项透明度过渡 + 500ms afterChange', async () => {
    const items = [makeItem(), makeItem(), makeItem()]
    const inst = mountSwiper({transition: 'fade'}, items)
    inst.next()
    e2(inst.eventsOf('beforeChange')[0].detail).toEqual({fromIndex: 0, toIndex: 1})
    e2(items[1].data.fadeStyle).toBe('opacity: 1; transition: opacity 500ms ease;')
    e2(items[0].data.fadeStyle).toBe('opacity: 0; transition: opacity 500ms ease;')
    await vi.advanceTimersByTimeAsync(500)
    e2(inst.eventsOf('afterChange')).toEqual([{name: 'afterChange', detail: {fromIndex: 0, toIndex: 1}}])
  })

  i2('fade 拖拽：透明度跟随偏移；首尾回绕邻项', () => {
    const items = [makeItem(), makeItem(), makeItem()]
    const inst = mountSwiper({transition: 'fade'}, items)
    inst.methods.onDragStart.call(inst, touchEvt(0))
    inst.methods.onDragMove.call(inst, touchEvt(100)) // offsetLeft/dim ≈ 0.267 → 邻项 2（回绕）
    e2(items[0].data.fadeStyle).toBe('opacity: 0.7333333333333334;')
    e2(items[2].data.fadeStyle).toBe('opacity: 0.26666666666666666;')

    const items2 = [makeItem(), makeItem(), makeItem()]
    const inst2 = mountSwiper({transition: 'fade'}, items2)
    inst2.methods.onDragStart.call(inst2, touchEvt(0))
    inst2.methods.onDragMove.call(inst2, touchEvt(-100)) // 负偏移 → 邻项 1
    e2(items2[1].data.fadeStyle).toContain('opacity: 0.26')
    e2(items2[0].data.fadeStyle).toContain('opacity: 0.73')
    e2(() => inst2.methods.onDragMove.call(inst2, touchEvt(-50))).not.toThrow()
  })

  i2('fade drag 防御：items 缺失早退', () => {
    const inst = mountSwiper({transition: 'fade'}, [makeItem(), makeItem()])
    stateOf(inst).items = []
    e2(() => inst.methods.onDragMove.call(inst, touchEvt(50))).not.toThrow()
  })
})

d2('swiper detached 清理', () => {
  i2('过渡/播放中 detached：afterChange 与 autoplay 均不再触发', async () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.next() // 补间挂起
    inst.detached()
    await vi.advanceTimersByTimeAsync(5000)
    e2(inst.eventsOf('afterChange')).toHaveLength(0)
    e2(inst.eventsOf('beforeChange')).toHaveLength(1) // detached 前已派发
  })

  i2('防抖重建定时器清理', () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.linkRelation('../swiper-item/index', makeItem()) // 防抖挂起
    inst.detached()
    const count = vi.getTimerCount()
    vi.advanceTimersByTime(100)
    e2(vi.getTimerCount()).toBeLessThanOrEqual(count)
    e2(inst.data.indicatorCount).toBe(3) // 重建未执行
  })
})

d2('swiper 分支补漏', () => {
  i2('relations：重复 linked 去重；unlinked 未登记项不崩', () => {
    const a = makeItem()
    const inst = mountSwiper({}, [makeItem(), makeItem()])
    inst.linkRelation('../swiper-item/index', a)
    inst.linkRelation('../swiper-item/index', a) // 已登记 → 不重复
    e2(stateOf(inst).items).toHaveLength(3)
    const rel = comp.def.relations!['../swiper-item/index']
    e2(() => rel.unlinked!.call(inst, makeItem() as never)).not.toThrow() // 未登记
  })

  i2('拖拽位移钳位：横/纵超大位移按 ±(dim-1) 截断', () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.methods.onDragStart.call(inst, touchEvt(0))
    inst.methods.onDragMove.call(inst, touchEvt(2000))
    vi.advanceTimersByTime(20)
    e2(inst.data.translate).toBe(-1) // offset = dim*index - clamped（钳位 374）
    stateOf(inst).userScrolling = null // 重置门控再测反向
    inst.methods.onDragMove.call(inst, touchEvt(-2000))
    vi.advanceTimersByTime(20)
    e2(inst.data.translate).toBe(-749) // dim*index + (dim-1)

    const v = mountSwiper({transition: 'slideY'}, [makeItem(), makeItem(), makeItem()])
    v.methods.onDragStart.call(v, touchEvt(0, 200))
    v.methods.onDragMove.call(v, touchEvt(0, 2000))
    vi.advanceTimersByTime(20)
    e2(v.data.translate).toBe(-1) // 同式：dim*index - clamped
  })

  i2('slideY 松手 userScrolling：回弹用纵向坐标（?? 回退路径）', async () => {
    const v = mountSwiper({transition: 'slideY'}, [makeItem(), makeItem(), makeItem()])
    v.methods.onDragStart.call(v, touchEvt(0, 200))
    v.methods.onDragMove.call(v, touchEvt(200, 200)) // 纵向轮播 + 横向主导 → 页面滚动
    e2(stateOf(v).userScrolling).toBe(true)
    v.methods.onDragEnd.call(v, touchEvt(1, 200))
    await vi.advanceTimersByTimeAsync(300)
    e2(v.data.translate).toBe(-200) // 回弹当页
  })

  i2('fade 模式下缺 setFade 的 item（防御）', () => {
    const inst = mountDef(comp.def, {props: {transition: 'fade'}, rects: {'.cu-swiper': {width: 100}} as never})
    inst.attached()
    inst.linkRelation('../swiper-item/index', {data: {}} as never)
    inst.ready()
    e2(inst.data.indicatorCount).toBe(1)
    e2(() => inst.methods.__fadeDrag.call(inst, 0.5)).not.toThrow()
  })

  i2('防抖重建：停止状态下不恢复播放', () => {
    const inst = mountSwiper({}, [makeItem(), makeItem(), makeItem()])
    inst.stop() // isStoped true
    inst.linkRelation('../swiper-item/index', makeItem())
    vi.advanceTimersByTime(50)
    e2(stateOf(inst).isStoped).toBe(true) // 重建后未 play
    e2(inst.data.indicatorCount).toBe(4)
  })
})

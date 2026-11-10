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

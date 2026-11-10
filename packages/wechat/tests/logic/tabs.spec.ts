/**
 * tabs 纯逻辑测试：ink bar 几何、自动滚动目标、渐变遮罩可见性。
 * 对照 Vue 版 TabBar.vue 的 reflow/onScroll。
 */
import {describe, it, expect} from 'vitest'
import {inkGeometryOf, maskVisibilityOf, scrollTargetOf, type ItemRect} from '../../src/components/tabs/logic'

const rects: ItemRect[] = [
  {left: 0, width: 80},
  {left: 80, width: 120},
  {left: 200, width: 90},
]

describe('tabs/logic ink 几何', () => {
  it('inkLength 百分比：宽度 = 激活项宽度 × n/100，居中定位', () => {
    const ink = inkGeometryOf(rects[1], 25)
    expect(ink.width).toBe(30) // 120 × 25%
    expect(ink.pos).toBe(80 + (120 - 30) / 2)
  })

  it('inkLength 字符串直接作 px', () => {
    const ink = inkGeometryOf(rects[0], '40')
    expect(ink.width).toBe(40)
    expect(ink.pos).toBe(20)
  })

  it('inkLength 100 铺满激活项', () => {
    const ink = inkGeometryOf(rects[2], 100)
    expect(ink.width).toBe(90)
    expect(ink.pos).toBe(200)
  })
})

describe('tabs/logic 自动滚动目标（TabBar.reflow 尾段）', () => {
  it('无前项 → 0；无后项 → contentW - wrapperW', () => {
    expect(scrollTargetOf(0, rects, 290, 200)).toBe(0)
    expect(scrollTargetOf(2, rects, 290, 200)).toBe(90)
    expect(scrollTargetOf(2, rects, 290, 300)).toBe(0) // wrapper 更宽不滚
  })

  it('前项滚出视口左缘 → 滚到前项 offset', () => {
    // 当前滚动位 100，前项 left 0 已滚出 → 回滚到 0
    expect(scrollTargetOf(1, rects, 290, 200, 100)).toBe(0)
    const tight: ItemRect[] = [
      {left: 0, width: 80},
      {left: 80, width: 70},
      {left: 150, width: 70},
      {left: 220, width: 60},
    ]
    // 前后项均贴近视口（80 >= 80，右缘 280 <= 80+200）→ 保持
    expect(scrollTargetOf(2, tight, 280, 200, 80)).toBeNull()
    // 前项滚出（80 < 100）→ 回滚到前项 offset
    expect(scrollTargetOf(2, tight, 280, 200, 100)).toBe(80)
  })

  it('后项滚出视口右缘 → 后项右缘对齐', () => {
    // 视口 [0,150]，后项右缘 390 > 150 → 滚动 240
    const shifted: ItemRect[] = [
      {left: 0, width: 80},
      {left: 80, width: 120},
      {left: 200, width: 90},
      {left: 290, width: 100},
    ]
    expect(scrollTargetOf(2, shifted, 390, 150)).toBe(240)
  })

  it('前后项均在视口内 → 保持当前滚动（null）', () => {
    const wide: ItemRect[] = [
      {left: 0, width: 60},
      {left: 60, width: 60},
      {left: 120, width: 60},
    ]
    expect(scrollTargetOf(1, wide, 180, 300)).toBeNull()
  })
})

describe('tabs/logic 渐变遮罩可见性', () => {
  it('滚动后显示起始遮罩；触底隐藏结束遮罩', () => {
    expect(maskVisibilityOf(0, 400, 300)).toEqual({start: false, end: true})
    expect(maskVisibilityOf(50, 400, 300)).toEqual({start: true, end: true})
    expect(maskVisibilityOf(100, 400, 300)).toEqual({start: true, end: false})
  })
})

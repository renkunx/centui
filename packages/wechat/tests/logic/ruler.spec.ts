/**
 * ruler 纯逻辑测试：值域几何（scope/min/max 交叉钳制、空白带）、offset↔value 换算、
 * initX 定位与刻度布局。对照 Vue 版 Ruler.vue 的 computed/initX/updateValue/drawLine。
 */
import {describe, it, expect} from 'vitest'
import {
  BLANK,
  blankLeftOf,
  blankRightOf,
  initXOf,
  innerWidthOf,
  realMaxOf,
  realMinOf,
  tickLayoutOf,
  unitCountOf,
  valueAtOffset,
} from '../../src/components/ruler/logic'

describe('ruler/logic 值域几何', () => {
  it('unitCount = ceil((scope[1]-scope[0])/unit)', () => {
    expect(unitCountOf([0, 100], 1)).toBe(100)
    expect(unitCountOf([0, 100], 10)).toBe(10)
    expect(unitCountOf([0, 105], 10)).toBe(11)
  })

  it('realMin/realMax 与 scope 交叉钳制（avoid 越界回落）', () => {
    expect(realMinOf([0, 100], 20)).toBe(20)
    expect(realMinOf([0, 100], -5)).toBe(0)
    expect(realMinOf([0, 100], 150)).toBe(0) // min 超出右界 → 回落左界
    expect(realMaxOf([0, 100], 80)).toBe(80)
    expect(realMaxOf([0, 100], 120)).toBe(100)
    expect(realMaxOf([0, 100], -5)).toBe(100) // max 低于左界 → 回落右界
  })

  it('空白带：越界刻度淡显区域宽度', () => {
    expect(blankLeftOf(20, 0, 1)).toBe(20 * BLANK)
    expect(blankRightOf(100, 80, 1)).toBe(20 * BLANK)
    expect(blankLeftOf(0, 0, 1)).toBe(0)
  })

  it('innerWidth 与最大滚动（Vue scroller.setDimensions 语义）', () => {
    // unitCount=100, canvasWidth=300, blank 0 → innerWidth = 3000+300
    expect(innerWidthOf(100, 300, 0, 0)).toBe(3300)
    // maxScroll = innerWidth - canvasWidth = unitCount*BLANK - blankLeft - blankRight
    expect(innerWidthOf(100, 300, 60, 60) - 300).toBe(100 * BLANK - 120)
  })
})

describe('ruler/logic initX 定位', () => {
  it('value<=realMin → 0；>=realMax → unitCount*BLANK；否则按值偏移', () => {
    expect(initXOf(0, 0, 100, 1, 100)).toBe(0)
    expect(initXOf(0, 20, 100, 1, 100)).toBe(0)
    expect(initXOf(100, 0, 100, 1, 100)).toBe(100 * BLANK)
    expect(initXOf(120, 0, 100, 1, 100)).toBe(100 * BLANK)
    expect(initXOf(50, 0, 100, 1, 100)).toBe(50 * BLANK)
    expect(initXOf(47, 0, 100, 1, 100)).toBe(47 * BLANK) // ceil 语义
  })
})

describe('ruler/logic offset ↔ value 换算（updateValue）', () => {
  const canvasWidth = 300
  const baseX = canvasWidth - 0 // blankLeft 0

  it('scrollLeft=0 → realMin；滚到最大 → realMax', () => {
    expect(valueAtOffset(baseX, 0, canvasWidth, 0, 1, 0, 100)).toBe(0)
    expect(valueAtOffset(baseX, 100 * BLANK, canvasWidth, 0, 1, 0, 100)).toBe(100)
  })

  it('半格取整（round）；越界钳制', () => {
    // absX = scrollLeft；value = round(scrollLeft / BLANK)
    expect(valueAtOffset(baseX, 45, canvasWidth, 0, 1, 0, 100)).toBe(Math.round(45 / BLANK))
    expect(valueAtOffset(baseX, 45 + BLANK / 2, canvasWidth, 0, 1, 0, 100)).toBe(2)
    expect(valueAtOffset(baseX, 5000, canvasWidth, 0, 1, 0, 100)).toBe(100)
    expect(valueAtOffset(baseX, 0, canvasWidth, 0, 1, 20, 100)).toBe(20) // realMin 钳制
  })

  it('有左空白带时基线左移（baseX = canvasWidth - blankLeft）', () => {
    const blankLeft = 20 * BLANK
    const bx = canvasWidth - blankLeft
    // scrollLeft 0 → x = canvasWidth - blankLeft → absX = blankLeft → value ≈ 20
    expect(valueAtOffset(bx, 0, canvasWidth, 0, 1, 20, 100)).toBe(20)
    expect(valueAtOffset(bx, 50 * BLANK, canvasWidth, 0, 1, 20, 100)).toBe(70)
  })
})

describe('ruler/logic 刻度布局（drawLine 可测部分）', () => {
  const canvasWidth = 300

  it('step 整数倍为长刻度（major），其余短刻度', () => {
    const ticks = tickLayoutOf(0, 10, 10, 1, 0, 0, 0, canvasWidth)
    expect(ticks[0].major).toBe(true)
    expect(ticks[1].major).toBe(false)
    expect(ticks[10].major).toBe(true)
    expect(ticks[10].text).toBe('10')
  })

  it('越界刻度标记 outRange（淡色带）', () => {
    const blankLeft = 2 * BLANK
    const ticks = tickLayoutOf(0, 10, 10, 1, 0, blankLeft, 0, canvasWidth)
    expect(ticks[0].outRange).toBe(true)
    expect(ticks[1].outRange).toBe(true)
    expect(ticks[2].outRange).toBe(false)
  })

  it('画布外的刻度被裁剪（cx < 0 或 > canvasWidth*2）', () => {
    const ticks = tickLayoutOf(-100, 100, 10, 1, 0, 0, 0, canvasWidth)
    expect(ticks.every((t) => t.cx >= 0 && t.cx <= canvasWidth * 2)).toBe(true)
  })
})

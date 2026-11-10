/**
 * water-mark 纯逻辑测试：spacing 换算（Vue computedSpacing）、平铺次数换算
 * （Vue draw()，「双乘修复」语义）、水印插槽平铺结构（Vue 模板分支）。
 */
import {describe, it, expect} from 'vitest'
import {
  buildWatermarkLines,
  computeTileCount,
  resolveSpacing,
  spacingStyleOf,
  watermarkItemStyle,
  WATERMARK_FONT_SIZE,
  WATERMARK_REPETITION,
} from '../../src/components/water-mark/logic'

describe('water-mark/resolveSpacing（Vue computedSpacing）', () => {
  const W = 375
  const H = 667

  it('number 原样返回（不换算）', () => {
    expect(resolveSpacing(40, W, H)).toBe(40)
    expect(resolveSpacing(0, W, H)).toBe(0)
  })

  it("'12px' 直接取数值", () => {
    expect(resolveSpacing('12px', W, H)).toBe(12)
  })

  it("'20vw' 按屏宽换算（Vue window.screen.width 语义）", () => {
    expect(resolveSpacing('20vw', W, H)).toBeCloseTo((20 * W) / 100)
  })

  it("'10vh' 按屏高换算", () => {
    expect(resolveSpacing('10vh', W, H)).toBeCloseTo((10 * H) / 100)
  })

  it('正则不命中回退 20vw（Vue 解构默认值）', () => {
    expect(resolveSpacing('oops', W, H)).toBeCloseTo((20 * W) / 100)
    expect(resolveSpacing('', W, H)).toBeCloseTo((20 * W) / 100)
  })

  it('未知单位保持 0（Vue 各分支均未赋值）', () => {
    expect(resolveSpacing('20em', W, H)).toBe(0)
  })

  it('正则 [0-9]+([A-Za-z]+) 命中「5px」段（v2 语义：小数点截断首个数字组）', () => {
    expect(resolveSpacing('12.5px', W, H)).toBe(5)
  })
})

describe('water-mark/computeTileCount（Vue draw() 双乘修复语义）', () => {
  const FONT = WATERMARK_FONT_SIZE

  it('容器 375×667、ratio=2、content 4 字、spacing 20vw 设备像素口径', () => {
    // Vue: ctxWidth = 375*2 = 750；contentLength = 4*14*2 = 112；
    // realSpacing = 20vw(75px)*2 = 150；fontSize = 28
    const {xCount, yCount} = computeTileCount(750, 1334, 4 * FONT * 2, 75 * 2, FONT * 2)
    expect(xCount).toBe(Math.ceil(750 / (112 + 150)))
    expect(yCount).toBe(Math.ceil(1334 / (28 + 150)))
  })

  it('ratio=1 退化为 CSS 像素口径', () => {
    const {xCount, yCount} = computeTileCount(375, 667, 4 * FONT, 75, FONT)
    expect(xCount).toBe(Math.ceil(375 / (56 + 75)))
    expect(yCount).toBe(Math.ceil(667 / (14 + 75)))
  })

  it('零间距：xCount/yCount 不为 Infinity（整除时恰好铺满）', () => {
    const {xCount, yCount} = computeTileCount(100, 100, FONT * 2, 0, FONT)
    expect(xCount).toBe(Math.ceil(100 / 28))
    expect(yCount).toBe(Math.ceil(100 / 14))
  })

  it('小画布/长文本：至少平铺 1 次（ceil 语义）', () => {
    const {xCount, yCount} = computeTileCount(10, 10, 1000, 50, FONT)
    expect(xCount).toBe(1)
    expect(yCount).toBe(1)
  })
})

describe('water-mark/buildWatermarkLines（插槽平铺结构）', () => {
  it('默认 repeatX/repeatY：50 行 × 50 列（v2 生产契约）', () => {
    const tiling = buildWatermarkLines(true, true, '20vw')
    expect(WATERMARK_REPETITION).toBe(50)
    expect(tiling.lineStyles).toHaveLength(50)
    expect(tiling.itemStyles).toHaveLength(50)
    expect(tiling.itemCount).toBe(50)
  })

  it('repeatX=false：每行 1 项，item 无边距', () => {
    const tiling = buildWatermarkLines(false, true, '10px')
    expect(tiling.itemCount).toBe(1)
    expect(tiling.itemStyles.every(s => s === '')).toBe(true)
    expect(tiling.lineStyles[0]).toBe('margin-bottom:10px')
  })

  it('repeatY=false：单行', () => {
    const tiling = buildWatermarkLines(true, false, '20vw')
    expect(tiling.lineStyles).toHaveLength(1)
    expect(tiling.itemCount).toBe(50)
  })

  it('奇偶行规则：1 基偶数行 margin-left、奇数行 margin-right（Vue li :style）', () => {
    const tiling = buildWatermarkLines(true, true, '20vw')
    expect(tiling.itemStyles[0]).toBe('margin-right:20vw') // 第 1 行
    expect(tiling.itemStyles[1]).toBe('margin-left:20vw') // 第 2 行
    expect(tiling.itemStyles[2]).toBe('margin-right:20vw') // 第 3 行
  })

  it('number spacing 补 px 单位；同参数幂等（测试可注入 repetition）', () => {
    const tiling = buildWatermarkLines(true, true, 40, 2)
    expect(tiling.lineStyles).toEqual(['margin-bottom:40px', 'margin-bottom:40px'])
    expect(tiling.itemStyles).toEqual([
      'margin-right:40px',
      'margin-left:40px',
    ])
    expect(buildWatermarkLines(true, true, '8px', 1)).toEqual({
      lineStyles: ['margin-bottom:8px'],
      itemStyles: ['margin-right:8px'],
      itemCount: 1,
    })
  })
})

describe('water-mark/watermarkItemStyle 与 spacingStyleOf', () => {
  it('watermarkItemStyle 奇偶行语义（1 基）', () => {
    expect(watermarkItemStyle(1, true, '8px')).toBe('margin-right:8px')
    expect(watermarkItemStyle(2, true, '8px')).toBe('margin-left:8px')
    expect(watermarkItemStyle(3, false, '8px')).toBe('')
  })

  it('spacingStyleOf：number 补 px，字符串原样', () => {
    expect(spacingStyleOf(40)).toBe('40px')
    expect(spacingStyleOf('20vw')).toBe('20vw')
  })
})

/**
 * water-mark 纯逻辑（对照 Vue 版 WaterMark.vue 的 computedSpacing / draw 平铺换算
 * 与水印插槽平铺结构）。
 */

/** v2 契约：生产平铺 50 次（Vue 版 isTestEnv ? 2 : 50，测试侧以参数注入） */
export const WATERMARK_REPETITION = 50

/** Vue 版 FONT_SIZE / COLOR 常量（canvas 绘制用，与 WaterMark.vue 一致） */
export const WATERMARK_FONT_SIZE = 14
export const WATERMARK_COLOR = '#858B9C'

/** spacing → 内联样式长度串（number 补 px 单位，字符串原样） */
export function spacingStyleOf(spacing: string | number): string {
  return typeof spacing === 'number' ? `${spacing}px` : `${spacing}`
}

/**
 * Vue computedSpacing：number 原样；'12px' / '20vw' / '10vh' 按屏幕尺寸换算为 CSS px；
 * 正则不命中时回退 20vw（Vue 解构默认值）；未知单位（如 em）保持 0（Vue 各分支
 * 均未赋值）。返回 CSS px（未乘 ratio，ratio 乘法在组件层与 Vue 一致）。
 */
export function resolveSpacing(
  spacing: string | number,
  screenWidth: number,
  screenHeight: number,
): number {
  if (typeof spacing === 'number') {
    return spacing
  }
  const [, amount = '20', unit = 'vw'] = /([0-9]+)([A-Za-z]+)/.exec(spacing) ?? []
  if (unit === 'px') {
    return Number(amount)
  }
  if (unit === 'vh') {
    return (Number(amount) * screenHeight) / 100
  }
  if (unit === 'vw') {
    return (Number(amount) * screenWidth) / 100
  }
  return 0
}

/**
 * Vue draw() 平铺次数换算（「双乘修复」保持：ctxWidth/ctxHeight 与 contentLength、
 * realSpacing 同一单位（Vue 为设备像素），不对 ctxWidth/ctxHeight 重复乘 ratio）：
 *   xCount = ceil(ctxWidth / (contentLength + realSpacing))
 *   yCount = ceil(ctxHeight / (fontSize + realSpacing))
 */
export function computeTileCount(
  ctxWidth: number,
  ctxHeight: number,
  contentLength: number,
  realSpacing: number,
  fontSize: number,
): {xCount: number; yCount: number} {
  const xCount = Math.ceil(ctxWidth / (contentLength + realSpacing))
  const yCount = Math.ceil(ctxHeight / (fontSize + realSpacing))
  return {xCount, yCount}
}

export interface WatermarkTiling {
  /** 每行的内联样式（Vue ul :style="{marginBottom: spacing}"） */
  lineStyles: string[]
  /** 每行 item 的内联样式（同一行内所有 item 共用，Vue li :style 的行粒度展开） */
  itemStyles: string[]
  /** 每行 item 数（Vue v-for="j in repeatX ? repetition : 1"） */
  itemCount: number
}

/**
 * 水印插槽平铺结构：行数 = repeatY ? repetition : 1，列数 = repeatX ? repetition : 1；
 * item 内边距按行号奇偶（偶数行 margin-left / 奇数行 margin-right，repeatX=false
 * 时空串）。同一行内所有 item 样式一致，故按行展开避免 setData 2500 项大数组。
 */
export function buildWatermarkLines(
  repeatX: boolean,
  repeatY: boolean,
  spacing: string | number,
  repetition: number = WATERMARK_REPETITION,
): WatermarkTiling {
  const rowCount = repeatY ? repetition : 1
  const colCount = repeatX ? repetition : 1
  const style = spacingStyleOf(spacing)
  const lineStyles: string[] = []
  const itemStyles: string[] = []
  for (let i = 1; i <= rowCount; i++) {
    lineStyles.push(`margin-bottom:${style}`)
    itemStyles.push(watermarkItemStyle(i, repeatX, style))
  }
  return {lineStyles, itemStyles, itemCount: colCount}
}

/**
 * Vue li 的 :style="i % 2 === 0 ? {marginLeft: repeatX ? spacing : 0}
 * : {marginRight: repeatX ? spacing : 0}"（i 为 1 基行号；repeatX=false 时空串）。
 */
export function watermarkItemStyle(
  lineNo1Based: number,
  repeatX: boolean,
  spacingStyle: string,
): string {
  if (!repeatX) {
    return ''
  }
  return lineNo1Based % 2 === 0
    ? `margin-left:${spacingStyle}`
    : `margin-right:${spacingStyle}`
}

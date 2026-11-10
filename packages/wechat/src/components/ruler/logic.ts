/**
 * ruler 纯逻辑：值域几何（scope/min/max 交叉钳制、空白带）、offset↔value 换算、
 * initX 定位。逐行对照 packages/vue/src/components/ruler/Ruler.vue 的
 * unitCount/realMin/realMax/blankLeft/blankRight/initX/updateValue。
 * 画布几何常量（BLANK/CLIENT_HEIGHT/RATIO）与 Vue 一致，见组件头注释。
 */

/** 相邻最小刻度的画布间距（Vue 2x 空间常量） */
export const BLANK = 30
/** 画布 CSS 高度（Vue 常量） */
export const CLIENT_HEIGHT = 60
/** 画布超采样倍率（Vue RATIO=2：canvas 尺寸为 CSS 尺寸 2 倍，ctx.scale(1/2)） */
export const RATIO = 2

/** unitCount = ceil((scope[1] - scope[0]) / unit) */
export function unitCountOf(scope: Array<number>, unit: number): number {
  return Math.ceil((scope[1] - scope[0]) / unit)
}

/** realMin：min 超出 scope 右界时回落左界（Ruler.realMin） */
export function realMinOf(scope: Array<number>, min: number): number {
  const [left, right] = scope
  if (min > right) return left
  return min > left ? min : left
}

/** realMax：max 低于 scope 左界时回落右界（Ruler.realMax） */
export function realMaxOf(scope: Array<number>, max: number): number {
  const [left, right] = scope
  if (left > max) return right
  return max > right ? right : max
}

/** 左侧空白带宽度（超出 realMin 的刻度数 × BLANK） */
export function blankLeftOf(realMin: number, scopeLeft: number, unit: number): number {
  return Math.ceil((realMin - scopeLeft) / unit) * BLANK
}

/** 右侧空白带宽度 */
export function blankRightOf(scopeRight: number, realMax: number, unit: number): number {
  return Math.ceil((scopeRight - realMax) / unit) * BLANK
}

/** 可滚动内容宽度（innerWidth；max 滚动 = innerWidth - canvasWidth） */
export function innerWidthOf(
  unitCount: number,
  canvasWidth: number,
  blankLeft: number,
  blankRight: number,
): number {
  return unitCount * BLANK + canvasWidth - blankLeft - blankRight
}

/** initX：按当前值定位滚动偏移（<= realMin → 0；>= realMax → unitCount*BLANK） */
export function initXOf(value: number, realMin: number, realMax: number, unit: number, unitCount: number): number {
  if (value <= realMin) return 0
  if (value >= realMax) return unitCount * BLANK
  return Math.ceil((value - realMin) / unit) * BLANK
}

/** 基线原点 x（drawLine 的 x.value 初值：canvasWidth - blankLeft） */
export function baseXOf(canvasWidth: number, blankLeft: number): number {
  return canvasWidth - blankLeft
}

/** offset → value（updateValue 移植，含越界钳制与 realMin 直读分支） */
export function valueAtOffset(
  baseX: number,
  scrollLeft: number,
  canvasWidth: number,
  scopeLeft: number,
  unit: number,
  realMin: number,
  realMax: number,
): number {
  const x = baseX - scrollLeft
  if (x > canvasWidth) {
    return realMin
  }
  const absX = x >= 0 ? Math.abs(x - canvasWidth) : Math.abs(x) + canvasWidth
  let value = scopeLeft + Math.round(absX / BLANK) * unit
  if (value > realMax) value = realMax
  if (value < realMin) value = realMin
  return value
}

/** 刻度几何（drawLine 循环的可测部分）：颜色分组与长短刻度 */
export interface TickLayout {
  index: number
  /** 画布 2x 空间横坐标 */
  cx: number
  /** 长刻度（step 整数倍，带文本） */
  major: boolean
  /** 超出 realMin/realMax 范围（淡色） */
  outRange: boolean
  /** 文本（major 时有效；stepTextRender 由组件层调用——函数属性不可用） */
  text: string
}

export function tickLayoutOf(
  baseX: number,
  unitCount: number,
  step: number,
  unit: number,
  scopeLeft: number,
  blankLeft: number,
  blankRight: number,
  canvasWidth: number,
): TickLayout[] {
  const stepUnit = Math.max(1, Math.round(step / unit))
  const ticks: TickLayout[] = []
  for (let i = 0; i <= unitCount; i++) {
    const cx = baseX + i * BLANK
    if (cx < 0 || cx > canvasWidth * 2) continue
    const major = i % stepUnit === 0
    const value = scopeLeft + unit * i
    ticks.push({
      index: i,
      cx,
      major,
      outRange: cx < baseX + blankLeft || cx > baseX + 1 + unitCount * BLANK - blankRight,
      text: major ? String(value) : '',
    })
  }
  return ticks
}

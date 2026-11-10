/**
 * slider 纯逻辑：值归一（step 对齐/边界钳位/交叉修复）、位置换算、选区样式。
 * 逐行对照 packages/vue/src/components/slider/Slider.vue 的 updateValue /
 * lowerHandlePosition / barStyle（修复后实现：主动画被动跟随、isDragging 守卫）。
 */
export interface SliderValues {
  lower: number
  upper: number
}

/** step 对齐：Math.round((v - min) / step) * step + min（updateValue 同款） */
export function alignToStep(value: number, min: number, step: number): number {
  return Math.round((value - min) / step) * step + min
}

/**
 * updateValue 归一：null/undefined 位保留旧值；step 对齐；min/max 钳位；
 * 交叉时「拖动端跟随另一端」（newValues[0] === values[0] ? upper=lower : lower=upper）。
 */
export function normalizeValues(
  newLower: number | null | undefined,
  newUpper: number | null | undefined,
  prev: SliderValues,
  min: number,
  max: number,
  step: number,
): SliderValues {
  let lower = typeof newLower === 'number' ? alignToStep(newLower, min, step) : prev.lower
  let upper = typeof newUpper === 'number' ? alignToStep(newUpper, min, step) : prev.upper

  // value boundary adjust
  if (lower < min) lower = min
  if (upper > max) upper = max
  if (lower > upper) {
    if (lower === prev.lower) {
      upper = lower
    } else {
      lower = upper
    }
  }
  return {lower, upper}
}

/** 值 → 百分比位置（除零防护：max<=min 时 0；Vue 版会产出 Infinity%，样式无效） */
export function positionOf(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return ((value - min) / (max - min)) * 100
}

/** 选区实心段样式（barStyle）：range 双端 / 单值左起 */
export function barStyleOf(range: boolean, values: SliderValues, min: number, max: number): string {
  if (range) {
    const left = positionOf(values.lower, min, max)
    const width = positionOf(values.upper, min, max) - left
    return `width: ${width}%; left: ${left}%;`
  }
  return `width: ${positionOf(values.lower, min, max)}%;`
}

/** 拖拽位移 → 值增量（onDrag：diff / elWidth * (max - min)） */
export function dragDeltaOf(pixelDelta: number, trackWidth: number, min: number, max: number): number {
  if (trackWidth <= 0) return 0
  return (pixelDelta / trackWidth) * (max - min)
}

/** data-hint 文案（format 为函数属性，小程序不可用 → 恒为原始数值，差异在组件头声明） */
export function hintOf(value: number): string {
  return String(value)
}

/** 值属性归一（Number | Array<number>） */
export function parseValueProp(v: unknown): {lower: number | null; upper: number | null} {
  if (Array.isArray(v)) {
    return {lower: typeof v[0] === 'number' ? v[0] : null, upper: typeof v[1] === 'number' ? v[1] : null}
  }
  return {lower: typeof v === 'number' ? v : null, upper: null}
}

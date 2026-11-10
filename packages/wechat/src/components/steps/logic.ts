/**
 * steps 纯逻辑（对照 Vue 版 Steps.vue）
 */

export interface StepItem {
  name?: string
  text?: string
}

export interface ProgressSeg {
  len: number
  time: number
}

export const STEP_DURATION = 0.3 // Vue duration = 0.3（秒）

/** Vue formatValue：负值归 0，超出末步归末步；steps 为空时返回 -1（源语义原样保留） */
export function formatValue(val: number, stepsLength: number): number {
  if (val < 0) {
    return 0
  }
  if (val > stepsLength - 1) {
    return stepsLength - 1
  }
  return val
}

/**
 * Vue sliceProgress：steps.slice(0, length-1) 逐段计算进度
 *  - offset = current - index；len 截到 [0,1]
 *  - time：首算（无旧值）按 len，否则按 |old.len - len|，乘 duration
 */
export function sliceProgress(
  current: number,
  steps: StepItem[],
  oldProgress: Array<ProgressSeg | undefined>,
  duration = STEP_DURATION,
): ProgressSeg[] {
  return steps.slice(0, steps.length - 1).map((_step, index) => {
    const offset = current - index
    const old = oldProgress[index]
    const isNewProgress = old === undefined
    let len: number
    if (offset <= 0) {
      len = 0
    } else if (offset >= 1) {
      len = 1
    } else {
      len = offset
    }
    const time = (isNewProgress ? len : Math.abs(old!.len - len)) * duration
    return {len, time}
  })
}

/** Vue getStepStatusClass：index < current → reached；index === floor(current) → current */
export function stepStatusClass(current: number, index: number): string {
  const status: string[] = []
  if (index < current) {
    status.push('reached')
  }
  if (index === Math.floor(current)) {
    status.push('current')
  }
  return status.join(' ')
}

/** Vue 'no-current' 类：currentLength % 1 !== 0（进行中的小数进度） */
export function isNoCurrent(current: number): boolean {
  return current % 1 !== 0
}

/** Vue barInnerStyle：水平 translate3d((len-1)*100%, 0, 0)，垂直 (0, …, 0)；缺段兜底空串 */
export function barInnerStyle(seg: ProgressSeg | undefined, direction: string): string {
  if (!seg) {
    return ''
  }
  const shift = (seg.len - 1) * 100
  const transform =
    direction === 'horizontal'
      ? `translate3d(${shift}%, 0, 0)`
      : `translate3d(0, ${shift}%, 0)`
  return `transform:${transform};transition:all ${seg.time}s linear;`
}

/** Vue getStepSizeForStyle：垂直非 adaptive 时 bar 高度 = stepsSize[index]，否则不设 */
export function barOuterStyle(
  index: number,
  direction: string,
  verticalAdaptive: boolean,
  stepsSize: number[],
): string {
  const size = direction === 'vertical' && !verticalAdaptive ? stepsSize[index] : 0
  return size ? `height:${size}px;` : ''
}

/**
 * Vue initStepSize：垂直非 adaptive 时按文本高度算每段 bar 高度——
 * 末步扣除图标浮动高度，其余 +40（源码字面量，步骤间距）；负值归 0。
 */
export function computeStepSizes(textHeights: number[], iconHeights: number[]): number[] {
  return textHeights.map((h, index) => {
    let stepHeight = h
    const iconHeight = iconHeights[index] ?? 0
    if (index === textHeights.length - 1) {
      stepHeight -= iconHeight
    } else {
      stepHeight += 40
    }
    return stepHeight > 0 ? stepHeight : 0
  })
}

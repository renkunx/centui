/**
 * Stepper 纯逻辑（自 Vue 版 stepper/Stepper.vue 的 accAdd/subtr/formatNum/getCurrentNum
 * 与 watch(currentNum) 收敛语义提取，行为逐一对照，含 0.1 精度补偿）。
 */
export type NumLike = number | string

export function getDecimalNum(num: NumLike): number {
  try {
    return num.toString().split('.')[1].length
  } catch {
    return 0
  }
}

export function accAdd(num1: NumLike, num2: NumLike): number {
  const n1 = Number(num1)
  const n2 = Number(num2)
  const r1 = getDecimalNum(num1)
  const r2 = getDecimalNum(num2)
  const m = Math.pow(10, Math.max(r1, r2))
  return +((n1 * m + n2 * m) / m)
}

export function subtr(num1: NumLike, num2: NumLike): number {
  const n1 = Number(num1)
  const n2 = Number(num2)
  const r1 = getDecimalNum(num1)
  const r2 = getDecimalNum(num2)
  const m = Math.pow(10, Math.max(r1, r2))
  const n = r1 >= r2 ? r1 : r2
  return +((n1 * m - n2 * m) / m).toFixed(n)
}

/**
 * 输入清洗：剔除数字/./- 之外字符与首个前导 -/．，isInteger 时向下取整；
 * 空串归 0（对齐 Vue formatNum）。
 */
export function formatNum(value: NumLike, isInteger: boolean): number {
  const str = String(value).replace(/[^0-9.-]|^-|^\./g, '')
  return str === '' ? 0 : isInteger ? Math.floor(Number(str)) : +str
}

export function clampStepper(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

/** 对齐 Vue getCurrentNum：先 formatNum 再收敛到 [min, max] */
export function getCurrentNum(
  value: NumLike,
  min: NumLike,
  max: NumLike,
  isInteger: boolean,
): number {
  return clampStepper(formatNum(value, isInteger), Number(min), Number(max))
}

export interface StepperTransition {
  /** 收敛后的新值（写入 currentNum） */
  value: number
  /** 与 modelValue 不同，需 emit update:modelValue + change */
  changed: boolean
  /** 相对旧 currentNum 的增量：>0 increase / <0 decrease（载荷取绝对值） */
  diff: number
}

/**
 * currentNum 变更收敛（对齐 Vue watch(currentNum)）：
 * emit 前先 clamp 到 [min, max]，退化区间（min > max）时 max 收敛优先
 * （Math.min 外层），与 v2 last-writer 语义一致。
 */
export function transitionStepper(
  prev: number,
  next: number,
  opts: {min: NumLike; max: NumLike; modelValue: NumLike},
): StepperTransition {
  const clamped = clampStepper(next, Number(opts.min), Number(opts.max))
  return {
    value: clamped,
    changed: clamped !== opts.modelValue,
    diff: clamped - prev,
  }
}

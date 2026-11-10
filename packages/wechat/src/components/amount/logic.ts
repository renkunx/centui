/**
 * amount 纯逻辑（对照 Vue 版 Amount.vue 的 computed 链）。
 *
 * 格式化函数取自 @centui/core 主入口（packages/core/src/format.ts，零依赖、DOM-free，
 * 与主入口 re-export 的实现同一份源码）。此处以相对路径引入而非 '@centui/core'
 * 包说明符：@centui/wechat 尚未声明 @centui/core 依赖（workspace 未链接），
 * 包说明符无法被 tsc/vitest 解析；构建期 esbuild bundle 对两者的产物语义一致
 * （构建脚本 corePlugin 将 '@centui/core' 指向 core/dist/index.cjs，亦为同一实现），
 * 待 package.json 依赖声明补齐后可整体切回 '@centui/core'。
 */
import {
  formatNumberWithSeparator,
  numberToChineseCapital,
  toFixedPrecision,
} from '@centui/core'

/** Vue legalPrecision computed：precision <= 0 时按 0 处理 */
export function legalPrecision(precision: number): number {
  return precision > 0 ? precision : 0
}

export interface AmountFormatOptions {
  precision: number
  isRoundUp: boolean
  hasSeparator: boolean
  separator: string
  isCapital: boolean
}

/**
 * Vue nonCapital computed：toFixedPrecision(precision) → hasSeparator 时千分位分组；
 * Vue capital computed：toFixedPrecision(4) → numberToChineseCapital（「元后补零」
 * 修复随 core 实现自带）。
 */
export function formatAmountText(displayValue: number, opts: AmountFormatOptions): string {
  if (opts.isCapital) {
    return numberToChineseCapital(
      toFixedPrecision(displayValue, 4, opts.isRoundUp),
    )
  }
  const formatted = toFixedPrecision(
    displayValue,
    legalPrecision(opts.precision),
    opts.isRoundUp,
  )
  return opts.hasSeparator
    ? formatNumberWithSeparator(formatted, opts.separator)
    : formatted
}

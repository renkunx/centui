/**
 * progress 纯逻辑：formatValue 状态机（对照 Vue 版 Progress.vue 的 value watch）
 */

export type FormatAction =
  | {type: 'sync'; value: number}
  | {type: 'animate'; from: number; to: number}

/**
 * Vue 语义：
 *  - 首轮（未 mounted）直接同步终值（SSR 与客户端首帧一致）；
 *  - transition=false 直接同步；
 *  - 其余从 oldVal 动画到 newVal（oldVal 缺省按 0，对齐 Vue animateDisplay 默认参数）。
 */
export function resolveFormatValue(input: {
  value: number
  oldValue: number | undefined
  isMounted: boolean
  transition: boolean
}): FormatAction {
  if (!input.isMounted || !input.transition) {
    return {type: 'sync', value: input.value}
  }
  return {type: 'animate', from: input.oldValue ?? 0, to: input.value}
}

/**
 * tab-pane 纯逻辑：激活态过渡类与显隐（300ms 定时器真源，对齐 transition.styl
 * cu-tab-slide-left/right 的 300ms）。
 */
export type PaneTransition = 'cu-tab-slide-left' | 'cu-tab-slide-right'

export const PANE_TRANSITION_MS = 300

export function enterStartClasses(name: PaneTransition): string {
  return `${name}-enter ${name}-enter-active`
}

export function enterActiveClasses(name: PaneTransition): string {
  return `${name}-enter-active`
}

export function leaveClasses(name: PaneTransition): string {
  return `${name}-leave-to ${name}-leave-active`
}

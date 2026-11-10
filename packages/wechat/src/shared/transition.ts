/**
 * 过渡状态机工具：小程序没有 <transition>/transitionend，
 * 弹层类组件的进出场一律按「四段类切换 + 定时器真源」实现（对齐 Vue transition 语义）。
 *
 *   enter:  cu-<name>-enter cu-<name>-enter-active  →（双帧后）cu-<name>-enter-active
 *           →（enter 时长后）清理 → show 事件
 *   leave:  cu-<name>-leave-to cu-<name>-leave-active
 *           →（leave 时长后）清理 → hide 事件
 *
 * 时长表 TRANSITION_DURATIONS 必须与 packages/styles/src/components/transition.styl 保持一致；
 * scripts/verify.mjs 会静态校验两者同步（解析 styl 中的 ms 值对比本表）。
 */
export interface TransitionTiming {
  enter: number
  leave: number
}

export const TRANSITION_DURATIONS: Record<string, TransitionTiming> = {
  bounce: {enter: 300, leave: 250},
  zoom: {enter: 300, leave: 250},
  punch: {enter: 300, leave: 250},
  'slide-up': {enter: 300, leave: 250},
  'slide-down': {enter: 300, leave: 250},
  'slide-left': {enter: 300, leave: 250},
  'slide-right': {enter: 300, leave: 250},
  fade: {enter: 300, leave: 250},
  'fade-up': {enter: 300, leave: 250},
  'fade-down': {enter: 300, leave: 250},
  'fade-left': {enter: 300, leave: 250},
  'fade-right': {enter: 300, leave: 250},
  'mask-fade': {enter: 300, leave: 250},
}

/** Vue 版 Popup 的 position → 默认过渡名 */
export function defaultTransition(position: string): string {
  switch (position) {
    case 'bottom':
      return 'slide-up'
    case 'top':
      return 'slide-down'
    case 'left':
      return 'slide-right'
    case 'right':
      return 'slide-left'
    default:
      return 'fade'
  }
}

export function transitionDuration(name: string, dir: 'enter' | 'leave'): number {
  const t = TRANSITION_DURATIONS[name]
  if (!t) return 0
  return dir === 'enter' ? t.enter : t.leave
}

/** 进入起始段：cu-<name>-enter cu-<name>-enter-active */
export function enterStartClasses(name: string): string {
  return `cu-${name}-enter cu-${name}-enter-active`
}

/** 进入进行段（移除起始类，触发过渡） */
export function enterActiveClasses(name: string): string {
  return `cu-${name}-enter-active`
}

/** 离开段：cu-<name>-leave-to cu-<name>-leave-active */
export function leaveClasses(name: string): string {
  return `cu-${name}-leave-to cu-${name}-leave-active`
}

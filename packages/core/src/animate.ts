/**
 * 缓动函数（自 v2 _util/animate.js 迁移）。
 * 动画调度器（rAF 运行时）在 ./web/animate.ts，仅 Web 端可用。
 */

export const easeOutCubic = (pos: number): number => {
  return Math.pow(pos - 1, 3) + 1
}

export const easeInOutCubic = (pos: number): number => {
  if ((pos /= 0.5) < 1) {
    return 0.5 * Math.pow(pos, 3)
  }
  return 0.5 * (Math.pow(pos - 2, 3) + 2)
}

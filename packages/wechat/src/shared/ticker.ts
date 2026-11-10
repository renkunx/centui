/**
 * 逻辑层数值动画内核（amount/progress/steps 用）：对齐 @centui/core/web Animate 的
 * 时间语义（duration 内按帧推进、可 stop），但运行于逻辑层 setTimeout 16ms 步进。
 */
export interface TickerHandle {
  stop(): void
}

export interface ValueAnimateOptions {
  from: number
  to: number
  duration?: number
  onUpdate: (value: number) => void
  onComplete?: () => void
}

const FRAME = 16

export function animateValue(options: ValueAnimateOptions): TickerHandle {
  const duration = Math.max(options.duration ?? 0, 0)
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | null = null

  if (duration === 0 || options.from === options.to) {
    options.onUpdate(options.to)
    options.onComplete?.()
    return {stop() { stopped = true }}
  }

  const start = Date.now()
  const tick = () => {
    if (stopped) return
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    // ease-out（与 v2 Animate 的 linear 差异可接受？—— v2 为线性插值 + 各组件自行 easing，
    // 此处保持线性以对齐 v2 渲染曲线）
    const value = options.from + (options.to - options.from) * progress
    options.onUpdate(value)
    if (progress >= 1) {
      options.onComplete?.()
      return
    }
    timer = setTimeout(tick, FRAME)
  }
  tick()

  return {
    stop() {
      stopped = true
      if (timer != null) clearTimeout(timer)
    },
  }
}

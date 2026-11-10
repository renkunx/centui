/**
 * 逻辑层惯性滚动内核：v2/core Scroller 的 DOM-free 近似（触摸拖拽 + 动量减速 + 边界回弹）。
 *
 * 与 @centui/core/web Scroller 的差异（有意为之，滚动类组件文件头须声明）：
 *  - 走逻辑层 16ms 步进模拟（setTimeout），位移经 setData 最小字段下发，无 view 线程级流畅度；
 *  - 动量参数对齐 zynga/v2：速度每帧 ×0.95，|v| < 0.01 终止；越界拖拽按 0.5 阻尼，松手回弹。
 *
 * 用法（picker/ruler/swiper 共用）：
 *   const ticker = createDragTicker({
 *     min: 0, max: (count - 1) * itemHeight,
 *     onTranslate: (offset) => this.setData({offset}),   // 每 16ms 最多一次
 *   })
 *   wxml: bind:touchstart="ticker.onTouchStart" ... （methods 里转发给 this.__ticker）
 *   需要定位到某格：ticker.scrollTo(offset, animated?)
 */
export interface DragTickerOptions {
  min: number
  max: number
  /** 位移回调（16ms 节流） */
  onTranslate: (offset: number, source: 'drag' | 'momentum' | 'bounce') => void
  onStart?: () => void
  onStop?: (offset: number) => void
  /** 步进间隔，默认 16ms */
  frame?: number
}

export interface DragTicker {
  getOffset(): number
  onTouchStart(x: number, y: number): void
  onTouchMove(x: number, y: number): void
  onTouchEnd(): void
  scrollTo(target: number, animated?: boolean): void
  stop(): void
  destroy(): void
}

const DECELERATION = 0.95
const MIN_VELOCITY = 0.01
const OVERSCROLL_DAMPING = 0.5
const BOUNCE_DURATION = 250

export function createDragTicker(options: DragTickerOptions): DragTicker {
  const frame = options.frame ?? 16
  let offset = options.min
  let running = false
  let destroyed = false

  let dragging = false
  let lastX = 0
  let lastY = 0
  let lastMoveTime = 0
  // 主轴取位移更大的方向（picker 纵向、swiper 横向共用）
  let axis: 'x' | 'y' | null = null
  let dragStartOffset = 0
  let velocity = 0

  let timer: ReturnType<typeof setTimeout> | null = null

  const clamp = (v: number) => Math.min(options.max, Math.max(options.min, v))

  function emit(source: Parameters<DragTickerOptions['onTranslate']>[1]) {
    options.onTranslate(offset, source)
  }

  function stopLoop() {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
    running = false
  }

  /** 单步：拖拽外的动量/回弹推进 */
  function step() {
    if (destroyed) return
    const outOfBounds = offset < options.min || offset > options.max

    if (outOfBounds) {
      // 回弹：向边界推进，一步跨过剩余距离的 1/4（指数趋近，亚像素即吸附）
      const target = offset < options.min ? options.min : options.max
      const remain = target - offset
      const stepSize = (remain / BOUNCE_DURATION) * frame
      if (Math.abs(remain) <= 0.01 || Math.abs(stepSize) >= Math.abs(remain)) {
        offset = target
        stopLoop()
        emit('bounce')
        options.onStop?.(offset)
        return
      }
      offset += stepSize
      emit('bounce')
    } else if (Math.abs(velocity) >= MIN_VELOCITY) {
      offset += velocity
      velocity *= DECELERATION
      emit('momentum')
    } else {
      stopLoop()
      options.onStop?.(offset)
      return
    }
    timer = setTimeout(step, frame)
  }

  function startLoop() {
    if (running || destroyed) return
    running = true
    timer = setTimeout(step, frame)
  }

  const ticker: DragTicker = {
    getOffset: () => offset,

    onTouchStart(x, y) {
      if (destroyed) return
      // 拖拽打断进行中的动量/回弹
      if (running) stopLoop()
      dragging = true
      axis = null
      lastX = x
      lastY = y
      lastMoveTime = Date.now()
      dragStartOffset = offset
      velocity = 0
      options.onStart?.()
    },

    onTouchMove(x, y) {
      if (destroyed || !dragging) return
      const dx = x - lastX
      const dy = y - lastY
      if (axis === null && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      }
      const delta = axis === 'x' ? dx : axis === 'y' ? dy : 0
      if (delta === 0) return
      lastX = x
      lastY = y
      const now = Date.now()
      const dt = Math.max(now - lastMoveTime, 1)
      lastMoveTime = now

      const next = offset - delta
      const outOfBounds = next < options.min || next > options.max
      offset = outOfBounds ? offset - delta * OVERSCROLL_DAMPING : next
      // 记录速度（px/ms → px/frame）
      velocity = (-delta / dt) * frame
      emit('drag')
    },

    onTouchEnd() {
      if (destroyed || !dragging) return
      dragging = false
      const outOfBounds = offset < options.min || offset > options.max
      if (outOfBounds || Math.abs(velocity) >= MIN_VELOCITY) {
        startLoop()
      } else {
        options.onStop?.(offset)
      }
    },

    scrollTo(target, animated = true) {
      if (destroyed) return
      stopLoop()
      const to = clamp(target)
      if (!animated) {
        offset = to
        emit('momentum')
        options.onStop?.(offset)
        return
      }
      velocity = 0
      // 简化动画：分帧线性趋近
      const animate = () => {
        if (destroyed) return
        const remain = to - offset
        if (Math.abs(remain) < 0.5) {
          offset = to
          stopLoop()
          emit('momentum')
          options.onStop?.(offset)
          return
        }
        offset += remain * 0.35
        emit('momentum')
        timer = setTimeout(animate, frame)
        running = true
      }
      animate()
    },

    stop() {
      stopLoop()
      dragging = false
    },

    destroy() {
      destroyed = true
      stopLoop()
    },
  }

  void dragStartOffset
  return ticker
}

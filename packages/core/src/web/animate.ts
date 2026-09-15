/**
 * 动画调度器（自 v2 _util/animate.js 迁移，仅 Web 端）。
 * 与 v2 差异：rAF 直接使用环境实现，以 setTimeout(16ms) 兜底，
 * 去除非原生 rAF 检测与 setInterval 模拟层。
 */
import { easeInOutCubic, easeOutCubic } from '../animate'

export type EasingMethod = (percent: number) => number
export type StepCallback = (percent: number, now: number, render: boolean) => boolean | void
export type VerifyCallback = (id: number) => boolean
export type CompletedCallback = (droppedFrames: number, animationId: number, finished: boolean) => void

export interface AnimateRunner {
  requestAnimationFrame: (callback: (time: number) => void) => number
  stop: (id: number) => boolean
  isRunning: (id: number) => boolean
  start: (
    stepCallback: StepCallback,
    verifyCallback?: VerifyCallback,
    completedCallback?: CompletedCallback,
    duration?: number,
    easingMethod?: EasingMethod,
    root?: HTMLElement,
  ) => number
}

const DESIRED_FPS = 60
const MS_PER_SECOND = 1000

const requestFrame: (callback: (time: number) => void) => number =
  typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : callback => setTimeout(() => callback(Date.now()), 1000 / DESIRED_FPS) as unknown as number

const Animate: AnimateRunner = (() => {
  let running: Record<number, true | null> = {}
  let counter = 1

  return {
    requestAnimationFrame: callback => requestFrame(callback),

    stop(id) {
      const cleared = running[id] != null
      if (cleared) {
        running[id] = null
      }
      return cleared
    },

    isRunning(id) {
      return running[id] != null
    },

    start(stepCallback, verifyCallback, completedCallback, duration, easingMethod, root) {
      const start = Date.now()
      let lastFrame = start
      let percent = 0
      let dropCounter = 0
      const id = counter++

      const renderRoot = root ?? document.body

      // Compacting running db automatically every few new animations
      if (id % 20 === 0) {
        const newRunning: Record<number, true | null> = {}
        for (const usedId in running) {
          newRunning[usedId] = true
        }
        running = newRunning
      }

      // This is the internal step method which is called every few milliseconds
      const step = (virtual?: boolean) => {
        // Normalize virtual value
        const render = virtual !== true

        // Get current time
        const now = Date.now()

        // Verification is executed before next animation step
        if (!running[id] || (verifyCallback && !verifyCallback(id))) {
          running[id] = null
          completedCallback?.(
            DESIRED_FPS - dropCounter / ((now - start) / MS_PER_SECOND),
            id,
            false,
          )
          return
        }

        // For the current rendering to apply let's update omitted steps in memory.
        // This is important to bring internal state variables up-to-date with progress in time.
        if (render) {
          const droppedFrames = Math.round((now - lastFrame) / (MS_PER_SECOND / DESIRED_FPS)) - 1
          for (let j = 0; j < Math.min(droppedFrames, 4); j++) {
            step(true)
            dropCounter++
          }
        }

        // Compute percent value
        if (duration) {
          percent = (now - start) / duration
          if (percent > 1) {
            percent = 1
          }
        }

        // Execute step callback, then...
        let value = easingMethod ? easingMethod(percent) : percent
        value = isNaN(value) ? 0 : value
        if ((stepCallback(value, now, render) === false || percent === 1) && render) {
          running[id] = null
          completedCallback?.(
            DESIRED_FPS - dropCounter / ((now - start) / MS_PER_SECOND),
            id,
            percent === 1 || duration == null,
          )
        } else if (render) {
          lastFrame = now
          requestFrame(() => step())
        }
      }

      // Mark as running
      running[id] = true

      // Init first step
      requestFrame(() => step())

      // Return unique animation ID
      void renderRoot
      return id
    },
  }
})()

export { Animate as default, Animate, easeOutCubic, easeInOutCubic }

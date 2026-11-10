/**
 * 动画调度器（自 v2 _util/animate.js 迁移，仅 Web 端）。
 * 与 v2 差异：rAF 直接使用环境实现，以 setTimeout(16ms) 兜底；
 * 去除非原生 rAF 检测与 setInterval 模拟层；
 * 运行表压缩只保留仍在运行的动画（v2 会把已 stop 的键复活且从不收缩，v3 修复）；
 * 移除 v2 的 root 参数与 document.body 读取（无 DOM 访问，非浏览器环境可用 setTimeout 兜底）。
 */
import { easeInOutCubic, easeOutCubic } from '../animate'
import { inBrowser } from '../env'

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
  ) => number
}

const DESIRED_FPS = 60
const MS_PER_SECOND = 1000

// 非浏览器环境不探测 globalThis.requestAnimationFrame，直接走 setTimeout 兜底
// （风格与 render.ts 的 inBrowser 守卫一致）
const requestFrame: (callback: (time: number) => void) => number =
  inBrowser && typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : callback => setTimeout(() => callback(Date.now()), 1000 / DESIRED_FPS) as unknown as number

// 模块作用域即私有（不挂到 global），与 v2 的 IIFE 闭包等价
let running: Record<number, true | null> = {}
let counter = 1

const Animate: AnimateRunner = {
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

  start(stepCallback, verifyCallback, completedCallback, duration, easingMethod) {
    const start = Date.now()
    let lastFrame = start
    let percent = 0
    let dropCounter = 0
    const id = counter++

    // Compacting running db automatically every few new animations:
    // 只保留仍在运行的动画，真正收缩 running 表；
    // 已 stop（值为 null）的键被移除，不会在压缩后"复活"。
    if (id % 20 === 0) {
      const newRunning: Record<number, true | null> = {}
      for (const key of Object.keys(running)) {
        const usedId = Number(key)
        if (running[usedId] === true) {
          newRunning[usedId] = true
        }
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
    return id
  },
}

/**
 * @internal 仅供测试与诊断观测运行表规模（压缩后应等于仍在运行的动画数），非公共 API。
 */
export const __animateRunningCount = (): number => Object.keys(running).length

export { Animate as default, Animate, easeOutCubic, easeInOutCubic }

/**
 * 框架无关的通用语言工具（自 v2 _util/lang.js 迁移）。
 * DOM 相关的 requireRemoteScript/getDpr/functionToUrl 移至 ./web/lang.ts。
 */

export function noop(): void {}

function isTestEnv(): boolean {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
}

/**
 * 生成随机 id；测试环境返回空串以保持快照稳定（v2 契约）
 */
export function randomId(prefix = '', length = 8): string {
  return isTestEnv() ? '' : `${prefix}-${parseInt(`${Math.random() * Math.pow(10, length)}`)}`
}

/**
 * kebab-case -> camelCase
 */
export function transformCamelCase(str: string): string {
  return str.replace(/-(\w)/g, (_, $1: string) => $1.toUpperCase())
}

/**
 * 延迟 delay 毫秒后调用 fn，期间重复调用只保留最后一次
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void = noop, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null

  return function debounced(this: unknown, ...args: A) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 每 interval 毫秒内最多调用一次 fn，首次立即触发
 */
export function throttle<A extends unknown[]>(fn: (...args: A) => void = noop, interval = 300) {
  let last = 0

  return function throttled(this: unknown, ...args: A) {
    const now = Date.now()
    if (now - last > interval) {
      last = now
      fn.apply(this, args)
    }
  }
}

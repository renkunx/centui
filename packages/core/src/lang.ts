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

/** 可取消/立即触发的防抖函数（适配层可在组件卸载时调用 cancel 清理） */
export interface Debounced<A extends unknown[]> {
  (...args: A): void
  /** 取消未触发的待执行调用（清除定时器与暂存参数） */
  cancel(): void
  /** 立即执行未触发的待调用（无待调用时为空操作） */
  flush(): void
}

/** 可重置的节流函数 */
export interface Throttled<A extends unknown[]> {
  (...args: A): void
  /** 恢复初始状态（清除上次触发时间记录，下一次调用立即触发） */
  cancel(): void
}

/**
 * 延迟 delay 毫秒后调用 fn，期间重复调用只保留最后一次
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void = noop, delay = 300): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: A | null = null
  let pendingThis: unknown

  const invoke = () => {
    const args = pendingArgs as A
    const ctx = pendingThis
    pendingArgs = null
    fn.apply(ctx, args)
  }

  const debounced = function debounced(this: unknown, ...args: A) {
    pendingArgs = args
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- 保留调用方 this 供 fn.apply，函数表达式无法换成箭头
    pendingThis = this
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      invoke()
    }, delay)
  } as Debounced<A>

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    pendingArgs = null
  }

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
      invoke()
    }
  }

  return debounced
}

/**
 * 每 interval 毫秒内最多调用一次 fn，首次立即触发
 */
export function throttle<A extends unknown[]>(fn: (...args: A) => void = noop, interval = 300): Throttled<A> {
  let last = 0

  const throttled = function throttled(this: unknown, ...args: A) {
    const now = Date.now()
    if (now - last > interval) {
      last = now
      fn.apply(this, args)
    }
  } as Throttled<A>

  throttled.cancel = () => {
    last = 0
  }

  return throttled
}

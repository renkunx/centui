/**
 * 定时器登记表：组件内所有 setTimeout/setInterval 必须经此包装，
 * detached 时统一清理（与 Vue/React 版修复后的标准一致，杜绝卸载后回调）。
 */
export interface TimerRegistry {
  setTimeout(fn: () => void, ms: number): number
  setInterval(fn: () => void, ms: number): number
  clearTimeout(id: number | null | undefined): void
  clearInterval(id: number | null | undefined): void
  clearAll(): void
  size(): number
}

export function createTimerRegistry(ctx?: unknown): TimerRegistry {
  const handles = new Map<number, {type: 'timeout' | 'interval'; handle: number}>()
  let seq = 0

  const registry: TimerRegistry = {
    setTimeout(fn, ms) {
      const id = ++seq
      const handle = setTimeout(() => {
        handles.delete(id)
        fn()
      }, ms)
      handles.set(id, {type: 'timeout', handle: handle as unknown as number})
      return id
    },
    setInterval(fn, ms) {
      const id = ++seq
      const handle = setInterval(fn, ms)
      handles.set(id, {type: 'interval', handle: handle as unknown as number})
      return id
    },
    clearTimeout(id) {
      if (id == null) return
      const entry = handles.get(id)
      if (entry) {
        clearTimeout(entry.handle)
        handles.delete(id)
      }
    },
    clearInterval(id) {
      if (id == null) return
      const entry = handles.get(id)
      if (entry) {
        clearInterval(entry.handle)
        handles.delete(id)
      }
    },
    clearAll() {
      for (const entry of handles.values()) {
        if (entry.type === 'timeout') clearTimeout(entry.handle)
        else clearInterval(entry.handle)
      }
      handles.clear()
    },
    size() {
      return handles.size
    },
  }
  void ctx
  return registry
}

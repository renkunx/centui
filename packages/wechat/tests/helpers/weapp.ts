/**
 * 最小小程序组件桩（node 环境逻辑层测试用）：
 *
 * - 捕获 CuComponent → Component() 的定义对象（组件模块导入时登记到 capturedDefs）
 * - mountDef：以「properties 默认值 + 传入 props」构造实例——data 合并、observers
 *   按 setData 变更键派发（支持 'a, b' 多键与递归触发）、lifetimes attached/ready/
 *   detached 手动驱动、triggerEvent/selectComponent/createSelectorQuery 桩
 *
 * 只覆盖逻辑层（data 流转与事件派发），不渲染 wxml——渲染行为属开发者工具模拟器
 * 范围（PORTING_SPEC.md §10）。挂载语义与真机一致的关键点：
 * - properties 初始值写入 data 但**不触发 observers**（真机行为，多个组件在
 *   attached 里显式补初始派生即依赖此语义）
 * - observers 仅在值实际变化（!==）时触发
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-condition */

export interface WeappDef {
  properties?: Record<string, {value?: unknown; [k: string]: unknown}>
  data?: Record<string, unknown>
  observers?: Record<string, (...args: any[]) => void>
  methods?: Record<string, (...args: any[]) => void>
  lifetimes?: Record<string, (this: any, ...args: any[]) => void>
  options?: Record<string, unknown>
  relations?: Record<string, Record<string, any>>
  [k: string]: unknown
}

export const capturedDefs: WeappDef[] = []

const g = globalThis as any

/** Component() 桩：仅捕获定义（安装一次，vitest 每文件独立模块注册表，无串扰） */
if (!g.__centuiWeappStub) {
  g.__centuiWeappStub = true
  g.Component = (def: WeappDef) => {
    capturedDefs.push(def)
    return def
  }
}

/** wx 桩：覆盖现有组件用到的 API（nextTick 以 setTimeout(0) 近似，受 fake timers 控制） */
if (!g.wx) {
  g.wx = {
    nextTick: (fn: () => void) => setTimeout(fn, 0),
    getDeviceInfo: () => ({platform: 'devtools'}),
    getWindowInfo: () => ({pixelRatio: 2, windowWidth: 375}),
    setStorageSync: () => {},
    getStorageSync: () => '',
  }
}

export interface LoadedComponent<TExports = unknown> {
  def: WeappDef
  exports: TExports
}

/**
 * 动态导入组件模块并取其捕获的定义（模块顶层的 CuComponent 调用即登记）。
 * 同一文件内对同一模块只调用一次（二次导入命中缓存将无法捕获）。
 */
export async function loadComponent<TExports = unknown>(
  importer: () => Promise<TExports>,
): Promise<LoadedComponent<TExports>> {
  const before = capturedDefs.length
  const exports = await importer()
  const fresh = capturedDefs.slice(before)
  const def = fresh[fresh.length - 1]
  if (!def) {
    throw new Error('组件模块未捕获到 Component 定义（模块可能已被缓存导入）')
  }
  return {def, exports}
}

export interface MountOptions {
  props?: Record<string, unknown>
  /** selectComponent 桩（命令式 API / 父子组件场景） */
  selectComponent?: (selector: string) => any
  /** createSelectorQuery 的 boundingClientRect 结果表（key 为选择器；缺省 null） */
  rects?: Record<string, {height?: number; width?: number} | null>
  /** attached/ready 期间 wx.getDeviceInfo().platform 的取值（默认 devtools） */
  platform?: string
}

export interface Mounted {
  def: WeappDef
  data: Record<string, any>
  /** def.methods 的实例视图（this 绑定实例），与 inst.<name> 等价 */
  methods: Record<string, (...args: any[]) => any>
  setData(patch: Record<string, unknown>, cb?: () => void): void
  triggerEvent(name: string, detail?: unknown): void
  /** triggerEvent 收集：[{name, detail}] */
  events: Array<{name: string; detail: unknown}>
  selectComponent(selector: string): any
  createSelectorQuery(): any
  /** 触发 relations linked（手动模拟运行时登记） */
  linkRelation(path: string, target: any): void
  attached(): void
  ready(): void
  detached(): void
  /** 事件名过滤便捷方法 */
  eventsOf(name: string): Array<{name: string; detail: unknown}>
}

export function mountDef(def: WeappDef, opts: MountOptions = {}): Mounted {
  const props = opts.props ?? {}

  // properties 默认值 + 显式 props 合并进 data（初始赋值不触发 observers，真机语义）
  const data: Record<string, any> = {...(def.data ?? {})}
  for (const [key, prop] of Object.entries(def.properties ?? {})) {
    if (prop && typeof prop === 'object' && 'value' in prop) data[key] = (prop as any).value
  }
  for (const [key, val] of Object.entries(props)) data[key] = val

  const events: Mounted['events'] = []
  const observerEntries = Object.entries(def.observers ?? {})
  let depth = 0

  const inst: any = {
    def,
    data,
    events,
    eventsOf(name: string) {
      return events.filter((e) => e.name === name)
    },
    setData(patch: Record<string, unknown>, cb?: () => void) {
      const changed: string[] = []
      for (const [k, v] of Object.entries(patch)) {
        if (data[k] !== v) changed.push(k)
        data[k] = v
      }
      // observers 递归触发（组件 observer 内再 setData）；深度上限防环
      if (depth < 20) {
        depth++
        try {
          fireObservers(changed)
        } finally {
          depth--
        }
      }
      cb?.()
    },
    triggerEvent(name: string, detail?: unknown) {
      events.push({name, detail})
    },
    selectComponent(selector: string) {
      return opts.selectComponent ? opts.selectComponent(selector) : null
    },
    createSelectorQuery() {
      return makeSelectorQuery(opts.rects)
    },
    linkRelation(path: string, target: any) {
      const rel = def.relations?.[path]
      if (rel && typeof rel.linked === 'function') rel.linked.call(inst, target)
    },
    attached() {
      runWithPlatform(() => def.lifetimes?.attached?.call(inst))
    },
    ready() {
      runWithPlatform(() => def.lifetimes?.ready?.call(inst))
    },
    detached() {
      def.lifetimes?.detached?.call(inst)
    },
  }

  function fireObservers(changed: string[]) {
    if (changed.length === 0) return
    for (const [keysStr, fn] of observerEntries) {
      const keys = keysStr.split(',').map((s) => s.trim())
      if (keys.some((k) => changed.includes(k))) {
        ;(fn as any).call(inst, ...keys.map((k) => data[k]))
      }
    }
  }

  function runWithPlatform(fn: () => void) {
    if (opts.platform === undefined) {
      fn()
      return
    }
    const prev = g.wx.getDeviceInfo
    g.wx.getDeviceInfo = () => ({platform: opts.platform})
    try {
      fn()
    } finally {
      g.wx.getDeviceInfo = prev
    }
  }

  for (const [name, fn] of Object.entries(def.methods ?? {})) {
    inst[name] = (fn as any).bind(inst)
  }
  // methods 视图：inst.methods.<name>(...) 与 inst.<name>(...) 等价（this 恒为实例）
  const methodsView: Record<string, (...args: any[]) => any> = {}
  for (const [name, fn] of Object.entries(def.methods ?? {})) {
    methodsView[name] = (...args: any[]) => (fn as any).apply(inst, args)
  }
  inst.methods = methodsView

  return inst as Mounted
}

/** createSelectorQuery 桩：select().boundingClientRect(cb) 收集，exec 汇总回调 */
function makeSelectorQuery(rects: MountOptions['rects']) {
  const list: Array<{selector: string; cb?: (rect: any) => void}> = []
  const query = {
    select(selector: string) {
      return {
        boundingClientRect(cb?: (rect: any) => void) {
          list.push({selector, cb})
          return query
        },
        fields(_fields: Record<string, unknown>) {
          list.push({selector})
          return query
        },
      }
    },
    exec(done?: (results: any[]) => void) {
      const results = list.map(({selector, cb}) => {
        const rect = rects ? rects[selector] ?? null : null
        cb?.(rect)
        return rect
      })
      done?.(results)
      return query
    },
  }
  return query
}

/** 构造 onItemTap 类 dataset 事件（currentTarget.dataset 直传） */
export function tapEvent(dataset: Record<string, unknown>): any {
  return {currentTarget: {dataset}}
}

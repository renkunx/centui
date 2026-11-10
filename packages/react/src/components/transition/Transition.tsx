import { cloneElement, isValidElement, useEffect, useRef, type ReactNode } from 'react'

export interface TransitionProps {
  name?: string
  children?: ReactNode
}

/** 判定是否为无 CSS 过渡能力的环境（jsdom 等）：此时注入进出类无意义且会污染结构快照 */
function supportsCssTransition(): boolean {
  return typeof navigator !== 'undefined' && !/jsdom/i.test(navigator.userAgent)
}

function parseDuration(raw?: string | null): number {
  if (!raw) {
    return 0
  }
  return raw.split(',').reduce((max, part) => {
    const value = parseFloat(part)
    if (Number.isNaN(value)) {
      return max
    }
    return Math.max(max, part.trim().endsWith('ms') ? value : value * 1000)
  }, 0)
}

/**
 * v2 为 functional h('transition') 透传；React 无内置过渡组件。
 *
 * 契约：对单个元素子节点注入 `{name}-enter / {name}-enter-active` 进场类
 * （样式由 @centui/styles 提供，如 cu-fade-enter-active），过渡结束后移除。
 * 无 CSS 过渡能力（jsdom）或子节点非单个元素时退化为直接渲染。
 *
 * 已知限制：离场（leave）过渡需要延迟卸载子节点，透传语义下子节点始终挂载，
 * 故不支持 leave 类切换——需要离场动画请配合条件渲染自行控制。
 */
export function CuTransition({ name, children }: TransitionProps) {
  const child = isValidElement(children) ? children : null
  const hostRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!name || !child || !supportsCssTransition()) {
      return
    }
    const el = hostRef.current
    if (!el) {
      return
    }
    const enter = `${name}-enter`
    const enterActive = `${name}-enter-active`
    el.classList.add(enter, enterActive)
    // 强制 reflow 使 enter 初始态生效，随后移除 enter 触发过渡
    void el.offsetHeight
    let duration: number
    try {
      const style = window.getComputedStyle(el)
      duration = Math.max(parseDuration(style?.transitionDuration), parseDuration(style?.animationDuration))
    } catch {
      duration = 0
    }
    el.classList.remove(enter)
    const timer = setTimeout(
      () => {
        el.classList.remove(enterActive)
      },
      duration > 0 ? duration + 50 : 350,
    )
    return () => {
      clearTimeout(timer)
      el.classList.remove(enter, enterActive)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  if (!child) {
    return <>{children}</>
  }

  // 插槽为单个 DOM 元素时注入宿主 ref（保留原子 ref 语义）；其余保持透传
  const childType = child.type as string | symbol
  if (typeof childType !== 'string') {
    return <>{children}</>
  }
  const originalRef = (child as { ref?: unknown }).ref
  return cloneElement(child as never, {
    ref: (node: HTMLElement | null) => {
      hostRef.current = node
      if (typeof originalRef === 'function') {
        ;(originalRef as (node: HTMLElement | null) => void)(node)
      } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
        ;(originalRef as { current: unknown }).current = node
      }
    },
  })
}

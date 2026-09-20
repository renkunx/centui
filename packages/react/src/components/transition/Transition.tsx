import type { ReactNode } from 'react'

export interface TransitionProps {
  name?: string
  children?: ReactNode
}

/**
 * v2 为 functional h('transition') 透传；React 无内置过渡，
 * 契约为渲染子节点（过渡 CSS 类由使用方按 name 挂接）。
 */
export function CuTransition({ children }: TransitionProps) {
  return <>{children}</>
}

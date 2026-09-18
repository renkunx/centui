import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { randomId } from '@mand-mobile/core'
import { MdTipContent } from './TipContent'

export interface TipProps {
  /** top | left | bottom | right */
  placement?: string
  name?: string | number
  icon?: string
  iconSvg?: boolean
  content?: string | number
  closable?: boolean
  fill?: boolean
  offset?: { top?: number; left?: number }
  children?: ReactNode
  onShow?: (name?: string | number) => void
  onHide?: (name?: string | number) => void
}

/**
 * Tip 包装器：只渲染插槽的第一个元素节点，并在其上追加点击触发；
 * 气泡内容懒创建为游离 DOM（createRoot），绝对定位于第一个可滚动祖先内（v2 契约）。
 */
export function MdTip({
  placement = 'top',
  name,
  icon,
  iconSvg = false,
  content = '',
  closable = true,
  fill = false,
  offset = {},
  children,
  onShow,
  onHide,
}: TipProps) {
  const hostRef = useRef<HTMLElement | null>(null)
  const wrapperRef = useRef<HTMLElement | null>(null)
  const tipRef = useRef<{ container: HTMLElement; root: Root } | null>(null)
  const [, forceRender] = useState(0)

  // 当前渲染的触发元素（无有效插槽时为空）
  const setHostRef = useCallback((node: HTMLElement | null) => {
    hostRef.current = node
  }, [])

  useEffect(() => {
    const el = hostRef.current
    wrapperRef.current = el ? getFirstScrollWrapper(el) : null
    return () => {
      removeTip()
      wrapperRef.current = null
    }
  }, [])

  /**
   * Get the first scrollable parent（v2 契约）
   */
  function getFirstScrollWrapper(node: HTMLElement | null): HTMLElement | null {
    if (node === null || node === document.body) {
      return node
    }
    const overflowY = window.getComputedStyle(node).overflowY
    const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden'
    const isScrollView = node.getAttribute && node.getAttribute('scroll-wrapper') !== null

    if ((isScrollable && node.scrollHeight > node.clientHeight) || isScrollView) {
      return node
    }
    return getFirstScrollWrapper(node.parentNode as HTMLElement | null)
  }

  function getPosition(node: HTMLElement, wrapper: HTMLElement | null): { x: number; y: number } {
    let x = 0
    let y = 0
    let el: HTMLElement | null = node
    while (el) {
      x += el.offsetLeft
      y += el.offsetTop
      if (el === wrapper || el === document.body || el === null) {
        break
      }
      el = el.offsetParent as HTMLElement | null
    }
    return { x, y }
  }

  function getOrNewTip() {
    if (tipRef.current) {
      return tipRef.current
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    tipRef.current = { container, root }
    return tipRef.current
  }

  function removeTip() {
    if (tipRef.current?.container.parentNode) {
      tipRef.current.container.parentNode.removeChild(tipRef.current.container)
    }
  }

  /**
   * Calculate the position of tip（v2 布局算法）
   */
  function layout(referenceEl: HTMLElement) {
    const tip = tipRef.current
    if (!tip) {
      return
    }
    const tipEl = tip.container.firstElementChild as HTMLElement | null
    if (!tipEl) {
      return
    }
    const delta = getPosition(referenceEl, wrapperRef.current)
    const offsetTop = offset.top || 0
    const offsetLeft = offset.left || 0

    let tipElWidth = tipEl.offsetWidth
    let tipElHeight = tipEl.offsetHeight
    let cssText = ''

    if (fill && (placement === 'top' || placement === 'bottom')) {
      tipElWidth = referenceEl.offsetWidth
      cssText += `width: ${tipElWidth}px;`
    }
    if (fill && (placement === 'left' || placement === 'right')) {
      tipElHeight = referenceEl.offsetHeight
      cssText += `height: ${tipElHeight}px;`
    }

    switch (placement) {
      case 'left':
        delta.y += (referenceEl.offsetHeight - tipElHeight) / 2
        delta.x -= tipElWidth + 10
        break
      case 'right':
        delta.y += (referenceEl.offsetHeight - tipElHeight) / 2
        delta.x += referenceEl.offsetWidth + 10
        break
      case 'bottom':
        delta.y += referenceEl.offsetHeight + 10
        delta.x += (referenceEl.offsetWidth - tipElWidth) / 2
        break
      default:
        delta.y -= tipElHeight + 10
        delta.x += (referenceEl.offsetWidth - tipElWidth) / 2
        break
    }

    cssText += `position: absolute; top: ${delta.y + offsetTop}px; left: ${delta.x + offsetLeft}px;`
    tipEl.style.cssText = cssText
  }

  /**
   * Do the magic, show me your tip
   */
  function show() {
    const tip = getOrNewTip()
    const referenceEl = hostRef.current
    if (!referenceEl) {
      return
    }

    flushSync(() => {
      tip.root.render(
        <MdTipContent
          icon={icon}
          iconSvg={iconSvg}
          placement={placement}
          content={content}
          closable={closable}
          name={name ?? randomId('tip')}
          onClose={hide}
        />,
      )
    })

    if (wrapperRef.current && tip.container.parentNode !== wrapperRef.current) {
      wrapperRef.current.appendChild(tip.container)
    }

    layout(referenceEl)
    forceRender(n => n + 1)
    onShow?.(name)
  }

  /**
   * Hide tip
   */
  function hide() {
    const tip = tipRef.current
    if (tip?.container.parentNode) {
      tip.container.parentNode.removeChild(tip.container)
      onHide?.(name)
    }
  }

  // 只渲染第一个元素节点并注入点击触发（v2 契约）
  const child = Array.isArray(children) ? children.find(isValidElement) : isValidElement(children) ? children : null

  if (!child) {
    return null
  }

  const childProps = child.props as { onClick?: (...args: unknown[]) => void }
  // 插槽首个元素注入触发与 host 引用（DOM 元素场景）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cloneElement(child as any, {
    ref: setHostRef,
    onClick: (...args: unknown[]) => {
      show()
      childProps.onClick?.(...args)
    },
  })
}

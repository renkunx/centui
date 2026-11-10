/**
 * tip 纯逻辑（对照 Vue 版 Tip.vue layout() 与 TipContent.vue wrapperCls）
 */

export type TipPlacement = 'top' | 'left' | 'bottom' | 'right'

export interface TipRect {
  width: number
  height: number
}

export interface TipViewportRect extends TipRect {
  left: number
  top: number
}

export interface TipOffset {
  top?: number
  left?: number
}

/**
 * Vue layout() 的 fixed 定位移植：delta 以触发元素（组件根）视口坐标为基准。
 * fill：placement top/bottom 时气泡宽 = 触发元素宽；left/right 时高 = 触发元素高。
 * 10px 间隙为 Vue 源字面量（tip.styl 箭头同值），px 为视口像素（boundingClientRect 同标度）。
 */
export function computeTipStyle(
  placement: TipPlacement,
  refRect: TipViewportRect,
  tipRect: TipRect,
  offset: TipOffset | undefined,
  fill: boolean,
): string {
  const offsetTop = offset?.top || 0
  const offsetLeft = offset?.left || 0

  let tipWidth = tipRect.width
  let tipHeight = tipRect.height
  let css = ''

  if (fill && (placement === 'top' || placement === 'bottom')) {
    tipWidth = refRect.width
    css += `width:${tipWidth}px;`
  }
  if (fill && (placement === 'left' || placement === 'right')) {
    tipHeight = refRect.height
    css += `height:${tipHeight}px;`
  }

  let x = refRect.left
  let y = refRect.top

  switch (placement) {
    case 'left':
      y += (refRect.height - tipHeight) / 2
      x -= tipWidth + 10
      break
    case 'right':
      y += (refRect.height - tipHeight) / 2
      x += refRect.width + 10
      break
    case 'bottom':
      y += refRect.height + 10
      x += (refRect.width - tipWidth) / 2
      break
    default:
      y -= tipHeight + 10
      x += (refRect.width - tipWidth) / 2
      break
  }

  css += `position:fixed;top:${y + offsetTop}px;left:${x + offsetLeft}px;`
  return css
}

/** TipContent.vue wrapperCls：has-close / is-${placement}(left|bottom|right) / name */
export function buildWrapperCls(
  closable: boolean,
  placement: string,
  name: string | number | undefined,
): string {
  const cls: string[] = []
  if (closable) cls.push('has-close')
  if (['left', 'bottom', 'right'].includes(placement)) cls.push(`is-${placement}`)
  if (name !== undefined && name !== null && `${name}` !== '') cls.push(String(name))
  return cls.join(' ')
}

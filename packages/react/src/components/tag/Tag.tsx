import { useEffect, useRef, useState, type ReactNode } from 'react'
import { transformCamelCase } from '@mand-mobile/core'

export interface TagProps {
  /** tiny | small | large */
  size?: string
  /** square | circle | fillet | quarter | coupon | bubble */
  shape?: string
  /** top-left | top-right | bottom-left | bottom-right */
  sharp?: string
  /** fill | ghost */
  type?: string
  fillColor?: string
  /** normal | bold | bolder */
  fontWeight?: string
  fontColor?: string
  children?: ReactNode
}

const BASE_CLASSES = (size: string, shape: string, type: string, fontWeight: string) =>
  ['default', `size-${size}`, `shape-${shape}`, `type-${type}`, `font-weight-${fontWeight}`]

export function MdTag({
  size = 'large',
  shape = 'square',
  sharp = '',
  type = 'ghost',
  fillColor = '',
  fontWeight = 'normal',
  fontColor = '',
  children,
}: TagProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const [sizeStyle, setSizeStyle] = useState<Record<string, string>>({})

  const colorStyle: Record<string, string> = {}
  if (type === 'fill' && fillColor) {
    colorStyle.background = fillColor
  }
  if (fontColor) {
    if (type === 'ghost') {
      colorStyle.borderColor = fontColor
    }
    colorStyle.color = fontColor
  }

  // v2 契约：circle 形状按渲染高度计算 padding/圆角（等下一帧布局完成后测量）
  useEffect(() => {
    if (shape !== 'circle') {
      return
    }
    const el = elRef.current
    if (!el) {
      return
    }
    // 下一帧布局后测量（jsdom 中高度恒为 0，与 v2 行为一致得到 0px）
    const timer = setTimeout(() => {
      const target = elRef.current
      if (!target) {
        return
      }
      const radius = target.offsetHeight / 2
      const next: Record<string, string> = {
        paddingLeft: radius + 'px',
        paddingRight: radius + 'px',
        borderRadius: radius + 'px',
      }
      if (sharp) {
        next[transformCamelCase(`border-${sharp}-radius`)] = '0'
      }
      setSizeStyle(next)
    }, 0)
    return () => clearTimeout(timer)
  }, [shape, sharp])

  const classes = BASE_CLASSES(size, shape, type, fontWeight).join(' ')

  if (shape === 'quarter') {
    return (
      <div className="md-tag">
        <div className={classes}>
          <div className="quarter-content">{children}</div>
          <div className="quarter-bg" style={colorStyle}></div>
        </div>
      </div>
    )
  }
  if (shape === 'coupon') {
    const notch = fillColor
      ? (side: 'left' | 'right') =>
          `radial-gradient(circle at ${side}, transparent 33%, ${fillColor} 33%)`
      : undefined
    return (
      <div className="md-tag">
        <div className={classes}>
          <div className="coupon-container" style={colorStyle}>
            <div
              className="left-coupon"
              style={notch ? { background: notch('left') } : undefined}
            ></div>
            {children}
            <div
              className="right-coupon"
              style={notch ? { background: notch('right') } : undefined}
            ></div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="md-tag">
      <div ref={elRef} className={classes} style={{ ...colorStyle, ...sizeStyle }}>
        {children}
      </div>
    </div>
  )
}

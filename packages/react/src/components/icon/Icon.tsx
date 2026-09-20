import { useEffect, type CSSProperties } from 'react'
import { loadSprite } from './load-sprite'

export interface IconProps {
  /** 图标名（svg sprite id 或字体图标类名） */
  name: string
  /** xss | xs | sm | md | lg */
  size?: string
  color?: string
  /** true 渲染 svg sprite，false 渲染 icon font */
  svg?: boolean
  onClick?: (event: React.MouseEvent) => void
  style?: CSSProperties
  className?: string
}

export function CuIcon({
  name,
  size = 'md',
  color = '',
  svg = true,
  onClick,
  style,
  className,
}: IconProps) {
  useEffect(() => {
    loadSprite()
  }, [])

  if (svg) {
    return (
      <svg
        className={['cu-icon', 'icon-svg', `cu-icon-${name}`, size, className]
          .filter(Boolean)
          .join(' ')}
        style={{ fill: color, ...style }}
        onClick={onClick}
      >
        <use xlinkHref={`#${name}`} />
      </svg>
    )
  }
  if (!name) {
    return null
  }
  return (
    <i
      className={['cu-icon', 'icon-font', `cu-icon-${name}`, name, size, className]
        .filter(Boolean)
        .join(' ')}
      style={{ color, ...style }}
      onClick={onClick}
    />
  )
}

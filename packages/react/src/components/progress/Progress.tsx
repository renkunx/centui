import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animate } from '@centui/core/web'
import { CuRoller } from '../activity-indicator/Roller'

export interface ProgressProps {
  size?: number
  width?: number
  color?: string
  borderColor?: string
  fill?: string
  linecap?: 'butt' | 'round' | 'square' | 'inherit'
  rotate?: number
  /** 进度控制 0-1 */
  value?: number
  transition?: boolean
  duration?: number
  children?: ReactNode
  defsSlot?: ReactNode
  className?: string
}

const inBrowser = typeof window !== 'undefined'

export function CuProgress({
  size = 70,
  width,
  color = '#2F86F6',
  borderColor = 'rgba(0, 0, 0, .1)',
  fill = 'transparent',
  linecap = 'round',
  rotate = 0,
  value = 0,
  transition = false,
  duration = 1000,
  children,
  defsSlot,
  className,
}: ProgressProps) {
  // v2 watch immediate 契约：初始渲染即持 value
  const [formatValue, setFormatValue] = useState(value)
  const isMounted = useRef(false)
  const animRef = useRef<{ from: number; to: number } | null>(null)

  // v2 契约：非过渡直接赋值；transition 时经 rAF 过渡
  useEffect(() => {
    if ((!inBrowser && !isMounted.current) || !transition) {
      setFormatValue(value)
      return
    }
    animRef.current = { from: formatValue, to: value }
    Animate.start(
      percent => {
        const anim = animRef.current
        if (!anim) {
          return
        }
        setFormatValue(anim.from + (anim.to - anim.from) * percent)
      },
      () => true,
      () => {},
      duration,
    )
  }, [value])

  useEffect(() => {
    isMounted.current = true
  }, [])

  return (
    <CuRoller
      size={size}
      width={width}
      color={color}
      borderColor={borderColor}
      fill={fill}
      linecap={linecap}
      rotate={rotate}
      process={formatValue}
      defsSlot={defsSlot}
      className={`cu-progress${className ? ` ${className}` : ''}`}
    >
      {children}
    </CuRoller>
  )
}

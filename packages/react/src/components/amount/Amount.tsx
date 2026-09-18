import { useEffect, useRef, useState } from 'react'
import { formatNumberWithSeparator, numberToChineseCapital, toFixedPrecision } from '@mand-mobile/core'
import { Animate } from '@mand-mobile/core/web'

export interface AmountProps {
  value?: number
  precision?: number
  isRoundUp?: boolean
  hasSeparator?: boolean
  separator?: string
  isAnimated?: boolean
  /** v2 遗留别名，等价于 isAnimated 的过渡开关 */
  transition?: boolean
  isCapital?: boolean
  duration?: number
}

const inBrowser = typeof window !== 'undefined'

export function MdAmount({
  value = 0,
  precision = 2,
  isRoundUp = true,
  hasSeparator = false,
  separator = ',',
  isAnimated = false,
  transition = false,
  isCapital = false,
  duration = 1000,
}: AmountProps) {
  // v2 watch immediate 契约：初始渲染即持 value
  const [displayValue, setDisplayValue] = useState(value)
  const isMounted = useRef(false)
  const animateRef = useRef<{ from: number; to: number } | null>(null)

  const legalPrecision = precision > 0 ? precision : 0

  // v2 契约：value 变化时非动画直接赋值，动画模式经 rAF 过渡收敛
  useEffect(() => {
    if (!inBrowser && !isMounted.current) {
      setDisplayValue(value)
      return
    }
    if (isAnimated || transition) {
      animateRef.current = { from: displayValue, to: value }
      Animate.start(percent => {
        const anim = animateRef.current
        if (!anim) {
          return
        }
        if (percent === 1) {
          setDisplayValue(anim.to)
          return
        }
        setDisplayValue(anim.from + (anim.to - anim.from) * percent)
      }, () => true, () => {}, duration)
    } else {
      setDisplayValue(value)
    }
  }, [value])

  useEffect(() => {
    isMounted.current = true
  }, [])

  const formatted = toFixedPrecision(displayValue, legalPrecision, isRoundUp)
  const text = isCapital
    ? numberToChineseCapital(toFixedPrecision(displayValue, 4, isRoundUp))
    : hasSeparator
      ? formatNumberWithSeparator(formatted, separator)
      : formatted

  return (
    <span className={`md-amount${isCapital ? '' : ' numerical'}`}>
      {isCapital ? ` ${text} ` : text}
    </span>
  )
}

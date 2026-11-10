import { useEffect, useRef, useState } from 'react'
import { formatNumberWithSeparator, numberToChineseCapital, toFixedPrecision } from '@centui/core'
import { Animate } from '@centui/core/web'

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

export function CuAmount({
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
  const animIdRef = useRef<number | null>(null)
  // 动画起点需取「当前正在显示的值」，用 ref 镜像避免把 displayValue 放进 effect 依赖
  const displayValueRef = useRef(value)
  displayValueRef.current = displayValue

  const legalPrecision = precision > 0 ? precision : 0

  const stopAnimation = () => {
    if (animIdRef.current != null) {
      Animate.stop(animIdRef.current)
      animIdRef.current = null
    }
  }

  // v2 契约：value 变化时非动画直接赋值，动画模式经 rAF 过渡收敛
  // （修复：动画重入先 stop 旧动画，避免并发 rAF 竞争最终显示值；卸载时停止）
  useEffect(() => {
    if (!inBrowser && !isMounted.current) {
      setDisplayValue(value)
      return
    }
    if (isAnimated || transition) {
      stopAnimation()
      animateRef.current = { from: displayValueRef.current, to: value }
      // animIdRef 始终持有最新动画 id（结束后的残留 id 对 Animate.stop 是无害 no-op）
      animIdRef.current = Animate.start(
        percent => {
          const anim = animateRef.current
          if (!anim) {
            return
          }
          if (percent === 1) {
            setDisplayValue(anim.to)
            return
          }
          setDisplayValue(anim.from + (anim.to - anim.from) * percent)
        },
        () => true,
        () => {},
        duration,
      )
    } else {
      stopAnimation()
      setDisplayValue(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isAnimated, transition, duration])

  useEffect(() => {
    isMounted.current = true
  }, [])

  // 卸载兜底：终止在飞的 rAF 动画
  useEffect(
    () => () => {
      stopAnimation()
    },
    [],
  )

  const formatted = toFixedPrecision(displayValue, legalPrecision, isRoundUp)
  const text = isCapital
    ? numberToChineseCapital(toFixedPrecision(displayValue, 4, isRoundUp))
    : hasSeparator
      ? formatNumberWithSeparator(formatted, separator)
      : formatted

  return (
    <span className={`cu-amount${isCapital ? '' : ' numerical'}`}>
      {isCapital ? ` ${text} ` : text}
    </span>
  )
}

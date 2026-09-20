import { forwardRef, useEffect, useRef, useState } from 'react'
import { Scroller } from '@centui/core/web'
import { throttle } from '@centui/core'

export interface RulerProps {
  value?: number
  scope?: number[]
  step?: number
  unit?: number
  min?: number
  max?: number
  /** top | bottom */
  stepTextPosition?: 'top' | 'bottom'
  stepTextRender?: (step: number) => string | number | undefined | null
  onChange?: (value: number) => void
}

const CLIENT_HEIGHT = 60
const RATIO = 2
const BLANK = 30

export const CuRuler = forwardRef<HTMLDivElement, RulerProps>(function CuRuler(
  {
    value = 0,
    scope = [0, 100],
    step = 10,
    unit = 1,
    min = 0,
    max = 100,
    stepTextPosition = 'top',
    stepTextRender,
    onChange,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const scrollerRef = useRef<Scroller | null>(null)

  // v2 用实例字段记录拖拽/滚动状态（window 监听器需读实时值）
  const isDraggingRef = useRef(false)
  const isInitialedRef = useRef(false)
  const isInitialed = false
  const [isScrolling, setIsScrolling] = useState(false)
  const isScrollingRef = useRef(isScrolling)
  isScrollingRef.current = isScrolling

  const xRef = useRef(0)
  const scrollingXRef = useRef(0)

  const stateRef = useRef({ scope, step, unit, min, max, stepTextPosition, stepTextRender, onChange })
  stateRef.current = { scope, step, unit, min, max, stepTextPosition, stepTextRender, onChange }

  const unitCount = Math.ceil((scope[1] - scope[0]) / unit)
  const canvasWidth = (canvasRef.current?.clientWidth ?? 0) * RATIO

  const realMin = (() => {
    const [left, right] = scope
    if (min > right) {
      return left
    }
    return min > left ? min : left
  })()

  const realMax = (() => {
    const [left, right] = scope
    if (left > max) {
      return right
    }
    return max > right ? right : max
  })()

  const blankLeft = Math.ceil((realMin - scope[0]) / unit) * BLANK
  const blankRight = Math.ceil((scope[1] - realMax) / unit) * BLANK
  const isStepTextBottom = stepTextPosition === 'bottom'

  // v2 watch value：非滚动状态下重绘定位
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      if (isScrollingRef.current) {
        return
      }
      scrollingXRef.current = 0
      setIsScrolling(true)
      const nextX = initXRef.current()
      drawRef.current(nextX)
      scrollerRef.current?.scrollTo(nextX, 0, true)
    }
  }, [value])

  useEffect(() => {
    // jsdom 无 canvas 实现：ctx 为 null 时跳过绘制，仅保留交互骨架
    ctxRef.current = canvasRef.current?.getContext('2d') ?? null

    if (ctxRef.current) {
      const cv = canvasRef.current!
      cv.width = canvasWidth
      cv.height = CLIENT_HEIGHT * RATIO
      ctxRef.current.scale(1 / RATIO, 1)
    }

    xRef.current = canvasWidth

    const sc = new Scroller(
      (left) => {
        if (isInitialed) {
          drawThrottledRef.current(left)
        } else {
          drawRef.current(left)
        }
      },
      {
        scrollingX: true,
        scrollingY: false,
        snapping: true,
        snappingVelocity: 1,
        animationDuration: 200,
        inRequestAnimationFrame: true,
        scrollingComplete: () => {
          setIsScrolling(false)
        },
      },
    )

    const innerWidth = unitCount * BLANK + canvasWidth - blankLeft - blankRight
    const nextX = initXRef.current()
    drawRef.current(nextX)
    sc.setDimensions(canvasWidth, CLIENT_HEIGHT, innerWidth, CLIENT_HEIGHT)
    sc.setSnapSize(BLANK, 0)
    sc.scrollTo(nextX, 0, false)

    scrollerRef.current = sc
    isInitialedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initXRef = useRef<() => number>(() => 0)
  initXRef.current = () => {
    const { stepTextRender: _s, onChange: _o, ...rest } = stateRef.current
    const [scopeMin] = rest.scope
    const uc = Math.ceil((rest.scope[1] - rest.scope[0]) / rest.unit)
    const cw = (canvasRef.current?.clientWidth ?? 0) * RATIO
    const rMin = (() => {
      const [left, right] = rest.scope
      if (rest.min > right) {
        return left
      }
      return rest.min > left ? rest.min : left
    })()
    const rMax = (() => {
      const [left, right] = rest.scope
      if (left > rest.max) {
        return right
      }
      return rest.max > right ? right : rest.max
    })()

    xRef.current = cw - Math.ceil((rMin - scopeMin) / rest.unit) * BLANK

    if (value <= rMin) {
      return 0
    } else if (value >= rMax) {
      return uc * BLANK
    } else {
      return Math.ceil((value - rMin) / rest.unit) * BLANK
    }
  }

  const drawRef = useRef<(left: number) => void>(() => {})
  drawRef.current = (leftRaw: number) => {
    const ctx = ctxRef.current
    if (!ctx) {
      return
    }
    const left = +leftRaw.toFixed(2)
    const cw = (canvasRef.current?.clientWidth ?? 0) * RATIO

    scrollingXRef.current = left
    xRef.current += scrollingXRef.current - left

    const scale = RATIO * RATIO
    ctx.clearRect(0, 0, cw * scale, CLIENT_HEIGHT * scale)

    drawLine()
  }

  const drawThrottledRef = useRef<(left: number) => void>(() => {})
  drawThrottledRef.current = (left: number) => {
    throttleRefHelper(left)
  }
  const throttleRefHelper = (left: number) => {
    throttledDraw(left)
  }
  const throttledDraw = throttle((left: number) => drawRef.current(left), 10)

  function drawLine() {
    const ctx = ctxRef.current
    if (!ctx) {
      return
    }
    const { scope: scopeProp, step: stepProp, unit: unitProp, stepTextRender: render } = stateRef.current
    const [scopeLeft] = scopeProp

    const fontSize = 22
    const bottom = stepTextPosition === 'bottom'
    const y = 120 - (bottom ? fontSize + 40 : 0)
    const stepUnit = Math.round(stepProp / unitProp)
    const cw = (canvasRef.current?.clientWidth ?? 0) * RATIO

    ctx.lineWidth = 2
    ctx.font = `${fontSize * RATIO}px DIDIFD-Medium, "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif`

    for (let i = 0; i <= unitCount; i++) {
      const cx = xRef.current + i * BLANK

      if (cx < 0 || cx > cw * 2) {
        continue
      }

      const outRange = cx < xRef.current + blankLeft || cx > xRef.current + 1 + unitCount * BLANK - blankRight
      if (outRange) {
        ctx.fillStyle = '#E2E4EA'
        ctx.strokeStyle = '#E2E4EA'
      } else {
        ctx.fillStyle = '#C5CAD5'
        ctx.strokeStyle = '#858B9C'
      }

      ctx.beginPath()
      ctx.moveTo(cx, y)

      if (i % stepUnit === 0) {
        const stepValue = scopeLeft + unitProp * i
        const match = render?.(stepValue)
        const text = match !== undefined && match !== null ? match : stepValue
        const textOffset = (String(text).length * fontSize) / 2
        ctx.fillText(String(text), cx - textOffset, fontSize * RATIO + (bottom ? 70 : 0))

        ctx.lineTo(cx, y - 40)
      } else {
        ctx.lineTo(cx, y - 20)
      }
      ctx.stroke()
    }

    ctx.strokeStyle = '#E2E4EA'
    ctx.beginPath()
    ctx.moveTo(xRef.current, y)
    ctx.lineTo(xRef.current + unitCount * BLANK, y)
    ctx.stroke()

    updateValue()
  }

  function updateValue() {
    if (!isInitialedRef.current) {
      return
    }
    const { scope: scopeProp, onChange: cb } = stateRef.current
    const [scopeMin] = scopeProp

    if (xRef.current > canvasWidth) {
      cb?.(realMin)
      return
    }

    const absX = xRef.current >= 0 ? Math.abs(xRef.current - canvasWidth) : Math.abs(xRef.current) + canvasWidth
    let value0 = scopeMin + Math.round(absX / BLANK) * unit
    if (value0 > realMax) value0 = realMax
    if (value0 < realMin) value0 = realMin
    cb?.(value0)
  }

  const dragState = useRef({ onDrag: null as null | ((e: TouchEvent) => void), onStop: null as null | ((e: TouchEvent) => void) })

  const startDrag = (event: React.TouchEvent) => {
    if (isDraggingRef.current) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    scrollerRef.current?.doTouchStart(
      event.touches ? Array.from(event.touches) : [],
      event.timeStamp,
    )

    isDraggingRef.current = true
    setIsScrolling(true)

    const onDrag = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDraggingRef.current) {
        return
      }
      scrollerRef.current?.doTouchMove(
        Array.from(e.touches),
        e.timeStamp,
        (e as TouchEvent & { scale?: number }).scale,
      )
    }
    const onStop = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      isDraggingRef.current = false
      scrollerRef.current?.doTouchEnd(e.timeStamp)
      window.removeEventListener('touchmove', onDrag)
      window.removeEventListener('touchend', onStop)
    }
    dragState.current.onDrag = onDrag
    dragState.current.onStop = onStop
    window.addEventListener('touchmove', onDrag)
    window.addEventListener('touchend', onStop)
  }

  return (
    <div className="cu-ruler" ref={ref} onTouchStart={startDrag}>
      <canvas ref={canvasRef} className="cu-ruler-canvas"></canvas>
      <div className={`cu-ruler-cursor${isStepTextBottom ? ' cu-ruler-cursor-bottom' : ''}`}></div>
      <div className="cu-ruler-arrow"></div>
    </div>
  )
})

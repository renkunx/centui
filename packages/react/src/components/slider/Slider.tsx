import { useEffect, useRef, useState } from 'react'

export interface SliderProps {
  value?: number | Array<number>
  min?: number
  max?: number
  step?: number
  range?: boolean
  format?: (val: number) => number | string
  disabled?: boolean
  onChange?: (value: number | Array<number>) => void
}

type Values = [number, number]

function normalize(newVal: number | number[], cur: Values, min: number, max: number, step: number): Values | null {
  const newValues: [number | undefined, number | undefined] = [
    undefined as number | undefined,
    undefined as number | undefined,
  ]
  if (Array.isArray(newVal)) {
    newValues[0] = newVal[0]
    newValues[1] = newVal[1]
  } else {
    newValues[0] = newVal
  }
  if (typeof newValues[0] !== 'number') {
    newValues[0] = cur[0]
  } else {
    newValues[0] = Math.round((newValues[0] - min) / step) * step + min
  }
  if (typeof newValues[1] !== 'number') {
    newValues[1] = cur[1]
  } else {
    newValues[1] = Math.round((newValues[1] - min) / step) * step + min
  }
  if (newValues[0]! < min) {
    newValues[0] = min
  }
  if (newValues[1]! > max) {
    newValues[1] = max
  }
  if (newValues[0]! > newValues[1]!) {
    if (newValues[0] === cur[0]) {
      newValues[1] = newValues[0]
    } else {
      newValues[0] = newValues[1]
    }
  }
  if (cur[0] === newValues[0] && cur[1] === newValues[1]) {
    return null
  }
  return [newValues[0]!, newValues[1]!]
}

export function CuSlider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  range = false,
  format,
  disabled = false,
  onChange,
}: SliderProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const valuesRef = useRef<Values>([min, max])
  const [values, setValues] = useState<Values>(() => {
    const first = normalize(value, valuesRef.current, min, max, step)
    return first ?? [min, max]
  })
  valuesRef.current = values

  const [isDragging, setIsDragging] = useState(false)
  const [isDragingUpper, setIsDragingUpper] = useState(false)
  // v2 契约：isDragging 同步生效（拖拽 window 监听器在下一个渲染前就可能触发）
  const isDraggingRef = useRef(false)
  const isDragingUpperRef = useRef(false)

  const startDragMousePos = useRef(0)
  const startVal = useRef(0)
  const lowerNodeRef = useRef<HTMLSpanElement | null>(null)
  const upperNodeRef = useRef<HTMLSpanElement | null>(null)
  const activeHandlersRef = useRef<{
    drag: (event: MouseEvent | TouchEvent) => void
    up: (event: Event) => void
  } | null>(null)

  // onChange ref-mirror：拖拽期间注册的原生监听器始终调用最新回调
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // v2 watch value：外部值变化 → 归一化（拖拽中忽略自身派发引起的回环）
  useEffect(() => {
    if (isDraggingRef.current) {
      return
    }
    const next = normalize(value, valuesRef.current, min, max, step)
    if (next) {
      setValues(next)
    }
  }, [value])

  const lowerHandlePosition = ((values[0] - min) / (max - min)) * 100
  const upperHandlePosition = ((values[1] - min) / (max - min)) * 100
  const barStyle = range
    ? { width: ((values[1] - values[0]) / (max - min)) * 100 + '%', left: lowerHandlePosition + '%' }
    : { width: ((values[0] - min) / (max - min)) * 100 + '%' }

  const commit = (next: Values) => {
    if (range) {
      onChangeRef.current?.(next)
    } else {
      onChangeRef.current?.(next[0])
    }
  }

  function bindDragListeners() {
    // 拖拽期间注册的 handler 原地固化在 ref 中，卸载/停止时按同一身份移除
    activeHandlersRef.current = { drag: onDrag, up: onUp }
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('touchmove', onDrag, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
  }

  function unbindDragListeners() {
    const active = activeHandlersRef.current
    if (active) {
      window.removeEventListener('mousemove', active.drag)
      window.removeEventListener('touchmove', active.drag)
      window.removeEventListener('mouseup', active.up)
      window.removeEventListener('touchend', active.up)
      activeHandlersRef.current = null
    }
  }

  const startLowerDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const point = ('changedTouches' in e && e.changedTouches ? e.changedTouches[0] : e) as unknown as MouseEvent
    startDragMousePos.current = point.pageX
    startVal.current = valuesRef.current[0]
    isDragingUpperRef.current = false
    isDraggingRef.current = true
    setIsDragingUpper(false)
    setIsDragging(true)
    unbindDragListeners()
    bindDragListeners()
  }

  const startUpperDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const point = ('changedTouches' in e && e.changedTouches ? e.changedTouches[0] : e) as unknown as MouseEvent
    startDragMousePos.current = point.pageX
    startVal.current = valuesRef.current[1]
    isDragingUpperRef.current = true
    isDraggingRef.current = true
    setIsDragingUpper(true)
    setIsDragging(true)
    unbindDragListeners()
    bindDragListeners()
  }

  function onDrag(e: MouseEvent | TouchEvent) {
    if (disabled || !isDraggingRef.current) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const point =
      'changedTouches' in e && (e as TouchEvent).changedTouches
        ? (e as TouchEvent).changedTouches[0]
        : (e as MouseEvent)
    window.requestAnimationFrame(() => {
      const diff = ((point.pageX - startDragMousePos.current) / (elRef.current?.offsetWidth ?? 1)) * (max - min)
      const nextVal = startVal.current + diff
      if (!isDraggingRef.current) {
        return
      }
      const next = isDragingUpperRef.current
        ? normalize([null as unknown as number, nextVal], valuesRef.current, min, max, step)
        : normalize([nextVal, null as unknown as number], valuesRef.current, min, max, step)
      if (next) {
        setValues(next)
        commit(next)
      }
    })
  }

  function onUp(e: Event) {
    e.preventDefault()
    e.stopPropagation()
    stopDrag()
  }

  function stopDrag() {
    unbindDragListeners()
    isDraggingRef.current = false
    isDragingUpperRef.current = false
    setIsDragging(false)
    setIsDragingUpper(false)
  }

  // S2：handle 的 touchstart 需非 passive 才能 preventDefault 阻断页面滚动
  const lowerTouchStartRef = useRef<(event: TouchEvent) => void>(() => {})
  lowerTouchStartRef.current = (event: TouchEvent) => {
    event.preventDefault()
    event.stopPropagation()
    startLowerDrag(event as unknown as React.TouchEvent)
  }
  const upperTouchStartRef = useRef<(event: TouchEvent) => void>(() => {})
  upperTouchStartRef.current = (event: TouchEvent) => {
    event.preventDefault()
    event.stopPropagation()
    startUpperDrag(event as unknown as React.TouchEvent)
  }
  const lowerNativeStart = useRef((event: TouchEvent) => lowerTouchStartRef.current(event)).current
  const upperNativeStart = useRef((event: TouchEvent) => upperTouchStartRef.current(event)).current

  const setLowerNode = (node: HTMLSpanElement | null) => {
    if (lowerNodeRef.current) {
      lowerNodeRef.current.removeEventListener('touchstart', lowerNativeStart)
    }
    lowerNodeRef.current = node
    if (node) {
      node.addEventListener('touchstart', lowerNativeStart, { passive: false })
    }
  }
  const setUpperNode = (node: HTMLSpanElement | null) => {
    if (upperNodeRef.current) {
      upperNodeRef.current.removeEventListener('touchstart', upperNativeStart)
    }
    upperNodeRef.current = node
    if (node) {
      node.addEventListener('touchstart', upperNativeStart, { passive: false })
    }
  }

  // 卸载兜底：拖拽中卸载时按注册身份移除 window 监听器
  useEffect(
    () => () => {
      unbindDragListeners()
    },
    [],
  )

  const formatHint = (val: number) => (format ? format(val) : val)

  return (
    <div className={`cu-slider${disabled ? ' is-disabled' : ''}`} ref={elRef}>
      {range ? (
        <>
          <div className="cu-slider-bar" style={barStyle}></div>
          <div
            className={`cu-slider-handle is-lower${isDragging && !isDragingUpper ? ' is-active' : ''}`}
            data-hint={String(formatHint(values[0]))}
            style={{ left: lowerHandlePosition + '%' }}
          >
            <span ref={setLowerNode} onMouseDown={startLowerDrag}></span>
          </div>
          <div
            className={`cu-slider-handle is-higher${isDragging && isDragingUpper ? ' is-active' : ''}`}
            data-hint={String(formatHint(values[1]))}
            style={{ left: upperHandlePosition + '%' }}
          >
            <span ref={setUpperNode} onMouseDown={startUpperDrag}></span>
          </div>
        </>
      ) : (
        <>
          <div className="cu-slider-bar" style={barStyle}></div>
          <div
            className={`cu-slider-handle${isDragging ? ' is-active' : ''}`}
            data-hint={String(formatHint(values[0]))}
            style={{ left: lowerHandlePosition + '%' }}
          >
            <span ref={setLowerNode} onMouseDown={startLowerDrag}></span>
          </div>
        </>
      )}
    </div>
  )
}

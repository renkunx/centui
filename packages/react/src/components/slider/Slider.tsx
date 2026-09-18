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

export function MdSlider({
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
  const skipChangeRef = useRef(false)

  // v2 watch value：外部值变化 → 归一化（跳过自身派发引起的回环）
  useEffect(() => {
    if (skipChangeRef.current) {
      skipChangeRef.current = false
      return
    }
    const next = normalize(value, valuesRef.current, min, max, step)
    if (next) {
      skipChangeRef.current = true
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
      onChange?.(next)
    } else {
      onChange?.(next[0])
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
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('touchmove', onDrag)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
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
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('touchmove', onDrag)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
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
        skipChangeRef.current = true
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
    isDraggingRef.current = false
    isDragingUpperRef.current = false
    setIsDragging(false)
    setIsDragingUpper(false)
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('touchmove', onDrag)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('touchend', onUp)
  }

  const formatHint = (val: number) => (format ? format(val) : val)

  return (
    <div className={`md-slider${disabled ? ' is-disabled' : ''}`} ref={elRef}>
      {range ? (
        <>
          <div className="md-slider-bar" style={barStyle}></div>
          <div
            className={`md-slider-handle is-lower${isDragging && !isDragingUpper ? ' is-active' : ''}`}
            data-hint={String(formatHint(values[0]))}
            style={{ left: lowerHandlePosition + '%' }}
          >
            <span onMouseDown={startLowerDrag} onTouchStart={startLowerDrag}></span>
          </div>
          <div
            className={`md-slider-handle is-higher${isDragging && isDragingUpper ? ' is-active' : ''}`}
            data-hint={String(formatHint(values[1]))}
            style={{ left: upperHandlePosition + '%' }}
          >
            <span onMouseDown={startUpperDrag} onTouchStart={startUpperDrag}></span>
          </div>
        </>
      ) : (
        <>
          <div className="md-slider-bar" style={barStyle}></div>
          <div
            className={`md-slider-handle${isDragging ? ' is-active' : ''}`}
            data-hint={String(formatHint(values[0]))}
            style={{ left: lowerHandlePosition + '%' }}
          >
            <span onMouseDown={startLowerDrag} onTouchStart={startLowerDrag}></span>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { warn } from '@mand-mobile/core'

export interface StepperProps {
  defaultValue?: number | string
  value?: number | string
  step?: number | string
  min?: number | string
  max?: number | string
  disabled?: boolean
  readOnly?: boolean
  isInteger?: boolean
  onChange?: (value: number) => void
  onIncrease?: (diff: number) => void
  onDecrease?: (diff: number) => void
}

function getDecimalNum(num: number | string): number {
  try {
    return num.toString().split('.')[1].length
  } catch {
    return 0
  }
}

function accAdd(num1: number | string, num2: number | string): number {
  const n1 = Number(num1)
  const n2 = Number(num2)
  const m = Math.pow(10, Math.max(getDecimalNum(num1), getDecimalNum(num2)))
  return +((n1 * m + n2 * m) / m)
}

function subtr(num1: number | string, num2: number | string): number {
  const n1 = Number(num1)
  const n2 = Number(num2)
  const r1 = getDecimalNum(num1)
  const r2 = getDecimalNum(num2)
  const m = Math.pow(10, Math.max(r1, r2))
  const n = r1 >= r2 ? r1 : r2
  return +((n1 * m - n2 * m) / m).toFixed(n)
}

export function MdStepper({
  defaultValue = 0,
  value = 0,
  step = 1,
  min = -Number.MAX_VALUE,
  max = Number.MAX_VALUE,
  disabled = false,
  readOnly = false,
  isInteger = false,
  onChange,
  onIncrease,
  onDecrease,
}: StepperProps) {
  const [isMin, setIsMin] = useState(false)
  const [isMax, setIsMax] = useState(false)
  const [, setIsEditing] = useState(false)
  const [currentNum, setCurrentNum] = useState(0)
  // 外部 value → 内部 currentNum 的同步（编辑中忽略，与 v2 一致）
  const editingRef = useRef(false)
  const mountedRef = useRef(false)

  const formatNum = (val: number | string): number => {
    const str = String(val).replace(/[^0-9.-]|^-|^\./g, '')
    return str === '' ? 0 : isInteger ? Math.floor(Number(str)) : +str
  }
  const getCurrentNum = (val: number | string): number =>
    Math.max(Math.min(Number(max), formatNum(val)), Number(min))
  const checkStatus = (num: number) => {
    setIsMin(num <= Number(min))
    setIsMax(num >= Number(max))
  }
  const checkMinMax = () => {
    if (Number(min) > Number(max)) {
      warn('[md-react-stepper] minNum is larger than maxNum')
    }
    return Number(max) > Number(min)
  }

  // 统一入口：更新 currentNum 并派发 change/increase/decrease（对齐 v2 currentNum watcher）
  const applyCurrentNum = (next: number, oldVal: number) => {
    checkStatus(next)
    if (next !== Number(value)) {
      onChange?.(next)
    }
    const diff = next - oldVal
    if (diff > 0) {
      onIncrease?.(diff)
    } else if (diff < 0) {
      onDecrease?.(Math.abs(diff))
    }
    setCurrentNum(next)
  }

  // 初始化与外部 value 同步
  useEffect(() => {
    checkMinMax()
    const init = getCurrentNum(Number(value) || Number(defaultValue))
    setCurrentNum(init)
    checkStatus(init)
  }, [])

  useEffect(() => {
    // v2 watch 契约：非 immediate，挂载时的初始化由上方 effect 负责
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (editingRef.current) {
      return
    }
    const next = getCurrentNum(value)
    checkStatus(next)
    setCurrentNum(next)
  }, [value])

  // min/max 变化收敛（与 v2 watch 一致：直接取边界值）
  useEffect(() => {
    if (currentNum < Number(min)) {
      setCurrentNum(Number(min))
      checkStatus(Number(min))
    }
  }, [min])

  useEffect(() => {
    if (currentNum > Number(max)) {
      setCurrentNum(Number(max))
      checkStatus(Number(max))
    }
  }, [max])

  const reduce = () => {
    if (disabled || isMin) {
      return
    }
    applyCurrentNum(subtr(currentNum, step), currentNum)
    onChangeCommit()
  }
  const add = () => {
    if (disabled || isMax) {
      return
    }
    applyCurrentNum(accAdd(currentNum, step), currentNum)
    onChangeCommit()
  }
  // v2 契约：blur 时收敛到合法区间并退出编辑态
  const onChangeCommit = () => {}

  const onInput = (event: React.FormEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    const formatted = formatNum(target.value)
    if (+target.value !== formatted) {
      target.value = String(formatted)
    }
    editingRef.current = true
    setCurrentNum(formatted)
    checkStatus(formatted)
  }

  const onFocus = () => {
    editingRef.current = true
    setIsEditing(true)
  }

  const onBlur = () => {
    editingRef.current = false
    setIsEditing(false)
    const clamped = getCurrentNum(currentNum)
    setCurrentNum(clamped)
    checkStatus(clamped)
    if (clamped !== Number(value)) {
      onChange?.(clamped)
    }
  }

  const contentLength = Math.max(String(value ?? '').length, 2)

  return (
    <div className={`md-stepper${disabled ? ' disabled' : ''}`}>
      <div
        className={`md-stepper-button md-stepper-button-reduce${isMin ? ' disabled' : ''}`}
        onClick={reduce}
      ></div>
      <div className="md-stepper-number">
        <input
          type={isInteger ? 'tel' : 'number'}
          size={contentLength}
          value={currentNum}
          readOnly={readOnly}
          onInput={onInput}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
      <div
        className={`md-stepper-button md-stepper-button-add${isMax ? ' disabled' : ''}`}
        onClick={add}
      ></div>
    </div>
  )
}

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CuIcon } from '../icon/Icon'

export interface StepItem {
  name?: string
  text?: string
}

export interface StepsProps {
  steps?: StepItem[]
  current?: number
  direction?: 'horizontal' | 'vertical'
  transition?: boolean
  verticalAdaptive?: boolean
  custom?: boolean
  /** 统一自定义图标（v2 scoped slot icon） */
  renderIcon?: (opts: { index: number; currentIndex: number }) => ReactNode
  /** 按状态自定义：已到达 */
  renderReached?: (opts: { index: number }) => ReactNode
  /** 按状态自定义：当前 */
  renderCurrent?: (opts: { index: number }) => ReactNode
  /** 按状态自定义：未到达 */
  renderUnreached?: (opts: { index: number }) => ReactNode
  /** 自定义文本 */
  renderContent?: (opts: { index: number; step: StepItem }) => ReactNode
  /** custom 模式下完全接管渲染 */
  children?: ReactNode
}

type Progress = { len: number; time: number }[]

const DURATION = 0.3

function formatValue(steps: StepItem[], val: number) {
  if (val < 0) {
    return 0
  } else if (val > steps.length - 1) {
    return steps.length - 1
  }
  return val
}

function sliceProgress(steps: StepItem[], current: number, prev: Progress): Progress {
  return steps.slice(0, steps.length - 1).map((_step, index) => {
    const offset = current - index
    const old = prev[index]
    const isNewProgress = old === undefined
    let len: number
    if (offset <= 0) {
      len = 0
    } else if (offset >= 1) {
      len = 1
    } else {
      len = offset
    }
    const time = (isNewProgress ? len : Math.abs(old.len - len)) * DURATION
    return { len, time }
  })
}

export function CuSteps({
  steps = [],
  current = 0,
  direction = 'horizontal',
  transition = false,
  verticalAdaptive = false,
  custom = false,
  renderIcon,
  renderReached,
  renderCurrent,
  renderUnreached,
  renderContent,
  children,
}: StepsProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState<Progress>(() => sliceProgress(steps, formatValue(steps, current), []))
  const [stepsSize, setStepsSize] = useState<number[]>([])
  const [currentLength, setCurrentLength] = useState(() => formatValue(steps, current))
  const currentLengthRef = useRef(currentLength)
  currentLengthRef.current = currentLength
  const progressRef = useRef(progress)
  progressRef.current = progress

  // v2 watch current：普通模式直接更新；transition 模式 100ms 后分段动画
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const currentStep = formatValue(steps, current)
    const newProgress = sliceProgress(steps, currentStep, progressRef.current)
    if (transition) {
      const isAdd = currentStep >= currentLengthRef.current
      let len = isAdd ? 0 : currentLengthRef.current
      const timer = setTimeout(() => {
        const walk = (index: number) => {
          if (index < newProgress.length && index > -1 && newProgress[index]) {
            if (isAdd) {
              len += newProgress[index].len
            } else {
              len -= progressRef.current[index].len - newProgress[index].len
            }
            setTimeout(() => {
              walk(isAdd ? index + 1 : index - 1)
              setCurrentLength((prev) => {
                if ((isAdd && len > prev) || (!isAdd && len < prev)) {
                  return len
                }
                return prev
              })
            }, newProgress[index].time * 1000)
          }
          setProgress((prev) => {
            const next = [...prev]
            next[index] = newProgress[index]
            return next
          })
        }
        walk(isAdd ? 0 : newProgress.length - 1)
      }, 100)
      return () => clearTimeout(timer)
    }
    setProgress(newProgress)
    setCurrentLength(currentStep)
  }, [current])

  // v2 $_initStepSize：垂直非 adaptive 时按文本块高度测距
  const stepsSizeRef = useRef(stepsSize)
  stepsSizeRef.current = stepsSize
  useEffect(() => {
    if (direction !== 'vertical' || verticalAdaptive) {
      return
    }
    const rootEl = rootRef.current
    if (!rootEl) {
      return
    }
    const iconWrappers = rootEl.querySelectorAll('.icon-wrapper')
    const textWrappers = rootEl.querySelectorAll('.text-wrapper')
    const sizes = Array.from(textWrappers).map((wrapper, index) => {
      let stepHeight = wrapper.clientHeight
      const iconHeight = iconWrappers[index]?.clientHeight ?? 0
      if (index === textWrappers.length - 1) {
        stepHeight -= iconHeight
      } else {
        stepHeight += 40
      }
      return stepHeight > 0 ? stepHeight : 0
    })
    if (sizes.toString() !== stepsSizeRef.current.toString()) {
      setStepsSize(sizes)
    }
  })

  const getStepSizeForStyle = (index: number): CSSProperties | undefined => {
    const size = direction === 'vertical' && !verticalAdaptive ? stepsSize[index] : 0
    return size ? { height: `${size}px` } : undefined
  }

  const getStepStatusClass = (index: number) => {
    const status: string[] = []
    if (index < currentLength) {
      status.push('reached')
    }
    if (index === Math.floor(currentLength)) {
      status.push('current')
    }
    return status.join(' ')
  }

  const barInnerStyle = (index: number): CSSProperties => {
    const p = progress[index]
    const transform =
      direction === 'horizontal'
        ? `(${(p.len - 1) * 100}%, 0, 0)`
        : `(0, ${(p.len - 1) * 100}%, 0)`
    return {
      transform: `translate3d${transform}`,
      transition: `all ${p.time}s linear`,
    }
  }

  const renderDefaultNode = (index: number) => {
    const nodeDefault = (
      <div className="step-node-default">
        <div className="step-node-default-icon" style={{ width: 6, height: 6, borderRadius: '50%' }}></div>
      </div>
    )
    if (index < currentLength) {
      return renderReached ? renderReached({ index }) : nodeDefault
    }
    if (index === currentLength) {
      return renderCurrent ? renderCurrent({ index }) : <CuIcon name="success"></CuIcon>
    }
    return renderUnreached ? renderUnreached({ index }) : nodeDefault
  }

  return (
    <div
      ref={rootRef}
      className={`cu-steps${direction === 'vertical' ? ' cu-steps-vertical' : ''}${
        direction === 'horizontal' ? ' cu-steps-horizontal' : ''
      }${direction === 'vertical' && verticalAdaptive ? ' vertical-adaptive' : ''}${
        currentLength % 1 !== 0 ? ' no-current' : ''
      }`}
    >
      {custom ? children : null}
      {!custom &&
        steps.map((step, index) => (
          <Fragment key={index}>
            <div className={`step-wrapper${getStepStatusClass(index) ? ` ${getStepStatusClass(index)}` : ''}`}>
              {renderIcon ? (
                <div className="icon-wrapper">{renderIcon({ index, currentIndex: currentLength })}</div>
              ) : (
                <div className="icon-wrapper">{renderDefaultNode(index)}</div>
              )}
              <div className="text-wrapper">
                {renderContent ? (
                  renderContent({ index, step })
                ) : (
                  <>
                    <div className="name">{step.name}</div>
                    {step.text ? <div className="desc">{step.text}</div> : null}
                  </>
                )}
              </div>
            </div>
            <div
              className={`bar ${direction === 'horizontal' ? 'horizontal-bar' : 'vertical-bar'}`}
              style={getStepSizeForStyle(index)}
            >
              {progress[index] ? <i className="bar-inner" style={barInnerStyle(index)}></i> : null}
            </div>
          </Fragment>
        ))}
    </div>
  )
}

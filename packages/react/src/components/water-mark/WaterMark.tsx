import { forwardRef, useEffect, useRef, type ReactNode } from 'react'
import { getDpr } from '@centui/core/web'

export interface WaterMarkProps {
  content?: string
  spacing?: string | number
  repeatX?: boolean
  repeatY?: boolean
  rotate?: string | number
  opacity?: string | number
  /** 水印插槽（平铺内容） */
  watermark?: ReactNode
  /** 水印插槽作用域（v2 coord） */
  renderWatermark?: (coord: { row: number; col: number }) => ReactNode
  className?: string
  children?: ReactNode
}

const FONT_SIZE = 14
const COLOR = '#858B9C'

export const CuWaterMark = forwardRef<HTMLDivElement, WaterMarkProps>(function CuWaterMark(
  {
    content = '',
    spacing = '20vw',
    repeatX = true,
    repeatY = true,
    rotate = -30,
    opacity = 0.1,
    watermark,
    renderWatermark,
    className,
    children,
  },
  ref,
) {
  const markRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const isTestEnv =
    typeof process !== 'undefined' && (process.env as { MAND_ENV?: string }).MAND_ENV === 'test'
  // v2 契约：测试环境平铺 2 次（确定性断言），生产 50 次
  const repetition = isTestEnv ? 2 : 50

  const hasWatermarkSlot = !!(watermark || renderWatermark)
  const hasWatermark = hasWatermarkSlot || !!content

  useEffect(() => {
    if (!content) {
      return
    }
    // jsdom 无 canvas 实现，getContext 返回 null，跳过绘制
    const ctx = canvasRef.current?.getContext('2d') ?? null
    if (!ctx) {
      return
    }
    const mark = markRef.current
    const canvas = canvasRef.current
    if (!mark || !canvas) {
      return
    }
    const ratio = Math.max(getDpr(), 2) // min ratio = 2

    canvas.width = mark.clientWidth * ratio
    canvas.height = mark.clientHeight * ratio
    const ctxWidth = canvas.width
    const ctxHeight = canvas.height
    ctx.scale(1 / ratio, 1 / ratio)

    let realSpacing = 0
    if (typeof spacing === 'number') {
      realSpacing = spacing
    } else {
      const [, amount = '20', unit = 'vw'] = /([0-9]+)([A-Za-z]+)/.exec(spacing) ?? []
      if (unit === 'px') {
        realSpacing = Number(amount)
      } else if (unit === 'vh') {
        realSpacing = (Number(amount) * window.screen.height) / 100
      } else if (unit === 'vw') {
        realSpacing = (Number(amount) * window.screen.width) / 100
      }
      realSpacing *= ratio
    }

    const fontSize = FONT_SIZE * ratio
    const contentLength = content.length * fontSize
    const xCount = Math.ceil((ctxWidth * ratio) / (contentLength + realSpacing))
    const yCount = Math.ceil((ctxHeight * ratio) / (fontSize + realSpacing))

    ctx.font = `${fontSize}px "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif`
    ctx.fillStyle = COLOR

    let ctxX: number
    let ctxY = 0
    for (let y = 0; y < yCount; y++) {
      ctxX = 0
      for (let x = 0; x < xCount; x++) {
        ctx.fillText(content, ctxX, ctxY)
        ctxX += contentLength
      }
      ctxY += fontSize + realSpacing
    }
  }, [content, spacing])

  const lines = repeatY ? Array.from({ length: repetition }, (_, i) => i + 1) : [1]
  const items = repeatX ? Array.from({ length: repetition }, (_, i) => i + 1) : [1]

  return (
    <div className={`cu-water-mark${className ? ` ${className}` : ''}`} ref={ref}>
      <div className="water-mark-container">{children}</div>
      {hasWatermark ? (
        <div className="water-mark-list" ref={markRef}>
          <div
            className="water-mark-list-wrapper"
            style={{
              opacity: opacity as number,
              transform: `rotate(${rotate}deg)`,
            }}
          >
            {content ? (
              <canvas ref={canvasRef} className="water-mark-canvas"></canvas>
            ) : hasWatermarkSlot ? (
              lines.map((i) => (
                <ul
                  key={`line-${i}`}
                  className="water-mark-line"
                  style={{ marginBottom: spacing as string | number }}
                >
                  {items.map((j) => (
                    <li
                      key={`item-${j}`}
                      className="water-mark-item"
                      style={
                        i % 2 === 0
                          ? { marginLeft: repeatX ? (spacing as string | number) : 0 }
                          : { marginRight: repeatX ? (spacing as string | number) : 0 }
                      }
                    >
                      {renderWatermark ? renderWatermark({ row: i, col: j }) : watermark}
                    </li>
                  ))}
                </ul>
              ))
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
})

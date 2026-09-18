import type { ReactNode } from 'react'

export interface RollerProps {
  size?: number
  width?: number
  color?: string
  borderColor?: string
  fill?: string
  linecap?: 'butt' | 'round' | 'square' | 'inherit'
  rotate?: number
  /** 进度控制 0-1；不传时为自动不定态动画 */
  process?: number
  children?: ReactNode
  circleSlot?: ReactNode
  defsSlot?: ReactNode
  className?: string
}

export function MdRoller({
  size = 70,
  width,
  color = '#2F86F6',
  borderColor = 'rgba(0, 0, 0, .1)',
  fill = 'transparent',
  linecap = 'round',
  rotate = 0,
  process,
  children,
  circleSlot,
  defsSlot,
  className,
}: RollerProps) {
  const strokeWidth = width ?? size / 12
  const radius = size / 2
  const viewBoxSize = size + 2 * strokeWidth
  const circlePerimeter = size * 3.1415
  const duration = 2
  const isAutoAnimation = process === undefined
  const strokeDasharray = isAutoAnimation
    ? undefined
    : `${process * circlePerimeter} ${(1 - process) * circlePerimeter}`

  return (
    <div className={`md-activity-indicator-rolling${className ? ` ${className}` : ''}`}>
      <div className="rolling-container">
        <svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          style={{ width: `${size}px`, height: `${size}px`, transform: `rotateZ(${rotate}deg)` }}
          preserveAspectRatio="xMidYMid"
          className="md-activity-indicator-svg rolling"
        >
          <circle fill="none" stroke={borderColor} strokeWidth={strokeWidth} cx={viewBoxSize / 2} cy={viewBoxSize / 2} r={radius} />
          {circleSlot ?? (
            <g className="circle">
              {isAutoAnimation || (process ?? 0) > 0 ? (
                <circle
                  className="stroke"
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  fill={fill}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={
                    isAutoAnimation ? `${(110 * circlePerimeter) / 125}` : strokeDasharray
                  }
                  strokeLinecap={linecap}
                  r={radius}
                >
                  {isAutoAnimation ? (
                    <>
                      <animate
                        attributeName="stroke-dashoffset"
                        values={`${(360 * circlePerimeter) / 125};${(140 * circlePerimeter) / 125}`}
                        dur="2.2s"
                        keyTimes="0;1"
                        calcMode="spline"
                        fill="freeze"
                        keySplines="0.41,0.314,0.8,0.54"
                        repeatCount="indefinite"
                        begin="0"
                      />
                      <animateTransform
                        dur={`${duration}s`}
                        values={`0 ${viewBoxSize / 2} ${viewBoxSize / 2};360 ${viewBoxSize / 2} ${viewBoxSize / 2}`}
                        attributeName="transform"
                        type="rotate"
                        calcMode="linear"
                        keyTimes="0;1"
                        begin="0"
                        repeatCount="indefinite"
                      ></animateTransform>
                    </>
                  ) : null}
                </circle>
              ) : null}
            </g>
          )}
          {defsSlot}
        </svg>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
export { MdRoller as MdActivityIndicatorRolling }

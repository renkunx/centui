import { CuActivityIndicatorRolling } from './Roller'

export interface RollerSuccessProps {
  isSuccess?: boolean
  size?: number
  color?: string
  strokeWidth?: number
}

export function CuRollerSuccess({ isSuccess = true, size = 70, color = '#28AA8F', strokeWidth = 8 }: RollerSuccessProps) {
  return (
    <div className="cu-activity-indicator-rolling-success">
      <CuActivityIndicatorRolling size={size} width={strokeWidth} fill="#FFF6F1" borderColor="transparent" circleSlot={
        isSuccess ? (
          <g name="circle">
            <circle className="success" cx="50" cy="50" fill="#FFF6F1" stroke="none" r="40"></circle>
          </g>
        ) : undefined
      }>
        {isSuccess ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid"
            className="right"
            style={{ transform: `translate(-50%, -50%) scale(${size / 70})` }}
          >
            <g>
              <line x1="32" y1="47" x2="45" y2="62" style={{ strokeWidth, stroke: color }} strokeDasharray="20" />
              <line x1="42" y1="62" x2="68.4" y2="40" style={{ strokeWidth, stroke: color }} strokeDasharray="35" />
            </g>
          </svg>
        ) : null}
      </CuActivityIndicatorRolling>
    </div>
  )
}

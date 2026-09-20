import { CuIcon } from '../icon/Icon'

export interface SpinningProps {
  size?: number
  color?: string
}

export function CuSpinning({ size = 70, color = 'dark' }: SpinningProps) {
  return (
    <div className={`cu-activity-indicator-spinning${color === 'dark' ? ' dark' : ''}`}>
      <CuIcon
        name="spinner"
        className="cu-activity-indicator-svg"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  )
}

import { MdIcon } from '../icon/Icon'

export interface SpinningProps {
  size?: number
  color?: string
}

export function MdSpinning({ size = 70, color = 'dark' }: SpinningProps) {
  return (
    <div className={`md-activity-indicator-spinning${color === 'dark' ? ' dark' : ''}`}>
      <MdIcon
        name="spinner"
        className="md-activity-indicator-svg"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  )
}

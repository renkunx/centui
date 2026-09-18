import type { ReactNode, HTMLAttributes } from 'react'
import { MdRoller } from './Roller'
import { MdSpinning } from './Spinning'
import { MdCarousel } from './Carousel'

export type ActivityIndicatorProps = {
  /** roller | spinner | carousel */
  type?: string
  size?: number
  width?: number
  color?: string
  textColor?: string
  textSize?: number
  vertical?: boolean
  children?: ReactNode
  /** v2 场景遗留：text 作为透传 attr（VTU propsData 行为） */
  text?: string
} & HTMLAttributes<HTMLDivElement>

export function MdActivityIndicator({
  type = 'roller',
  size = 70,
  width,
  color,
  textColor = '#999',
  textSize,
  vertical = false,
  children,
  ...rest
}: ActivityIndicatorProps) {
  const resolvedColor = color ?? (type === 'spinner' ? 'dark' : '#2F86F6')

  return (
    <div className={`md-activity-indicator ${type}`} {...rest}>
      <div className={`indicator-container${vertical ? ' vertical' : ''}`}>
        <div className="indicator-loading">
          {type === 'roller' ? (
            <MdRoller size={size} color={resolvedColor} width={width} />
          ) : type === 'spinner' ? (
            <MdSpinning size={size} color={resolvedColor} />
          ) : type === 'carousel' ? (
            <MdCarousel size={size} color={resolvedColor} />
          ) : null}
        </div>
        {children ? (
          <div
            className="md-activity-indicator-text indicator-text"
            style={{ fontSize: `${textSize}px`, color: textColor }}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { MdRoller, type RollerProps } from './Roller'
export { MdSpinning, type SpinningProps } from './Spinning'
export { MdCarousel, MdCarouselCircle } from './Carousel'

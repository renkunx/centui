import type { ReactNode } from 'react'

export interface CarouselCircleProps {
  size?: number
  index?: number
  animateValues?: number[]
}

export function MdCarouselCircle({
  size = 30,
  index = 0,
  animateValues = [],
}: CarouselCircleProps) {
  const cx = index * size * 1.5 + size / 2
  const opacityValues = animateValues.join(';')
  const sizeValues = animateValues.map(val => (val * size) / 2).join(';')

  return (
    <circle cx={cx} cy={size / 2} r={size / 2}>
      <animate
        attributeName="fill-opacity"
        attributeType="XML"
        begin="0s"
        dur="1s"
        values={opacityValues}
        calcMode="linear"
        repeatCount="indefinite"
      />
      <animate
        attributeName="r"
        attributeType="XML"
        begin="0s"
        dur="1s"
        values={sizeValues}
        calcMode="linear"
        repeatCount="indefinite"
      />
    </circle>
  )
}

export interface CarouselProps {
  size?: number
  color?: string
}

const CIRCLE_ANIMATE_VALUES: number[][] = [
  [1, 0.8, 0.6, 0.6, 0.6, 0.8, 1],
  [0.6, 0.8, 1, 0.8, 0.6, 0.6, 0.6],
  [0.6, 0.6, 0.6, 0.8, 1, 0.8, 0.6],
]

export function MdCarousel({ size = 30, color = '#2F86F6' }: CarouselProps) {
  const len = CIRCLE_ANIMATE_VALUES.length
  const viewWidth = len * size + ((len - 1) * size) / 2

  return (
    <div className="md-activity-indicator-carousel">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${viewWidth} ${size}`}
        fill={color}
        style={{ width: `${viewWidth}px`, height: `${size}px` }}
        className="md-activity-indicator-svg carouseling"
      >
        {CIRCLE_ANIMATE_VALUES.map((values, index) => (
          <MdCarouselCircle
            key={`carousel-circle-${index}`}
            size={size}
            index={index}
            animateValues={values}
          />
        ))}
      </svg>
    </div>
  )
}

export type { ReactNode }

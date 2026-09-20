import { Fragment, useEffect, useRef, useState } from 'react'

export interface ChartDataset {
  color?: string
  width?: number
  theme?: string
  values: number[]
}

export interface ChartProps {
  labels?: string[]
  datasets?: ChartDataset[]
  size?: Array<string | number>
  max?: number
  min?: number
  lines?: number
  step?: number
  shift?: number
  format?: (val: number) => string | number
}

function computeMax(datasets: ChartDataset[], explicit?: number) {
  if (explicit !== undefined) {
    return explicit
  }
  let max = Math.max.apply(
    Math,
    datasets.map(d => Math.max.apply(Math, d.values as never)),
  )
  let multiple = 1
  while (max > 10) {
    multiple *= 10
    max /= 10
  }
  return Math.ceil(max) * multiple
}

function computeMin(datasets: ChartDataset[], explicit?: number) {
  if (explicit !== undefined) {
    return explicit
  }
  let min = Math.min.apply(
    Math,
    datasets.map(d => Math.min.apply(Math, d.values as never)),
  )
  let multiple = 1
  while (min > 10) {
    multiple *= 10
    min = min / 10
  }
  return Math.floor(min) * multiple
}

export function CuChart({ labels = [], datasets = [], size = [480, 320], max, min, lines = 5, step, shift = 0.6, format = (v: number) => v }: ChartProps) {
  const [unit, setUnit] = useState(16)
  const unitRef = useRef(unit)
  unitRef.current = unit

  useEffect(() => {
    const resize = () => {
      setUnit(parseFloat(window.getComputedStyle(document.getElementsByTagName('html')[0]).getPropertyValue('font-size')))
    }
    if (document.readyState !== 'loading') {
      resize()
    }
    document.addEventListener('DOMContentLoaded', resize)
    window.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('DOMContentLoaded', resize)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const maxV = computeMax(datasets, max)
  const minV = computeMin(datasets, min)
  const stepV = step !== undefined ? step : (maxV - minV) / lines

  const offset = {
    top: 0.2 * unit,
    bottom: 0.5 * unit,
    left: shift * unit,
    right: 0.2 * unit,
  }
  const width = typeof size[0] === 'string' && size[0].indexOf('rem') !== -1 ? parseFloat(size[0]) * unit : parseFloat(String(size[0]))
  const height = typeof size[1] === 'string' && size[1].indexOf('rem') !== -1 ? parseFloat(size[1]) * unit : parseFloat(String(size[1]))
  const innerWidth = width - offset.left - offset.right
  const innerHeight = height - offset.top - offset.bottom

  const deltaX = innerWidth / (labels.length - 1)
  const xaxis = labels.map((label, index) => ({ offset: index * deltaX, label }))

  const yaxis: Array<{ offset: number; label: string | number }> = []
  const deltaY = innerHeight / lines
  for (let i = 0; i < lines; i++) {
    yaxis.push({ offset: i * deltaY, label: format(maxV - i * stepV) })
  }
  yaxis.push({ offset: innerHeight, label: format(minV) })

  const lower = maxV - (lines - 1) * stepV

  const colors: string[] = []
  datasets.forEach(d => {
    if (d.color && colors.indexOf(d.color) === -1) {
      colors.push(d.color)
    }
  })

  return (
    <svg className="cu-chart" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {colors.map(color => (
          <linearGradient key={color} id={`path-fill-gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop style={{ stopColor: color }} offset="0%" stopOpacity="0.4" />
            <stop style={{ stopColor: color }} offset="50%" stopOpacity="0.3" />
            <stop style={{ stopColor: color }} offset="100%" stopOpacity="0.1" />
          </linearGradient>
        ))}
      </defs>
      <g className="cu-chart-graph" transform={`translate(${offset.left}, ${offset.top})`}>
        <g className="cu-chart-axis-y">
          {yaxis.map((item, index) => (
            <g key={index} transform={`translate(0, ${item.offset})`}>
              <line x1="0" x2={innerWidth} y1="0" y2="0"></line>
              <text x="0" y="0" dx="-0.5em" dy="0.32em">{item.label}</text>
            </g>
          ))}
        </g>
        <g className="cu-chart-axis-x" transform={`translate(0, ${innerHeight})`}>
          {xaxis.map((item, index) => (
            <g key={index} transform={`translate(${item.offset}, 0)`}>
              <line x1="0" x2="0" y1="0" y2="6"></line>
              <text x="0" y="0" dy="2em">{item.label}</text>
            </g>
          ))}
        </g>
        <g className="cu-chart-paths">
          {datasets.map((data, index) => {
            const dx = innerWidth / (data.values.length - 1)
            const dy = innerHeight / lines
            const points = data.values.map((value, i) => {
              if (value < lower) {
                return {
                  x: i * dx,
                  y: innerHeight - (1 - (lower - value) / (lower - minV)) * dy,
                }
              }
              return {
                x: i * dx,
                y: (1 - (value - lower) / (maxV - lower)) * (innerHeight - dy),
              }
            })

            const style: React.CSSProperties = {
              fill: 'none',
              stroke: data.color || '#fa8919',
              strokeWidth: data.width || 1,
            }
            let area: { d: string; style: React.CSSProperties } | undefined
            if (data.theme === 'heat') {
              style.stroke = `url(#path-fill-gradient-${data.color})`
            } else if (data.theme === 'region') {
              area = {
                d:
                  `M0,${innerHeight} ` +
                  points.map(p => `L${p.x},${p.y}`).join(' ') +
                  ` L${points[points.length - 1].x},${innerHeight}`,
                style: {
                  fill: `url(#path-fill-gradient-${data.color})`,
                  stroke: 'none',
                },
              }
            }

            const rest = points.slice(1)
            const d = `M0,${points.shift()!.y} ` + rest.map(p => `L${p.x},${p.y}`).join(' ')

            return (
              <Fragment key={index}>
                <path className="cu-chart-path" style={style} d={d}></path>
                {area ? <path className="cu-chart-path-area" style={area.style} d={area.d}></path> : null}
              </Fragment>
            )
          })}
        </g>
      </g>
    </svg>
  )
}

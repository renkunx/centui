import { Fragment, useEffect, useRef, useState } from 'react'
import {
  computeMax,
  computeMin,
  computeOffsets,
  computeSeries,
  computeStep,
  computeXAxis,
  computeYAxis,
  resolveSize,
} from '@centui/core'

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

  // 极值/坐标换算与 Vue、微信小程序共用 @centui/core 的同一实现
  const maxV = computeMax(datasets, max)
  const minV = computeMin(datasets, min)
  const stepV = computeStep(maxV, minV, step, lines)

  const offset = computeOffsets(shift, unit)
  const [width, height] = resolveSize(size, unit)
  const innerWidth = width - offset.left - offset.right
  const innerHeight = height - offset.top - offset.bottom

  const xaxis = computeXAxis(labels, innerWidth)
  const yaxis = computeYAxis(lines, innerHeight, maxV, minV, stepV, val => String(format(val)))
  const series = computeSeries(datasets, {
    innerWidth,
    innerHeight,
    lines,
    max: maxV,
    min: minV,
    step: stepV,
  })

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
          {series.map((item, index) => {
            const data = datasets[index]
            const points = item.points

            const style: React.CSSProperties = {
              fill: 'none',
              stroke: item.color,
              strokeWidth: item.lineWidth,
            }
            let area: { d: string; style: React.CSSProperties } | undefined
            if (data.theme === 'heat') {
              style.stroke = `url(#path-fill-gradient-${data.color})`
            } else if (data.theme === 'region' && points.length > 0) {
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

            const d =
              points.length > 0
                ? `M0,${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ')
                : ''

            return (
              <Fragment key={index}>
                {d ? <path className="cu-chart-path" style={style} d={d}></path> : null}
                {area ? <path className="cu-chart-path-area" style={area.style} d={area.d}></path> : null}
              </Fragment>
            )
          })}
        </g>
      </g>
    </svg>
  )
}

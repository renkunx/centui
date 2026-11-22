/**
 * CuChart 边界行为（与 Vue / 微信端共用 core 的几何契约）：
 * 空数据、单点、全等值/退化区间不得产出 NaN/Infinity 坐标。
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CuChart } from '../../src'

const hasBrokenCoord = (html: string) => /NaN|Infinity/.test(html)

describe('CuChart (react)', () => {
  it('renders axes without NaN/Infinity when datasets are empty', () => {
    const { container } = render(<CuChart labels={[]} datasets={[]} />)
    expect(hasBrokenCoord(container.innerHTML)).toBe(false)
    expect(container.querySelectorAll('.cu-chart-axis-y > g')).toHaveLength(6)
    expect(container.querySelectorAll('path.cu-chart-path')).toHaveLength(0)
  })

  it('keeps a single point finite and renders it', () => {
    const { container } = render(
      <CuChart labels={['only']} datasets={[{ values: [42], color: '#198cff' }]} />,
    )
    expect(hasBrokenCoord(container.innerHTML)).toBe(false)
    const path = container.querySelector('path.cu-chart-path')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('d')).toMatch(/^M0,/)
  })

  it('handles all-equal values (max === min) without NaN', () => {
    const { container } = render(<CuChart labels={['a', 'b']} datasets={[{ values: [0, 0] }]} />)
    expect(hasBrokenCoord(container.innerHTML)).toBe(false)
    expect(container.querySelector('path.cu-chart-path')).not.toBeNull()
  })

  it('applies a custom formatter to y-axis labels', () => {
    const { container } = render(
      <CuChart datasets={[{ values: [100] }]} format={(v: number) => `${v}%`} />,
    )
    const labels = [...container.querySelectorAll('.cu-chart-axis-y text')].map(n => n.textContent)
    expect(labels).toContain('100%')
  })
})

/**
 * CuChart 边界行为（与 React / 微信端共用 core 的几何契约）：
 * 空数据、单点、全等值/退化区间不得产出 NaN/Infinity 坐标。
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CuChart } from '../../src'

const hasBrokenCoord = (html: string) => /NaN|Infinity/.test(html)

describe('CuChart', () => {
  it('renders axes without NaN/Infinity when datasets are empty', () => {
    const wrapper = mount(CuChart, { props: { labels: [], datasets: [] } })
    expect(hasBrokenCoord(wrapper.html())).toBe(false)
    // 6 条 y 轴刻度（lines=5 + 底线），无折线
    expect(wrapper.findAll('.cu-chart-axis-y > g')).toHaveLength(6)
    expect(wrapper.findAll('path.cu-chart-path')).toHaveLength(0)
  })

  it('keeps a single point finite and renders it', () => {
    const wrapper = mount(CuChart, {
      props: { labels: ['only'], datasets: [{ values: [42], color: '#198cff' }] },
    })
    expect(hasBrokenCoord(wrapper.html())).toBe(false)
    const path = wrapper.find('path.cu-chart-path')
    expect(path.exists()).toBe(true)
    expect(path.attributes('d')).toMatch(/^M0,/)
  })

  it('handles all-equal values (max === min) without NaN', () => {
    const wrapper = mount(CuChart, {
      props: { labels: ['a', 'b'], datasets: [{ values: [0, 0] }] },
    })
    expect(hasBrokenCoord(wrapper.html())).toBe(false)
    expect(wrapper.find('path.cu-chart-path').exists()).toBe(true)
  })

  it('applies a custom formatter to y-axis labels', () => {
    const wrapper = mount(CuChart, {
      props: { datasets: [{ values: [100] }], format: (v: number) => `${v}%` },
    })
    expect(wrapper.findAll('.cu-chart-axis-y text').map(node => node.text())).toContain('100%')
  })
})

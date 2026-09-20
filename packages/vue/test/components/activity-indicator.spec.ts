/**
 * CuActivityIndicator 行为清单（自 v2 components/activity-indicator spec/源码提取）：
 * 1. type=roller/spinner/carousel 分别渲染对应指示器
 * 2. roller：size 决定 viewBox/stroke-width/radius；width 覆盖默认描边宽度；
 *    process 传入时为进度态（无 SMIL 动画、dasharray 按 process），未传时为自动不定态动画
 * 3. spinner：默认 color=dark（带 dark 类），light 不带；尺寸透传给图标 style
 * 4. 默认 color 随 type 切换（spinner→dark，其他→#2F86F6），显式 color 优先
 * 5. 默认插槽渲染为文本（vertical 排布类）
 * 6. carousel：三圆点，viewBox 宽度 = 3.5 * size
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CuActivityIndicator, CuActivityIndicatorRolling } from '../../src'

describe('CuActivityIndicator', () => {
  it('renders roller with geometry from size', () => {
    const wrapper = mount(CuActivityIndicator, { props: { type: 'roller', size: 70 } })
    const svg = wrapper.find('svg.rolling')
    // strokeWidth = 70/12, viewBox = size + 2*strokeWidth
    expect(svg.attributes('viewBox')).toBe('0 0 81.66666666666667 81.66666666666667')
    const bg = wrapper.find('circle')
    expect(bg.attributes('stroke-width')).toBe('5.833333333333333')
    expect(bg.attributes('r')).toBe('35')
    expect(wrapper.find('animate').exists()).toBe(true)
  })

  it('overrides stroke width via width prop', () => {
    const wrapper = mount(CuActivityIndicatorRolling, { props: { size: 70, width: 10 } })
    expect(wrapper.find('circle').attributes('stroke-width')).toBe('10')
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 90 90')
  })

  it('renders progress state when process provided', () => {
    const wrapper = mount(CuActivityIndicatorRolling, { props: { size: 70, process: 0.5 } })
    expect(wrapper.find('animate').exists()).toBe(false)
    const stroke = wrapper.find('circle.stroke')
    // circlePerimeter = 70 * 3.1415
    expect(stroke.attributes('stroke-dasharray')).toBe('109.9525 109.9525')
  })

  it('renders spinner with dark color by default', () => {
    const dark = mount(CuActivityIndicator, { props: { type: 'spinner' } })
    expect(dark.find('.cu-activity-indicator-spinning.dark').exists()).toBe(true)

    const light = mount(CuActivityIndicator, { props: { type: 'spinner', color: 'light' } })
    expect(light.find('.cu-activity-indicator-spinning.dark').exists()).toBe(false)

    const sized = mount(CuActivityIndicator, { props: { type: 'spinner', size: 40 } })
    expect(sized.find('.cu-activity-indicator-svg').attributes('style')).toContain('width: 40px')
  })

  it('keeps explicit color for roller', () => {
    const wrapper = mount(CuActivityIndicator, { props: { type: 'roller', color: '#fc0' } })
    expect(wrapper.find('circle.stroke').attributes('stroke')).toBe('#fc0')
  })

  it('renders default slot as text with vertical layout', () => {
    const wrapper = mount(CuActivityIndicator, {
      props: { vertical: true },
      slots: { default: '加载中' },
    })
    expect(wrapper.find('.indicator-container.vertical').exists()).toBe(true)
    expect(wrapper.find('.cu-activity-indicator-text').text()).toBe('加载中')
  })

  it('renders carousel with three circles', () => {
    const wrapper = mount(CuActivityIndicator, { props: { type: 'carousel', size: 30 } })
    expect(wrapper.findAll('circle')).toHaveLength(3)
    expect(wrapper.find('svg.carouseling').attributes('viewBox')).toBe('0 0 120 30')
  })
})

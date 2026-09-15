/**
 * MdProgress 行为清单（自 v2 components/progress spec/源码提取）：
 * 1. value（0-1）映射为 stroke-dasharray（进度弧长）
 * 2. 默认非过渡：值变化立即生效
 * 3. transition=true 时值变化经 rAF 过渡收敛到目标
 * 4. 透传 Roller 的 size/width/color/linecap 等绘制参数
 * 5. 默认插槽渲染于中心 content，defs 插槽透传
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { MdProgress } from '../../src'

describe('MdProgress', () => {
  it('maps value to stroke dasharray', async () => {
    const wrapper = mount(MdProgress, { props: { value: 0.44 } })
    const stroke = wrapper.find('circle.stroke')
    expect(stroke.attributes('stroke-dasharray')).toBe('96.7582 123.14680000000001')

    await wrapper.setProps({ value: 1 })
    expect(wrapper.find('circle.stroke').attributes('stroke-dasharray')).toBe('219.905 0')
  })

  it('passes drawing props to roller', () => {
    const wrapper = mount(MdProgress, {
      props: { value: 0.5, size: 100, width: 8, color: '#0f0', linecap: 'butt' },
    })
    const svg = wrapper.find('svg.rolling')
    expect(svg.attributes('viewBox')).toBe('0 0 116 116')
    expect(wrapper.find('circle').attributes('stroke-width')).toBe('8')
    expect(wrapper.find('circle.stroke').attributes('stroke')).toBe('#0f0')
    expect(wrapper.find('circle.stroke').attributes('stroke-linecap')).toBe('butt')
  })

  it('transitions value when transition enabled', async () => {
    const wrapper = mount(MdProgress, {
      props: { value: 0.2, transition: true, duration: 100 },
    })
    const dasharray = () =>
      wrapper.find('circle.stroke').exists()
        ? wrapper.find('circle.stroke').attributes('stroke-dasharray')
        : null
    await vi.waitUntil(() => dasharray() === '43.981 175.924', { timeout: 2000 })

    await wrapper.setProps({ value: 0.8 })
    await vi.waitUntil(() => dasharray() === '175.924 43.98099999999999', { timeout: 2000 })
  })

  it('renders default slot in content', () => {
    const wrapper = mount(MdProgress, { props: { value: 0.5 }, slots: { default: '50%' } })
    expect(wrapper.find('.rolling-container .content').text()).toBe('50%')
  })
})

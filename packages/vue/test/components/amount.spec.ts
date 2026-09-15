/**
 * MdAmount 行为清单（自 v2 components/amount spec/源码提取）：
 * 1. 默认精度 2 位四舍五入（1234.56 → "1234.56"）
 * 2. precision < 0 按 0 处理；isRoundUp=false 向下截断
 * 3. hasSeparator 千分位分组；separator 自定义；负数符号前置；小数部分原样保留
 * 4. isCapital 输出中文大写（精确到毫），0 → 零元整
 * 5. isAnimated 时数值变化经 rAF 过渡到目标值（最终收敛）
 * 6. 非 capital 状态带 numerical class，capital 不带
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { MdAmount } from '../../src'

describe('MdAmount', () => {
  it('formats with default precision 2 and rounds up', () => {
    const wrapper = mount(MdAmount, { props: { value: 1234.56 } })
    expect(wrapper.text()).toBe('1234.56')
    expect(wrapper.classes()).toContain('numerical')

    const up = mount(MdAmount, { props: { value: 1.005 } })
    expect(up.text()).toBe('1.01')
  })

  it('treats negative precision as 0 and floors when isRoundUp is false', () => {
    expect(mount(MdAmount, { props: { value: 12.34, precision: -1 } }).text()).toBe('12')
    expect(
      mount(MdAmount, { props: { value: 1.239, precision: 2, isRoundUp: false } }).text(),
    ).toBe('1.23')
  })

  it('groups integer part with separator and keeps decimals', () => {
    const wrapper = mount(MdAmount, { props: { value: 1234567.891, hasSeparator: true } })
    expect(wrapper.text()).toBe('1,234,567.89')

    const space = mount(MdAmount, {
      props: { value: 1234567.89, hasSeparator: true, separator: ' ' },
    })
    expect(space.text()).toBe('1 234 567.89')

    const negative = mount(MdAmount, { props: { value: -1234567.89, hasSeparator: true } })
    expect(negative.text()).toBe('-1,234,567.89')
  })

  it('renders chinese capital amount', () => {
    const wrapper = mount(MdAmount, { props: { value: 1234.56, isCapital: true } })
    expect(wrapper.text()).toBe('壹仟贰佰叁拾肆元伍角陆分')
    expect(wrapper.classes()).not.toContain('numerical')

    expect(mount(MdAmount, { props: { value: 0, isCapital: true } }).text()).toBe('零元整')
    expect(mount(MdAmount, { props: { value: -12.34, isCapital: true } }).text()).toBe(
      '负壹拾贰元叁角肆分',
    )
  })

  it('animates value changes when isAnimated', async () => {
    const wrapper = mount(MdAmount, { props: { value: 100, isAnimated: true, duration: 100 } })
    await vi.waitUntil(() => wrapper.text() === '100.00', { timeout: 2000 })

    await wrapper.setProps({ value: 200 })
    await vi.waitUntil(() => wrapper.text() === '200.00', { timeout: 2000 })
  })
})

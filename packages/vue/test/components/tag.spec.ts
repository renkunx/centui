/**
 * MdTag 行为清单（自 v2 components/tag spec/源码提取）：
 * 1. 默认 size-large / shape-square / type-ghost / font-weight-normal
 * 2. quarter 形状渲染 quarter-content + quarter-bg；coupon 渲染 coupon-container + 左右缺口
 * 3. fill + fillColor → 背景色内联样式；ghost + fontColor → 边框色 + 文本色
 * 4. circle 形状挂载后按高度计算 paddingLeft/Right/Radius（jsdom 高度 0 → 0px）
 * 5. sharp 指定时 circle 的对应角圆角清零
 * 6. 插槽内容渲染
 */
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { MdTag } from '../../src'

describe('MdTag', () => {
  it('renders default class combination and slot', () => {
    const wrapper = mount(MdTag, { slots: { default: '标签' } })
    const inner = wrapper.find('.md-tag > div')
    expect(inner.classes()).toEqual([
      'default',
      'size-large',
      'shape-square',
      'type-ghost',
      'font-weight-normal',
    ])
    expect(inner.text()).toBe('标签')
  })

  it('renders quarter shape with bg layer', () => {
    const wrapper = mount(MdTag, { props: { shape: 'quarter' }, slots: { default: 'Q' } })
    expect(wrapper.find('.quarter-content').text()).toBe('Q')
    expect(wrapper.find('.quarter-bg').exists()).toBe(true)
    expect(wrapper.find('.shape-quarter').exists()).toBe(true)
  })

  it('renders coupon shape with notched sides', () => {
    const wrapper = mount(MdTag, {
      props: { shape: 'coupon', type: 'fill', fillColor: '#fc0' },
      slots: { default: '券' },
    })
    expect(wrapper.find('.coupon-container').exists()).toBe(true)
    const left = wrapper.find('.left-coupon')
    expect(left.attributes('style')).toContain('radial-gradient(circle at left')
    expect(wrapper.find('.right-coupon').exists()).toBe(true)
    expect(wrapper.find('.coupon-container').attributes('style')).toContain('background')
  })

  it('applies fill color and font color styles', () => {
    const fill = mount(MdTag, { props: { type: 'fill', fillColor: '#fc9153' } })
    expect(fill.find('.type-fill').attributes('style')).toContain('background: rgb(252, 145, 83)')

    const ghost = mount(MdTag, { props: { type: 'ghost', fontColor: '#f00' } })
    const ghostStyle = ghost.find('.type-ghost').attributes('style') || ''
    expect(ghostStyle).toContain('border-color: rgb(255, 0, 0)')
    expect(ghostStyle).toContain('color: rgb(255, 0, 0)')

    const filled = mount(MdTag, { props: { type: 'fill', fontColor: '#0f0' } })
    const filledStyle = filled.find('.type-fill').attributes('style') || ''
    expect(filledStyle).toContain('color: rgb(0, 255, 0)')
    expect(filledStyle).not.toContain('border-color')
  })

  it('computes circle padding from element height on mount', async () => {
    const wrapper = mount(MdTag, { props: { shape: 'circle' } })
    await flushPromises()
    const style = wrapper.find('.shape-circle').attributes('style') || ''
    expect(style).toContain('padding-left: 0px')
    expect(style).toContain('padding-right: 0px')
    expect(style).toContain('border-radius: 0px')
  })

  it('resets sharp corner radius for circle shape', async () => {
    const wrapper = mount(MdTag, { props: { shape: 'circle', sharp: 'top-left' } })
    await flushPromises()
    expect(wrapper.find('.shape-circle').attributes('style')).toContain('border-top-left-radius')
  })

  it('supports bubble and fillet shapes', () => {
    expect(
      mount(MdTag, { props: { shape: 'bubble' } })
        .find('.shape-bubble')
        .exists(),
    ).toBe(true)
    expect(
      mount(MdTag, { props: { shape: 'fillet' } })
        .find('.shape-fillet')
        .exists(),
    ).toBe(true)
  })
})

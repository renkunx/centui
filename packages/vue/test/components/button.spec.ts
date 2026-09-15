/**
 * MdButton 行为清单（自 v2 components/button spec/源码提取）：
 * 1. 默认 type=default，class 序列含 default/active/block
 * 2. type: primary/warning/disabled/link 切换主类；type=disabled 或 inactive 时原生 disabled
 * 3. plain/round/inline/small 独立修饰类；inline 时不带 block
 * 4. nativeType 透传为原生 type 属性
 * 5. loading 优先渲染滚动加载指示器，icon 次之，二者互斥
 * 6. 默认插槽内容渲染于 .md-button-content
 * 7. 点击透传原生 click（attrs 透传机制）
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { MdButton } from '../../src'

describe('MdButton', () => {
  it('renders default type with active/block classes', () => {
    const wrapper = mount(MdButton, { slots: { default: '按钮' } })
    expect(wrapper.classes()).toEqual(['md-button', 'default', 'active', 'block'])
    expect(wrapper.find('.md-button-content').text()).toBe('按钮')
  })

  it('switches type classes and native disabled state', async () => {
    const wrapper = mount(MdButton, { props: { type: 'primary' } })
    expect(wrapper.classes()).toContain('primary')
    expect(wrapper.attributes('disabled')).toBeUndefined()

    await wrapper.setProps({ type: 'disabled' })
    expect(wrapper.attributes('disabled')).toBeDefined()

    await wrapper.setProps({ type: 'primary', inactive: true })
    expect(wrapper.classes()).toContain('inactive')
    expect(wrapper.classes()).not.toContain('active')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('applies plain/round/inline/small modifiers', async () => {
    const wrapper = mount(MdButton)
    await wrapper.setProps({ plain: true })
    expect(wrapper.classes()).toContain('plain')
    await wrapper.setProps({ round: true })
    expect(wrapper.classes()).toContain('round')
    await wrapper.setProps({ size: 'small' })
    expect(wrapper.classes()).toContain('small')
    await wrapper.setProps({ inline: true })
    expect(wrapper.classes()).toContain('inline')
    expect(wrapper.classes()).not.toContain('block')
  })

  it('passes nativeType to native type attribute', () => {
    const wrapper = mount(MdButton, { props: { nativeType: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('renders roller when loading and icon otherwise', async () => {
    const wrapper = mount(MdButton, { props: { loading: true, icon: 'home' } })
    expect(wrapper.find('.md-button-loading').exists()).toBe(true)
    expect(wrapper.find('.md-button-loading.md-activity-indicator-rolling').exists()).toBe(true)
    expect(wrapper.find('.md-button-inner .md-icon').exists()).toBe(false)

    await wrapper.setProps({ loading: false })
    expect(wrapper.find('.md-button-loading').exists()).toBe(false)
    expect(wrapper.find('.md-button-inner .md-icon.md-icon-home').exists()).toBe(true)
  })

  it('forwards native click listeners via fallthrough', async () => {
    const onClick = vi.fn()
    const wrapper = mount(MdButton, { attrs: { onClick } })
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

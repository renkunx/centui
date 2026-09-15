/**
 * MdAgree 行为清单（自 v2 components/agree spec/源码提取，v-model → modelValue）：
 * 1. modelValue 切换 .md-agree-icon 的 checked 类
 * 2. 默认渲染 checked/check 双图标（circle），iconType=square 渲染方形双图标
 * 3. icon 插槽可自定义，且接收 checked 作用域参数
 * 4. 点击派发 update:modelValue（取反）与 change；disabled 阻断
 * 5. 默认插槽渲染协议文案
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { MdAgree } from '../../src'

describe('MdAgree', () => {
  it('toggles checked class with modelValue', async () => {
    const wrapper = mount(MdAgree, { props: { modelValue: true } })
    expect(wrapper.find('.md-agree-icon').classes()).toContain('checked')

    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.md-agree-icon').classes()).not.toContain('checked')
  })

  it('renders circle icons by default and square icons when iconType is square', () => {
    const circle = mount(MdAgree)
    expect(circle.find('.md-icon-checked').exists()).toBe(true)
    expect(circle.find('.md-icon-check').exists()).toBe(true)
    expect(circle.find('.md-icon-square-checked').exists()).toBe(false)

    const square = mount(MdAgree, { props: { iconType: 'square' } })
    expect(square.find('.md-icon-square-checked').exists()).toBe(true)
    expect(square.find('.md-icon-square-check').exists()).toBe(true)
    expect(square.find('.md-icon-checked').exists()).toBe(false)
  })

  it('supports custom icon slot with checked scope', () => {
    const wrapper = mount(MdAgree, {
      props: { modelValue: true },
      slots: {
        icon: `<template #icon="{ checked }"><span class="custom-icon">{{ checked }}</span></template>`,
      },
    })
    expect(wrapper.find('.custom-icon').text()).toBe('true')
    expect(wrapper.find('.md-icon-checked').exists()).toBe(false)
  })

  it('emits update:modelValue and change on click unless disabled', async () => {
    const wrapper = mount(MdAgree, { slots: { default: '我已阅读并同意协议' } })
    expect(wrapper.find('.md-agree-content').text()).toBe('我已阅读并同意协议')

    await wrapper.find('.md-agree-icon').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.emitted('change')).toHaveLength(1)

    const disabled = mount(MdAgree, { props: { disabled: true } })
    await disabled.find('.md-agree-icon').trigger('click')
    expect(disabled.emitted('update:modelValue')).toBeUndefined()
    expect(disabled.classes()).toContain('disabled')
  })
})

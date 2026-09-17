/**
 * Radio 家族行为清单（自 v2 components/radio spec/源码提取，v-model → modelValue）：
 * MdRadio：
 * 1. 选中态：modelValue === name；图标 checked/check/check-disabled 切换；inline 修饰类
 * 2. 点击：派发 name（不可反选）；disabled 阻断
 * MdRadioBox：盒子样式 + 点击派发
 * MdRadioGroup：注入组，子项点击 → update:modelValue(name)
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { MdRadio, MdRadioBox, MdRadioGroup } from '../../src'

const GroupHost = defineComponent({
  components: { MdRadioGroup, MdRadio },
  props: { modelValue: { type: [String, Number], default: '' } },
  emits: ['update:modelValue'],
  template: `<MdRadioGroup :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <MdRadio name="a" />
    <MdRadio name="b" disabled />
  </MdRadioGroup>`,
})

describe('MdRadio', () => {
  it('selects name on click without deselect', async () => {
    const wrapper = mount(MdRadio, { props: { name: 'day', label: '日结算' } })
    expect(wrapper.find('.md-icon-check').exists()).toBe(true)
    expect(wrapper.find('.md-radio-label').text()).toBe('日结算')

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['day']])

    const checked = mount(MdRadio, { props: { name: 'day', modelValue: 'day' } })
    expect(checked.classes()).toContain('is-checked')
    expect(checked.find('.md-icon-checked').exists()).toBe(true)

    await checked.trigger('click')
    // 单选不可反选：仍派发 name
    expect(checked.emitted('update:modelValue')).toEqual([['day']])
  })

  it('applies inline class and blocks disabled', async () => {
    const wrapper = mount(MdRadio, { props: { name: 'a', inline: true } })
    expect(wrapper.classes()).toContain('is-inline')

    const disabled = mount(MdRadio, { props: { name: 'a', disabled: true } })
    expect(disabled.classes()).toContain('is-disabled')
    expect(disabled.find('.md-icon-check-disabled').exists()).toBe(true)
    await disabled.trigger('click')
    expect(disabled.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('MdRadioBox', () => {
  it('renders box with tag when checked and emits name', async () => {
    const wrapper = mount(MdRadioBox, { props: { name: 'a', modelValue: 'a', label: '选项' } })
    expect(wrapper.classes()).toContain('is-checked')
    expect(wrapper.find('.md-tag .md-icon-right').exists()).toBe(true)

    const unchecked = mount(MdRadioBox, { props: { name: 'b', modelValue: 'a' } })
    await unchecked.trigger('click')
    expect(unchecked.emitted('update:modelValue')).toEqual([['b']])
  })
})

describe('MdRadioGroup', () => {
  it('emits selected name from child clicks', async () => {
    const onInput = vi.fn()
    const wrapper = mount(GroupHost, {
      props: { modelValue: 'a', 'onUpdate:modelValue': onInput },
    })
    await wrapper.findAll('.md-radio')[0].trigger('click')
    expect(onInput).toHaveBeenCalledWith('a')

    await wrapper.findAll('.md-radio')[1].trigger('click')
    // disabled 项不派发
    expect(onInput).toHaveBeenCalledTimes(1)
  })
})

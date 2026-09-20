/**
 * Check 家族行为清单（自 v2 components/check spec/源码提取，v-model → modelValue）：
 * CuCheck：
 * 1. 选中态：modelValue === name；图标随 disabled/选中/未选中切换（checked/check/check-disabled）
 * 2. 点击：布尔名取反；已选反选派发 ''；未选派发 name；disabled 阻断
 * CuCheckBox：盒子样式 + quarter 角标；点击逻辑同 CuCheck
 * CuCheckGroup：
 * 3. 注入组：子项点击 → update:modelValue 增删；max 限制；toggle/toggleAll
 * 4. toggleAll 保留 disabled 项原状态
 * CuCheckList：options 渲染 + is-checked + 图标方位（left/right 插槽）
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { CuCheck, CuCheckBox, CuCheckGroup, CuCheckList } from '../../src'

const GroupHost = defineComponent({
  components: { CuCheckGroup, CuCheck },
  props: { modelValue: { type: Array, default: () => [] }, max: { type: Number, default: 0 } },
  emits: ['update:modelValue'],
  template: `<CuCheckGroup :model-value="modelValue" :max="max" @update:model-value="$emit('update:modelValue', $event)">
    <CuCheck name="a" />
    <CuCheck name="b" />
    <CuCheck name="c" disabled />
  </CuCheckGroup>`,
})

describe('CuCheck', () => {
  it('toggles checked state and icon', async () => {
    const wrapper = mount(CuCheck, { props: { name: 'day', label: '日结算' } })
    expect(wrapper.classes()).not.toContain('is-checked')
    expect(wrapper.find('.cu-icon-check').exists()).toBe(true)
    expect(wrapper.find('.cu-check-label').text()).toBe('日结算')

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['day']])

    const checked = mount(CuCheck, { props: { name: 'day', modelValue: 'day' } })
    expect(checked.classes()).toContain('is-checked')
    expect(checked.find('.cu-icon-checked').exists()).toBe(true)

    await checked.trigger('click')
    expect(checked.emitted('update:modelValue')).toEqual([['']])
  })

  it('inverts boolean name', async () => {
    const wrapper = mount(CuCheck, { props: { name: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('blocks interaction when disabled', async () => {
    const wrapper = mount(CuCheck, { props: { name: 'a', disabled: true } })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('.cu-icon-check-disabled').exists()).toBe(true)

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('supports custom icons and svg', () => {
    const wrapper = mount(CuCheck, {
      props: { name: 'a', modelValue: 'a', icon: 'right', iconInverse: 'wrong' },
    })
    expect(wrapper.find('.cu-icon-right').exists()).toBe(true)

    const inverse = mount(CuCheck, { props: { name: 'a', iconInverse: 'wrong' } })
    expect(inverse.find('.cu-icon-wrong').exists()).toBe(true)
  })
})

describe('CuCheckBox', () => {
  it('renders base box with quarter tag when checked', async () => {
    const wrapper = mount(CuCheckBox, { props: { name: 'a', modelValue: 'a', label: '选项' } })
    expect(wrapper.classes()).toContain('is-checked')
    expect(wrapper.find('.cu-tag .cu-icon-right').exists()).toBe(true)
    expect(wrapper.text()).toContain('选项')

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])

    const disabled = mount(CuCheckBox, { props: { name: 'b', disabled: true } })
    await disabled.trigger('click')
    expect(disabled.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('CuCheckGroup', () => {
  it('adds and removes values via child clicks', async () => {
    const wrapper = mount(GroupHost, { props: { modelValue: [] } })
    const checks = wrapper.findAll('.cu-check')
    await checks[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a']])

    await checks[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['b']])

    // 组的 toggle 基于当前 props 值做增删（宿主负责回写）
    const seeded = mount(GroupHost, { props: { modelValue: ['a', 'b'] } })
    seeded.findComponent(CuCheckGroup).vm.toggle?.('a')
    expect(seeded.emitted('update:modelValue')?.at(-1)).toEqual([['b']])
  })

  it('respects max limit', async () => {
    const wrapper = mount(GroupHost, { props: { modelValue: ['a'], max: 1 } })
    await wrapper.findAll('.cu-check')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('toggleAll keeps disabled options unchanged', async () => {
    const wrapper = mount(GroupHost, { props: { modelValue: ['c'] } })
    wrapper.findComponent(CuCheckGroup).vm.toggleAll?.()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'b', 'c']])

    // v2 契约：全不选时保留 disabled 且已选的项
    const off = mount(GroupHost, { props: { modelValue: ['a', 'c'] } })
    off.findComponent(CuCheckGroup).vm.toggleAll?.(false)
    expect(off.emitted('update:modelValue')?.at(-1)).toEqual([['c']])
  })
})

describe('CuCheckList', () => {
  it('renders options with checked state and toggles on click', async () => {
    const onInput = vi.fn()
    const wrapper = mount(CuCheckList, {
      props: {
        modelValue: ['a'],
        options: [
          { value: 'a', label: '选项一' },
          { value: 'b', label: '选项二', brief: '描述' },
        ],
        'onUpdate:modelValue': onInput,
      },
    })
    const items = wrapper.findAll('.cu-check-item')
    expect(items[0].classes()).toContain('is-checked')
    expect(items[0].find('.cu-cell-item-title').text()).toBe('选项一')
    expect(items[1].find('.cu-cell-item-brief').text()).toBe('描述')
    expect(wrapper.find('.cu-check .cu-icon-checked').exists()).toBe(true)

    await items[1].trigger('click')
    expect(onInput).toHaveBeenCalledWith(['a', 'b'])
  })

  it('forwards scoped slot and icon position', () => {
    const scoped = mount(CuCheckList, {
      props: { modelValue: [], options: [{ value: 'a' }] },
      slots: {
        default: `<template #default="{ option, selected }"><i class="row">{{ option.value }}-{{ selected }}</i></template>`,
      },
    })
    expect(scoped.find('.row').text()).toBe('a-false')

    const left = mount(CuCheckList, {
      props: { modelValue: [], options: [{ value: 'a' }], iconPosition: 'left' },
    })
    expect(left.find('.cu-cell-item-left .cu-check').exists()).toBe(true)
    expect(left.find('.cu-cell-item-right .cu-check').exists()).toBe(false)
  })
})

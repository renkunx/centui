/**
 * MdSwitch 行为清单（自 v2 components/switch spec/源码提取，v-model → modelValue）：
 * 1. modelValue 映射 active 类；disabled 映射 disabled 类
 * 2. 点击派发 update:modelValue（取反）与 change
 * 3. disabled 时点击不派发任何事件
 * 4. v-model 双向绑定生效
 */
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { MdSwitch } from '../../src'

describe('MdSwitch', () => {
  it('maps modelValue and disabled to classes', async () => {
    const wrapper = mount(MdSwitch, { props: { modelValue: true } })
    expect(wrapper.classes()).toContain('active')

    await wrapper.setProps({ modelValue: false })
    expect(wrapper.classes()).not.toContain('active')

    await wrapper.setProps({ disabled: true })
    expect(wrapper.classes()).toContain('disabled')
  })

  it('emits update:modelValue and change on click', async () => {
    const wrapper = mount(MdSwitch, { props: { modelValue: false } })
    await wrapper.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(MdSwitch, { props: { modelValue: true, disabled: true } })
    await wrapper.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.classes()).toContain('active')
  })

  it('works with v-model binding', async () => {
    const Host = defineComponent({
      components: { MdSwitch },
      data: () => ({ value: false }),
      template: `<MdSwitch v-model="value" />`,
    })
    const wrapper = mount(Host)
    expect(wrapper.find('.md-switch').classes()).not.toContain('active')

    await wrapper.find('.md-switch').trigger('click')
    expect((wrapper.vm as { value: boolean }).value).toBe(true)
    expect(wrapper.find('.md-switch').classes()).toContain('active')
  })
})

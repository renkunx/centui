/**
 * InputItem/Codebox 补充行为与覆盖（jsdom 可达分支）：
 * InputItem：digit 过滤、自定义 formation、maxlength 截断、Enter confirm、
 * clear 点击清空、error/brief 渲染、虚拟键盘 fake input 交互、disabled/readonly
 * Codebox：system 原生输入、justify/is-error 样式、maxlength<=0 专业键盘分支、失焦
 */
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { CuCodebox, CuInputItem } from '../../src'
import CuNumberKeyboard from '../../src/components/number-keyboard/NumberKeyboard.vue'

describe('CuInputItem 补充', () => {
  it('filters non-digits for digit type', async () => {
    const wrapper = mount(CuInputItem, { props: { type: 'digit', modelValue: '' } })
    await wrapper.find('input').setValue('12a3')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('123')
  })

  it('passes maxlength through for plain text (native truncation)', () => {
    const wrapper = mount(CuInputItem, { props: { maxlength: 3, modelValue: '' } })
    expect(wrapper.find('input').attributes('maxlength')).toBe('3')
  })

  it('uses custom formation when provided', async () => {
    const wrapper = mount(CuInputItem, {
      props: {
        isFormative: true,
        formation: (_name, curValue) => ({ value: `[${curValue}]`, range: curValue.length + 2 }),
        modelValue: '',
      },
    })
    await wrapper.find('input').setValue('ab')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('[ab]')
  })

  it('emits confirm on Enter keyup and keydown/keyup forwarding', async () => {
    const wrapper = mount(CuInputItem, { props: { name: 'kw' } })
    await wrapper.find('input').trigger('keyup', { keyCode: 13 })
    expect(wrapper.emitted('confirm')).toBeTruthy()
    await wrapper.find('input').trigger('keydown', { keyCode: 65 })
    expect(wrapper.emitted('keydown')).toBeTruthy()
  })

  it('clears value via clear button', async () => {
    const onInput = vi.fn()
    const wrapper = mount(CuInputItem, {
      props: { modelValue: 'x', clearable: true, 'onUpdate:modelValue': onInput },
    })
    await wrapper.find('input').trigger('focus')
    await wrapper.find('.cu-input-item-clear').trigger('click')
    expect(onInput).toHaveBeenCalledWith('')
  })

  it('renders error and hides brief when both present (v2 contract)', () => {
    const wrapper = mount(CuInputItem, {
      props: { error: '错误提示', brief: '辅助说明' },
    })
    expect(wrapper.find('.cu-input-item-msg p').text()).toBe('错误提示')
    expect(wrapper.find('.cu-input-item-brief').exists()).toBe(false)
    expect(wrapper.classes()).toContain('is-error')

    const briefed = mount(CuInputItem, { props: { brief: '辅助说明' } })
    expect(briefed.find('.cu-input-item-brief p').text()).toBe('辅助说明')
    expect(briefed.classes()).toContain('with-brief')
  })

  it('blocks fake input interaction when disabled or readonly', async () => {
    const wrapper = mount(CuInputItem, {
      props: { isVirtualKeyboard: true, disabled: true },
    })
    await wrapper.find('.cu-input-item-fake').trigger('click')
    expect(wrapper.find('.cu-input-item-fake').classes()).not.toContain('is-focus')
  })

  it('interacts with built-in number keyboard in virtual mode', async () => {
    const Host = defineComponent({
      components: { CuInputItem },
      data: () => ({ value: '' }),
      template: `<CuInputItem v-model="value" is-virtual-keyboard is-view title="金额" />`,
    })
    const wrapper = mount(Host)
    await wrapper.find('.cu-input-item-fake').trigger('click')
    const kb = wrapper.findComponent(CuNumberKeyboard)
    expect(kb.exists()).toBe(true)

    // 键盘事件驱动 fake input 输入
    kb.vm.$emit('enter', '5')
    await flushPromises()
    expect((wrapper.vm as { value: string }).value).toBe('5')

    kb.vm.$emit('delete')
    await flushPromises()
    expect((wrapper.vm as { value: string }).value).toBe('')

    kb.vm.$emit('confirm')
    await flushPromises()
    expect(wrapper.findComponent(CuInputItem).emitted('confirm')).toBeTruthy()
  })

  it('exposes focus/blur/getValue', async () => {
    const wrapper = mount(CuInputItem, { props: { modelValue: 'abc' } })
    expect(wrapper.vm.getValue()).toBe('abc')
    wrapper.vm.focus()
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(wrapper.classes()).toContain('is-focus')
    wrapper.vm.blur()
  })

  it('hides placeholder in title-latent mode when active', async () => {
    const wrapper = mount(CuInputItem, {
      props: { isTitleLatent: true, title: '姓名', placeholder: '请输入', modelValue: '张' },
    })
    expect((wrapper.find('input').element as HTMLInputElement).placeholder).toBe('')
  })
})

describe('CuCodebox 补充', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('inputs via system keyboard and submits when full', async () => {
    const wrapper = mount(CuCodebox, { props: { system: true, maxlength: 2 } })
    await wrapper.find('.cu-codebox-input').setValue('12')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['12'])
    expect(wrapper.emitted('submit')).toEqual([['12']])
  })

  it('renders justify and error styles', () => {
    const wrapper = mount(CuCodebox, {
      props: { justify: true, isErrorStyle: true, maxlength: 4 },
    })
    expect(wrapper.find('.cu-codebox').classes()).toContain('is-justify')
    expect(wrapper.find('.cu-codebox-box').classes()).toContain('is-error')
  })

  it('renders professional keyboard when maxlength <= 0', () => {
    const wrapper = mount(CuCodebox, { props: { maxlength: -1, isView: true } })
    expect(wrapper.findComponent({ name: 'cu-number-keyboard' }).vm.$props.type).toBe(
      'professional',
    )
  })

  it('loses focus on outside click when closable', async () => {
    const wrapper = mount(CuCodebox, { props: { isView: true } })
    await wrapper.find('.cu-codebox').trigger('click')
    document.body.click()
    await flushPromises()
    expect(wrapper.findAll('.cu-codebox-box.is-active')).toHaveLength(0)
  })
})

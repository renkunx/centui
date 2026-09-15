/**
 * MdStepper 行为清单（自 v2 components/stepper test/index.spec.js 提取，v-model → modelValue）：
 * 1. 初始值：modelValue 优先，否则 defaultValue；越界收敛到 [min, max]
 * 2. +/- 按步进增减（浮点精度安全），触边后按钮置 disabled 态（isMin/isMax）
 * 3. disabled 阻断按钮操作；readOnly 输入框只读；isInteger 输入 tel 且向下取整
 * 4. 值变化派发 update:modelValue / change；增减分别派发 increase / decrease（携带差值）
 * 5. 输入：input 事件即时格式化非法字符并更新；focus 后外部 modelValue 变化被忽略（编辑态）；
 *    blur 收敛到合法区间
 * 6. min > max 时告警
 */
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MdStepper } from '../../src'

function mountHost(value: number) {
  const Host = defineComponent({
    components: { MdStepper },
    data: () => ({ value }),
    template: `<MdStepper v-model="value" :min="0" />`,
  })
  return mount(Host)
}

describe('MdStepper', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('initializes from modelValue and clamps into range', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 5, min: 0, max: 10 } })
    await flushPromises()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('5')

    // v2 契约：formatNum 正则会剥离前导负号，-3 先变 3 再与 min 比较
    const low = mount(MdStepper, { props: { modelValue: -3, min: 0 } })
    await flushPromises()
    expect((low.find('input').element as HTMLInputElement).value).toBe('3')

    const high = mount(MdStepper, { props: { modelValue: 99, max: 10 } })
    await flushPromises()
    expect((high.find('input').element as HTMLInputElement).value).toBe('10')
  })

  it('falls back to defaultValue when modelValue is falsy', async () => {
    const wrapper = mount(MdStepper, { props: { defaultValue: 3, min: 0 } })
    await flushPromises()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('3')
  })

  it('steps by step size with float precision safety', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 1, step: 2 } })
    await wrapper.find('.md-stepper-button-add').trigger('click')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('3')

    const float = mount(MdStepper, { props: { modelValue: 1, step: 0.1 } })
    await float.find('.md-stepper-button-add').trigger('click')
    expect((float.find('input').element as HTMLInputElement).value).toBe('1.1')
  })

  it('disables reduce/add buttons at boundaries', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 1, min: 0, max: 2 } })
    await flushPromises()
    expect(wrapper.find('.md-stepper-button-reduce').classes()).not.toContain('disabled')

    await wrapper.find('.md-stepper-button-reduce').trigger('click')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0')
    expect(wrapper.find('.md-stepper-button-reduce').classes()).toContain('disabled')

    await wrapper.find('.md-stepper-button-reduce').trigger('click')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0')

    await wrapper.find('.md-stepper-button-add').trigger('click')
    await wrapper.find('.md-stepper-button-add').trigger('click')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('2')
    expect(wrapper.find('.md-stepper-button-add').classes()).toContain('disabled')
  })

  it('blocks operations when disabled', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 1, disabled: true } })
    expect(wrapper.classes()).toContain('disabled')

    await wrapper.find('.md-stepper-button-add').trigger('click')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('supports readOnly and isInteger', async () => {
    const readOnly = mount(MdStepper, { props: { readOnly: true } })
    expect(readOnly.find('input').attributes('readonly')).toBeDefined()

    const integer = mount(MdStepper, { props: { modelValue: 3, isInteger: true } })
    expect(integer.find('input').attributes('type')).toBe('tel')

    await integer.find('input').setValue('5.7')
    expect((integer.find('input').element as HTMLInputElement).value).toBe('5')
  })

  it('emits update:modelValue and change on value change', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 1 } })
    await wrapper.find('.md-stepper-button-add').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
    expect(wrapper.emitted('change')).toEqual([[2]])
  })

  it('emits increase and decrease with diff', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 0 } })
    await wrapper.find('.md-stepper-button-add').trigger('click')
    expect(wrapper.emitted('increase')).toEqual([[1]])

    await wrapper.find('.md-stepper-button-reduce').trigger('click')
    expect(wrapper.emitted('decrease')).toEqual([[1]])
  })

  it('formats raw input and syncs value', async () => {
    // number 输入框浏览器/jsdom 会自行丢弃非法字符，非法格式化契约在 tel 模式验证
    const wrapper = mount(MdStepper, { props: { modelValue: 1, isInteger: true } })
    await wrapper.find('input').setValue('1x2')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('12')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([12])
  })

  it('ignores external modelValue change while editing', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 1 } })
    await wrapper.find('input').trigger('focus')

    await wrapper.setProps({ modelValue: 9 })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1')

    await wrapper.find('input').trigger('blur')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1')
  })

  it('clamps current value on blur', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 1, min: 2, max: 5 } })
    await wrapper.find('input').trigger('blur')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('2')
  })

  it('clamps when min/max props change', async () => {
    const wrapper = mount(MdStepper, { props: { modelValue: 3 } })
    await flushPromises()
    await wrapper.setProps({ min: 5 })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('5')

    await wrapper.setProps({ max: 4 })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('4')
  })

  it('warns when min is larger than max', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    mount(MdStepper, { props: { min: 5, max: 3 } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('minNum is larger than maxNum'))
  })

  it('works with v-model binding', async () => {
    const wrapper = mountHost(1)
    await wrapper.find('.md-stepper-button-add').trigger('click')
    expect((wrapper.vm as { value: number }).value).toBe(2)
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('2')
  })
})

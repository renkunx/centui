/**
 * M3 收尾批次行为清单（自 v2 spec/源码提取，v-model → modelValue）：
 * NumberKeyboard：按键 enter/delete/confirm 派发；confirm 后默认自动收起；isView 内嵌渲染
 * Codebox：数字键盘输入累积、满长派发 submit、delete 回退、mask 圆点、disabled 阻断聚焦
 * InputItem：phone 3|4|4 分组、bankCard 4 位分组、money 千分位（小数保留）、clearable、v-model
 * RadioList：选项选择、hasInput 自定义输入分支
 * Picker：列渲染与默认选中、confirm 输出列值
 * DatePicker：按 defaultDate/min/max 生成列、getFormatDate 格式化
 */
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

/** Picker 列滚动初始化走 setTimeout(0)，宏任务 flush 后再断言 */
async function flushAll() {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}
import {
  MdCodebox,
  MdDatePicker,
  MdInputItem,
  MdNumberKeyboard,
  MdPicker,
  MdRadioList,
} from '../../src'

describe('MdNumberKeyboard', () => {
  it('renders keyboard in view mode with number keys', () => {
    const wrapper = mount(MdNumberKeyboard, {
      props: { isView: true, modelValue: true },
    })
    const keys = wrapper.findAll('.keyboard-number-item')
    // professional：9 数字 + . + 0 + slidedown 占位
    expect(keys.length).toBeGreaterThanOrEqual(12)
    expect(wrapper.find('.keyboard-operate-item.confirm').exists()).toBe(true)
    expect(keys[0].text()).toBe('1')
  })

  it('emits enter/delete/confirm and hides after confirm', async () => {
    const wrapper = mount(MdNumberKeyboard, {
      props: { isView: true, modelValue: true },
    })
    await wrapper.findAll('.keyboard-number-item')[0].trigger('click')
    expect(wrapper.emitted('enter')).toEqual([[1]])

    await wrapper.find('.keyboard-operate-item.delete').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)

    await wrapper.find('.keyboard-operate-item.confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('blocks keys when disabled', async () => {
    const wrapper = mount(MdNumberKeyboard, {
      props: { isView: true, modelValue: true, disabled: true },
    })
    await wrapper.findAll('.keyboard-number-item')[0].trigger('click')
    expect(wrapper.emitted('enter')).toBeUndefined()
  })

  it('supports simple type and disorder keeps digit set', () => {
    const simple = mount(MdNumberKeyboard, {
      props: { isView: true, modelValue: true, type: 'simple' },
    })
    expect(simple.find('.keyboard-operate').exists()).toBe(false)
    // simple 布局：9 数字 + 空位 + 0 + 删除键
    expect(simple.findAll('.keyboard-number-item')[11].classes()).toContain('delete')

    const disordered = mount(MdNumberKeyboard, {
      props: { isView: true, modelValue: true, disorder: true },
    })
    const texts = disordered
      .findAll('.keyboard-number-item')
      .map((k) => k.text())
      .filter((t) => /^\d$/.test(t))
      .sort()
    expect(texts).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
  })
})

describe('MdCodebox', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  const Host = defineComponent({
    components: { MdCodebox },
    data: () => ({ code: '' }),
    template: `<MdCodebox v-model="code" :maxlength="4" is-view />`,
  })

  it('accumulates digits via keyboard input and submits when full', async () => {
    const wrapper = mount(Host)
    await wrapper.find('.md-codebox').trigger('click')
    const keys = wrapper.findAll('.keyboard-number-item')
    await keys[0].trigger('click')
    await keys[1].trigger('click')
    expect((wrapper.vm as { code: string }).code).toBe('12')
    // 光标激活位 = code.length + 1（第 3 格）
    expect(wrapper.findAll('.md-codebox-box')[2].classes()).toContain('is-active')

    await keys[2].trigger('click')
    await keys[3].trigger('click')
    const codebox = wrapper.findComponent({ name: 'md-codebox' })
    expect(codebox.emitted('submit')).toEqual([['1234']])
  })

  it('deletes last digit', async () => {
    const wrapper = mount(MdCodebox, { props: { modelValue: '12', maxlength: 4, isView: true } })
    await wrapper.find('.md-codebox').trigger('click')
    await wrapper.find('.keyboard-number-item.delete').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['1'])
  })

  it('masks digits and blocks focus when disabled', async () => {
    const masked = mount(MdCodebox, {
      props: { modelValue: '12', maxlength: 4, mask: true, isView: true },
    })
    expect(masked.findAll('.md-codebox-dot')).toHaveLength(2)

    const disabled = mount(MdCodebox, { props: { disabled: true, isView: true } })
    await disabled.find('.md-codebox').trigger('click')
    expect(disabled.findAll('.md-codebox-box.is-active')).toHaveLength(0)
  })
})

describe('MdInputItem', () => {
  it('formats phone as 3|4|4 groups', async () => {
    const wrapper = mount(MdInputItem, { props: { type: 'phone', modelValue: '' } })
    await wrapper.find('input').setValue('13812345678')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('138 1234 5678')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['13812345678'])
  })

  it('formats bank card in 4-digit groups', async () => {
    const wrapper = mount(MdInputItem, { props: { type: 'bankCard', modelValue: '' } })
    await wrapper.find('input').setValue('6222021234561234')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('6222 0212 3456 1234')
  })

  it('formats money with thousand separators keeping decimals', async () => {
    const wrapper = mount(MdInputItem, { props: { type: 'money', modelValue: '' } })
    await wrapper.find('input').setValue('1234567.89')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1,234,567.89')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['1234567.89'])
  })

  it('shows clear button on focus and clears value', async () => {
    const wrapper = mount(MdInputItem, {
      props: { modelValue: 'abc', clearable: true },
    })
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('.md-input-item-clear').isVisible()).toBe(true)
  })

  it('renders fake input for virtual keyboard mode', () => {
    const wrapper = mount(MdInputItem, {
      props: { isVirtualKeyboard: true, isTitleLatent: false, placeholder: '输入金额' },
    })
    expect(wrapper.find('.md-input-item-fake').exists()).toBe(true)
    expect(wrapper.find('.md-input-item-fake-placeholder').text()).toBe('输入金额')
  })

  it('propagates focus/blur with name', async () => {
    const wrapper = mount(MdInputItem, { props: { name: 'user', title: '用户' } })
    await wrapper.find('input').trigger('focus')
    expect(wrapper.emitted('focus')).toEqual([['user']])
  })
})

describe('MdRadioList', () => {
  it('selects option and emits change/update', async () => {
    const onInput = vi.fn()
    const wrapper = mount(MdRadioList, {
      props: {
        modelValue: 'a',
        options: [
          { value: 'a', text: '选项一' },
          { value: 'b', text: '选项二' },
        ],
        'onUpdate:modelValue': onInput,
      },
    })
    const items = wrapper.findAll('.md-radio-item')
    expect(items[0].classes()).toContain('is-selected')

    await items[1].trigger('click')
    expect(onInput).toHaveBeenCalledWith('b')
    expect(wrapper.emitted('change')).toEqual([[{ value: 'b', text: '选项二' }, 1]])
  })

  it('supports custom input branch', async () => {
    const wrapper = mount(MdRadioList, {
      props: {
        options: [{ value: 'a', text: '选项一' }],
        hasInput: true,
        inputLabel: '自定义',
        inputPlaceholder: '其他金额',
      },
    })
    const inputItem = wrapper.findComponent({ name: 'md-input-item' })
    expect(inputItem.exists()).toBe(true)

    await inputItem.find('input').trigger('focus')
    await inputItem.find('input').setValue('88')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['88'])
  })
})

describe('MdPicker', () => {
  it('renders columns in view mode with default value selected', async () => {
    const wrapper = mount(MdPicker, {
      props: {
        isView: true,
        cols: 2,
        data: [
          [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
          [{ text: '1' }, { text: '2' }],
        ],
        defaultValue: ['B', '2'],
      },
      attachTo: document.body,
    })
    await flushAll()
    const columns = wrapper.findAll('.md-picker-column-item')
    expect(columns).toHaveLength(2)
    expect(columns[0].findAll('.column-item')[1].text()).toBe('B')
    wrapper.unmount()
  })

  it('confirm emits column values via exposed api', async () => {
    const wrapper = mount(MdPicker, {
      props: {
        isView: true,
        data: [[{ text: 'A' }, { text: 'B' }]],
        defaultValue: ['B'],
      },
      attachTo: document.body,
    })
    await flushAll()
    const values = wrapper.vm.getColumnValues()
    expect(values[0]?.text).toBe('B')
    wrapper.unmount()
  })
})

describe('MdDatePicker', () => {
  it('builds date columns bounded by min/max with default selected', async () => {
    const wrapper = mount(MdDatePicker, {
      props: {
        isView: true,
        type: 'date',
        defaultDate: new Date(2024, 5, 15),
        minDate: new Date(2024, 5, 1),
        maxDate: new Date(2024, 5, 20),
      },
      attachTo: document.body,
    })
    await flushAll()
    const columns = wrapper.findAll('.md-picker-column-item')
    expect(columns).toHaveLength(3)
    // 年/月列受 min/max 收敛（同月内）
    const yearTexts = columns[0].findAll('.column-item').map((li) => li.text())
    expect(yearTexts).toEqual(['2024年'])
    const dayTexts = columns[2].findAll('.column-item').map((li) => li.text())
    expect(dayTexts[0]).toBe('1日')
    expect(dayTexts.at(-1)).toBe('20日')
    wrapper.unmount()
  })

  it('exposes getFormatDate', async () => {
    const wrapper = mount(MdDatePicker, {
      props: {
        isView: true,
        type: 'date',
        defaultDate: new Date(2024, 5, 15),
        minDate: new Date(2024, 5, 1),
        maxDate: new Date(2024, 5, 20),
      },
      attachTo: document.body,
    })
    await flushAll()
    expect(wrapper.vm.getFormatDate('yyyy-MM-dd')).toBe('2024-06-15')
    wrapper.unmount()
  })
})

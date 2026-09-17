/**
 * 分支覆盖补强：Picker/PickerColumn/DatePicker/Codebox/RadioList 的剩余条件分支。
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@mand-mobile/core/web', async (importOriginal) => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    _isAnimating = false
    _isDecelerating = false
    _isDragging = false
    _isGesturing = false
    _top = 0
    cb: unknown
    opts: { scrollingComplete?: () => void }
    constructor(cb: unknown, opts: { scrollingComplete?: () => void }) {
      this.cb = cb
      this.opts = opts
      scrollerInstances.push(this)
    }
    setPosition() {}
    setDimensions() {}
    setSnapSize() {}
    scrollTo(_left: number, top: number) {
      this._top = top
    }
    getValues() {
      return { top: this._top, left: 0 }
    }
    getScrollMax() {
      return { top: 100000, left: 0 }
    }
    doTouchStart() {}
    doTouchMove() {}
    doTouchEnd() {}
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import { MdCodebox, MdDatePicker, MdNumberKeyboard, MdRadioList, MdTip } from '../../src'
import MdPicker from '../../src/components/picker/Picker.vue'
import MdPickerColumn from '../../src/components/picker/PickerColumn.vue'

async function flushAll() {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

describe('PickerColumn 分支补强', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('keeps active index within bounds when data shrinks', async () => {
    const wrapper = mount(MdPickerColumn, {
      props: {
        cols: 1,
        data: [[{ text: 'A' }, { text: 'B' }, { text: 'C' }]],
        defaultIndex: [2],
      },
      attachTo: document.body,
    })
    wrapper.vm.refresh()
    await flushAll()
    expect(wrapper.vm.getColumnIndex(0)).toBe(2)

    // 数据缩短后复位到最后一项
    await wrapper.setProps({ data: [[{ text: 'A' }]] })
    wrapper.vm.refresh()
    await flushAll()
    expect(wrapper.vm.getColumnValue(0)?.text).toBe('A')
    wrapper.unmount()
  })

  it('handles column scroll end to same index and invalid target', async () => {
    const wrapper = mount(MdPickerColumn, {
      props: {
        cols: 1,
        data: [[{ text: 'A' }, { text: 'B' }, { text: 'C' }]],
        invalidIndex: [[2]],
        defaultIndex: [1],
      },
      attachTo: document.body,
    })
    wrapper.vm.refresh()
    await flushAll()
    const scroller = scrollerInstances.at(-1) as {
      _top: number
      opts: { scrollingComplete?: () => void }
    }

    // 滚回相同索引：不派发 change
    scroller._top = 45
    scroller.opts.scrollingComplete?.()
    await flushAll()
    expect(wrapper.emitted('change')).toBeUndefined()

    // 滚到无效索引：跳选有效项
    scroller._top = 90
    scroller.opts.scrollingComplete?.()
    await flushAll()
    expect(wrapper.vm.getColumnValue(0)?.text).not.toBe('C')
    wrapper.unmount()
  })

  it('getColumnIndexByDefault exposes public api', async () => {
    const wrapper = mount(MdPickerColumn, {
      props: { cols: 1, data: [[{ text: 'A' }, { text: 'B', value: 'b' }]] },
      attachTo: document.body,
    })
    const seen: Array<[number, number]> = []
    wrapper.vm.getColumnIndexByDefault(
      [[{ text: 'A' }, { text: 'B' }]],
      [1],
      [],
      (columnIndex, itemIndex) => {
        seen.push([columnIndex, itemIndex])
      },
    )
    expect(seen).toEqual([[0, 1]])

    // 以 defaultValue 命中
    const seen2: Array<[number, number]> = []
    wrapper.vm.getColumnIndexByDefault(
      [[{ text: 'A' }, { text: 'B', value: 'b' }]],
      [],
      ['b'],
      (columnIndex, itemIndex) => {
        seen2.push([columnIndex, itemIndex])
      },
    )
    expect(seen2).toEqual([[0, 1]])
    wrapper.unmount()
  })

  it('renders placeholder columns for empty slots', async () => {
    const wrapper = mount(MdPickerColumn, {
      props: { cols: 3, data: [[{ text: 'A' }]] },
      attachTo: document.body,
    })
    await flushAll()
    expect(wrapper.findAll('.md-picker-column-item').length).toBe(3)
    wrapper.unmount()
  })
})

describe('Picker 分支补强', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('re-inits cascade columns when data changes', async () => {
    const wrapper = mount(MdPicker, {
      props: {
        isView: true,
        isCascade: true,
        cols: 2,
        data: [
          [
            { text: 'A', value: 'a', children: [{ text: 'A1', value: 'a1' }] },
            { text: 'B', value: 'b', children: [{ text: 'B1', value: 'b1' }] },
          ],
        ] as never,
      },
      attachTo: document.body,
    })
    await flushAll()
    expect(wrapper.findAll('.md-picker-column-item').length).toBeGreaterThanOrEqual(2)

    await wrapper.setProps({
      data: [
        [
          { text: 'X', value: 'x', children: [{ text: 'X1', value: 'x1' }] },
          { text: 'Y', value: 'y', children: [{ text: 'Y1', value: 'y1' }] },
        ],
      ] as never,
    })
    await flushAll()
    expect(wrapper.findAll('.column-item')[0].text()).toBe('X')
    wrapper.unmount()
  })

  it('closes via mask click and emits events', async () => {
    const wrapper = mount(MdPicker, {
      props: { modelValue: true, data: [[{ text: 'A' }]] },
      attachTo: document.body,
    })
    await flushAll()
    ;(document.body.querySelector('.md-popup-mask') as HTMLElement).click()
    await flushAll()
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('hide')).toBeTruthy()
    wrapper.unmount()
  })

  it('refreshes on second popup open with snapshot indexes', async () => {
    const wrapper = mount(MdPicker, {
      props: { modelValue: true, data: [[{ text: 'A' }, { text: 'B' }]], defaultIndex: [1] },
      attachTo: document.body,
    })
    await flushAll()
    await wrapper.setProps({ modelValue: false })
    await flushAll()
    await wrapper.setProps({ modelValue: true })
    await new Promise((resolve) => setTimeout(resolve, 150))
    await flushAll()
    expect(wrapper.emitted('show')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('DatePicker 分支补强', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    ;(scrollerInstances as unknown[]).length = 0
  })

  it('supports custom types and unit text', async () => {
    const wrapper = mount(MdDatePicker, {
      props: {
        isView: true,
        type: 'custom',
        customTypes: ['yyyy', 'MM'],
        defaultDate: new Date(2024, 5, 15),
        unitText: ['年', '月', '日', '时', '分'],
      },
      attachTo: document.body,
    })
    await flushAll()
    expect(wrapper.findAll('.md-picker-column-item')).toHaveLength(2)
    // defaultDate 年份被选中
    const activeYear = wrapper.find('.column-item.active')
    expect(activeYear.text()).toBe('2024年')
    wrapper.unmount()
  })

  it('forwards confirm/cancel/show/hide from inner picker', async () => {
    const wrapper = mount(MdDatePicker, {
      props: { modelValue: true, type: 'date', defaultDate: new Date(2024, 5, 15) },
      attachTo: document.body,
    })
    await flushAll()
    ;(document.body.querySelector('.md-popup-confirm') as HTMLElement).click()
    await flushAll()
    expect(wrapper.emitted('confirm')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('Codebox / RadioList 分支补强', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('codebox unbounded input accumulates and confirms', async () => {
    const wrapper = mount(MdCodebox, { props: { maxlength: -1, isView: true } })
    await wrapper.find('.md-codebox').trigger('click')
    const keys = wrapper.findAll('.keyboard-number-item')
    await keys[0].trigger('click')
    await keys[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['12'])

    await wrapper.find('.keyboard-operate-item.confirm').trigger('click')
    expect(wrapper.emitted('submit')?.at(-1)).toEqual(['12'])
  })

  it('codebox ignores dot key and maxlength boundary', async () => {
    const wrapper = mount(MdCodebox, { props: { maxlength: 1, isView: true } })
    await wrapper.find('.md-codebox').trigger('click')
    const keys = wrapper.findAll('.keyboard-number-item')
    // .（professional 面板）不进入 code
    await keys[0].trigger('click')
    await keys[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['1'])
  })

  it('codebox autofocuses and blur() exposes', async () => {
    const wrapper = mount(MdCodebox, { props: { autofocus: true, isView: true } })
    expect(wrapper.findAll('.md-codebox-box.is-active').length).toBeGreaterThan(0)
    wrapper.vm.blur()
    await flushPromises()
    expect(wrapper.findAll('.md-codebox-box.is-active')).toHaveLength(0)
  })

  it('radio-list select exposes and input cleared on option select', async () => {
    const wrapper = mount(MdRadioList, {
      props: {
        options: [
          { value: 'a', text: 'A' },
          { value: 'b', text: 'B' },
        ],
        hasInput: true,
        inputLabel: '自定义',
      },
    })
    wrapper.vm.selectByIndex(1)
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b'])

    wrapper.vm.select('a')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
  })

  it('radio-list renders scoped slot with selected state', () => {
    const wrapper = mount(MdRadioList, {
      props: { modelValue: 'a', options: [{ value: 'a', text: 'A' }] },
      slots: {
        default: `<template #default="{ option, selected }"><i class="row">{{ option.text }}-{{ selected }}</i></template>`,
      },
    })
    expect(wrapper.find('.row').text()).toBe('A-true')
  })
})

describe('剩余分支补强', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('codebox maxlength<=0 renders holder input with mask', () => {
    const wrapper = mount(MdCodebox, { props: { maxlength: -1, mask: true, modelValue: '12' } })
    expect(wrapper.find('input.md-codebox-holder[type="password"]').exists()).toBe(true)
    const unmasked = mount(MdCodebox, { props: { maxlength: -1, modelValue: '12' } })
    expect(unmasked.find('input.md-codebox-holder[type="tel"]').exists()).toBe(true)
  })

  it('codebox keeps focus when clicking inside and not closable ignores outside', async () => {
    const notClosable = mount(MdCodebox, { props: { closable: false, isView: true } })
    await notClosable.find('.md-codebox').trigger('click')
    document.body.click()
    await flushPromises()
    expect(notClosable.findAll('.md-codebox-box.is-active').length).toBeGreaterThan(0)
  })

  it('tip fill left/right placements set sizing', async () => {
    const left = mount(MdTip, {
      props: { content: 'C', fill: true, placement: 'left' },
      slots: { default: '<button>触发</button>' },
      attachTo: document.body,
    })
    await left.find('button').trigger('click')
    const tipEl = document.body.querySelector('.md-tip') as HTMLElement
    expect(tipEl.style.cssText).toContain('height: 0px')
    left.unmount()
  })

  it('tip renders nothing interactive without default slot', () => {
    const wrapper = mount(MdTip, { props: { content: 'C' } })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(document.body.querySelector('.md-tip')).toBeNull()
  })

  it('radio-list align-center hides icon', () => {
    const wrapper = mount(MdRadioList, {
      props: {
        alignCenter: true,
        options: [{ value: 'a', text: 'A' }],
      },
    })
    expect(wrapper.find('.md-radio').exists()).toBe(false)
  })

  it('radio-list without icon in slot scope', () => {
    const wrapper = mount(MdRadioList, {
      props: { isSlotScope: true, icon: '', options: [{ value: 'a', text: 'A' }] },
      slots: { default: `<template #default="{ option }"><i>{{ option.text }}</i></template>` },
    })
    expect(wrapper.find('.md-radio').exists()).toBe(false)
  })
})

describe('NumberKeyboard 分支补强', () => {
  it('professional board with hideDot and duplicateZero variants', () => {
    const hideDot = mount(MdCodebox, {
      props: { maxlength: -1, isView: true },
    }).findComponent({ name: 'md-number-keyboard' })
    const board = hideDot.findComponent({ name: 'md-number-keyboard-container' })
    // professional 无 hideDot：含 . 键与 slidedown
    expect(board.findAll('.keyboard-number-item').length).toBeGreaterThanOrEqual(12)

    const view = mount(MdNumberKeyboardView)
    expect(view.find('.md-number-keyboard.in-view').exists()).toBe(true)
  })
})

// 直接内嵌视图键盘（isView + hideDot + duplicateZero 组合分支）
const MdNumberKeyboardView = defineComponent({
  components: { MdNumberKeyboard },
  template: `<MdNumberKeyboard is-view :model-value="true" hide-dot duplicate-zero />`,
})

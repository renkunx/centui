/**
 * MdActionSheet 行为清单（自 v2 components/action-sheet spec/源码提取，v-model → modelValue）：
 * 1. modelValue 控制显隐（内外状态同步）
 * 2. options 渲染（text/label），invalidIndex 标记禁用并阻断选择
 * 3. 选择 → selected + 关闭（update:modelValue false）；取消 → cancel + 关闭
 * 4. defaultIndex 高亮；cancelText 默认取 locale 取消
 * 5. create() 命令式：挂载 body、onSelected/onCancel 回调、关闭后清理
 */
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { ActionSheet, MdActionSheet } from '../../src'

describe('MdActionSheet', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('syncs visibility with modelValue', async () => {
    const wrapper = mount(MdActionSheet, {
      props: { modelValue: true, title: 'T', options: [{ text: 'A' }] },
    })
    await nextTick()
    expect(wrapper.find('.md-popup').attributes('style')).not.toContain('display: none')
    expect(wrapper.find('.md-action-sheet-header').text()).toBe('T')

    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.md-popup').attributes('style')).toContain('display: none')
  })

  it('renders options with text or label and marks invalid ones', () => {
    const wrapper = mount(MdActionSheet, {
      props: {
        modelValue: true,
        options: [{ text: 'A' }, { label: 'B' }, { text: 'C' }],
        invalidIndex: 2,
      },
    })
    const items = wrapper.findAll('.md-action-sheet-item')
    expect(items[0].find('.md-action-sheet-item-section').text()).toBe('A')
    expect(items[1].find('.md-action-sheet-item-section').text()).toBe('B')
    expect(items[2].classes()).toContain('disabled')
  })

  it('selects option, emits selected and closes', async () => {
    const wrapper = mount(MdActionSheet, {
      props: { modelValue: true, options: [{ text: 'A' }, { text: 'B' }] },
    })
    await wrapper.findAll('.md-action-sheet-item')[1].trigger('click')

    expect(wrapper.emitted('selected')).toEqual([[{ text: 'B' }]])
    // v2 契约：select→hideSheet、popup input 回流、popup hide 三处各派发一次
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('blocks selection on invalid index and array form', async () => {
    const single = mount(MdActionSheet, {
      props: { modelValue: true, options: [{ text: 'A' }], invalidIndex: 0 },
    })
    await single.findAll('.md-action-sheet-item')[0].trigger('click')
    expect(single.emitted('selected')).toBeUndefined()

    const arr = mount(MdActionSheet, {
      props: { modelValue: true, options: [{ text: 'A' }], invalidIndex: [0] },
    })
    await arr.findAll('.md-action-sheet-item')[0].trigger('click')
    expect(arr.emitted('selected')).toBeUndefined()
  })

  it('emits cancel and closes on cancel li', async () => {
    const wrapper = mount(MdActionSheet, {
      props: { modelValue: true, options: [{ text: 'A' }] },
    })
    expect(wrapper.find('.md-action-sheet-cancel').text()).toBe('取消')

    await wrapper.find('.md-action-sheet-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('highlights defaultIndex', () => {
    const wrapper = mount(MdActionSheet, {
      props: { modelValue: true, options: [{ text: 'A' }, { text: 'B' }], defaultIndex: 1 },
    })
    expect(wrapper.findAll('.md-action-sheet-item')[1].classes()).toContain('active')
  })

  it('creates imperatively with callbacks and cleans up', async () => {
    const onSelected = vi.fn()
    const onHide = vi.fn()
    ActionSheet.create({
      title: '命令式',
      options: [{ text: 'A' }, { text: 'B' }],
      onSelected,
      onHide,
    })

    await flushPromises()
    expect(document.body.querySelector('.md-action-sheet')).not.toBeNull()

    ;(document.body.querySelectorAll('.md-action-sheet-item')[0] as HTMLElement).click()
    await flushPromises()
    expect(onSelected).toHaveBeenCalledTimes(1)
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('.md-action-sheet')).toBeNull()
  })
})

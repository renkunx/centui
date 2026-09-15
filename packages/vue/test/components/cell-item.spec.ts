/**
 * MdCellItem 行为清单（自 v2 components/cell-item spec/源码提取）：
 * 1. title/brief 分别渲染为 .md-cell-item-title / .md-cell-item-brief
 * 2. addon 渲染于右侧；arrow 渲染箭头图标；right 插槽覆盖 addon
 * 3. left/default/children 插槽渲染；无 title/brief/default 时不渲染内容列
 * 4. disabled 时点击不派发事件；noBorder 修饰类；有 brief 时 multilines
 * 5. 点击派发 click
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { MdCellItem } from '../../src'

describe('MdCellItem', () => {
  it('renders title, brief and multilines body', () => {
    const wrapper = mount(MdCellItem, { props: { title: '标题', brief: '描述' } })
    expect(wrapper.find('.md-cell-item-title').text()).toBe('标题')
    expect(wrapper.find('.md-cell-item-brief').text()).toBe('描述')
    expect(wrapper.find('.md-cell-item-body').classes()).toContain('multilines')
  })

  it('renders addon or right slot with optional arrow', () => {
    const addon = mount(MdCellItem, { props: { title: 'T', addon: '附加' } })
    expect(addon.find('.md-cell-item-right').text()).toContain('附加')

    const arrow = mount(MdCellItem, { props: { title: 'T', arrow: true } })
    expect(arrow.find('.md-cell-item-right .md-icon-arrow').exists()).toBe(true)

    const slotted = mount(MdCellItem, { props: { title: 'T' }, slots: { right: '自定义' } })
    expect(slotted.find('.md-cell-item-right').text()).toBe('自定义')
  })

  it('renders left/default/children slots and hides content column without them', () => {
    const wrapper = mount(MdCellItem, {
      slots: {
        left: '左',
        default: '中',
        children: '下',
      },
    })
    expect(wrapper.find('.md-cell-item-left').text()).toBe('左')
    expect(wrapper.find('.md-cell-item-content').text()).toBe('中')
    expect(wrapper.find('.md-cell-item-children').text()).toBe('下')

    const empty = mount(MdCellItem, { slots: { right: 'R' } })
    expect(empty.find('.md-cell-item-content').exists()).toBe(false)
  })

  it('applies no-border class', () => {
    const wrapper = mount(MdCellItem, { props: { noBorder: true } })
    expect(wrapper.classes()).toContain('no-border')
  })

  it('emits click only when enabled', async () => {
    const onClick = vi.fn()
    const wrapper = mount(MdCellItem, { attrs: { onClick } })
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)

    const disabled = mount(MdCellItem, { props: { disabled: true }, attrs: { onClick } })
    await disabled.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(disabled.classes()).toContain('is-disabled')
  })
})

/**
 * CuField 行为清单（自 v2 components/field spec/源码提取）：
 * 1. title/brief 渲染；header/action/footer 插槽；无内容时不渲染对应区块
 * 2. plain/is-disabled 修饰类
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CuField } from '../../src'

describe('CuField', () => {
  it('renders title, brief and slots', () => {
    const wrapper = mount(CuField, {
      props: { title: '标题', brief: '描述' },
      slots: {
        default: '<div class="content">内容</div>',
        action: '<a class="action">操作</a>',
        header: '<span class="header">头部</span>',
        footer: '<span class="footer">尾部</span>',
      },
    })
    expect(wrapper.find('.cu-field-title').text()).toBe('标题')
    expect(wrapper.find('.cu-field-brief').text()).toBe('描述')
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('.action').text()).toBe('操作')
    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.footer').exists()).toBe(true)
  })

  it('omits header/footer when empty', () => {
    const wrapper = mount(CuField, { slots: { default: '<p>x</p>' } })
    expect(wrapper.find('.cu-field-header').exists()).toBe(false)
    expect(wrapper.find('.cu-field-footer').exists()).toBe(false)
    expect(wrapper.find('.cu-field-content').exists()).toBe(true)
  })

  it('applies plain and disabled modifiers', () => {
    const wrapper = mount(CuField, { props: { plain: true, disabled: true } })
    expect(wrapper.classes()).toContain('is-plain')
    expect(wrapper.classes()).toContain('is-disabled')
  })
})

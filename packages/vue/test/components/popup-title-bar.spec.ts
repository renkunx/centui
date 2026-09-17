/**
 * MdPopupTitleBar 行为清单（自 v2 components/popup/title-bar spec/源码提取）：
 * 1. okText/cancelText 渲染并派发 confirm/cancel；插槽 cancel/confirm/title 覆盖
 * 2. describe 存在时 large 类；titleAlign 修饰类
 * 3. onlyClose → 渲染关闭图标并派发 cancel
 * 4. largeRadius 同步到父级 Popup 的 large-radius 修饰类（v2 契约）
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { MdPopup, MdPopupTitleBar } from '../../src'

describe('MdPopupTitleBar', () => {
  it('renders ok/cancel texts and emits confirm/cancel', async () => {
    const wrapper = mount(MdPopupTitleBar, {
      props: { title: '标题', okText: '确定', cancelText: '取消' },
    })
    expect(wrapper.find('.md-popup-cancel').text()).toBe('取消')
    expect(wrapper.find('.md-popup-confirm').text()).toBe('确定')
    expect(wrapper.find('.title').text()).toBe('标题')

    await wrapper.find('.md-popup-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    await wrapper.find('.md-popup-confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('renders cancel/confirm/title slots as fallback', () => {
    const wrapper = mount(MdPopupTitleBar, {
      slots: {
        cancel: '取消插槽',
        confirm: '确定插槽',
        title: '<b>标题插槽</b>',
      },
    })
    expect(wrapper.find('.md-popup-cancel').text()).toBe('取消插槽')
    expect(wrapper.find('.md-popup-confirm').text()).toBe('确定插槽')
    expect(wrapper.find('.title-bar-title').html()).toContain('<b>标题插槽</b>')
  })

  it('applies large class for describe and title-align modifier', () => {
    const wrapper = mount(MdPopupTitleBar, {
      props: { title: 'T', describe: 'D', titleAlign: 'left' },
    })
    expect(wrapper.classes()).toContain('large')
    expect(wrapper.classes()).toContain('title-align-left')
  })

  it('renders close icon and emits cancel when onlyClose', async () => {
    const wrapper = mount(MdPopupTitleBar, { props: { title: 'T', onlyClose: true } })
    expect(wrapper.find('.md-popup-close .md-icon-close').exists()).toBe(true)
    expect(wrapper.find('.md-popup-confirm').exists()).toBe(false)

    await wrapper.find('.md-popup-close').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('syncs largeRadius to parent popup class', async () => {
    const wrapper = mount(MdPopup, {
      props: { modelValue: true },
      slots: {
        default: '<MdPopupTitleBar title="T" :large-radius="true" />',
      },
      global: { components: { MdPopupTitleBar } },
    })
    await wrapper.findComponent(MdPopupTitleBar).vm.$nextTick()
    expect(wrapper.classes()).toContain('large-radius')
  })
})

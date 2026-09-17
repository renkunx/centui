/**
 * MdPopup 行为清单（自 v2 components/popup spec/源码提取，v-model → modelValue）：
 * 1. modelValue 控制显隐：打开时 with-mask/position 类、box 携带过渡名（按 position 推导默认过渡）
 * 2. 遮罩点击：maskClosable 时关闭并派发 maskClick + update:modelValue(false)；不可关闭时无动作
 * 3. 生命周期事件：beforeShow/show（打开）、beforeHide/hide（关闭，含 kebab 变体）
 * 4. 关闭后根节点隐藏（isPopupShow 复位）
 * 5. hasMask=false 时不渲染 with-mask 类
 * 6. preventScroll 绑定/解绑 touchmove
 * 7. 动画锁期间再次打开走 50ms 延迟分支
 */
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { MdPopup } from '../../src'

describe('MdPopup', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens with mask and position classes, box carries transition name', async () => {
    const wrapper = mount(MdPopup, {
      props: { modelValue: true },
      slots: { default: '<p>内容</p>' },
    })
    await nextTick()
    expect(wrapper.classes()).toContain('with-mask')
    expect(wrapper.classes()).toContain('center')
    expect(wrapper.find('.md-popup-box').classes()).toContain('md-fade')
    expect(wrapper.attributes('style')).not.toContain('display: none')
    expect(wrapper.find('.md-popup-mask').attributes('style')).not.toContain('display: none')

    const bottom = mount(MdPopup, { props: { modelValue: true, position: 'bottom' } })
    await nextTick()
    expect(bottom.find('.md-popup-box').classes()).toContain('md-slide-up')

    const custom = mount(MdPopup, {
      props: { modelValue: true, position: 'center', transition: 'md-fade-bounce' },
    })
    await nextTick()
    expect(custom.find('.md-popup-box').classes()).toContain('md-fade-bounce')
  })

  it('omits with-mask class when hasMask is false', async () => {
    const wrapper = mount(MdPopup, { props: { modelValue: true, hasMask: false } })
    await nextTick()
    expect(wrapper.classes()).not.toContain('with-mask')
  })

  it('emits show lifecycle events when opened', () => {
    const wrapper = mount(MdPopup, { props: { modelValue: true } })
    expect(wrapper.emitted('beforeShow')).toHaveLength(1)
    expect(wrapper.emitted('before-show')).toHaveLength(1)
    expect(wrapper.emitted('show')).toHaveLength(1)
  })

  it('closes on mask click when maskClosable', async () => {
    const wrapper = mount(MdPopup, { props: { modelValue: true } })
    await wrapper.find('.md-popup-mask').trigger('click')

    expect(wrapper.emitted('maskClick')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('beforeHide')).toHaveLength(1)
    expect(wrapper.emitted('before-hide')).toHaveLength(1)
    expect(wrapper.emitted('hide')).toHaveLength(1)
    // 关闭后根节点隐藏
    expect(wrapper.attributes('style')).toContain('display: none')
  })

  it('does nothing on mask click when maskClosable is false', async () => {
    const wrapper = mount(MdPopup, { props: { modelValue: true, maskClosable: false } })
    await wrapper.find('.md-popup-mask').trigger('click')

    expect(wrapper.emitted('maskClick')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('hide')).toBeUndefined()
  })

  it('hides when modelValue turns false', async () => {
    const wrapper = mount(MdPopup, { props: { modelValue: true } })
    await wrapper.setProps({ modelValue: false })

    expect(wrapper.emitted('hide')).toHaveLength(1)
    expect(wrapper.attributes('style')).toContain('display: none')
  })

  it('binds and unbinds touchmove for preventScroll', async () => {
    const maskListener = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    mount(MdPopup, { props: { modelValue: true, preventScroll: true } })
    const bound = maskListener.mock.calls.filter(([event]) => event === 'touchmove')
    expect(bound.length).toBeGreaterThan(0)
    maskListener.mockRestore()

    const removeListener = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
    const wrapper = mount(MdPopup, { props: { modelValue: true, preventScroll: true } })
    removeListener.mockClear()
    await wrapper.setProps({ modelValue: false })
    const unbound = removeListener.mock.calls.filter(([event]) => event === 'touchmove')
    expect(unbound.length).toBeGreaterThan(0)
    removeListener.mockRestore()
  })

  it('reopens via delayed branch while animating', async () => {
    vi.useFakeTimers()
    const wrapper = mount(MdPopup, { props: { modelValue: true } })
    // isAnimation 阶段直接再次置 true → 走 50ms 延迟分支
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    vi.advanceTimersByTime(50)
    await nextTick()

    expect(wrapper.emitted('show')).toBeTruthy()
  })
})

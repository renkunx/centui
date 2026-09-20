/**
 * CuDialog 行为清单（自 v2 components/dialog spec/源码提取，v-model → modelValue）：
 * 组件：
 * 1. modelValue 控制显隐；closable 关闭图标 → update:modelValue(false)
 * 2. btns：handler 被调用；无 handler 时关闭；disabled/loading 阻断；warning 修饰类；loading 渲染滚动指示器；icon 渲染
 * 3. layout column → is-column；默认插槽覆盖 content
 * 工厂（命令式）：
 * 4. Dialog.confirm：默认 取消/确定 按钮与 locale，onConfirm/onCancel 回调后自动关闭
 * 5. Dialog.alert：单按钮；succeed/failed 注入图标；closeAll 关闭全部
 * 6. 关闭后容器从 body 移除并触发 onHide
 */
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Dialog, CuDialog } from '../../src'

describe('CuDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('controls visibility with modelValue', async () => {
    const wrapper = mount(CuDialog, {
      props: { modelValue: true, title: 'T', content: 'C' },
    })
    await nextTick()
    expect(wrapper.find('.cu-popup').attributes('style')).not.toContain('display: none')
    expect(wrapper.find('.cu-dialog-title').text()).toBe('T')

    await wrapper.setProps({ modelValue: false })
    // v2 链路：popup 隐藏时回派 input，dialog 原样透传
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })

  it('closes via close icon when closable', async () => {
    const wrapper = mount(CuDialog, { props: { modelValue: true, closable: true } })
    await wrapper.find('.cu-dialog-close').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('handles button clicks with handler/disabled/loading/warning', async () => {
    const handler = vi.fn()
    const wrapper = mount(CuDialog, {
      props: {
        modelValue: true,
        btns: [
          { text: 'A', handler },
          { text: 'B' },
          { text: 'C', disabled: true },
          { text: 'D', loading: true },
          { text: 'E', warning: true },
          { text: 'F', icon: 'rmb' },
        ],
      },
    })
    const btns = wrapper.findAll('.cu-dialog-btn')

    await btns[0].trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await btns[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])

    await btns[2].trigger('click')
    await btns[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)

    expect(btns[3].find('.cu-dialog-btn-loading').exists()).toBe(true)
    expect(btns[4].classes()).toContain('warning')
    expect(btns[5].find('.cu-dialog-btn-icon').exists()).toBe(true)
  })

  it('supports column layout and default slot over content', () => {
    const column = mount(CuDialog, {
      props: { modelValue: true, layout: 'column', btns: [{ text: 'A' }, { text: 'B' }] },
    })
    expect(column.find('.cu-dialog-actions').classes()).toContain('is-column')

    const slotted = mount(CuDialog, {
      props: { modelValue: true, content: '默认' },
      slots: { default: '<p class="custom">插槽</p>' },
    })
    expect(slotted.find('.custom').exists()).toBe(true)
    expect(slotted.find('.cu-dialog-text').exists()).toBe(false)
  })

  it('confirm factory creates dialog with locale defaults and auto closes', async () => {
    const onConfirm = vi.fn()
    const onHide = vi.fn()
    const vm = Dialog.confirm({ title: '确认', content: '内容', onConfirm, onHide })

    await flushPromises()
    const dialog = document.body.querySelector('.cu-dialog')
    expect(dialog).not.toBeNull()
    const btns = document.body.querySelectorAll('.cu-dialog-btn')
    expect(btns[0].textContent?.trim()).toBe('取消')
    expect(btns[1].textContent?.trim()).toBe('确定')

    ;(btns[1] as HTMLElement).click()
    await flushPromises()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('.cu-dialog')).toBeNull()
    expect(vm).toBeDefined()
  })

  it('confirm factory keeps dialog open when onCancel returns false', async () => {
    Dialog.confirm({ title: 'T', onCancel: () => false })
    await flushPromises()
    ;(document.body.querySelectorAll('.cu-dialog-btn')[0] as HTMLElement).click()
    await flushPromises()
    expect(document.body.querySelector('.cu-dialog')).not.toBeNull()
    Dialog.closeAll()
    await flushPromises()
    expect(document.body.querySelector('.cu-dialog')).toBeNull()
  })

  it('alert factory renders single button; succeed/failed inject icons', async () => {
    const onConfirm = vi.fn()
    Dialog.alert({ title: '提示', content: '内容', onConfirm })
    await flushPromises()
    expect(document.body.querySelectorAll('.cu-dialog-btn')).toHaveLength(1)

    Dialog.succeed({ title: '成功' })
    await flushPromises()
    expect(document.body.querySelector('.cu-icon-success-color')).not.toBeNull()
    Dialog.closeAll()
    await flushPromises()

    Dialog.failed({ title: '失败' })
    await flushPromises()
    expect(document.body.querySelector('.cu-icon-warn-color')).not.toBeNull()
    Dialog.closeAll()
    await flushPromises()
  })
})

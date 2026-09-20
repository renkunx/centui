/**
 * CuTip 行为清单（自 v2 components/tip spec/源码提取）：
 * 1. 只渲染插槽第一个节点，点击触发 show；原节点上的 click 处理器保留
 * 2. show：气泡内容懒创建并追加到第一个可滚动祖先（jsdom 下为 body），定位为绝对定位
 * 3. 气泡内容：icon/content 渲染、placement 修饰类、closable 关闭图标 → hide
 * 4. hide：移除气泡元素并派发 hide（携带 name）；show 派发 show（携带 name）
 * 5. fill 模式按参考元素宽/高撑满气泡
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { CuTip, CuTipContent } from '../../src'

const Host = defineComponent({
  components: { CuTip },
  data: () => ({ clicked: false }),
  template: `<CuTip content="提示内容" placement="top">
    <button id="trigger" @click="clicked = true">触发</button>
  </CuTip>`,
})

describe('CuTip', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders only the first slot node and keeps its own handlers', async () => {
    const wrapper = mount(Host, { attachTo: document.body })
    expect(wrapper.find('#trigger').exists()).toBe(true)
    expect(wrapper.findAll('*')).toHaveLength(1)

    await wrapper.find('#trigger').trigger('click')
    expect((wrapper.vm as { clicked: boolean }).clicked).toBe(true)
  })

  it('appends tip content to scroll wrapper on click and positions it', async () => {
    const wrapper = mount(Host, { attachTo: document.body })
    await wrapper.find('#trigger').trigger('click')
    await nextTick()

    const tip = document.body.querySelector('.cu-tip')
    expect(tip).not.toBeNull()
    expect(tip?.querySelector('.content-text')?.textContent).toBe('提示内容')
    expect((tip as HTMLElement).style.cssText).toContain('position: absolute')
  })

  it('emits show/hide with name', async () => {
    const onShow = vi.fn()
    const onHide = vi.fn()
    const wrapper = mount(CuTip, {
      props: { content: 'C', name: 'tip-x', onShow, onHide },
      slots: { default: '<button>触发</button>' },
      attachTo: document.body,
    })
    await wrapper.find('button').trigger('click')
    expect(onShow).toHaveBeenCalledWith('tip-x')

    await wrapper.find('button').trigger('click')
    document.body
      .querySelector('.cu-icon-close')
      ?.dispatchEvent(new Event('click', { bubbles: true }))
    await nextTick()
    expect(onHide).toHaveBeenCalledWith('tip-x')
  })

  it('hides and removes the tip element', async () => {
    const wrapper = mount(CuTip, {
      props: { content: 'C' },
      slots: { default: '<button>触发</button>' },
      attachTo: document.body,
    })
    await wrapper.find('button').trigger('click')
    expect(document.body.querySelector('.cu-tip')).not.toBeNull()

    document.body
      .querySelector('.cu-icon-close')
      ?.dispatchEvent(new Event('click', { bubbles: true }))
    expect(document.body.querySelector('.cu-tip')).toBeNull()
  })

  it('renders tip content variants directly', () => {
    const wrapper = mount(CuTipContent, {
      props: { content: '文本', placement: 'bottom', icon: 'warn', name: 'tip-n' },
    })
    expect(wrapper.classes()).toContain('is-bottom')
    expect(wrapper.classes()).toContain('has-close')
    expect(wrapper.classes()).toContain('tip-n')
    expect(wrapper.find('.content-icon.cu-icon-warn').exists()).toBe(true)
    expect(wrapper.find('.content-text').text()).toBe('文本')

    const unclosable = mount(CuTipContent, { props: { content: 'C', closable: false } })
    expect(unclosable.classes()).not.toContain('has-close')
    expect(unclosable.find('.cu-icon-close').exists()).toBe(false)
  })

  it('applies fill sizing by reference element', async () => {
    const wrapper = mount(CuTip, {
      props: { content: 'C', fill: true, placement: 'top' },
      slots: { default: '<button>触发</button>' },
      attachTo: document.body,
    })
    await wrapper.find('button').trigger('click')
    const tip = document.body.querySelector('.cu-tip') as HTMLElement
    // jsdom 中 offsetWidth/offsetHeight 为 0，宽度仍会被写入行内样式
    expect(tip.style.cssText).toContain('width: 0px')
  })
})

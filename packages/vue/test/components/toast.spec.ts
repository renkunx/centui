/**
 * MdToast 行为清单（自 v2 components/toast spec/源码提取）：
 * 组件：
 * 1. 默认隐藏；show/hide 控制 visible；duration 到时自动隐藏
 * 2. icon/content 渲染（iconSvg 控制字体/图标模式）；默认插槽覆盖内容分支；square 修饰类
 * 3. show/hide 事件透传自 Popup
 * 工厂（命令式）：
 * 4. Toast() 创建单例并展示；Toast.hide 隐藏
 * 5. info/succeed/failed/loading 预设（icon 与默认 duration/hasMask）
 * 6. 重复调用复用同一容器（单例）
 */
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { MdToast, Toast } from '../../src'

describe('MdToast', () => {
  afterEach(() => {
    vi.useRealTimers()
    Toast.hide()
    document.body.innerHTML = ''
  })

  it('shows and hides with duration', async () => {
    vi.useFakeTimers()
    const wrapper = mount(MdToast, { props: { content: '提示', duration: 1000 } })
    expect(wrapper.find('.md-popup').attributes('style')).toContain('display: none')

    wrapper.vm.show()
    await nextTick()
    expect(wrapper.emitted('show')).toHaveLength(1)
    expect(wrapper.find('.md-popup').attributes('style')).not.toContain('display: none')

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })

  it('renders icon and content, slot overrides, square modifier', () => {
    const iconed = mount(MdToast, { props: { icon: 'success', content: '成功' } })
    expect(iconed.find('.md-icon-success').exists()).toBe(true)
    expect(iconed.find('.md-toast-text').text()).toBe('成功')

    const svg = mount(MdToast, { props: { icon: 'spinner', iconSvg: true, content: '加载' } })
    expect(svg.find('svg.md-icon-spinner').exists()).toBe(true)

    const slotted = mount(MdToast, { slots: { default: '<span>自定义</span>' } })
    expect(slotted.find('.md-toast-content span').text()).toBe('自定义')
    expect(slotted.find('.md-toast-text').exists()).toBe(false)

    const square = mount(MdToast, { props: { square: true } })
    expect(square.find('.md-toast-content').classes()).toContain('square')
  })

  it('creates singleton via factory and hides', async () => {
    const vm = Toast({ content: '工厂提示', duration: 0 })
    await nextTick()
    expect(document.body.querySelector('.md-toast')).not.toBeNull()
    expect(document.body.querySelector('.md-toast-text')?.textContent).toBe('工厂提示')
    expect(vm.visible).toBe(true)

    Toast.hide()
    await nextTick()
    expect(vm.visible).toBe(false)
  })

  it('reuses the same singleton container', () => {
    Toast.info('第一条')
    const first = document.body.querySelector('.md-toast')
    Toast.info('第二条')
    const second = document.body.querySelector('.md-toast')
    expect(first).toBe(second)
    expect(document.querySelectorAll('.md-toast')).toHaveLength(1)
    expect(document.body.querySelector('.md-toast-text')?.textContent).toBe('第二条')
  })

  it('exposes preset variants', async () => {
    Toast.succeed('成功')
    expect(document.body.querySelector('.md-icon-success')).not.toBeNull()

    Toast.failed('失败')
    expect(document.body.querySelector('.md-icon-fail')).not.toBeNull()

    Toast.loading('加载中')
    expect(document.body.querySelector('svg.md-icon-spinner')).not.toBeNull()
    await nextTick()
  })

  it('auto hides preset after default duration', async () => {
    vi.useFakeTimers()
    const vm = Toast.info('自动关闭')
    vi.advanceTimersByTime(3000)
    expect(vm.visible).toBe(false)
  })
})

/**
 * CuNoticeBar 行为清单（自 v2 components/notice-bar spec/源码提取）：
 * 1. 默认渲染内容与两侧空栏；type: activity/warning 修饰类；round 圆角类
 * 2. mode=closable → 右侧 close 图标，点击隐藏并派发 close；mode=link → arrow 图标，点击不隐藏但派发 close
 * 3. closable（遗留 prop）等价于 mode=closable
 * 4. time 定时自动隐藏
 * 5. icon 渲染左侧图标；left/right 插槽自定义且优先
 * 6. multiRows 多行内容类
 * 7. scrollable 且内容溢出时附加滚动动画类（宽度按 getBoundingClientRect 计算）
 */
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CuNoticeBar } from '../../src'

describe('CuNoticeBar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders content with type and round classes', () => {
    const wrapper = mount(CuNoticeBar, {
      props: { type: 'warning', round: true },
      slots: { default: '提示文案' },
    })
    expect(wrapper.classes()).toContain('warning')
    expect(wrapper.classes()).toContain('cu-notice-bar-round')
    expect(wrapper.find('.cu-notice-bar-content').text()).toBe('提示文案')
    expect(wrapper.find('.cu-notice-bar-left.cu-notice-bar-empty').exists()).toBe(true)
  })

  it('hides and emits close when closable icon clicked', async () => {
    const wrapper = mount(CuNoticeBar, {
      props: { mode: 'closable' },
      slots: { default: '文案' },
    })
    expect(wrapper.find('.cu-notice-icon-right.cu-icon-close').exists()).toBe(true)

    await wrapper.find('.cu-notice-icon-right').trigger('click')
    expect(wrapper.find('.cu-notice-bar').exists()).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('keeps visible but emits close in link mode', async () => {
    const wrapper = mount(CuNoticeBar, {
      props: { mode: 'link' },
      slots: { default: '文案' },
    })
    expect(wrapper.find('.cu-notice-icon-right.cu-icon-arrow').exists()).toBe(true)

    await wrapper.find('.cu-notice-icon-right').trigger('click')
    expect(wrapper.find('.cu-notice-bar').exists()).toBe(true)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('supports legacy closable prop', async () => {
    const wrapper = mount(CuNoticeBar, {
      props: { closable: true },
      slots: { default: '文案' },
    })
    await wrapper.find('.cu-notice-icon-right').trigger('click')
    expect(wrapper.find('.cu-notice-bar').exists()).toBe(false)
  })

  it('auto hides after time', async () => {
    vi.useFakeTimers()
    const wrapper = mount(CuNoticeBar, {
      props: { time: 1000 },
      slots: { default: '文案' },
    })
    expect(wrapper.find('.cu-notice-bar').exists()).toBe(true)

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.cu-notice-bar').exists()).toBe(false)
  })

  it('renders left icon and custom slots', () => {
    const iconed = mount(CuNoticeBar, {
      props: { icon: 'warn', iconSvg: true },
      slots: { default: '文案' },
    })
    expect(iconed.find('.cu-notice-bar-left .cu-icon-warn').exists()).toBe(true)
    expect(iconed.find('.cu-notice-bar-left').classes()).not.toContain('cu-notice-bar-empty')

    const custom = mount(CuNoticeBar, {
      slots: { default: '文案', left: '左', right: '右' },
    })
    expect(custom.find('.cu-notice-bar-left').text()).toBe('左')
    expect(custom.find('.cu-notice-bar-right').text()).toBe('右')
    expect(custom.find('.cu-notice-icon-right').exists()).toBe(false)
  })

  it('applies multi-rows class', () => {
    const wrapper = mount(CuNoticeBar, {
      props: { multiRows: true },
      slots: { default: '文案' },
    })
    expect(wrapper.find('.cu-notice-bar-multi-content').exists()).toBe(true)
  })

  it('marks overflow for scrollable content', async () => {
    const wrapper = mount(CuNoticeBar, {
      props: { scrollable: true },
      slots: { default: '长文案' },
    })

    const inner = wrapper.find('.cu-notice-bar-content > div').element
    const wrapEl = wrapper.find('.cu-notice-bar-content').element
    vi.spyOn(inner, 'scrollWidth', 'get').mockReturnValue(200)
    vi.spyOn(wrapEl, 'getBoundingClientRect').mockReturnValue({ width: 100 } as DOMRect)

    // 触发 onUpdated 重新计算溢出
    await wrapper.setProps({ scrollable: false })
    await wrapper.setProps({ scrollable: true })
    expect(wrapper.find('.cu-notice-bar-content-animate').exists()).toBe(true)
  })
})
